export type vec2 = [number, number]
export const vec2 = (x: number = 0, y: number = x): vec2 => vec2.fromValues(x, y, new Float32Array(2) as any)

vec2.cross = (a: vec2, b: vec2): number => a[0] * b[1] - a[1] * b[0]
vec2.rotate = (vec: vec2, a: number, out: vec2): vec2 => {
    const cos = Math.cos(a)
    const sin = Math.sin(a)
    const x = vec[0]
    const y = vec[1]
    out[0] = cos * x - sin * y
    out[1] = sin * x + cos * y
    return out
}
vec2.rotate90cw = (vec: vec2, out: vec2): vec2 => {
    const temp = -vec[0]
    out[0] = vec[1]
    out[1] = temp
    return out
}
vec2.rotate90ccw = (vec: vec2, out: vec2): vec2 => {
    const temp = -vec[1]
    out[1] = vec[0]
    out[0] = temp
    return out
}
vec2.copy = (vec: vec2, out: vec2): vec2 => {
    out[0] = vec[0]
    out[1] = vec[1]
    return out
}
vec2.fromValues = (x: number, y: number, out: vec2): vec2 => {
    out[0] = x
    out[1] = y
    return out
}
vec2.add = (a: vec2, b: vec2, out: vec2): vec2 => {
    out[0] = a[0] + b[0]
    out[1] = a[1] + b[1]
    return out
}
vec2.subtract = (a: vec2, b: vec2, out: vec2): vec2 => {
    out[0] = a[0] - b[0]
    out[1] = a[1] - b[1]
    return out
}
vec2.multiply = (a: vec2, b: vec2, out: vec2): vec2 => {
    out[0] = a[0] * b[0]
    out[1] = a[1] * b[1]
    return out
}
vec2.divide = (a: vec2, b: vec2, out: vec2): vec2 => {
    out[0] = a[0] / b[0]
    out[1] = a[1] / b[1]
    return out
}
vec2.scale = (vec: vec2, s: number, out: vec2): vec2 => {
    out[0] = vec[0] * s
    out[1] = vec[1] * s
    return out
}
vec2.distanceSquared = (a: vec2, b: vec2): number => {
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    return dx*dx + dy*dy
}
vec2.distance = (a: vec2, b: vec2): number => Math.sqrt(vec2.distanceSquared(a, b))
vec2.magnitudeSquared = (vec: vec2): number => vec[0]*vec[0] + vec[1]*vec[1]
vec2.magnitude = (vec: vec2): number => Math.sqrt(vec2.magnitudeSquared(vec))
vec2.normalize = (vec: vec2, out: vec2): vec2 => {
    const x = vec[0], y = vec[1]
    const lengthSqrt = x*x + y*y
    const invLength = lengthSqrt && 1 / Math.sqrt(lengthSqrt)
    out[0] = x * invLength
    out[1] = y * invLength
    return out
}
vec2.dot = (a: vec2, b: vec2): number => a[0] * b[0] + a[1] * b[1]
vec2.lerp = (a: vec2, b: vec2, t: number, out: vec2): vec2 => {
    out[0] = a[0] + t * (b[0] - a[0])
    out[1] = a[1] + t * (b[1] - a[1])
    return out
}
vec2.reflect = (vec: vec2, normal: vec2, out: vec2): vec2 => {
    const dot = vec[0] * normal[0] + vec[1] * normal[1]
    out[0] = vec[0] - 2 * normal[0] * dot
    out[1] = vec[1] - 2 * normal[1] * dot
    return out
}
vec2.angle = (a: vec2, b: vec2): number => Math.acos(vec2.dot(a, b))
vec2.rotation = (vec: vec2): number => Math.atan2(vec[1], vec[0])

export function snapToGrid(position: vec2, gridSize: number, out: vec2): vec2 {
    out[0] = gridSize * Math.round(position[0] / gridSize)
    out[1] = gridSize * Math.round(position[1] / gridSize)
    return out
}

vec2.ZERO = vec2(0, 0)
vec2.AXIS_Y = vec2(0, 1)
vec2.AXIS_X = vec2(1, 0)
vec2.temp = vec2()