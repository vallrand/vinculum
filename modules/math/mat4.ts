import { vec3 } from './vec3'
import { vec4 } from './vec4'
import { quat } from './quat'
import { dualquat } from './dualquat'

export type mat4 = [
    number,number,number,number,
    number,number,number,number,
    number,number,number,number,
    number,number,number,number
]
export const mat4 = (): mat4 => mat4.identity(new Float32Array(16) as any)

mat4.identity = (out: mat4): mat4 => {
	out[0] = 1; out[1] = 0; out[2] = 0; out[3] = 0
	out[4] = 0; out[5] = 1; out[6] = 0; out[7] = 0
	out[8] = 0; out[9] = 0; out[10] = 1; out[11] = 0
	out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1
	return out
}

mat4.multiply = (a: mat4, b: mat4, out: mat4): mat4 => {
  let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
      a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
      a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
      a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15]

  let b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3]
  out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30
  out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31
  out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32
  out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33

  b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7]
  out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30
  out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31
  out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32
  out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33

  b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11]
  out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30
  out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31
  out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32
  out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33

  b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15]
  out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30
  out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31
  out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32
  out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33
  return out
}

mat4.fromEulerRotation = (x: number, y: number, z: number, out: mat4): mat4 => {
    const sinx = Math.sin(x), siny = Math.sin(y), sinz = Math.sin(z),
          cosx = Math.cos(x), cosy = Math.cos(y), cosz = Math.cos(z)
    out[0] = cosy * cosz
    out[1] = cosy * sinz
    out[2] = -siny
    out[3] = 0.0

    out[4] = sinx * siny * cosz - cosx * sinz
    out[5] = sinx * siny * sinz + cosx * cosz
    out[6] = sinx * cosy
    out[7] = 0.0

    out[8] = cosx * siny * cosz + sinx * sinz
    out[9] = cosx * siny * sinz - sinx * cosz
    out[10] = cosx * cosy
    out[11] = 0.0

    out[12] = 0.0
    out[13] = 0.0
    out[14] = 0.0
    out[15] = 1.0
    return out
}

mat4.perspective = (fovy: number, aspectRatio: number, znear: number, zfar: number, out: mat4): mat4 => {
    const f = 1.0 / Math.tan(fovy / 2),
    nf = 1 / (znear - zfar)
    out[0] = f / aspectRatio
    out[1] = 0
    out[2] = 0
    out[3] = 0
    out[4] = 0
    out[5] = f
    out[6] = 0
    out[7] = 0
    out[8] = 0
    out[9] = 0
    out[10] = (zfar + znear) * nf
    out[11] = -1
    out[12] = 0
    out[13] = 0
    out[14] = (2 * zfar * znear) * nf
    out[15] = 0
    return out
}

mat4.transform = (vec: vec4, m: mat4, out: vec4): vec4 => {
    let x = vec[0], y = vec[1], z = vec[2], w = vec[3]
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w
    out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w
    return out
}

mat4.transpose = (m: mat4, out: mat4): mat4 => {
    const m01 = m[1], m02 = m[2], m03 = m[3], m12 = m[6], m13 = m[7], m23 = m[11]
    out[0] = m[0]; out[1] = m[4]; out[2] = m[8]; out[3] = m[12]
    out[4] = m01; out[5] = m[5]; out[6] = m[9]; out[7] = m[13]
    out[8] = m02; out[9] = m12; out[10] = m[10]; out[11] = m[14]
    out[12] = m03; out[13] = m13; out[14] = m23; out[15] = m[15]
    return out
}

mat4.invert = (m: mat4, out: mat4): mat4 => {
	const m00 = m[0], m01 = m[1], m02 = m[2], m03 = m[3],
	m10 = m[4], m11 = m[5], m12 = m[6], m13 = m[7],
	m20 = m[8], m21 = m[9], m22 = m[10], m23 = m[11],
	m30 = m[12], m31 = m[13], m32 = m[14], m33 = m[15],
	d00 = m00 * m11 - m01 * m10,
	d01 = m00 * m12 - m02 * m10,
	d02 = m00 * m13 - m03 * m10,
	d03 = m01 * m12 - m02 * m11,
	d04 = m01 * m13 - m03 * m11,
	d05 = m02 * m13 - m03 * m12,
	d06 = m20 * m31 - m21 * m30,
	d07 = m20 * m32 - m22 * m30,
	d08 = m20 * m33 - m23 * m30,
	d09 = m21 * m32 - m22 * m31,
	d10 = m21 * m33 - m23 * m31,
	d11 = m22 * m33 - m23 * m32,
    det = (d00 * d11 - d01 * d10 + d02 * d09 + d03 * d08 - d04 * d07 + d05 * d06),
	invDet = det ? 1.0 / det : 0

	out[0] = invDet * (m11 * d11 - m12 * d10 + m13 * d09)
	out[1] = invDet * (m02 * d10 - m01 * d11 - m03 * d09)
	out[2] = invDet * (m31 * d05 - m32 * d04 + m33 * d03)
	out[3] = invDet * (m22 * d04 - m21 * d05 - m23 * d03)
	out[4] = invDet * (m12 * d08 - m10 * d11 - m13 * d07)
	out[5] = invDet * (m00 * d11 - m02 * d08 + m03 * d07)
	out[6] = invDet * (m32 * d02 - m30 * d05 - m33 * d01)
	out[7] = invDet * (m20 * d05 - m22 * d02 + m23 * d01)
	out[8] = invDet * (m10 * d10 - m11 * d08 + m13 * d06)
	out[9] = invDet * (m01 * d08 - m00 * d10 - m03 * d06)
	out[10] = invDet * (m30 * d04 - m31 * d02 + m33 * d00)
	out[11] = invDet * (m21 * d02 - m20 * d04 - m23 * d00)
	out[12] = invDet * (m11 * d07 - m10 * d09 - m12 * d06)
	out[13] = invDet * (m00 * d09 - m01 * d07 + m02 * d06)
	out[14] = invDet * (m31 * d01 - m30 * d03 - m32 * d00)
	out[15] = invDet * (m20 * d03 - m21 * d01 + m22 * d00)
	return out
}

mat4.perspective = (
    fovy: number, aspectRatio: number,
    zNear: number, zFar: number, out: mat4
): mat4 => {
    const f = 1 / Math.tan(fovy / 2),
    nf = 1 / (zNear - zFar)
    out[0] = f/aspectRatio; out[1] = 0;     out[2] = 0;                 out[3] = 0
    out[4] = 0;             out[5] = f;     out[6] = 0;                 out[7] = 0
    out[8] = 0;             out[9] = 0;     out[10] = (zFar+zNear)*nf;  out[11] = -1
    out[12] = 0;            out[13] = 0;    out[14] = 2*zFar*zNear*nf;  out[15] = 0
    return out
}

mat4.orthogonal = (
    left: number, right: number, bottom: number, top: number,
    zNear: number, zFar: number, out: mat4
): mat4 => {
    const lr = 1 / (left - right),
          bt = 1 / (bottom - top),
          nf = 1 / (zNear - zFar)
    out[0] = -2*lr;             out[1] = 0;                 out[2] = 0;                 out[3] = 0
    out[4] = 0;                 out[5] = -2*bt;             out[6] = 0;                 out[7] = 0
    out[8] = 0;                 out[9] = 0;                 out[10] = 2*nf;             out[11] = 0
    out[12] = (left+right)*lr;  out[13] = (top+bottom)*bt;  out[14] = (zFar+zNear)*nf;  out[15] = 1
    return out
}

mat4.translate = (mat: mat4, v: vec3, out: mat4): mat4 => {
    const x = v[0], y = v[1], z = v[2]
    out[12] = mat[0] * x + mat[4] * y + mat[8] * z + mat[12]
    out[13] = mat[1] * x + mat[5] * y + mat[9] * z + mat[13]
    out[14] = mat[2] * x + mat[6] * y + mat[10] * z + mat[14]
    out[15] = mat[3] * x + mat[7] * y + mat[11] * z + mat[15]
    if(out !== mat){
        out[0] = mat[0]; out[1] = mat[1]; out[2] = mat[2]; out[3] = mat[3]
        out[4] = mat[4]; out[5] = mat[5]; out[6] = mat[6]; out[7] = mat[7]
        out[8] = mat[8]; out[9] = mat[9]; out[10] = mat[10]; out[11] = mat[11]
    }
    return out
}

mat4.scale = (mat: mat4, sv: vec3, out: mat4): mat4 => {
    const x = sv[0], y = sv[1], z = sv[2]
    out[0] = mat[0] * x; out[1] = mat[1] * x; out[2] = mat[2] * x; out[3] = mat[3] * x
    out[4] = mat[4] * y; out[5] = mat[5] * y; out[6] = mat[6] * y; out[7] = mat[7] * y
    out[8] = mat[8] * z; out[9] = mat[9] * z; out[10] = mat[10] * z; out[11] = mat[11] * z
    out[12] = mat[12];   out[13] = mat[13];   out[14] = mat[14];    out[15] = mat[15]
    return out
}

mat4.rotate = (mat: mat4, rad: number, rv: vec3, out: mat4): mat4 => {
    const x = rv[0], y = rv[1], z = rv[2],
          sin = Math.sin(rad), cos = Math.cos(rad), icos = 1 - cos,
          m00 = mat[0], m01 = mat[1], m02 = mat[2], m03 = mat[3],
          m10 = mat[4], m11 = mat[5], m12 = mat[6], m13 = mat[7],
          m20 = mat[8], m21 = mat[9], m22 = mat[10], m23 = mat[11],
          r00 = x * x * icos + cos, r01 = y * x * icos + z * sin, r02 = z * x * icos - y * sin,
          r10 = x * y * icos - z * sin, r11 = y * y * icos + cos, r12 = z * y * icos + x * sin,
          r20 = x * z * icos + y * sin, r21 = y * z * icos - x * sin, r22 = z * z * icos + cos
    out[0] = m00 * r00 + m10 * r01 + m20 * r02
    out[1] = m01 * r00 + m11 * r01 + m21 * r02
    out[2] = m02 * r00 + m12 * r01 + m22 * r02
    out[3] = m03 * r00 + m13 * r01 + m23 * r02
    out[4] = m00 * r10 + m10 * r11 + m20 * r12
    out[5] = m01 * r10 + m11 * r11 + m21 * r12
    out[6] = m02 * r10 + m12 * r11 + m22 * r12
    out[7] = m03 * r10 + m13 * r11 + m23 * r12
    out[8] = m00 * r20 + m10 * r21 + m20 * r22
    out[9] = m01 * r20 + m11 * r21 + m21 * r22
    out[10] = m02 * r20 + m12 * r21 + m22 * r22
    out[11] = m03 * r20 + m13 * r21 + m23 * r22
    out[12] = mat[12]; out[13] = mat[13]; out[14] = mat[14]; out[15] = mat[15]
    return out
}

mat4.fromRotationTranslationScale = (q: quat, v: vec3, s: vec3, out: mat4): mat4 => {
    const x = q[0], y = q[1], z = q[2], w = q[3],
          x2 = x + x, y2 = y + y, z2 = z + z,
          xx = x * x2,xy = x * y2,xz = x * z2,
          yy = y * y2,yz = y * z2,zz = z * z2,
          wx = w * x2,wy = w * y2,wz = w * z2,
          sx = s[0],sy = s[1],sz = s[2]

    out[0] = (1 - (yy + zz)) * sx
    out[1] = (xy + wz) * sx
    out[2] = (xz - wy) * sx
    out[3] = 0
    out[4] = (xy - wz) * sy
    out[5] = (1 - (xx + zz)) * sy
    out[6] = (yz + wx) * sy
    out[7] = 0
    out[8] = (xz + wy) * sz
    out[9] = (yz - wx) * sz
    out[10] = (1 - (xx + yy)) * sz
    out[11] = 0
    out[12] = v[0]
    out[13] = v[1]
    out[14] = v[2]
    out[15] = 1
    return out
}

mat4.lookAt = (eye: vec3, target: vec3, up: vec3, out: mat4): mat4 => {
    const eyeX = eye[0], eyeY = eye[1], eyeZ = eye[2],
          targetX = target[0], targetY = target[1], targetZ = target[2],
          upX = up[0], upY = up[1], upZ = up[2]
    let z0 = eyeX - targetX,
        z1 = eyeY - targetY,
        z2 = eyeZ - targetZ,
        length = Math.sqrt(z0*z0 + z1*z1 + z2*z2),
        invLength = length ? 1 / length : 0
    z0 *= invLength
    z1 *= invLength
    z2 *= invLength
    let x0 = upY * z2 - upZ * z1,
        x1 = upZ * z0 - upX * z2,
        x2 = upX * z1 - upY * z0
    length = Math.sqrt(x0*x0 + x1*x1 + x2*x2)
    invLength = length ? 1 / length : 0
    x0 *= invLength
    x1 *= invLength
    x2 *= invLength
    let y0 = z1 * x2 - z2 * x1,
        y1 = z2 * x0 - z0 * x2,
        y2 = z0 * x1 - z1 * x0
    length = Math.sqrt(y0*y0 + y1*y1 + y2*y2)
    invLength = length ? 1 / length : 0
    y0 *= invLength
    y1 *= invLength
    y2 *= invLength

    out[0] = x0; out[1] = y0; out[2] = z0; out[3] = 0
    out[4] = x1; out[5] = y1; out[6] = z1; out[7] = 0
    out[8] = x2; out[9] = y2; out[10] = z2; out[11] = 0
    out[12] = -(x0 * eyeX + x1 * eyeY + x2 * eyeZ)
    out[13] = -(y0 * eyeX + y1 * eyeY + y2 * eyeZ)
    out[14] = -(z0 * eyeX + z1 * eyeY + z2 * eyeZ)
    out[15] = 1
    
    return out
}

mat4.targetTo = (eye: vec3, target: vec3, up: vec3, out: mat4): mat4 => {
    const eyeX = eye[0], eyeY = eye[1], eyeZ = eye[2],
          upX = up[0], upY = up[1], upZ = up[2]
    let z0 = eyeX - target[0],
        z1 = eyeY - target[1],
        z2 = eyeZ - target[2],
        length = Math.sqrt(z0*z0 + z1*z1 + z2*z2),
        invLength = length ? 1 / length : 1
    z0 *= invLength
    z1 *= invLength
    z2 *= invLength
    let x0 = upY * z2 - upZ * z1,
        x1 = upZ * z0 - upX * z2,
        x2 = upX * z1 - upY * z0
    length = Math.sqrt(x0*x0 + x1*x1 + x2*x2)
    invLength = length ? 1 / length : 1
    x0 *= invLength
    x1 *= invLength
    x2 *= invLength
    
    out[0] = x0; out[1] = x1; out[2] = x2; out[3] = 0
    out[4] = z1 * x2 - z2 * x1
    out[5] = z2 * x0 - z0 * x2
    out[6] = z0 * x1 - z1 * x0
    out[7] = 0; out[8] = z0; out[9] = z1; out[10] = z2
    out[11] = 0; out[12] = eyeX; out[13] = eyeY; out[14] = eyeZ; out[15] = 1
    return out
}

mat4.fromDualquat = (dq: dualquat, out: mat4): mat4 => {
    const rx = dq[0], ry = dq[1], rz = dq[2], rw = dq[3],
          tx = dq[4], ty = dq[5], tz = dq[6], tw = dq[7],
          xx = (2.0 * rx * rx), yy = (2.0 * ry * ry), zz = (2.0 * rz * rz),
          xy = (2.0 * rx * ry), xz = (2.0 * rx * rz), xw = (2.0 * rx * rw),
          yz = (2.0 * ry * rz), yw = (2.0 * ry * rw), zw = (2.0 * rz * rw)
    out[0] = 1.0 - yy - zz
    out[1] = xy + zw
    out[2] = xz - yw
    out[3] = 0
    out[4] = xy - zw
    out[5] = 1.0 - xx - zz
    out[6] = yz + xw
    out[7] = 0
    out[8] = xz + yw
    out[9] = yz - xw
    out[10] = 1.0 - xx - yy
    out[11] = 0
    out[12] = 2.0 * (-tw * rx + tx * rw - ty * rz + tz * ry)
    out[13] = 2.0 * (-tw * ry + tx * rz + ty * rw - tz * rx)
    out[14] = 2.0 * (-tw * rz - tx * ry + ty * rx + tz * rw)
    out[15] = 1
    return out
}

mat4.IDENTITY = mat4()