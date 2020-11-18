import { vec2 } from 'math/vec2'
import { RigidBody } from '../../dynamics/RigidBody'
import { ICollisionDetector, Narrowphase } from './Narrowphase'
import { Circle } from '../../shapes/Circle'
import { Particle } from '../../shapes/Particle'

export const testParticleVsCircle: ICollisionDetector = function(
    this: Narrowphase,
    bodyA: RigidBody, shapeA: Particle, positionA: vec2, angleA: number,
    bodyB: RigidBody, shapeB: Circle, positionB: vec2, angleB: number,
    bailEarly: boolean
): number {
    const { contactPointA, contactPointB, normalA } = this
    const radius = shapeB.radius + 0

    vec2.subtract(positionB, positionA, normalA)
    if(vec2.magnitudeSquared(normalA) > radius * radius) return 0
    if(bailEarly) return 1

    vec2.normalize(normalA, normalA)

    vec2.copy(positionA, contactPointA)
    
    vec2.scale(normalA, -radius, contactPointB)
    vec2.add(positionB, contactPointB, contactPointB)

    this.registerContactManifold(bodyA, shapeA, bodyB, shapeB)
    return 1
}