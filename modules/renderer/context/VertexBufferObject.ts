import { GLContext, GL, GL_TYPED_ARRAY } from '../gl'
import { BufferObject } from './BufferObject'

export class VertexBufferObject extends BufferObject {
    data: ArrayBuffer
    private readonly views: Record<number, ArrayBufferView> = Object.create(null)
    constructor(gl: GLContext, size: number, drawType?: number){
        super(gl, GL.ARRAY_BUFFER, drawType)
        
        this.data = new ArrayBuffer(size)
    }
    upload(source: ArrayBuffer | ArrayBufferView, offset: number = 0, length?: number){
        if(!length) return super.upload(source, offset)
        const subView = (this.dataView(GL.FLOAT) as Int32Array).subarray(offset, offset + length)
        if(subView.length < length) throw new Error('Insufficient buffer size.')
        super.upload(subView, offset)
    }
    dataView(type: number): ArrayBufferView {
        if(!this.views[type])
            this.views[type] = new GL_TYPED_ARRAY[type](this.data)
        return this.views[type]
    }
}