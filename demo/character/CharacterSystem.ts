import { vec2, vec3, rgba, mat3x2 } from 'math'
import { ProcedureSystem, EntityManager, IUpdateContext } from 'framework'
import { Transform2D } from 'scene'
import { AnimationMixer, FrameSampler, StaticSampler } from 'scene/animation'
import { Material, Sprite2D, TextureResource } from 'renderer'
import { RigidBody, BodyType, Box } from 'physics'
import { AudioSource, SpatialAudio } from 'audio'
import { KeyboardSystem } from 'interaction'
import { Store } from 'loader/Store'

import { CharacterController } from './CharacterController'
import { CharacterAnimation, ControlKey } from './constants'
import { AnimationProperty, bindAnimationProperty, bindAnimationTrigger } from '../helpers'
import { spritesheetAnimation } from './spritesheetAnimation'

import { PuzzleSystem } from '../puzzle'
import { SoundscapeSystem } from '../soundscape'
import { Layer } from '../terrain'
import { createFloorDust } from './createFloorDust'

export class CharacterSystem extends ProcedureSystem {
    readonly priority: number = -0x20
    public readonly character: number
    private hold: boolean = false
    private readonly sounds = {
        steps: null,
        land: null
    }
    private readonly floorDust: (globalTransform: mat3x2) => void
    constructor(manager: EntityManager){
        super(manager)

        this.character = this.manager.createEntity()
        this.manager.createComponent(this.character, Transform2D, { position: [0, 0] })
        this.manager.createComponent(this.character, Material, {
            program: 0, color: rgba.WHITE, blend: 1, texture: 'satellite/frame0000.png'
        })
        this.manager.createComponent(this.character, Sprite2D, { order: Layer.MIDGROUND + 2, origin: [0.5, 0.5] })
        this.manager.createComponent(this.character, RigidBody, {
            mass: 1, type: BodyType.KINEMATIC, shapes: [
                new Box(vec2(0, 0), 0, 80, 200, { collisionGroup: 0x02 })
            ]
        })

        this.sounds.steps = this.manager.createEntity()
        this.manager.createComponent(this.sounds.steps, Transform2D, { parent: this.character })
        this.manager.createComponent(this.sounds.steps, AudioSource, {
            clip: 'sfx/steps.mp3', loop: true, volume: 1, rate: 1, channel: this.manager.resolveSystem(SoundscapeSystem).sfx
        })
        this.manager.createComponent(this.sounds.steps, SpatialAudio, {
            offset: vec3(0, 0, 0), radius: 256
        })

        this.sounds.land = this.manager.createEntity()
        this.manager.createComponent(this.sounds.land, Transform2D, { parent: this.character })
        this.manager.createComponent(this.sounds.land, AudioSource, {
            clip: 'sfx/land.mp3', loop: false, volume: 1, rate: 1, channel: this.manager.resolveSystem(SoundscapeSystem).sfx
        })
        this.manager.createComponent(this.sounds.land, SpatialAudio, {
            offset: vec3(0, 0, 0), radius: 256
        })

        const store = this.manager.resolveSystem(Store)
        this.manager.createComponent(this.character, AnimationMixer, [
            bindAnimationProperty(
                this.manager, this.character, AnimationProperty.diffuse, Object.keys(spritesheetAnimation)
                .reduce((animations, animation) => ({
                    ...animations,
                    [animation]: FrameSampler<TextureResource>(spritesheetAnimation[animation].map(texture =>
                        store.requestSync<TextureResource>(texture)
                    ), 16)
                }), {})
            )
        ])

        this.manager.createComponent(this.character, CharacterController, {
            collisionMask: 0x01,
            padding: 0.5,
            threshold: 8,
            offset: [0, 100],
            maxAscendAngle: 1,
            maxDescendAngle: 1,
            gravity: 978
        })
        
        this.floorDust = createFloorDust(this.manager)
    }
    execute(context: IUpdateContext){
        const keys = this.manager.resolveSystem(KeyboardSystem)
        const left: number = +keys.keyDown(ControlKey.LEFT)
        const right: number = +keys.keyDown(ControlKey.RIGHT)
        const up: number = +keys.keyDown(ControlKey.UP)
        const down: number = +keys.keyDown(ControlKey.DOWN)
        const action: boolean = keys.keyDown(ControlKey.ACTION)
        const actionStart = !this.hold && action
        this.hold = action

        const controller = this.manager.aquireComponent<CharacterController>(this.character, CharacterController)
        controller.input[0] = right - left
        controller.input[1] = down - up

        const animation = this.manager.aquireComponent<AnimationMixer>(this.character, AnimationMixer)
        const lastTrack = animation.tracks[animation.tracks.length - 1]
        let currentAnimation = lastTrack ? lastTrack.key : null
        switch(currentAnimation){
            case null:
                controller.velocity[0] = 0
                break
            case CharacterAnimation.RUN:
            case CharacterAnimation.JUMP:
            case CharacterAnimation.JUMP_FALL:
            case CharacterAnimation.FALL:
                if(controller.direction[0] * controller.input[0] < 0) controller.input[0] = 0
                break
            case CharacterAnimation.LAND:
                controller.velocity[0] = 0
            default: vec2.copy(vec2.ZERO, controller.input)
        }

        controller.update(context, this.manager)

        let nextAnimation: CharacterAnimation = !controller.flags.below
        ? (controller.direction[1] < 0 ? CharacterAnimation.JUMP : CharacterAnimation.FALL)
        : (controller.input[0] == 0 || controller.flags.left || controller.flags.right ? null : CharacterAnimation.RUN)

        const transform = this.manager.aquireComponent<Transform2D>(this.character, Transform2D)
        transform.localScale[0] = controller.direction[0]

        const puzzles = this.manager.resolveSystem(PuzzleSystem)
        const trigger = puzzles.updatePuzzle(transform.globalTransform, 120, currentAnimation === null && actionStart)

        if(currentAnimation === null && actionStart)
            nextAnimation = trigger ? CharacterAnimation.ACTION : CharacterAnimation.FIDGET
        if(currentAnimation === CharacterAnimation.FIDGET || currentAnimation === CharacterAnimation.ACTION)
            nextAnimation = currentAnimation
        if(currentAnimation === CharacterAnimation.LAND || currentAnimation === CharacterAnimation.RUN_IDLE)
            currentAnimation = null
        else if(currentAnimation === CharacterAnimation.JUMP_FALL)
            currentAnimation = CharacterAnimation.FALL

        if(currentAnimation !== nextAnimation){
            if(currentAnimation !== CharacterAnimation.FALL && nextAnimation === CharacterAnimation.RUN)
                this.manager.aquireComponent<AudioSource>(this.sounds.steps, AudioSource).play()
            else
                this.manager.aquireComponent<AudioSource>(this.sounds.steps, AudioSource).stop()

            for(let i = animation.tracks.length - 1; i >= 0; i--) animation.tracks[i].end(0, 0)
            if(currentAnimation === CharacterAnimation.RUN && nextAnimation == null){
                if(lastTrack.elapsedTime > 0.36) animation.createAnimation(CharacterAnimation.RUN_IDLE, true)
            }else if(currentAnimation === CharacterAnimation.JUMP && nextAnimation === CharacterAnimation.FALL){
                const delay = animation.createAnimation(CharacterAnimation.JUMP_FALL, true).duration
                animation.createAnimation(CharacterAnimation.FALL).start(delay, 0)
            }else if(currentAnimation === CharacterAnimation.FALL && (nextAnimation == null || nextAnimation === CharacterAnimation.RUN)){
                this.floorDust(transform.globalTransform)
                this.manager.aquireComponent<AudioSource>(this.sounds.land, AudioSource).play()
                if(lastTrack.elapsedTime > 0.36) animation.createAnimation(CharacterAnimation.LAND, true)
            }else if(nextAnimation === CharacterAnimation.ACTION || nextAnimation === CharacterAnimation.FIDGET)
                animation.createAnimation(nextAnimation, true)
            else if(nextAnimation) animation.createAnimation(nextAnimation)
        }
    }
}