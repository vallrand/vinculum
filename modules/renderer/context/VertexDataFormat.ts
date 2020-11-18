import { GL, GL_BYTE_SIZE } from '../gl'

export interface VertexDataFormat {
    readonly stride: number
    readonly attributes: {
        name: string
        size: number
        type: number
        normalized?: boolean
        offset: number
    }[]
}

export function VertexDataFormat(interleaved: {
    name: string, size: number, type: number, normalized?: boolean
}[]): VertexDataFormat {
    let stride = 0
    const attributes = []
    for(let i = 0; i < interleaved.length; i++){
        const { name, size, type, normalized } = interleaved[i]
        const byteSize = size * GL_BYTE_SIZE[type]
        attributes.push({ name, size, type, normalized, offset: stride })
        stride += byteSize
    }
    return { stride, attributes }
}