import { Geometry2D } from './Geometry2D'
import { vec2 } from 'math/vec2'
import { mat3x2 } from 'math/mat3x2'
import { TextureResource } from '../UploadTexture'
import { Material } from '../Material'
import { Transform2D } from 'scene/Transform2D'

interface Sprite2DOptions {
    order: number
    origin: vec2
}

export class Sprite2D extends Geometry2D<Sprite2DOptions> {
    public static readonly CENTER: vec2 = vec2(0.5, 0.5)
    private static readonly QUAD_INDICES: Uint8Array = new Uint8Array([0,1,2,0,2,3])
    private static readonly QUAD_UVS: Float32Array = new Float32Array([0,0,1,0,1,1,0,1])
    public readonly vertices: Float32Array = new Float32Array(2 * 4)
    public readonly uvs: Uint32Array = new Uint32Array(4)
    public readonly indices: Uint8Array = Sprite2D.QUAD_INDICES

    private lastTextureIndex: number = -1
    lastFrame: number = -1

    readonly origin: vec2 = vec2(0, 0)

    setup(options: Sprite2DOptions){
        this.lastTextureIndex = -1
        this.lastFrame = -1
        this.order = options.order
        vec2.copy(options.origin || vec2.ZERO, this.origin)
    }
    calculateVertexData(transform: Transform2D, material: Material, frame: number): void {
        if(this.lastTextureIndex != material.diffuse.index){
            this.lastTextureIndex = material.diffuse.index
            this.recalculateUVs(Sprite2D.QUAD_UVS as any, material.diffuse.uvTransform, this.uvs)
            this.lastFrame = -1
        }

        if(transform && this.lastFrame < transform.lastFrame) this.lastFrame = -1

        if(this.lastFrame != -1) return
        this.lastFrame = frame
        this.recalculateVertices(
            null, transform ? transform.globalTransform : mat3x2.IDENTITY, this.vertices, 0, material.diffuse
        )
        this.recalculateBoundingBox()
    }
    protected recalculateBoundingBox(): void {
        const { aabb, vertices } = this
        aabb[0] = Math.min(vertices[0], vertices[2], vertices[4], vertices[6])
        aabb[1] = Math.min(vertices[1], vertices[3], vertices[5], vertices[7])
        aabb[2] = Math.max(vertices[0], vertices[2], vertices[4], vertices[6])
        aabb[3] = Math.max(vertices[1], vertices[3], vertices[5], vertices[7])
    }
    protected recalculateVertices(vertices: number[], transform: mat3x2, out: Float32Array, offset: number, texture?: TextureResource){
        const a = transform[0], b = transform[1],
        c = transform[2], d = transform[3],
        tx = transform[4], ty = transform[5]

        const { width, height, frame } = texture

        const left = frame[0] - this.origin[0] * width,
        right = left + frame[2],
        top = frame[1] - this.origin[1] * height,
        bottom = top + frame[3]

        out[0] = a * left + c * top + tx
        out[1] = d * top + b * left + ty
        out[2] = a * right + c * top + tx
        out[3] = d * top + b * right + ty
        out[4] = a * right + c * bottom + tx
        out[5] = d * bottom + b * right + ty
        out[6] = a * left + c * bottom + tx
        out[7] = d * bottom + b * left + ty
    }
    reset(){
        
    }
}