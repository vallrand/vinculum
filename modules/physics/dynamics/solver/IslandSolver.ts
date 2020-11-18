import { DisjointSet } from 'common/DisjointSet'
import { BodyType } from '../../constants'
import { RigidBody } from '../RigidBody'
import { Equation } from '../equations/Equation'
import { ISolver } from './GaussSeidelSolver'

const islandIndexSort = (a: Equation, b: Equation): number => (
    (a.bodyA.islandIndex || a.bodyB.islandIndex) - (b.bodyA.islandIndex || b.bodyB.islandIndex) ||
    a.index - b.index
)

export class IslandSolver extends DisjointSet implements ISolver {
    private readonly tempEquations: Equation[] = []
    constructor(private readonly solver: ISolver){super()}
    public solve(equations: Equation[], bodies: RigidBody[], deltaTime: number): void {
        this.allocate(bodies.length)
        for(let i = equations.length - 1; i >= 0; i--){
            const { bodyA, bodyB } = equations[i]
            equations[i].index = i
            if(bodyA.type !== BodyType.DYNAMIC || bodyB.type !== BodyType.DYNAMIC)
                continue
            this.join(bodyA.index, bodyB.index)
        }
        for(let i = bodies.length - 1; i >= 0; i--){
            let body = bodies[i]
            body.islandIndex = body.type === BodyType.DYNAMIC ? 1 + this.find(body.index) : 0
        }
        equations.sort(islandIndexSort)
        this.tempEquations.length = 0
        for(let length = equations.length, i = 0; i < length; i++){
            let equation = equations[i], next = equations[i+1]
            let island = equation.bodyA.islandIndex || equation.bodyB.islandIndex
            this.tempEquations.push(equation)
            if(next && island === (next.bodyA.islandIndex || next.bodyB.islandIndex))
                continue
            this.solver.solve(this.tempEquations, bodies, deltaTime)
            this.tempEquations.length = 0
        }
    }
}