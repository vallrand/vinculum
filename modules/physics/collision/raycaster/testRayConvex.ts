import { vec2 } from 'math/vec2'
import { lineIntersectionFraction } from 'math/polygon'
import { RigidBody } from '../../dynamics/RigidBody'
import { Convex } from '../../shapes/Convex'
import { Ray } from './Ray'
import { IRaycastDetector, Raycaster } from './Raycaster'

const temp0: vec2 = vec2()
const temp1: vec2 = vec2()

export const testRayConvex: IRaycastDetector = function(
    this: Raycaster, ray: Ray, body: RigidBody, shape: Convex, position: vec2, angle: number
): void {
    const origin = vec2.subtract(ray.origin, position, temp0)
    const target = vec2.subtract(ray.target, position, temp1)
    vec2.rotate(origin, -angle, origin)
    vec2.rotate(target, -angle, target)
    for(let j = 0, i = shape.vertices.length - 1; i >= 0; j = i--){
        let prev = shape.vertices[i]
        let next = shape.vertices[j]
        let delta = lineIntersectionFraction(origin, target, prev, next)
        if(delta < 0) continue
        vec2.rotate(shape.normals[i], angle, this.intersectionNormal)
        if(this.reportIntersection(body, shape, delta, i)) return
    }
}