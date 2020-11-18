import { vec2 } from 'math/vec2'
import { mat3x2 } from 'math/mat3x2'
import {
    quadraticBezierLength, cubicBezierLength,
    quadraticBezier, cubicBezier
} from 'math/curve'
import { rgba } from 'math/rgba'
import { clamp } from 'math/utilities'
import { Transform2D } from 'scene/Transform2D'
import { Material } from '../Material'
import { Geometry2D } from './Geometry2D'
import { VectorPath, LineJoin, LineCap, VectorPathOptions } from './VectorPath'

interface VectorGraphicsOptions {
    order: number
    style: VectorPathOptions
}

export class VectorGraphics extends Geometry2D<VectorGraphicsOptions> {
    private static readonly temp: vec2 = vec2()
    public vertices: Float32Array = new Float32Array(0)
    public uvs: Uint32Array = new Uint32Array(0)
    public indices: Uint16Array = new Uint16Array(0)
    public colors: Uint32Array = new Uint32Array(0)

    private lastTextureIndex: number = -1
    lastFrame: number = -1

    private arraybuffer: ArrayBuffer = new ArrayBuffer(0)
    private readonly vertexArray: number[] = []
    private readonly indexArray: number[] = []
    private readonly colorArray: number[] = []
    private readonly uvArray: number[] = []

    setup(options: VectorGraphicsOptions){
        this.lastTextureIndex = -1
        this.lastFrame = -1
        this.order = options.order || 0
        Object.assign(this.path.style, options.style)
    }
    private reallocate(){
        const vertexCount = this.vertexArray.length / 2
        const indexCount = this.indexArray.length
        const byteLength = (
            this.indices.BYTES_PER_ELEMENT * indexCount +
            this.vertices.BYTES_PER_ELEMENT * 2 * vertexCount +
            this.uvs.BYTES_PER_ELEMENT * vertexCount +
            this.colors.BYTES_PER_ELEMENT * vertexCount
        )
        if(this.arraybuffer.byteLength < byteLength) //TODO shrink if a.bl > bl / 4
            this.arraybuffer = new ArrayBuffer(byteLength)
        else if(this.indices.length === indexCount && this.vertices.length === 2 * vertexCount) return

        let offset = 0
        this.vertices = new Float32Array(this.arraybuffer, offset, 2 * vertexCount)
        offset += this.vertices.BYTES_PER_ELEMENT * this.vertices.length
        this.uvs = new Uint32Array(this.arraybuffer, offset, vertexCount)
        offset += this.uvs.BYTES_PER_ELEMENT * this.uvs.length
        this.colors = new Uint32Array(this.arraybuffer, offset, vertexCount)
        offset += this.colors.BYTES_PER_ELEMENT * this.colors.length
        this.indices = new Uint16Array(this.arraybuffer, offset, indexCount)
        this.lastFrame = this.lastTextureIndex = -1
    }
    calculateVertexData(transform: Transform2D, material: Material, frame: number): void {
        if(this.lastFrame == -1) this.reallocate()

        if(this.lastTextureIndex != material.diffuse.index){
            this.lastTextureIndex = material.diffuse.index
            this.recalculateUVs(this.uvArray, material.diffuse.uvTransform, this.uvs)
            this.lastFrame = -1
        }

        if(transform && this.lastFrame < transform.lastFrame) this.lastFrame = -1
        if(this.lastFrame != -1) return
        this.lastFrame = frame

        const color = rgba()
        for(let i = 0; i < this.colors.length; i++){
            //TODO optimize? use uin8 array view?
            color[0] = this.colorArray[i * 4 + 0]
            color[1] = this.colorArray[i * 4 + 1]
            color[2] = this.colorArray[i * 4 + 2]
            color[3] = this.colorArray[i * 4 + 3]
            rgba.multiply(color, material.color, color)
            this.colors[i] = rgba.uint8Hex(color)
        }
        
        this.indices.set(this.indexArray)
        this.recalculateVertices(this.vertexArray, transform ? transform.globalTransform : mat3x2.IDENTITY, this.vertices)
        this.recalculateBoundingBox()
    }

    private readonly path: VectorPath = new VectorPath
    public setTransform(transform: mat3x2): this {
        mat3x2.copy(transform, this.path.transform)
        return this
    }
    public beginPath(x: number, y: number): this {
        this.path.beginPath(x, y)
        return this
    }
    public lineTo(x: number, y: number): this {
        this.path.lineTo(x, y)
        return this
    }
    public quadraticCurveTo(cpX: number, cpY: number, toX: number, toY: number): this {
        const fromX = this.path.last[0]
        const fromY = this.path.last[1]
        const arcLength = quadraticBezierLength(fromX, fromY, cpX, cpY, toX, toY)
        const subdivisions = clamp(Math.ceil(0.1 * arcLength), 4, 1024)
        const { temp } = VectorGraphics
        for(let i = 1; i <= subdivisions; i++){
            const t = i / subdivisions
            quadraticBezier(fromX, fromY, cpX, cpY, toX, toY, t, temp)
            this.lineTo(temp[0], temp[1])
        }
        return this
    }
    public bezierCurveTo(cp1X: number, cp1Y: number, cp2X: number, cp2Y: number, toX: number, toY: number): this {
        const fromX = this.path.last[0]
        const fromY = this.path.last[1]
        const arcLength = cubicBezierLength(fromX, fromY, cp1X, cp1Y, cp2X, cp2Y, toX, toY)
        const subdivisions = clamp(Math.ceil(0.1 * arcLength), 4, 1024)
        const { temp } = VectorGraphics
        for(let i = 1; i <= subdivisions; i++){
            const t = i / subdivisions
            cubicBezier(fromX, fromY, cp1X, cp1Y, cp2X, cp2Y, toX, toY, t, temp)
            this.lineTo(temp[0], temp[1])
        }
        return this
    }
    public arcTo(
        x1: number, y1: number, x2: number, y2: number, radius: number
    ): this {
        const fromX = this.path.last[0]
        const fromY = this.path.last[1]

        const a1 = fromY - y1
        const b1 = fromX - x1
        const a2 = y2 - y1
        const b2 = x2 - x1
        const mm = Math.abs(a1 * b2 - b1 * a2)

        if(mm < 1.0e-8 || radius === 0){
            if(fromX !== x1 || fromY !== y1)
                this.lineTo(x1, y1)
            return this
        }

        const dd = a1 * a1 + b1 * b1
        const cc = a2 * a2 + b2 * b2
        const tt = a1 * a2 + b1 * b2
        const k1 = radius * Math.sqrt(dd) / mm
        const k2 = radius * Math.sqrt(cc) / mm
        const j1 = k1 * tt / dd
        const j2 = k2 * tt / cc
        const cx = k1 * b2 + k2 * b1
        const cy = k1 * a2 + k2 * a1
        const px = b1 * (k2 + j1)
        const py = a1 * (k2 + j1)
        const qx = b2 * (k1 + j2)
        const qy = a2 * (k1 + j2)

        return this.arc(
            cx + x1,
            cy + y1,
            radius,
            Math.atan2(py - cy, px - cx),
            Math.atan2(qy - cy, qx - cx),
            b1 * a2 > b2 * a1
        )
    }
    public arc(
        x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise: boolean = false
    ): this {
        if(!anticlockwise && endAngle <= startAngle) endAngle += 2 * Math.PI
        else if(anticlockwise && startAngle <= endAngle) startAngle += 2 * Math.PI
        
        const arcAngle = endAngle - startAngle
        const arcLength = Math.abs(arcAngle * radius)
        const subdivisions = clamp(Math.ceil(0.1 * arcLength), 4, 1024)

        const subAngle = arcAngle / (subdivisions - 1)
        for(let i = 0; i < subdivisions; i++){
            const angle = i * subAngle + startAngle
            const ax = Math.cos(angle) * radius + x
            const ay = Math.sin(angle) * radius + y
            this.lineTo(ax, ay)
        }
        return this
    }
    public closePath(): this {
        this.path.closePath()
        return this
    }
    stroke(color: rgba = rgba.WHITE, width?: number): this {
        if(width != null) this.path.style.width = width
        const count = this.path.batchStroke(this.vertexArray, this.indexArray)
        for(let i = 0; i < count; i++){
            this.colorArray.push(color[0], color[1], color[2], color[3])
            this.uvArray.push((i >>> 1) / (count >>> 1), i % 2)
        }
        this.lastFrame = -1
        return this
    }
    fill(color: rgba = rgba.WHITE): this {
        const count = this.path.batchPolygon(this.vertexArray, this.indexArray)
        for(let i = 0; i < count; i++){
            this.colorArray.push(color[0], color[1], color[2], color[3])
            this.uvArray.push(0, 0)
        }
        this.lastFrame = -1
        return this
    }
    clear(): this {
        this.vertexArray.length = 0
        this.indexArray.length = 0
        this.colorArray.length = 0
        this.uvArray.length = 0
        this.lastFrame = -1
        return this
    }
    reset(){
        this.clear()
    }
}