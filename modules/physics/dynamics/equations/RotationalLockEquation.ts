import { vec2 } from 'math/vec2'
import { Equation } from './Equation'

export class RotationalLockEquation extends Equation {
    public angle: number = 0
    constructor(bodyA, bodyB, options?: { angle: number }){
        super(bodyA, bodyB)
        this.G[2] = 1
        this.G[5] = -1
        Object.assign(this, options)
    }
    computeGq(): number {
        return vec2.dot(
            vec2.rotate(vec2.AXIS_X, this.bodyA.angle + this.angle, Equation.temp0),
            vec2.rotate(vec2.AXIS_Y, this.bodyB.angle, Equation.temp1)
        )
    }
}