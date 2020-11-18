import { hashString } from 'math/utilities'
import { EntityManager } from 'framework/EntityManager'
import { Material, MaterialOptions } from './Material'
import { Shader } from './context/Shader'
import { Renderer2DSystem } from './Renderer2DSystem'
import { GL, GLContext } from './gl'

export interface ShaderMaterialOptions extends MaterialOptions {
    vertexSource: string
    fragmentSource: string
    attributes: Record<string, any>
}

export class ShaderAttributes {
    constructor(public readonly attributes: Record<string, number | number[]>){}
    public synchronize(shader: Shader){

    }
}

export class ShaderMaterial<Options extends ShaderMaterialOptions = ShaderMaterialOptions> extends Material<Options> {
    public static synchronize(attributes: Record<string, number | number[]>, shader: Shader): void {
        for(let key in attributes) shader.uao[key] = attributes[key]
    }

    public static readonly vertexSource: string = require('./shaders/quad_vert.glsl')
    public static readonly fragmentSource: string = require('./shaders/quad_frag.glsl')
    private static readonly cachedShaders: Record<number, Shader> = Object.create(null)
    public shader: Shader
    public attributes: Record<string, number | number[]>
    setup(options: Options, manager: EntityManager){
        super.setup(options, manager)
        const {
            vertexSource = ShaderMaterial.vertexSource,
            fragmentSource = ShaderMaterial.fragmentSource
        } = options
        const hash = hashString(vertexSource + fragmentSource)
        this.shader = ShaderMaterial.cachedShaders[hash] || (
            ShaderMaterial.cachedShaders[hash] = new Shader(manager.resolveSystem(Renderer2DSystem).gl, vertexSource, fragmentSource, {
                'aPosition': 0,
                'aUV': 1,
                'aColor': 2
            })
        )
        this.attributes = options.attributes
    }
    reset(){
        super.reset()
        // this.shader.delete()
        this.shader = null
    }
}