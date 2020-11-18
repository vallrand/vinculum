import { AABB } from 'math/AABB'
import { insertionSort } from 'common/sorting'
import { RigidBody } from '../../dynamics/RigidBody'
import { Broadphase } from './Broadphase'

export class SweepAndPrune extends Broadphase {
    bodies: RigidBody[] = []
    axisIndex = 0
    axisSort = (a: RigidBody, b: RigidBody) =>
    a.aabb[this.axisIndex] - b.aabb[this.axisIndex]

    public insert(body: RigidBody){
        this.bodies.push(body)
    }
    public remove(body: RigidBody){
        const index = this.bodies.indexOf(body)
        if(!~index) this.bodies.splice(index, 1)
        super.remove(body)
    }
    public update(): void {
        insertionSort(this.bodies, this.axisSort)
    }
    public queryCollisionPairs(consumer: (bodyA: RigidBody, bodyB: RigidBody) => boolean): void {
        for(let length = this.bodies.length, i = 0; i < length; i++)
        for(let bodyA = this.bodies[i], j = i + 1; j < length; j++){
            let bodyB = this.bodies[j]
            if(bodyB.aabb[this.axisIndex] > bodyA.aabb[2 + this.axisIndex]) break
            if(!this.filter(bodyA, bodyB)) continue
            if(consumer(bodyA, bodyB) == false) return
        }
    }
    public queryAABB(aabb: AABB, consumer: (body: RigidBody) => boolean): void {
        for(let length = this.bodies.length, i = 0; i < length; i++){
            let body = this.bodies[i]
            if(body.aabb[this.axisIndex] > aabb[2 + this.axisIndex]) break
            if(!AABB.overlap(aabb, body.aabb)) continue
            if(consumer(body) == false) return
        }
    }
}