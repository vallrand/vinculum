import { vec2, mat3x2, randomFloat, cubicBezier, lerp, ease } from 'math'
import { EntityManager, ReusableComponent } from 'framework'

export class PuzzleWire extends ReusableComponent<{
    entities: [number, number]
    indices: [number, number]
}> {
    private static readonly controlA: vec2 = vec2()
    private static readonly controlB: vec2 = vec2()
    readonly pair: [number, number] = [0, 0]
    readonly indices: [number, number] = [0, 0]
    private readonly path: vec2[] = [vec2(), vec2()]
    private readonly normal: vec2 = vec2()
    private readonly tangent: vec2 = vec2()

    private timeElapsed: number = 0
    public amplitude: number = 0
    public tension: number = 1
    public lastFrame: number = -1

    setup({ entities, indices }, manager: EntityManager){
        const leftIndex = entities[1] > entities[0] ? 0 : 1
        vec2.fromValues(entities[leftIndex], entities[1 - leftIndex], this.pair)
        vec2.fromValues(indices[leftIndex], indices[1 - leftIndex], this.indices)
        this.lastFrame = -1
        this.path.length = 2
        this.amplitude = 0
        this.tension = 1
        this.timeElapsed = randomFloat(0, 2 * Math.PI, Math.random)
    }
    reset(){}
    updatePath(transformA: mat3x2, transformB: mat3x2, segmentLength: number): number {
        const { normal, tangent, path } = this
        const endA = path[0], endB = path[path.length - 1]

        endA[0] = transformA[4]
        endA[1] = transformA[5]
        endB[0] = transformB[4]
        endB[1] = transformB[5]
        vec2.subtract(endB, endA, normal)
        const length = vec2.magnitude(normal)
        if(normal[0] < 0) vec2.rotate90ccw(normal, tangent)
        else vec2.rotate90cw(normal, tangent)
        vec2.scale(tangent, length && 1 / length, tangent)

        const prevLength = path.length - 1
        path.length = Math.max(2, length / segmentLength | 0)
        for(let i = path.length - 2; i >= prevLength; i--) path[i] = vec2()
        path[path.length - 1] = endB

        return length
    }
    public animatePath(deltaTime: number): vec2[] {
        const { normal, tangent, path } = this
        const endA = path[0], endB = path[path.length - 1]
        const time = this.timeElapsed += deltaTime
        
        const { controlA, controlB } = PuzzleWire
        const offsetX = this.amplitude * this.tension * 0.06 * Math.abs(normal[0]) * Math.sin(time * 2)
        controlA[0] = offsetX + lerp(endA[0], endB[0], 0.2)
        controlB[0] = offsetX + lerp(endB[0], endA[0], 0.2)
        const overhang = this.amplitude * this.tension * 0.36 * 0.5 * Math.max(0, Math.abs(normal[0]) - Math.abs(normal[1]))
        controlA[1] = controlB[1] = Math.max(endA[1], endB[1]) + overhang

        for(let length = path.length - 1, i = 1; i < length; i++){
            let point = path[i]
            let f = i / length
            cubicBezier(
                endA[0], endA[1],
                controlA[0], controlA[1],
                controlB[0], controlB[1],
                endB[0], endB[1],
                f, point
            )
            const waveform = (
                this.amplitude *
                ease.fade(f) *
                (0.5 + 0.5 * Math.cos(time * 2 + f * 0.5 * Math.PI + 0.5 * Math.PI)) *
                8 * Math.cos(time * 10 + f * 4 * Math.PI)
            )
            point[0] += tangent[0] * waveform
            point[1] += tangent[1] * waveform
        }
        return path
    }
    update(){
        
    }
}