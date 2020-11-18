import { vec2 } from 'math/vec2'
import { RigidBody } from '../../dynamics/RigidBody'
import { Circle } from '../../shapes/Circle'
import { Ray } from './Ray'
import { IRaycastDetector, Raycaster } from './Raycaster'

export const testRayCircle: IRaycastDetector = function(
    this: Raycaster, ray: Ray, body: RigidBody, shape: Circle, position: vec2, angle: number
): void {
    const { origin, target } = ray
    const rx = target[0] - origin[0]
    const ry = target[1] - origin[1]
    const dx = origin[0] - position[0]
    const dy = origin[1] - position[1]
    const a = rx * rx + ry * ry
    const b = 2 * (rx * dx + ry * dy)
    const c = dx * dx + dy * dy - shape.radius * shape.radius
    const delta = b * b - 4 * a * c
    if(delta < 0) return
    else if(delta == 0){
        vec2.lerp(origin, target, delta, this.intersectionPoint)
        vec2.subtract(this.intersectionPoint, position, this.intersectionNormal)
        vec2.normalize(this.intersectionNormal, this.intersectionNormal)
        this.reportIntersection(body, shape, delta, -1)
        return
    }
    const sqrtDelta = Math.sqrt(delta)
    const inv2a = 1 / (2 * a)
    const d1 = (-b - sqrtDelta) * inv2a
    const d2 = (-b + sqrtDelta) * inv2a
    if(d1 >= 0 && d1 <= 1){
        vec2.lerp(origin, target, d1, this.intersectionPoint)
        vec2.subtract(this.intersectionPoint, position, this.intersectionNormal)
        vec2.normalize(this.intersectionNormal, this.intersectionNormal)
        if(this.reportIntersection(body, shape, d1, -1)) return
    }
    if(d2 >= 0 && d2 <= 1){
        vec2.lerp(origin, target, d2, this.intersectionPoint)
        vec2.subtract(this.intersectionPoint, position, this.intersectionNormal)
        vec2.normalize(this.intersectionNormal, this.intersectionNormal)
        if(this.reportIntersection(body, shape, d2, -1)) return
    }
}