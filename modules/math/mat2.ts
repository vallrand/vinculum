import { vec2 } from './vec2'

export type mat2 = [
    number,number,
    number,number
]
export const mat2 = (): mat2 => mat2.identity(new Float32Array(4) as any)

mat2.copy = (mat: mat2, out: mat2): mat2 => {
    out[0] = mat[0]; out[1] = mat[1]
    out[2] = mat[2]; out[3] = mat[3]
    return out
}

mat2.identity = (out: mat2): mat2 => {
    out[0] = 1; out[1] = 0
    out[2] = 0; out[3] = 1
    return out
}

mat2.multiply = (a: mat2, b: mat2, out: mat2): mat2 => {
    const a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3]
    const b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3]
    out[0] = a0 * b0 + a2 * b1
    out[1] = a1 * b0 + a3 * b1
    out[2] = a0 * b2 + a2 * b3
    out[3] = a1 * b2 + a3 * b3
    return out
}

mat2.transform = (vec: vec2, mat: mat2, out: vec2): vec2 => {
    const x = vec[0], y = vec[1]
    out[0] = mat[0] * x + mat[2] * y
    out[1] = mat[1] * x + mat[3] * y
    return out
}