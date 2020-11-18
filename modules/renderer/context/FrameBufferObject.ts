import { GL, GLContext } from '../gl'
import { Texture } from './Texture'
import { RenderBufferObject } from './RenderBufferObject'

export class FrameBufferObject {
    private readonly framebuffer: WebGLFramebuffer
    public readonly attachments: Array<Texture | RenderBufferObject> = []
    constructor(private readonly gl: GLContext){
        this.framebuffer = gl.createFramebuffer()
    }
    bind(){
        this.gl.bindFramebuffer(GL.FRAMEBUFFER, this.framebuffer)
    }
    public get width(): number {
        return this.attachments[0] ? this.attachments[0].width : 0
    }
    public get height(): number {
        return this.attachments[0] ? this.attachments[0].height : 0
    }
    private deriveAttachment(internalFormat: number): number {
        switch(internalFormat){
            case GL.DEPTH_COMPONENT16:
            case GL.DEPTH_COMPONENT:
                return GL.DEPTH_ATTACHMENT
            case GL.DEPTH_STENCIL:
                return GL.DEPTH_STENCIL_ATTACHMENT
            case GL.RGBA4:
            case GL.RGBA:
                return GL.COLOR_ATTACHMENT0
        }
    }
    attach(...buffers: Array<Texture | RenderBufferObject>): void {
        this.bind()
        for(let location = 0, i = 0; i < buffers.length; i++){
            const buffer = this.attachments[i] = buffers[i]
            let attachment = this.deriveAttachment(buffer.internalFormat)
            if(attachment === GL.COLOR_ATTACHMENT0) attachment += location++
            buffer.bind()
            if(buffer instanceof Texture)
                this.gl.framebufferTexture2D(GL.FRAMEBUFFER, attachment, GL.TEXTURE_2D, (buffer as any).texture, 0)
            else if(buffer instanceof RenderBufferObject)
                this.gl.framebufferRenderbuffer(GL.FRAMEBUFFER, attachment, GL.RENDERBUFFER, (buffer as any).renderbuffer)
        }
        if(this.gl.checkFramebufferStatus(GL.FRAMEBUFFER) != GL.FRAMEBUFFER_COMPLETE)
            throw new Error('Invalid framebuffer attachments!')
    }
    delete(){
        this.attachments.length = 0
        this.gl.deleteFramebuffer(this.framebuffer)
    }
}