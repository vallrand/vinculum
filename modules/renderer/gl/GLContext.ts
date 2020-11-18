import { GL } from './GLConstants'

export interface GLContext extends WebGLRenderingContext {}

export class GLContext {
    public static createContext(canvas: HTMLCanvasElement, options?: object): GLContext {
        const contextOptions = {
            alpha: false,
            antialias: false,
            depth: false,
            desynchronized: false,
            failIfMajorPerformanceCaveat: false,
            powerPreference: 'default',
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
            stencil: false,
            ...options
        }
        const gl = (
            canvas.getContext('webgl', contextOptions) ||
            canvas.getContext('experimental-webgl', contextOptions)
        ) as WebGLRenderingContext

        return new GLContext(gl)
    }
    get drawingBufferWidth(): number { return this.gl.drawingBufferWidth }
    get drawingBufferHeight(): number { return this.gl.drawingBufferHeight }
    private constructor(protected readonly gl: WebGLRenderingContext){
        for(let property in WebGLRenderingContext.prototype){
            let value = gl[property]
            if(typeof value !== 'function') continue
            if(this[property]) continue
            this[property] = value.bind(gl)
        }
    }
    readonly extensions = {
        instanced_arrays: this.gl.getExtension('ANGLE_instanced_arrays'),
        blend_minmax: this.gl.getExtension('EXT_blend_minmax'),
        vertex_array_object: this.gl.getExtension('OES_vertex_array_object') || this.gl.getExtension('MOZ_OES_vertex_array_object') || this.gl.getExtension('WEBKIT_OES_vertex_array_object'),
        depth_texture: this.gl.getExtension('WEBGL_depth_texture') || this.gl.getExtension('WEBKIT_WEBGL_depth_texture'),
        texture_float: this.gl.getExtension('OES_texture_float'),
        texture_float_linear: this.gl.getExtension('OES_texture_float_linear'),
        texture_half_float: this.gl.getExtension('OES_texture_half_float'),
        texture_half_float_linear: this.gl.getExtension('OES_texture_half_float_linear'),
        standard_derivatives: this.gl.getExtension('OES_standard_derivatives'),
        shader_texture_lod: this.gl.getExtension('EXT_shader_texture_lod'),
        draw_buffers: this.gl.getExtension('WEBGL_draw_buffers'),
        color_buffer_float: this.gl.getExtension('WEBGL_color_buffer_float'),
        element_index_uint: this.gl.getExtension('OES_element_index_uint'),
        color_buffer_half_float: this.gl.getExtension('EXT_color_buffer_half_float'),
        frag_depth: this.gl.getExtension('EXT_frag_depth')
    }

    readonly MAX_ATTRIBUTES = this.gl.getParameter(GL.MAX_VERTEX_ATTRIBS)
    readonly MAX_VERT_UNIFORM = this.gl.getParameter(GL.MAX_VERTEX_UNIFORM_VECTORS)
    readonly MAX_FRAG_UNIFORM = this.gl.getParameter(GL.MAX_FRAGMENT_UNIFORM_VECTORS)
    readonly MAX_VARYINGS = this.gl.getParameter(GL.MAX_VARYING_VECTORS)
    readonly MAX_VIEWPORT = this.gl.getParameter(GL.MAX_VIEWPORT_DIMS)
    readonly MAX_TEXTURE = this.gl.getParameter(GL.MAX_TEXTURE_SIZE)
    readonly MAX_TEXTURES = this.gl.getParameter(GL.MAX_TEXTURE_IMAGE_UNITS)
    readonly MAX_VERT_TEXTURES = this.gl.getParameter(GL.MAX_VERTEX_TEXTURE_IMAGE_UNITS)
    readonly MAX_FRAMEBUFFER = this.gl.getParameter(GL.MAX_RENDERBUFFER_SIZE)
    readonly MAX_DRAW_BUFFERS = this.extensions.draw_buffers ?
    this.gl.getParameter(this.extensions.draw_buffers.MAX_DRAW_BUFFERS_WEBGL) : 1
    readonly MAX_COLOR_ATTACHMENTS = this.extensions.draw_buffers ?
    this.gl.getParameter(this.extensions.draw_buffers.MAX_COLOR_ATTACHMENTS_WEBGL) : 1
    
    readonly FRAG_PRECISION = this.gl.getShaderPrecisionFormat(GL.FRAGMENT_SHADER, GL.HIGH_FLOAT).precision
    ? 'high' : 'medium'
    readonly VERT_PRECISION = this.gl.getShaderPrecisionFormat(GL.VERTEX_SHADER, GL.HIGH_FLOAT).precision
    ? 'high' : 'medium'
    readonly MAX_COLOR_BUFFERS = this.extensions.draw_buffers
    ? this.gl.getParameter(this.extensions.draw_buffers.MAX_DRAW_BUFFERS_WEBGL) : 1

    private readonly state = {
        [GL.ARRAY_BUFFER_BINDING]: <WebGLBuffer> null,
        vertexArray: {
            [GL.VERTEX_ARRAY_BINDING]: <WebGLVertexArrayObject> null,
            [GL.ELEMENT_ARRAY_BUFFER_BINDING]: <WebGLBuffer> null,
            attributes: Array(this.MAX_ATTRIBUTES).fill(null).map(() => ({
                enabled: false,
                size: 0,
                type: GL.FLOAT,
                normalized: false,
                stride: 0,
                offset: 0,
                buffer: <WebGLBuffer> null
            }))
        },
        [GL.ACTIVE_TEXTURE]: GL.TEXTURE0,
        textures: <WebGLTexture[]> Array(this.MAX_TEXTURES).fill(null),
        [GL.CURRENT_PROGRAM]: <WebGLProgram> null,
        [GL.FRAMEBUFFER_BINDING]: <WebGLFramebuffer> null,
        [GL.RENDERBUFFER_BINDING]: <WebGLRenderbuffer> null,
        [GL.DEPTH_FUNC]: GL.LESS,
        [GL.DEPTH_TEST]: false,
        [GL.DEPTH_WRITEMASK]: true,
        [GL.BLEND]: false,
        [GL.BLEND_SRC_RGB]: GL.ONE,
        [GL.BLEND_DST_RGB]: GL.ZERO,
        [GL.BLEND_SRC_ALPHA]: GL.ONE,
        [GL.BLEND_DST_ALPHA]: GL.ZERO,
        [GL.BLEND_EQUATION_RGB]: GL.FUNC_ADD,
        [GL.BLEND_EQUATION_ALPHA]: GL.FUNC_ADD,
        [GL.CULL_FACE]: false,
        [GL.CULL_FACE_MODE]: GL.BACK,
        [GL.SCISSOR_TEST]: false,
        [GL.SCISSOR_BOX]: new Int32Array(4),
        [GL.VIEWPORT]: new Int32Array(4),
        [GL.COLOR_CLEAR_VALUE]: new Float32Array(4),
        [GL.COLOR_WRITEMASK]: [true,true,true,true]
    }
    private readonly defaultVertexArray = this.state.vertexArray

    enable(cap: number): void {
        if(this.state[cap]) return
        this.state[cap] = true
        this.gl.enable(cap)
    }
    disable(cap: number): void {
        if(!this.state[cap]) return
        this.state[cap] = false
        this.gl.disable(cap)
    }
    bindBuffer(target: number, buffer: WebGLBuffer): void {
        switch(target){
            case GL.ARRAY_BUFFER:
                if(this.state[GL.ARRAY_BUFFER_BINDING] === buffer) return
                this.state[GL.ARRAY_BUFFER_BINDING] = buffer
                break
            case GL.ELEMENT_ARRAY_BUFFER:
                if(this.state.vertexArray[GL.ELEMENT_ARRAY_BUFFER_BINDING] === buffer) return
                this.state.vertexArray[GL.ELEMENT_ARRAY_BUFFER_BINDING] = buffer
                break
        }
        this.gl.bindBuffer(target, buffer)
    }
    useProgram(program: WebGLProgram): void {
        if(this.state[GL.CURRENT_PROGRAM] === program) return
        this.state[GL.CURRENT_PROGRAM] = program
        this.gl.useProgram(program)
    }
    activeTexture(texture: number): void {
        if(this.state[GL.ACTIVE_TEXTURE] === texture) return
        this.state[GL.ACTIVE_TEXTURE] = texture
        this.gl.activeTexture(texture)
    }
    bindTexture(target: number, texture: WebGLTexture): void {
        if(this.state.textures[this.state[GL.ACTIVE_TEXTURE]] === texture) return
        this.state.textures[this.state[GL.ACTIVE_TEXTURE]] = texture
        this.gl.bindTexture(target, texture)
    }
    bindFramebuffer(target: number, framebuffer: WebGLFramebuffer): void {
        if(this.state[GL.FRAMEBUFFER_BINDING] === framebuffer) return
        this.state[GL.FRAMEBUFFER_BINDING] = framebuffer
        this.gl.bindFramebuffer(target, framebuffer)
    }
    bindRenderbuffer(target: number, renderbuffer: WebGLRenderbuffer): void {
        if(this.state[GL.RENDERBUFFER_BINDING] === renderbuffer) return
        this.state[GL.RENDERBUFFER_BINDING] = renderbuffer
        this.gl.bindRenderbuffer(target, renderbuffer)
    }
    viewport(x: number, y: number, width: number, height: number): void {
        if(
            this.state[GL.VIEWPORT][0] === x &&
            this.state[GL.VIEWPORT][1] === y &&
            this.state[GL.VIEWPORT][2] === width
            && this.state[GL.VIEWPORT][3] === height
        ) return
        this.state[GL.VIEWPORT][0] = x
        this.state[GL.VIEWPORT][1] = y
        this.state[GL.VIEWPORT][2] = width
        this.state[GL.VIEWPORT][3] = height

        this.gl.viewport(x, y, width, height)
    }
    scissor(x: number, y: number, width: number, height: number): void {
        if(
            this.state[GL.SCISSOR_BOX][0] === x &&
            this.state[GL.SCISSOR_BOX][1] === y &&
            this.state[GL.SCISSOR_BOX][2] === width
            && this.state[GL.SCISSOR_BOX][3] === height
        ) return
        this.state[GL.SCISSOR_BOX][0] = x
        this.state[GL.SCISSOR_BOX][1] = y
        this.state[GL.SCISSOR_BOX][2] = width
        this.state[GL.SCISSOR_BOX][3] = height
        
        this.gl.scissor(x, y, width, height)
    }
    clearColor(red: number, green: number, blue: number, alpha: number): void {
        if(
            this.state[GL.COLOR_CLEAR_VALUE][0] === red &&
            this.state[GL.COLOR_CLEAR_VALUE][1] === green &&
            this.state[GL.COLOR_CLEAR_VALUE][2] === blue
            && this.state[GL.COLOR_CLEAR_VALUE][3] === alpha
        ) return
        this.state[GL.COLOR_CLEAR_VALUE][0] = red
        this.state[GL.COLOR_CLEAR_VALUE][1] = green
        this.state[GL.COLOR_CLEAR_VALUE][2] = blue
        this.state[GL.COLOR_CLEAR_VALUE][3] = alpha

        this.gl.clearColor(red, green, blue, alpha)
    }
    colorMask(red: boolean, green: boolean, blue: boolean, alpha: boolean): void {
        if(
            this.state[GL.COLOR_WRITEMASK][0] === red &&
            this.state[GL.COLOR_WRITEMASK][1] === green &&
            this.state[GL.COLOR_WRITEMASK][2] === blue
            && this.state[GL.COLOR_WRITEMASK][3] === alpha
        ) return
        this.state[GL.COLOR_WRITEMASK][0] = red
        this.state[GL.COLOR_WRITEMASK][1] = green
        this.state[GL.COLOR_WRITEMASK][2] = blue
        this.state[GL.COLOR_WRITEMASK][3] = alpha

        this.gl.colorMask(red, green, blue, alpha)
    }
    blendFuncSeparate(srcRGB: number, dstRGB: number, srcAlpha: number, dstAlpha: number): void {
        if(
            this.state[GL.BLEND_SRC_RGB] === srcRGB &&
            this.state[GL.BLEND_DST_RGB] === dstRGB &&
            this.state[GL.BLEND_SRC_ALPHA] === srcAlpha &&
            this.state[GL.BLEND_DST_ALPHA] === dstAlpha
        ) return
        this.state[GL.BLEND_SRC_RGB] = srcRGB
        this.state[GL.BLEND_DST_RGB] = dstRGB
        this.state[GL.BLEND_SRC_ALPHA] = srcAlpha
        this.state[GL.BLEND_DST_ALPHA] = dstAlpha
        this.gl.blendFuncSeparate(srcRGB, dstRGB, srcAlpha, dstAlpha)
    }
    blendFunc(sfactor: number, dfactor: number): void {
        this.blendFuncSeparate(sfactor, dfactor, sfactor, dfactor)
    }
    blendEquationSeparate(modeRGB: number, modeAlpha: number): void {
        if(this.state[GL.BLEND_EQUATION_RGB] === modeRGB && this.state[GL.BLEND_EQUATION_ALPHA] === modeAlpha) return
        this.state[GL.BLEND_EQUATION_RGB] = modeRGB
        this.state[GL.BLEND_EQUATION_ALPHA] = modeAlpha
        this.gl.blendEquationSeparate(modeRGB, modeAlpha)
    }
    blendEquation(mode: number): void {
        this.blendEquationSeparate(mode, mode)
    }
    cullFace(mode: number): void {
        if(this.state[GL.CULL_FACE_MODE] === mode) return
        this.state[GL.CULL_FACE_MODE] = mode
        this.gl.cullFace(mode)
    }
    drawElements(mode: number, count: number, type: number, offset: number): void {
        this.gl.drawElements(mode, count, type, offset)
    }
    drawArrays(mode: number, first: number, count: number): void {
        this.gl.drawArrays(mode, first, count)
    }
    vertexAttribPointer(index: number, size: number, type: number, normalized: boolean, stride: number, offset: number): void {
        const attrib = this.state.vertexArray.attributes[index]
        attrib.size = size
        attrib.type = type
        attrib.normalized = normalized
        attrib.stride = stride
        attrib.offset = offset
        attrib.buffer = this.state[GL.ARRAY_BUFFER_BINDING]
        this.gl.vertexAttribPointer(index, size, type, normalized, stride, offset)
    }
    enableVertexAttribArray(index: number): void {
        if(this.state.vertexArray.attributes[index].enabled) return
        this.state.vertexArray.attributes[index].enabled = true

        this.gl.enableVertexAttribArray(index)
    }
    disableVertexAttribArray(index: number): void {
        if(!this.state.vertexArray.attributes[index].enabled) return
        this.state.vertexArray.attributes[index].enabled = false

        this.gl.disableVertexAttribArray(index)
    }

    createVertexArray(): WebGLVertexArrayObject {
        return {
            [GL.VERTEX_ARRAY_BINDING]: this.extensions.vertex_array_object.createVertexArrayOES(),
            [GL.ELEMENT_ARRAY_BUFFER]: null,
            attributes: Array(this.MAX_ATTRIBUTES).fill(null).map(() => ({
                enabled: false,
                size: 0,
                type: GL.FLOAT,
                normalized: false,
                stride: 0,
                offset: 0,
                buffer: null
            }))
        }
    }
    bindVertexArray(arrayObject: WebGLVertexArrayObject): void {
        const vertexArray = arrayObject as any
        arrayObject = vertexArray[GL.VERTEX_ARRAY_BINDING] as WebGLVertexArrayObjectOES
        if(this.state.vertexArray[GL.VERTEX_ARRAY_BINDING] === arrayObject) return
        this.state.vertexArray = vertexArray || this.defaultVertexArray
        this.extensions.vertex_array_object.bindVertexArrayOES(arrayObject)
    }
    deleteVertexArray(arrayObject: WebGLVertexArrayObject): void {
        const vertexArray = arrayObject as any
        arrayObject = vertexArray[GL.VERTEX_ARRAY_BINDING] as WebGLVertexArrayObjectOES
        this.extensions.vertex_array_object.deleteVertexArrayOES(arrayObject)
    }
    isVertexArray(arrayObject: WebGLVertexArrayObject): void {
        const vertexArray = arrayObject as any
        arrayObject = vertexArray[GL.VERTEX_ARRAY_BINDING] as WebGLVertexArrayObjectOES
        return this.extensions.vertex_array_object.isVertexArrayOES(arrayObject)
    }
    drawBuffers(buffers: number[]): void {
        this.extensions.draw_buffers.drawBuffersWEBGL(buffers)
    }
    drawArraysInstanced(mode: number, first: number, count: number, primcount: number): void {
        this.extensions.instanced_arrays.drawArraysInstancedANGLE(mode, first, count, primcount)
    }
    drawElementsInstanced(mode: number, count: number, type: number, offset: number, primcount: number): void {
        this.extensions.instanced_arrays.drawElementsInstancedANGLE(mode, count, type, offset, primcount)
    }
    vertexAttribDivisor(index: number, divisor: number): void {
        this.extensions.instanced_arrays.vertexAttribDivisorANGLE(index, divisor)
    }
    
    private readonly SHADER_PREAMBLE = [
        this.extensions.shader_texture_lod ? '#extension GL_EXT_shader_texture_lod : enable\n' : '',
        this.extensions.standard_derivatives ? '#extension GL_OES_standard_derivatives : enable\n' : '',
        '#line 1\n'
    ].join('')
    shaderSource(shader: WebGLShader, source: string): void {
        this.gl.shaderSource(shader, this.SHADER_PREAMBLE + source)
    }
}