import { GLContext, GL } from  '../gl'

interface Uniform {
    location: WebGLUniformLocation
    type: number
    size: number
    length: number
}

interface UniformData {
    value: number | Float32List | Int32List
    upload(value: any): void
    set(this: UniformData, value: number | number[]): void
    dirty?: number
}

function valueSetter(this: UniformData, value: number): void {
    this.dirty |= +(this.value !== value)
    this.value = value
}

function arraySetter(this: UniformData, value: number[]): void {
    const array = this.value as number[]
    for(let i = array.length - 1; i >= 0; i--){
        this.dirty |= +(array[i] !== value[i])
        array[i] = value[i]
    }
}

export class UniformAccessObject {
    private readonly uniforms: UniformData[] = []
    private createUniformData(uniform: Uniform): UniformData {
        const { location, type, size, length } = uniform
        const { gl } = this
        switch(type){
            case GL.INT:
            case GL.SAMPLER_2D: return length > 1 ? {
                value: new Int32Array(length * size),
                upload: gl.uniform1iv.bind(gl, location),
                set: arraySetter
            } : {
                value: 0,
                upload: gl.uniform1i.bind(gl, location),
                set: valueSetter
            }
            case GL.FLOAT: return length > 1 ? {
                value: new Float32Array(length * size),
                upload: gl.uniform1fv.bind(gl, location),
                set: arraySetter
            } : {
                value: 0,
                upload: gl.uniform1f.bind(gl, location),
                set: valueSetter
            }
            case GL.FLOAT_VEC2: return {
                value: new Float32Array(length * size),
                upload: gl.uniform2fv.bind(gl, location),
                set: arraySetter
            }
            case GL.FLOAT_VEC3: return {
                value: new Float32Array(length * size),
                upload: gl.uniform3fv.bind(gl, location),
                set: arraySetter
            }
            case GL.FLOAT_VEC4: return {
                value: new Float32Array(length * size),
                upload: gl.uniform4fv.bind(gl, location),
                set: arraySetter
            }
            case GL.FLOAT_MAT2: return {
                value: new Float32Array(length * size),
                upload: gl.uniformMatrix2fv.bind(gl, location, false),
                set: arraySetter
            }
            case GL.FLOAT_MAT3: return {
                value: new Float32Array(length * size),
                upload: gl.uniformMatrix3fv.bind(gl, location, false),
                set: arraySetter
            }
            case GL.FLOAT_MAT4: return {
                value: new Float32Array(length * size),
                upload: gl.uniformMatrix4fv.bind(gl, location, false),
                set: arraySetter
            }
        }
    }
    constructor(private readonly gl: GLContext, uniforms: Record<string, Uniform>){
        for(let path in uniforms){
            const uniform: Uniform = uniforms[path]
            const uniformData: UniformData = this.createUniformData(uniform)
            Object.defineProperty(this, path, {
                set: uniformData.set.bind(uniformData)
            })
            this.uniforms.push(uniformData)
        }
    }
    upload(): void {
        for(let uniform: UniformData, i = 0; uniform = this.uniforms[i]; i++){
            if(!uniform.dirty) continue
            uniform.dirty = 0
            uniform.upload(uniform.value)
        }
    }
}