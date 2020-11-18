import { AABB } from 'math/AABB'
import { mat3x2 } from 'math/mat3x2'
import { ReusableComponent } from 'framework/ReusableComponent'
import { IDataArray, OrderedDataArray } from 'framework/DataArray'
import { Transform2D } from 'scene/Transform2D'
import { Material } from '../Material'

const drawOrderSort = (a: Geometry2D, b: Geometry2D): number => a.order - b.order

export abstract class Geometry2D<Options = any> extends ReusableComponent<Options> {
    static readonly delegate = Geometry2D
    static allocate(): IDataArray<Geometry2D> {
        const dataArray = OrderedDataArray.allocate<Geometry2D>() as any
        dataArray.comparator = drawOrderSort
        return dataArray as IDataArray<Geometry2D>
    }

    public readonly vertices: Float32Array
    public readonly uvs: Uint32Array
    public readonly colors?: Uint32Array
    public readonly indices: Uint8Array | Uint16Array | Uint32Array
    
    public order: number = 0
    public lastRenderFrame: number = -1
    public readonly aabb: AABB = AABB()
    protected recalculateBoundingBox(): void {
        let minX = Infinity, minY = Infinity
        let maxX = -Infinity, maxY = -Infinity
        for(let i = this.vertices.length - 1; i > 0; i-=2){
            minX = Math.min(minX, this.vertices[i - 1])
            maxX = Math.max(maxX, this.vertices[i - 1])
            minY = Math.min(minY, this.vertices[i])
            maxY = Math.max(maxY, this.vertices[i])
        }
        AABB.fromValues(minX, minY, maxX, maxY, this.aabb)
    }
    abstract calculateVertexData(transform: Transform2D, material: Material, frame: number): void
    protected recalculateVertices(vertices: number[], transform: mat3x2, out: Float32Array, offset: number = 0){
        const a = transform[0], b = transform[1],
        c = transform[2], d = transform[3],
        tx = transform[4], ty = transform[5]
        for(let i = vertices.length - 1; i > 0; i-=2){
            let x = vertices[i - 1], y = vertices[i]
            out[offset + i - 1] = a * x + c * y + tx
            out[offset + i] = b * x + d * y + ty
        }
    }
    protected recalculateUVs(uvs: number[], uvTransform: mat3x2, out: Uint32Array, offset: number = 0){
        const a = uvTransform[0], b = uvTransform[1],
        c = uvTransform[2], d = uvTransform[3],
        tx = uvTransform[4], ty = uvTransform[5]
        for(let i = uvs.length - 1; i > 0; i-=2){
            let u = uvs[i - 1], v = uvs[i]
            let ut = a * u + c * v + tx
            let vt = b * u + d * v + ty
            out[offset + (i >>> 1)] = (vt * 0xFFFF << 16) | 0xFFFF & (ut * 0xFFFF | 0)
        }
    }
}
    