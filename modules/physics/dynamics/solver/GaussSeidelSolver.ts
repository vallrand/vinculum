import { vec2 } from 'math/vec2'
import { RigidBody } from '../RigidBody'
import { Equation } from '../equations/Equation'

export interface ISolver {
    solve(equations: Equation[], bodies: RigidBody[], deltaTime: number): void
}

export class GaussSeidelSolver implements ISolver {
    private readonly iterations: number = 8
    private readonly tolerance: number = 1e-7
    private readonly frictionIterations: number = 0

    public solve(equations: Equation[], bodies: RigidBody[], deltaTime: number): void {
        if(!equations.length) return

        for(let i = 0; i < equations.length; i++){
            let equation = equations[i]
            equation.lambda = 0
            equation.update(deltaTime)
            equation.B = equation.computeB(equation.a, equation.b, deltaTime)
            equation.invC = equation.computeInvC(equation.epsilon)
            equation.maxForceDt = equation.maxForce * deltaTime
            equation.minForceDt = equation.minForce * deltaTime
        }
        for(let i = 0; i < bodies.length; i++){
            let body = bodies[i]
            body.wlambda = 0
            vec2.copy(vec2.ZERO, body.vlambda)
        }
        if(this.frictionIterations){
            this.iterate(equations, this.frictionIterations, deltaTime)
            for(let j = 0; j < equations.length; j++){
                let equation = equations[j] as any
                if(!equation.contactEquations) continue
                let totalForce = 0
                for(let k = equation.contactEquations.length - 1; k >= 0; k--)
                    totalForce += equation.contactEquations[k].multiplier
                totalForce *= equation.frictionCoefficient / equation.contactEquations.length
                equation.maxForce = totalForce
                equation.minForce = -totalForce
                equation.maxForceDt = totalForce * deltaTime
                equation.minForceDt = -totalForce * deltaTime
            }
        }
        this.iterate(equations, this.iterations, deltaTime)
        for(let i = bodies.length - 1; i >= 0; i--){
            let body = bodies[i]
            body.angularVelocity += body.wlambda
            vec2.add(body.vlambda, body.velocity, body.velocity)
        }
    }
    private iterate(equations: Equation[], iterations: number, deltaTime: number): void {
        const toleranceSquared = Math.pow(this.tolerance * equations.length, 2)
        for(let length = equations.length, i = iterations; i > 0; i--){
            let totalError = 0
            for(let j = 0; j < length; j++){
                let equation = equations[j]
                let deltaLambda = this.computeEquation(equation)
                totalError += Math.abs(deltaLambda)
            }
            if(totalError * totalError <= toleranceSquared) break
        }
        const invDeltaTime = 1 / deltaTime
        for(let i = equations.length - 1; i >= 0; i--){
            let equation = equations[i]
            equation.multiplier = equation.lambda * invDeltaTime
        }
    }
    private computeEquation(equation: Equation): number {
        const {
            B, epsilon, invC, lambda, maxForceDt, minForceDt
        } = equation
        const GWlambda = equation.computeGWlambda()
        let deltaLambda = invC * (B - GWlambda - epsilon * lambda)
        const nextLambda = lambda + deltaLambda
        if(nextLambda < minForceDt) deltaLambda = minForceDt - lambda
        else if(nextLambda > maxForceDt) deltaLambda = maxForceDt - lambda
        equation.lambda += deltaLambda
        equation.updateWlambda(deltaLambda)
        return deltaLambda
    }
}