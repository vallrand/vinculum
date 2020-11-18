import { vec2 } from './vec2'

export function quadraticBezierLength(
    fromX: number, fromY: number,
    cpX: number, cpY: number,
    toX: number, toY: number
): number {
    const ax = fromX - 2.0 * cpX + toX
    const ay = fromY - 2.0 * cpY + toY
    const bx = 2.0 * cpX - 2.0 * fromX
    const by = 2.0 * cpY - 2.0 * fromY
    const a = 4.0 * (ax * ax + ay * ay)
    const b = 4.0 * (ax * bx + ay * by)
    const c = bx * bx + by * by

    const s = 2.0 * Math.sqrt(a + b + c)
    const a2 = Math.sqrt(a)
    const a32 = 2.0 * a * a2
    const c2 = 2.0 * Math.sqrt(c)
    const ba = b / a2

    return (
        (a32 * s) + (a2 * b * (s - c2)) + (((4.0 * c * a) - (b * b)) * Math.log(((2.0 * a2) + ba + s) / (ba + c2)))
    ) / (4.0 * a32)
}


export function cubicBezierLength(
    fromX: number, fromY: number,
    cpX: number, cpY: number,
    cpX2: number, cpY2: number,
    toX: number, toY: number
): number {
    const n = 10;
    let result = 0.0;
    let t = 0.0;
    let t2 = 0.0;
    let t3 = 0.0;
    let nt = 0.0;
    let nt2 = 0.0;
    let nt3 = 0.0;
    let x = 0.0;
    let y = 0.0;
    let dx = 0.0;
    let dy = 0.0;
    let prevX = fromX;
    let prevY = fromY;

    for (let i = 1; i <= n; ++i){
        t = i / n;
        t2 = t * t;
        t3 = t2 * t;
        nt = (1.0 - t);
        nt2 = nt * nt;
        nt3 = nt2 * nt;

        x = (nt3 * fromX) + (3.0 * nt2 * t * cpX) + (3.0 * nt * t2 * cpX2) + (t3 * toX);
        y = (nt3 * fromY) + (3.0 * nt2 * t * cpY) + (3 * nt * t2 * cpY2) + (t3 * toY);
        dx = prevX - x;
        dy = prevY - y;
        prevX = x;
        prevY = y;

        result += Math.sqrt((dx * dx) + (dy * dy));
    }

    return result;
}

export function cubicBezier(
    fromX: number, fromY: number,
    cp1X: number, cp1Y: number,
    cp2X: number, cp2Y: number,
    toX: number, toY: number,
    t: number, out: vec2
): vec2 {
    const it = 1 - t
    const c0 = it * it * it
    const c1 = 3 * t * it * it
    const c2 = 3 * t * t * it
    const c3 = t * t * t
    out[0] = c0 * fromX + c1 * cp1X + c2 * cp2X + c3 * toX
    out[1] = c0 * fromY + c1 * cp1Y + c2 * cp2Y + c3 * toY
    return out
}

export function quadraticBezier(
    fromX: number, fromY: number,
    cpX: number, cpY: number,
    toX: number, toY: number,
    t: number, out: vec2
): vec2 {
    const it = 1 - t
    const c0 = it * it
    const c1 = 2 * it * t
    const c2 = t * t
    out[0] = c0 * fromX + c1 * cpX + c2 * toX
    out[1] = c0 * fromY + c1 * cpY + c2 * toY
    return out
}

export function cubicInterpolation(
    v0: vec2, v1: vec2, v2: vec2, v3: vec2,
    t: number, tangentFactor: number = 1,
    out: vec2
): vec2 {
    const t2 = t * t,
          t3 = t * t2,
          c0 = (2 * t3 - 3 * t2 + 1),
          c1 = tangentFactor * 0.5 * (t3 - 2 * t2 + t),
          c2 = ( -2 * t3 + 3 * t2),
          c3 = tangentFactor * 0.5 * (t3 - t2)
    out[0] = c0 * v1[0] + c1 * (v2[0] - v0[0]) + c2 * v2[0] + c3 * (v3[0] - v1[0])
    out[1] = c0 * v1[1] + c1 * (v2[1] - v0[1]) + c2 * v2[1] + c3 * (v3[1] - v1[1])
    return out
}