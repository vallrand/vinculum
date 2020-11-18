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
import { Material } from '../Material'

import generateFragmentShader from '../shaders/batch_frag'

export class BatchRenderer implements IRenderer2D {
    public static readonly QUAD_INDICES: number[] = [0,1,2,0,2,3]
    private readonly vdf: VertexDataFormat = VertexDataFormat([
        { name: 'aPosition', size: 2, type: GL.FLOAT, normalized: false },
        { name: 'aUV', size: 2, type: GL.UNSIGNED_SHORT, normalized: true },
        { name: 'aColor', size: 4, type: GL.UNSIGNED_BYTE, normalized: true },
        { name: 'aTint', size: 3, type: GL.UNSIGNED_BYTE, normalized: true },
        { name: 'aMaterial', size: 1, type: GL.UNSIGNED_BYTE, normalized: false }
    ])
    private indexBuffer: IndexBufferObject
    private vertexBuffer: VertexBufferObject
    private vertexOffset: number = 0
    private indexOffset: number = 0
    private blending: BlendMode = BlendMode.NONE
    private readonly textures: Texture[] = []
    private vao: VertexArrayObject
    private shader: Shader
    private gl: GLContext
    constructor(
        private readonly MAX_VERTICES = 4 * 1024,
        private readonly MAX_INDICES = 6 * 1024,
        private readonly FIXED_INDICES = null
    ){}
    initialize(gl: GLContext): void {
        this.gl = gl
        this.shader = new Shader(gl,
            require('../shaders/batch_vert.glsl'),
            generateFragmentShader(gl.MAX_TEXTURES))
        this.shader.uao['uSamplers'] = range(gl.MAX_TEXTURES)

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
        this.vao.bindVertexBuffer(this.vertexBuffer, this.vdf, this.shader.attributes)
    }
    render(globalUniforms: GlobalUniforms, geometry: Geometry2D, material: Material): void {
        const { vertices, uvs, indices, colors } = geometry
        const { diffuse, blend } = material

        const indexCount = indices.length
        const vertexCount = vertices.length >>> 1
        let textureIndex = this.textures.indexOf(diffuse.texture)
        
        if(
            (this.blending !== blend && this.indexOffset > 0) ||
            (textureIndex == -1 && this.textures.length >= this.gl.MAX_TEXTURES) ||
            (this.indexOffset + indexCount >= this.MAX_INDICES) ||
            (this.vertexOffset + vertexCount >= this.MAX_VERTICES)
        ) textureIndex = (this.flush(globalUniforms), -1)

        if(textureIndex == -1) textureIndex = this.textures.push(diffuse.texture) - 1
        this.blending = blend
        const color: number = rgba.uint8Hex(material.color)
        const tint: number = rgb.uint8Hex(material.tint) | textureIndex << 24

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
            uint32View[index + 4] = tint
        }
        this.vertexOffset += vertexCount
    }
    flush(globalUniforms: GlobalUniforms): void {
        const { gl, vertexOffset, indexOffset, textures } = this
        if(!indexOffset) return

        this.vao.bind()
        if(!this.FIXED_INDICES) this.indexBuffer.upload(null, 0, indexOffset)
        this.vertexBuffer.upload(null, 0, vertexOffset * (this.vdf.stride >>> 2))

        for(let i = 0; i < gl.MAX_TEXTURES; i++)
            if(textures[i]) textures[i].bind(i)
            else globalUniforms.defaultTexture.bind(i)
        
        this.shader.uao['uProjectionMatrix'] = globalUniforms['viewMatrix']
        this.shader.bind()

        applyBlendMode[this.blending](gl, globalUniforms.premultipliedAlpha)

        this.vao.render(GL.TRIANGLES, indexOffset, 0)

        this.vertexOffset = this.indexOffset = 0
        textures.length = 0
    }
    delete(): void {
        this.vao.delete()
        this.shader.delete()
        this.indexBuffer.delete()
        this.vertexBuffer.delete()
    }
}