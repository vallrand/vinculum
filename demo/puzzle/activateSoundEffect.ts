import { vec2 } from 'math'
import { EntityManager } from 'framework'
import { AudioSource, SpatialAudio } from 'audio'
import { Transform2D } from 'scene'

import { PuzzleKnot } from './PuzzleKnot'
import { PuzzleKnotAnimation, PuzzleKnotType } from './constants'
import { SoundscapeSystem } from '../soundscape'

export function wireSoundEffect(manager: EntityManager, position: vec2){
    const entity = manager.createEntity()

    manager.createComponent(entity, Transform2D, { position })
    const emitter = manager.createComponent(entity, AudioSource, {
        clip: 'sfx/wire.mp3', loop: false, volume: 1, rate: 1, channel: manager.resolveSystem(SoundscapeSystem).sfx
    }) as AudioSource
    manager.createComponent(entity, SpatialAudio, {
        radius: 128
    })

    emitter.play()
    emitter.callback = manager.removeEntity.bind(manager, entity)
}

export function activateSoundEffect(manager: EntityManager){
    const sounds = {
        [PuzzleKnotType.ENTRY]: {
            [PuzzleKnotAnimation.ENABLE]: 'sfx/knot_a_enable.mp3',
            [PuzzleKnotAnimation.OPEN]: 'sfx/knot_a_open.mp3',
            [PuzzleKnotAnimation.CLOSE]: 'sfx/knot_a_close.mp3'
        },
        [PuzzleKnotType.SINGLE]: {
            [PuzzleKnotAnimation.ENABLE]: 'sfx/knot_b_enable.mp3',
            [PuzzleKnotAnimation.OPEN]: 'sfx/knot_b_open.mp3',
            [PuzzleKnotAnimation.CLOSE]: 'sfx/knot_b_close.mp3'
        },
        [PuzzleKnotType.REGROW]: {
            [PuzzleKnotAnimation.ENABLE]: 'sfx/knot_c_enable.mp3',
            [PuzzleKnotAnimation.OPEN]: 'sfx/knot_c_open.mp3',
            [PuzzleKnotAnimation.CLOSE]: 'sfx/knot_c_close.mp3'
        },
        [PuzzleKnotType.TOGGLE]: {
            [PuzzleKnotAnimation.ENABLE]: 'sfx/knot_d_enable.mp3',
            [PuzzleKnotAnimation.OPEN]: 'sfx/knot_d_open.mp3',
            [PuzzleKnotAnimation.CLOSE]: 'sfx/knot_d_close.mp3'
        }
    }
    const soundscape = manager.resolveSystem(SoundscapeSystem)

    return function play(knot: PuzzleKnot, animation: PuzzleKnotAnimation){
        const entity = manager.createEntity()
        manager.createComponent(entity, Transform2D, { parent: knot.entity })
        const emitter = manager.createComponent(entity, AudioSource, {
            clip: sounds[knot.type][animation], loop: false, volume: 1, rate: 1, channel: soundscape.sfx
        }) as AudioSource
        manager.createComponent(entity, SpatialAudio, {
            radius: 128
        })
    
        emitter.play()
        emitter.callback = manager.removeEntity.bind(manager, entity)
    }
}