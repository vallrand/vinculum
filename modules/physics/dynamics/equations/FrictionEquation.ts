import { vec2 } from 'math/vec2'
import { Equation } from './Equation'
import { ContactEquation } from './ContactEquation'

export class FrictionEquation extends Equation {
    constructor(bodyA, bodyB, options?: { slipForce?: number, frictionCoefficient?: number }){
        super(bodyA, bodyB)
        Object.assign(this, options)
    }
    contactPointA = vec2()
    contactPointB = vec2()
    tangent = vec2()
    contactEquations: ContactEquation[] = []
    frictionCoefficient = 0.3
    get slipForce(): number { return this.maxForce }
    set slipForce(slipForce: number){
        this.maxForce = slipForce;
        this.minForce = -slipForce;
    }
    computeB(a: number, b: number, deltaTime: number): number {
        const { G, contactPointA, contactPointB, tangent } = this
        G[0] = -tangent[0]
        G[1] = -tangent[1]
        G[2] = -vec2.cross(contactPointA, tangent)
        G[3] = tangent[0]
        G[4] = tangent[1]
        G[5] = vec2.cross(contactPointB, tangent)
        const GW = this.computeGW()
        const GiMf = this.computeGiMf()
        return - GW * b - GiMf * deltaTime
    }
}