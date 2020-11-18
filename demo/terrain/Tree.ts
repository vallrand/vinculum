import { vec2, lerp, randomFloat, lerpAngle, ease, clamp } from 'math'
import { EntityManager, ReusableComponent, IUpdateContext } from 'framework'

import { rng } from '../helpers'

interface TreeOptions {
    iterations: number
    branchingFactor: number
    width: number
    length: number
}

class TreeNode {
    readonly position: vec2 = vec2()
    constructor(
        readonly step: number,
        readonly parent: number,
        readonly prevLength: number,
        readonly prevAngle: number,
        readonly prevWidth: number
    ){}
    offset: number = rng()
    length: number = this.prevLength
    angle: number = this.prevAngle
    width: number = this.prevWidth
}

export class Tree extends ReusableComponent<TreeOptions> {
    private static readonly temp: vec2 = vec2()
    private static readonly UP: vec2 = vec2(0, -1)
    public nodes: TreeNode[]
    prevGrowth: number = 0
    public growth: number = 0
    lastFrame: number = -1
    setup(options: TreeOptions){
        this.lastFrame = -1
        this.prevGrowth = this.growth = 0
        const branchingFactor = (step: number, index: number) =>
        1 - (1-lerp(0, options.branchingFactor, step)) * Math.pow(index, 2)

        this.nodes = this.generateNodes(options.iterations, {
            branch: (step, index) => branchingFactor(step, index) > rng(),
            angle: (step, index, prevAngle) => {
                const deviation = Math.PI * lerp(0.2, 0.5, index)
                let angle = prevAngle + randomFloat(-deviation, deviation, rng)
                angle = lerpAngle(0, angle, 4 * (1 - step) * step)
                return angle
            },
            length: step => options.length * lerp(0.2, 1, step),
            width: step => options.width * lerp(0.5, 1.6, ease.quadIn(step))
        })
    }
    private generateNodes(iterations: number, samplers: {
        branch: (step: number, index: number) => boolean
        angle: (step: number, index: number, prevAngle: number) => number
        length: (step: number) => number
        width: (step: number) => number
    }): TreeNode[] {
        const out: TreeNode[] = []
        const deltaStep = 1 / iterations
    
        const stack: TreeNode[] = [new TreeNode(1, -1, 0, 0, samplers.width(1))]
        while(stack.length){
            const node: TreeNode = stack.pop()
            const parent = out.push(node) - 1
            if(node.step <= 0) continue
    
            for(let index = 0; samplers.branch(node.step, index); index++){
                const angle = samplers.angle(node.step, index, node.angle)
                const length = samplers.length(node.step)
                const step = node.step - deltaStep
                const width = samplers.width(step)
                stack.push(new TreeNode(step, parent, length, angle, width))
            }
        }
        return out
    }
    public calculateVertexData(){
        const vertices = new Float32Array(this.nodes.length * 2 * 2)
        const uvs = new Float32Array(this.nodes.length * 2 * 2)
        const indices = new Uint16Array((this.nodes.length - 1) * 6)
    
        for(let index = 0, i = 0; i < this.nodes.length; i++){
            const { step, parent }: TreeNode = this.nodes[i]
            uvs[i*4+0] = uvs[i*4+2] = 1 - step
            uvs[i*4+1] = 0
            uvs[i*4+3] = 1
    
            if(parent == -1) continue
            indices[index++] = i*2+0
            indices[index++] = i*2+1
            indices[index++] = parent*2+1
            
            indices[index++] = parent*2+1
            indices[index++] = parent*2+0
            indices[index++] = i*2+0
        }
        this.updateVertices(vertices as any)
        return { vertices, uvs, indices }
    }
    public updateVertices(vertices: number[]){
        for(let i = 0; i < this.nodes.length; i++){
            const {
                position, angle, parent, length, width
            }: TreeNode = this.nodes[i]

            vec2.rotate(Tree.UP, angle, position)
            const tangent = vec2.rotate90cw(position, Tree.temp)
            vec2.scale(position, length, position)
            vec2.add(parent >= 0 ? this.nodes[parent].position : vec2.ZERO, position, position)
            vec2.scale(tangent, 0.5 * width, tangent)
    
            vertices[i*4+0] = position[0] + tangent[0]
            vertices[i*4+1] = position[1] + tangent[1]
            vertices[i*4+2] = position[0] - tangent[0]
            vertices[i*4+3] = position[1] - tangent[1]
        }
    }
    update(context: IUpdateContext){
        if(this.growth === this.prevGrowth && !this.growth && this.lastFrame != -1) return
        this.lastFrame = context.frame
        this.prevGrowth += Math.sign(this.growth - this.prevGrowth) * 0.2 * context.deltaTime

        for(let length = this.nodes.length, i = 0; i < length; i++){
            const node = this.nodes[i]

            const duration = lerp(0.2, 1, node.step)
            const factor = clamp((this.prevGrowth - (1 - duration)) / duration, 0, 1)
            const angle = lerp(0, 0.3, 1 - node.step) * Math.sin(2 * Math.PI * node.offset + context.elapsedTime)
            node.angle = node.prevAngle * ease.quadOut(factor) + angle
            node.width = node.prevWidth * ease.sineOut(factor)
            node.length = node.prevLength * ease.quartOut(factor)
        }
    }
    reset(){ this.nodes.length = 0 }
}