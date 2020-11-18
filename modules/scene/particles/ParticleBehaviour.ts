import { vec2 } from 'math/vec2'
import { AABB } from 'math/AABB'
import { randomInt, randomFloat, lerp, clamp, mod, Interpolation } from 'math/utilities'

import { BillboardParticle } from './BillboardParticle'

export const clampParticle = (aabb: AABB) => function(particle: BillboardParticle){
    const { position } = particle
    position[0] = clamp(position[0], aabb[0], aabb[2])
    position[1] = clamp(position[1], aabb[1], aabb[3])
}
export const wrapParticle = (aabb: AABB) => function(particle: BillboardParticle){
    const { position } = particle
    position[0] = mod(position[0] - aabb[0], aabb[2] - aabb[0]) + aabb[0]
    position[1] = mod(position[1] - aabb[1], aabb[3] - aabb[1]) + aabb[1]
}
export const checkBounds = (aabb: AABB) => function(particle: BillboardParticle){
    if(!AABB.includes(aabb, particle.position)) particle.life = 0
}
export function verletIntegration(particle: BillboardParticle, deltaTime: number){
    particle.rotation += particle.angularVelocity * deltaTime
    particle.velocity[0] += particle.acceleration[0] * deltaTime
    particle.velocity[1] += particle.acceleration[1] * deltaTime
    if(particle.friction) vec2.scale(particle.velocity, Math.min(1, Math.pow(particle.friction, deltaTime)), particle.velocity)

    particle.position[0] += particle.velocity[0] * deltaTime
    particle.position[1] += particle.velocity[1] * deltaTime
}

export function velocityRotation(particle: BillboardParticle){
    particle.rotation = Math.atan2(particle.velocity[1], particle.velocity[0])
}