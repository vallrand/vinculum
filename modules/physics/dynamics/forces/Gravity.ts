import { vec2 } from 'math/vec2'
import { BodyType, SleepState } from '../../constants'
import { RigidBody } from '../RigidBody'
import { ForceGenerator } from './ForceGenerator'

export class Gravity extends ForceGenerator {
    private static readonly temp: vec2 = vec2()
    constructor(readonly gravity: vec2 = vec2(0, -9.78)){super()}
    frictionGravity = vec2.magnitude(this.gravity)
    apply(bodies: RigidBody[], deltaTime: number): void {
        const gravityForce = Gravity.temp
        for(let i = bodies.length - 1; i >= 0; i--){
            let body: RigidBody = bodies[i]
            if(body.type !== BodyType.DYNAMIC || body.sleepState === SleepState.ASLEEP) continue
            vec2.scale(this.gravity, body.mass, gravityForce)
            vec2.add(gravityForce, body.force, body.force)
        }
    }
}