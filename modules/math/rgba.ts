import { vec3 } from './vec3'
import { vec4 } from './vec4'

export type rgb = vec3
export const rgb = (r: number = 0, g: number = 0, b: number = 0): rgb =>
vec3.fromValues(r,g,b, new Uint8ClampedArray(3) as any)

rgb.uint8Hex = (rgb: rgb): number => rgb[0] | rgb[1] << 8 | rgb[2] << 16
rgb.copy = vec3.copy
rgb.lerp = vec3.lerp

export type rgba = vec4
export const rgba = (r: number = 0, g: number = 0, b: number = 0, a: number = 0): rgba =>
vec4.fromValues(r,g,b,a, new Uint8ClampedArray(4) as any)

rgba.copy = vec4.copy
rgba.lerp = vec4.lerp

rgba.multiply = (a: rgba, b: rgba, out: rgba): rgba => {
    out[0] = a[0] * b[0] / 0xFF
    out[1] = a[1] * b[1] / 0xFF
    out[2] = a[2] * b[2] / 0xFF
    out[3] = a[3] * b[3] / 0xFF
    return out
}

rgba.uint8Hex = (rgba: rgba): number => rgba[0] | rgba[1] << 8 | rgba[2] << 16 | rgba[3] << 24
rgba.floatHex = (rgba: vec4): number => (
    0x000000FF & (rgba[0] * 0xFF << 0) |
    0x0000FF00 & (rgba[1] * 0xFF << 8) |
    0x00FF0000 & (rgba[2] * 0xFF << 16) |
    0xFF000000 & (rgba[3] * 0xFF << 24)
)

rgba.TRANSPARENT = rgba(0x00, 0x00, 0x00, 0x00)
rgba.WHITE = rgba(0xFF, 0xFF, 0xFF, 0xFF)
rgb.WHITE = rgb(0xFF, 0xFF, 0xFF)
rgb.BLACK = rgb(0x00, 0x00, 0x00)