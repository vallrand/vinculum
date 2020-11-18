import { vec2 } from 'math/vec2'
import { rgb, rgba } from 'math/rgba'

type Sampler<C, T> = (this: C, time: number, out?: T) => T

export class BillboardParticle {
    public static readonly bindProperty = <T>(
        setter: (target: BillboardParticle, value: T) => void,
        sampler: Sampler<BillboardParticle, T>,
        temp?: T
    ) => (particle: BillboardParticle) => setter(particle, sampler.call(particle, 1 - particle.life, temp))

    public static readonly set = {
        position: (particle: BillboardParticle, value: vec2) => vec2.copy(value, particle.position),
        velocity: (particle: BillboardParticle, value: vec2) => vec2.copy(value, particle.velocity),
        acceleration: (particle: BillboardParticle, value: vec2) => vec2.copy(value, particle.acceleration),
        scale: (particle: BillboardParticle, value: vec2) => vec2.copy(value, particle.scale),
        opacity: (particle: BillboardParticle, value: number) => particle.color[3] = value * 0xFF,
        originalSize: (particle: BillboardParticle, value: number) => vec2.fromValues(value, value, particle.originalScale),
        size: (particle: BillboardParticle, value: number) => vec2.scale(particle.originalScale, value, particle.scale),
        rotation: (particle: BillboardParticle, value: number) => particle.rotation = value,
        angularVelocity: (particle: BillboardParticle, value: number) => particle.angularVelocity = value,
        life: (particle: BillboardParticle, value: number) => particle.lifetime = value,
        color: (particle: BillboardParticle, value: rgb) => rgb.copy(value, particle.color as any),
        friction: (particle: BillboardParticle, value: number) => particle.friction = value,
    }
    position: vec2 = vec2(0, 0)
    velocity: vec2 = vec2(0, 0)
    rotation: number = 0
    angularVelocity: number = 0
    acceleration: vec2 = vec2(0, 0)
    lifetime: number = 0
    life: number = 0
    friction: number = 1
    color: rgba = rgba(0xFF, 0xFF, 0xFF, 0xFF)
    originalScale: vec2 = vec2(1, 1)
    scale: vec2 = vec2(1, 1)
    texture: string
    public reset(): this {
        this.position[0] = this.position[1] = 0
        this.velocity[0] = this.velocity[1] = 0
        this.acceleration[0] = this.acceleration[1] = 0
        this.originalScale[0] = this.originalScale[1] = 1
        this.scale[0] = this.scale[1] = 1
        rgba.copy(rgba.WHITE, this.color)
        this.rotation = this.angularVelocity = 0
        this.lifetime = this.life = 0
        this.friction = 1
        return this
    }
}