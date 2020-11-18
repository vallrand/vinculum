import { vec2 } from 'math/vec2'
import { Equation } from './Equation'
import { Shape } from '../../shapes/Shape'

export class ContactEquation extends Equation {
    constructor(bodyA, bodyB){
        super(bodyA, bodyB)
        this.minForce = 0
    }
    contactPointA: vec2 = vec2()
    contactPointB: vec2 = vec2()
    penetration: vec2 = vec2()
    normalA = vec2()
    restitution = 0
    firstImpact = false
    shapeA: Shape = null
    shapeB: Shape = null
    computeB(a: number, b: number, deltaTime: number): number {
        const { G, normalA, contactPointA, contactPointB } = this
        G[0] = -normalA[0]
        G[1] = -normalA[1]
        G[2] = -vec2.cross(contactPointA, normalA)
        G[3] = normalA[0]
        G[4] = normalA[1]
        G[5] = vec2.cross(contactPointB, normalA)
        let Gq = 0
        let GW = this.computeGW()
        if(this.firstImpact && this.restitution !== 0)
            GW *= (1 + this.restitution) / b
        else{
            const positionA = this.bodyA.position
            const positionB = this.bodyB.position
            this.penetration[0] = positionB[0] + contactPointB[0] - positionA[0] - contactPointA[0]
            this.penetration[1] = positionB[1] + contactPointB[1] - positionA[1] - contactPointA[1]
            Gq = vec2.dot(normalA, this.penetration) + this.offset
        }
        const GiMf = this.computeGiMf()
        return - Gq * a - GW * b - GiMf * deltaTime
    }
}