import { ShapeType } from '../constants'
import { vec2 } from 'math/vec2'
import { AABB } from 'math/AABB'
import { Shape, CollisionOptions } from './Shape'

export class Line extends Shape {
    public readonly radius: number = 0
    constructor(
        position: vec2, angle: number,
        public readonly length: number = 0,
        options?: CollisionOptions
    ){super(position, angle, options)}
    computeMomentOfInertia(): number {
        return this.length * this.length / 12
    }
    computeBoundingRadius(): number {
        return 0.5 * this.length
    }
    computeArea(): number{ return 0 }
    computeAABB(position: vec2, angle: number, out: AABB): AABB {
        const halfLength = 0.5 * this.length
        const x = halfLength * Math.abs(Math.cos(angle))
        const y = halfLength * Math.abs(Math.sin(angle))
        out[0] = position[0] - x - this.radius
        out[1] = position[1] - y - this.radius
        out[2] = position[0] + x + this.radius
        out[3] = position[1] + y + this.radius
        return out
    }
}
Line.prototype.type = ShapeType.LINE