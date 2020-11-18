import { clamp } from 'math/utilities'
import { Stream } from 'common/Stream'

export interface IUpdateContext {
    frame: number
    deltaTime: number
    elapsedTime: number
}

export class UpdateLoop extends Stream<IUpdateContext> implements IUpdateContext {
    private static readonly MAX_FRAME_DURATION = 2 * 1/60
    frame: number = 0
    deltaTime: number = 0
    elapsedTime: number = 0
    protected timeScale: number = 1
    private prevTimestamp: number = 0
    private requestId: number = null
    public stop(): this {
        cancelAnimationFrame(this.requestId)
        this.requestId = null
        return this
    }
    public start(): this {
        if(this.requestId != null) return this
        this.update(this.prevTimestamp = performance.now())
        return this
    }
    private update = (timestamp: number) => {
        this.deltaTime = this.timeScale * clamp(1e-3 * (timestamp - this.prevTimestamp), 0, UpdateLoop.MAX_FRAME_DURATION)
        this.elapsedTime += this.deltaTime
        this.frame++
        this.prevTimestamp = timestamp

        this.dispatch(this)
        this.requestId = requestAnimationFrame(this.update)
    }
}