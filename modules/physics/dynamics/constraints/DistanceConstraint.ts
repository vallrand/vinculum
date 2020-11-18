import { vec2 } from 'math/vec2'
import { RigidBody } from '../RigidBody'
import { Constraint } from './Constraint'
import { Equation } from '../equations/Equation'

export class DistanceConstraint extends Constraint {
    private static readonly worldAnchorA: vec2 = vec2()
    private static readonly worldAnchorB: vec2 = vec2()
    private static readonly direction: vec2 = vec2()
    private readonly localAnchorA: vec2 = vec2()
    private readonly localAnchorB: vec2 = vec2()
    private distance: number = 0
    private upperLimit: number = 1
    private lowerLimit: number = 0
    constructor(bodyA: RigidBody, bodyB: RigidBody){
        super(bodyA, bodyB)
        this.distance = this.computeDistance()
        this.equations.push(new Equation(bodyA, bodyB))
        this.equations[0].computeGq = (): number => this.computeDistance() - this.distance
    }
    computeDistance(): number {
        const{ worldAnchorA, worldAnchorB, direction } = DistanceConstraint
        vec2.rotate(this.localAnchorA, this.bodyA.angle, worldAnchorA)
        vec2.rotate(this.localAnchorB, this.bodyB.angle, worldAnchorB)
        vec2.add(this.bodyB.position, worldAnchorB, direction)
        vec2.subtract(direction, worldAnchorA, direction)
        vec2.subtract(direction, this.bodyA.position, direction)
        return vec2.magnitude(direction)
    }
    update(){
        const equation = this.equations[0]
        const distance = this.computeDistance()

        let violating = false
        if(distance > this.upperLimit && this.upperLimit >= 0){
            equation.maxForce = 0
            equation.minForce = -Infinity
            this.distance = this.upperLimit
            violating = true
        }
        if(distance < this.lowerLimit && this.lowerLimit >= 0){
            equation.maxForce = Infinity
            equation.minForce = 0
            this.distance = this.lowerLimit
            violating = true
        }
        if((this.lowerLimit >= 0 || this.upperLimit >= 0) && !violating){
            equation.enabled = false
            return
        }
        equation.enabled = true
        const{ worldAnchorA, worldAnchorB, direction } = DistanceConstraint
        vec2.normalize(direction, direction)
        const crossA = vec2.cross(direction, worldAnchorA)
        const crossB = vec2.cross(direction, worldAnchorB)
        const { G } = equation
        G[0] = -direction[0]
        G[1] = -direction[1]
        G[2] = -crossA
        G[3] = direction[0]
        G[4] = direction[1]
        G[5] = crossB
    }
}