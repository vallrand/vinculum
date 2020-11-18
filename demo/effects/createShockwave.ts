import { vec2, vec3, lerp, ease } from 'math'
import { EntityManager } from 'framework'
import { ShaderMaterial, Material, BlendMode } from 'renderer'
import { Transform2D, Camera2D } from 'scene'
import { AnimationMixer, KeyframeSampler } from 'scene/animation'
import { AudioSource, SpatialAudio } from 'audio'

import { CameraSystem } from '../camera'
import { SoundscapeSystem } from '../soundscape'

const vertexSource = <string> require('./shockwave_vert.glsl')
const fragmentSource = <string> require('./shockwave_frag.glsl')

export const createShockwave = (manager: EntityManager) =>
function create(position: vec2){
    const camera = manager.resolveSystem(CameraSystem).camera
    
    const entity = manager.createEntity()
    const material = manager.createComponent(entity, ShaderMaterial, {
        blend: BlendMode.NONE,
        vertexSource,
        fragmentSource,
        attributes: {
            uRadius: 0,
            uAmplitude: 0,
            uCenter: vec2(0, 0)
        }
    }) as ShaderMaterial

    const animationKey = 'play'
    const animation = manager.createComponent(entity, AnimationMixer, [{
        initial: 0, interpolate: lerp,
        set(value: number){ material.attributes['uRadius'] = value },
        samplers: {
            [animationKey]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 0.3, value: 800, ease: ease.quadOut },
                { time: 0.8, value: 200, ease: ease.quadOut },
                { time: 2, value: 1200, ease: ease.sineOut }
            ])
        }
    }, {
        initial: 0, interpolate: lerp,
        set(value: number){ material.attributes['uAmplitude'] = value },
        samplers: {
            [animationKey]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 0.3, value: -0.6, ease: ease.quadOut },
                { time: 0.8, value: 0.4, ease: ease.sineInOut },
                { time: 2, value: 0, ease: ease.sineInOut }
            ])
        }
    }]) as AnimationMixer

    manager.createComponent(entity, AudioSource, {
        clip: 'sfx/shockwave.mp3', loop: false, volume: 1, rate: 1, channel: manager.resolveSystem(SoundscapeSystem).sfx
    })
    manager.createComponent(entity, SpatialAudio, {
        offset: vec3(position[0], position[1], 0), radius: 512
    })

    const node = manager.aquireComponent<Camera2D>(camera, Camera2D) as any
    node.timeframe = manager.linkEntity(entity, node.postEffects, node.timeframe)

    material.attributes['uCenter'] = position
    const track = animation.createAnimation(animationKey, true)

    const soundEffect = manager.aquireComponent<AudioSource>(entity, AudioSource)
    soundEffect.callback = manager.removeEntity.bind(manager, entity)
    soundEffect.play()
    //track.callback = manager.removeEntity.bind(manager, entity)
}