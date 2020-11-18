import { vec2 } from 'math/vec2'
import { AABB } from 'math/AABB'
import { LCG } from 'math/random'
import { randomInt, randomFloat, lerp, clamp, mod, Interpolation } from 'math/utilities'

import { BillboardParticle } from './BillboardParticle'

const rng = LCG(Date.now())
const temp: vec2 = vec2()

export const AreaSampler = {
    static: <T>(value: T) => (): T => value,
    range: <T>(interpolate: Interpolation<T>, temp?: T) => (min: T, max: T) => (): T =>
    interpolate(min, max, randomFloat(0, 1, rng), temp),
    points: <T>(values: T[]) => (): T => values[randomInt(0, values.length - 1, rng)],
    aabb: (aabb: AABB) => function(): vec2 {
        temp[0] = randomFloat(aabb[0], aabb[2], rng)
        temp[1] = randomFloat(aabb[1], aabb[3], rng)
        return temp
    },
    circle: (position: vec2, radius: vec2, angle?: vec2) => function(): vec2 {
        const a = angle ? randomFloat(angle[0], angle[1], rng) : randomFloat(0, 2 * Math.PI, rng)
        const r = randomFloat(radius[0], radius[1], rng)
        temp[0] = position[0] + r * Math.cos(a)
        temp[1] = position[1] + r * Math.sin(a)
        return temp
    },
    closedPath: (path: vec2[]) => function(): vec2 {
        const index = randomInt(0, path.length - 1, rng)
        const fraction = randomFloat(0, 1, rng)
        const prev = path[(index || path.length) - 1]
        const next = path[index]
        return vec2.lerp(prev, next, fraction, temp)
    },
    compound: (samplers: Array<() => vec2>) => function(): vec2 {
        return samplers[randomInt(0, samplers.length - 1, rng)].call(this)
    },
    targeted: (sampler: () => vec2, radius: vec2) => function(this: BillboardParticle): vec2 {
        vec2.copy(sampler.call(this), temp)
        vec2.subtract(temp, this.position, temp)
        const a = vec2.rotation(temp)
        const r = randomFloat(radius[0], radius[1], rng)
        temp[0] = r * Math.cos(a)
        temp[1] = r * Math.sin(a)
        return temp
    }
}