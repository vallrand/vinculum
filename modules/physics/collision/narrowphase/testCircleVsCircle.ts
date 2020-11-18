import { vec2 } from 'math/vec2'
import { RigidBody } from '../../dynamics/RigidBody'
import { ICollisionDetector, Narrowphase } from './Narrowphase'
import { Circle } from '../../shapes/Circle'

export const testCircleVsCircle: ICollisionDetector = function(
    this: Narrowphase,
    bodyA: RigidBody, shapeA: Circle, positionA: vec2, angleA: number,
    bodyB: RigidBody, shapeB: Circle, positionB: vec2, angleB: number,
    bailEarly: boolean 
): number {
    const { contactPointA, contactPointB, normalA } = this
    const radiusA = shapeA.radius
    const radiusB = shapeB.radius

    vec2.subtract(positionB, positionA, normalA)
    if(vec2.magnitudeSquared(normalA) > Math.pow(radiusA + radiusB, 2))
        return 0
    if(bailEarly) return 1
    
    vec2.normalize(normalA, normalA)

    vec2.scale(normalA, radiusA, contactPointA)
    vec2.add(positionA, contactPointA, contactPointA)
    
    vec2.scale(normalA, -radiusB, contactPointB)
    vec2.add(positionB, contactPointB, contactPointB)

    this.registerContactManifold(bodyA, shapeA, bodyB, shapeB)
    return 1
}