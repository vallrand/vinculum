import { vec2 } from 'math/vec2'
import { AABB } from 'math/AABB'
import { triangulate, triangleArea } from 'math/polygon'
import { ShapeType } from '../constants'
import { Shape, CollisionOptions } from './Shape'

export class Convex extends Shape {
    public static readonly temp0: vec2 = vec2()
    public static readonly temp1: vec2 = vec2()
    public readonly vertices: vec2[] = []
    public readonly normals: vec2[] = []
    public readonly center: vec2 = vec2()
    private readonly indices: number[] = []
    constructor(position: vec2, angle: number, vertices: vec2[], CCW: boolean = true, options?: CollisionOptions){
        super(position, angle, options)
        const vertexArray = new Float32Array(vertices.length * 2)
        for(let i = 0; i < vertices.length; i++){
            const vertex: vec2 = vertexArray.subarray(i * 2, i * 2 + 2) as any
            vec2.copy(vertices[i], vertex)
            this.vertices.push(vertex)
            this.normals.push(vec2())
        }
        for(let j = 0, i = this.vertices.length - 1; i >= 0; j = i--){
            let next = this.vertices[j]
            let prev = this.vertices[i]
            let normal = this.normals[i]
            vec2.subtract(next, prev, normal)
            vec2.rotate90cw(normal, normal)
            vec2.normalize(normal, normal)
        }
        triangulate(this.vertices, 0, this.vertices.length, !CCW, this.indices)
    }
    computeMomentOfInertia(): number {
        let denom = 0, numer = 0
        for(let j = 0, i = this.vertices.length - 1; i >= 0; j = i--){
            let prev = this.vertices[i]
            let next = this.vertices[j]
            let a = Math.abs(vec2.cross(prev, next))
            let b = vec2.dot(next, next) + vec2.dot(next, prev) + vec2.dot(prev, prev)
            denom += a * b
            numer += a
        }
        return (1.0 / 6.0) * (denom / numer)
    }
    computeBoundingRadius(): number {
        let radiusSquared = 0
        for(let i = this.vertices.length - 1; i >= 0; i--){
            let distanceSquared = vec2.magnitudeSquared(this.vertices[i])
            if(radiusSquared < distanceSquared) radiusSquared = distanceSquared
        }
        return Math.sqrt(radiusSquared)
    }
    computeArea(): number {
        vec2.copy(vec2.ZERO, this.center)
        let totalArea = 0
        for(let i = 2; i < this.indices.length; i+=3){
            let a = this.vertices[this.indices[i-2]]
            let b = this.vertices[this.indices[i-1]]
            let c = this.vertices[this.indices[i-0]]
            Convex.temp0[0] = (a[0] + b[0] + c[0]) / 3
            Convex.temp0[1] = (a[1] + b[1] + c[1]) / 3
            let area = 0.5 * triangleArea(a, b, c)
            totalArea += area
            vec2.scale(Convex.temp0, area, Convex.temp0)
            vec2.add(Convex.temp0, this.center, this.center)
        }
        vec2.scale(this.center, 1 / totalArea, this.center)
        return totalArea
    }
    computeAABB(position: vec2, angle: number, out: AABB): AABB {
        const cos = Math.cos(angle), sin = Math.sin(angle)
        let minX = Infinity, minY = Infinity,
        maxX = -Infinity, maxY = -Infinity
        for(let i = this.vertices.length - 1; i >= 0; i--){
            let vertex = this.vertices[i]
            let x = cos * vertex[0] - sin * vertex[1]
            let y = sin * vertex[0] + cos * vertex[1]
            minX = Math.min(minX, x)
            minY = Math.min(minY, y)
            maxX = Math.max(maxX, x)
            maxY = Math.max(maxY, y)
        }
        return AABB.fromValues(
            minX + position[0],
            minY + position[1],
            maxX + position[0],
            maxY + position[1],
        out)
    }
}
Convex.prototype.type = ShapeType.CONVEX