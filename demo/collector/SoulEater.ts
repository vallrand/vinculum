import { vec2, range, lerp, lerpAngle, ease, shortestAngle, linearGradient } from 'math'
import { IUpdateContext, EntityManager } from 'framework'
import { Behaviour, TargetComponent, Transform2D } from 'scene'
import { Curve } from 'renderer'

interface SoulEaterOptions {
    segments: number
    curve: number
    parts: number[]
}

export class SoulEater extends Behaviour<SoulEaterOptions> {
    private path: vec2[]
    private angles: number[]
    private options: SoulEaterOptions
    private readonly previousTarget: vec2 = vec2()
    public attract: number
    public lastFrame: number

    private pathGradient: (f: number, out: vec2) => vec2
    private angleGradient: (f: number) => number

    setup(options: SoulEaterOptions, manager: EntityManager){
        this.options = options
        this.path = range(options.segments).map(i => vec2(i, 0))
        this.angles = Array(options.segments).fill(0)
        this.attract = 0
        this.lastFrame = -1
        this.pathGradient = linearGradient(vec2.lerp)(this.path)
        this.angleGradient = linearGradient(lerp)(this.angles)
    }
    update(context: IUpdateContext, manager: EntityManager){
        if(this.lastFrame != -1 && !this.attract) return
        this.lastFrame = context.frame
        
        const targeted = manager.aquireComponent<TargetComponent>(this.entity, TargetComponent)
        const target = targeted ? targeted.calculatePosition() : vec2.ZERO
        vec2.lerp(this.previousTarget, target, 1 - Math.pow(1 - 0.1, context.deltaTime * 30), this.previousTarget)
        const distance = vec2.magnitude(this.previousTarget)
        
        const segmentLength = distance / this.path.length
        let spacing = 0.6 * segmentLength * this.attract
        let x = 0, y = 0, angle = 0.5 * Math.PI
        for(let i = 0; i < this.path.length; i++){
            this.path[i][0] = x
            this.path[i][1] = y
            this.angles[i] = angle

            const f = i / (this.path.length - 1)

            spacing += this.attract * lerp(0.02 * segmentLength, 0, f) * Math.sin(context.elapsedTime * 2 + lerp(0, 2 * Math.PI, f))
            angle += this.attract * ease.fade(f) * 0.36 * Math.cos(context.elapsedTime * 2 + lerp(0, 2 * Math.PI, f))

            const direction = Math.atan2(this.previousTarget[1] - y, this.previousTarget[0] - x)
            const deviation = ease.cubicOut(1 - Math.abs(shortestAngle(angle, direction)) / Math.PI)
            angle = lerpAngle(angle, direction, deviation * f * ease.cubicIn(this.attract))

            x += Math.cos(angle) * spacing
            y += Math.sin(angle) * spacing
        }

        const { curve, parts } = this.options

        const geometry = manager.aquireComponent(curve, Curve, this.timeframe) as Curve
        geometry.path = this.path

        const factor = 1 - this.attract * Math.pow(1 - 0.1, context.deltaTime * 15)
        for(let i = 0; i < parts.length; i++){
            let f = (i + 1) / parts.length
            const part = manager.aquireComponent<Transform2D>(parts[i], Transform2D, this.timeframe)
            
            this.pathGradient(f, part.localPosition)
            part.localRotation = lerpAngle(part.localRotation, this.angleGradient(f), f < 1 ? factor : 1)
            part.lastFrame = -1

            if(f < 1)
            part.localPosition[1] = Math.max(part.localPosition[1], 50 + i * 50)
        }
    }
    reset(){
        this.pathGradient = this.angleGradient = null
        this.options = null
    }
}