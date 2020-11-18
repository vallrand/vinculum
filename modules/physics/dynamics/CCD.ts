import { vec2 } from 'math/vec2'
import { AABB } from 'math/AABB'
import { Raycaster } from '../collision/raycaster/Raycaster'
import { Broadphase } from '../collision/broadphase/Broadphase'
import { Narrowphase } from '../collision/narrowphase/Narrowphase'
import { RigidBody } from './RigidBody'
import { Shape } from '../shapes/Shape'

export class ContinuousCollisionDetection {
    private readonly speedThreshold: number = -1
    private readonly iterations = 10

    private raycast: (body: RigidBody) => void
    private body: RigidBody
    constructor(
        private readonly broadphase: Broadphase,
        private readonly narrowphase: Narrowphase,
        private readonly raycaster: Raycaster
    ){
        const filterShape = (bodyB: RigidBody, shapeB: Shape) => {
            for(let i = 0; i < this.body.shapes.length; i++){
                let shapeA = this.body.shapes[i]
                if(shapeA.collisionGroup & shapeB.collisionMask | shapeB.collisionGroup & shapeA.collisionMask) return true
            }
            return false
        }
        const filterBody = (bodyB: RigidBody) => {
            if(this.broadphase.ignoredPairs.get(this.body.identifier, bodyB.identifier)) return
            return this.raycaster.raycast(bodyB, filterShape)
        }
        this.raycast = (body: RigidBody) => {
            this.body = body
            this.broadphase.raycast(this.raycaster.ray, filterBody)
        }
    }

    private readonly nextPosition: vec2 = vec2()
    private readonly prevPosition: vec2 = vec2()
    private readonly positionDelta: vec2 = vec2()
    private readonly velocityDelta: vec2 = vec2()
    public integrateToImpact(body: RigidBody, deltaTime: number): boolean {
        if(this.speedThreshold < 0 || vec2.magnitudeSquared(body.velocity) < Math.pow(this.speedThreshold, 2))
            return false
        const { nextPosition, prevPosition, positionDelta, velocityDelta } = this
        vec2.scale(body.velocity, deltaTime, nextPosition)
        vec2.add(body.position, nextPosition, nextPosition)

        this.raycaster.reset()
        this.raycaster.ray.set(body.position, nextPosition)

        this.raycast(body)

        const hitBody = this.raycaster.body
        if(!hitBody) return false
        this.raycaster.computeHitPoint(nextPosition)

        vec2.subtract(nextPosition, body.position, positionDelta)
        const angleDelta = body.angularVelocity * deltaTime * this.raycaster.fraction

        const prevAngle = body.angle
        vec2.copy(body.position, prevPosition)
    
        let min = 0, max = 1
        for(let i = 0; max >= min && i < this.iterations; i++){
            let mid = (min + max) / 2
            vec2.scale(positionDelta, mid, velocityDelta)
            vec2.add(prevPosition, velocityDelta, body.position)
            body.angle = prevAngle + angleDelta * mid
            body.dirtyFlag = true

            const overlap = AABB.overlap(body.aabb, hitBody.aabb) &&
            this.narrowphase.detectCollision(body, hitBody, true, null)
            if(overlap) max = mid
            else min = mid
        }
        const impactTime = max
        vec2.scale(positionDelta, impactTime, velocityDelta)
        vec2.add(prevPosition, velocityDelta, body.position)
        body.angle = prevAngle + angleDelta * impactTime
        body.dirtyFlag = true
        return true
    }
}