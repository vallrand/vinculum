import { vec2 } from 'math/vec2'
import { ObjectPool } from 'common/ObjectPool'
import { BodyType } from '../../constants'
import { RigidBody } from '../RigidBody'
import { Shape } from '../../shapes/Shape'
import { ContactMaterial, MaterialCollection } from '../ContactMaterial'
import { ContactManifold } from '../../collision/narrowphase/ContactManifold'
import { Int16TupleMap } from '../../helpers/Int16TupleMap'
import { ContactEquation } from '../equations/ContactEquation'
import { FrictionEquation } from '../equations/FrictionEquation'
import { Equation } from '../equations/Equation'

type Mutable<T> = { -readonly [P in keyof T]-?: T[P] }

export class EquationFactory {
    private readonly contactEquationPool: ObjectPool<ContactEquation> = 
    new ObjectPool<ContactEquation>(i => new ContactEquation(null, null))
    private readonly frictionEquationPool: ObjectPool<FrictionEquation> =
    new ObjectPool<FrictionEquation>(i => new FrictionEquation(null, null))
    readonly collisions: Int16TupleMap<boolean> = new Int16TupleMap
    readonly contactEquations: ContactEquation[] = []
    readonly frictionEquations: FrictionEquation[] = []
    private frictionApproximation: boolean = true

    readonly equations: Equation[] = []

    loadEquations(equations: Equation[]): void {
        for(let length = equations.length, i = 0; i < length; i++){
            let equation = equations[i]
            if(!equation.enabled) continue
            this.equations.push(equation)
        }
    }

    processContactManifold(manifold: ContactManifold, materials: MaterialCollection): void {
        const {
            bodyA, shapeA, bodyB, shapeB,
            contacts, normalA, contactPointA, contactPointB
        } = manifold
        const contactMaterial = materials.findContactMaterial(shapeA.material, shapeB.material)
        for(let i = 0; i < contacts; i++){
            const contactEquation: ContactEquation = this.createContactEquation(
                bodyA, shapeA, bodyB, shapeB, contactMaterial
            )
            vec2.copy(normalA[i], contactEquation.normalA)
            vec2.copy(contactPointA[i], contactEquation.contactPointA)
            vec2.copy(contactPointB[i], contactEquation.contactPointB)
            this.contactEquations.push(contactEquation)
        }

        if(this.frictionApproximation)
            this.frictionEquations.push(
                this.createFrictionEquation(0, contacts, 1, contactMaterial))
        else for(let offset = 0; offset < contacts; offset++)
            this.frictionEquations.push(
                this.createFrictionEquation(offset, 1, contacts, contactMaterial))
    }
    clear(): void {
        this.collisions.clear()
        for(let i = this.frictionEquations.length - 1; i >= 0; i--)
            this.frictionEquationPool.recycle(this.frictionEquations[i])
        for(let i = this.contactEquations.length - 1; i >= 0; i--){
            const equation = this.contactEquations[i]
            if(equation.enabled)
                this.collisions.set(equation.bodyA.identifier, equation.bodyB.identifier, true)
            this.contactEquationPool.recycle(equation)
        }
        this.frictionEquations.length = 0
        this.contactEquations.length = 0
        this.equations.length = 0
    }

    private createContactEquation(
        bodyA: RigidBody, shapeA: Shape, bodyB: RigidBody, shapeB: Shape,
        contactMaterial: ContactMaterial
    ): ContactEquation {
        const equation: Mutable<ContactEquation> = this.contactEquationPool.aquire()
        equation.bodyA = bodyA
        equation.bodyB = bodyB
        equation.shapeA = shapeA
        equation.shapeB = shapeB
        equation.enabled = bodyA.collisionResponse && bodyB.collisionResponse &&
        shapeA.collisionResponse && shapeB.collisionResponse
        equation.firstImpact = !this.collisions.get(bodyA.identifier, bodyB.identifier)
        equation.restitution = contactMaterial.restitution
        equation.stiffness = contactMaterial.stiffness
        equation.relaxation = contactMaterial.relaxation
        equation.offset = contactMaterial.contactSkinSize
        equation.dirtyFlag = true
        return equation
    }

    private createFrictionEquation(
        offset: number, contactCount: number, frictionCount: number, contactMaterial: ContactMaterial
    ): FrictionEquation {
        let contactIndex: number = this.contactEquations.length - 1 - offset
        let contactEquation: ContactEquation = this.contactEquations[contactIndex]
        const { bodyA, bodyB, shapeA, shapeB } = contactEquation

        const equation: Mutable<FrictionEquation> = this.frictionEquationPool.aquire()
        equation.bodyA = bodyA
        equation.bodyB = bodyB
        equation.enabled = bodyA.collisionResponse && bodyB.collisionResponse &&
        shapeA.collisionResponse && shapeB.collisionResponse
        equation.frictionCoefficient = contactMaterial.friction
        equation.relativeVelocity = contactMaterial.surfaceVelocity
        equation.stiffness = contactMaterial.frictionStiffness
        equation.relaxation = contactMaterial.frictionRelaxation
        equation.dirtyFlag = true

        const reducedMass = bodyA.type === BodyType.DYNAMIC && bodyB.type === BodyType.DYNAMIC ? 
        (bodyA.mass * bodyB.mass) / (bodyA.mass + bodyB.mass) : Math.min(bodyA.mass, bodyB.mass)
        equation.slipForce = contactMaterial.friction * reducedMass * contactMaterial.frictionGravity / frictionCount

        const { contactPointA, contactPointB, tangent } = equation
        equation.contactEquations.length = 0
        equation.contactEquations.push(contactEquation)
        vec2.copy(contactEquation.normalA, tangent)
        vec2.copy(contactEquation.contactPointA, contactPointA)
        vec2.copy(contactEquation.contactPointB, contactPointB)
        if(contactCount == 1) return (vec2.rotate90cw(tangent, tangent), equation)
        for(let i = 1; i < contactCount; i++){
            contactEquation = this.contactEquations[--contactIndex]
            equation.contactEquations.push(contactEquation)
            vec2.add(contactEquation.normalA, tangent, tangent)
            vec2.add(contactEquation.contactPointA, contactPointA, contactPointA)
            vec2.add(contactEquation.contactPointB, contactPointB, contactPointB)
        }
        vec2.normalize(tangent, tangent)
        vec2.rotate90cw(tangent, tangent)
        vec2.scale(contactPointA, 1 / contactCount, contactPointA)
        vec2.scale(contactPointB, 1 / contactCount, contactPointB)
        return equation
    }
}