import { vec2 } from 'math/vec2'
import { BodyType, SleepState } from './constants'
import { Broadphase } from './collision/broadphase/Broadphase'
import { Narrowphase } from './collision/narrowphase/Narrowphase'
import { Raycaster, RaycastOptions } from './collision/raycaster/Raycaster'
import { RigidBody } from './dynamics/RigidBody'
import { Constraint } from './dynamics/constraints/Constraint'
import { ForceGenerator } from './dynamics/forces/ForceGenerator'
import { ISolver } from './dynamics/solver/GaussSeidelSolver'
import { Equation } from './dynamics/equations/Equation'
import { MaterialCollection } from './dynamics/ContactMaterial'
import { Sleep } from './dynamics/Sleep'
import { EquationFactory } from './dynamics/solver/EquationFactory'
import { IndexedDataArray } from './helpers/IndexedDataArray'

import { lerp } from 'math/utilities'
import { Transform2D } from 'scene/Transform2D'
import { ProcedureSystem, EntityManager, IUpdateContext, DataView } from 'framework'

export interface PhysicsSystemOptions {
    broadphase: Broadphase,
    narrowphase: Narrowphase,
    solver: ISolver,
    raycaster: Raycaster,
    materials: MaterialCollection,
    maxSteps?: number
    fixedDeltaTime?: number
}

export class PhysicsSystem extends ProcedureSystem {
    public readonly broadphase: Broadphase
    public readonly narrowphase: Narrowphase
    private readonly solver: ISolver
    public readonly raycaster: Raycaster
    public readonly materials: MaterialCollection
    private readonly ccd: { integrateToImpact(body: RigidBody, deltaTime: number): boolean }

    private readonly sleepManager: Sleep = new Sleep
    private readonly equationFactory: EquationFactory = new EquationFactory
    private readonly generateContacts: () => void
    
    private timeRemaining: number = 0
    private readonly maxSteps: number = 4
    private readonly fixedDeltaTime: number = 1 / 60

    private readonly constraints: Constraint[] = []
    public readonly forces: ForceGenerator[] = []
    private readonly bodies: DataView<RigidBody>

    constructor(manager: EntityManager, options: PhysicsSystemOptions){
        super(manager)
        Object.assign(this, options)
        this.bodies = manager.aquireDataView<RigidBody>(RigidBody)
        const { insertEvent, removeEvent } = this.bodies.data as IndexedDataArray<RigidBody>
        insertEvent.subscribe(this.broadphase.insert.bind(this.broadphase))
        removeEvent.subscribe(this.broadphase.remove.bind(this.broadphase))
        removeEvent.subscribe(body => {
            this.equationFactory.collisions.clear(body.identifier)
            //cleanup constraints and forces?
        })
        this.generateContacts = [
            next => () => this.broadphase.queryCollisionPairs(next),
            next => (bodyA, bodyB) => void this.narrowphase.detectCollision(bodyA, bodyB, false, next),
            next => manifold => this.equationFactory.processContactManifold(manifold, this.materials)
        ].reverse().reduce((next, callback) => callback(next), null) as any
    }
    execute(context: IUpdateContext): void {
        const bodies: RigidBody[] = (this.bodies.data as IndexedDataArray<RigidBody>).internal
        const factor = this.update(bodies, context.deltaTime, context.frame)
        for(let body: RigidBody, i = 0; body = bodies[i]; i++){
            let transform: Transform2D = this.manager.aquireComponent(body.entity, Transform2D) as any
            if(!transform) continue
            if(transform.lastFrame == -1 || body.lastFrame == -1){
                vec2.copy(transform.localPosition, body.position)
                vec2.copy(transform.localPosition, body.previousPosition)
                body.angle = body.previousAngle = transform.localRotation
                body.lastFrame = context.frame
                body.dirtyFlag = true
            }else if(transform.lastFrame < body.lastFrame){
                vec2.lerp(body.previousPosition, body.position, factor, transform.localPosition)
                transform.localRotation = lerp(body.previousAngle, body.angle, factor)
                transform.lastFrame = -1
            }
        }
    }
    private update(bodies: RigidBody[], deltaTime: number, frame: number): number {
        const { maxSteps, fixedDeltaTime } = this
        this.timeRemaining += deltaTime
        for(
            let step = 0;
            this.timeRemaining >= fixedDeltaTime && step < maxSteps;
            step++, this.timeRemaining -= fixedDeltaTime
        ) this.step(bodies, fixedDeltaTime, frame)

        return (this.timeRemaining % fixedDeltaTime) / fixedDeltaTime
    }
    private step(bodies: RigidBody[], deltaTime: number, frame: number): void {
        applyForces: for(let i = this.forces.length - 1; i >= 0; i--)
            this.forces[i].apply(bodies, deltaTime)

        applyDamping: for(let i = bodies.length - 1; i >= 0; i--){
            let body: RigidBody = bodies[i]
            if(body.type !== BodyType.DYNAMIC || body.sleepState === SleepState.ASLEEP) continue
            vec2.scale(body.velocity, Math.pow(1 - body.linearDamping, deltaTime), body.velocity)
            body.angularVelocity *= Math.pow(1 - body.angularDamping, deltaTime)
        }

        this.equationFactory.clear()
        this.broadphase.update()
        this.generateContacts()

        this.equationFactory.loadEquations(this.equationFactory.contactEquations)
        for(let i = this.equationFactory.equations.length - 1; i >= 0; i--){
            let equation: Equation = this.equationFactory.equations[i]
            this.sleepManager.handleContact(equation.bodyA, equation.bodyB)
        }
        this.equationFactory.loadEquations(this.equationFactory.frictionEquations)
        for(let i = this.constraints.length - 1; i >= 0; i--){
            const constraint: Constraint = this.constraints[i]
            //sleep check bodies?
            //if(constraint.bodyA.sleepState === SleepState.ASLEEP && constraint.bodyB.sleepState === SleepState.ASLEEP)
            //continue
            
            constraint.update()
            this.equationFactory.loadEquations(constraint.equations)
        }
        this.solver.solve(this.equationFactory.equations, bodies, deltaTime)

        integrate: for(let i = bodies.length - 1; i >= 0; i--){
            let body: RigidBody = bodies[i]
            if(body.type !== BodyType.STATIC && body.sleepState !== SleepState.ASLEEP){
                this.integrate(body, deltaTime)
                if(body.lastFrame !== -1) body.lastFrame = frame
            }

            vec2.copy(vec2.ZERO, body.force)
            body.angularForce = 0
        }

        this.sleepManager.update(bodies, deltaTime)
    }
    private integrate(body: RigidBody, deltaTime: number){
        vec2.copy(body.position, body.previousPosition)
        body.previousAngle = body.angle

        body.angularVelocity += body.angularForce * body.invInertia * deltaTime
        body.velocity[0] += body.force[0] * body.invMass[0] * deltaTime
        body.velocity[1] += body.force[1] * body.invMass[1] * deltaTime

        if(this.ccd && this.ccd.integrateToImpact(body, deltaTime)) return
        
        body.angle += body.angularVelocity * deltaTime
        body.position[0] += body.velocity[0] * deltaTime
        body.position[1] += body.velocity[1] * deltaTime

        body.dirtyFlag = true
    }
    public raycast(options: RaycastOptions){
        const { broadphase, raycaster } = this
        const raycasterProxy = Object.create(raycaster) as Raycaster
        Object.assign(raycasterProxy, options)
        const raycastBody = raycaster.raycast.bind(raycasterProxy)
        return function(origin: vec2, target: vec2): Raycaster {
            raycasterProxy.reset()
            raycasterProxy.ray.set(origin, target)
            broadphase.raycast(raycasterProxy.ray, raycastBody)
            return raycasterProxy
        }
    }
}