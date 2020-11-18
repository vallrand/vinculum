import { mat3x2, vec2, AABB, ease, clamp, lerp } from 'math'
import { ReusableComponent, EntityManager, IUpdateContext } from 'framework'
import { Transform2D } from 'scene'

interface PlantOptions {
    radius: number
    timeScale: number
    element: number
}

export class Plant extends ReusableComponent<PlantOptions> {
    private options: PlantOptions
    private reaction: number
    private radiusSquared: number
    public readonly aabb: AABB = AABB()
    setup(options: PlantOptions, manager: EntityManager){
        this.options = options
        this.reaction = 0
        this.radiusSquared = this.options.radius * this.options.radius
    }
    update(manager: EntityManager, context: IUpdateContext, target: Transform2D){
        const targetX = target.globalTransform[4]
        const targetY = target.globalTransform[5]
        
        const originX = 0.5 * (this.aabb[0] + this.aabb[2])
        const originY = 0.5 * (this.aabb[1] + this.aabb[3]) - 0.5 * this.options.radius

        const dx = targetX - originX
        const dy = targetY - originY
        const triggerReaction = dx*dx + dy*dy < this.radiusSquared
        if(!triggerReaction && !this.reaction) return

        const deltaTime = this.options.timeScale * (triggerReaction ? 2 * context.deltaTime : -context.deltaTime)
        this.reaction = clamp(this.reaction + deltaTime, 0, 1)
        
        const transform = manager.aquireComponent<Transform2D>(this.options.element, Transform2D, this.timeframe)
        transform.localScale[1] = lerp(1, 0, ease.backIn(this.reaction))
        transform.localScale[0] = lerp(1, 0, ease.cubicIn(this.reaction))
        transform.lastFrame = -1
    }
    reset(){
        this.options = null
    }
}