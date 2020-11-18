import { EntityManager } from 'framework'
import { vec2, lerp, rgb, rgba, randomFloat, shuffle, randomInt, RandomGenerator, lerpAngle, range, linearRemap, clamp } from 'math'
import { Transform2D, GroupComponent } from 'scene'
import { Material, VectorGraphics, BlendMode } from 'renderer'

import { rng } from '../helpers'
import { Layer } from '../terrain'
import { Glyph } from './Glyph'

const entropySampler = <T>(rng: () => number, values: T[], sequence: number) => {
    const queue = range(values.length * sequence).map(i => values[i % values.length])
    let index = queue.length - 1
    return (): T => {
        if(index === queue.length - 1) shuffle(queue, rng)
        const out = queue[index--]
        index = index || (queue.length - 1)
        return out
    }
}

function generateGlyph(options: {
    angleSteps: number
    segmentLength: number
    segmentCount: number
    duration: number
}){
    const paths: Array<vec2[]> = []
    const intervals: Array<[number, number]> = []

    const angleSampler = entropySampler(rng, [-1,0,1], 2)

    const angles = range(0, options.angleSteps).map(i => i * 2 * Math.PI / options.angleSteps)
    shuffle(angles, rng)
    const stack = angles.slice(0, randomInt(4, 6, rng))
    .map(angle => ({
        path: [vec2(0, 0)],
        start: 0,
        cursor: 0,
        angle
    }))

    while(stack.length){
        const walker = stack.pop()

        const distance = options.segmentLength * randomInt(1, 4, rng)
        const next = vec2(distance, 0)
        vec2.rotate(next, walker.angle, next)
        vec2.add(next, walker.path[walker.path.length - 1], next)
        walker.path.push(next)

        walker.cursor += distance / (options.segmentLength * options.segmentCount)
        if(walker.cursor >= 1){
            paths.push(walker.path)
            intervals.push([ walker.start * options.duration, walker.cursor * options.duration ])
            continue
        }
        walker.angle += angleSampler() * 2 * Math.PI / options.angleSteps

        const branches = randomFloat(0, 1, rng) < lerp(0.4, 0.2, walker.cursor) ? randomInt(1, 2, rng) : 0
        for(let i = branches; i > 0; i--)
            stack.push({
                path: [next],
                start: walker.cursor,
                cursor: walker.cursor,
                angle: walker.angle + angleSampler() * 2 * Math.PI / options.angleSteps,
            })
        
        stack.push(walker)
    }

    return { paths, intervals }
}

export function drawGlyph(manager: EntityManager, group: GroupComponent){
    const entity = manager.createEntity()
    manager.createComponent(entity, Transform2D, { parent: group.entity })
    manager.createComponent(entity, Material, {
        program: 0, blend: BlendMode.NORMAL,
        tint: rgb(0x00, 0x3F, 0x3F), color: rgba(0x7F, 0xAF, 0xAF, 0xFF),
        texture: 'effects/line.png'
    })
    manager.createComponent(entity, VectorGraphics, {
        order: Layer.BACKGROUND - 128,
        style: {
            width: 25
        }
    })
    manager.createComponent(entity, Glyph, generateGlyph({
        angleSteps: 8,
        segmentLength: 50,
        segmentCount: 12,
        duration: 3.4
    }))
    group.references.push(entity)
}