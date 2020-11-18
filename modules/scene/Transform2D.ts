import { vec2 } from 'math/vec2'
import { mat3x2 } from 'math/mat3x2'
import { Transform } from './Transform'

interface Transform2DOptions {
    position: vec2
    rotation: number
    scale: vec2
    parent: number
}

export class Transform2D extends Transform<Transform2DOptions> {
    readonly localPosition: vec2 = vec2(0, 0)
    readonly localScale: vec2 = vec2(1, 1)
    localRotation: number = 0
    
    readonly globalTransform: mat3x2 = mat3x2()
    
    setup(options: Transform2DOptions){
        this.lastFrame = -1
        this.parent = options.parent || 0
        this.localRotation = options.rotation || 0
        vec2.copy(options.position || vec2.ZERO, this.localPosition)
        vec2.copy(options.scale || [1,1], this.localScale)
    }
    reset(){}
    calculateTransform(parentTransform: Transform2D, frame: number): void {
        if(parentTransform && parentTransform.lastFrame > this.lastFrame) this.lastFrame = -1
        if(this.lastFrame != -1) return
        this.lastFrame = frame

        const { localPosition, localRotation, localScale, globalTransform } = this

        mat3x2.fromTransform(
            localPosition[0], localPosition[1],
            0, 0,
            localScale[0], localScale[1],
            localRotation, 0, 0,
            globalTransform
        )

        if(parentTransform)
            mat3x2.multiply(parentTransform.globalTransform, globalTransform, globalTransform)
    }
}