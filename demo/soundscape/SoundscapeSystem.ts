import { mat3x2, vec3, vec2, rgb, rgba } from 'math'
import { ProcedureSystem, EntityManager, IUpdateContext, DataView } from 'framework'
import { Transform2D } from 'scene/Transform2D'
import { AudioSystem, AudioChannel, AudioCompressor, AudioSource, SpatialAudio } from 'audio'

import { CameraSystem } from '../camera'

export class SoundscapeSystem extends ProcedureSystem {
    readonly priority: number = -0x20
    private readonly position: vec3 = vec3()
    public readonly sfx: number
    public readonly music: number

    public theme: number
    constructor(manager: EntityManager){
        super(manager)

        this.music = this.manager.createEntity()
        this.sfx = this.manager.createEntity()

        this.manager.createComponent(this.music, AudioChannel, {
            volume: 0.5
        })

        this.manager.createComponent(this.sfx, AudioCompressor, {
            volume: 0.5,
            compressor: {
                threshold: -24,
                knee: 30,
                ratio: 12,
                attack: 0.003,
                release: 0.25
            }
        })
    }
    execute(context: IUpdateContext){
        if(!this.theme){
            this.theme = this.manager.createEntity()
            this.manager.createComponent(this.theme, AudioSource, {
                clip: 'music/theme-a.mp3', loop: true, volume: 1, rate: 1, channel: this.music
            })
            this.manager.aquireComponent<AudioSource>(this.theme, AudioSource).play(1, 1)
        }

        const camera = this.manager.resolveSystem(CameraSystem).camera
        const listener = this.manager.resolveSystem(AudioSystem).listener
        const transform = this.manager.aquireComponent<Transform2D>(camera, Transform2D)
        if(transform.lastFrame > 0 && transform.lastFrame <= listener.lastFrame) return

        vec3.copy(vec3.ZERO, this.position)
        mat3x2.transform(this.position as any, transform.globalTransform, this.position as any)
        listener.position = this.position
    }
}