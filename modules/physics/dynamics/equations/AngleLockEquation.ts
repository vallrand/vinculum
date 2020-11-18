import { Equation } from './Equation'

export class AngleLockEquation extends Equation {
    private angle: number = 0
    constructor(bodyA, bodyB, options?: { ratio?: number, angle?: number }){
        super(bodyA, bodyB)
        this.ratio = 0
        Object.assign(this, options)
    }
    computeGq(): number {
        return this.ratio * this.bodyA.angle - this.bodyB.angle + this.angle
    }
    get ratio(): number {
        return this.G[2]
    }
    set ratio(ratio: number){
        this.G[2] = ratio
        this.G[5] = -1
    }
    set maxTorque(torque: number){
        this.maxForce =  torque
        this.minForce = -torque
    }
}