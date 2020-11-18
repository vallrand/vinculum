import { Equation } from './Equation'

export class RotationalVelocityEquation extends Equation {
    constructor(bodyA, bodyB, options?: { relativeVelocity?: number, ratio?: number }){
        super(bodyA, bodyB)
        this.relativeVelocity = 1
        this.ratio = 1
        Object.assign(this, options)
    }
    set ratio(ratio: number){
        this.G[2] = -1
        this.G[5] = ratio
    }
    computeB(a: number, b: number, deltaTime: number): number {
        const GiMf = this.computeGiMf()
        const GW = this.computeGW()
        return - GW * b - GiMf * deltaTime
    }
}