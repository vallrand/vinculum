import { vec2 } from './vec2'

export type mat3x2 = [
    number,number,
    number,number,
    number,number
]
export const mat3x2 = (): mat3x2 => mat3x2.identity(new Float32Array(6) as any)

mat3x2.identity = (out: mat3x2): mat3x2 => {
    out[0] = 1
    out[1] = 0
    out[2] = 0
    out[3] = 1
    out[4] = 0
    out[5] = 0
    return out
}

mat3x2.copy = (mat: mat3x2, out: mat3x2): mat3x2 => {
    out[0] = mat[0]
    out[1] = mat[1]
    out[2] = mat[2]
    out[3] = mat[3]
    out[4] = mat[4]
    out[5] = mat[5]
    return out
}

mat3x2.rotate = (mat: mat3x2, angle: number, out: mat3x2): mat3x2 => {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const a = mat[0], b = mat[1],
    c = mat[2], d = mat[3],
    tx = mat[4], ty = mat[5]
    
    out[0] = a * cos - b * sin
    out[1] = a * sin + b * cos
    out[2] = c * cos - d * sin
    out[3] = c * sin + d * cos
    out[4] = tx * cos - ty * sin
    out[5] = tx * sin + ty * cos
    return out
}

mat3x2.scale = (mat: mat3x2, scale: vec2, out: mat3x2): mat3x2 => {
    const x = scale[0], y = scale[1]
    out[0] = mat[0] * x
    out[1] = mat[1] * y
    out[2] = mat[2] * x
    out[3] = mat[3] * y
    out[4] = mat[4] * x
    out[5] = mat[5] * y
    return out
}

mat3x2.translate = (mat: mat3x2, translation: vec2, out: mat3x2): mat3x2 => {
    if(mat !== out){
        out[0] = mat[0]
        out[1] = mat[1]
        out[2] = mat[2]
        out[3] = mat[3]
    }
    out[4] = mat[4] + translation[0]
    out[5] = mat[5] + translation[1]
    return out
}

mat3x2.multiply = (left: mat3x2, right: mat3x2, out: mat3x2): mat3x2 => {
    const l0 = left[0], l1 = left[1], l2 = left[2],
    l3 = left[3], l4 = left[4], l5 = left[5]
    const r0 = right[0], r1 = right[1], r2 = right[2],
    r3 = right[3], r4 = right[4], r5 = right[5]
    out[0] = l0 * r0 + l2 * r1
    out[1] = l1 * r0 + l3 * r1
    out[2] = l0 * r2 + l2 * r3
    out[3] = l1 * r2 + l3 * r3
    out[4] = l0 * r4 + l2 * r5 + l4
    out[5] = l1 * r4 + l3 * r5 + l5
    return out
}

mat3x2.fromTransform = (
    x: number, y: number,
    pivotX: number, pivotY: number,
    scaleX: number, scaleY: number,
    rotation: number,
    skewX: number, skewY: number,
    out: mat3x2
): mat3x2 => {
    out[0] = Math.cos(rotation + skewY) * scaleX
    out[1] = Math.sin(rotation + skewY) * scaleX
    out[2] = -Math.sin(rotation - skewX) * scaleY
    out[3] = Math.cos(rotation - skewX) * scaleY
    out[4] = x - pivotX * out[0] - pivotY * out[2]
    out[5] = y - pivotX * out[1] - pivotY * out[3]
    return out
}

mat3x2.transform = (vec: vec2, mat: mat3x2, out: vec2): vec2 => {
    const x = vec[0], y = vec[1]
    out[0] = mat[0] * x + mat[2] * y + mat[4]
    out[1] = mat[1] * x + mat[3] * y + mat[5]
    return out
}

mat3x2.invert = (mat: mat3x2, out: mat3x2): mat3x2 => {
    const a = mat[0], b = mat[1],
    c = mat[2], d = mat[3],
    tx = mat[4], ty = mat[5]
    const determinant = a * d - b * c
    const invDet = determinant && 1 / determinant

    out[0] = d * invDet
    out[1] = -b * invDet
    out[2] = -c * invDet
    out[3] = a * invDet
    out[4] = (c * ty - d * tx) * invDet
    out[5] = (b * tx - a * ty) * invDet

    return out
}

mat3x2.orthogonal = (left: number, right: number, bottom: number, top: number, out: mat3x2): mat3x2 => {
    const lr = 1 / (left - right),
    bt = 1 / (bottom - top)
    out[0] = -2*lr; out[1] = 0
    out[2] = 0; out[3] = -2*bt
    out[4] = (left+right)*lr; out[5] = (top+bottom)*bt
    return out
}

mat3x2.IDENTITY = mat3x2()