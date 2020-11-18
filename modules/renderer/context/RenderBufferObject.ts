import { GL, GLContext } from '../gl'

export class RenderBufferObject {
    public static ColorBuffer(gl: GLContext, width: number, height: number): RenderBufferObject {
        return new RenderBufferObject(gl, width, height, GL.RGBA4)
    }
    public static DepthBuffer(gl: GLContext, width: number, height: number): RenderBufferObject {
        return new RenderBufferObject(gl, width, height, GL.DEPTH_COMPONENT16)
    }
    public static DepthStencilBuffer(gl: GLContext, width: number, height: number): RenderBufferObject {
        return new RenderBufferObject(gl, width, height, GL.DEPTH_STENCIL)
    }
    private readonly renderbuffer: WebGLRenderbuffer
    private constructor(
        private readonly gl: GLContext,
        readonly width: number,
        readonly height: number,
        readonly internalFormat: number = GL.RGBA4
    ){
        this.renderbuffer = gl.createRenderbuffer()
        gl.bindRenderbuffer(GL.RENDERBUFFER, this.renderbuffer)
        gl.renderbufferStorage(GL.RENDERBUFFER, internalFormat, width, height)
    }
    bind(){
        this.gl.bindRenderbuffer(GL.RENDERBUFFER, this.renderbuffer)
    }
    delete(){
        this.gl.deleteRenderbuffer(this.renderbuffer)
    }
}