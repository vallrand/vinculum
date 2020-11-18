import { AABB } from 'math/AABB'

interface QuadTreeOptions {
    depthLimit: number
    capacity: number
}

interface QuadTreeNode {
    depth: number
    pointer: number
    bounds: AABB
    indices: number[]
}

const enum Quadrant {
    NORTH_EAST = 0x01,
    NORTH_WEST = 0x02,
    SOUTH_EAST = 0x04,
    SOUTH_WEST = 0x08
}

export class QuadTree<T extends { aabb: AABB }> {
    private readonly nodes: QuadTreeNode[] = []
    private readonly items: T[] = []
    private readonly visited: boolean[] = []
    private count: number = 0
    private readonly stack: Uint16Array
    private readonly options: QuadTreeOptions
    constructor(bounds: AABB, options: QuadTreeOptions){
        this.options = { capacity: 8, depthLimit: 4, ...options }
        this.stack = new Uint16Array(this.options.depthLimit * 3)
        this.allocateNode(bounds[0], bounds[1], bounds[2], bounds[3], 0)
    }
    get root(): QuadTreeNode { return this.nodes[0] }
    public insert(item: T): void {
        const index = this.items.push(item) - 1

        let length = 0
        this.stack[length++] = 0
        while(length){
            const node = this.nodes[this.stack[--length]]
            if(node.pointer == -1)
                if(node.indices.length < this.options.capacity || node.depth >= this.options.depthLimit){
                    node.indices.push(index)
                    continue
                }else
                    this.split(node)

            const quadrant = this.computeQuadrant(node, item.aabb)
            if(quadrant & Quadrant.SOUTH_WEST) this.stack[length++] = node.pointer + 3
            if(quadrant & Quadrant.SOUTH_EAST) this.stack[length++] = node.pointer + 2
            if(quadrant & Quadrant.NORTH_WEST) this.stack[length++] = node.pointer + 1
            if(quadrant & Quadrant.NORTH_EAST) this.stack[length++] = node.pointer + 0
        }
    }
    public remove(item: T): void {
        const index = this.items.indexOf(item)
        if(~index) return
        this.items.splice(index, 1)

        for(let i = this.count - 1; i >= 0; i--){
            const { pointer, indices } = this.nodes[i]
            if(pointer != -1) continue
            for(let j = indices.length - 1; j >= 0; j--)
                if(indices[j] === index) indices.splice(j, 1)
                else if(indices[j] > index) indices[j]--
        }
    }
    public query(bounds: AABB, out: Array<T | number> = []): T[] {
        this.visited.length = Math.max(this.visited.length, this.items.length)

        let length = 0
        this.stack[length++] = 0
        while(length){
            const node = this.nodes[this.stack[--length]]
            if(node.pointer == -1){
                for(let i = node.indices.length - 1; i >= 0; i--){
                    const index = node.indices[i]
                    if(this.visited[index]) continue
                    if(!AABB.overlap(this.items[index].aabb, bounds)) continue
                    this.visited[index] = true
                    out.push(index)
                }
            }else{
                const quadrant = this.computeQuadrant(node, bounds)
                if(quadrant & Quadrant.SOUTH_WEST) this.stack[length++] = node.pointer + 3
                if(quadrant & Quadrant.SOUTH_EAST) this.stack[length++] = node.pointer + 2
                if(quadrant & Quadrant.NORTH_WEST) this.stack[length++] = node.pointer + 1
                if(quadrant & Quadrant.NORTH_EAST) this.stack[length++] = node.pointer + 0
            }
        }

        for(let i = out.length - 1; i >= 0; i--){
            let index = out[i] as number
            this.visited[index] = false
            out[i] = this.items[index]
        }
        return out as T[]
    }
    public clear(): void {
        this.count = 1
        this.nodes[0].pointer = -1
        this.items.length = 0
    }
    private allocateNode(left: number, top: number, right: number, bottom: number, depth: number): number {
        if(this.nodes.length <= this.count) this.nodes.push({
            indices: [],
            pointer: -1,
            depth,
            bounds: AABB(left, top, right, bottom)
        })
        else{
            const node = this.nodes[this.count]
            AABB.fromValues(left, top, right, bottom, node.bounds)
            node.pointer = -1
            node.depth = depth
            node.indices.length = 0
        }
        return this.count++
    }
    private split(node: QuadTreeNode): void {
        const left = node.bounds[0], right = node.bounds[2]
        const top = node.bounds[1], bottom = node.bounds[3]
        const splitX = 0.5 * (left + right), splitY = 0.5 * (top + bottom)
        const depth = node.depth + 1

        const pointer = node.pointer = 
        this.allocateNode(splitX, top, right, splitY, depth)
        this.allocateNode(left, top, splitX, splitY, depth)
        this.allocateNode(splitX, splitY, right, bottom, depth)
        this.allocateNode(left, splitY, splitX, bottom, depth)

        for(let i = node.indices.length - 1; i >= 0; i--){
            const index = node.indices[i]
            const item = this.items[index]
            const quadrant = this.computeQuadrant(node, item.aabb)
            if(quadrant & Quadrant.NORTH_EAST) this.nodes[pointer + 0].indices.push(index)
            if(quadrant & Quadrant.NORTH_WEST) this.nodes[pointer + 1].indices.push(index)
            if(quadrant & Quadrant.SOUTH_EAST) this.nodes[pointer + 2].indices.push(index)
            if(quadrant & Quadrant.SOUTH_WEST) this.nodes[pointer + 3].indices.push(index)
        }
        node.indices.length = 0
    }
    private computeQuadrant(node: QuadTreeNode, bounds: AABB): number {
        const centerX = 0.5 * (node.bounds[0] + node.bounds[2])
        const centerY = 0.5 * (node.bounds[1] + node.bounds[3])
        const startIsWest = bounds[0] <= centerX ? Quadrant.NORTH_WEST | Quadrant.SOUTH_WEST : 0
        const startIsNorth = bounds[1] <= centerY ? Quadrant.NORTH_EAST | Quadrant.NORTH_WEST : 0
        const endIsEast = bounds[2] > centerX ? Quadrant.NORTH_EAST | Quadrant.SOUTH_EAST : 0
        const endIsSouth = bounds[3] > centerY ? Quadrant.SOUTH_EAST | Quadrant.SOUTH_WEST : 0

        return (
            (endIsEast & startIsNorth) |
            (startIsWest & startIsNorth) |
            (endIsEast & endIsSouth) |
            (startIsWest & endIsSouth)
        )
    }
}