import { vec2 } from 'math/vec2'
import { RigidBody } from '../../dynamics/RigidBody'
import { ICollisionDetector, Narrowphase } from './Narrowphase'
import { Circle } from '../../shapes/Circle'
import { Line } from '../../shapes/Line'

const temp0: vec2 = vec2()
const lineNormal: vec2 = vec2(0, -1)

export const testCircleVsLine: ICollisionDetector = function(
    this: Narrowphase,
    bodyA: RigidBody, shapeA: Circle, positionA: vec2, angleA: number,
    bodyB: RigidBody, shapeB: Line, positionB: vec2, angleB: number,
    bailEarly: boolean
): number {
    const { contactPointA, contactPointB, normalA } = this
    const centerA = vec2.subtract(positionA, positionB, temp0)
    vec2.rotate(centerA, -angleB, centerA)
    const halfLength = 0.5 * shapeB.length
    const radius = shapeA.radius + shapeB.radius

    const dotN = vec2.dot(centerA, lineNormal)
    if(Math.abs(dotN) >= radius) return 0
    const dotT = vec2.dot(centerA, vec2.AXIS_X)
    if(Math.abs(dotT) >= radius + halfLength) return 0

    if(Math.abs(dotT) < halfLength){
        if(bailEarly) return 1
        vec2.rotate(lineNormal, angleB, normalA)
        if(dotN >= 0) vec2.scale(normalA, -1, normalA)

        vec2.scale(normalA, shapeA.radius, contactPointA)
        vec2.add(positionA, contactPointA, contactPointA)

        vec2.scale(normalA, Math.abs(dotN) - shapeB.radius, contactPointB)
        vec2.add(positionA, contactPointB, contactPointB)

        this.registerContactManifold(bodyA, shapeA, bodyB, shapeB)
        return 1
    }else{
        vec2.fromValues(dotT > 0 ? halfLength : -halfLength, 0, normalA)
        vec2.subtract(normalA, centerA, normalA)
        const distanceSquared = vec2.magnitudeSquared(normalA)
        if(distanceSquared > radius * radius) return 0
        if(bailEarly) return 1

        vec2.rotate(normalA, angleB, normalA)
        vec2.normalize(normalA, normalA)

        vec2.scale(normalA, shapeA.radius, contactPointA)
        vec2.add(positionA, contactPointA, contactPointA)

        vec2.scale(normalA, Math.sqrt(distanceSquared) - shapeB.radius, contactPointB)
        vec2.add(positionA, contactPointB, contactPointB)

        this.registerContactManifold(bodyA, shapeA, bodyB, shapeB)
        return 1
    }
}