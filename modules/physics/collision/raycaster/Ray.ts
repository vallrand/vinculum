import { vec2 } from 'math/vec2'
import { AABB } from 'math/AABB'

export class Ray {
    readonly origin: vec2 = vec2()
    readonly target: vec2 = vec2()
    readonly direction: vec2 = vec2()
    public length: number = 0
    public readonly aabb: AABB = AABB()
    public set(origin: vec2, target: vec2): void {
        vec2.copy(origin, this.origin)
        vec2.copy(target, this.target)
        vec2.subtract(target, origin, this.direction)
        this.length = vec2.magnitude(this.direction)
        vec2.scale(this.direction, this.direction && 1 / this.length, this.direction)
        AABB.fromValues(
            Math.min(origin[0], target[0]),
            Math.min(origin[1], target[1]),
            Math.max(origin[0], target[0]),
            Math.max(origin[1], target[1]),
            this.aabb
        )
    }
}

export function testRayAABB(ray: Ray, aabb: AABB): number {
    const invDirectionX = 1 / ray.direction[0]
    const invDirectionY = 1 / ray.direction[1]
    const t1 = (aabb[0] - ray.origin[0]) * invDirectionX
    const t2 = (aabb[2] - ray.origin[0]) * invDirectionX
    const t3 = (aabb[1] - ray.origin[1]) * invDirectionY
    const t4 = (aabb[3] - ray.origin[1]) * invDirectionY
    const tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4))
    const tmax = Math.min(Math.max(t1, t2), Math.max(t3, t4))
    if(tmax < 0) return -1
    if(tmin > tmax) return -Infinity
    return ray.length ? Math.max(0, tmin) / ray.length : 0
}

export function testRayBoundingRadius(ray: Ray, center: vec2, radius: number): boolean {
    const closest = vec2.subtract(center, ray.origin, vec2.temp)
    let dot = vec2.dot(closest, ray.direction)
    vec2.scale(ray.direction, dot, closest)
    vec2.add(ray.origin, closest, closest)
    const distanceSquared = vec2.distanceSquared(center, closest)
    return distanceSquared <= radius * radius
}