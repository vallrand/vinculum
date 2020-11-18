import { vec2, AABB, rgba, ease, lerp, mat3x2 } from 'math'
import { EntityManager } from 'framework'
import { TweenSampler } from 'scene/animation'
import { ParticleEmitter, BillboardParticle, AreaSampler, verletIntegration } from 'scene/particles'
import { Material, BillboardBatch, BlendMode } from 'renderer'

import { Layer } from '../terrain'

export function createFloorDust(manager: EntityManager){
    const entity = manager.createEntity()
    const spawnPosition: vec2 = vec2()
    const offset: vec2 = vec2(0, 100)
    const emitter = manager.createComponent(entity, ParticleEmitter, {
        spawners: [
            BillboardParticle.bindProperty(BillboardParticle.set.velocity, AreaSampler.aabb(AABB(-100, -20, 100, 20))),
            BillboardParticle.bindProperty(BillboardParticle.set.position, AreaSampler.static<vec2>(spawnPosition)),
            BillboardParticle.bindProperty(BillboardParticle.set.life, AreaSampler.range<number>(lerp)(0.6, 1.4)),
            BillboardParticle.bindProperty(BillboardParticle.set.rotation, AreaSampler.range<number>(lerp)(0, 2 * Math.PI)),
            BillboardParticle.bindProperty(BillboardParticle.set.angularVelocity, AreaSampler.range<number>(lerp)(-0.1, 0.1)),
            BillboardParticle.bindProperty(BillboardParticle.set.originalSize, AreaSampler.range<number>(lerp)(20, 60))
        ],
        updaters: [
            verletIntegration,
            BillboardParticle.bindProperty(BillboardParticle.set.opacity,
                TweenSampler(lerp)(0, 1, ease.fade)
                ),
            BillboardParticle.bindProperty(BillboardParticle.set.size,
                TweenSampler(lerp)(1, 2, ease.quadOut)
            )
        ],
        spawnRate: 0,
        spawnAmount: 12,
        timeScale: 1
    }) as ParticleEmitter
    manager.createComponent(entity, BillboardBatch, {
        order: Layer.FOREGROUND,
        billboards: emitter.particles
    })
    manager.createComponent(entity, Material, {
        program: 0, blend: BlendMode.NORMAL,
        texture: 'effects/smoke.png'
    })

    return function(globalTransform: mat3x2){
        mat3x2.transform(offset, globalTransform, spawnPosition)
        emitter.emitParticles()
    }
}