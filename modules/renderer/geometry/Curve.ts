import { vec2 } from 'math/vec2'
import { lerp, clamp, linearGradient } from 'math/utilities'
import { cubicInterpolation } from 'math/curve'
import { Transform2D } from 'scene/Transform2D'
import { Geometry2D } from './Geometry2D'
import { Material } from '../Material'

export interface CurveOptions {
    order: number
    smoothness: number
    thickness: number[]
    path: vec2[]
    uvScale: vec2
    uvOffset: vec2
}

export class Curve extends Geometry2D<CurveOptions> {
    private static readonly temp0: vec2 = vec2()
    private static readonly temp1: vec2 = vec2()
    public vertices: Float32Array = new Float32Array(0)
    public uvs: Uint32Array = new Uint32Array(0)
    public indices: Uint16Array = new Uint16Array(0)

    public lastTextureIndex: number = -1
    public lastFrame: number = -1

    private uvArray: Float32Array = new Float32Array(0)
    private smoothness: number = 1
    public readonly curve: vec2[] = []
    private envelope: (value: number) => number
    readonly uvOffset: vec2 = vec2(0, 0)
    readonly uvScale: vec2 = vec2(1, 1)
    private width: number = 0

    public set thickness(values: number[]){
        this.envelope = values ? linearGradient(lerp)(values) : null
        this.lastFrame = -1
    }
    public set path(values: vec2[]){
        const maxIndex = values.length - 1
        const length = values.length * this.smoothness | 0
        this.curve.length = length
        if(this.smoothness > 1) for(let i = 0; i < length; i++){
            const factor = maxIndex * i / (length - 1)
            const index = factor | 0
            this.curve[i] = cubicInterpolation(
                values[Math.max(index - 1, 0)],
                values[index],
                values[Math.min(index + 1, maxIndex)],
                values[Math.min(index + 2, maxIndex)],
                factor - index,
                1, this.curve[i] || vec2()
            )
        }
        else for(let i = 0; i < length; i++)
            this.curve[i] = vec2.copy(values[i], this.curve[i] || vec2())
        this.lastFrame = this.lastTextureIndex = -1
    }
    setup(options: CurveOptions){
        this.lastTextureIndex = -1
        this.lastFrame = -1
        this.order = options.order
        vec2.copy(options.uvOffset || vec2.ZERO, this.uvOffset)
        vec2.copy(options.uvScale || [1,1], this.uvScale)
        this.thickness = options.thickness
        this.path = options.path || []
    }
    reallocate(){
        const vertexCount = 4 * this.curve.length
        const quads = this.curve.length - 1
        if(this.vertices.length === vertexCount) return

        this.uvArray = new Float32Array(vertexCount)
        this.vertices = new Float32Array(vertexCount)
        this.uvs = new Uint32Array(vertexCount / 2)
        this.indices = new Uint16Array(6 * quads)
        for(let i = 0; i < quads; i++){
            this.indices[i * 6 + 0] = i * 2 + 0
            this.indices[i * 6 + 1] = i * 2 + 1
            this.indices[i * 6 + 2] = i * 2 + 2

            this.indices[i * 6 + 3] = i * 2 + 2
            this.indices[i * 6 + 4] = i * 2 + 1
            this.indices[i * 6 + 5] = i * 2 + 3
        }
        this.lastFrame = this.lastTextureIndex = -1
    }
    calculateVertexData(transform: Transform2D, material: Material, frame: number): void {
        if(this.lastFrame == -1) this.reallocate()

        if(this.lastTextureIndex != material.diffuse.index){
            this.lastTextureIndex = material.diffuse.index
            if(this.lastFrame == -1) this.updateUVs(this.uvArray as any)
            this.recalculateUVs(this.uvArray as any, material.diffuse.uvTransform, this.uvs)
            if(this.width != material.diffuse.height){
                this.width = material.diffuse.height
                this.lastFrame = -1
            }
        }

        if(transform && this.lastFrame < transform.lastFrame) this.lastFrame = -1

        if(this.lastFrame != -1) return
        this.lastFrame = frame
        this.updateVertices(this.width, this.vertices as any)
        if(transform) this.recalculateVertices(this.vertices as any, transform.globalTransform, this.vertices)
        this.recalculateBoundingBox()
    }
    private updateUVs(uvs: number[]){
        const path = this.curve
        const offsetU = this.uvOffset[0], offsetV = this.uvOffset[1]
        const scaleU = this.uvScale[0], scaleV = this.uvScale[1]
        const v0 = clamp(offsetV, 0, 1), v1 = clamp(scaleV + offsetV, 0, 1)
        for(let length = path.length, i = 0; i < length; i++){
            const value = i / (length - 1)
            uvs[i * 4 + 0] = uvs[i * 4 + 2] = clamp(scaleU * value + offsetU, 0, 1)
            uvs[i * 4 + 1] = v0
            uvs[i * 4 + 3] = v1
        }
    }
    private updateVertices(width: number, vertices: number[]){
        const path = this.curve
        const { temp0, temp1 } = Curve
        vec2.copy(vec2.ZERO, temp0)
        for(let length = path.length, i = 0; i < length; i++){
            const prev = path[i]
            const next = path[i + 1] || prev

            vec2.subtract(next, prev, temp1)
            vec2.normalize(temp1, temp1)

            vec2.add(temp0, temp1, temp0)
            vec2.normalize(temp0, temp0)
            vec2.rotate90cw(temp0, temp0)
            vec2.scale(temp0,  (
                this.envelope ? this.envelope(i / (length - 1)) : 1
            ) * 0.5 * width, temp0)

            vertices[i * 4 + 0] = prev[0] + temp0[0]
            vertices[i * 4 + 1] = prev[1] + temp0[1]
            vertices[i * 4 + 2] = prev[0] - temp0[0]
            vertices[i * 4 + 3] = prev[1] - temp0[1]
            vec2.copy(temp1, temp0)
        }
    }
    reset(){}
}