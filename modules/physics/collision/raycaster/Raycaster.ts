import { vec2 } from 'math/vec2'
import { RigidBody } from '../../dynamics/RigidBody'
import { Shape } from '../../shapes/Shape'
import { Ray, testRayBoundingRadius, testRayAABB } from './Ray'

export type IRaycastDetector = (
    this: Raycaster, ray: Ray, body: RigidBody, shape: Shape, position: vec2, angle: number
) => void

export interface RaycastOptions {
    skipBackFaces: boolean
    skipNonColliders: boolean
    bailEarly: boolean
    collisionGroup: number
    collisionMask: number
}

export class Raycaster implements RaycastOptions {
    private static readonly temp0: vec2 = vec2()
    readonly intersectionPoint: vec2 = vec2()
    readonly intersectionNormal: vec2 = vec2()
    fraction: number = -1
    readonly ray: Ray = new Ray
    skipBackFaces: boolean = true
    skipNonColliders: boolean = true
    bailEarly: boolean = false
    collisionGroup: number = -1
    collisionMask: number = -1

    body: RigidBody = null
    shape: Shape = null
    readonly normal: vec2 = vec2()
    constructor(private readonly detectors: Record<number, IRaycastDetector>){}
    private consumer: (body: RigidBody, shape: Shape) => boolean | void
    protected reportIntersection(
        body: RigidBody, shape: Shape,
        fraction: number, faceIndex: number
    ): boolean {
        if(this.skipBackFaces && vec2.dot(this.intersectionNormal, this.ray.direction) > 0) return false
        if(this.fraction >= 0 && this.fraction < fraction) return false
        if(this.consumer && !this.consumer(body, shape)) return false
        this.fraction = fraction
        this.body = body
        this.shape = shape
        vec2.copy(this.intersectionNormal, this.normal)
        return this.bailEarly
    }
    public raycast(body: RigidBody, consumer: (body: RigidBody, shape: Shape) => boolean | void): number {
        this.consumer = consumer
        let fraction = testRayAABB(this.ray, body.aabb)
        if(fraction < 0 || fraction > 1) return
        if(this.skipNonColliders && !body.collisionResponse) return
        for(let length = body.shapes.length, i = 0; i < length; i++){
            let shape = body.shapes[i]
            if(this.skipNonColliders && !shape.collisionResponse) continue
            if(!(this.collisionGroup & shape.collisionMask |
                shape.collisionGroup & this.collisionMask)) continue

            const worldPosition = vec2.rotate(shape.position, body.angle, Raycaster.temp0)
            vec2.add(body.position, worldPosition, worldPosition)
            const worldAngle = body.angle + shape.angle

            if(!testRayBoundingRadius(this.ray, worldPosition, shape.boundingRadius)) continue
            const detector = this.detectors[shape.type]
            if(detector) detector.call(this, this.ray, body, shape, worldPosition, worldAngle)
            if(this.fraction >= 0 && this.bailEarly) return 0
        }
        return this.fraction
    }
    public reset(){
        this.fraction = -1
        this.body = null
        this.shape = null
    }
    public computeHitDistance(): number {
        return this.ray.length * this.fraction
    }
    public computeHitPoint(out: vec2): vec2 {
        return vec2.lerp(this.ray.origin, this.ray.target, this.fraction, out)
    }
}