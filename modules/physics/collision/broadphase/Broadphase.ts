import { vec2 } from 'math/vec2'
import { AABB } from 'math/AABB'
import { BodyType } from '../../constants'
import { RigidBody } from '../../dynamics/RigidBody'
import { testSleepState } from '../../dynamics/Sleep'
import { Int16TupleMap } from '../../helpers/Int16TupleMap'
import { Ray } from '../raycaster/Ray'

export abstract class Broadphase {
    readonly ignoredPairs: Int16TupleMap<boolean> = new Int16TupleMap
    public abstract insert(body: RigidBody): void
    public remove(body: RigidBody): void {
        this.ignoredPairs.clear(body.identifier)
    }
    public abstract update(): void
    public abstract queryCollisionPairs(consumer: (bodyA: RigidBody, bodyB: RigidBody) => boolean | void): void
    public abstract queryAABB(aabb: AABB, consumer: (body: RigidBody) => boolean | void): void
    public raycast(ray: Ray, consumer: (body: RigidBody) => number | void): void {
        this.queryAABB(ray.aabb, consumer as any)
    }
    
    readonly filter = (bodyA: RigidBody, bodyB: RigidBody): boolean => (
        testBodyType(bodyA, bodyB) &&
        testSleepState(bodyA, bodyB) &&
        testAABB(bodyA, bodyB) && 
        !this.ignoredPairs.get(bodyA.identifier, bodyB.identifier)
    )
}

export const testBoundingRadius = (bodyA: RigidBody, bodyB: RigidBody): boolean =>
vec2.distanceSquared(bodyA.position, bodyB.position) <= Math.pow(bodyA.boundingRadius + bodyB.boundingRadius, 2)

export const testAABB = (bodyA: RigidBody, bodyB: RigidBody): boolean =>
AABB.overlap(bodyA.aabb, bodyB.aabb)

export const testBodyType = (bodyA: RigidBody, bodyB: RigidBody): boolean => {
    if(bodyA.type === BodyType.STATIC && bodyB.type === BodyType.STATIC) return false
    if((bodyA.type === BodyType.KINEMATIC && bodyB.type === BodyType.STATIC) ||
    (bodyB.type === BodyType.KINEMATIC && bodyA.type === BodyType.STATIC)) return false
    if(bodyA.type === BodyType.KINEMATIC && bodyB.type === BodyType.KINEMATIC) return false
    return true
}