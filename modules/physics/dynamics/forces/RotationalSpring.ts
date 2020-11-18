import { RigidBody } from '../RigidBody'
import { ForceGenerator } from './ForceGenerator'

export class RotationalSpring extends ForceGenerator {
    private stiffness: number = 100
    private damping: number = 1
    private restingAngle: number = 0
    constructor(private readonly bodyA: RigidBody, private readonly bodyB: RigidBody){
        super()
        this.restingAngle = this.bodyB.angle - this.bodyA.angle
    }
    apply(){
        const k = this.stiffness, d = this.damping, l = this.restingAngle
        const relativeVelocity = this.bodyB.angularVelocity - this.bodyA.angularVelocity
        const difference = this.bodyB.angle - this.bodyA.angle
        const torque = - k * (difference - l) - d * relativeVelocity

        this.bodyA.angularForce -= torque
        this.bodyB.angularForce += torque
    }
}