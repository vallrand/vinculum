import { AABB } from 'math/AABB'
import { RigidBody } from '../../dynamics/RigidBody'
import { Broadphase } from './Broadphase'

export class BruteforceBroadphase extends Broadphase {
    private readonly bodies: RigidBody[] = []
    public insert(body: RigidBody): void {
        this.bodies.push(body)
    }
    public remove(body: RigidBody): void {
        const index = this.bodies.indexOf(body)
        if(!~index) this.bodies.splice(index, 1)
        super.remove(body)
    }
    public update(): void {}
    public queryCollisionPairs(consumer: (bodyA: RigidBody, bodyB: RigidBody) => boolean): void {
        for(let i = this.bodies.length - 1; i > 0; i--)
        for(let bodyA = this.bodies[i], j = i - 1; j >= 0; j--){
            let bodyB = this.bodies[j]
            if(!this.filter(bodyA, bodyB)) continue
            if(consumer(bodyA, bodyB) == false) return
        }
    }
    public queryAABB(aabb: AABB, consumer: (body: RigidBody) => boolean): void {
        for(let i = this.bodies.length - 1; i >= 0; i--){
            let body = this.bodies[i]
            if(!AABB.overlap(aabb, body.aabb)) continue
            if(consumer(body) == false) return
        }
    }
}