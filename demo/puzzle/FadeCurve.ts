import { rgba } from 'math/rgba'
import { fade } from 'math/ease'
import { clamp } from 'math/utilities'
import { Curve, CurveOptions } from 'renderer/geometry/Curve'
import { Transform2D } from 'scene/Transform2D'
import { Material } from 'renderer/Material'

export class FadeCurve extends Curve {
    private static readonly color: rgba = rgba(0xFF, 0xFF, 0xFF, 0xFF)
    public colors: Uint32Array = new Uint32Array(0)

    public fadeOffset: number = 0

    setup(options: CurveOptions){
        super.setup(options)
        this.fadeOffset = 0
    }

    reallocate(){
        super.reallocate()
        const length = 2 * this.curve.length
        if(this.colors.length !== length) this.colors = new Uint32Array(length)
    }
    calculateVertexData(transform: Transform2D, material: Material, frame: number): void {
        super.calculateVertexData(transform, material, frame)
        if(this.lastFrame != frame) return

        const length = this.colors.length >>> 1
        const offset = this.fadeOffset * 2 - 1
        const { color } = FadeCurve
        for(let i = 0; i < length; i++){
            const t = i / (length - 1)
            color[3] = 0xFF * fade(clamp(t + offset, 0, 1))
            this.colors[i * 2 + 0] = this.colors[i * 2 + 1] = rgba.uint8Hex(color)
        }
    }
}