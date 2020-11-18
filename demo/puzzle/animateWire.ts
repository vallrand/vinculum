import { lerp, step, ease } from 'math'
import { EntityManager } from 'framework'
import { AnimationMixer, KeyframeSampler } from 'scene'
import { Material, BlendMode, Curve } from 'renderer'
import { FadeCurve } from './FadeCurve'

import { bindAnimationProperty } from '../helpers'
import { PuzzleWire } from './PuzzleWire'

const enum WireAnimation {
    FLOW = 'flow'
}

export function animateWire(manager: EntityManager, wire: PuzzleWire, reverse: boolean){
    const entity = manager.createEntity()
    manager.createComponent(entity, Material, {
        program: 0, blend: BlendMode.ADD, texture: 'knot/wire_glow.png' 
    })
    const target = manager.createComponent(entity, FadeCurve, {
        order: -6, smoothness: 1, path: []
    }) as FadeCurve

    const animation = manager.createComponent(entity, AnimationMixer, [{
        initial: 0, interpolate: lerp,
        set(value: number): void {
            target.fadeOffset = reverse ? 1 - value : value
            target.lastFrame = -1
        },
        samplers: {
            [WireAnimation.FLOW]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 1.6, value: 1, ease: ease.linear }
            ])
        }
    }, {
        interpolate: step,
        set: (): void => {
            const delegate = manager.aquireComponent(wire.entity, Curve) as Curve
            ;(target as any).curve = delegate.curve
            target.lastFrame = -1
        },
        samplers: {}
    }, bindAnimationProperty(manager, wire.entity, {
        component: PuzzleWire,
        interpolate: lerp,
        initial(target: PuzzleWire): number { return target.tension },
        set(target: PuzzleWire, value: number): void { target.tension = value }
    }, {
        [WireAnimation.FLOW]: KeyframeSampler<number>(lerp)([
            { time: 0, value: 1 },
            { time: 0.8, value: 0.2, ease: ease.sineOut },
            { time: 1.6, value: 1, ease: ease.sineIn }
        ])
    })]) as AnimationMixer
    const track = animation.createAnimation(WireAnimation.FLOW, true)
    track.callback = manager.removeEntity.bind(manager, entity)
}