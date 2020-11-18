export type vec3 = [number, number, number]
export const vec3 = (x: number = 0, y: number = 0, z: number = 0): vec3 =>
vec3.fromValues(x, y, z, new Float32Array(3) as any)

vec3.copy = (vec: vec3, out: vec3): vec3 => {
    out[0] = vec[0]
    out[1] = vec[1]
    out[2] = vec[2]
    return out
}
vec3.fromValues = (x: number, y: number, z: number, out: vec3): vec3 => {
    out[0] = x
    out[1] = y
    out[2] = z
    return out
}

vec3.dot = (a: vec3, b: vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

vec3.subtract = (a: vec3, b: vec3, out: vec3): vec3 => {
    out[0] = a[0] - b[0]
    out[1] = a[1] - b[1]
    out[2] = a[2] - b[2]
    return out
}

vec3.add = (a: vec3, b: vec3, out: vec3): vec3 => {
    out[0] = a[0] + b[0]
    out[1] = a[1] + b[1]
    out[2] = a[2] + b[2]
    return out
}

vec3.cross = (a: vec3, b: vec3, out: vec3): vec3 => {
    const ax = a[0], ay = a[1], az = a[2]
    const bx = b[0], by = b[1], bz = b[2]
  
    out[0] = ay * bz - az * by
    out[1] = az * bx - ax * bz
    out[2] = ax * by - ay * bx
    return out
}
  
vec3.magnitudeSquared = (vec: vec3): number => vec[0]*vec[0] + vec[1]*vec[1] + vec[2]*vec[2]
vec3.magnitude = (vec: vec3): number => Math.sqrt(vec3.magnitudeSquared(vec))
vec3.normalize = (vec: vec3, out: vec3): vec3 => {
    const x = vec[0], y = vec[1], z = vec[2]
    const lengthSqrt = x*x + y*y + z*z
    const invLength = lengthSqrt && 1 / Math.sqrt(lengthSqrt)
    out[0] = x * invLength
    out[1] = y * invLength
    out[2] = z * invLength
    return out
}
  
vec3.scale = (vec: vec3, s: number, out: vec3): vec3 => {
    out[0] = vec[0] * s
    out[1] = vec[1] * s
    out[2] = vec[2] * s
    return out
}

vec3.multiply = (a: vec3, b: vec3, out: vec3): vec3 => {
    out[0] = a[0] * b[0]
    out[1] = a[1] * b[1]
    out[2] = a[2] * b[2]
    return out
}

vec3.lerp = (a: vec3, b: vec3, t: number, out: vec3): vec3 => {
    out[0] = a[0] + t * (b[0] - a[0])
    out[1] = a[1] + t * (b[1] - a[1])
    out[2] = a[2] + t * (b[2] - a[2])
    return out
}

vec3.ZERO = vec3(0, 0, 0)
vec3.AXIS_X = vec3(1, 0, 0)
vec3.AXIS_Y = vec3(0, 1, 0)
vec3.AXIS_Z = vec3(0, 0, 1)