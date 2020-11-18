import { EntityManager, IUpdateContext } from 'framework'
import { vec2, rgba, linearRemap, clamp, ease } from 'math'
import { Behaviour } from 'scene'
import { VectorGraphics } from 'renderer'

interface GlyphOptions {
    paths: Array<vec2[]>
    intervals: Array<[number, number]>
}

export class Glyph extends Behaviour<GlyphOptions> {
    private static readonly temp: vec2 = vec2()
    private static readonly normalRange: [number, number] = [0,1]
    private remappers: Array<(value: number) => number>
    private paths: Array<vec2[]>
    private lengths: Array<number[]> = []
    private totalDuration: number
    private elapsedTime: number
    setup({ paths, intervals }: GlyphOptions){
        this.elapsedTime = 0
        this.paths = paths
        this.totalDuration = intervals.reduce((max, range) => Math.max(max, range[1]), 0)
        this.remappers = intervals.map(range => value => clamp(linearRemap(range, Glyph.normalRange, value), 0, 1))
        this.lengths = paths.map(path => {
            const lengths = [0]
            for(let length = 0, i = 0; i < path.length - 1; i++)
                lengths.push(length += vec2.distance(path[i], path[i+1]))
            return lengths
        })
    }
    reset(){}
    update(context: IUpdateContext, manager: EntityManager, deferred: Function[]){
        const graphics = manager.aquireComponent(this.entity, VectorGraphics) as VectorGraphics
        if(!graphics) return

        if(this.elapsedTime >= this.totalDuration) return
        this.elapsedTime += context.deltaTime

        graphics.clear()
        for(let i = this.paths.length - 1; i >= 0; i--){
            const path = this.paths[i]
            const lengths = this.lengths[i]
            const totalLength = lengths[lengths.length - 1]

            const time = this.remappers[i](this.elapsedTime)
            const maxLength = ease.quadOut(time) * totalLength
        
            let index: number
            for(index = lengths.length - 1; index >= 0; index--)
                if(lengths[index] <= maxLength) break
            
            for(let j = 0; j <= index; j++){
                const point = path[j]
                if(!j) graphics.beginPath(point[0], point[1])
                else graphics.lineTo(point[0], point[1])
            }
            
            if(time < 1){
                const prev = lengths[index]
                const next = lengths[index + 1]
                const t = (maxLength - prev) / (next - prev)
    
                vec2.lerp(path[index], path[index + 1], t, Glyph.temp)
                graphics.lineTo(Glyph.temp[0], Glyph.temp[1])
            }

            graphics.stroke(rgba.WHITE)
        }
    }
}