import { vec3 } from 'math/vec3'

export class ListenerTransform {
    private readonly tempPosition: vec3 = vec3(0, 0, 0)
    private readonly tempForward: vec3 = vec3(0, 0, -1)
    private readonly tempUp: vec3 = vec3(0, 1, 0)
    lastFrame: number = -1
    constructor(private readonly context: AudioContext){}
    get position(): vec3 { return this.tempPosition }
    set position(value: vec3){
        this.lastFrame = -1
        vec3.copy(value, this.tempPosition)
        this.context.listener.positionX.setValueAtTime(value[0], this.context.currentTime)
        this.context.listener.positionY.setValueAtTime(value[1], this.context.currentTime)
        this.context.listener.positionZ.setValueAtTime(value[2], this.context.currentTime)
    }
    get forward(): vec3 { return this.tempForward }
    set forward(value: vec3){
        this.lastFrame = -1
        vec3.copy(value, this.tempForward)
        this.context.listener.forwardX.setValueAtTime(value[0], this.context.currentTime)
        this.context.listener.forwardY.setValueAtTime(value[1], this.context.currentTime)
        this.context.listener.forwardZ.setValueAtTime(value[2], this.context.currentTime)
    }
    get up(): vec3 { return this.tempUp }
    set up(value: vec3){
        this.lastFrame = -1
        vec3.copy(value, this.tempUp)
        this.context.listener.upX.setValueAtTime(value[0], this.context.currentTime)
        this.context.listener.upY.setValueAtTime(value[1], this.context.currentTime)
        this.context.listener.upZ.setValueAtTime(value[2], this.context.currentTime)
    }
}