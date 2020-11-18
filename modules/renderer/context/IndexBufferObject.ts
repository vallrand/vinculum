import { GLContext, GL, GL_TYPED_ARRAY } from '../gl'
import { BufferObject } from './BufferObject'

export class IndexBufferObject extends BufferObject {
    data: Uint8Array | Uint16Array | Uint32Array
    constructor(gl: GLContext, size: number, readonly dataType: number = GL.UNSIGNED_SHORT, drawType?: number){
        super(gl, GL.ELEMENT_ARRAY_BUFFER, drawType)

        if(this.dataType === GL.UNSIGNED_INT && !gl.extensions['element_index_uint'])
            this.dataType = GL.UNSIGNED_SHORT

        this.data = new GL_TYPED_ARRAY[this.dataType](size) as Uint8Array | Uint16Array | Uint32Array
    }
    upload(source: ArrayBuffer | ArrayBufferView, offset: number = 0, length?: number){
        if(!length) return super.upload(source, offset)
        const subView = this.data.subarray(offset, offset + length)
        if(subView.length < length) throw new Error('Insufficient buffer size.')
        super.upload(subView, offset)
    }
}