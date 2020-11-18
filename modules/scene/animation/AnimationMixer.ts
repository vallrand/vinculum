import { ObjectPool } from 'common/ObjectPool'
import { One, Zero } from 'common/static'
import { Interpolation, clamp, lerp, mod } from 'math/utilities'
import { EntityManager, ReusableComponent, IUpdateContext } from 'framework'
import { IUpdateComponent } from '../SceneUpdateSystem'
import { IAnimationSampler } from './AnimationSampler'

export interface AnimationPropertyBinding<T> {
    interpolate: Interpolation<T>
    initial: T
    prev?: T
    next?: T
    set(value: T): void
}

interface AnimationPropertyTimeline<T> extends AnimationPropertyBinding<T> {
    samplers: Record<string, IAnimationSampler<T>>
}

const fade = (min: number, max: number, value: number): number =>
    (min === max)
        ? value < min ? 0 : 1
        : clamp((value - min) / (max - min), 0, 1)

export class AnimationTrack {
    key: string
    elapsedTime: number
    endTime: number
    time: number
    duration: number
    fadeIn: (time: number) => number = One
    fadeOut: (time: number) => number = Zero
    intensity: number = 1
    weight: number
    timeScale: number = 1
    callback?: Function

    start(timeOffset: number = 0, fadeIn: number = 0): this {
        this.endTime = -1
        this.elapsedTime = -timeOffset
        this.fadeIn = fade.bind(this, 0, fadeIn)
        this.fadeOut = Zero
        return this
    }
    end(timeOffset: number = 0, fadeOut: number = 0): this {
        if(!this.alive) return this
        this.endTime = this.elapsedTime + timeOffset
        this.fadeOut = fade.bind(this, this.endTime - fadeOut, this.endTime)
        return this
    }
    get alive(): boolean {
        return this.endTime == -1 || this.endTime >= this.elapsedTime
    }
}

export class AnimationMixer extends ReusableComponent<AnimationPropertyTimeline<any>[]> implements IUpdateComponent {
    private static readonly trackPool: ObjectPool<AnimationTrack> = new ObjectPool<AnimationTrack>(index => new AnimationTrack)

    private transition: number = 0
    private timelines: AnimationPropertyTimeline<any>[]
    public readonly tracks: AnimationTrack[] = []
    private animations: { [animation: string]: { duration: number } }
    
    setup(timelines: AnimationPropertyTimeline<any>[]){
        this.timelines = timelines

        this.animations = Object.create(null)
        for(let i = 0; i < this.timelines.length; i++){
            const { samplers } = this.timelines[i]
            for(let key in samplers){
                const animation = this.animations[key] = this.animations[key] || { duration: 0 }
                animation.duration = Math.max(animation.duration, samplers[key].duration || 0)
            }
        }
    }
    reset(){
        this.tracks.length = 0
        this.animations = this.timelines = null
    }
    createAnimation(key: string, single?: boolean): AnimationTrack {
        const { duration } = this.animations[key]
        const track = AnimationMixer.trackPool.aquire()
        track.key = key
        track.duration = duration
        track.intensity = 1
        track.start(0, this.transition)
        this.tracks.push(track)
        if(single) track.end(duration, this.transition)
        return track
    }
    update(context: IUpdateContext, manager: EntityManager, deferred: Function[]): void {
        if(!this.tracks.length) return

        for(let i = this.tracks.length - 1; i >= 0; i--){
            const track = this.tracks[i]
            if(track.alive){
                track.elapsedTime += track.timeScale * context.deltaTime
                track.weight = track.intensity * track.fadeIn(track.elapsedTime) * (1 - track.fadeOut(track.elapsedTime))
            }else{
                this.tracks.splice(i, 1)
                if(track.callback) track.callback = void deferred.push(track.callback)
                AnimationMixer.trackPool.recycle(track)
            }
        }

        for(let i = 0; i < this.timelines.length; i++){
            const timeline = this.timelines[i]
            const { interpolate, samplers, initial, prev, next } = timeline
            let totalValue = null, totalWeight: number = 0
            for(let j = 0; j < this.tracks.length; j++){
                const { key, elapsedTime, weight } = this.tracks[j]
                const sampler = samplers[key]
                if(!sampler || !weight) continue
                const time = sampler.loop ? mod(Math.max(0, elapsedTime), sampler.duration || 0) : elapsedTime                
                totalWeight += weight
                totalValue = totalValue == null
                    ? sampler.call(timeline, time, prev)
                    : interpolate(totalValue, sampler.call(timeline, time, next), weight / totalWeight, prev)
            }
            if(!totalWeight) totalValue = initial
            else if(totalWeight < 1) totalValue = interpolate(initial, totalValue, totalWeight, prev)

            timeline.set(totalValue)
        }
    }
}