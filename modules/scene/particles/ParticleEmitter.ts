import { ObjectPool } from 'common/ObjectPool'
import { EntityManager, ReusableComponent, IUpdateContext } from 'framework'
import { IUpdateComponent } from '../SceneUpdateSystem'

import { BillboardParticle } from './BillboardParticle'

export interface ParticleEmitterOptions {
    updaters: Array<(particle: BillboardParticle, deltaTime: number) => boolean>
    spawners: Array<(particle: BillboardParticle) => void>
    spawnAmount: number
    spawnRate: number
    timeScale: number
}

export class ParticleEmitter<Options extends ParticleEmitterOptions = ParticleEmitterOptions>
extends ReusableComponent<Options> implements IUpdateComponent {
    static readonly delegate = ParticleEmitter
    static readonly pool: ObjectPool<BillboardParticle> = new ObjectPool<BillboardParticle>(i => new BillboardParticle)
    public options: Options
    public readonly particles: BillboardParticle[] = []
    private remainingTime: number = 0
    setup(options: Options){
        this.options = options
        this.remainingTime = 0
    }
    reset(){
        for(let i = this.particles.length - 1; i >= 0; i--)
            ParticleEmitter.pool.recycle(this.particles[i])
        this.particles.length = 0
        this.options = null
    }
    update(context: IUpdateContext, manager: EntityManager): void {
        const { updaters, timeScale, spawnRate, spawnAmount } = this.options
        const deltaTime = context.deltaTime * timeScale

        let shift = 0
        for(let length = this.particles.length, i = 0; i < length; i++){
            const particle = this.particles[i]
            particle.life -= deltaTime / particle.lifetime
            for(let j = 0; j < updaters.length && particle.life > 0; j++) updaters[j](particle, deltaTime)
            if(shift) this.particles[i - shift] = particle
            if(particle.life > 0) continue
            ParticleEmitter.pool.recycle(particle.reset())
            shift++
        }
        this.particles.length -= shift

        if(spawnRate > 0)
        for(this.remainingTime -= deltaTime; this.remainingTime < -spawnRate;){
            this.remainingTime += spawnRate
            this.emitParticles(spawnAmount, -this.remainingTime)
        }
    }
    public emitParticles(amount: number = this.options.spawnAmount, deltaTime: number = 0): void {
        const { spawners, updaters } = this.options
        for(let i = amount; i > 0; i--){
            const particle = ParticleEmitter.pool.aquire()
            for(let j = 0; j < spawners.length; j++) spawners[j](particle)
            particle.life = 1 - deltaTime / particle.lifetime
            for(let j = 0; j < updaters.length && particle.life > 0; j++) updaters[j](particle, deltaTime)
            if(particle.life > 0) this.particles.push(particle)
            else ParticleEmitter.pool.recycle(particle.reset())
        }
    }
}