import { vec2 } from 'math/vec2'
import { clamp } from 'math/utilities'
import { ReusableComponent, IUpdateContext, EntityManager } from 'framework'
import { RigidBody, Shape, ShapeType, PhysicsSystem, Raycaster } from 'physics'

interface RaycastControllerOptions {
    collisionMask: number
    padding: number
    threshold: number
    offset: vec2
    maxAscendAngle: number
    maxDescendAngle: number
    gravity: number
    passGroup?: boolean
}

export abstract class RaycastController extends ReusableComponent<RaycastControllerOptions> {
    static readonly delegate = RaycastController
    private static readonly epsilon: number = 1e-4
    private static readonly origin: vec2 = vec2()
    private static readonly target: vec2 = vec2()
    private static readonly AXIS_Y: vec2 = vec2(0, -1)

    public readonly flags: {
        left: Shape, right: Shape, below: Shape,
        pass: Shape, ground: RigidBody
    } = {
        left: null, right: null, below: null,
        pass: null, ground: null
    }
    protected slopeAngle: number = 0
    private prevSlopeAngle: number = 0
    public readonly direction: vec2 = vec2(1, -1)

    public readonly input: vec2 = vec2()
    private readonly offset: vec2 = vec2()
    private readonly center: vec2 = vec2()
    public readonly velocity: vec2 = vec2()
    private readonly prevVelocity: vec2 = vec2()
    private readonly tempVelocity: vec2 = vec2()

    private threshold: number = 0.1
    public padding: number = 1e-3
    protected maxAscendAngle = 0.5 * Math.PI
    protected maxDescendAngle = 0.5 * Math.PI
    protected gravity: number = 0
    private passGroup: boolean = false

    private raycast: (origin: vec2, target: vec2) => Raycaster
    setup(options: RaycastControllerOptions, manager: EntityManager){
        this.raycast = manager.resolveSystem(PhysicsSystem).raycast({
            skipBackFaces: true,
            skipNonColliders: true,
            bailEarly: false,
            collisionGroup: -1,
            collisionMask: options.collisionMask
        })

        this.padding = options.padding
        this.threshold = options.threshold
        this.maxAscendAngle = options.maxAscendAngle
        this.maxDescendAngle = options.maxDescendAngle
        this.gravity = options.gravity
        this.passGroup = options.passGroup
        vec2.copy(options.offset || vec2.ZERO, this.offset)
        vec2.copy(vec2.ZERO, this.input)
    }
    update(context: IUpdateContext, manager: EntityManager){
        const body = manager.aquireComponent(this.entity, RigidBody) as RigidBody
        if(!body) return
        //const physicsSystem = manager.resolveSystem(PhysicsSystem)
        //TODO aquire gravity force?

        this.processInput(this.input, context.deltaTime)
        if(Math.abs(this.velocity[0]) < RaycastController.epsilon) this.velocity[0] = 0
        this.velocity[1] += context.deltaTime * this.gravity

        vec2.scale(this.velocity, context.deltaTime, this.prevVelocity)

        const iterations = clamp(Math.ceil(Math.abs(this.prevVelocity[0]) / this.threshold), 1, 8)
        for(let i = iterations; i > 0; i--){
            const velocity = vec2.scale(this.prevVelocity, 1 / iterations, this.tempVelocity)
            const grounded: boolean = !!this.flags.below
            this.flags.below = this.flags.left = this.flags.right = this.flags.ground = null
            this.prevSlopeAngle = this.slopeAngle
            this.slopeAngle = 0

            vec2.add(this.offset, body.position, this.center)
            this.resolveCollisions(velocity, grounded)

            vec2.add(body.position, velocity, body.position)
            vec2.copy(body.position, body.previousPosition)
        }

        body.dirtyFlag = true
        body.lastFrame = context.frame
        const ground: Shape = this.flags.below
        if(ground) this.velocity[1] = 0
        vec2.copy(ground ? this.flags.ground.velocity : vec2.ZERO, body.velocity)
    }
    reset(){ this.raycast = null }
    abstract processInput(input: vec2, deltaTime: number): void
    resolveCollisions(velocity: vec2, grounded: boolean){
        if(grounded && Math.sin(this.prevSlopeAngle) * velocity[0] > 0){
            velocity[1] += Math.sin(this.prevSlopeAngle) * velocity[0]
            velocity[0] = Math.cos(this.prevSlopeAngle) * velocity[0]
        }

        let directionX = Math.sign(velocity[0]) || this.direction[0]
        let directionY = Math.sign(velocity[1]) || this.direction[1]
        vec2.fromValues(directionX, directionY, this.direction)

        const { origin, target, AXIS_Y } = RaycastController

        horizontal: {
            origin[0] = this.center[0] - directionX * this.padding
            origin[1] = this.center[1]
            target[0] = origin[0] + velocity[0] + 2 * directionX * this.padding
            target[1] = origin[1]
            let raycast = this.raycast(origin, target)
            if(!raycast.body) break horizontal
            const distance = raycast.computeHitDistance()
            const slopeAngle = vec2.angle(raycast.normal, AXIS_Y) * Math.sign(raycast.normal[0])

            if(Math.abs(slopeAngle) <= this.maxAscendAngle){
                let distanceToSlopeStart = 0
                if(slopeAngle != this.prevSlopeAngle){
                    distanceToSlopeStart = distance - 2 * this.padding
                    velocity[0] -= distanceToSlopeStart * directionX
                }
                ascend: {
                    const velocityY = Math.sin(slopeAngle) * velocity[0]
                    if(velocity[1] < velocityY || velocityY > 0) break ascend
                    velocity[1] = velocityY
                    velocity[0] = Math.cos(slopeAngle) * velocity[0]
                    this.flags.below = raycast.shape
                    this.flags.ground = raycast.body
                    this.slopeAngle = slopeAngle
                }
                velocity[0] += distanceToSlopeStart * directionX

                climb: {
                    target[0] = origin[0] + velocity[0] + 2 * directionX * this.padding
                    origin[1] = target[1] = this.center[1] + velocity[1]
                    raycast = this.raycast(origin, target)
                    if(!raycast.body) break climb
                    if(Math.abs(Math.abs(slopeAngle) - vec2.angle(raycast.normal, AXIS_Y)) < 1e-3) break climb
                    const distance = raycast.computeHitDistance()
                    if(Math.abs(velocity[0]) > Math.abs(distance - 2 * this.padding))
                    velocity[0] = (distance - 2 * this.padding) * directionX
                }
            }else{
                velocity[0] = (distance - 2 * this.padding) * directionX

                if(directionX == -1) this.flags.left = raycast.shape
                else this.flags.right = raycast.shape
            }
        }

        backward: {
            origin[0] = this.center[0] + velocity[0] + directionX * this.padding
            origin[1] = this.center[1]
            target[0] = origin[0] - 2 * directionX * this.padding
            target[1] = origin[1]
            let raycast = this.raycast(origin, target)
            if(!raycast.body) break backward
            const distance = raycast.computeHitDistance()
            velocity[0] += (2 * this.padding - distance) * directionX

            if(directionX != -1) this.flags.left = raycast.shape
            else this.flags.right = raycast.shape
        }

        if(this.flags.pass) this.flags.pass.collisionResponse = true
        vertical: {
            if(Math.abs(this.prevSlopeAngle) > this.maxDescendAngle)
                directionX = -Math.sign(this.prevSlopeAngle)

            origin[0] = this.center[0] + velocity[0]// - directionX * this.padding
            origin[1] = this.center[1] - this.padding
            target[0] = origin[0]
            target[1] = origin[1] + 1e6
            let raycast = this.raycast(origin, target)
            if(!raycast.body) break vertical
            let distance = raycast.computeHitDistance()
            let slopeAngle = vec2.angle(raycast.normal, AXIS_Y) * Math.sign(raycast.normal[0])

            const distanceToGround = (distance - 2 * this.padding)
            if(velocity[1] > distanceToGround){
                if(directionY < 0) break vertical
                this.slopeAngle = slopeAngle
                velocity[1] = (distance - 2 * this.padding)
                if(Math.abs(slopeAngle) > this.maxDescendAngle) break vertical
                this.flags.below = raycast.shape
                this.flags.ground = raycast.body
            }else if(grounded && distanceToGround - velocity[1] < this.threshold){
                if(this.flags.ground && velocity[1] < 0) break vertical
                if(Math.abs(slopeAngle) > this.maxDescendAngle) break vertical
                this.slopeAngle = slopeAngle
                velocity[1] = (distance - 2 * this.padding)
                this.flags.below = raycast.shape
                this.flags.ground = raycast.body
            }
        }

        passthrough: {
            if(this.flags.pass && this.flags.below === this.flags.pass){
                this.flags.pass.collisionResponse = false
            }else if(this.flags.below && this.input[1] > 0 && !this.flags.pass){
                this.flags.pass = this.flags.below
                this.flags.pass.collisionResponse = false
            }else if(this.flags.pass){
                this.flags.pass = null
            }

            if(!this.flags.pass) break passthrough

            let raycast = this.raycast(origin, target)
            if(!raycast.body || this.passGroup && raycast.body === this.flags.ground || (raycast.shape && raycast.shape.type != ShapeType.LINE)){
                this.flags.pass.collisionResponse = true
                this.flags.pass = null
            }else{
                const distance = raycast.computeHitDistance()
                const slopeAngle = vec2.angle(raycast.normal, AXIS_Y) * Math.sign(raycast.normal[0])
                const distanceToGround = (distance - 2 * this.padding)

                if(distanceToGround - Math.abs(velocity[1]) < 4 * this.threshold && Math.abs(slopeAngle) <= this.maxDescendAngle){
                    velocity[1] = (distance - 2 * this.padding) * directionY
                    this.flags.below = raycast.shape
                    this.flags.ground = raycast.body
                    this.slopeAngle = slopeAngle
                }else{
                    this.flags.pass.collisionResponse = true
                    this.flags.pass = null
                }
            }
        }
    }
}
