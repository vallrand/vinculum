import { RigidBody } from '../RigidBody'
import { Equation } from '../equations/Equation'

export abstract class Constraint {
    public readonly equations: Equation[] = []
    readonly collideConnected = true
    constructor(
        public readonly bodyA: RigidBody,
        public readonly bodyB: RigidBody
    ){}
    abstract update(): void
}