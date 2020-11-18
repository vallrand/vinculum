import { Constraint } from './Constraint'
import { RigidBody } from '../RigidBody'
import { AngleLockEquation } from '../equations/AngleLockEquation'

export class GearConstraint extends Constraint {
    constructor(bodyA: RigidBody, bodyB: RigidBody){
        super(bodyA, bodyB)
        this.equations.push(new AngleLockEquation(bodyA, bodyB, {
            ratio: 1,
            angle: this.bodyB.angle - 1 * this.bodyA.angle
        }))
    }
    update(): void {}
    set angle(angle: number){ (this.equations[0] as any).angle = angle }
    set ratio(ratio: number){ (this.equations[0] as any).ratio = ratio }
    set maxTorque(torque: number){ (this.equations[0] as any).maxTorque = torque }
}