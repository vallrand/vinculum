import { vec2 } from 'math/vec2'
import { RigidBody } from '../RigidBody'
import { Constraint } from './Constraint'
import { Equation } from '../equations/Equation'

export class LockConstraint extends Constraint {
    private static readonly temp0: vec2 = vec2()
    private static readonly temp1: vec2 = vec2()
    private readonly localOffsetB: vec2 = vec2()
    private localAngleB: number = 0
    constructor(bodyA: RigidBody, bodyB: RigidBody){
        super(bodyA, bodyB)
        vec2.subtract(this.bodyB.position, this.bodyA.position, this.localOffsetB)
        vec2.rotate(this.localOffsetB, -this.bodyA.angle, this.localOffsetB)
        this.localAngleB = this.bodyB.angle - this.bodyA.angle
        this.equations.push(
            new Equation(bodyA, bodyB),
            new Equation(bodyA, bodyB),
            new Equation(bodyA, bodyB)
        )

        const x = this.equations[0]
        const y = this.equations[1]
        const a = this.equations[2]
        x.computeGq = () => {
            const { temp0 } = LockConstraint
            vec2.rotate(this.localOffsetB, this.bodyA.angle, temp0)
            vec2.subtract(this.bodyB.position, temp0, temp0)
            vec2.subtract(temp0, this.bodyA.position, temp0)
            return temp0[0]
        }
        y.computeGq = () => {
            const { temp0 } = LockConstraint
            vec2.rotate(this.localOffsetB, this.bodyA.angle, temp0)
            vec2.subtract(this.bodyB.position, temp0, temp0)
            vec2.subtract(temp0, this.bodyA.position, temp0)
            return temp0[1]
        }
        a.computeGq = () => {
            const { temp0, temp1 } = LockConstraint
            vec2.rotate(this.localOffsetB, this.bodyB.angle = this.localAngleB, temp0)
            vec2.scale(temp0, -1, temp0)
            vec2.subtract(this.bodyA.position, this.bodyB.position, temp1)
            vec2.add(temp1, temp0, temp1)
            vec2.rotate(temp0, -0.5 * Math.PI, temp0)
            vec2.normalize(temp0, temp0)
            return vec2.dot(temp1, temp0)
        }
    }
    update(){
        const { temp0, temp1 } = LockConstraint
        const x = this.equations[0]
        const y = this.equations[1]
        const a = this.equations[2]
        vec2.rotate(this.localOffsetB, this.bodyA.angle, temp0)
        x.G[0] = -1
        x.G[1] = 0
        x.G[2] = -vec2.cross(temp0, vec2.AXIS_X)
        x.G[3] = 1

        y.G[0] = 0
        y.G[1] = -1
        y.G[2] = -vec2.cross(temp0, vec2.AXIS_Y)
        y.G[4] = 1

        vec2.rotate(this.localOffsetB, this.bodyB.angle - this.localAngleB, temp0)
        vec2.scale(temp0, -1, temp0)
        vec2.rotate(temp0, 0.5 * Math.PI, temp1)
        vec2.normalize(temp1, temp1)

        a.G[0] = -temp1[0]
        a.G[1] = -temp1[1]
        a.G[3] = temp1[0]
        a.G[4] = temp1[1]
        a.G[5] = vec2.cross(temp0, temp1)
    }
}