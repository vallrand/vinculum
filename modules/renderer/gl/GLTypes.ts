import { GL } from './GLConstants'

export const GL_SIZE = {
    [GL.INT]: 1,
    [GL.FLOAT]: 1,
    [GL.FLOAT_VEC2]: 2,
    [GL.FLOAT_VEC3]: 3,
    [GL.FLOAT_VEC4]: 4,
    [GL.FLOAT_MAT2]: 4,
    [GL.FLOAT_MAT3]: 9,
    [GL.FLOAT_MAT4]: 16,
    [GL.SAMPLER_2D]: 1
}

export const GL_BYTE_SIZE = {
    [GL.FLOAT]: 4,
    [GL.UNSIGNED_INT]: 4,
    [GL.UNSIGNED_SHORT]: 2,
    [GL.UNSIGNED_BYTE]: 1
}

export const GL_TYPED_ARRAY = {
    [GL.FLOAT]: Float32Array,
    [GL.FLOAT_VEC2]: Float32Array,
    [GL.FLOAT_VEC3]: Float32Array,
    [GL.FLOAT_VEC4]: Float32Array,
    [GL.FLOAT_MAT2]: Float32Array,
    [GL.FLOAT_MAT3]: Float32Array,
    [GL.FLOAT_MAT4]: Float32Array,
    [GL.INT]: Int32Array,
    [GL.SAMPLER_2D]: Int32Array,
    [GL.UNSIGNED_BYTE]: Uint8Array,
    [GL.UNSIGNED_SHORT]: Uint16Array,
    [GL.UNSIGNED_INT]: Uint32Array
}