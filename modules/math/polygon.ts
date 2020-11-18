import { range } from './utilities'
import { vec2 } from './vec2'

export const lineIntersectionFraction = (a0: vec2, a1: vec2, b0: vec2, b1: vec2): number => {
    const ax = a1[0] - a0[0], ay = a1[1] - a0[1]
    const bx = b1[0] - b0[0], by = b1[1] - b0[1]
    const determinant = bx * ay - ax * by
    if(!determinant) return -1
    const sx = b0[0] - a0[0], sy = b0[1] - a0[1]
    const tb = (ax * sy - ay * sx) / determinant
    const ta = (bx * sy - by * sx) / determinant
    if(ta < 0 || ta > 1 || tb < 0 || tb > 1) return -1
    return ta
}

export const lineIntersection = (a0: vec2, a1: vec2, b0: vec2, b1: vec2, out: vec2): vec2 => {
	const ax = a1[0] - a0[0], ay = a1[1] - a0[1]
	const bx = b1[0] - b0[0], by = b1[1] - b0[1]
	const c0 = ay * a0[0] - ax * a0[1]
	const c1 = by * b0[0] - bx * b0[1]
    const det = by * ax - ay * bx
    const invDet = det && 1 / det
    out[0] = (ax * c1 - bx * c0) * invDet
    out[1] = (ay * c1 - by * c0) * invDet
    return out
}

const triangleGaussArea = (
    ax: number, ay: number, bx: number, by: number, cx: number, cy: number
): number => (bx-ax)*(cy-ay) - (cx-ax)*(by-ay)
export const triangleArea = (a: vec2, b: vec2, c: vec2): number =>
triangleGaussArea(a[0], a[1], b[0], b[1], c[0], c[1])

export const measureAngle = (a: vec2, b: vec2, c: vec2): number => {
    const d0x = b[0] - a[0]
    const d0y = b[1] - a[1]
    const d1x = c[0] - b[0]
    const d1y = c[1] - b[1]
    const dot01 = d0x*d1x + d0y*d1y
    const dot00 = d0x*d0x + d0y*d0y
    const dot11 = d1x*d1x + d1y*d1y
    return Math.acos(dot01 / Math.sqrt(dot00*dot11))
}

const hitTestTriangle = (
    px: number, py: number,
    ax: number, ay: number, bx: number, by: number, cx: number, cy: number
): boolean => {
    const v0x = cx-ax
    const v0y = cy-ay
    const v1x = bx-ax
    const v1y = by-ay
    const v2x = px-ax
    const v2y = py-ay

    const dot00 = v0x*v0x+v0y*v0y
    const dot01 = v0x*v1x+v0y*v1y
    const dot02 = v0x*v2x+v0y*v2y
    const dot11 = v1x*v1x+v1y*v1y
    const dot12 = v1x*v2x+v1y*v2y

    const invDenom = 1 / (dot00 * dot11 - dot01 * dot01)
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom
    return u >= 0 && v >= 0 && u+v < 1
}

export function triangulate(
    vertices: vec2[], start: number = 0, end: number = vertices.length, clockwise: boolean, out: number[] = []
): number[] {
    const length = end - start
    if(length < 3) return out
    const indices = range(length)
    for(let i = 0, remaining = length; remaining > 3;){
        let i0 = indices[(i + 0) % remaining] + start
        let i1 = indices[(i + 1) % remaining] + start
        let i2 = indices[(i + 2) % remaining] + start
        let x0 = vertices[i0][0], y0 = vertices[i0][1]
        let x1 = vertices[i1][0], y1 = vertices[i1][1]
        let x2 = vertices[i2][0], y2 = vertices[i2][1]
        let CCW = !clockwise == triangleGaussArea(x0, y0, x1, y1, x2, y2) >= 0
        if(CCW) for(let j = 0; j < remaining; j++){
            let index = indices[j] + start
            if(index === i0 || index === i1 || index === i2) continue
            if(!hitTestTriangle(vertices[index][0], vertices[index][1], x0, y0, x1, y1, x2, y2)) continue
            CCW = false
            break
        }
        if(CCW){
            out.push(i0, i1, i2)
            indices.splice((i + 1) % remaining, 1)
            remaining--
            i = 0
        }else if(3 * remaining < i++) break
    }
    out.push(indices[0], indices[1], indices[2])
    return out
}

export function signedPolygonArea(vertices: vec2[], start: number = 0, end: number = vertices.length): number {
    let total = 0
    for(let i = start, j = end - 1; i < end; j = i++)
        total += (vertices[j][0] - vertices[i][0]) * (vertices[j][1] + vertices[i][1])
    return -0.5 * total
}