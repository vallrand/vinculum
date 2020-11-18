import { range } from 'math/utilities'
import { rgba, rgb } from 'math/rgba'
import { IRenderer2D, GlobalUniforms } from './IRenderer2D'
import { GL, GLContext } from '../gl'
import {
    VertexDataFormat, 
    IndexBufferObject, VertexBufferObject,
    VertexArrayObject, Shader, Texture
} from '../context'
import { BlendMode, applyBlendMode } from './BlendMode'
import { Geometry2D } from '../geometry/Geometry2D'
import { ShaderMaterial } from '../ShaderMaterial'

export class ShaderRenderer implements IRenderer2D {
    protected readonly vdf: VertexDataFormat = VertexDataFormat([
        { name: 'aPosition', size: 2, type: GL.FLOAT, normalized: false },
        { name: 'aUV', size: 2, type: GL.UNSIGNED_SHORT, normalized: true },
        { name: 'aColor', size: 4, type: GL.UNSIGNED_BYTE, normalized: true }
    ])
    private indexBuffer: IndexBufferObject
    private vertexBuffer: VertexBufferObject
    private vertexOffset: number = 0
    private indexOffset: number = 0
    private blending: BlendMode = BlendMode.NONE
    private vao: VertexArrayObject
    private shader: Shader
    private shaderAttributes: Record<string, number | number[]>
    private gl: GLContext
    constructor(
        private readonly MAX_VERTICES = 4 * 1024,
        private readonly MAX_INDICES = 6 * 1024,
        private readonly FIXED_INDICES = null
    ){}
    initialize(gl: GLContext): void {
        this.gl = gl

        if(this.FIXED_INDICES){
            this.indexBuffer = new IndexBufferObject(gl, this.MAX_INDICES, GL.UNSIGNED_INT, GL.STATIC_DRAW)
            const indexView = this.indexBuffer.data as Uint16Array
            const vertexCount = 1 + Math.max(...this.FIXED_INDICES)
            for(let i = 0; i < indexView.length; i++)
                indexView[i] = this.FIXED_INDICES[i % this.FIXED_INDICES.length] + vertexCount * Math.floor(i / this.FIXED_INDICES.length)
            this.indexBuffer.upload(null)
        }else this.indexBuffer = new IndexBufferObject(gl, this.MAX_INDICES, GL.UNSIGNED_INT, GL.DYNAMIC_DRAW)
        this.vertexBuffer = new VertexBufferObject(gl, this.vdf.stride * this.MAX_VERTICES, GL.DYNAMIC_DRAW)

        this.vao = new VertexArrayObject(gl)
        this.vao.bindIndexBuffer(this.indexBuffer)
        this.vao.bindVertexBuffer(this.vertexBuffer, this.vdf, {
            'aPosition': { location: 0, size: 2 },
            'aUV': { location: 1, size: 2 },
            'aColor': { location: 2, size: 4 }
        })
    }
    render(globalUniforms: GlobalUniforms, geometry: Geometry2D, material: ShaderMaterial): void {
        const { vertices, uvs, indices, colors } = geometry
        const { blend, shader, attributes } = material

        const indexCount = indices.length
        const vertexCount = vertices.length >>> 1
        
        if(
            (this.blending !== blend && this.indexOffset > 0) ||
            (this.shader != shader || this.shaderAttributes != attributes) ||
            (this.indexOffset + indexCount >= this.MAX_INDICES) ||
            (this.vertexOffset + vertexCount >= this.MAX_VERTICES)
        ) this.flush(globalUniforms)

        this.shader = shader
        this.shaderAttributes = attributes
        this.blending = blend
        const color: number = rgba.uint8Hex(material.color)

        const indexView: ArrayBufferView = this.indexBuffer.data
        const float32View: ArrayBufferView = this.vertexBuffer.dataView(GL.FLOAT)
        const uint32View: ArrayBufferView = this.vertexBuffer.dataView(GL.UNSIGNED_INT)

        if(!this.FIXED_INDICES)
        for(let i = 0; i < indexCount; i++)
            indexView[this.indexOffset + i] = indices[i] + this.vertexOffset
        this.indexOffset += indexCount

        const stride = this.vdf.stride >>> 2
        const offset = this.vertexOffset * stride
        for(let i = 0, index = offset; i < vertexCount; i++, index += stride){
            float32View[index + 0] = vertices[2 * i + 0]
            float32View[index + 1] = vertices[2 * i + 1]
            uint32View[index + 2] = uvs[i]
            uint32View[index + 3] = colors ? colors[i] : color
        }
        this.vertexOffset += vertexCount
    }
    flush(globalUniforms: GlobalUniforms): void {
        const { gl, vertexOffset, indexOffset, shader } = this
        if(!indexOffset) return

        this.vao.bind()
        if(!this.FIXED_INDICES) this.indexBuffer.upload(null, 0, indexOffset)
        this.vertexBuffer.upload(null, 0, vertexOffset * (this.vdf.stride >>> 2))

        shader.uao['uProjectionMatrix'] = globalUniforms['viewMatrix']
        ShaderMaterial.synchronize(this.shaderAttributes, shader)
        shader.bind()

        applyBlendMode[this.blending](gl, globalUniforms.premultipliedAlpha)

        this.vao.render(GL.TRIANGLES, indexOffset, 0)

        this.vertexOffset = this.indexOffset = 0
        this.shader = null
    }
    delete(): void {
        this.vao.delete()
        this.indexBuffer.delete()
        this.vertexBuffer.delete()
    }
}