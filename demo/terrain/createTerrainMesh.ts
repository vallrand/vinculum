import { vec2, mod, lerp, clamp } from 'math'
import { TextureResource } from 'renderer'

export function createTerrainMesh(lines: Array<[vec2, vec2]>, texture: TextureResource): {
    vertices: number[]
    uvs: number[]
}{
    const width = texture.width * 2
    const height = texture.height * 2

    const vertices = []
    const uvs = []
    const direction = vec2()

    lines.sort((a, b) => Math.min(a[0][1], a[1][1]) - Math.min(b[0][1], b[1][1]))
    for(let index = 0, i = 0; i < lines.length; i++){
        const [ start, end ] = lines[i]
        vec2.subtract(end, start, direction)
        const angle = vec2.rotation(direction)
        if(Math.abs(direction[0]) < 1e-6) continue

        const length = vec2.magnitude(direction)
        const skew = -height * Math.sin(angle)

        const u00 = 1 + mod((start[0] + start[1] * Math.sqrt(2)) / width, 1)
        const u01 = u00 + length / width
        const u10 = u00 - skew / width
        const u11 = u01 - skew / width

        for(let x0 = Math.min(u00, u10), max = Math.max(u01, u11); x0 < max;){
            let x1 = Math.min(max, x0 + (1 - mod(x0, 1)))

            const f00 = clamp((x0 - u00) / (u01 - u00), 0, 1)
            const f01 = clamp((x1 - u00) / (u01 - u00), 0, 1)
            const f10 = clamp((x0 - u10) / (u11 - u10), 0, 1)
            const f11 = clamp((x1 - u10) / (u11 - u10), 0, 1)

            vertices[index + 0] = lerp(start[0], end[0], f00)
            vertices[index + 1] = lerp(start[1], end[1], f00)
            vertices[index + 2] = lerp(start[0], end[0], f01)
            vertices[index + 3] = lerp(start[1], end[1], f01)
            vertices[index + 4] = lerp(start[0], end[0], f11)
            vertices[index + 5] = lerp(start[1], end[1], f11) + height
            vertices[index + 6] = lerp(start[0], end[0], f10)
            vertices[index + 7] = lerp(start[1], end[1], f10) + height

            const iu00 = lerp(u00, u01, f00)
            const iu01 = lerp(u00, u01, f01)
            const iu10 = lerp(u10, u11, f10)
            const iu11 = lerp(u10, u11, f11)
            const shift = Math.max(Math.floor(iu00), Math.floor(iu10))

            uvs[index + 0] = clamp(iu00 - shift, 0, 1)
            uvs[index + 2] = clamp(iu01 - shift, 0, 1)
            uvs[index + 4] = clamp(iu11 - shift, 0, 1)
            uvs[index + 6] = clamp(iu10 - shift, 0, 1)
            uvs[index + 1] = 0
            uvs[index + 3] = 0
            uvs[index + 5] = 1
            uvs[index + 7] = 1
            
            index += 8
            x0 = x1
        }
    }
    return { vertices, uvs }
}

export function createWallMesh(lines: Array<[vec2, vec2]>, texture: TextureResource): {
    vertices: number[]
    uvs: number[]
}{
    const width = texture.width
    const height = texture.height

    const vertices = []
    const uvs = []

    for(let index = 0, i = 0; i < lines.length; i++){
        const [ start, end ] = lines[i]
        if(Math.abs(start[0] - end[0]) > 1e-6) continue

        const minY = Math.min(start[1], end[1])
        const maxY = Math.max(start[1], end[1]) + 2 * height
        const length = maxY - minY

        const half = end[1] > start[1] ? height : -height
        const min = mod(start[1], 1), max = min + length / width
        for(let y0 = min; y0 < max;){
            let y1 = Math.min(max, y0 + (1 - mod(y0, 1)))

            const f0 = clamp((y0 - min) / (max - min), 0, 1)
            const f1 = clamp((y1 - min) / (max - min), 0, 1)

            vertices[index + 0] = vertices[index + 2] = start[0] - half
            vertices[index + 1] = vertices[index + 7] = lerp(minY, maxY, f0)
            vertices[index + 3] = vertices[index + 5] = lerp(minY, maxY, f1)
            vertices[index + 4] = vertices[index + 6] = start[0] + half

            uvs[index + 0] = uvs[index + 6] = f0
            uvs[index + 1] = uvs[index + 3] = 0
            uvs[index + 2] = uvs[index + 4] = f1
            uvs[index + 5] = uvs[index + 7] = 1
            
            index += 8
            y0 = y1
        }
    }
    return { vertices, uvs }
}