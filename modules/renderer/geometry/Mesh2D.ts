import { vec2 } from 'math/vec2'
import { lerp, clamp, linearGradient } from 'math/utilities'
import { Transform2D } from 'scene/Transform2D'
import { Geometry2D } from 'renderer/geometry/Geometry2D'
import { Material } from 'renderer/Material'

interface Mesh2DOptions {
    order: number
    vertices: number[]
    uvs: number[]
    indices?: number[]
}

export class Mesh2D extends Geometry2D<Mesh2DOptions> {
    private static quadIndices: number[] = [0,1,2,0,2,3]
    public vertices: Float32Array
    public uvs: Uint32Array
    public indices: Uint16Array

    public lastTextureIndex: number = -1
    public lastFrame: number = -1

    private uvArray: number[]

    setup(options: Mesh2DOptions){
        this.lastTextureIndex = -1
        this.lastFrame = -1
        this.order = options.order

        this.uvArray = options.uvs
        this.vertices = new Float32Array(options.vertices)
        this.uvs = new Uint32Array(this.uvArray.length / 2)
        
        if(options.indices) this.indices = new Uint16Array(options.indices)
        else{
            const { quadIndices } = Mesh2D
            const quads = this.vertices.length / 8
            this.indices = new Uint16Array(quadIndices.length * quads)
            for(let i = 0; i < this.indices.length; i++){
                this.indices[i] = 4 * Math.floor(i / quadIndices.length) + quadIndices[i % quadIndices.length]
            }
        }
    }
    calculateVertexData(transform: Transform2D, material: Material, frame: number): void {
        if(this.lastTextureIndex != material.diffuse.index){
            this.lastTextureIndex = material.diffuse.index
            if(this.lastFrame == -1) this.updateUVs(this.uvArray)
            this.recalculateUVs(this.uvArray, material.diffuse.uvTransform, this.uvs)
        }

        if(transform && this.lastFrame < transform.lastFrame) this.lastFrame = -1

        if(this.lastFrame != -1) return
        this.lastFrame = frame
        this.updateVertices(this.vertices as any)
        if(transform) this.recalculateVertices(this.vertices as any, transform.globalTransform, this.vertices)
        this.recalculateBoundingBox()
    }
    protected updateUVs(uvs: number[]){
        
    }
    protected updateVertices(vertices: number[]){
        
    }
    reset(){}
}