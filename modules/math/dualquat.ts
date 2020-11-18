import { quat } from './quat'
import { vec4 } from './vec4'

export type dualquat = [
    number,number,number,number,
    number,number,number,number
]

export const dualquat = (): dualquat => dualquat.fromValues(0,0,0,1,0,0,0,0, new Float32Array(8) as any)

dualquat.fromValues = (
    rx: number, ry: number, rz: number, rw: number,
    tx: number, ty: number, tz: number, tw: number, out: dualquat
): dualquat => {
    out[0] = rx; out[1] = ry; out[2] = rz; out[3] = rw
    out[4] = tx; out[5] = ty; out[6] = tz; out[7] = tw
    return out
}

dualquat.copy = (dq: dualquat, out: dualquat): dualquat => {
    out[0] = dq[0]; out[1] = dq[1]; out[2] = dq[2]; out[3] = dq[3]
    out[4] = dq[4]; out[5] = dq[5]; out[6] = dq[6]; out[7] = dq[7]
    return out
}

dualquat.slerp = (dq1: dualquat, dq2: dualquat, f: number, out: dualquat): dualquat => {
    const rx1 = dq1[0], ry1 = dq1[1], rz1 = dq1[2], rw1 = dq1[3],
          rx2 = dq2[0], ry2 = dq2[1], rz2 = dq2[2], rw2 = dq2[3],
          px1 = dq1[4], py1 = dq1[5], pz1 = dq1[6], pw1 = dq1[7],
          dotProduct = rx1 * rx2 + ry1 * ry2 + rz1 * rz2 + rw1 * rw2
    if(dotProduct < 0.0){
        out[0] = -rx1 + f * (rx2 + rx1)
        out[1] = -ry1 + f * (ry2 + ry1)
        out[2] = -rz1 + f * (rz2 + rz1)
        out[3] = -rw1 + f * (rw2 + rw1)
        out[4] = -px1 + f * (dq2[4] + px1)
        out[5] = -py1 + f * (dq2[5] + py1)
        out[6] = -pz1 + f * (dq2[6] + pz1)
        out[7] = -pw1 + f * (dq2[7] + pw1)
    }else{
        out[0] = rx1 + f * (rx2 - rx1)
        out[1] = ry1 + f * (ry2 - ry1)
        out[2] = rz1 + f * (rz2 - rz1)
        out[3] = rw1 + f * (rw2 - rw1)
        out[4] = px1 + f * (dq2[4] - px1)
        out[5] = py1 + f * (dq2[5] - py1)
        out[6] = pz1 + f * (dq2[6] - pz1)
        out[7] = pw1 + f * (dq2[7] - pw1)
    }
    return out
}

dualquat.fromRotationTranslation = (q: quat, v: vec4, out: dualquat): dualquat => {
    const rx = q[0], ry = q[1], rz = q[2], rw = q[3],
          tx = 0.5 * v[0], ty = 0.5 * v[1], tz = 0.5 * v[2]
    out[0] = rx; out[1] = ry; out[2] = rz; out[3] = rw
    out[4] = + tx * rw + ty * rz - tz * ry
    out[5] = - tx * rz + ty * rw + tz * rx
    out[6] = + tx * ry - ty * rx + tz * rw
    out[7] = - tx * rx - ty * ry - tz * rz
    return out
}

dualquat.multiply = (a: dualquat, b: dualquat, out: dualquat): dualquat => {
    const ax0 = a[0], ay0 = a[1], az0 = a[2], aw0 = a[3],
          bx1 = b[4], by1 = b[5], bz1 = b[6], bw1 = b[7],
          ax1 = a[4], ay1 = a[5], az1 = a[6], aw1 = a[7],
          bx0 = b[0], by0 = b[1], bz0 = b[2], bw0 = b[3]
    out[0] = ax0 * bw0 + aw0 * bx0 + ay0 * bz0 - az0 * by0
    out[1] = ay0 * bw0 + aw0 * by0 + az0 * bx0 - ax0 * bz0
    out[2] = az0 * bw0 + aw0 * bz0 + ax0 * by0 - ay0 * bx0
    out[3] = aw0 * bw0 - ax0 * bx0 - ay0 * by0 - az0 * bz0
    out[4] = ax0 * bw1 + aw0 * bx1 + ay0 * bz1 - az0 * by1 + ax1 * bw0 + aw1 * bx0 + ay1 * bz0 - az1 * by0
    out[5] = ay0 * bw1 + aw0 * by1 + az0 * bx1 - ax0 * bz1 + ay1 * bw0 + aw1 * by0 + az1 * bx0 - ax1 * bz0
    out[6] = az0 * bw1 + aw0 * bz1 + ax0 * by1 - ay0 * bx1 + az1 * bw0 + aw1 * bz0 + ax1 * by0 - ay1 * bx0
    out[7] = aw0 * bw1 - ax0 * bx1 - ay0 * by1 - az0 * bz1 + aw1 * bw0 - ax1 * bx0 - ay1 * by0 - az1 * bz0
    return out
}