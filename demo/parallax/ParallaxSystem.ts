import { vec2, rgb, rgba, AABB, smoothstep, lerp, ease, randomFloat, randomInt } from 'math'
import { ProcedureSystem, EntityManager, IUpdateContext, DataView } from 'framework'
import { Transform2D, Camera2D } from 'scene'
import { TweenSampler, StaticSampler, AnimationMixer, AnimationTrack } from 'scene/animation'
import { ParticleEmitter, BillboardParticle, AreaSampler, verletIntegration, wrapParticle } from 'scene/particles'
import { Material, BillboardBatch, BlendMode } from 'renderer'

import { ParallaxLayer } from './ParallaxLayer'
import { rng, bindAnimationProperty, AnimationProperty } from '../helpers'
import { Layer } from '../terrain'
import { CameraSystem } from '../camera'

function randomSample(seed: number){
    const out = Math.sin(seed) * 10000
    return out - Math.floor(out)
}

const randomizeOffsetX = (seed: number) =>
(column: number, row: number, out: vec2) => vec2.fromValues(0.5 + 0.5 * (1 - 2 * randomSample(column + seed)), 0.5, out)

const layers = [{
    texture: 'terrain/line_a.png',
    color: rgba(0x4F, 0x4F, 0x4F, 0xFF),
    order: Layer.SKYBOX + 4,
    tileWidth: 32,
    //TODO offset is scale? and 2 is actual offset?
    offset: 0.8, scale: 2 * 0.8,
    randomize: randomizeOffsetX(1 * 1024)
}, {
    texture: 'terrain/line_c.png',
    color: rgba(0x5F, 0x5F, 0x5F, 0xFF),
    order: Layer.SKYBOX + 5,
    tileWidth: 28,
    offset: 0.7, scale: 0.9 * 2 * 0.7,
    randomize: randomizeOffsetX(2 * 1024)
}, {
    texture: 'terrain/line_b.png',
    color: rgba(0x6F, 0x6F, 0x6F, 0xFF),
    order: Layer.SKYBOX + 6,
    tileWidth: 24,
    offset: 0.6, scale: 0.8 * 2 * 0.6,
    randomize: randomizeOffsetX(3 * 1024)
}, {
    texture: 'terrain/pillar_a.png',
    color: rgba(0x8F, 0x8F, 0x8F, 0xFF),
    order: Layer.SKYBOX + 14,
    tileWidth: 12,
    offset: 0.5, scale: 0.72 * 2 * 0.5,
    randomize: randomizeOffsetX(4 * 1024)
}, {
    texture: 'terrain/pillar_b.png',
    color: rgba(0x9F, 0x9F, 0x9F, 0xFF),
    order: Layer.SKYBOX + 16,
    tileWidth: 10,
    offset: 0.4, scale: 0.64 * 2 * 0.4,
    randomize: randomizeOffsetX(5 * 1024)
}, ...[0,1,2].map(i => ({
    texture: `terrain/pillar_c_${i}.png`,
    color: rgba(0xAF, 0xAF, 0xAF, 0xFF),
    order: Layer.SKYBOX + 20 - i,
    tileWidth: 8,
    offset: 0.3, scale: 0.54 * 2 * 0.3,
    padding: vec2(0, i == 1 ? 0.5 : 0),
    randomize: i == 1 ? function(this: IUpdateContext, column: number, row: number, out: vec2): vec2 {
        randomizeOffsetX(6 * 1024)(column, row, out)
        out[1] = 1 - ((0.5 * this.elapsedTime)) % 1
        return out
    } : randomizeOffsetX(6 * 1024)
}))]

export class ParallaxSystem extends ProcedureSystem {
    private static readonly temp: vec2 = vec2() 
    readonly priority: number = -0x20
    private readonly layers: DataView<ParallaxLayer> = this.manager.aquireDataView<ParallaxLayer>(ParallaxLayer)
    private readonly view: AABB = AABB()
    private readonly paddedView: AABB = AABB()
    private readonly sky: number
    private readonly regions: Array<{ position: vec2, radius: vec2, track: AnimationTrack }>
    constructor(manager: EntityManager){
        super(manager)

        this.sky = manager.createEntity()
        manager.createComponent(this.sky, Material, {
            program: 0, blend: BlendMode.NORMAL, texture: 'terrain/sky.png', color: rgba.TRANSPARENT 
        })
        manager.createComponent(this.sky, ParallaxLayer, {
            tileWidth: 1, tileHeight: 1, offset: 0.05, maxZoom: 4, zoomRange: 1/8
        })
        manager.createComponent(this.sky, BillboardBatch, {
            billboards: manager.aquireComponent<ParallaxLayer>(this.sky, ParallaxLayer).tiles,
            order: Layer.SKYBOX
        })

        layers.forEach(({ texture, color, order, ...options }) => {
            const layer = manager.createEntity()
            manager.createComponent(layer, Material, {
                program: 0, blend: BlendMode.NORMAL, texture, color
            })
            manager.createComponent(layer, ParallaxLayer, { tileWidth: 1, tileHeight: 1, ...options })
            manager.createComponent(layer, BillboardBatch, {
                billboards: manager.aquireComponent<ParallaxLayer>(layer, ParallaxLayer).tiles,
                order
            })
        })

        const fog = manager.createEntity()
        manager.createComponent(fog, Transform2D, { position: vec2.ZERO })
        manager.createComponent(fog, Material, {
            program: 0, blend: BlendMode.NORMAL, texture: 'effects/fog.png'
        })
        manager.createComponent(fog, ParticleEmitter, {
            spawners: [
                BillboardParticle.bindProperty(BillboardParticle.set.position, AreaSampler.aabb(this.paddedView)),
                BillboardParticle.bindProperty(BillboardParticle.set.velocity, AreaSampler.aabb(AABB(-24, -24, 24, 24))),
                BillboardParticle.bindProperty(BillboardParticle.set.life, AreaSampler.range<number>(lerp)(6, 10)),
                BillboardParticle.bindProperty(BillboardParticle.set.rotation, AreaSampler.range<number>(lerp)(0, 2 * Math.PI)),
                BillboardParticle.bindProperty(BillboardParticle.set.angularVelocity, AreaSampler.range<number>(lerp)(-0.4, 0.4)),
                BillboardParticle.bindProperty(BillboardParticle.set.originalSize, AreaSampler.range<number>(lerp)(500, 1000))
            ],
            updaters: [
                verletIntegration,
                wrapParticle(this.paddedView),
                BillboardParticle.bindProperty(BillboardParticle.set.opacity,
                    TweenSampler(lerp)(0, 0.5, ease.fade)
                    ),
                BillboardParticle.bindProperty(BillboardParticle.set.size,
                    TweenSampler(lerp)(1, 2, ease.quadOut)
                )
            ],
            spawnRate: 0.8,
            spawnAmount: 0,
            timeScale: 1
        })
        manager.createComponent(fog, BillboardBatch, {
            order: Layer.SKYBOX + 128,
            billboards: manager.aquireComponent<ParticleEmitter>(fog, ParticleEmitter).particles
        })


        const fireflies = manager.createEntity()
        manager.createComponent(fireflies, Transform2D, { position: vec2.ZERO })
        manager.createComponent(fireflies, Material, {
            program: 0, blend: BlendMode.ADD, texture: 'effects/particle_h.png', color: rgba.WHITE
        })
        manager.createComponent(fireflies, ParticleEmitter, {
            spawners: [
                BillboardParticle.bindProperty(BillboardParticle.set.position, AreaSampler.aabb(this.view)),
                BillboardParticle.bindProperty(BillboardParticle.set.life, AreaSampler.range<number>(lerp)(2, 5)),
                BillboardParticle.bindProperty(BillboardParticle.set.color, AreaSampler.static<rgb>(
                    manager.aquireComponent<Material>(fireflies, Material).color as any
                )),
                BillboardParticle.bindProperty(BillboardParticle.set.rotation, AreaSampler.range<number>(lerp)(0, 2 * Math.PI)),
                BillboardParticle.bindProperty(BillboardParticle.set.originalSize, AreaSampler.range<number>(lerp)(15, 50)),
                BillboardParticle.bindProperty(
                    (particle: BillboardParticle & { speed: number }, value: number) => particle.speed = value,
                    AreaSampler.range<number>(lerp)(40, 80)
                )
            ],
            updaters: [
                function randomWalk(particle: BillboardParticle & { speed: number }, deltaTime: number){
                    const speedScale = particle.scale[0] / 30
                    particle.position[0] += deltaTime * speedScale * particle.speed * Math.cos(particle.rotation)
                    particle.position[1] += deltaTime * speedScale * particle.speed * Math.sin(particle.rotation)
                    particle.rotation -= deltaTime * randomFloat(-30, 30, rng)
                },
                wrapParticle(this.view),
                BillboardParticle.bindProperty(BillboardParticle.set.size,
                    TweenSampler(lerp)(0, 1, (t: number) => 2*Math.sqrt(t*(1-t)))
                )
            ],
            spawnRate: 1,
            spawnAmount: 0,
            timeScale: 1
        })

        manager.createComponent(fireflies, BillboardBatch, {
            order: Layer.EFFECTS - 4,
            billboards: manager.aquireComponent<ParticleEmitter>(fireflies, ParticleEmitter).particles
        })

        manager.createComponent(this.sky, AnimationMixer, [
            bindAnimationProperty(manager, this.sky, AnimationProperty.color, [
                StaticSampler<rgba>(rgba(0x08, 0x00, 0x00, 0xFF)),
                StaticSampler<rgba>(rgba(0xAF, 0x2A, 0x2A, 0xFF)),
                StaticSampler<rgba>(rgba(0x0E, 0xFF, 0x9E, 0xFF)),
                StaticSampler<rgba>(rgba(0x0C, 0x6E, 0x14, 0xFF)),
                StaticSampler<rgba>(rgba(0x3A, 0x1F, 0x4C, 0xFF))
            ] as any),
            bindAnimationProperty(manager, fog, AnimationProperty.spawnAmount, [
                StaticSampler<number>(1),
                StaticSampler<number>(1),
                StaticSampler<number>(0),
                StaticSampler<number>(0),
                StaticSampler<number>(1)
            ] as any),
            bindAnimationProperty(manager, fireflies, AnimationProperty.color, [
                StaticSampler<rgba>(rgba.WHITE),
                StaticSampler<rgba>(rgba(0xFF, 0x1F, 0x1F, 0xFF)),
                StaticSampler<rgba>(rgba(0x3F, 0xFF, 0xFF, 0xFF)),
                StaticSampler<rgba>(rgba(0x7F, 0xFF, 0x3F, 0xFF)),
                StaticSampler<rgba>(rgba.WHITE)
            ] as any),
            bindAnimationProperty(manager, fireflies, AnimationProperty.spawnAmount, [
                StaticSampler<number>(0),
                StaticSampler<number>(2),
                StaticSampler<number>(4),
                StaticSampler<number>(6),
                StaticSampler<number>(0)
            ] as any)
        ])

        //TODO config?
        this.regions = [{
            position: vec2(8500, 400),
            radius: vec2(1024, 2048)
        }, {
            position: vec2(0, 0),
            radius: vec2(2048, 6000)
        }, {
            position: vec2(18000, 1700),
            radius: vec2(2048, 8192)
        }, {
            position: vec2(-8000, 2000),
            radius: vec2(2048, 8192)
        }, {
            position: vec2(8000, -6000),
            radius: vec2(2048, 4000)
        }].map((marker, i) => ({
            ...marker,
            track: manager.aquireComponent<AnimationMixer>(this.sky, AnimationMixer).createAnimation(`${i}`, false)
        }))
    }
    execute(context: IUpdateContext){
        const camera = this.manager.resolveSystem(CameraSystem).camera
        const bounds: AABB = this.manager.aquireComponent<Camera2D>(camera, Camera2D).bounds
        AABB.padding(bounds, 10, this.view)
        AABB.padding(bounds, 1000, this.paddedView)


        const center = vec2.fromValues(
            0.5 * (bounds[0] + bounds[2]),
            0.5 * (bounds[1] + bounds[3]),
            ParallaxSystem.temp
        )

        for(let i = this.regions.length - 1; i >= 0; i--){
            const marker = this.regions[i]
            const distance = vec2.distance(marker.position, center)
            marker.track.intensity = smoothstep(marker.radius[1], marker.radius[0], distance)
        }

        const layers: ParallaxLayer[] = this.layers.data as any
        for(let i = layers.length - 1; i >= 0; i--) layers[i].update(this.manager, context, bounds)
    }
}