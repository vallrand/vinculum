import { vec4 } from 'math/vec4'
import { int32pow2Ceil } from 'math/utilities'
import { GL, GLContext } from '../gl'
import { FrameBufferObject } from './FrameBufferObject'
import { Texture } from './Texture'

export class RenderTarget {
    public readonly viewport: vec4 = vec4(0, 0, 0, 0)
    public readonly normalizedView: vec4 = vec4(0, 0, 0, 0)
    private scissor?: vec4 = null
    public color?: vec4 = null
    public lastFrame: number = -1
    constructor(
        private readonly gl: GLContext,
        public readonly fbo?: FrameBufferObject
    ){}
    public get width(): number {
        return this.fbo ? this.fbo.width : this.gl.drawingBufferWidth
    }
    public get height(): number {
        return this.fbo ? this.fbo.height : this.gl.drawingBufferHeight
    }
    public viewbox(x: number, y: number, width: number, height: number): void {
        vec4.fromValues(x, this.fbo ? y : this.height - height - y, width, height, this.viewport)
        this.normalizedView[0] = (this.viewport[0] + 0.5) / this.width
        this.normalizedView[1] = (this.viewport[1] + 0.5) / this.height
        this.normalizedView[2] = (this.viewport[2] - 1) / this.width
        this.normalizedView[3] = (this.viewport[3] - 1) / this.height
    }
    bind(){
        if(this.fbo) this.fbo.bind()
        else this.gl.bindFramebuffer(GL.FRAMEBUFFER, null)

        this.gl.viewport(this.viewport[0], this.viewport[1], this.viewport[2], this.viewport[3])

        if(!this.scissor) this.gl.disable(GL.SCISSOR_TEST)
        else{
            this.gl.enable(GL.SCISSOR_TEST)
            this.gl.scissor(this.scissor[0], this.scissor[1], this.scissor[2], this.scissor[3])
        }
    }
    clear(frame: number){
        if(!this.color || frame <= this.lastFrame) return
        this.lastFrame = frame
        this.gl.clearColor(this.color[0], this.color[1], this.color[2], this.color[3])
        this.gl.clear(GL.COLOR_BUFFER_BIT) // | GL.DEPTH_BUFFER_BIT
    }
}

export class RenderTargetPool {
    private readonly pool: Record<string, Array<RenderTarget>> = Object.create(null)
    constructor(private readonly gl: GLContext){}
    aquire(width: number, height: number, pow2: boolean): RenderTarget {
        if(pow2){
            width = int32pow2Ceil(width)
            height = int32pow2Ceil(height)
        }
        const key = `${width}x${height}`
        const pool = this.pool[key] || (this.pool[key] = [])
        const renderTarget = pool.pop() || this.createRenderTarget(width, height)
        return renderTarget
    }
    private createRenderTarget(width: number, height: number): RenderTarget {
        const fbo = new FrameBufferObject(this.gl)
        fbo.attach(Texture.ColorTexture(this.gl, width, height))
        const renderTarget = new RenderTarget(this.gl, fbo)
        renderTarget.color = vec4.ZERO
        return renderTarget
    }
    recycle(renderTarget: RenderTarget): void {
        const { width, height } = renderTarget
        const key = `${width}x${height}`
        renderTarget.lastFrame = -1
        this.pool[key].push(renderTarget)
    }
}