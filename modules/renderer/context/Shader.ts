import { GLContext, GL, GL_SIZE } from '../gl'
import { UniformAccessObject } from './UniformAccessObject'

const withPrecision = (source: string, precision: string): string => 
`precision ${precision}p float;${source.replace(/precision[a-z\s]+float\s+;?/i, '')}`

export class Shader {
    public readonly attributes: Record<string, {
        location: number, type: number, size: number
    }> = Object.create(null)
    public readonly uniforms: Record<string, {
        location: WebGLUniformLocation, type: number, size: number, length: number
    }> = Object.create(null)
    public readonly uao: UniformAccessObject
    private readonly program: WebGLProgram
    constructor(
        private readonly gl: GLContext,
        vertexSource: string, fragmentSource: string,
        attributeLocations?: Record<string, number>
    ){
        vertexSource = withPrecision(vertexSource, gl.VERT_PRECISION)
        fragmentSource = withPrecision(fragmentSource, gl.FRAG_PRECISION)

        this.program = gl.createProgram()
        const vertex: WebGLShader = gl.createShader(GL.VERTEX_SHADER)
        const fragment: WebGLShader = gl.createShader(GL.FRAGMENT_SHADER)

        gl.shaderSource(vertex, vertexSource)
        gl.compileShader(vertex)

        gl.shaderSource(fragment, fragmentSource)
        gl.compileShader(fragment)

        gl.attachShader(this.program, vertex)
        gl.attachShader(this.program, fragment)
        
        for(let attributeName in attributeLocations)
            gl.bindAttribLocation(this.program, attributeLocations[attributeName], attributeName)

        gl.linkProgram(this.program)
        if(!gl.getProgramParameter(this.program, GL.LINK_STATUS))
            throw new Error([
                gl.getProgramInfoLog(this.program),
                gl.getShaderInfoLog(vertex),
                gl.getShaderInfoLog(fragment)
            ].join('\n'))

        gl.deleteShader(vertex)
        gl.deleteShader(fragment)
            
        for(let i = gl.getProgramParameter(this.program, GL.ACTIVE_ATTRIBUTES) - 1; i >= 0; i--){
            const attribute: WebGLActiveInfo = gl.getActiveAttrib(this.program, i)
            const location: number = gl.getAttribLocation(this.program, attribute.name)
            this.attributes[attribute.name] = {
                location, type: attribute.type, size: GL_SIZE[attribute.type]
            }
        }

        for(let i = gl.getProgramParameter(this.program, GL.ACTIVE_UNIFORMS) - 1; i >= 0; i--){
            const uniform: WebGLActiveInfo = gl.getActiveUniform(this.program, i)
            const location: WebGLUniformLocation = gl.getUniformLocation(this.program, uniform.name)

            const path = uniform.name
            .replace(/\[(\d+)\]/g, '.$1')
            .replace(/\.0$/, '')
            this.uniforms[path] = {
                location, type: uniform.type, size: GL_SIZE[uniform.type], length: uniform.size
            }
        }

        this.uao = new UniformAccessObject(gl, this.uniforms)
    }
    bind(){
        this.gl.useProgram(this.program)
        this.uao.upload()
    }
    delete(){
        this.gl.deleteProgram(this.program)
    }
}