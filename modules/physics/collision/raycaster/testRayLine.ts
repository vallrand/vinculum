import { vec2 } from 'math/vec2'
import { lineIntersectionFraction } from 'math/polygon'
import { RigidBody } from '../../dynamics/RigidBody'
import { Line } from '../../shapes/Line'
import { Ray } from './Ray'
import { IRaycastDetector, Raycaster } from './Raycaster'

const temp0: vec2 = vec2()
const temp1: vec2 = vec2()

export const testRayLine: IRaycastDetector = function(
    this: Raycaster, ray: Ray, body: RigidBody, shape: Line, position: vec2, angle: number
): void {
    const { origin, target } = ray
    const halfLength = 0.5 * shape.length
    const cos = Math.cos(angle), sin = Math.sin(angle)
    temp0[0] = -cos * halfLength + position[0]
    temp0[1] = -sin * halfLength + position[1]
    temp1[0] = cos * halfLength + position[0]
    temp1[1] = sin * halfLength + position[1]

    const fraction = lineIntersectionFraction(origin, target, temp0, temp1)
    if(fraction < 0) return
    vec2.rotate(vec2.AXIS_Y, angle, this.intersectionNormal)
    this.reportIntersection(body, shape, fraction, -1)
}