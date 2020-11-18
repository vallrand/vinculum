import { vec2 } from 'math/vec2'
import { BodyType, SleepState } from '../constants'
import { RigidBody } from '../dynamics/RigidBody'

export const testSleepState = (bodyA: RigidBody, bodyB: RigidBody): boolean => {
    if(bodyA.sleepState === SleepState.ASLEEP && bodyB.sleepState === SleepState.ASLEEP) return false
    if((bodyA.sleepState === SleepState.ASLEEP && bodyB.type === BodyType.STATIC) ||
    (bodyB.sleepState === SleepState.ASLEEP && bodyA.type === BodyType.STATIC)) return false
    return true
}

export class Sleep {
    private speedThreshold: number = 0.2
    private idleTimeThreshold: number = 1
    private islandSplit: boolean = false
    private frame: number = 0
    private readonly islandLastFrame: number[] = []

    public handleContact(bodyA: RigidBody, bodyB: RigidBody): void {
        this.updateAfterCollision(bodyA, bodyB)
        this.updateAfterCollision(bodyB, bodyA)
    }
    private updateAfterCollision(bodyA: RigidBody, bodyB: RigidBody): void {
        if(
            !bodyA.allowSleep ||
            bodyA.type !== BodyType.DYNAMIC ||
            bodyA.sleepState !== SleepState.ASLEEP ||

            bodyB.sleepState !== SleepState.AWAKE ||
            bodyB.type === BodyType.STATIC
        ) return

        const speedSquared = vec2.magnitudeSquared(bodyB.velocity) + Math.pow(bodyB.angularVelocity, 2)
        if(speedSquared < 2 * this.speedThreshold * this.speedThreshold) return
        bodyA.sleepState = SleepState.AWAKE
        bodyA.idleTime = 0
    }
    public update(bodies: RigidBody[], deltaTime: number): void {
        this.frame++
        for(let i = bodies.length - 1; i >= 0; i--){
            let body = bodies[i]
            if(!body.allowSleep || body.sleepState === SleepState.ASLEEP) continue

            const speedSquared = vec2.magnitudeSquared(body.velocity) + Math.pow(body.angularVelocity, 2)
            if(speedSquared >= this.speedThreshold * this.speedThreshold){
                body.sleepState = SleepState.AWAKE
                body.idleTime = 0
                if(this.islandSplit && body.islandIndex) this.islandLastFrame[body.islandIndex] = this.frame
                continue
            }

            body.idleTime += deltaTime
            body.sleepState = SleepState.SLEEPY

            if(this.islandSplit && body.islandIndex){
                if(body.idleTime <= this.idleTimeThreshold) this.islandLastFrame[body.islandIndex] = this.frame
            }else if(body.idleTime > this.idleTimeThreshold) this.fallAsleep(body)
        }
        if(this.islandSplit) for(let i = bodies.length - 1; i >= 0; i--){
            let body = bodies[i]
            if(body.islandIndex && this.islandLastFrame[body.islandIndex] < this.frame)
                this.fallAsleep(body)
        }
    }
    public fallAsleep(body: RigidBody): void {
        body.sleepState = SleepState.ASLEEP
        body.angularVelocity = 0
        body.angularForce = 0
        vec2.copy(vec2.ZERO, body.velocity)
        vec2.copy(vec2.ZERO, body.force)
        body.updateInvMass()
    }
    public wakeUp(body: RigidBody): void {
        body.sleepState = SleepState.AWAKE
        body.idleTime = 0
        body.updateInvMass()
    }
}