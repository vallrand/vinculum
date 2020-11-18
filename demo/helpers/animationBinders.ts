import { ease, lerp, lerpAngle, Interpolation } from 'math'
import { ReusableComponent, EntityManager, IComponent } from 'framework'
import { GroupComponent } from 'scene/GroupComponent'
import { Transform2D, AnimationMixer, AnimationPropertyBinding, IAnimationSampler } from 'scene'

export interface AnimationPropertyBlueprint<C, P> {
    component: IComponent<C>
    initial: (this: EntityManager, target: C) => P
    prev?: P
    next?: P
    set: (this: EntityManager, target: C, value: P) => void
    interpolate: Interpolation<P>
}

export function bindAnimationProperty<C, P, T>(
    manager: EntityManager, entity: number, {
        component, initial, prev, next, set, interpolate
    }: AnimationPropertyBlueprint<C, P>,
    samplers: { [animation: string]: IAnimationSampler<P> },
    context?: T
): AnimationPropertyBinding<P> & { samplers: { [animation: string]: IAnimationSampler<P> }, context: T } {
    const target: C = manager.aquireComponent(entity, component)
    return {
        context,
        interpolate, prev, next,
        initial: initial.call(manager, target),
        set: set.bind(manager, target),
        samplers
    }
}

export function bindAnimationTrigger(
    manager: EntityManager,
    callback: () => void,
    samplers: { [animation: string]: IAnimationSampler<number> },
): AnimationPropertyBinding<number> & { samplers: { [animation: string]: IAnimationSampler<number> } } {
    let count = 0
    return {
        interpolate: (prev: number, next: number, f: number): number => prev + next,
        initial: 0,
        set(value: number){
            for(let i = count; i < value; i++) callback()
            count = value
        },
        samplers
    }
}