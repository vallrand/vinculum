import { vec2 } from 'math/vec2'
import { Convex } from '../../shapes/Convex'

export const hitTestConvex = function(shape: Convex, localPosition: vec2): boolean {
    for(let prevCross = 0, j = 0, i = shape.vertices.length - 1; i >= 0; j = i--){
        let prev = shape.vertices[i]
        let next = shape.vertices[j]
        let cross = vec2.cross(
            vec2.subtract(prev, localPosition, Convex.temp0),
            vec2.subtract(next, localPosition, Convex.temp1)
        )
        if(prevCross * cross < 0) return false
        prevCross += cross
    }
    return true
}