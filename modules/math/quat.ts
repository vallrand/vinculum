import { vec3 } from './vec3'
import { vec4 } from './vec4'

export type quat = vec4
export const quat = (): quat => vec4(0,0,0,1)

quat.copy = vec4.copy
quat.normalize = vec4.normalize

quat.multiply = (q1: quat, q2: quat, out: quat): quat => {
    const x1 = q1[0], y1 = q1[1], z1 = q1[2], w1 = q1[3],
          x2 = q2[0], y2 = q2[1], z2 = q2[2], w2 = q2[3]
    out[0] = x1 * w2 + w1 * x2 + y1 * z2 - z1 * y2
    out[1] = y1 * w2 + w1 * y2 + z1 * x2 - x1 * z2
    out[2] = z1 * w2 + w1 * z2 + x1 * y2 - y1 * x2
    out[3] = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2
    return out
}

quat.transformVec4 = (v: vec4 | vec3, q: quat, out: vec4 | vec3): vec4 | vec3 => {
    const x = v[0], y = v[1], z = v[2],
    rx = q[0], ry = q[1], rz = q[2], rw = q[3],
    ix = rw * x + ry * z - rz * y,
    iy = rw * y + rz * x - rx * z,
    iz = rw * z + rx * y - ry * x,
    iw = -rx * x - ry * y - rz * z

    out[0] = ix * rw + iw * -rx + iy * -rz - iz * -ry
    out[1] = iy * rw + iw * -ry + iz * -rx - ix * -rz
    out[2] = iz * rw + iw * -rz + ix * -ry - iy * -rx
    out[3] = v[3] == null ? 1 : v[3]
    return out
}

quat.fromAxisAngle = (axis: vec3, angle: number, out: quat): quat => {
    const sin = Math.sin(angle*=0.5)
    out[0] = sin * axis[0]
    out[1] = sin * axis[1]
    out[2] = sin * axis[2]
    out[3] = Math.cos(angle)
    return out
}

quat.slerp = (q1: quat, q2: quat, f: number, out: quat): quat => {
    const x1 = q1[0], y1 = q1[1], z1 = q1[2], w1 = q1[3],
          x2 = q2[0], y2 = q2[1], z2 = q2[2], w2 = q2[3],
          dotProduct = x1 * x2 + y1 * y2 + z1 * z2 + w1 * w2
    if(dotProduct < 0.0){
        out[0] = -x1 + f * (x2 + x1)
        out[1] = -y1 + f * (y2 + y1)
        out[2] = -z1 + f * (z2 + z1)
        out[3] = -w1 + f * (w2 + w1)
    }else{
        out[0] = x1 + f * (x2 - x1)
        out[1] = y1 + f * (y2 - y1)
        out[2] = z1 + f * (z2 - z1)
        out[3] = w1 + f * (w2 - w1)
    }
    return out
}