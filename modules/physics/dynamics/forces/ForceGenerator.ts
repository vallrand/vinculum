import { RigidBody } from '../RigidBody'

export abstract class ForceGenerator {
    abstract apply(bodies: RigidBody[], deltaTime: number): void
}