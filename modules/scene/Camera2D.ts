import { vec2 } from 'math/vec2'
import { AABB } from 'math/AABB'
import { mat3x2 } from 'math/mat3x2'
import { mat3 } from 'math/mat3'
import { ReusableComponent } from 'framework/ReusableComponent'
import { IDataArray, OrderedDataArray } from 'framework/DataArray'
import { Transform2D } from './Transform2D'
import { RenderTarget } from 'renderer/context/RenderTarget'

interface Camera2DOptions {
    origin: vec2
    viewport: vec2
    crop: AABB
    preserveAspectRatio: boolean
    order: number
    range: vec2
    postEffects?: number[]
}

function transformAABB(aabb: AABB, mat: mat3x2, out: AABB): AABB {
    const a = mat[0], b = mat[1],
    c = mat[2], d = mat[3],
    tx = mat[4], ty = mat[5]

    const left = a * aabb[0] + c * aabb[1] + tx
    const top = b * aabb[0] + d * aabb[1] + ty
    const right = a * aabb[2] + c * aabb[3] + tx
    const bottom = b * aabb[2] + d * aabb[3] + ty

    out[0] = Math.min(left, right)
    out[1] = Math.min(top, bottom)
    out[2] = Math.max(left, right)
    out[3] = Math.max(top, bottom)
    return out
}

export class Camera2D extends ReusableComponent<Camera2DOptions> {
    static allocate(): IDataArray<Camera2D> {
        const dataArray = OrderedDataArray.allocate<Camera2D>() as any
        dataArray.comparator = (a: Camera2D, b: Camera2D): number => a.order - b.order
        return dataArray as IDataArray<Camera2D>
    }
    private static readonly projectionViewMatrix: mat3x2 = mat3x2()
    private static readonly inverseTransform: mat3x2 = mat3x2()

    public readonly viewMatrix: mat3 = mat3()
    public readonly invViewMatrix: mat3x2 = mat3x2()
    lastFrame: number = -1
    readonly origin: vec2 = vec2(0, 0)
    readonly viewport: vec2 = vec2(0, 0)
    readonly range: vec2 = vec2(-Infinity, Infinity)
    private preserveAspectRatio: boolean = false
    readonly bounds: AABB = AABB()
    order: number

    public renderTarget: RenderTarget = null
    public postEffects: number[]
    private readonly targetViewport: vec2 = vec2(0, 0)

    setup(options: Camera2DOptions){
        this.lastFrame = -1
        this.order = options.order || 0
        vec2.copy(options.origin || vec2.ZERO, this.origin)
        vec2.copy(options.viewport || vec2.ZERO, this.viewport)
        this.preserveAspectRatio = options.preserveAspectRatio || false
        this.postEffects = options.postEffects || []
        vec2.copy(options.range || [-Infinity, Infinity], this.range)
    }
    public calculateViewMatrix(transform: Transform2D, frame: number): void {
        if(transform && this.lastFrame < transform.lastFrame) this.lastFrame = -1

        if(this.renderTarget.width != this.targetViewport[0] || this.renderTarget.height != this.targetViewport[1]){
            vec2.fromValues(this.renderTarget.width, this.renderTarget.height, this.targetViewport)
            this.lastFrame = -1
        }

        if(this.lastFrame != -1) return
        this.lastFrame = frame

        const width = this.viewport[0], height = this.viewport[1]
        const left = width * -this.origin[0], right = left + width
        const top = height * -this.origin[1], bottom = top + height
        mat3x2.orthogonal(left, right, bottom, top, Camera2D.projectionViewMatrix)
        AABB.fromValues(left, top, right, bottom, this.bounds)

        this.adjustRenderTarget(width, height, this.renderTarget)

        if(transform){
            const globalTransform: mat3x2 = transform.globalTransform
            transformAABB(this.bounds, globalTransform, this.bounds)
            mat3x2.invert(globalTransform, Camera2D.inverseTransform)
            mat3x2.multiply(Camera2D.projectionViewMatrix, Camera2D.inverseTransform, Camera2D.projectionViewMatrix)
        }
        mat3.fromMat3x2(Camera2D.projectionViewMatrix, this.viewMatrix)
        //TODO take viewbox into account
        mat3x2.invert(Camera2D.projectionViewMatrix, this.invViewMatrix)
    }
    public cull(aabb: AABB){
        return AABB.overlap(this.bounds, aabb)
    }
    protected adjustRenderTarget(width: number, height: number, renderTarget: RenderTarget): void {
        let targetWidth = this.targetViewport[0],
        targetHeight = this.targetViewport[1]
        let offsetX = 0, offsetY = 0

        if(this.preserveAspectRatio){
            const aspectRatio = width / height
            const origin: vec2 = vec2.ZERO
            if(targetWidth / targetHeight > aspectRatio)
                offsetX = origin[0] * (targetWidth - (
                    targetWidth = targetHeight * aspectRatio
                ))
            else
                offsetY = origin[1] * (targetHeight - (
                    targetHeight = targetWidth / aspectRatio
                ))
        }
        renderTarget.viewbox(offsetX, offsetY, targetWidth, targetHeight)
    }
    reset(){
        this.renderTarget = null
        vec2.copy(vec2.ZERO, this.targetViewport)
    }
}