import { vec2 } from 'math/vec2'
import { RigidBody } from '../RigidBody'
import { ForceGenerator } from './ForceGenerator'

export class LinearSpring extends ForceGenerator {
    private static readonly difference: vec2 = vec2()
    private static readonly direction: vec2 = vec2()
    private static readonly temp: vec2 = vec2()
    private static readonly relativeVelocity: vec2 = vec2()
    private static readonly force: vec2 = vec2()
    private stiffness: number = 100
    private damping: number = 1
    private restingLength: number = 0
    private readonly localAnchorA: vec2 = vec2()
    private readonly localAnchorB: vec2 = vec2()
    private readonly worldAnchorA: vec2 = vec2()
    private readonly worldAnchorB: vec2 = vec2()
    private readonly orientedAnchorA: vec2 = vec2()
    private readonly orientedAnchorB: vec2 = vec2()
    constructor(private readonly bodyA: RigidBody, private readonly bodyB: RigidBody){
        super()
        this.computeWorldAnchors()
        this.restingLength = vec2.distance(this.worldAnchorA, this.worldAnchorB)
    }
    private computeWorldAnchors(){
        vec2.rotate(this.localAnchorA, this.bodyA.angle, this.orientedAnchorA)
        vec2.rotate(this.localAnchorB, this.bodyB.angle, this.orientedAnchorB)
        vec2.add(this.orientedAnchorA, this.bodyA.position, this.worldAnchorA)
        vec2.add(this.orientedAnchorB, this.bodyB.position, this.worldAnchorB)
    }
    public apply(): void {
        const { difference, direction, relativeVelocity, force, temp } = LinearSpring
        const k = this.stiffness, d = this.damping, l = this.restingLength
        this.computeWorldAnchors()
        vec2.subtract(this.worldAnchorB, this.worldAnchorA, difference)
        const lenght = vec2.magnitude(difference)
        vec2.normalize(difference, direction)

        vec2.subtract(this.bodyB.velocity, this.bodyA.velocity, relativeVelocity)
        vec2.rotate(this.orientedAnchorB, 0.5*Math.PI, temp)
        vec2.scale(temp, this.bodyB.angularVelocity, temp)
        vec2.add(relativeVelocity, temp, relativeVelocity)
        vec2.rotate(this.orientedAnchorA, 0.5*Math.PI, temp)
        vec2.scale(temp, this.bodyA.angularVelocity, temp)
        vec2.subtract(relativeVelocity, temp, relativeVelocity)

        vec2.scale(direction, -k*(length-l) - d*vec2.dot(relativeVelocity, direction), force)

        vec2.subtract(this.bodyA.force, force, this.bodyA.force)
        vec2.add(this.bodyB.force, force, this.bodyB.force)
        this.bodyA.angularForce -= vec2.cross(this.orientedAnchorA, force)
        this.bodyB.angularForce += vec2.cross(this.orientedAnchorB, force)
    }
}