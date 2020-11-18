import { vec2 } from 'math/vec2'
import { Circle } from '../../shapes/Circle'

export const hitTestCircle = (shape: Circle, localPosition: vec2): boolean =>
vec2.magnitude(localPosition) <= shape.radius * shape.radius