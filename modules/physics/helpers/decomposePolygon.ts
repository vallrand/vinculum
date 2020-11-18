import { vec2 } from 'math/vec2'
import { mod } from 'math/utilities'
import { triangleArea, measureAngle, lineIntersection, lineIntersectionFraction } from 'math/polygon'
import { appendList } from './list'
import { Convex } from '../shapes/Convex'

export function fromConcavePath(path: vec2[]){
    reorderCCW(path)
    simplifyPolygon(path)
    const shapes: Convex[] = decomposePolygon(path, [], [], [], 100, 1e-6)
    .map(vertices => new Convex(undefined, undefined, vertices))
    
    const center = vec2(), temp = vec2()
    let totalArea = 0
    for(let i = shapes.length - 1; i >= 0; i--){
        const shape = shapes[i], area = shape.computeArea()
        vec2.add(shape.center, shape.position, shape.position)
        for(let j = shape.vertices.length - 1; j >= 0; j--)
            vec2.subtract(shape.vertices[j], shape.center, shape.vertices[j])
        totalArea += area
        vec2.scale(shape.position, area, temp)
        vec2.add(temp, center, center)
    }
    vec2.scale(center, 1 / totalArea, center)
    for(let i = shapes.length - 1; i >= 0; i--)
        vec2.subtract(shapes[i].position, center, shapes[i].position)
    
    return { center, shapes }
}

export function reorderCCW(polygon: vec2[]): void {
    let i1 = 0
    for(let j = polygon.length - 1; j > 0; j--)
        if((polygon[j][1] - polygon[i1][1] || polygon[j][0] - polygon[i1][0]) < 0)
            i1 = j
    const i0 = mod(i1 - 1, polygon.length), i2 = mod(i1 + 1, polygon.length)
    const CCW = triangleArea(polygon[i0], polygon[i1], polygon[i2]) > 0
    if(!CCW) polygon.reverse()
}

export function simplifyPolygon(polygon: vec2[], epsilon: number = 1e-6): void {
   removeDuplicates: {
        for(let i = polygon.length - 1; i > 0; i--)
            for(let j = i - 1; j >= 0; j--)
                if(Math.abs(polygon[i][0] - polygon[j][0]) + Math.abs(polygon[i][1] - polygon[j][1]) < epsilon){
                    polygon.splice(i, 1)
                    break
                }
    }
    removeCollinear: {
        for(let i1 = polygon.length - 1; polygon.length > 3 && i1 >= 0; i1--){
            let i0 = mod(i1 - 1, polygon.length)
            let i2 = mod(i1 + 1, polygon.length)
            if(measureAngle(polygon[i0], polygon[i1], polygon[i2]) > epsilon) continue
            polygon.splice(i1, 1)
        }
    }
}

export function decomposePolygon(
    polygon: vec2[], reflexVertices: vec2[], steinerPoints: vec2[], out: vec2[][], depth: number, epsilon: number
): vec2[][] {
    if(polygon.length < 3) return out
    if(--depth < 0) throw new RangeError('Maximum recursion depth exceeded!')
    const lowerPolygon = [], upperPolygon = []
    const lower = vec2(), upper = vec2(), temp = vec2()

    for(let i1 = 0; i1 < polygon.length; i1++){
        let i0 = mod(i1 - 1, polygon.length)
        let i2 = mod(i1 + 1, polygon.length)
        if(triangleArea(polygon[i0], polygon[i1], polygon[i2]) >= 0) continue
        reflexVertices.push(polygon[i1])

        let upperDistance = Infinity
        let lowerDistance = Infinity
        let lowerIndex = 0
        let upperIndex = 0
        for(let distance: number, j1 = 0; j1 < polygon.length; j1++){
            let j0 = mod(j1 - 1, polygon.length)
            let j2 = mod(j1 + 1, polygon.length)
            if(triangleArea(polygon[i0], polygon[i1], polygon[j1]) > 0
            && triangleArea(polygon[i0], polygon[i1], polygon[j0]) <= 0){
                lineIntersection(polygon[i0], polygon[i1], polygon[j1], polygon[j0], temp)
                if(triangleArea(polygon[i2], polygon[i1], temp) < 0)
                    if((distance = vec2.distanceSquared(polygon[i1], temp)) < lowerDistance){
                        lowerDistance = distance
                        vec2.copy(temp, lower)
                        lowerIndex = j1
                    }
            }
            if(triangleArea(polygon[i2], polygon[i1], polygon[j2]) > 0
            && triangleArea(polygon[i2], polygon[i1], polygon[j1]) <= 0){
                lineIntersection(polygon[i2], polygon[i1], polygon[j1], polygon[j2], temp)
                if(triangleArea(polygon[i0], polygon[i1], temp) > 0)
                    if((distance = vec2.distanceSquared(polygon[i1], temp)) < upperDistance){
                        upperDistance = distance
                        vec2.copy(temp, upper)
                        upperIndex = j1
                    }
                }
        }
        
        if(lowerIndex === mod(upperIndex + 1, polygon.length)){
            temp[0] = 0.5 * (lower[0] + upper[0])
            temp[1] = 0.5 * (lower[1] + upper[1])
            steinerPoints.push(temp)
            if(i1 < upperIndex){
                appendList(lowerPolygon, polygon, i1, upperIndex + 1)
                lowerPolygon.push(temp)
                upperPolygon.push(temp)
                if(lowerIndex !== 0) appendList(upperPolygon, polygon, lowerIndex, polygon.length)
                appendList(upperPolygon, polygon, 0, i1 + 1)
            }else{
                if(i1 !== 0) appendList(lowerPolygon, polygon, i1, polygon.length)
                appendList(lowerPolygon, polygon, 0, upperIndex + 1)
                lowerPolygon.push(temp)
                upperPolygon.push(temp)
                appendList(upperPolygon, polygon, lowerIndex, i1 + 1)
            }
        }else{
            if(lowerIndex > upperIndex) upperIndex += polygon.length
            let closestDistance = Infinity
            let closestIndex = 0
            outer: for(let j = lowerIndex, j1 = j; j <= upperIndex; j1 = mod(++j, polygon.length))
                if(triangleArea(polygon[i0], polygon[i1], polygon[j1]) >= 0
                && triangleArea(polygon[i2], polygon[i1], polygon[j1]) <= 0){
                    let distance = vec2.distanceSquared(polygon[i1], polygon[j1])
                    if(distance >= closestDistance) continue
                    for(let k0 = polygon.length - 1, k1 = 0; k0 >= 0; k1 = k0--){
                        if(k0 === i1 || k0 === j1 || k1 === i1 || k1 === j1) continue
                        if(lineIntersectionFraction(polygon[i1], polygon[j1], polygon[k0], polygon[k1]) == -1)
                            continue
                        continue outer
                    }
                    closestDistance = distance
                    closestIndex = j1
                }

            if(i1 < closestIndex){
                appendList(lowerPolygon, polygon, i1, closestIndex + 1)
                if(closestIndex !== 0) appendList(upperPolygon, polygon, closestIndex, polygon.length)
                appendList(upperPolygon, polygon, 0, i1 + 1)
            }else{
                if(i1 !== 0) appendList(lowerPolygon, polygon, i1, polygon.length)
                appendList(lowerPolygon, polygon, 0, closestIndex + 1)
                appendList(upperPolygon, polygon, closestIndex, i1 + 1)
            }
        }

        if(lowerPolygon.length < upperPolygon.length){
            decomposePolygon(lowerPolygon, reflexVertices, steinerPoints, out, depth, epsilon)
            decomposePolygon(upperPolygon, reflexVertices, steinerPoints, out, depth, epsilon)
        }else{
            decomposePolygon(upperPolygon, reflexVertices, steinerPoints, out, depth, epsilon)
            decomposePolygon(lowerPolygon, reflexVertices, steinerPoints, out, depth, epsilon)
        }

        return out
    }

    out.push(polygon)
    return out
}