import { vec2, rgba, randomInt, randomFloat } from 'math'
import { EntityManager } from 'framework'
import { Transform2D } from 'scene'
import { Sprite2D, Material, BlendMode } from 'renderer'

import { rng } from '../helpers'
import { Layer } from './constants'
import { Plant } from './Plant'

export function createPlants(manager: EntityManager, path: Array<[vec2, vec2]>, biome: number, center: vec2){
    const origin = vec2(0.5, 0.86)
    const color = rgba(0x8A, 0x8A, 0x8A, 0xFF)
    const density = 1 / 400
    const multipliers = [0,0,1,1,1,1,2,2,3,4,5]

    for(let i = 0; i < path.length; i++){
        let [ start, end ] = path[i]
        const surfacelLength = Math.abs(start[0] - end[0])
        if(surfacelLength < 1e-6) continue

        const amount = Math.floor(surfacelLength * density) * multipliers[randomInt(0, multipliers.length - 1, rng)]

        for(let k = amount; k > 0; k--){
            const prefix = ['a', 'b', 'c'][biome]
            const position = vec2.lerp(start, end, randomFloat(0, 1, rng), vec2())
            vec2.add(position, center, position)
            const rotation = randomFloat(-0.16, 0.16, rng)
            const scale = vec2(randomFloat(0.8, 2.0, rng))

            const plant = manager.createEntity()
            manager.createComponent(plant, Transform2D, { position, rotation, scale })
            manager.createComponent(plant, Sprite2D, { origin, order: Layer.BACKGROUND - 8 })
            manager.createComponent(plant, Material, {
                program: 0, blend: BlendMode.NORMAL, color, texture: `terrain/root_${prefix}.png`
            })

            const stem = manager.createEntity()
            manager.createComponent(stem, Transform2D, { parent: plant })
            manager.createComponent(stem, Sprite2D, { origin, order: Layer.BACKGROUND - 10 })
            manager.createComponent(stem, Material, {
                program: 0, blend: BlendMode.NORMAL, color, texture: `terrain/stem_${prefix}_${randomInt(0, 3, rng)}.png`
            })

            manager.createComponent(plant, Plant, {
                radius: 250,
                timeScale: 2,
                element: stem
            })
        }
    }
}