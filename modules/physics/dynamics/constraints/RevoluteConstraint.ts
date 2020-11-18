import { vec2 } from 'math/vec2'
import { RigidBody } from '../RigidBody'
import { Constraint } from './Constraint'
import { Equation } from '../equations/Equation'
import { RotationalVelocityEquation } from '../equations/RotationalVelocityEquation'
import { RotationalLockEquation } from '../equations/RotationalLockEquation'

export class RevoluteConstraint extends Constraint {
    private static readonly worldPivotA: vec2 = vec2()
    private static readonly worldPivotB: vec2 = vec2()
    private static readonly linearDeviation: vec2 = vec2()
    private readonly pivotA: vec2 = vec2()
    private readonly pivotB: vec2 = vec2()
    private lowerLimit = 0
    private upperLimit = 0
    constructor(bodyA: RigidBody, bodyB: RigidBody){
        super(bodyA, bodyB)
        const worldPivot = vec2()
        vec2.subtract(worldPivot, this.bodyA.position, this.pivotA)
        vec2.subtract(worldPivot, this.bodyB.position, this.pivotB)
        vec2.rotate(this.pivotA, -this.bodyA.angle, this.pivotA)
        vec2.rotate(this.pivotB, -this.bodyB.angle, this.pivotB)

        const motorEquation = new RotationalVelocityEquation(bodyA, bodyB)
        motorEquation.enabled = false
        const upperLimitEquation = new RotationalLockEquation(bodyA, bodyB)
        const lowerLimitEquation = new RotationalLockEquation(bodyA, bodyB)
        upperLimitEquation.minForce = lowerLimitEquation.maxForce = 0

        const x = new Equation(bodyA, bodyB)
        const y = new Equation(bodyA, bodyB)

        this.equations.push(x, y, motorEquation, upperLimitEquation, lowerLimitEquation)

        x.computeGq = () => {
            const { worldPivotA, worldPivotB, linearDeviation } = RevoluteConstraint
            vec2.rotate(this.pivotA, this.bodyA.angle, worldPivotA)
            vec2.rotate(this.pivotB, this.bodyB.angle, worldPivotB)
            vec2.add(this.bodyB.position, worldPivotB, linearDeviation)
            vec2.subtract(linearDeviation, this.bodyA.position, linearDeviation)
            vec2.subtract(linearDeviation, worldPivotA, linearDeviation)
            return vec2.dot(linearDeviation, vec2.AXIS_X)
        }
        y.computeGq = () => {
            const { worldPivotA, worldPivotB, linearDeviation } = RevoluteConstraint
            vec2.rotate(this.pivotA, this.bodyA.angle, worldPivotA)
            vec2.rotate(this.pivotB, this.bodyB.angle, worldPivotB)
            vec2.add(this.bodyB.position, worldPivotB, linearDeviation)
            vec2.subtract(linearDeviation, this.bodyA.position, linearDeviation)
            vec2.subtract(linearDeviation, worldPivotA, linearDeviation)
            return vec2.dot(linearDeviation, vec2.AXIS_Y)
        }

        x.G[0] = -1
        x.G[1] = 0
        x.G[3] = 1
        x.G[4] = 0
    
        y.G[0] = 0
        y.G[1] = -1
        y.G[3] = 0
        y.G[4] = 1
    }
    update(){
        const relativeAngle = this.bodyB.angle - this.bodyA.angle
        const upperLimitEquation = this.equations[3] as RotationalLockEquation
        const lowerLimitEquation = this.equations[4] as RotationalLockEquation
        const x = this.equations[0]
        const y = this.equations[1]

        upperLimitEquation.angle = this.upperLimit
        upperLimitEquation.enabled = this.upperLimit != null && relativeAngle > this.upperLimit
        lowerLimitEquation.angle = this.lowerLimit
        lowerLimitEquation.enabled = this.lowerLimit != null && relativeAngle < this.lowerLimit

        const { worldPivotA, worldPivotB } = RevoluteConstraint
        vec2.rotate(this.pivotA, this.bodyA.angle, worldPivotA)
        vec2.rotate(this.pivotB, this.bodyB.angle, worldPivotB)

        x.G[2] = -vec2.cross(worldPivotA, vec2.AXIS_X)
        x.G[5] = vec2.cross(worldPivotB, vec2.AXIS_X)
        y.G[2] = -vec2.cross(worldPivotA, vec2.AXIS_Y)
        y.G[5] = vec2.cross(worldPivotB, vec2.AXIS_Y)
    }
}