import { vec2 } from 'math/vec2'
import { RigidBody } from '../../dynamics/RigidBody'
import { Shape } from '../../shapes/Shape'

export class ContactManifold {
    bodyA: RigidBody = null
    bodyB: RigidBody = null
    shapeA: Shape = null
    shapeB: Shape = null
    contacts: number = 0
    readonly normalA: vec2[] = []
    readonly contactPointA: vec2[] = []
    readonly contactPointB: vec2[] = []
    registerContact(
        bodyA: RigidBody, shapeA: Shape, bodyB: RigidBody, shapeB: Shape,
        normalA: vec2, contactPointA: vec2, contactPointB: vec2
    ){
        if(!this.contacts){
            this.bodyA = bodyA
            this.bodyB = bodyB
            this.shapeA = shapeA
            this.shapeB = shapeB
        }
        if(this.normalA.length == this.contacts){
            this.normalA.push(vec2())
            this.contactPointA.push(vec2())
            this.contactPointB.push(vec2())
        }
        vec2.copy(normalA, this.normalA[this.contacts])
        vec2.subtract(contactPointA, bodyA.position, this.contactPointA[this.contacts])
        vec2.subtract(contactPointB, bodyB.position, this.contactPointB[this.contacts])
        this.contacts++
    }
}