import { EntityManager } from 'framework/EntityManager'
import { AudioChannel, AudioChannelOptions } from './AudioChannel'
import { scheduleAudioParameter } from '../scheduleAudioParameter'

interface AudioCompressorOptions extends AudioChannelOptions {
    compressor: {
        threshold: number
        knee: number
        ratio: number
        attack: number
        release: number
    }
}

export class AudioCompressor extends AudioChannel<AudioCompressorOptions> {
    private compressor: DynamicsCompressorNode

    setup(options: AudioCompressorOptions, manager: EntityManager){
        super.setup(options, manager)

        this.compressor = this.context.createDynamicsCompressor()

        scheduleAudioParameter(this.context, this.compressor.threshold, options.compressor.threshold)
        scheduleAudioParameter(this.context, this.compressor.knee, options.compressor.knee)
        scheduleAudioParameter(this.context, this.compressor.ratio, options.compressor.ratio)
        scheduleAudioParameter(this.context, this.compressor.attack, options.compressor.attack)
        scheduleAudioParameter(this.context, this.compressor.release, options.compressor.release)

        this.compressor.connect(this.gain)
    }
    get input(): AudioNode { return this.compressor }
    reset(){
        this.compressor.disconnect()
        this.compressor = null
        super.reset()
    }
}