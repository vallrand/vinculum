import { Zero, Void } from 'common/static'
import { vec2, rgb, rgba, range, lerp, ease, randomInt, randomFloat, shuffle } from 'math'
import { EntityManager } from 'framework'
import { GroupComponent, Transform2D, TargetComponent } from 'scene'
import { AnimationMixer, KeyframeSampler, StaticSampler, TweenSampler } from 'scene/animation'
import { ParticleEmitter, BillboardParticle, AreaSampler, verletIntegration, velocityRotation } from 'scene/particles'
import { AudioSource, SpatialAudio } from 'audio'
import { Sprite2D, Curve, BillboardBatch, Material, BlendMode } from 'renderer'

import { rng, AnimationProperty, bindAnimationProperty, bindAnimationTrigger } from '../helpers'
import { Layer } from '../terrain'
import { SoulEaterAnimation } from './constants'

import { SoundscapeSystem } from '../soundscape'
import { CharacterSystem } from '../character'
import { Feeler } from './Feeler'
import { SoulEater } from './SoulEater'

export function createSoulEater(manager: EntityManager): number {
    const entity = manager.createEntity()
    manager.createComponent(entity, Transform2D, { position: [8500, -200] })

    const hub = manager.createEntity()
    manager.createComponent(hub, Transform2D, { parent: entity, position: [0, -280] })

    const hub_parts = ['e', 'd', 'c', 'glass', 'b', 'a'].map((key, i) => {
        const part = manager.createEntity()
        manager.createComponent(part, Transform2D, { parent: hub })
        manager.createComponent(part, Sprite2D, { origin: Sprite2D.CENTER, order: Layer.MIDGROUND - 24 + i * 4 })
        manager.createComponent(part, Material, { program: 0, blend: BlendMode.NORMAL, texture: `eater/hub_${key}.png` })
        return part
    })

    const hub_glow = manager.createEntity()
    manager.createComponent(hub_glow, Transform2D, { parent: hub_parts[5] })
    manager.createComponent(hub_glow, Sprite2D, { origin: Sprite2D.CENTER, order: Layer.EFFECTS })
    manager.createComponent(hub_glow, Material, {
        program: 0, blend: BlendMode.ADD, texture: 'eater/hub_glow.png',
        color: rgba(0xFF, 0xFF, 0xFF, 0x00)
    })

    const neck = manager.createEntity()
    manager.createComponent(neck, Transform2D, { parent: entity })
    manager.createComponent(neck, Material, { program: 0, blend: BlendMode.NORMAL, texture: 'eater/neck.png' })
    manager.createComponent(neck, Curve, { order: Layer.MIDGROUND - 20, smoothness: 1, path: [] })

    const rings = range(3).map(index => {
        const ring = manager.createEntity()
        manager.createComponent(ring, Transform2D, { parent: entity })

        const top = manager.createEntity()
        manager.createComponent(top, Transform2D, { parent: ring })
        manager.createComponent(top, Material, { program: 0, blend: BlendMode.NORMAL, texture: 'eater/ring_top.png' })
        manager.createComponent(top, Sprite2D, { origin: Sprite2D.CENTER, order: Layer.MIDGROUND - 17 })

        const back = manager.createEntity()
        manager.createComponent(back, Transform2D, { parent: ring })
        manager.createComponent(back, Material, { program: 0, blend: BlendMode.NORMAL, texture: 'eater/ring_back.png' })
        manager.createComponent(back, Sprite2D, { origin: Sprite2D.CENTER, order: Layer.MIDGROUND - 22 })

        const glow = manager.createEntity()
        manager.createComponent(glow, Transform2D, { parent: ring })
        manager.createComponent(glow, Material, {
            program: 0, blend: BlendMode.ADD, texture: 'eater/ring_glow.png', color: rgba(0xFF, 0xFF, 0xFF, 0x00)
        })
        manager.createComponent(glow, Sprite2D, { origin: Sprite2D.CENTER, order: Layer.EFFECTS })

        return { ring, top, back, glow }
    })

    const head = manager.createEntity()
    manager.createComponent(head, Transform2D, { parent: entity })

    const head_glow = manager.createEntity()
    manager.createComponent(head_glow, Transform2D, { parent: head })
    manager.createComponent(head_glow, Material, {
        program: 0, blend: BlendMode.ADD, texture: 'eater/head_glow.png', color: rgba(0xFF, 0xFF, 0xFF, 0x00)
    })
    manager.createComponent(head_glow, Sprite2D, { origin: Sprite2D.CENTER, order: Layer.EFFECTS })

    const head_top = manager.createEntity()
    manager.createComponent(head_top, Transform2D, { parent: head })
    manager.createComponent(head_top, Material, { program: 0, blend: BlendMode.NORMAL, texture: 'eater/head_top.png' })
    manager.createComponent(head_top, Sprite2D, { origin: Sprite2D.CENTER, order: Layer.MIDGROUND - 18 })

    const head_back = manager.createEntity()
    manager.createComponent(head_back, Transform2D, { parent: head })
    manager.createComponent(head_back, Material, { program: 0, blend: BlendMode.NORMAL, texture: 'eater/head_back.png' })
    manager.createComponent(head_back, Sprite2D, { origin: Sprite2D.CENTER, order: Layer.MIDGROUND - 20 })

    const targetEntity = manager.resolveSystem(CharacterSystem).character
    const segments = 36
    const hub_feelers = shuffle(range(segments).map(i => i * 2 * Math.PI / segments), rng)
    .slice(0, randomInt(4, 12, rng)).map(angle => {
        const size = randomFloat(0.8, 1.2, rng)
        const feeler = manager.createEntity()
        manager.createComponent(feeler, Transform2D, { parent: hub, rotation: angle })
        manager.createComponent(feeler, Material, { program: 0, blend: BlendMode.NORMAL, texture: 'eater/feeler.png' })
        manager.createComponent(feeler, Curve, { smoothness: 1, thickness: [size * 1.4], path: [], order: Layer.MIDGROUND - 16 })
        manager.createComponent(feeler, TargetComponent, targetEntity)
        manager.createComponent(feeler, Feeler, {
            length: 10,
            spacing: size * 100
        })
    })

    const head_feelers = range(6).map(i => {
        const feeler = manager.createEntity()
        manager.createComponent(feeler, Transform2D, {
            parent: head,
            rotation: Math.PI * randomFloat(-0.1, 0.1, rng),
            position: vec2(0, randomFloat(-50, 50, rng))
        })
        manager.createComponent(feeler, Material, { program: 0, blend: BlendMode.NORMAL, texture: 'eater/feeler.png' })
        manager.createComponent(feeler, Curve, { smoothness: 1, thickness: [0.6], path: [], order: Layer.MIDGROUND - 19 })
        manager.createComponent(feeler, TargetComponent, targetEntity)
        manager.createComponent(feeler, Feeler, {
            length: 6,
            spacing: 75
        })
    })

    const hub_particles = manager.createEntity()
    manager.createComponent(hub_particles, Transform2D, { parent: hub })
    const hub_emitter = manager.createComponent(hub_particles, ParticleEmitter, {
        spawners: [
            BillboardParticle.bindProperty(BillboardParticle.set.position, AreaSampler.circle(vec2.ZERO, vec2(150, 200))),
            BillboardParticle.bindProperty(BillboardParticle.set.velocity, AreaSampler.targeted(
                AreaSampler.static<vec2>(vec2.ZERO),
                vec2(-300, -200)
            )),
            BillboardParticle.bindProperty(BillboardParticle.set.life, AreaSampler.range<number>(lerp)(1, 2)),
            BillboardParticle.bindProperty(BillboardParticle.set.originalSize,  AreaSampler.range<number>(lerp)(16, 80)),
            BillboardParticle.bindProperty(BillboardParticle.set.friction, AreaSampler.static<number>(0.6))
        ],
        updaters: [
            verletIntegration,
            BillboardParticle.bindProperty(BillboardParticle.set.opacity,
                TweenSampler(lerp)(1, 0, ease.cubicIn)
            ),
            BillboardParticle.bindProperty(
                (particle: BillboardParticle, value: number) =>
                    particle.scale[0] = 3 * (particle.scale[1] = particle.originalScale[0] * value),
                TweenSampler(lerp)(0, 1, ease.quadOut)
            ),
            velocityRotation
        ],
        spawnRate: 0,
        spawnAmount: 42,
        timeScale: 1
    }) as ParticleEmitter
    manager.createComponent(hub_particles, BillboardBatch, {
        order: Layer.EFFECTS,
        billboards: hub_emitter.particles
    })
    manager.createComponent(hub_particles, Material, {
        program: 0, blend: BlendMode.ADD,
        texture: 'effects/particle_e.png'
    })

    const head_particles = manager.createEntity()
    manager.createComponent(head_particles, Transform2D, { parent: entity })
    const head_emitter = manager.createComponent(head_particles, ParticleEmitter, {
        spawners: [
            function fromHead(particle: BillboardParticle){
                const transform = manager.aquireComponent<Transform2D>(head, Transform2D)
                const { position, velocity } = particle
                vec2.fromValues(50, randomFloat(-20, 20, rng), position)
                vec2.rotate(position, transform.localRotation, position)
                vec2.add(position, transform.localPosition, position)

                vec2.fromValues(200, 0, velocity)
                vec2.rotate(velocity, transform.localRotation, velocity)
            },
            BillboardParticle.bindProperty(BillboardParticle.set.acceleration, AreaSampler.static<vec2>(vec2(0, 1500))),
            BillboardParticle.bindProperty(BillboardParticle.set.life, AreaSampler.range<number>(lerp)(0.5, 1)),
            BillboardParticle.bindProperty(BillboardParticle.set.originalSize, AreaSampler.range<number>(lerp)(10, 40))
        ],
        updaters: [
            verletIntegration,
            BillboardParticle.bindProperty(
                (particle: BillboardParticle, value: number) =>
                    particle.scale[0] = 2 * (particle.scale[1] = particle.originalScale[0] * value),
                TweenSampler(lerp)(0, 1, ease.fade)
            ),
            BillboardParticle.bindProperty(BillboardParticle.set.color,
                TweenSampler<rgb>(rgb.lerp)(rgb(0xFF, 0x00, 0x00), rgb.WHITE, ease.sineIn), rgb()),
            velocityRotation
        ],
        spawnRate: 0.2,
        spawnAmount: 0,
        timeScale: 1
    }) as ParticleEmitter
    manager.createComponent(head_particles, BillboardBatch, {
        order: Layer.MIDGROUND - 19,
        billboards: head_emitter.particles
    })
    manager.createComponent(head_particles, Material, {
        program: 0, blend: BlendMode.NORMAL,
        texture: 'effects/drop.png'
    })

    const enableSound = manager.createEntity()
    manager.createComponent(enableSound, Transform2D, { parent: entity })
    const enableSoundEmitter = manager.createComponent(enableSound, AudioSource, {
        clip: 'sfx/eater_enable.mp3', loop: false, volume: 1, rate: 1, channel: manager.resolveSystem(SoundscapeSystem).sfx
    }) as AudioSource
    manager.createComponent(enableSound, SpatialAudio, { radius: 256 })

    const closeSound = manager.createEntity()
    manager.createComponent(closeSound, Transform2D, { parent: entity })
    const closeSoundEmitter = manager.createComponent(closeSound, AudioSource, {
        clip: 'sfx/eater_close.mp3', loop: false, volume: 1, rate: 1, channel: manager.resolveSystem(SoundscapeSystem).sfx
    }) as AudioSource
    manager.createComponent(closeSound, SpatialAudio, { radius: 256 })

    const idleSound = manager.createEntity()
    manager.createComponent(idleSound, Transform2D, { parent: head })
    const idleSoundEmitter = manager.createComponent(idleSound, AudioSource, {
        clip: 'sfx/eater_idle.mp3', loop: true, volume: 1, rate: 1, channel: manager.resolveSystem(SoundscapeSystem).sfx
    }) as AudioSource
    manager.createComponent(idleSound, SpatialAudio, { radius: 128 })

    manager.createComponent(entity, TargetComponent, targetEntity)
    manager.createComponent(entity, SoulEater, {
        segments: 24,
        curve: neck,
        parts: [ ...rings.map(({ ring }) => ring), head ]
    })

    manager.createComponent(entity, AnimationMixer, [
        bindAnimationTrigger(manager, function(){
            closeSoundEmitter.play()
            idleSoundEmitter.stop(1, 1)
        }, {
            [SoulEaterAnimation.SLEEP]: Object.assign(StaticSampler<number>(1), { duration: 1 })
        }),
        bindAnimationTrigger(manager, function(){
            hub_emitter.emitParticles()
            enableSoundEmitter.play()
            idleSoundEmitter.play(1, 1)
        }, {
            [SoulEaterAnimation.WAKE]: StaticSampler<number>(1)
        }),
        bindAnimationProperty(manager, head_particles, {
            component: ParticleEmitter,
            interpolate: lerp,
            initial: Zero,
            set(target: ParticleEmitter, value: number): void { (target as any).options.spawnAmount = value } 
        }, {
            [SoulEaterAnimation.AWAKE]: StaticSampler<number>(1)
        }),
        bindAnimationProperty(manager, hub_parts[5], AnimationProperty.rotation, {
            [SoulEaterAnimation.WAKE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 1.4, value: -0.2 * Math.PI, ease: ease.quadOut },
                { time: 2, value: 0, ease: ease.sineIn }
            ]),
            [SoulEaterAnimation.AWAKE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 8, value: 2 * Math.PI, ease: ease.linear }
            ])
        }),
        bindAnimationProperty(manager, hub_parts[4], AnimationProperty.rotation, {
            [SoulEaterAnimation.WAKE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 1.4, value: 0.4 * Math.PI, ease: ease.quadOut },
                { time: 2, value: 0, ease: ease.sineIn }
            ]),
            [SoulEaterAnimation.AWAKE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 6, value: -2 * Math.PI, ease: ease.linear }
            ])
        }),
        bindAnimationProperty(manager, hub_parts[1], AnimationProperty.rotation, {
            [SoulEaterAnimation.AWAKE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 2, value: 2 * Math.PI, ease: ease.linear }
            ])
        }),
        bindAnimationProperty(manager, hub_glow, AnimationProperty.opacity, {
            [SoulEaterAnimation.WAKE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 0.5, value: 1, ease: ease.quadOut },
                { time: 2, value: 0, ease: ease.quadIn }
            ]),
            [SoulEaterAnimation.AWAKE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 3, value: 0.5, ease: ease.sineIn },
                { time: 6, value: 0, ease: ease.sineOut }
            ])
        }),
        bindAnimationProperty(manager, head_glow, AnimationProperty.opacity, {
            [SoulEaterAnimation.WAKE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 0.5, value: 1, ease: ease.quadOut },
                { time: 2, value: 0, ease: ease.quadIn }
            ]),
            [SoulEaterAnimation.AWAKE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 1, value: 0.75, ease: ease.sineOut },
                { time: 3, value: 0, ease: ease.sineIn }
            ])
        }),
        ...rings.map(({ glow }, i) => bindAnimationProperty(manager, glow, AnimationProperty.opacity, {
            [SoulEaterAnimation.WAKE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 0.5, value: 1, ease: ease.quadOut },
                { time: 2, value: 0, ease: ease.quadIn }
            ]),
            [SoulEaterAnimation.AWAKE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 0 + 0.25 * i, value: 0 },
                { time: 0.5 + 0.25 * i, value: 0.75, ease: ease.sineOut },
                { time: 1 + 0.25 * i, value: 0, ease: ease.sineIn },
                { time: 1 + 0.25 * (rings.length - 1), value: 0 }
            ])
        })),
        bindAnimationProperty(manager, entity, {
            component: SoulEater,
            interpolate: lerp,
            initial(target: SoulEater): number { return target.attract },
            set(target: SoulEater, value: number): void {
                if(target.attract != value) target.lastFrame = -1
                target.attract = value
            }
        }, {
            [SoulEaterAnimation.WAKE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 2, value: 1, ease: ease.sineInOut }
            ]),
            [SoulEaterAnimation.AWAKE]: StaticSampler<number>(1)
        })
    ])

    return entity
}