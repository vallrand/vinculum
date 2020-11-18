import { vec2 } from 'math/vec2'
import { RigidBody } from '../../dynamics/RigidBody'
import { Shape } from '../../shapes/Shape'
import { ContactManifold } from './ContactManifold'

export type ICollisionDetector = (
    this: Narrowphase,
    bodyA: RigidBody, shapeA: Shape, positionA: vec2, angleA: number,
    bodyB: RigidBody, shapeB: Shape, positionB: vec2, angleB: number,
    bailEarly: boolean
) => number

export class Narrowphase {
    private readonly worldPositionA: vec2 = vec2()
    private readonly worldPositionB: vec2 = vec2()
    constructor(private readonly detectors: Record<number, ICollisionDetector>){}

    protected readonly normalA: vec2 = vec2()
    protected readonly contactPointA: vec2 = vec2()
    protected readonly contactPointB: vec2 = vec2()

    private contactManifold: ContactManifold = new ContactManifold

    protected registerContactManifold(
        bodyA: RigidBody, shapeA: Shape,
        bodyB: RigidBody, shapeB: Shape
    ): void {
        this.contactManifold.registerContact(
            bodyA, shapeA, bodyB, shapeB,
            this.normalA, this.contactPointA, this.contactPointB
        )
    }

    public detectCollision(
        bodyA: RigidBody, bodyB: RigidBody, bailEarly: boolean = false,
        consumer: (manifold: ContactManifold) => boolean
    ): number {
        const { worldPositionA, worldPositionB } = this

        let totalContacts = 0
        for(let i = 0; i < bodyA.shapes.length; i++)
        for(let shapeA = bodyA.shapes[i], j = 0; j < bodyB.shapes.length; j++){
            let shapeB = bodyB.shapes[j]
            
            if(!(shapeA.collisionGroup & shapeB.collisionMask &&
                shapeB.collisionGroup & shapeA.collisionMask)) continue
            vec2.rotate(shapeA.position, bodyA.angle, worldPositionA)
            vec2.add(worldPositionA, bodyA.position, worldPositionA)
            vec2.rotate(shapeB.position, bodyB.angle, worldPositionB)
            vec2.add(worldPositionB, bodyB.position, worldPositionB)
            
            if(vec2.distanceSquared(worldPositionA, worldPositionB) >
            Math.pow(shapeA.boundingRadius + shapeB.boundingRadius, 2)) continue

            const worldRotationA = shapeA.angle + bodyA.angle
            const worldRotationB = shapeB.angle + bodyB.angle

            const sensor = shapeA.sensor || shapeB.sensor
            const detector = this.detectors[shapeA.type | shapeB.type]
            if(!detector) continue

            this.contactManifold.contacts = 0
            const hitCount = shapeA.type > shapeB.type
            ? detector.call(this,
                bodyB, shapeB, worldPositionB, worldRotationB,
                bodyA, shapeA, worldPositionA, worldRotationA, bailEarly || sensor
            ) : detector.call(this,
                bodyA, shapeA, worldPositionA, worldRotationA,
                bodyB, shapeB, worldPositionB, worldRotationB, bailEarly || sensor
            )
            if(hitCount && bailEarly) return 1
            totalContacts += hitCount
            if(!hitCount || sensor) continue
            if(consumer && consumer(this.contactManifold) == false) return totalContacts
        }
        return totalContacts
    }
}