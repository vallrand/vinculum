import { GLContext, GL } from '../gl'

export class BufferObject {
    protected readonly buffer: WebGLBuffer
    private byteLength: number = 0
    data: ArrayBuffer | ArrayBufferView
    constructor(
        protected readonly gl: GLContext,
        protected readonly type: number,
        protected readonly drawType: number = GL.STATIC_DRAW
    ){
        this.buffer = gl.createBuffer()
    }
    bind(){
        this.gl.bindBuffer(this.type, this.buffer)
    }
    delete(){
        this.gl.deleteBuffer(this.buffer)
    }
    upload(source: ArrayBuffer | ArrayBufferView, offset: number = 0){
        this.bind()
        if(!source) this.gl.bufferData(this.type, this.data, this.drawType)
        else{
            if(this.byteLength !== this.data.byteLength)
                this.gl.bufferData(this.type, this.byteLength = this.data.byteLength, this.drawType)

            const BYTES_PER_ELEMENT: number = (source as any).BYTES_PER_ELEMENT || 1
            this.gl.bufferSubData(this.type, BYTES_PER_ELEMENT * offset, source)
        }
    }
}