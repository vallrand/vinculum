import { vec2 } from 'math/vec2'
import { AABB } from 'math/AABB'
import { BodyType, SleepState } from '../constants'
import { Shape } from '../shapes/Shape'
import { IndexedDataArray } from '../helpers/IndexedDataArray'
import { ReusableComponent, IDataArray } from 'framework'

interface RigidBodyOptions {
    type: BodyType
    mass: number
    shapes: Shape[]
}

export class RigidBody extends ReusableComponent<RigidBodyOptions> {
    static allocate = (): IDataArray<RigidBody> => new IndexedDataArray()
    private static readonly temp: vec2 = vec2()
    private static readonly tempAABB: AABB = AABB()

    setup(options: RigidBodyOptions){
        this.type = options.type || BodyType.STATIC
        this.mass = options.mass || 0
        for(let i = 0; i < options.shapes.length; i++)
            this.shapes.push(options.shapes[i].recalculateStaticProperties())
        this.recalculateStaticProperties()
    }
    reset(){
        this.shapes.length = 0
    }

    lastFrame: number = -1
    identifier: number = -1
    index: number = -1
    islandIndex: number = -1
    readonly shapes: Shape[] = []

    mass: number = 0
    inertia: number = 0
    invInertia: number = 0
    readonly invMass: vec2 = vec2()
    readonly position: vec2 = vec2()
    angle: number = 0
    readonly velocity: vec2 = vec2()
    angularVelocity: number = 0
    readonly previousPosition: vec2 = vec2()
    previousAngle: number = 0
    readonly vlambda: vec2 = vec2()
    wlambda: number = 0
    readonly force: vec2 = vec2()
    angularForce: number = 0

    linearDamping: number = 0.1
    angularDamping: number = 0.1

    type: BodyType = this.mass ? BodyType.DYNAMIC : BodyType.STATIC
    boundingRadius: number = 0

    allowSleep: boolean = true
    sleepState: SleepState = SleepState.AWAKE
    idleTime: number = 0

    fixedRotation: boolean = false
    fixedX: boolean = false
    fixedY: boolean = false
    collisionResponse: boolean = true

    private cachedAABB: AABB = AABB()
    dirtyFlag = true
    public get aabb(): AABB {
        if(!this.dirtyFlag) return this.cachedAABB
        this.dirtyFlag = false
        return this.computeAABB(this.cachedAABB)
    }
    computeAABB(out: AABB): AABB {
        for(let length = this.shapes.length, i = 0; i < length; i++){
            let shape = this.shapes[i]
            let angle = this.angle + shape.angle
            let position = vec2.rotate(shape.position, this.angle, RigidBody.temp)
            vec2.add(this.position, position, position)
            const shapeAABB = shape.computeAABB(position, angle, RigidBody.tempAABB)
            if(!i) AABB.copy(shapeAABB, out)
            else AABB.merge(shapeAABB, out, out)
        }
        return out
    }
    computeBoundingRadius(): number {
        let maxDistanceSquared = 0
        for(let i = this.shapes.length - 1; i >= 0; i--){
            let shape = this.shapes[i]
            let distanceSquared = vec2.magnitudeSquared(shape.position) + Math.pow(shape.boundingRadius, 2)
            if(distanceSquared > maxDistanceSquared) maxDistanceSquared = distanceSquared
        }
        return Math.sqrt(maxDistanceSquared)
    }
    recalculateStaticProperties(){
        this.boundingRadius = this.computeBoundingRadius()
        this.updateMass()
        this.updateInvMass()
        this.dirtyFlag = true
        this.lastFrame = -1
    }
    updateInvMass(): void {
        if(this.type !== BodyType.DYNAMIC || this.sleepState === SleepState.ASLEEP){
            this.invMass[0] = 0
            this.invMass[1] = 0
            this.invInertia = 0
        }else{
            const invMass = 1 / this.mass
            this.invMass[0] = this.fixedX ? 0 : invMass
            this.invMass[1] = this.fixedY ? 0 : invMass
            this.invInertia = this.fixedRotation ? 0 : Math.max(0, 1 / this.inertia)
        }
    }
    updateMass(): void {
        if(this.type !== BodyType.DYNAMIC){
            this.mass = this.inertia = Infinity
            return
        }
        this.inertia = 0
        for(let i = this.shapes.length - 1; i >= 0; i--){
            let shape = this.shapes[i]
            let offset = vec2.magnitudeSquared(shape.position)
            this.inertia += offset + shape.inertia
        }
    }
    get density(): number {
        return this.mass / this.area
    }
    get area(): number {
        let totalArea = 0
        for(let i = this.shapes.length - 1; i >= 0; i--)
            totalArea += this.shapes[i].area
        return totalArea
    }
}