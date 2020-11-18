import { mat3x2, vec3 } from 'math'
import { ReusableComponent } from 'framework/ReusableComponent'
import { EntityManager } from 'framework/EntityManager'
import { Transform2D } from 'scene/Transform2D'

import { AudioSystem } from '../AudioSystem'
import { AudioChannel } from '../filters/AudioChannel'

interface SpatialAudioOptions {
    offset: vec3
    radius: number
}

export class SpatialAudio extends ReusableComponent<SpatialAudioOptions> {
    private static readonly position: vec3 = vec3()
    private static readonly orientation: vec3 = vec3()

    private readonly offset: vec3 = vec3(0, 0, 0)
    private panner: PannerNode
    lastFrame: number
    setup(options: SpatialAudioOptions, manager: EntityManager){
        this.lastFrame = -1
        vec3.copy(options.offset || vec3.ZERO, this.offset)

        const context = manager.resolveSystem(AudioSystem).context

        this.panner = context.createPanner()
        Object.assign(this.panner, {
            panningModel: 'HRTF',
            distanceModel: 'inverse',
            refDistance: options.radius,
            maxDistance: 10000,
            rolloffFactor: 1,
            coneInnerAngle: 360,
            coneOuterAngle: 0,
            coneOuterGain: 0
        })

        const inputChannel = manager.aquireComponent<AudioChannel<any>>(this.entity, AudioChannel)
        inputChannel.output.disconnect()
        inputChannel.output.connect(this.input)
        this.output.connect(inputChannel.resolveDestination(manager))
    }
    get output(): AudioNode { return this.panner }
    get input(): AudioNode { return this.panner }
    update(manager: EntityManager, { context, listener }: AudioSystem, frame: number){
        const transform = manager.aquireComponent<Transform2D>(this.entity, Transform2D, this.timeframe)

        if(transform && this.lastFrame < transform.lastFrame) this.lastFrame = -1
        if(this.lastFrame < listener.lastFrame) this.lastFrame = -1

        if(this.lastFrame != -1) return
        this.lastFrame = frame
        const { position, orientation } = SpatialAudio

        vec3.copy(this.offset, position)
        if(transform){
            mat3x2.transform(position as any, transform.globalTransform, position as any)
            vec3.subtract(listener.position, position, orientation)
            vec3.normalize(orientation, orientation)
        }else vec3.copy(vec3.AXIS_Y, orientation)

        this.panner.positionX.setValueAtTime(position[0], context.currentTime)
        this.panner.positionY.setValueAtTime(position[1], context.currentTime)
        this.panner.positionZ.setValueAtTime(position[2], context.currentTime)
        this.panner.orientationX.setValueAtTime(orientation[0], context.currentTime)
        this.panner.orientationY.setValueAtTime(orientation[1], context.currentTime)
        this.panner.orientationZ.setValueAtTime(orientation[2], context.currentTime)
    }
    reset(){
        this.panner.disconnect()
        this.panner = null
    }
}