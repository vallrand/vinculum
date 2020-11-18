export type vec4 = [number, number, number, number]
export const vec4 = (x: number = 0, y: number = 0, z: number = 0, w = 1): vec4 =>
vec4.fromValues(x, y, z, w, new Float32Array(4) as any)

vec4.copy = (vec: vec4, out: vec4): vec4 => {
    out[0] = vec[0]
    out[1] = vec[1]
    out[2] = vec[2]
    out[3] = vec[3]
    return out
}
vec4.fromValues = (x: number, y: number, z: number, w: number, out: vec4): vec4 => {
    out[0] = x
    out[1] = y
    out[2] = z
    out[3] = w
    return out
}

vec4.dot = (a: vec4, b: vec4): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]

vec4.scale = (vec: vec4, s: number, out: vec4): vec4 => {
    out[0] = vec[0] * s
    out[1] = vec[1] * s
    out[2] = vec[2] * s
    out[3] = vec[3] * s
    return out
}

vec4.normalize = (vec: vec4, out: vec4): vec4 => {
    const x = vec[0], y = vec[1], z = vec[2], w = vec[3]
    const lengthSqrt = x*x + y*y + z*z + w*w
    const invLength = lengthSqrt && 1 / Math.sqrt(lengthSqrt)
    out[0] = x * invLength
    out[1] = y * invLength
    out[2] = z * invLength
    out[3] = w * invLength
    return out
}

vec4.multiply = (a: vec4, b: vec4, out: vec4): vec4 => {
    out[0] = a[0] * b[0]
    out[1] = a[1] * b[1]
    out[2] = a[2] * b[2]
    out[3] = a[3] * b[3]
    return out
}

vec4.lerp = (a: vec4, b: vec4, t: number, out: vec4): vec4 => {
    out[0] = a[0] + t * (b[0] - a[0])
    out[1] = a[1] + t * (b[1] - a[1])
    out[2] = a[2] + t * (b[2] - a[2])
    out[3] = a[3] + t * (b[3] - a[3])
    return out
}

vec4.temp = vec4()
vec4.ZERO = vec4(0,0,0,0)