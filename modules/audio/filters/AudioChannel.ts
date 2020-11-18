import { ReusableComponent } from 'framework/ReusableComponent'
import { EntityManager } from 'framework/EntityManager'
import { AudioSystem } from '../AudioSystem'
import { scheduleAudioParameter } from '../scheduleAudioParameter'

export interface AudioChannelOptions {
    volume: number
    channel: number
}

export class AudioChannel<Options extends AudioChannelOptions> extends ReusableComponent<Options> {
    static readonly delegate = AudioChannel

    protected context: AudioContext
    protected options: Options
    protected gain: GainNode

    setup(options: Options, manager: EntityManager){
        this.context = manager.resolveSystem(AudioSystem).context
        this.options = options

        this.gain = this.context.createGain()
        this.volume = options.volume

        if(this.output) this.output.connect(this.resolveDestination(manager))
    }
    resolveDestination(manager: EntityManager): AudioNode {
        if(!this.options.channel) return this.context.destination
        const channel = manager.aquireComponent<AudioChannel<Options>>(this.options.channel, AudioChannel, this.timeframe)
        return channel.input
    }
    get output(): AudioNode { return this.gain }
    get input(): AudioNode { return this.gain }
    get volume(): number { return this.options.volume }
    set volume(value: number){
        scheduleAudioParameter(this.context, this.gain.gain, this.options.volume = value)
    }
    reset(){
        this.gain.disconnect()
        this.gain = null
        this.context = this.options = null
    }
}