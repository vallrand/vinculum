import { vec2 } from 'math/vec2'
import { mat3x2 } from 'math/mat3x2'
import { ReusableComponent } from 'framework/ReusableComponent'
import { EntityManager } from 'framework/EntityManager'
import { Transform2D } from './Transform2D'

export class TargetComponent extends ReusableComponent<number> {
    private static readonly inverseTransform: mat3x2 = mat3x2()
    private readonly relativePosition: vec2 = vec2()
    private target: number
    private manager: EntityManager
    setup(target: number, manager: EntityManager){
        this.manager = manager
        this.target = target
    }
    calculatePosition(): vec2 {
        const target = vec2.copy(vec2.ZERO, this.relativePosition)
        const transform = this.manager.aquireComponent<Transform2D>(this.entity, Transform2D)
        const targetTransform = this.manager.aquireComponent<Transform2D>(this.target, Transform2D, this.timeframe)
        if(targetTransform) mat3x2.transform(target, targetTransform.globalTransform, target)
        if(transform) mat3x2.transform(target, mat3x2.invert(transform.globalTransform, TargetComponent.inverseTransform), target)
        return target
    }
    reset(){
        this.manager = null
        this.target = -1
    }
}