import { vec2 } from 'math/vec2'
import { mat2 } from 'math/mat2'
import { mat3x2 } from 'math/mat3x2'
import { ICollisionDetector, Narrowphase } from './Narrowphase'
import { RigidBody } from '../../dynamics/RigidBody'
import { Convex } from '../../shapes/Convex'

const relativeTransform = (
    positionA: vec2, angleA: number, positionB: vec2, angleB: number, out: mat3x2
): mat3x2 => {
    const cosB = Math.cos(-angleB), sinB = Math.sin(-angleB)
    const angleAB = angleA - angleB, cosAB = Math.cos(angleAB), sinAB = Math.sin(angleAB)
    const dx = positionA[0] - positionB[0], dy = positionA[1] - positionB[1]
    out[0] = cosAB
    out[1] = sinAB
    out[2] = -sinAB
    out[3] = cosAB
    out[4] = cosB * dx - sinB * dy
    out[5] = sinB * dx + cosB * dy
    return out
}

function clipSegmentToLine(
    segment: [vec2, vec2], normal: vec2, offset: number, out: [vec2, vec2]
): number {
    let index = 0
    const distance0 = vec2.dot(normal, segment[0]) - offset
    const distance1 = vec2.dot(normal, segment[1]) - offset
    if(distance0 <= 0) vec2.copy(segment[0], out[index++])
    if(distance1 <= 0) vec2.copy(segment[1], out[index++])
    if(distance0 * distance1 < 0){
        const point = out[index++]
        vec2.subtract(segment[1], segment[0], point)
        vec2.scale(point, distance0 / (distance0 - distance1), point)
        vec2.add(segment[0], point, point)
    }
    return index
}

const segmentA: [vec2, vec2] = [vec2(), vec2()]
const segmentB: [vec2, vec2] = [vec2(), vec2()]
const tempTransform0: mat3x2 = mat3x2()
const tempTransform1: mat3x2 = mat3x2()
const tempA: vec2 = vec2()
const tempB: vec2 = vec2()
const temp0: vec2 = vec2()
const temp1: vec2 = vec2()
const temp2: vec2 = vec2()

function findSeparatingAxis(
    verticesA: vec2[], normalsA: vec2[], transformAB: mat3x2, verticesB: vec2[], out: vec2
): vec2 {
    let edgeIndex: number, maxDistance = -Infinity
    for(let i = verticesA.length - 1; i >= 0; i--){
        let normal = mat2.transform(normalsA[i], transformAB as any, temp0)
        let corner = mat3x2.transform(verticesA[i], transformAB, temp1)
        let minDistance = Infinity
        for(let j = verticesB.length - 1; j >= 0; j--){
            let difference = vec2.subtract(verticesB[j], corner, temp2)
            let dot = vec2.dot(difference, normal)
            if(dot < minDistance) minDistance = dot
        }
        if(minDistance <= maxDistance) continue
        maxDistance = minDistance
        edgeIndex = i
    }
    return vec2.fromValues(edgeIndex, maxDistance, out)
}

export const testConvexVsConvex: ICollisionDetector = function(
    this: Narrowphase,
    bodyA: RigidBody, shapeA: Convex, positionA: vec2, angleA: number,
    bodyB: RigidBody, shapeB: Convex, positionB: vec2, angleB: number,
    bailEarly: boolean
): number {
    const radius = 0
    
    let transformAB = relativeTransform(positionA, angleA, positionB, angleB, tempTransform0)
    let edgeA = findSeparatingAxis(shapeA.vertices, shapeA.normals, transformAB, shapeB.vertices, tempA)
    if(edgeA[1] > radius) return 0
    let transformBA = relativeTransform(positionB, angleB, positionA, angleA, tempTransform1)
    let edgeB = findSeparatingAxis(shapeB.vertices, shapeB.normals, transformBA, shapeA.vertices, tempB)
    if(edgeB[1] > radius) return 0

    if(edgeB[1] > edgeA[1]){
        bodyA = arguments[4]; shapeA = arguments[5]; positionA = arguments[6]; angleA = arguments[7]
        bodyB = arguments[0]; shapeB = arguments[1]; positionB = arguments[2]; angleB = arguments[3]
        edgeA = edgeB; transformAB = transformBA
    }
    
    incidentEdge: {
        const normalA = mat2.transform(shapeA.normals[edgeA[0]], transformAB as any, temp0)
        let index: number, minDistance = Infinity
        for(let i = shapeB.vertices.length - 1; i >= 0; i--){
            let distance = vec2.dot(normalA, shapeB.normals[i])
            if(distance >= minDistance) continue
            minDistance = distance
            index = i
        }
        vec2.copy(shapeB.vertices[index++], segmentA[0])
        vec2.copy(shapeB.vertices[index % shapeB.vertices.length], segmentA[1])
    }
    const normal = vec2.copy(shapeB.normals[edgeA[0]], temp0)
    const vertexA0 = shapeA.vertices[edgeA[0]++]
    const vertexA1 = shapeA.vertices[edgeA[0] % shapeA.vertices.length]

    mat2.transform(normal, transformAB as any, normal)
    const tangent = vec2.rotate90ccw(normal, temp1)
    
    mat3x2.transform(vertexA0, transformAB, temp2)
    const frontOffset = vec2.dot(normal, temp2)
    const sideOffset1 = -vec2.dot(tangent, temp2) + radius
    mat3x2.transform(vertexA1, transformAB, temp2)
    const sideOffset2 = vec2.dot(tangent, temp2) + radius
    
    const negativeTangent = vec2.scale(tangent, -1, temp2)

    if(clipSegmentToLine(segmentA, negativeTangent, sideOffset1, segmentB) < 2) return 0
    if(clipSegmentToLine(segmentB, tangent, sideOffset2, segmentA) < 2) return 0
    
    let hitCount = 0
    for(let i = 0; i < 2; i++){
        let distance = vec2.dot(normal, segmentA[i]) - frontOffset
        if(distance > radius) continue
        if(bailEarly) return 1
        hitCount++
        const { contactPointA, contactPointB, normalA } = this

        vec2.rotate(normal, angleB, normalA)
        
        vec2.rotate(segmentA[i], angleB, contactPointB)
        vec2.add(positionB, contactPointB, contactPointB)

        vec2.scale(normalA, -distance, contactPointA)
        vec2.add(contactPointB, contactPointA, contactPointA)

        this.registerContactManifold(bodyA, shapeA, bodyB, shapeB)
    }
    return hitCount
}

// var toGlobalFrame = function(out, localPoint, framePosition, frameAngle){
//     var c = Math.cos(frameAngle),
//         s = Math.sin(frameAngle),
//         x = localPoint[0],
//         y = localPoint[1],
//         addX = framePosition[0],
//         addY = framePosition[1];
//     out[0] = c * x - s * y + addX;
//     out[1] = s * x + c * y + addY;
// };

// var collidePolygons_tangent = vec2();
// var collidePolygons_normal = vec2();
// var collidePolygons_negativeTangent = vec2();
// var collidePolygons_v11 = vec2();
// var collidePolygons_v12 = vec2();
// var collidePolygons_clipPoints1 = [vec2(), vec2()];
// var collidePolygons_clipPoints2 = [vec2(), vec2()];

// export const testConvexVsConvex: ICollisionDetector = function(
//     this: Narrowphase,
//     bodyA: RigidBody, shapeA: Convex, positionA: vec2, angleA: number,
//     bodyB: RigidBody, shapeB: Convex, positionB: vec2, angleB: number,
//     bailEarly: boolean
// ): number {
//     const radius = 0
    
//     let transformAB = relativeTransform(positionA, angleA, positionB, angleB, tempTransform0)
//     let edgeA = findSeparatingAxis(shapeA.vertices, shapeA.normals, transformAB, shapeB.vertices, tempA)
//     if(edgeA[1] > radius) return 0
//     let transformBA = relativeTransform(positionB, angleB, positionA, angleA, tempTransform1)
//     let edgeB = findSeparatingAxis(shapeB.vertices, shapeB.normals, transformBA, shapeA.vertices, tempB)
//     if(edgeB[1] > radius) return 0

//     if(edgeB[1] > edgeA[1]){
//         bodyA = arguments[4]; shapeA = arguments[5]; positionA = arguments[6]; angleA = arguments[7]
//         bodyB = arguments[0]; shapeB = arguments[1]; positionB = arguments[2]; angleB = arguments[3]
//         edgeA = edgeB; transformAB = transformBA
//     }

//     incidentEdge: {
//         const normalA = mat2.transform(shapeA.normals[edgeA[0]], transformAB as any, temp0)
//         let index: number, minDistance = Infinity
//         for(let i = shapeB.vertices.length - 1; i >= 0; i--){
//             let distance = vec2.dot(normalA, shapeB.normals[i])
//             if(distance >= minDistance) continue
//             minDistance = distance
//             index = i
//         }
//         vec2.copy(shapeB.vertices[index++], segmentA[0])
//         vec2.copy(shapeB.vertices[index % shapeB.vertices.length], segmentA[1])
//     }
//     const normal = vec2.copy(shapeB.normals[edgeA[0]], temp0)
//     mat2.transform(normal, transformAB as any, normal)
//     const vertexA0 = shapeA.vertices[edgeA[0]++]
//     const vertexA1 = shapeA.vertices[edgeA[0] % shapeA.vertices.length]

//     const tangent = vec2.rotate90ccw(normal, temp1)

//     // const frontOffset = vec2.dot(normal, vertexA0)
//     // const sideOffset1 = -vec2.dot(tangent, vertexA0) + radius
//     // const sideOffset2 = vec2.dot(tangent, vertexA1) + radius

//     // mat2.transform(tangent, transformAB as any, tangent)
//     // const negativeTangent = vec2.scale(tangent, -1, temp2)




    

//     // var v11 = collidePolygons_v11;
//     // var v12 = collidePolygons_v12;

//     // var _tangent = collidePolygons_tangent; // tangent in world space
//     // vec2.rotate(tangent, angleA, _tangent);
//     // var _normal = collidePolygons_normal; // normal in world space
//     // vec2.rotate90cw(_tangent, _normal)
//     // //crossVZ(_normal, _tangent, 1.0);


//     // //mat2.transform(tangent, transformAB as any, tangent)
//     // //mat2.transform(normal, transformAB as any, normal)


//     // toGlobalFrame(v11, vertexA0, positionA, angleA);
//     // toGlobalFrame(v12, vertexA1, positionA, angleA);

//     // var _frontOffset = vec2.dot(_normal, v11);
//     // var _sideOffset1 = -vec2.dot(_tangent, v11)
//     // var _sideOffset2 = vec2.dot(_tangent, v12)

//     // // Clip incident edge against extruded edge1 side edges.
//     // var clipPoints1 = collidePolygons_clipPoints1;
//     // var clipPoints2 = collidePolygons_clipPoints2;
//     // var np = 0;

//     // // Clip to box side 1
//     // var _negativeTangent = collidePolygons_negativeTangent;
//     // vec2.scale(_tangent, -1, _negativeTangent);


//     // vec2.copy(_normal, normal)
//     // vec2.copy(_tangent, tangent)
//     // const negativeTangent = _negativeTangent
//     // const frontOffset = _frontOffset
//     // const sideOffset1 = _sideOffset1
//     // const sideOffset2 = _sideOffset2
    


//     // // vec2.rotate(negativeTangent, angleB, negativeTangent)
//     // // vec2.rotate(tangent, angleB, tangent)
//     // // vec2.rotate(normal, angleB, normal)


//     // var incidentEdge = segmentA
//     // toGlobalFrame(incidentEdge[0], incidentEdge[0], positionB, angleB)
//     // toGlobalFrame(incidentEdge[1], incidentEdge[1], positionB, angleB)


//     np = clipSegmentToLine(clipPoints1, incidentEdge, negativeTangent, sideOffset1);

//     if (np < 2){
//         return 0;
//     }

//     // Clip to negative box side 1
//     np = clipSegmentToLine(clipPoints2, clipPoints1,  tangent, sideOffset2);

//     if (np < 2){
//         return 0;
//     }

//     var pointCount = 0;
//     for (var i = 0; i < 2; ++i)
//     {
//         var separation = vec2.dot(normal, clipPoints2[i]) - frontOffset;

//         if (separation <= 0)
//         {
//             if(bailEarly){
//                 return 1;
//             }

//             ++pointCount;

//             vec2.copy(normal, this.normalA);
//             vec2.copy(clipPoints2[i], this.contactPointB);
//             vec2.scale(normal, -separation, this.contactPointA);
//             vec2.add(clipPoints2[i], this.contactPointA, this.contactPointA);
//             this.registerContactManifold(bodyA, shapeA, bodyB, shapeB)

//         }
//     }

//     return pointCount;
// };

// function clipSegmentToLine(vOut, vIn, normal, offset)
// {
//     // Start with no output points
//     var numOut = 0;

//     // Calculate the distance of end points to the line
//     var distance0 = vec2.dot(normal, vIn[0]) - offset;
//     var distance1 = vec2.dot(normal, vIn[1]) - offset;

//     // If the points are behind the plane
//     if (distance0 <= 0.0){
//         vec2.copy(vIn[0], vOut[numOut++]);
//     }
//     if (distance1 <= 0.0){
//         vec2.copy(vIn[1], vOut[numOut++]);
//     }

//     // If the points are on different sides of the plane
//     if (distance0 * distance1 < 0.0)
//     {
//         // Find intersection point of edge and plane
//         var interp = distance0 / (distance0 - distance1);
//         var v = vOut[numOut];
//         vec2.subtract(vIn[1], vIn[0], v);
//         vec2.scale(v, interp, v);
//         vec2.add(v, vIn[0], v);
//         ++numOut;
//     }

//     return numOut;
// }