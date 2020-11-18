import { vec2 } from './vec2'
import { vec4 } from './vec4'

export type AABB = vec4
export const AABB = (
    left: number = Infinity, top: number = Infinity,
    right: number = -Infinity, bottom: number = -Infinity
): AABB => AABB.fromValues(left, top, right, bottom, new Float32Array(4) as any)

AABB.copy = vec4.copy
AABB.fromValues = vec4.fromValues

AABB.overlap = (a: AABB, b: AABB): boolean => (
    a[0] <= b[2] &&
    a[1] <= b[3] &&
    a[2] >= b[0] &&
    a[3] >= b[1]
)

AABB.contains = (a: AABB, b: AABB): boolean => (
    a[0] <= b[0] &&
    a[1] <= b[1] &&
    a[2] >= b[2] &&
    a[3] >= b[3]
)

AABB.includes = (aabb: AABB, point: vec2): boolean => (
    aabb[0] <= point[0] &&
    aabb[1] <= point[1] &&
    aabb[2] >= point[0] &&
    aabb[3] >= point[1]
)

AABB.merge = (a: AABB, b: AABB, out: AABB): AABB => {
    out[0] = Math.min(a[0], b[0])
    out[1] = Math.min(a[1], b[1])
    out[2] = Math.max(a[2], b[2])
    out[3] = Math.max(a[3], b[3])
    return out
}

AABB.padding = (aabb: AABB, padding: number, out: AABB): AABB => {
    out[0] = aabb[0] - padding
    out[1] = aabb[1] - padding
    out[2] = aabb[2] + padding
    out[3] = aabb[3] + padding
    return out
}

AABB.perimeter = (aabb: AABB): number => 2 * (aabb[2] - aabb[0] + aabb[3] - aabb[1])