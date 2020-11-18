import { EntityManager } from 'framework/EntityManager'
import { Store } from 'loader/Store'

import { AudioResource } from '../DecodeAudio'
import { AudioChannel, AudioChannelOptions } from '../filters/AudioChannel'
import { scheduleAudioParameter, AudioRampEase } from '../scheduleAudioParameter'

interface AudioSourceOptions extends AudioChannelOptions {
    clip: string
    loop: boolean
    rate: number
}

export class AudioSource extends AudioChannel<AudioSourceOptions> {
    private resource: AudioResource
    private source: AudioBufferSourceNode
    public callback: Function

    setup(options: AudioSourceOptions, manager: EntityManager){
        super.setup(options, manager)
        this.resource = manager.resolveSystem(Store).requestSync<AudioResource>(options.clip)
    }
    play(offset: number = 0, fadeIn: number = 0){
        if(this.source) return
        this.source = this.context.createBufferSource()
        this.source.buffer = this.resource.buffer
        this.source.loop = this.options.loop
        this.source.loopStart = this.resource.loop
        this.source.loopEnd = this.resource.loop + this.resource.duration
        scheduleAudioParameter(this.context, this.source.playbackRate, this.options.rate)
        this.source.connect(this.input)

        this.source.onended = () => {
            this.source = null
            this.handleSourceEnd()
        }
        this.source.start(this.context.currentTime + offset, this.resource.offset, this.options.loop ? undefined : this.resource.duration)
        
        if(fadeIn && offset) scheduleAudioParameter(this.context, this.gain.gain, 0, offset)
        if(fadeIn) scheduleAudioParameter(this.context, this.gain.gain, this.options.volume, offset + fadeIn, AudioRampEase.LINEAR)
    }
    stop(offset: number = 0, fadeOut: number = 0){
        if(!this.source) return
        this.source.stop(this.context.currentTime + offset + fadeOut)

        if(fadeOut && offset) scheduleAudioParameter(this.context, this.gain.gain, this.options.volume, offset)
        if(fadeOut) scheduleAudioParameter(this.context, this.gain.gain, 0, offset + fadeOut, AudioRampEase.LINEAR)
    }
    get rate(): number { return this.options.rate }
    set rate(value: number){
        this.options.rate = value
        if(this.source) scheduleAudioParameter(this.context, this.source.playbackRate, this.options.rate)
    }
    reset(){
        if(this.source) this.source.disconnect()
        this.source = null
        super.reset()
    }
    private handleSourceEnd(){
        const { callback } = this
        this.callback = null
        if(callback) callback()
    }
}