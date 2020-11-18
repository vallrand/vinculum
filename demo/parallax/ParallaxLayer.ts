import { ObjectPool } from 'common/ObjectPool'
import { vec2, rgba, AABB } from 'math'
import { ReusableComponent, EntityManager, IUpdateContext } from 'framework'
import { Material } from 'renderer'


export class Tile {
    position: vec2 = vec2()
    rotation: number = 0
    scale: vec2 = vec2(1, 1)
    color: rgba = rgba(0xFF, 0xFF, 0xFF, 0xFF)
}

interface ParallaxLayerOptions {
    randomize: (this: IUpdateContext, column: number, row: number, out: vec2) => vec2
    padding: vec2
    offset: number
    scale: number
    maxZoom: number
    zoomRange: number
    tileWidth: number
    tileHeight: number
}

const depthZoom = (maxZoom: number, zoomRange: number) => (zoom: number) => maxZoom - maxZoom / (zoomRange * zoom + 1)

export class ParallaxLayer extends ReusableComponent<ParallaxLayerOptions> {
    private static readonly temp: vec2 = vec2()
    private static readonly CENTER: vec2 = vec2(0.5, 0.5)
    private static readonly pool: ObjectPool<Tile> = new ObjectPool<Tile>(index => new Tile)
    private static readonly region: AABB = AABB()
    private static readonly tileLimit: number = 512

    public readonly tiles: Tile[] = []
    private options: ParallaxLayerOptions
    private readonly padding: vec2 = vec2(0, 0)

    setup(options: ParallaxLayerOptions){
        this.options = options
        vec2.copy(options.padding || vec2.ZERO, this.padding)
    }
    update(manager: EntityManager, context: IUpdateContext, view: AABB){
        const material = manager.aquireComponent<Material>(this.entity, Material)
        const { width, height } = material.diffuse

        const tileWidth = width * this.options.tileWidth
        const tileHeight = height * this.options.tileHeight

        const region = this.parallaxRegion(view, tileWidth, tileHeight, ParallaxLayer.region)

        const minX = Math.floor(region[0] / tileWidth - this.padding[0])
        const maxX = Math.ceil(region[2] / tileWidth + this.padding[0])
        const minY = Math.floor(region[1] / tileHeight - this.padding[1])
        const maxY = Math.ceil(region[3] / tileHeight + this.padding[1])

        const scaleX = (view[2] - view[0]) / (region[2] - region[0])
        const scaleY = (view[3] - view[1]) / (region[3] - region[1])
        const offsetX = view[0] - region[0] * scaleX
        const offsetY = view[1] - region[1] * scaleY

        let index = 0
        fill: for(let x = minX; x <= maxX; x++)
        for(let y = minY; y <= maxY; y++){
            if(!this.tiles[index]) this.tiles[index] = ParallaxLayer.pool.aquire()
            const cell = this.tiles[index++]
            const origin = this.options.randomize ? this.options.randomize.call(context, x, y, ParallaxLayer.temp) : ParallaxLayer.CENTER
            cell.position[0] = (x * tileWidth + origin[0] * tileWidth) * scaleX + offsetX
            cell.position[1] = (y * tileHeight + origin[1] * tileHeight) * scaleY + offsetY
            cell.scale[0] = width * scaleX
            cell.scale[1] = height * scaleY
            rgba.copy(material.color, cell.color)
            if(index > ParallaxLayer.tileLimit) break fill
        }
        while(this.tiles.length > index) ParallaxLayer.pool.recycle(this.tiles.pop())
    }
    parallaxRegion(view: AABB, width: number, height: number, out: AABB): AABB {
        const { offset, zoomRange, maxZoom, scale } = this.options

        const centerX = 0.5 * (view[0] + view[2]) * offset
        const centerY = 0.5 * (view[1] + view[3]) * offset

        if(scale){
            const sizeX = 0.5 * (view[2] - view[0]) * scale
            const sizeY = 0.5 * (view[3] - view[1]) * scale
            out[0] = centerX - sizeX
            out[1] = centerY - sizeY
            out[2] = centerX + sizeX
            out[3] = centerY + sizeY
            return out
        }

        const zoom = depthZoom(maxZoom, zoomRange)((view[2] - view[0]) / width)
        const sizeX = 0.5 * width * zoom
        const sizeY = 0.5 * height * zoom

        out[0] = centerX - sizeX
        out[1] = centerY - sizeY
        out[2] = centerX + sizeX
        out[3] = centerY + sizeY
        return out
    }
    reset(){
        while(this.tiles.length) ParallaxLayer.pool.recycle(this.tiles.pop())
    }
}