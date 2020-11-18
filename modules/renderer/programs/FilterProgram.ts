import { vec2, mat3 } from 'math'
import { EntityManager, IUpdateContext, DataView } from 'framework'
import { GL, GLContext } from '../gl'
import {
    VertexBufferObject,
    VertexArrayObject, Shader, Texture,
    RenderTarget, RenderTargetPool
} from '../context'
import { applyBlendMode, BlendMode } from './BlendMode'
import { GlobalUniforms } from './IRenderer2D'
import { ShaderMaterial } from '../ShaderMaterial'

export class FilterProgram {
    private readonly vertexBuffer: VertexBufferObject
    private readonly vao: VertexArrayObject
    private readonly defaultShader: Shader
    constructor(
        private readonly manager: EntityManager,
        private readonly gl: GLContext
    ){
        this.vertexBuffer = new VertexBufferObject(this.gl, 4*2*4, GL.STATIC_DRAW)
        this.vertexBuffer.upload(new Float32Array([-1,1,-1,-1,1,-1,1,1]))
        this.vao = new VertexArrayObject(this.gl)
        this.vao.bindVertexAttribute(this.vertexBuffer, { location: 0, size: 2 })

        this.defaultShader = new Shader(this.gl, ShaderMaterial.vertexSource, ShaderMaterial.fragmentSource, {
            'aPosition': 0
        })
    }
    applyFilter(shaderMaterial: ShaderMaterial, globalUniforms: GlobalUniforms, context: IUpdateContext, source: RenderTarget, target: RenderTarget): void {
        const { gl, vao } = this
        const shader = shaderMaterial ? shaderMaterial.shader : this.defaultShader

        shader.uao['uSampler'] = 0
        shader.uao['uViewMatrix'] = globalUniforms.viewMatrix
        shader.uao['uInvViewMatrix'] = globalUniforms.invViewMatrix
        shader.uao['uViewport'] = source.normalizedView
        if(shaderMaterial) ShaderMaterial.synchronize(shaderMaterial.attributes, shader)
        shader.bind()

        applyBlendMode[shaderMaterial ? shaderMaterial.blend : BlendMode.NONE](gl, globalUniforms.premultipliedAlpha)

        target.viewbox(0, 0, source.viewport[2], source.viewport[3])
        target.bind()
        target.clear(context.frame)
        const texture = source.fbo.attachments[0] as Texture
        texture.bind(0)

        vao.bind()
        vao.render(GL.TRIANGLE_FAN, 4, 0)
    }
}