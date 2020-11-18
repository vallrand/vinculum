import { ShapeType } from '../constants'
import { vec2 } from 'math/vec2'
import { AABB } from 'modules/math/AABB'
import { Shape } from './Shape'

export class Particle extends Shape {
    computeMomentOfInertia(): number { return 0 }
    computeBoundingRadius(): number { return 0 }
    computeArea(): number { return 0 }
    computeAABB(position: vec2, angle: number, out: AABB): AABB {
        out[0] = out[2] = position[0]
        out[1] = out[3] = position[1]
        return out
    }
}
Particle.prototype.type = ShapeType.PARTICLE