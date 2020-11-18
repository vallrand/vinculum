import { vec2 } from 'math/vec2'
import { RigidBody } from '../RigidBody'

type JacobianMatrix = [number,number,number,number,number,number]

//https://www8.cs.umu.se/kurser/5DV058/VT15/lectures/SPOOKlabnotes.pdf
export class Equation {
    constructor(
        public readonly bodyA: RigidBody,
        public readonly bodyB: RigidBody
    ){}
    minForce = -Number.MAX_VALUE
    maxForce = Number.MAX_VALUE
    maxBias = Number.MAX_VALUE
    stiffness = 1e6
    relaxation = 4
    G: JacobianMatrix = new Float32Array(6) as any
    a = 0
    b = 0
    epsilon = 0
    multiplier = 0
    lambda = 0
    B = 0
    invC = 0
    minForceDt = 0
    maxForceDt = 0
    timeStep = 1 / 60
    offset = 0
    relativeVelocity = 0
    index: number
    dirtyFlag: boolean = true
    enabled: boolean = true
    update(deltaTime: number): void {
        if(this.timeStep === deltaTime && !this.dirtyFlag) return
        this.timeStep = deltaTime
        this.dirtyFlag = false

        const k = this.stiffness,
              d = this.relaxation,
              h = this.timeStep
        this.a = 4 / (h * (1 + 4 * d))
        this.b = (4 * d) / (1 + 4 * d)
        this.epsilon = 4 / (h * h * k * (1 + 4 * d))
    }
    multiplyJacobian(G: JacobianMatrix, v0: vec2, w0: number, v1: vec2, w1: number): number {
        return  G[0] * v0[0] +
                G[1] * v0[1] +
                G[2] * w0 +
                G[3] * v1[0] +
                G[4] * v1[1] +
                G[5] * w1
    }
    //Computes the Right Hand Side of the SPOOK equation
    computeB(a: number, b: number, deltaTime: number): number {
        let GW = this.computeGW()
        let Gq = this.computeGq()
        if(Math.abs(Gq) > this.maxBias)
            Gq = Gq > 0 ? this.maxBias : -this.maxBias
        let GiMf = this.computeGiMf()
        return - Gq * a - GW * b - GiMf * deltaTime
    }
    //Computes G\*q, where q are the generalized body coordinates
    computeGq(): number {
        return this.multiplyJacobian(
            this.G,
            vec2.ZERO,
            this.bodyA.angle,
            vec2.ZERO,
            this.bodyB.angle
        ) + this.offset
    }
    //Computes G\*W, where W are the body velocities
    computeGW(): number {
        return this.multiplyJacobian(
            this.G,
            this.bodyA.velocity,
            this.bodyA.angularVelocity,
            this.bodyB.velocity,
            this.bodyB.angularVelocity
        ) + this.relativeVelocity
    }
    //Computes G\*Wlambda, where W are the body velocities
    computeGWlambda(): number {
        return this.multiplyJacobian(
            this.G,
            this.bodyA.vlambda,
            this.bodyA.wlambda,
            this.bodyB.vlambda,
            this.bodyB.wlambda
        )
    }
    protected static readonly temp0: vec2 = vec2()
    protected static readonly temp1: vec2 = vec2()
    //Computes G\*inv(M)\*f, where M is the mass matrix with diagonal blocks for each body, and f are the forces on the bodies.
    computeGiMf(): number {
        const { bodyA, bodyB } = this
        return this.multiplyJacobian(
            this.G,
            vec2.multiply(bodyA.force, bodyA.invMass, Equation.temp0),
            bodyA.angularForce * bodyA.invInertia,
            vec2.multiply(bodyB.force, bodyB.invMass, Equation.temp1),
            bodyB.angularForce * bodyB.invInertia
        )
    }
    //Computes G\*inv(M)\*G'
    computeGiMGt(): number {
        const { G, bodyA, bodyB } = this
        return  G[0] * G[0] * bodyA.invMass[0] +
                G[1] * G[1] * bodyA.invMass[1] +
                G[2] * G[2] * bodyA.invInertia +
                G[3] * G[3] * bodyB.invMass[0] +
                G[4] * G[4] * bodyB.invMass[1] +
                G[5] * G[5] * bodyB.invInertia
    }
    //Compute the denominator part of the SPOOK equation: C = G\*inv(M)\*G' + eps
    computeInvC(epsilon: number): number {
        return 1 / (this.computeGiMGt() + epsilon)
    }
    // v_lambda = G * inv(M) * delta_lambda
    updateWlambda(deltaLambda: number): void {
        const { G, bodyA, bodyB } = this
        bodyA.vlambda[0] += deltaLambda * G[0] * bodyA.invMass[0]
        bodyA.vlambda[1] += deltaLambda * G[1] * bodyA.invMass[1]
        bodyA.wlambda += deltaLambda * G[2] * bodyA.invInertia
        bodyB.vlambda[0] += deltaLambda * G[3] * bodyB.invMass[0]
        bodyB.vlambda[1] += deltaLambda * G[4] * bodyB.invMass[1]
        bodyB.wlambda += deltaLambda * G[5] * bodyB.invInertia
    }
}