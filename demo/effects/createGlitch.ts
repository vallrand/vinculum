import { vec2, lerp, ease } from 'math'
import { EntityManager } from 'framework'
import { ShaderMaterial, Material, BlendMode } from 'renderer'
import { Transform2D, Camera2D } from 'scene'
import { AnimationMixer, KeyframeSampler } from 'scene/animation'
import { AudioSource, SpatialAudio } from 'audio'

import { CameraSystem } from '../camera'
import { SoundscapeSystem } from '../soundscape'

const fragmentSource = <string> require('./glitch_frag.glsl')

export const createGlitch = (manager: EntityManager) =>
function create(duration: number = 1){
    const camera = manager.resolveSystem(CameraSystem).camera
    
    const entity = manager.createEntity()
    const material = manager.createComponent(entity, ShaderMaterial, {
        blend: BlendMode.NONE,
        fragmentSource,
        attributes: {
            uTime: 0,
            uIntensity: 0
        }
    }) as ShaderMaterial

    const animationKey = 'play'
    const animation = manager.createComponent(entity, AnimationMixer, [{
        initial: 0, interpolate: lerp,
        set(value: number){ material.attributes['uTime'] = value },
        samplers: {
            [animationKey]: (time: number) => time
        }
    }, {
        initial: 0, interpolate: lerp,
        set(value: number){ material.attributes['uIntensity'] = value },
        samplers: {
            [animationKey]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 0.5 * duration, value: 1, ease: ease.quadOut },
                { time: duration, value: 0, ease: ease.quadIn }
            ])
        }
    }]) as AnimationMixer

    manager.createComponent(entity, AudioSource, {
        clip: 'sfx/glitch.mp3', loop: false, volume: 1, rate: 1, channel: manager.resolveSystem(SoundscapeSystem).sfx
    })

    const node = manager.aquireComponent<Camera2D>(camera, Camera2D) as any
    node.timeframe = manager.linkEntity(entity, node.postEffects, node.timeframe)

    manager.aquireComponent<AudioSource>(entity, AudioSource).play()

    const track = animation.createAnimation(animationKey, true)
    track.callback = manager.removeEntity.bind(manager, entity)
}