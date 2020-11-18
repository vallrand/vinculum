import { vec2 } from 'math/vec2'
import { AABB } from 'modules/math/AABB'

export interface CollisionOptions {
    material?: number
    collisionGroup?: number
    collisionMask?: number
}

export abstract class Shape {
    public type: number
    constructor(
        public readonly position: vec2 = vec2(),
        public angle: number = 0,
        options?: CollisionOptions
    ){Object.assign(this, options)}

    inertia: number = 0
    boundingRadius: number = 0
    area: number = 0

    material: number = 0
    collisionGroup: number = 0x01
    collisionMask: number = 0x01

    collisionResponse: boolean = true //TODO revisit
    sensor: boolean = false //TODO revisit

    abstract computeMomentOfInertia(): number
    abstract computeBoundingRadius(): number
    abstract computeArea(): number
    abstract computeAABB(position: vec2, angle: number, out: AABB): AABB

    public recalculateStaticProperties(): this {
        this.inertia = this.computeMomentOfInertia()
        this.area = this.computeArea()
        this.boundingRadius = this.computeBoundingRadius()
        return this
    }
}