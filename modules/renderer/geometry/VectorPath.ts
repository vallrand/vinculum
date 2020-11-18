import { vec2 } from 'math/vec2'
import { mat3x2 } from 'math/mat3x2'
import { triangulate, signedPolygonArea } from 'math/polygon'

export const enum LineCap {
    BUTT = 0,
    ROUND = 1,
    SQUARE = 2
}

export const enum LineJoin {
    MITER = 0,
    BEVEL = 1,
    ROUND = 2
}

export interface VectorPathOptions {
    width: number
    miterLimit: number
    alignment: number
    cap: LineCap
    join: LineJoin
}

export class VectorPath {
    private static epsilon: number = 1e-3
    private readonly path: vec2[] = [vec2()]
    public readonly transform: mat3x2 = mat3x2()
    public length: number = 0
    get last(): vec2 { return this.path[this.length] }
    get first(): vec2 { return this.path[0] }

    public readonly style: VectorPathOptions = {
        width: 1,
        miterLimit: 1,
        alignment: 0.5,
        cap: LineCap.BUTT,
        join: LineJoin.MITER
    }
    private push(): vec2 {
        if(++this.length == this.path.length) this.path.push(vec2())
        return this.path[this.length]
    }
    public beginPath(x: number, y: number){
        this.length = 0
        vec2.fromValues(x, y, this.last)
        mat3x2.transform(this.last, this.transform, this.last)
    }
    public lineTo(x: number, y: number){
        const { last } = this
        vec2.fromValues(x, y, this.push())
        mat3x2.transform(this.last, this.transform, this.last)
        if(this.last[0] == last[0] && this.last[1] == last[1]) this.length--
    }
    public closePath(){
        const { last } = this
        vec2.copy(this.first, this.push())
        if(this.last[0] == last[0] && this.last[1] == last[1]) this.length--
    }
    batchPolygon(vertexArray: number[], indexArray: number[]): number {
        const { path, length, style } = this
        const clockwise = signedPolygonArea(path, 0, length) > 0
        const indices = triangulate(path, 0, length, clockwise, [])
        if(!indices.length) return 0
        const indexOffset = vertexArray.length / 2
        for(let i = 0; i < indices.length; i++)
            indexArray.push(indices[i] + indexOffset)
        for(let i = 0; i < length; i++)
            vertexArray.push(path[i][0], path[i][1])
        return length
    }
    batchStroke(vertexArray: number[], indexArray: number[]): number {
        let { path, length, first, last, style } = this
        if(!length) return 0
        const closedPath = first[0] === last[0] && first[1] === last[1]

        if(closedPath){
            first = vec2.add(path[1], last, this.push())
            vec2.scale(first, 0.5, first)
            length = this.length--
        }

        const innerWeight = (1 - style.alignment) * 2
        const outerWeight = style.alignment * 2
        const width = 0.5 * style.width
        const widthSquared = width * width
        const miterLimitSquared = style.miterLimit * style.miterLimit

        const indexOffset = vertexArray.length / 2

        let x0 = first[0], y0 = first[1]
        let x1 = path[1][0], y1 = path[1][1]
        let tx0 = y1 - y0, ty0 = x0 - x1
        let scale = width / Math.sqrt(tx0*tx0 + ty0*ty0)
        tx0 *= scale
        ty0 *= scale
        
        if(!closedPath) if(style.cap === LineCap.ROUND) round(
            x0 - tx0 * 0.5 * (innerWeight - outerWeight),
            y0 - ty0 * 0.5 * (innerWeight - outerWeight),
            x0 - tx0 * innerWeight, y0 - ty0 * innerWeight,
            x0 + tx0 * outerWeight, y0 + ty0 * outerWeight,
            true, vertexArray
        )
        else if(style.cap === LineCap.SQUARE) 
            vertexArray.push(
                x1 - tx0 * innerWeight + ty0,
                y1 - ty0 * innerWeight - tx0,
                x1 + tx0 * outerWeight + ty0,
                y1 + ty0 * outerWeight - tx0
            )

        vertexArray.push(
            x0 - tx0 * innerWeight, y0 - ty0 * innerWeight,
            x0 + tx0 * outerWeight, y0 + ty0 * outerWeight
        )

        for(let i = 1; i < length; i++){
            let x2 = path[i + 1][0]
            let y2 = path[i + 1][1]
            let tx1 = y2 - y1
            let ty1 = x1 - x2
            let scale = width / Math.sqrt(tx1*tx1 + ty1*ty1)
            tx1 *= scale
            ty1 *= scale
            
            const dx0 = x1 - x0, dy0 = y0 - y1
            const dx1 = x1 - x2, dy1 = y2 - y1
            const cross = dy0 * dx1 - dy1 * dx0
            const clockwise = cross < 0
    
            if(Math.abs(cross) < VectorPath.epsilon)
                vertexArray.push(
                    x1 - tx0 * innerWeight, y1 - ty0 * innerWeight,
                    x1 + tx0 * outerWeight, y1 + ty0 * outerWeight
                )
            else{
                const c1 = (x0 - tx0) * (y1 - ty0) - (x1 - tx0) * (y0 - ty0)
                const c2 = (x2 - tx1) * (y1 - ty1) - (x1 - tx1) * (y2 - ty1)
                const px = (dx0 * c2 - dx1 * c1) / cross - x1
                const py = (dy1 * c1 - dy0 * c2) / cross - y1
        
                const imx = x1 + px * innerWeight
                const imy = y1 + py * innerWeight
                const omx = x1 - px * outerWeight
                const omy = y1 - py * outerWeight

                if(style.join === LineJoin.BEVEL || (px*px + py*py) / widthSquared > miterLimitSquared){
                    if(clockwise) vertexArray.push(
                        imx, imy,
                        x1 + tx0 * outerWeight, y1 + ty0 * outerWeight,
                        imx, imy,
                        x1 + tx1 * outerWeight, y1 + ty1 * outerWeight
                    )
                    else vertexArray.push(
                        x1 - tx0 * innerWeight, y1 - ty0 * innerWeight,
                        omx, omy,
                        x1 - tx1 * innerWeight, y1 - ty1 * innerWeight,
                        omx, omy
                    )
                }else if(style.join === LineJoin.ROUND){
                    if(clockwise){
                        vertexArray.push(imx, imy)
                        vertexArray.push(x1 + tx0 * outerWeight, y1 + ty0 * outerWeight)
        
                        round(
                            x1, y1,
                            x1 + tx0 * outerWeight, y1 + ty0 * outerWeight,
                            x1 + tx1 * outerWeight, y1 + ty1 * outerWeight,
                            true, vertexArray
                        )
        
                        vertexArray.push(imx, imy)
                        vertexArray.push(x1 + tx1 * outerWeight, y1 + ty1 * outerWeight)
                    }else{
                        vertexArray.push(x1 - tx0 * innerWeight, y1 - ty0 * innerWeight)
                        vertexArray.push(omx, omy)
        
                        round(
                            x1, y1,
                            x1 - tx0 * innerWeight, y1 - ty0 * innerWeight,
                            x1 - tx1 * innerWeight, y1 - ty1 * innerWeight,
                            false, vertexArray
                        )
        
                        vertexArray.push(x1 - tx1 * innerWeight, y1 - ty1 * innerWeight)
                        vertexArray.push(omx, omy)
                    }
                }else vertexArray.push(imx, imy, omx, omy)
            }
            x0 = x1
            y0 = y1
            x1 = x2
            y1 = y2
            tx0 = tx1
            ty0 = ty1
        }

        vertexArray.push(
            x1 - tx0 * innerWeight, y1 - ty0 * innerWeight,
            x1 + tx0 * outerWeight, y1 + ty0 * outerWeight
        )

        if(!closedPath) if(style.cap === LineCap.ROUND) round(
            x1 - tx0 * 0.5 * (innerWeight - outerWeight),
            y1 - ty0 * 0.5 * (innerWeight - outerWeight),
            x1 - tx0 * innerWeight, y1 - ty0 * innerWeight,
            x1 + tx0 * outerWeight, y1 + ty0 * outerWeight,
            false, vertexArray
        )
        else if(style.cap === LineCap.SQUARE) 
            vertexArray.push(
                x1 - tx0 * innerWeight - ty0,
                y1 - ty0 * innerWeight + tx0,
                x1 + tx0 * outerWeight - ty0,
                y1 + ty0 * outerWeight + tx0
            )
        
        const epsilonSquared = VectorPath.epsilon * VectorPath.epsilon
        const indexCount = vertexArray.length / 2 - indexOffset

        x0 = vertexArray[indexOffset * 2 + 0]
        y0 = vertexArray[indexOffset * 2 + 1]
        x1 = vertexArray[indexOffset * 2 + 2]
        y1 = vertexArray[indexOffset * 2 + 3]
        for(let i = indexOffset + 2, end = indexOffset + indexCount; i < end; i++){
            let x2 = vertexArray[i * 2]
            let y2 = vertexArray[i * 2 + 1]
            let signedArea = x0 * (y1 - y2) + x1 * (y2 - y0) + x2 * (y0 - y1)
            x0 = x1
            y0 = y1
            x1 = x2
            y1 = y2
            if(Math.abs(signedArea) < epsilonSquared) continue
            if(signedArea < 0) indexArray.push(i - 2, i - 1, i)
            else indexArray.push(i - 2, i, i - 1)
        }
        return indexCount
    }
}

function round(
    cx: number, cy: number,
    sx: number, sy: number,
    ex: number, ey: number,
    clockwise: boolean,
    vertexArray: number[]
): number{
    const cx2p0x = sx - cx
    const cy2p0y = sy - cy

    let angle0 = Math.atan2(cx2p0x, cy2p0y)
    let angle1 = Math.atan2(ex - cx, ey - cy)

    if(clockwise && angle0 < angle1)
        angle0 += Math.PI * 2
    else if(!clockwise && angle0 > angle1)
        angle1 += Math.PI * 2
    
    let startAngle = angle0
    const angleDiff = angle1 - angle0
    const absAngleDiff = Math.abs(angleDiff)

    const radius = Math.sqrt(cx2p0x * cx2p0x + cy2p0y * cy2p0y)
    const segCount = ((15 * absAngleDiff * Math.sqrt(radius) / Math.PI) >> 0) + 1
    const angleInc = angleDiff / segCount

    startAngle += angleInc

    if(clockwise){
        vertexArray.push(cx, cy)
        vertexArray.push(sx, sy)

        for(let i = 1, angle = startAngle; i < segCount; i++, angle += angleInc)
            vertexArray.push(
                cx, cy,
                cx + Math.sin(angle) * radius,
                cy + Math.cos(angle) * radius
            )

        vertexArray.push(cx, cy)
        vertexArray.push(ex, ey)
    }else{
        vertexArray.push(sx, sy)
        vertexArray.push(cx, cy)

        for(let i = 1, angle = startAngle; i < segCount; i++, angle += angleInc)
            vertexArray.push(
                cx + Math.sin(angle) * radius,
                cy + Math.cos(angle) * radius,
                cx, cy
            )

        vertexArray.push(ex, ey)
        vertexArray.push(cx, cy)
    }
    return segCount * 2
}