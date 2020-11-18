import { vec2 } from 'math/vec2'
import { RigidBody } from '../RigidBody'
import { Constraint } from './Constraint'
import { Equation } from '../equations/Equation'
import { ContactEquation } from '../equations/ContactEquation'
import { RotationalLockEquation } from '../equations/RotationalLockEquation'

export class PrismaticConstraint extends Constraint {
    private static readonly worldAxisA: vec2 = vec2()
    private static readonly worldAnchorA: vec2 = vec2()
    private static readonly worldAnchorB: vec2 = vec2()
    private static readonly orientedAnchorA: vec2 = vec2()
    private static readonly orientedAnchorB: vec2 = vec2()
    private readonly localAnchorA: vec2 = vec2()
    private readonly localAnchorB: vec2 = vec2()
    private readonly localAxisA: vec2 = vec2(1, 0)

    private readonly delta: vec2 = vec2()
    private readonly tangent: vec2 = vec2()

    private lowerLimit: number = 0
    private upperLimit: number = 1
    constructor(bodyA: RigidBody, bodyB: RigidBody){
        super(bodyA, bodyB)
        const translation = new Equation(bodyA, bodyB)
        translation.computeGq = () => {
            return vec2.dot(this.delta, this.tangent)
        }
        const motor = new Equation(bodyA, bodyB)
        motor.computeGq = () => 0
        motor.relativeVelocity = 1//motorSpeed
        this.equations.push(
            translation,
            new RotationalLockEquation(bodyA, bodyB),
            new ContactEquation(bodyA, bodyB),
            new ContactEquation(bodyA, bodyB),
            motor
        )
    }
    update(){
        const {
            worldAxisA, worldAnchorA, worldAnchorB, orientedAnchorA, orientedAnchorB
        } = PrismaticConstraint
        vec2.rotate(this.localAxisA, this.bodyA.angle, worldAxisA)
        vec2.rotate(this.localAnchorA, this.bodyA.angle, orientedAnchorA)
        vec2.rotate(this.localAnchorB, this.bodyB.angle, orientedAnchorB)
        vec2.add(this.bodyA.position, orientedAnchorA, worldAnchorA)
        vec2.add(this.bodyB.position, orientedAnchorB, worldAnchorB)

        const translation = this.equations[0]
        vec2.add(orientedAnchorB, this.bodyB.position, this.delta)
        vec2.subtract(this.delta, this.bodyA.position, this.delta)
        vec2.subtract(this.delta, orientedAnchorB, this.delta)
        vec2.rotate(this.localAxisA, this.bodyA.angle + 0.5*Math.PI, this.tangent)
        translation.G[0] = -this.tangent[0]
        translation.G[1] = -this.tangent[1]
        translation.G[2] = -vec2.cross(orientedAnchorA, this.tangent) + vec2.cross(this.tangent, this.delta)
        translation.G[3] = this.tangent[0]
        translation.G[4] = this.tangent[1]
        translation.G[5] = vec2.cross(orientedAnchorB, this.tangent)

        const lowerLimitEquation = this.equations[2] as ContactEquation
        const upperLimitEquation = this.equations[3] as ContactEquation
        const motorEquation = this.equations[4]

        const relativePosition = vec2.dot(worldAnchorB, worldAxisA) - vec2.dot(worldAnchorA, worldAxisA)
        if(motorEquation.enabled){
            motorEquation.G[0] = worldAxisA[0]
            motorEquation.G[1] = worldAxisA[1]
            motorEquation.G[2] = vec2.cross(worldAxisA, orientedAnchorB)
            motorEquation.G[3] = -worldAxisA[0]
            motorEquation.G[4] = -worldAxisA[1]
            motorEquation.G[5] = -vec2.cross(worldAxisA, orientedAnchorA)
        }

        if(this.upperLimit != null && relativePosition > this.upperLimit){
            const { contactPointA, contactPointB, normalA } = upperLimitEquation
            vec2.scale(worldAxisA, -1, normalA)
            vec2.subtract(worldAnchorB, this.bodyB.position, contactPointB)
            vec2.scale(worldAxisA, this.upperLimit, contactPointA)
            vec2.add(worldAnchorA, contactPointA, contactPointA)
            vec2.subtract(contactPointA, this.bodyA.position, contactPointA)
            upperLimitEquation.enabled = true
        }else upperLimitEquation.enabled = false

        if(this.lowerLimit != null && relativePosition < this.lowerLimit){
            const { contactPointA, contactPointB, normalA } = upperLimitEquation
            vec2.scale(worldAxisA, 1, normalA)
            vec2.subtract(worldAnchorB, this.bodyB.position, contactPointB)
            vec2.scale(worldAxisA, this.lowerLimit, contactPointA)
            vec2.subtract(worldAnchorA, contactPointA, contactPointA)
            vec2.subtract(contactPointA, this.bodyA.position, contactPointA)
            lowerLimitEquation.enabled = true
        }else lowerLimitEquation.enabled = false
    }
}