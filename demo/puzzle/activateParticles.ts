import { vec2, rgb, rgba, ease, lerp, mat3x2, randomFloat } from 'math'
import {  EntityManager } from 'framework'
import { Transform2D, TweenSampler, GroupComponent } from 'scene'
import { ParticleEmitter, BillboardParticle, AreaSampler, verletIntegration, velocityRotation } from 'scene/particles'
import { Material, BillboardBatch, BlendMode } from 'renderer'

import { rng } from '../helpers'
import { Layer } from '../terrain'
import { PuzzleKnotType } from './constants'
import { PuzzleKnot } from './PuzzleKnot'

export function createEntryEmitter(manager: EntityManager, group: GroupComponent){
    const entity = manager.createEntity()
    manager.createComponent(entity, Transform2D, { parent: group.entity })
    const emitter = manager.createComponent(entity, ParticleEmitter, {
        spawners: [
            BillboardParticle.bindProperty(BillboardParticle.set.position, AreaSampler.circle(vec2.ZERO, vec2(60, 100))),
            BillboardParticle.bindProperty(BillboardParticle.set.velocity, AreaSampler.targeted(
                AreaSampler.static<vec2>(vec2.ZERO),
                vec2(-150, -100)
            )),
            BillboardParticle.bindProperty(BillboardParticle.set.acceleration, 
                AreaSampler.range<vec2>(vec2.lerp, vec2())(vec2(0, -120), vec2(0, -70))
            ),
            BillboardParticle.bindProperty(BillboardParticle.set.life, AreaSampler.static<number>(2)),
            BillboardParticle.bindProperty(BillboardParticle.set.originalSize, AreaSampler.range<number>(lerp)(10, 40))
        ],
        updaters: [
            verletIntegration,
            BillboardParticle.bindProperty(BillboardParticle.set.opacity,
                TweenSampler(lerp)(0, 1, ease.quartOut)
            ),
            BillboardParticle.bindProperty(BillboardParticle.set.size,
                TweenSampler(lerp)(1, 0, ease.quadIn)
            )
        ],
        spawnRate: 0.2,
        spawnAmount: 1,
        timeScale: 1
    }) as ParticleEmitter
    manager.createComponent(entity, BillboardBatch, {
        order: Layer.EFFECTS,
        billboards: emitter.particles
    })
    manager.createComponent(entity, Material, {
        program: 0, blend: BlendMode.ADD, tint: rgb(0x00, 0x00, 0x77),
        texture: 'effects/particle_c.png'
    })
    group.references.push(entity)
}

export function activateParticles(manager: EntityManager){
    const emitters: Record<PuzzleKnotType, { entity: number, emitter: ParticleEmitter, targetPosition: vec2 }> = Object.create(null)
    entry: {
        const entity = manager.createEntity()
        const targetPosition: vec2 = vec2()
        const emitter = manager.createComponent(entity, ParticleEmitter, {
            spawners: [
                BillboardParticle.bindProperty(BillboardParticle.set.position, AreaSampler.circle(targetPosition, vec2(80, 120))),
                BillboardParticle.bindProperty(BillboardParticle.set.rotation, function(this: BillboardParticle): number{
                    return Math.atan2(this.position[1] - targetPosition[1], this.position[0] - targetPosition[0])
                }),
                BillboardParticle.bindProperty(BillboardParticle.set.life, AreaSampler.static<number>(3)),
                BillboardParticle.bindProperty(BillboardParticle.set.originalSize, AreaSampler.range<number>(lerp)(20, 100)),
                BillboardParticle.bindProperty(
                    (particle: BillboardParticle & { speed: number }, value: number) => particle.speed = value,
                    AreaSampler.range<number>(lerp)(80, 160)
                )
            ],
            updaters: [
                function randomWalk(particle: BillboardParticle & { speed: number }, deltaTime: number){
                    particle.position[0] += deltaTime * particle.speed * Math.cos(particle.rotation)
                    particle.position[1] += deltaTime * particle.speed * Math.sin(particle.rotation)
                    particle.rotation -= deltaTime * randomFloat(-20, 20, rng)
                    particle.speed += deltaTime * randomFloat(-30, 30, rng)
                },
                BillboardParticle.bindProperty(BillboardParticle.set.opacity,
                    TweenSampler(lerp)(0, 1, ease.quadOut)
                ),
                BillboardParticle.bindProperty(BillboardParticle.set.size,
                    TweenSampler(lerp)(1, 0, ease.quadIn)
                )
            ],
            spawnRate: 0,
            spawnAmount: 16,
            timeScale: 1
        }) as ParticleEmitter
        manager.createComponent(entity, BillboardBatch, {
            order: Layer.EFFECTS,
            billboards: emitter.particles
        })
        manager.createComponent(entity, Material, {
            program: 0, blend: BlendMode.ADD,
            texture: 'effects/particle_c.png'
        })
        emitters[PuzzleKnotType.ENTRY] = { entity, emitter, targetPosition }
    }

    single: {
        const entity = manager.createEntity()
        const targetPosition: vec2 = vec2()
        const emitter = manager.createComponent(entity, ParticleEmitter, {
            spawners: [
                BillboardParticle.bindProperty(BillboardParticle.set.position, AreaSampler.circle(targetPosition, vec2(80, 120))),
                BillboardParticle.bindProperty(BillboardParticle.set.velocity, AreaSampler.targeted(
                    AreaSampler.static<vec2>(targetPosition),
                    vec2(-250, -80)
                )),
                BillboardParticle.bindProperty(BillboardParticle.set.life, AreaSampler.range<number>(lerp)(1, 2)),
                BillboardParticle.bindProperty(BillboardParticle.set.size, AreaSampler.range<number>(lerp)(20, 50)),
                BillboardParticle.bindProperty(BillboardParticle.set.friction, AreaSampler.static<number>(0.8))
            ],
            updaters: [
                verletIntegration,
                BillboardParticle.bindProperty(BillboardParticle.set.opacity,
                    TweenSampler(lerp)(0, 1, ease.fade)
                ),
                velocityRotation
            ],
            spawnRate: 0,
            spawnAmount: 48,
            timeScale: 1
        }) as ParticleEmitter
        manager.createComponent(entity, BillboardBatch, {
            order: Layer.EFFECTS,
            billboards: emitter.particles
        })
        manager.createComponent(entity, Material, {
            program: 0, blend: BlendMode.ADD,
            texture: 'effects/particle_b.png'
        })
        emitters[PuzzleKnotType.SINGLE] = { entity, emitter, targetPosition }
    }

    regrow: {
        const entity = manager.createEntity()
        const targetPosition: vec2 = vec2()
        const emitter = manager.createComponent(entity, ParticleEmitter, {
            spawners: [
                BillboardParticle.bindProperty(BillboardParticle.set.position, AreaSampler.circle(targetPosition, vec2(60, 100))),
                BillboardParticle.bindProperty(BillboardParticle.set.rotation, function(this: BillboardParticle): number{
                    return Math.atan2(this.position[1] - targetPosition[1], this.position[0] - targetPosition[0])
                }),
                BillboardParticle.bindProperty(BillboardParticle.set.life, AreaSampler.static<number>(2)),
                BillboardParticle.bindProperty(BillboardParticle.set.size, AreaSampler.range<number>(lerp)(10, 70)),
                BillboardParticle.bindProperty(
                    (particle: BillboardParticle & { speed: number }, value: number) => particle.speed = value,
                    AreaSampler.range<number>(lerp)(80, 160)
                ),
                function(particle: BillboardParticle & { phase: number, wavelength: number, amplitude: number }){
                    particle.phase = randomFloat(0, 2 * Math.PI, rng)
                    particle.wavelength = particle.lifetime * Math.PI * randomFloat(2, 3, rng)
                    particle.amplitude = randomFloat(-4 * Math.PI, 4 * Math.PI, rng)
                }
            ],
            updaters: [
                function wiggle(particle: BillboardParticle & { phase: number, wavelength: number, amplitude: number }, deltaTime: number){
                    const offset = deltaTime * particle.amplitude *
                    Math.sin(particle.phase + particle.wavelength * ease.sineOut(1 - particle.life))
                    particle.rotation += offset
                },
                function randomWalk(particle: BillboardParticle & { speed: number }, deltaTime: number){
                    particle.position[0] += deltaTime * particle.speed * Math.cos(particle.rotation)
                    particle.position[1] += deltaTime * particle.speed * Math.sin(particle.rotation)
                    particle.speed = Math.max(0, particle.speed + deltaTime * 50)
                },
                BillboardParticle.bindProperty(BillboardParticle.set.opacity,
                    TweenSampler(lerp)(0, 1, ease.fade)
                ),
                BillboardParticle.bindProperty(BillboardParticle.set.color,
                    TweenSampler<rgb>(rgb.lerp)(rgb(0xFF, 0xFF, 0xFF), rgb(0x77, 0xFF, 0x00), ease.sineOut), rgb()
                )
            ],
            spawnRate: 0,
            spawnAmount: 48,
            timeScale: 1
        }) as ParticleEmitter
        manager.createComponent(entity, BillboardBatch, {
            order: Layer.EFFECTS,
            billboards: emitter.particles
        })
        manager.createComponent(entity, Material, {
            program: 0, blend: BlendMode.ADD,
            texture: 'effects/particle_d.png'
        })
        emitters[PuzzleKnotType.REGROW] = { entity, emitter, targetPosition }
    }

    toggle: {
        const entity = manager.createEntity()
        const targetPosition: vec2 = vec2()
        const emitter = manager.createComponent(entity, ParticleEmitter, {
            spawners: [
                BillboardParticle.bindProperty(BillboardParticle.set.position, AreaSampler.circle(targetPosition, vec2(40, 100))),
                BillboardParticle.bindProperty(BillboardParticle.set.rotation, AreaSampler.range<number>(lerp)(0, 2 * Math.PI)),
                BillboardParticle.bindProperty(BillboardParticle.set.angularVelocity, AreaSampler.range<number>(lerp)(-0.2, 0.2)),
                BillboardParticle.bindProperty(BillboardParticle.set.velocity, AreaSampler.targeted(
                    AreaSampler.static<vec2>(targetPosition),
                    vec2(-150, -80)
                )),
                BillboardParticle.bindProperty(BillboardParticle.set.acceleration,
                    AreaSampler.range<vec2>(vec2.lerp, vec2())(vec2(0, -150), vec2(0, -50))),
                BillboardParticle.bindProperty(BillboardParticle.set.life, AreaSampler.range<number>(lerp)(1, 3)),
                BillboardParticle.bindProperty(BillboardParticle.set.originalSize, AreaSampler.range<number>(lerp)(20, 60)),
                function(particle: BillboardParticle & { phase: number, wavelength: number, amplitude: number }){
                    particle.phase = randomFloat(0, 2 * Math.PI, rng)
                    particle.wavelength = particle.lifetime * Math.PI * randomFloat(1, 3, rng)
                    particle.amplitude = randomFloat(400, 700, rng)
                }
            ],
            updaters: [
                function wiggle(particle: BillboardParticle & { phase: number, wavelength: number, amplitude: number }, deltaTime: number){
                    const offset = deltaTime * particle.amplitude *
                    Math.sin(particle.phase + particle.wavelength * ease.quadOut(1 - particle.life))
                    const angle = vec2.rotation(particle.velocity) + 0.5 * Math.PI
                    particle.velocity[0] += offset * Math.cos(angle)
                    particle.velocity[1] += offset * Math.sin(angle)
                },
                verletIntegration,
                BillboardParticle.bindProperty(BillboardParticle.set.opacity,
                    TweenSampler<number>(lerp)(1, 0, ease.quadIn)
                ),
                BillboardParticle.bindProperty(BillboardParticle.set.color,
                    TweenSampler<rgb>(rgb.lerp)(rgb(0xFF, 0xFF, 0xFF), rgb(0x00, 0xFF, 0xFF), ease.sineIn), rgb()
                ),
                BillboardParticle.bindProperty(BillboardParticle.set.size,
                    TweenSampler(lerp)(0, 1, ease.cubicOut)
                )
            ],
            spawnRate: 0,
            spawnAmount: 16,
            timeScale: 1
        }) as ParticleEmitter
        manager.createComponent(entity, BillboardBatch, {
            order: Layer.EFFECTS,
            billboards: emitter.particles
        })
        manager.createComponent(entity, Material, {
            program: 0, blend: BlendMode.ADD,
            texture: 'effects/particle_a.png'
        })
        emitters[PuzzleKnotType.TOGGLE] = { entity, emitter, targetPosition }
    }

    return function(knot: PuzzleKnot){
        const { emitter, targetPosition } = emitters[knot.type]
        const transform = manager.aquireComponent<Transform2D>(knot.entity, Transform2D)
        mat3x2.transform(vec2.ZERO, transform.globalTransform, targetPosition)
        emitter.emitParticles()

        if(knot.type === PuzzleKnotType.ENTRY)
            createEntryEmitter(manager, knot)
    }
}