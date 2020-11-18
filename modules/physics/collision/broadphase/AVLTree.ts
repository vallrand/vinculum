import { ObjectPool } from 'common/ObjectPool'
import { vec2 } from 'math/vec2'
import { AABB } from 'math/AABB'
import { RigidBody } from '../../dynamics/RigidBody'
import { Ray } from '../raycaster/Ray'
import { Broadphase } from './Broadphase'

class TreeNode<T> {
    static readonly tempAABB: AABB = AABB()
    readonly aabb: AABB = AABB()
    height: number = -1
    parent: TreeNode<T> = null
    child1: TreeNode<T> = null
    child2: TreeNode<T> = null
    get leaf(): boolean { return this.child1 == null }
    delegate: T = null
    reset(): this {
        this.height = -1
        this.parent = null
        this.child1 = null
        this.child2 = null
        this.delegate = null
        return this
    }
}

export class AVLTree extends Broadphase {
    static readonly tempAABB: AABB = AABB()
    static readonly temp0: vec2 = vec2()
    static readonly temp1: vec2 = vec2()
    static readonly temp2: vec2 = vec2()
    static readonly temp3: vec2 = vec2()

    private padding: number = 0.1
    private sweepScale: number = 2.0
    private root: TreeNode<RigidBody> = null
    private nodes: TreeNode<RigidBody>[] = []
    private readonly stack: TreeNode<RigidBody>[] = []
    private readonly pool: ObjectPool<TreeNode<RigidBody>> = 
    new ObjectPool<TreeNode<RigidBody>>(index => new TreeNode)
    public insert(body: RigidBody): void {
        const node = this.pool.aquire()
        AABB.copy(body.aabb, node.aabb)
        AABB.padding(node.aabb, this.padding, node.aabb)
        node.delegate = body
        node.height = 0
        this.insertLeaf(node)
        this.nodes[body.index] = node
    }
    public remove(body: RigidBody): void {
        const node = this.nodes[body.index]
        if(this.nodes.length === body.index - 1) this.nodes.length--
        else this.nodes[body.index] = this.nodes.pop()
        this.removeLeaf(node)
        this.pool.recycle(node.reset())
        super.remove(body)
    }
    public update(): void {
        const { stack, nodes } = this
        for(let i = nodes.length - 1; i >= 0; i--){
            let node = nodes[i]
            let body = node.delegate
            if(AABB.contains(node.aabb, body.aabb)) continue
            this.removeLeaf(node)
            AABB.copy(body.aabb, node.aabb)
            AABB.padding(node.aabb, this.padding, node.aabb)

            const displacement = vec2.subtract(body.position, body.previousPosition, AVLTree.temp0)
            if(displacement[0] < 0) node.aabb[0] += displacement[0] * this.sweepScale
            else node.aabb[2] += displacement[0] * this.sweepScale
            if(displacement[1] < 0) node.aabb[1] += displacement[1] * this.sweepScale
            else node.aabb[3] += displacement[1] * this.sweepScale
            stack.push(node)
        }
        while(stack.length) this.insertLeaf(stack.pop())
    }
    public queryCollisionPairs(consumer: (bodyA: RigidBody, bodyB: RigidBody) => boolean): void {
        const { stack, nodes } = this
        for(let i = nodes.length - 1; i >= 0; i--){
            let leaf = nodes[i]
            let body = leaf.delegate

            let node = leaf
            while(node.parent){
                if(node.parent.child1 === node) stack.push(node.parent.child2)
                else stack.push(node.parent.child1)
                node = node.parent
            }
            while(stack.length){
                const node = stack.pop()
                if(!AABB.overlap(body.aabb, node.aabb)) continue
                if(!node.leaf) stack.push(node.child1, node.child2)
                else if(body.index < node.delegate.index && this.filter(node.delegate, body))
                    if(consumer(body, node.delegate) == false) return
            }
        }
    }
    public queryAABB(aabb: AABB, consumer: (body: RigidBody) => boolean): void {
        const { stack } = this
        stack.push(this.root)
        while(stack.length){
            const node = stack.pop()
            if(!node || !AABB.overlap(aabb, node.aabb)) continue
            if(!node.leaf) stack.push(node.child1, node.child2)
            else if(consumer(node.delegate) == false) return
        }
    }
    private rebalance(node: TreeNode<RigidBody>): void {
        while(node){
            node = this.balanceNode(node)
            AABB.merge(node.child1.aabb, node.child2.aabb, node.aabb)
            node.height = 1 + Math.max(node.child1.height, node.child2.height)
            node = node.parent
        }
    }
    private balanceNode(A: TreeNode<RigidBody>): TreeNode<RigidBody> {
        if(A.leaf || A.height < 2) return A
        const balance = A.child2.height - A.child1.height
        const B = balance < 0 ? A.child1 : A.child2
        const C = balance < 0 ? A.child2 : A.child1
        if(-1 <= balance && balance <= 1) return A

        const swap = B.child1.height > B.child2.height
        const D = swap ? B.child1 : B.child2
        const E = swap ? B.child2 : B.child1

        B.child1 = A
        B.parent = A.parent
        A.parent = B
        if(B.parent === null) this.root = B
        else if(B.parent.child1 === A) B.parent.child1 = B
        else B.parent.child2 = B

        B.child2 = D
        if(balance < 0) A.child1 = E
        else A.child2 = E
        E.parent = A
        AABB.merge(C.aabb, E.aabb, A.aabb)
        AABB.merge(A.aabb, D.aabb, B.aabb)
        A.height = 1 + Math.max(C.height, E.height)
        B.height = 1 + Math.max(A.height, D.height)

        return B
    }
    private insertLeaf(leaf: TreeNode<RigidBody>){
        if(!this.root) return this.root = leaf
        const { tempAABB } = TreeNode
        let sibling = this.root
        while(!sibling.leaf){
            const area = AABB.perimeter(sibling.aabb)
            AABB.merge(sibling.aabb, leaf.aabb, tempAABB)
            const nextArea = AABB.perimeter(tempAABB)
            const cost = 2 * nextArea
            const inheritanceCost = 2 * (nextArea - area)

            const { child1, child2 } = sibling

            AABB.merge(child1.aabb, leaf.aabb, tempAABB)
            let descendCost1 = inheritanceCost + AABB.perimeter(tempAABB)
            if(!child1.leaf) descendCost1 -= AABB.perimeter(child1.aabb)

            AABB.merge(child2.aabb, leaf.aabb, tempAABB)
            let descendCost2 = inheritanceCost + AABB.perimeter(tempAABB)
            if(!child2.leaf) descendCost2 -= AABB.perimeter(child2.aabb)

            if(cost < descendCost1 && cost < descendCost2) break
            if(descendCost1 < descendCost2) sibling = child1
            else sibling = child2
        }

        const prevParent = sibling.parent
        const nextParent = this.pool.aquire()
        nextParent.parent = prevParent
        AABB.merge(leaf.aabb, sibling.aabb, nextParent.aabb)
        nextParent.height = 1 + sibling.height
        nextParent.child1 = sibling
        nextParent.child2 = leaf
        sibling.parent = nextParent
        leaf.parent = nextParent
        if(prevParent === null) this.root = nextParent
        else if(prevParent.child1 === sibling) prevParent.child1 = nextParent
        else prevParent.child2 = nextParent

        this.rebalance(leaf.parent)
    }
    removeLeaf(leaf: TreeNode<RigidBody>){        
        if(this.root === leaf) return this.root = null
        const parent = leaf.parent
        const grandParent = parent.parent
        const sibling = parent.child1 === leaf ? parent.child2 : parent.child1
        if(grandParent === null) this.root = sibling
        else if(grandParent.child1 === parent) grandParent.child1 = sibling
        else grandParent.child2 = sibling
        sibling.parent = grandParent
        this.pool.recycle(parent.reset())
        this.rebalance(grandParent)
    }
    raycast(ray: Ray, consumer: (body: RigidBody) => number): void {
        const aabb = AABB.copy(ray.aabb, AVLTree.tempAABB)
        const target = vec2.copy(ray.target, AVLTree.temp0)

        const tangent = vec2.rotate90ccw(ray.direction, AVLTree.temp1)
        const absTangent = vec2.fromValues(
            Math.abs(tangent[0]), Math.abs(tangent[1]), AVLTree.temp2
        )

        const { stack } = this
        stack.push(this.root)
        while(stack.length){
            let node = stack.pop()
            if(!node || !AABB.overlap(aabb, node.aabb)) continue
            
            let difference = vec2.fromValues(
                0.5 * (node.aabb[0] + node.aabb[2]),
                0.5 * (node.aabb[1] + node.aabb[3]),
                AVLTree.temp3
            )
            vec2.subtract(ray.origin, difference, difference)
            let separation = Math.abs(vec2.dot(tangent, difference))
            let extents = vec2.fromValues(
                0.5 * (node.aabb[2] - node.aabb[0]),
                0.5 * (node.aabb[3] - node.aabb[1]),
                AVLTree.temp3
            )
            separation -= vec2.dot(absTangent, extents)
            if(separation > 0) continue

            if(node.leaf){
                let fraction = consumer(node.delegate)
                if((fraction as any) == false) return
                if(!fraction) continue
                vec2.lerp(ray.origin, ray.target, fraction, target)
                aabb[0] = Math.min(ray.origin[0], target[0])
                aabb[1] = Math.min(ray.origin[1], target[1])
                aabb[2] = Math.max(ray.origin[0], target[0])
                aabb[3] = Math.max(ray.origin[1], target[1])
            }else stack.push(node.child1, node.child2)
        }
    }
}