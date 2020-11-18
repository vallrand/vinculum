import { vec2 } from 'math/vec2'
import { ICollisionDetector, Narrowphase } from './Narrowphase'
import { RigidBody } from '../../dynamics/RigidBody'
import { Convex } from '../../shapes/Convex'
import { Circle } from '../../shapes/Circle'

const temp0: vec2 = vec2()
const temp1: vec2 = vec2()
const temp2: vec2 = vec2()
const temp3: vec2 = vec2()

export const testCircleVsConvex: ICollisionDetector = function(
    this: Narrowphase,
    bodyA: RigidBody, shapeA: Circle, positionA: vec2, angleA: number,
    bodyB: RigidBody, shapeB: Convex, positionB: vec2, angleB: number,
    bailEarly: boolean
): number {
    const { contactPointA, contactPointB, normalA } = this
    const radius = shapeA.radius + 0
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

    const edgeNormal = shapeB.normals[normalIndex]
    const corner0 = shapeB.vertices[normalIndex++]
    const corner1 = shapeB.vertices[normalIndex % shapeB.vertices.length]

    barycentric: {
        if(minDistance < 0) break barycentric

        const difference0 = vec2.subtract(centerA, corner0, temp1)
        const difference1 = vec2.subtract(centerA, corner1, temp2)
        const edge = vec2.subtract(corner1, corner0, temp3)
    
        const u0 = vec2.dot(difference0, edge)
        const u1 = -vec2.dot(difference1, edge)

        if(u0 > 0 && u1 > 0) break barycentric
        if(u0 <= 0 && vec2.magnitudeSquared(difference0) > radius * radius) return 0
        if(u1 <= 0 && vec2.magnitudeSquared(difference1) > radius * radius) return 0
        if(bailEarly) return 1

        vec2.rotate(u0 <= 0 ? corner0 : corner1, angleB, contactPointB)
        vec2.add(positionB, contactPointB, contactPointB)

        vec2.subtract(contactPointB, positionA, normalA)
        vec2.normalize(normalA, normalA)

        vec2.scale(normalA, shapeA.radius, contactPointA)
        vec2.add(positionA, contactPointA, contactPointA)
        this.registerContactManifold(bodyA, shapeA, bodyB, shapeB)
        return 1
    }
    if(bailEarly) return 1
    const vertex = vec2.scale(edgeNormal, -shapeA.radius, temp1)
    vec2.add(centerA, vertex, vertex)
    vec2.subtract(corner0, vertex, vertex)
    let distance = vec2.dot(edgeNormal, vertex)

    vec2.scale(edgeNormal, -1, normalA)
    vec2.rotate(normalA, angleB, normalA)

    vec2.scale(normalA, shapeA.radius, contactPointA)
    vec2.add(positionA, contactPointA, contactPointA)

    vec2.scale(normalA, -distance, contactPointB)
    vec2.add(contactPointA, contactPointB, contactPointB)
    this.registerContactManifold(bodyA, shapeA, bodyB, shapeB)
    return 1
}