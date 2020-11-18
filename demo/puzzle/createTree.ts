import { vec2, vec3, AABB, mat3x2, rgb, rgba, lerp, step, ease, randomInt } from 'math'
import { ProcedureSystem, EntityManager, IUpdateContext, DataView } from 'framework'
import { Transform2D, AnimationMixer, KeyframeSampler, TweenSampler } from 'scene'
import { Material, BlendMode, Curve, Mesh2D, Sprite2D, BillboardBatch } from 'renderer'
import { ParticleEmitter, BillboardParticle, AreaSampler, verletIntegration, velocityRotation } from 'scene/particles'
import { AudioSource, SpatialAudio } from 'audio'

import { SoundscapeSystem } from '../soundscape'
import { Layer, Tree } from '../terrain'

import { rng } from '../helpers'
import { PuzzleKnotType } from './constants'
import { PuzzleKnot } from './PuzzleKnot'

export function createTree(manager: EntityManager, x: number, y: number){
    const tree = manager.createEntity()
    manager.createComponent(tree, Transform2D, { position: vec2(x, y + 200) })
    manager.createComponent(tree, Material, {
        program: 0, blend: BlendMode.NORMAL, texture: 'terrain/branch.png'
    })
    manager.createComponent(tree, Tree, {
        iterations: 12, branchingFactor: 0.4, width: 100, length: 120
    }) as Tree
    manager.createComponent(tree, Mesh2D, {
        order: Layer.BACKGROUND - 4,
        ...manager.aquireComponent<Tree>(tree, Tree).calculateVertexData()
    })

    const particles = manager.createEntity()
    manager.createComponent(particles, Transform2D, { parent: tree })
    const emitter = manager.createComponent(particles, ParticleEmitter, {
        spawners: [
            BillboardParticle.bindProperty(BillboardParticle.set.position, AreaSampler.aabb(AABB(-160,-20,160,20))),
            BillboardParticle.bindProperty(BillboardParticle.set.acceleration, 
                AreaSampler.range<vec2>(vec2.lerp, vec2())(vec2(0, -500), vec2(0, -200))
            ),
            BillboardParticle.bindProperty(BillboardParticle.set.rotation, AreaSampler.static<number>(0.5 * Math.PI)),
            BillboardParticle.bindProperty(BillboardParticle.set.life, AreaSampler.static<number>(2)),
            BillboardParticle.bindProperty(function(target: BillboardParticle, value: number){
                target.originalScale[1] = value
                target.originalScale[0] = 10 * value
            }, AreaSampler.range<number>(lerp)(5, 50)),
            BillboardParticle.bindProperty(BillboardParticle.set.color, (time: number, out: rgb): rgb => {
                out[0] = 0xFF
                out[1] = 0.5 * (out[2] = randomInt(0x00, 0xFF, rng))
                return out
            }, rgb())
        ],
        updaters: [
            verletIntegration,
            BillboardParticle.bindProperty(BillboardParticle.set.opacity,
                TweenSampler(lerp)(1, 0, ease.quadIn)
            ),
            BillboardParticle.bindProperty(BillboardParticle.set.size,
                TweenSampler(lerp)(0, 1, ease.quadOut)
            )
        ],
        spawnRate: 0.4,
        spawnAmount: 0,
        timeScale: 2
    }) as ParticleEmitter
    manager.createComponent(particles, BillboardBatch, {
        order: Layer.EFFECTS, billboards: emitter.particles
    })
    manager.createComponent(particles, Material, {
        program: 0, blend: BlendMode.ADD, texture: 'effects/particle_f.png'
    })

    manager.createComponent(tree, AudioSource, {
        clip: 'sfx/tree_grow.mp3', loop: false, volume: 1, rate: 1.5, channel: manager.resolveSystem(SoundscapeSystem).sfx
    })
    manager.createComponent(tree, SpatialAudio, {
        offset: vec3(0,0,0), radius: 512
    })


    return { tree, particles }
}