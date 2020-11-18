import { vec2, shortestAngle, smoothstep, ease, lerp, lerpAngle, range, randomFloat } from 'math'
import { IUpdateContext, EntityManager } from 'framework'
import { Behaviour, TargetComponent } from 'scene'
import { Curve } from 'renderer'

import { rng } from '../helpers'

interface FeelerOptions {
    length: number
    spacing: number
}

export class Feeler extends Behaviour<FeelerOptions> {
    private spacing: number
    private angles: number[]
    private phase: number[]
    private frequency: number[]
    private elapsedTime: number
    setup({ length, spacing }: FeelerOptions){
        this.spacing = spacing
        this.angles = range(length).map(i => randomFloat(-1, 1, rng))
        this.phase = range(length).map(i => randomFloat(0, 2 * Math.PI, rng))
        this.frequency = range(length).map(i => randomFloat(1, 5, rng))
        this.elapsedTime = 0
    }
    update(context: IUpdateContext, manager: EntityManager){
        const geometry = manager.aquireComponent(this.entity, Curve) as Curve
        if(!geometry) return
        if(geometry.lastRenderFrame > 0 && geometry.lastRenderFrame !== context.frame - 1) return
        this.elapsedTime += context.deltaTime

        const targeted = manager.aquireComponent<TargetComponent>(this.entity, TargetComponent)
        const target = targeted ? targeted.calculatePosition() : vec2.ZERO
        const reachDistance = this.spacing * this.angles.length
        const attractDistance = targeted ? 1 - smoothstep(reachDistance, 2 * reachDistance, vec2.magnitude(target)) : 0
        
        const path = geometry.curve
        if(path.length != this.angles.length)
            geometry.path = Array(this.angles.length).fill(vec2.ZERO)

        let x = 0, y = 0, angle = 0, velocity = 0
        const curl = 0.6, step = 0.2 * 0.05 * this.spacing / path.length

        for(let i = 0; i < path.length; i++){
            vec2.fromValues(x, y, path[i])

            const f = i / (path.length - 1)
            const deltaAngle = this.angles[i] + lerp(2, 6, f) * Math.sin(this.elapsedTime * this.frequency[i] + this.phase[i])

            x += Math.cos(angle) * this.spacing
            y += Math.sin(angle) * this.spacing
            velocity += step * deltaAngle
            velocity *= lerp(1, curl, 0.1)
            angle += velocity
            angle *= 1 - Math.pow(f, 4)

            if(!attractDistance) continue
            const direction = Math.atan2(target[1] - y, target[0] - x)
            const deviation = ease.cubicOut(1 - Math.abs(shortestAngle(angle, direction)) / Math.PI)
            angle = lerpAngle(angle, direction, deviation * f * attractDistance)
        }
        geometry.lastFrame = -1        
    }
    reset(){}
}