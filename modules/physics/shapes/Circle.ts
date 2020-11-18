import { ShapeType } from '../constants'
import { vec2 } from 'math/vec2'
import { AABB } from 'math/AABB'
import { Shape, CollisionOptions } from './Shape'

export class Circle extends Shape {
    constructor(
        position: vec2, angle: number,
        public readonly radius: number = 0,
        options?: CollisionOptions
    ){super(position, angle, options)}
    computeMomentOfInertia(): number {
        return 0.5 * this.radius * this.radius
    }
    computeBoundingRadius(): number {
        return this.radius
    }
    computeArea(): number {
        return Math.PI * this.radius * this.radius
    }
    computeAABB(position: vec2, angle: number, out: AABB): AABB {
        const { radius } = this
        out[0] = position[0] - radius
        out[1] = position[1] - radius
        out[2] = position[0] + radius
        out[3] = position[1] + radius
        return out
    }
}
Circle.prototype.type = ShapeType.CIRCLE