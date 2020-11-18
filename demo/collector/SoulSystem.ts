import { DisjointSet } from 'common'
import { vec2, mat3x2, rgb, rgba, lerp, step, ease } from 'math'
import { ProcedureSystem, EntityManager, IUpdateContext, DataView } from 'framework'
import { Transform2D, TargetComponent, AnimationMixer, KeyframeSampler } from 'scene'
import { Material, BlendMode, Curve, Sprite2D } from 'renderer'
import { AudioSource } from 'audio'
import { scheduleAudioParameter, AudioRampEase } from 'audio/scheduleAudioParameter'

import { Layer } from '../terrain'
import { SoundscapeSystem } from '../soundscape'
import { CharacterSystem } from '../character'
import { createSoulEater } from './createSoulEater'
import { SoulEater } from './SoulEater'
import { SoulEaterAnimation } from './constants'
import { createGlitch } from '../effects'

export interface SoulSetup {
}

export class SoulSystem extends ProcedureSystem {
    private readonly eater: number
    constructor(manager: EntityManager, options: SoulSetup){
        super(manager)

        this.eater = createSoulEater(this.manager)
    }
    execute(context: IUpdateContext){
        const soulEater = this.manager.aquireComponent(this.eater, SoulEater) as SoulEater

        const target = this.manager.aquireComponent<TargetComponent>(this.eater, TargetComponent)
        const position = target.calculatePosition()
        const distance = vec2.magnitude(position)

        const animation = this.manager.aquireComponent<AnimationMixer>(this.eater, AnimationMixer)
        const lastTrack = animation.tracks[animation.tracks.length - 1]
        let currentAnimation = lastTrack ? lastTrack.key : null
        switch(currentAnimation){
            case SoulEaterAnimation.WAKE:
            case SoulEaterAnimation.AWAKE: {
                if(distance < 1600 || lastTrack.endTime != -1) break
                for(let i = animation.tracks.length - 1; i >= 0; i--) animation.tracks[i].end(1, 1)
                animation.createAnimation(SoulEaterAnimation.SLEEP, true)

                const theme = this.manager.resolveSystem(SoundscapeSystem).theme
                const audioSource = this.manager.aquireComponent<AudioSource>(theme, AudioSource) as any
                scheduleAudioParameter(audioSource.context, audioSource.gain.gain, audioSource.options.volume, 3, AudioRampEase.LINEAR)
                break
            }
            case SoulEaterAnimation.CONSUME:
                break
            case null: {
                if(distance > 1250 || position[1] <= 0) break
                const delay = animation.createAnimation(SoulEaterAnimation.WAKE, true).duration
                animation.createAnimation(SoulEaterAnimation.AWAKE).start(delay, 0)

                const theme = this.manager.resolveSystem(SoundscapeSystem).theme
                const audioSource = this.manager.aquireComponent<AudioSource>(theme, AudioSource) as any
                scheduleAudioParameter(audioSource.context, audioSource.gain.gain, 0, 0, AudioRampEase.STEP, true)

                createGlitch(this.manager)(4)
            }
        }
    }
}