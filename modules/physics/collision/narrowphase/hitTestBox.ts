import { vec2 } from 'math/vec2'
import { Box } from '../../shapes/Box'

export const hitTestBox = (shape: Box, localPosition: vec2) =>
Math.abs(localPosition[0]) < 0.5 * shape.width && Math.abs(localPosition[1]) < 0.5 * shape.height