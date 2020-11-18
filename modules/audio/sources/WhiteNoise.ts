import { EntityManager } from 'framework/EntityManager'
import { AudioChannel, AudioChannelOptions } from '../filters/AudioChannel'
import { scheduleAudioParameter, AudioRampEase } from '../scheduleAudioParameter'

interface WhiteNoiseOptions extends AudioChannelOptions {
}

export class WhiteNoise extends AudioChannel<WhiteNoiseOptions> {
    private source: AudioBufferSourceNode
    private buffer: AudioBuffer

    setup(options: WhiteNoiseOptions, manager: EntityManager){
        super.setup(options, manager)
        
        const bufferSize = 4096
        const channels = 2
        this.buffer = this.context.createBuffer(channels, bufferSize, this.context.sampleRate)
        for(let i = 0; i < bufferSize; i++)
        for(let r = Math.random() * 2 - 1, j = 0; j < channels; j++)
        this.buffer.getChannelData(j)[i] = r
    }
    play(){
        if(this.source) return
        this.source = this.context.createBufferSource()
        this.source.buffer = this.buffer
        this.source.loop = true

        this.source.onended = () => this.source = null

        this.source.connect(this.input)
        this.source.start(0)
    }
    stop(){
        if(!this.source) return
        this.source.stop()
    }
    reset(){
        if(this.source) this.source.disconnect()
        this.source = null
        super.reset()
    }
}