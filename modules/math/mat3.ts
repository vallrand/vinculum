import { mat3x2 } from './mat3x2'

export type mat3 = [
    number,number,number,
    number,number,number,
    number,number,number
]
export const mat3 = (): mat3 => mat3.identity(new Float32Array(9) as any)

mat3.copy = (mat: mat3, out: mat3): mat3 => {
    out[0] = mat[0]; out[1] = mat[1]; out[2] = mat[2]
    out[3] = mat[3]; out[4] = mat[4]; out[5] = mat[5]
    out[6] = mat[6]; out[7] = mat[7]; out[8] = mat[8]
    return out
}

mat3.fromMat3x2 = (mat: mat3x2, out: mat3): mat3 => {
    out[0] = mat[0]; out[1] = mat[1]; out[2] = 0
    out[3] = mat[2]; out[4] = mat[3]; out[5] = 0
    out[6] = mat[4]; out[7] = mat[5]; out[8] = 1
    return out
}

mat3.transpose = (m: mat3, out: mat3): mat3 => {
    const m01 = m[1], m02 = m[2], m12 = m[5]
    out[0] = m[0]; out[1] = m[3]; out[2] = m[6]
    out[3] = m01; out[4] = m[4]; out[5] = m[7]
    out[6] = m02; out[7] = m12; out[8] = m[8]
    return out
}

mat3.identity = (out: mat3): mat3 => {
    out[0] = 1; out[1] = 0; out[2] = 0
    out[3] = 0; out[4] = 1; out[5] = 0
    out[6] = 0; out[7] = 0; out[8] = 1
    return out
}

mat3.multiply = (a: mat3, b: mat3, out: mat3): mat3 => {
    const a00 = a[0], a01 = a[1], a02 = a[2],
          a10 = a[3], a11 = a[4], a12 = a[5],
          a20 = a[6], a21 = a[7], a22 = a[8]
    let by0 = b[0], by1 = b[1], by2 = b[2]
    out[0] = by0 * a00 + by1 * a10 + by2 * a20
    out[1] = by0 * a01 + by1 * a11 + by2 * a21
    out[2] = by0 * a02 + by1 * a12 + by2 * a22
    by0 = b[3], by1 = b[4], by2 = b[5]
    out[3] = by0 * a00 + by1 * a10 + by2 * a20
    out[4] = by0 * a01 + by1 * a11 + by2 * a21
    out[5] = by0 * a02 + by1 * a12 + by2 * a22
    by0 = b[6], by1 = b[7], by2 = b[8]
    out[6] = by0 * a00 + by1 * a10 + by2 * a20
    out[7] = by0 * a01 + by1 * a11 + by2 * a21
    out[8] = by0 * a02 + by1 * a12 + by2 * a22
    return out
}

mat3.invert = (m: mat3, out: mat3): mat3 => {
	const m00 = m[0], m01 = m[1], m02 = m[2],
		  m10 = m[3], m11 = m[4], m12 = m[5],
		  m20 = m[6], m21 = m[7], m22 = m[8],
		  d01 = m22 * m11 - m12 * m21,
		  d11 = m12 * m20 - m22 * m10,
		  d21 = m21 * m10 - m11 * m20,
          det = (m00 * d01 + m01 * d11 + m02 * d21),
		  invDet = det ? 1.0 / det : 0
	out[0] = invDet * d01
	out[1] = invDet * (m02 * m21 - m22 * m01)
	out[2] = invDet * (m12 * m01 - m02 * m11)
	out[3] = invDet * d11
	out[4] = invDet * (m22 * m00 - m02 * m20)
	out[5] = invDet * (m02 * m10 - m12 * m00)
	out[6] = invDet * d21
	out[7] = invDet * (m01 * m20 - m21 * m00)
	out[8] = invDet * (m11 * m00 - m01 * m10)
	return out
}

mat3.fromQuat = (q: [number, number, number, number], out: mat3): mat3 => {
    const x = q[0], y = q[1], z = q[2], w = q[3],
          x2 = 2 * x,   y2 = 2 * y,     z2 = 2 * z,
          xx = x * x2,  yy = y * y2,    zz = z * z2,
          yx = x * y2,  zx = x * z2,    zy = y * z2,
          wx = w * x2,  wy = w * y2,    wz = w * z2
    out[0] = 1 - yy - zz;     out[1] = yx + wz;       out[2] = zx - wy
    out[3] = yx - wz;         out[4] = 1 - xx - zz;   out[5] = zy + wx
    out[6] = zx + wy;         out[7] = zy - wx;       out[8] = 1 - xx - yy
    return out
}

mat3.IDENTITY = mat3()