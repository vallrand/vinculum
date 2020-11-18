import { EntityManager } from 'framework/EntityManager'
import { AudioChannel, AudioChannelOptions } from './AudioChannel'

interface ReverbOptions extends AudioChannelOptions {
    duration: number
    decay: number
}

export class Reverb extends AudioChannel<ReverbOptions> {
    private convolver: ConvolverNode
    setup(options: ReverbOptions, manager: EntityManager){
        super.setup(options, manager)

        this.convolver = this.context.createConvolver()
        //this.preDelay = this.context.createDelay(reverbTime)

        this.gain.connect(this.convolver)
        this.output.connect(this.resolveDestination(manager))
    }
    get output(): AudioNode { return this.convolver }
    update(){
        const rate = this.context.sampleRate
        const length = rate * this.options.duration
        const decay = this.options.decay
        const impulse = this.context.createBuffer(2, length, rate)
        const left = impulse.getChannelData(0)
        const right = impulse.getChannelData(1)
        for(let i = 0; i < length; i++){
            left[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay)
            right[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay)
        }
        this.convolver.buffer = impulse
    }
    reset(){
        this.convolver.disconnect()
        this.convolver = null
        super.reset()
    }
} 
  









