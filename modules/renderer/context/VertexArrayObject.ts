import { GLContext, GL } from '../gl'
import { VertexDataFormat } from './VertexDataFormat'
import { IndexBufferObject } from './IndexBufferObject'
import { VertexBufferObject } from './VertexBufferObject'

export class VertexArrayObject {
    private readonly vao: WebGLVertexArrayObject
    private indexBuffer: IndexBufferObject
    constructor(private readonly gl: GLContext){
        this.vao = gl.createVertexArray()
    }
    bind(){
        this.gl.bindVertexArray(this.vao)
    }
    bindIndexBuffer(indexBuffer: IndexBufferObject): this {
        this.bind()
        if(indexBuffer) indexBuffer.bind()
        else this.gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null)
        this.indexBuffer = indexBuffer
        return this
    }
    bindVertexBuffer(
        vertexBuffer: VertexBufferObject,
        dataFormat: VertexDataFormat,
        attributeLocations: Record<string, { location: number, size: number }>
    ): this {
        for(let attrib, i = 0; attrib = dataFormat.attributes[i]; i++){
            const { name, type, normalized, offset } = attrib
            if(!attributeLocations[name]) continue
            this.bindVertexAttribute(
                vertexBuffer,
                attributeLocations[name],
                type, normalized, dataFormat.stride, offset
            )
        }
        return this
    }
    bindVertexAttribute(
        vertexBuffer: VertexBufferObject,
        attrib: { location: number, size: number },
        type: number = GL.FLOAT,
        normalized: boolean = false,
        stride: number = 0,
        offset: number = 0
    ): this {
        this.bind()
        if(!vertexBuffer)
            this.gl.disableVertexAttribArray(attrib.location)
        else{
            vertexBuffer.bind()
            this.gl.enableVertexAttribArray(attrib.location)
            this.gl.vertexAttribPointer(attrib.location, attrib.size, type, normalized, stride, offset)
        }
        return this
    }
    render(type: number, length: number, offset: number = 0){
        if(this.indexBuffer) this.gl.drawElements(
            type || GL.TRIANGLES,
            length || this.indexBuffer.data.length,
            this.indexBuffer.dataType,
            offset * this.indexBuffer.data.BYTES_PER_ELEMENT)
        else this.gl.drawArrays(type || GL.TRIANGLES, offset, length)
    }
    delete(){
        this.gl.deleteVertexArray(this.vao)
    }
}