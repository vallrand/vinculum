import { vec2 } from 'math/vec2'
import { mat3x2 } from 'math/mat3x2'
import { rgba } from 'math/rgba'
import { int32pow2Ceil } from 'math/utilities'
import { Transform2D } from 'scene/Transform2D'
import { Material } from '../Material'
import { TextureResource } from '../UploadTexture'
import { Geometry2D } from './Geometry2D'

interface Billboard {
    position: vec2
    rotation: number
    scale: vec2
    color: rgba
}

interface BillboardBatchOptions {
    order: number
    billboards: Billboard[]
}

export class BillboardBatch extends Geometry2D<BillboardBatchOptions> {
    private static readonly QUAD_UVS = [0,0,1,0,1,1,0,1]
    public vertices: Float32Array = new Float32Array(0)
    public uvs: Uint32Array = new Uint32Array(0)
    public indices: Uint16Array = new Uint16Array(0)
    public colors: Uint32Array = new Uint32Array(0)

    lastFrame = -1

    private vertexBuffer: Float32Array = new Float32Array(0)
    private uvBuffer: Uint32Array = new Uint32Array(0)
    private indexBuffer: Uint16Array = new Uint16Array(0)
    private colorBuffer: Uint32Array = new Uint32Array(0)

    public billboards: Billboard[]

    setup(options: BillboardBatchOptions){
        this.order = options.order || 0
        this.billboards = options.billboards
    }
    private reallocate(count: number){
        const vertexCount = count * 4
        const indexCount = count * 6

        if(this.indices.length == indexCount) return
        if(this.indexBuffer.length < indexCount){
            const nextCount = int32pow2Ceil(count)
            this.indexBuffer = new Uint16Array(6 * nextCount)
            for(let i = 0; i < nextCount; i++){
                this.indexBuffer[i * 6 + 0] = i * 4 + 0
                this.indexBuffer[i * 6 + 1] = i * 4 + 1
                this.indexBuffer[i * 6 + 2] = i * 4 + 2
                this.indexBuffer[i * 6 + 3] = i * 4 + 0
                this.indexBuffer[i * 6 + 4] = i * 4 + 2
                this.indexBuffer[i * 6 + 5] = i * 4 + 3
            }
            this.vertexBuffer = new Float32Array(2 * 4 * nextCount)
            this.uvBuffer = new Uint32Array(4 * nextCount)
            this.colorBuffer = new Uint32Array(4 * nextCount)
        }

        this.vertices = this.vertexBuffer.subarray(0, vertexCount * 2)
        this.uvs = this.uvBuffer.subarray(0, vertexCount)
        this.colors = this.colorBuffer.subarray(0, vertexCount)
        this.indices = this.indexBuffer.subarray(0, indexCount)
        this.lastFrame = -1
    }
    calculateVertexData(transform: Transform2D, material: Material, frame: number): void {
        if(!this.billboards.length && !this.indices.length) return
        this.lastFrame = -1 //TODO skip when?
        if(this.lastFrame == -1) this.reallocate(this.billboards.length)

        if(transform && this.lastFrame < transform.lastFrame) this.lastFrame = -1
        if(this.lastFrame != -1) return
        this.lastFrame = frame

        this.loadBatch(this.billboards, material.diffuse)
        
        if(transform) this.recalculateVertices(this.vertices as any, transform.globalTransform, this.vertices)
        this.recalculateBoundingBox()
    }
    private loadBatch(billboards: Billboard[], texture: TextureResource){
        const { vertices, uvs, colors } = this

        const left = texture.frame[0] / texture.width - 0.5
        const right = left + texture.frame[2] / texture.width
        const top = texture.frame[1] / texture.height - 0.5
        const bottom = top + texture.frame[3] / texture.height

        for(let i = 0; i < billboards.length; i++){
            const { position, rotation, scale, color } = billboards[i]
            const colorHex = rgba.uint8Hex(color)
            const index = i * 4

            colors[index + 0] = colors[index + 1] = colors[index + 2] = colors[index + 3] = colorHex
            this.recalculateUVs(BillboardBatch.QUAD_UVS, texture.uvTransform || mat3x2.IDENTITY, uvs, index)

            const sin = Math.sin(rotation), cos = Math.cos(rotation)
            const x = position[0], y = position[1]

            const x0 = cos * scale[0] * -left
            const x1 = sin * scale[0] * right
            const y0 = -sin * scale[1] * -top
            const y1 = cos * scale[1] * bottom

            vertices[index * 2 + 0] = -x0 - y0 + x
            vertices[index * 2 + 1] = -x1 - y1 + y
            vertices[index * 2 + 2] = x0 - y0 + x
            vertices[index * 2 + 3] = x1 - y1 + y
            vertices[index * 2 + 4] = x0 + y0 + x
            vertices[index * 2 + 5] = x1 + y1 + y
            vertices[index * 2 + 6] = -x0 + y0 + x
            vertices[index * 2 + 7] = -x1 + y1 + y
        }
    }
    reset(){
        this.billboards = null
    }
}