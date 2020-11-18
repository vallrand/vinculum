import { vec2, lerp } from 'math'
import { RaycastController } from './RaycastController'

export class CharacterController extends RaycastController {
    public readonly inputOptions = {
        movementSpeed: 540,
        accelerationGrounded: 0.06,
        accelerationAirborne: 0.02,
        jumpHeight: 160
    }

    processInput(input: vec2, deltaTime: number){
        const jumpVelocity = Math.sqrt(2 * this.gravity * this.inputOptions.jumpHeight)

        const factor = Math.pow(this.flags.below
            ? this.inputOptions.accelerationGrounded
            : this.inputOptions.accelerationAirborne, 2 * deltaTime)
        this.velocity[0] = lerp(input[0] * this.inputOptions.movementSpeed, this.velocity[0], factor)
      
        if(input[1] < 0 && this.flags.below && this.slopeAngle * this.direction[0] >= 0){
            this.velocity[1] = -jumpVelocity
            this.flags.below = null
        }
    }
}