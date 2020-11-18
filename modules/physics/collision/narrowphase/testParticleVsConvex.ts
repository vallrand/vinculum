import { vec2 } from 'math/vec2'
import { RigidBody } from '../../dynamics/RigidBody'
import { ICollisionDetector, Narrowphase } from './Narrowphase'
import { Convex } from '../../shapes/Convex'
import { Particle } from '../../shapes/Particle'

const temp0: vec2 = vec2()
const temp1: vec2 = vec2()

export const testParticleVsConvex: ICollisionDetector = function(
    this: Narrowphase,
    bodyA: RigidBody, shapeA: Particle, positionA: vec2, angleA: number,
    bodyB: RigidBody, shapeB: Convex, positionB: vec2, angleB: number,
    bailEarly: boolean
): number {
    const { contactPointA, contactPointB, normalA } = this
    const radius = 0
    const centerA = vec2.subtract(positionA, positionB, temp0)
    vec2.rotate(centerA, -angleB, centerA)

    let normalIndex: number, minDistance = -Infinity
    for(let i = shapeB.vertices.length - 1; i >= 0; i--){
        let difference = vec2.subtract(centerA, shapeB.vertices[i], temp1)
        let distance = vec2.dot(shapeB.normals[i], difference)
        if(distance > radius) return 0
        if(distance <= minDistance) continue
        minDistance = distance
        normalIndex = i
    }
    if(bailEarly) return 1
    vec2.scale(shapeB.normals[normalIndex], -1, normalA)
    vec2.rotate(normalA, angleB, normalA)

    vec2.copy(positionA, contactPointA)

    vec2.scale(normalA, minDistance, contactPointB)
    vec2.add(contactPointA, contactPointB, contactPointB)

    this.registerContactManifold(bodyA, shapeA, bodyB, shapeB)
    return 1
}