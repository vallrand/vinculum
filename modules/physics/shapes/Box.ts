import { vec2 } from 'math/vec2'
import { AABB } from 'math/AABB'
import { ShapeType } from '../constants'
import { Shape, CollisionOptions } from './Shape'

export class Box extends Shape {
    private static readonly QUAD_NORMALS: vec2[] = [
        vec2(0, -1), vec2(1, 0), vec2(0, 1), vec2(-1, 0)
    ]
    public readonly vertices: vec2[] = [vec2(), vec2(), vec2(), vec2()]
    public readonly normals: vec2[] = Box.QUAD_NORMALS
    constructor(
        position: vec2, angle: number,
        public readonly width: number, public readonly height: number,
        options?: CollisionOptions
    ){
        super(position, angle, options)
        const halfWidth = 0.5 * width
        const halfHeight = 0.5 * height
        vec2.fromValues(-halfWidth, -halfHeight, this.vertices[0])
        vec2.fromValues(+halfWidth, -halfHeight, this.vertices[1])
        vec2.fromValues(+halfWidth, +halfHeight, this.vertices[2])
        vec2.fromValues(-halfWidth, +halfHeight, this.vertices[3])
    }
    computeMomentOfInertia(): number {
        return (this.width * this.width + this.height * this.height) / 12
    }
    computeBoundingRadius(): number {
        return 0.5 * Math.sqrt(this.width * this.width + this.height * this.height)
    }
    computeArea(): number {
        return this.width * this.height
    }
    computeAABB(position: vec2, angle: number, out: AABB): AABB {
        const cos = Math.abs(Math.cos(angle))
        const sin = Math.abs(Math.sin(angle))
        const halfWidth = 0.5 * this.width
        const halfHeight = 0.5 * this.height
        const x = halfWidth * cos + halfHeight * sin
        const y = halfWidth * sin + halfHeight * cos
        out[0] = position[0] - x
        out[1] = position[1] - y
        out[2] = position[0] + x
        out[3] = position[1] + y
        return out
    }
}
Box.prototype.type = ShapeType.BOX