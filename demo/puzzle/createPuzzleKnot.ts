import { EntityManager } from 'framework'
import { Zero, One } from 'common/static'
import { ease, lerp, lerpAngle, rgb, rgba, vec2, range, randomInt, randomFloat } from 'math'
import { Transform2D, GroupComponent } from 'scene'
import { AudioSource, SpatialAudio } from 'audio'
import { AnimationMixer, KeyframeSampler, StaticSampler, IAnimationSampler } from 'scene/animation'
import { Sprite2D, Material, BlendMode } from 'renderer'

import { PuzzleKnotType, PuzzleKnotState, PuzzleKnotAnimation } from './constants'
import { bindAnimationProperty, bindAnimationTrigger, AnimationProperty, AnimationPropertyBlueprint, rng } from '../helpers'

import { SoundscapeSystem } from '../soundscape'
import { PuzzleKnot } from './PuzzleKnot'
import { CharacterSystem } from '../character'
import { Layer } from '../terrain'

interface AnimationBlueprint<P> {
    target?: string
    property: AnimationPropertyBlueprint<any, P>
    animations: { [animation: string]: IAnimationSampler<any> }
}

const animations: Record<PuzzleKnotType, Array<AnimationBlueprint<any>>> = {
    [PuzzleKnotType.ENTRY]: [{
        target: 'eye', property: AnimationProperty.position,
        animations: {
            [PuzzleKnotAnimation.OPENED]: function(this: { context: PuzzleKnot }, time: number, out?: vec2){
                const origin = this.context.manager.aquireComponent<Transform2D>(this.context.entity, Transform2D)
                const character = this.context.manager.resolveSystem(CharacterSystem).character
                const target = this.context.manager.aquireComponent<Transform2D>(character, Transform2D)
                const visionRange = 600
                const movementRange = 30

                vec2.fromValues(
                    target.globalTransform[4] - origin.globalTransform[4],
                    target.globalTransform[5] - origin.globalTransform[5],
                    out
                )
                const distance = vec2.magnitude(out)

                let scale = Math.min(1, distance / visionRange)
                scale = ease.quadOut(scale)

                vec2.scale(out, movementRange * scale * 1 / distance, out)
                return out
            }
        }
    }, {
        target: '2l', property: AnimationProperty.originX,
        animations: {
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 },
                { time: 1, value: 0.5 + 0.2, ease: ease.cubicIn }
            ]),
            [PuzzleKnotAnimation.OPENED]: StaticSampler<number>(0.5 + 0.2),
            [PuzzleKnotAnimation.CLOSE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 + 0.2 },
                { time: 1, value: 0.5, ease: ease.bounceOut }
            ]),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 + 0.2 },
                { time: 0.5, value: 0.5, ease: ease.quadOut },
                { time: 1, value: 0.5 + 0.2, ease: ease.cubicIn }
            ]),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<number>(0.5 + 0.2)
        }
    }, {
        target: '2r', property: AnimationProperty.originX,
        animations: {
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 },
                { time: 1, value: 0.5 - 0.2, ease: ease.cubicIn }
            ]),
            [PuzzleKnotAnimation.OPENED]: StaticSampler<number>(0.5 - 0.2),
            [PuzzleKnotAnimation.CLOSE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 - 0.2 },
                { time: 1, value: 0.5, ease: ease.bounceOut }
            ]),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 - 0.2 },
                { time: 0.5, value: 0.5, ease: ease.quadOut },
                { time: 1, value: 0.5 - 0.2, ease: ease.cubicIn }
            ]),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<number>(0.5 - 0.2)
        }
    }, {
        target: '2l', property: AnimationProperty.opacity,
        animations: {
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 1 },
                { time: 1, value: 0, ease: ease.quintIn }
            ]),
            [PuzzleKnotAnimation.OPENED]: Zero,
            [PuzzleKnotAnimation.CLOSE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 1, value: 1, ease: ease.quintOut }
            ]),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 0.5, value: 1, ease: ease.quintOut },
                { time: 1, value: 0, ease: ease.quintIn }
            ]),
            [PuzzleKnotAnimation.ENABLED]: Zero
        }
    }, {
        target: '2r', property: AnimationProperty.opacity,
        animations: {
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 1 },
                { time: 1, value: 0, ease: ease.quintIn }
            ]),
            [PuzzleKnotAnimation.OPENED]: Zero,
            [PuzzleKnotAnimation.CLOSE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 1, value: 1, ease: ease.quintOut }
            ]),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 0.5, value: 1, ease: ease.quintOut },
                { time: 1, value: 0, ease: ease.quintIn }
            ]),
            [PuzzleKnotAnimation.ENABLED]: Zero
        }
    }, {
        target: '2r', property: AnimationProperty.rotation,
        animations: {
            [PuzzleKnotAnimation.ENABLE]: StaticSampler<number>(0.5 * Math.PI)
        }
    }, {
        target: '2l', property: AnimationProperty.rotation,
        animations: {
            [PuzzleKnotAnimation.ENABLE]: StaticSampler<number>(0.5 * Math.PI)
        }
    }, {
        target: '0l', property: AnimationProperty.rotation,
        animations: {
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 0.6, value: 0.5 * Math.PI, ease: ease.quadOut },
                { time: 1, value: 0.5 * Math.PI }
            ]),
            [PuzzleKnotAnimation.OPENED]: StaticSampler<number>(0.5 * Math.PI),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 * Math.PI },
                { time: 1, value: 0, ease: ease.cubicOut }
            ]),
            [PuzzleKnotAnimation.CLOSE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 * Math.PI },
                { time: 1, value: 0, ease: ease.cubicInOut }
            ])
        }
    }, {
        target: '0r', property: AnimationProperty.rotation,
        animations: {
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 0.6, value: 0.5 * Math.PI, ease: ease.quadOut },
                { time: 1, value: 0.5 * Math.PI }
            ]),
            [PuzzleKnotAnimation.OPENED]: StaticSampler<number>(0.5 * Math.PI),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 * Math.PI },
                { time: 1, value: 0, ease: ease.cubicOut }
            ]),
            [PuzzleKnotAnimation.CLOSE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 * Math.PI },
                { time: 1, value: 0, ease: ease.cubicInOut }
            ])
        }
    }, {
        target: '0l', property: AnimationProperty.originX,
        animations: {
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 },
                { time: 0.6, value: 0.5 + 0.05, ease: ease.quadOut },
                { time: 1, value: 0.5, ease: ease.quadOut }
            ]),
            [PuzzleKnotAnimation.OPENED]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 },
                { time: 2, value: 0.5 + 0.03, ease: ease.cubicOut },
                { time: 3, value: 0.5, ease: ease.cubicIn }
            ]),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 },
                { time: 0.5, value: 0.5 + 0.06, ease: ease.sineIn },
                { time: 1, value: 0.5 + 0.02, ease: ease.sineOut } 
            ]),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<number>(0.5 + 0.02)
        }
    }, {
        target: '0r', property: AnimationProperty.originX,
        animations: {
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 },
                { time: 0.6, value: 0.5 - 0.05, ease: ease.quadOut },
                { time: 1, value: 0.5, ease: ease.quadOut }
            ]),
            [PuzzleKnotAnimation.OPENED]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 },
                { time: 2, value: 0.5 - 0.03, ease: ease.cubicOut },
                { time: 3, value: 0.5, ease: ease.cubicIn }
            ]),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 },
                { time: 0.5, value: 0.5 - 0.06, ease: ease.sineIn },
                { time: 1, value: 0.5 - 0.02, ease: ease.sineOut } 
            ]),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<number>(0.5 - 0.02)
        }
    }, {
        target: '1', property: AnimationProperty.rotation,
        animations: {
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 1, value: 2 * Math.PI, ease: ease.cubicOut }
            ]),
            [PuzzleKnotAnimation.OPENED]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 5, value: -2 * Math.PI }
            ]),
            [PuzzleKnotAnimation.ENABLED]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 15, value: 2 * Math.PI }
            ])
        }
    }, {
        target: '3', property: AnimationProperty.rotation,
        animations: {
            [PuzzleKnotAnimation.OPENED]: KeyframeSampler<number>(lerpAngle)([
                { time: 0, value: 0 },
                { time: 2, value: 0.4 * Math.PI, ease: ease.quadInOut },
                { time: 4, value: 1.2 * Math.PI, ease: ease.quadInOut },
                { time: 6, value: 0, ease: ease.quadInOut }
            ]),
            [PuzzleKnotAnimation.ENABLED]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 9, value: -2 * Math.PI, ease: ease.linear }
            ]),
            [PuzzleKnotAnimation.CLOSE]: StaticSampler<number>(0.5 * Math.PI)
        }
    }, {
        target: 'eye', property: AnimationProperty.scale,
        animations: {
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<vec2>(vec2.lerp)([
                { time: 0, value: vec2(0.7, 0.7) },
                { time: 1, value: vec2(1, 1), ease: ease.sineIn }
            ]),
            [PuzzleKnotAnimation.CLOSE]: KeyframeSampler<vec2>(vec2.lerp)([
                { time: 0, value: vec2(1, 1) },
                { time: 1, value: vec2(0.8, 0.8), ease: ease.quartOut }
            ]),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<vec2>(vec2.lerp)([
                { time: 0, value: vec2(1, 1) },
                { time: 1, value: vec2(1.3, 1.3), ease: ease.sineOut }
            ]),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<vec2>(vec2(1.3, 1.3))
        }
    }, {
        target: 'eye', property: AnimationProperty.tint,
        animations: {
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<rgb>(rgb.lerp)([
                { time: 0, value: rgb.BLACK },
                { time: 1, value: rgb(0x3F, 0x7F, 0xFF), ease: ease.sineOut }
            ]),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<rgb>(rgb(0x3F, 0x7F, 0xFF))
        }
    }, {
        target: 'eye', property: AnimationProperty.color,
        animations: {
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<rgba>(rgba.lerp)([
                { time: 0, value: rgba(0x3F, 0x3F, 0x3F, 0xFF) },
                { time: 1, value: rgba.WHITE, ease: ease.cubicOut }
            ]),
            [PuzzleKnotAnimation.CLOSE]: KeyframeSampler<rgba>(rgba.lerp)([
                { time: 0, value: rgba.WHITE },
                { time: 1, value: rgba(0x3F, 0x3F, 0x3F, 0xFF), ease: ease.cubicIn },
            ]),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<rgba>(rgba.lerp)([
                { time: 0, value: rgba.WHITE },
                { time: 1, value: rgba(0x3F, 0x7F, 0xFF, 0xFF), ease: ease.linear }
            ]),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<rgba>(rgba(0x3F, 0x7F, 0xFF, 0xFF))
        }
    }, {
        target: 'glow', property: AnimationProperty.tint,
        animations: {
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<rgb>(rgb.lerp)([
                { time: 0, value: rgb.BLACK },
                { time: 1, value: rgb(0x3F, 0x7F, 0xFF), ease: ease.sineOut }
            ]),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<rgb>(rgb(0x3F, 0x7F, 0xFF))
        }
    }, {
        target: 'glow', property: AnimationProperty.color,
        animations: {
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<rgba>(rgba.lerp)([
                { time: 0, value: rgba(0xFF, 0xFF, 0xFF, 0x00) },
                { time: 0.4, value: rgba.WHITE, ease: ease.quadOut },
                { time: 1, value: rgba(0xFF, 0xFF, 0xFF, 0x00), ease: ease.quadIn }
            ]),
            [PuzzleKnotAnimation.OPENED]: KeyframeSampler<rgba>(rgba.lerp)([
                { time: 0, value: rgba(0xFF, 0xFF, 0xFF, 0x00) },
                { time: 2, value: rgba(0xFF, 0xFF, 0xFF, 0x7F), ease: ease.sineOut },
                { time: 4, value: rgba(0xFF, 0xFF, 0xFF, 0x00), ease: ease.sineIn }
            ]),
            [PuzzleKnotAnimation.ENABLED]: KeyframeSampler<rgba>(rgba.lerp)([
                { time: 0, value: rgba(0x3F, 0x7F, 0xFF, 0x00) },
                { time: 4, value: rgba(0x3F, 0x7F, 0xFF, 0x7F), ease: ease.sineOut },
                { time: 8, value: rgba(0x3F, 0x7F, 0xFF, 0x00), ease: ease.sineIn }
            ]),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<rgba>(rgba.lerp)([
                { time: 0, value: rgba(0xFF, 0xFF, 0xFF, 0x00) },
                { time: 0.4, value: rgba(0x3F, 0x7F, 0xFF, 0xFF), ease: ease.quadOut },
                { time: 1, value: rgba(0x3F, 0x7F, 0xFF, 0x00), ease: ease.quadIn }
            ])
        }
    }, {
        target: 'glow', property: AnimationProperty.scale,
        animations: {
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<vec2>(vec2.lerp)([
                { time: 0, value: vec2(1, 1) },
                { time: 1, value: vec2(1.4, 1.4), ease: ease.quadOut }
            ]),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<vec2>(vec2.lerp)([
                { time: 0, value: vec2(1, 1) },
                { time: 1, value: vec2(1.5, 1.5), ease: ease.quadOut }
            ])
        }
    }, {
        target: 'highlight', property: AnimationProperty.color,
        animations: {
            [PuzzleKnotAnimation.HIGHLIGHT]: StaticSampler<rgba>(rgba.WHITE)
        }
    }],
    [PuzzleKnotType.SINGLE]: [{
        target: '0l', property: AnimationProperty.rotation,
        animations: {
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 1, value: -0.5 * Math.PI, ease: ease.sineInOut }
            ]),
            [PuzzleKnotAnimation.OPENED]: StaticSampler<number>(-0.5 * Math.PI),
            [PuzzleKnotAnimation.CLOSE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: -0.5 * Math.PI },
                { time: 1, value: 0, ease: ease.sineOut }
            ]),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: -0.5 * Math.PI },
                { time: 1, value: -Math.PI }
            ]),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<number>(-Math.PI)
        }
    }, {
        target: '0r', property: AnimationProperty.rotation,
        animations: {
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 1, value: -0.5 * Math.PI, ease: ease.sineInOut }
            ]),
            [PuzzleKnotAnimation.OPENED]: StaticSampler<number>(-0.5 * Math.PI),
            [PuzzleKnotAnimation.CLOSE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: -0.5 * Math.PI },
                { time: 1, value: 0, ease: ease.sineOut }
            ]),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: -0.5 * Math.PI },
                { time: 1, value: -Math.PI }
            ]),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<number>(-Math.PI)
        }
    }, {
        target: '0l', property: AnimationProperty.originY,
        animations: {
            [PuzzleKnotAnimation.OPENED]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 },
                { time: 3, value: 0.5 + 0.05, ease: ease.sineIn },
                { time: 6, value: 0.5, ease: ease.sineOut }
            ]),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 },
                { time: 1, value: 0.5 + 0.1, ease: ease.quadIn }
            ]),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<number>(0.5 + 0.1)
        }
    }, {
        target: '0r', property: AnimationProperty.originY,
        animations: {
            [PuzzleKnotAnimation.OPENED]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 },
                { time: 3, value: 0.5 - 0.05, ease: ease.sineIn },
                { time: 6, value: 0.5, ease: ease.sineOut }
            ]),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 },
                { time: 1, value: 0.5 - 0.1, ease: ease.quadIn }
            ]),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<number>(0.5 - 0.1)
        }
    }, {
        target: '2l', property: AnimationProperty.originY,
        animations: {
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 },
                { time: 1, value: 0.5 + 0.12, ease: ease.cubicInOut }
            ]),
            [PuzzleKnotAnimation.OPENED]: StaticSampler<number>(0.5 + 0.12),
            [PuzzleKnotAnimation.CLOSE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 + 0.12 },
                { time: 1, value: 0.5, ease: ease.bounceOut }
            ]),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 + 0.12 },
                { time: 0.4, value: 0.5, ease: ease.quadOut },
                { time: 1, value: 0.5 + 0.12, ease: ease.quadIn }
            ]),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<number>(0.5 + 0.12)
        }
    }, {
        target: '2r', property: AnimationProperty.originY,
        animations: {
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 },
                { time: 1, value: 0.5 - 0.12, ease: ease.cubicInOut }
            ]),
            [PuzzleKnotAnimation.OPENED]: StaticSampler<number>(0.5 - 0.12),
            [PuzzleKnotAnimation.CLOSE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 - 0.12 },
                { time: 1, value: 0.5, ease: ease.bounceOut }
            ]),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 - 0.12 },
                { time: 0.4, value: 0.5, ease: ease.quadOut },
                { time: 1, value: 0.5 - 0.12, ease: ease.quadIn }
            ]),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<number>(0.5 - 0.12)
        }
    }, {
        target: '2l', property: AnimationProperty.rotation,
        animations: {
            [PuzzleKnotAnimation.OPENED]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 5, value: -2 * Math.PI, ease: ease.linear }
            ]),
            [PuzzleKnotAnimation.ENABLE]: StaticSampler<number>(0.5 * Math.PI),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<number>(0.5 * Math.PI)
        }
    }, {
        target: '2r', property: AnimationProperty.rotation,
        animations: {
            [PuzzleKnotAnimation.OPENED]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 5, value: -2 * Math.PI, ease: ease.linear }
            ]),
            [PuzzleKnotAnimation.ENABLE]: StaticSampler<number>(0.5 * Math.PI),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<number>(0.5 * Math.PI)
        }
    }, {
        target: '1', property: AnimationProperty.rotation,
        animations: {
            [PuzzleKnotAnimation.OPENED]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 2, value: 2 * Math.PI, ease: ease.linear }
            ]),
            [PuzzleKnotAnimation.ENABLED]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 8, value: -2 * Math.PI, ease: ease.linear }
            ])
        }
    }, {
        target: '3', property: AnimationProperty.rotation,
        animations: {
            [PuzzleKnotAnimation.OPENED]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 12, value: -2 * Math.PI, ease: ease.linear }
            ]),
            [PuzzleKnotAnimation.CLOSE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 1, value: -4 * Math.PI, ease: ease.quadIn }
            ]),
            [PuzzleKnotAnimation.ENABLE]: StaticSampler<number>(0.5 * Math.PI),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<number>(0.5 * Math.PI)
        }
    }, {
        target: '3', property: AnimationProperty.opacity,
        animations: {
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 1 },
                { time: 1, value: 0, ease: ease.sineOut }
            ]),
            [PuzzleKnotAnimation.ENABLED]: Zero
        }
    }, {
        target: 'eye', property: AnimationProperty.tint,
        animations: {
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<rgb>(rgb.lerp)([
                { time: 0, value: rgb.BLACK },
                { time: 1, value: rgb(0x00, 0xFF, 0x7F), ease: ease.sineOut }
            ]),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<rgb>(rgb(0x00, 0xFF, 0x7F))
        }
    }, {
        target: 'eye', property: AnimationProperty.color,
        animations: {
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<rgba>(rgba.lerp)([
                { time: 0, value: rgba.WHITE },
                { time: 1, value: rgba(0x00, 0xFF, 0xFF, 0xFF), ease: ease.sineOut }
            ]),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<rgba>(rgba(0x00, 0xFF, 0xFF, 0xFF))
        }
    }, {
        target: 'glow', property: AnimationProperty.tint,
        animations: {
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<rgb>(rgb.lerp)([
                { time: 0, value: rgb.BLACK },
                { time: 1, value: rgb(0x3F, 0xFF, 0x7F), ease: ease.sineOut }
            ]),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<rgb>(rgb(0x3F, 0xFF, 0x7F))
        }
    }, {
        target: 'glow', property: AnimationProperty.color,
        animations: {
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<rgba>(rgba.lerp)([
                { time: 0, value: rgba(0xFF, 0xFF, 0xFF, 0x00) },
                { time: 0.4, value: rgba.WHITE, ease: ease.quadOut },
                { time: 1, value: rgba(0xFF, 0xFF, 0xFF, 0x00), ease: ease.quadIn }
            ]),
            [PuzzleKnotAnimation.OPENED]: KeyframeSampler<rgba>(rgba.lerp)([
                { time: 0, value: rgba(0xFF, 0xFF, 0xFF, 0x00) },
                { time: 2, value: rgba(0xFF, 0xFF, 0xFF, 0x7F), ease: ease.sineOut },
                { time: 4, value: rgba(0xFF, 0xFF, 0xFF, 0x00), ease: ease.sineIn }
            ]),
            [PuzzleKnotAnimation.ENABLED]: KeyframeSampler<rgba>(rgba.lerp)([
                { time: 0, value: rgba(0x3F, 0xFF, 0x7F, 0x00) },
                { time: 4, value: rgba(0x3F, 0xFF, 0x7F, 0x7F), ease: ease.sineOut },
                { time: 8, value: rgba(0x3F, 0xFF, 0x7F, 0x00), ease: ease.sineIn }
            ]),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<rgba>(rgba.lerp)([
                { time: 0, value: rgba(0xFF, 0xFF, 0xFF, 0x00) },
                { time: 0.4, value: rgba(0x3F, 0xFF, 0x7F, 0xFF), ease: ease.quadOut },
                { time: 1, value: rgba(0x3F, 0xFF, 0x7F, 0x00), ease: ease.quadIn }
            ])
        }
    }, {
        target: 'glow', property: AnimationProperty.scale,
        animations: {
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<vec2>(vec2.lerp)([
                { time: 0, value: vec2(1, 1) },
                { time: 1, value: vec2(1.4, 1.4), ease: ease.quadOut }
            ]),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<vec2>(vec2.lerp)([
                { time: 0, value: vec2(1, 1) },
                { time: 1, value: vec2(1.5, 1.5), ease: ease.quadOut }
            ])
        }
    }, {
        target: 'highlight', property: AnimationProperty.color,
        animations: {
            [PuzzleKnotAnimation.HIGHLIGHT]: StaticSampler<rgba>(rgba.WHITE)
        }
    }],
    [PuzzleKnotType.REGROW]: [{
        target: '0', property: AnimationProperty.rotation,
        animations: {
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 1, value: -0.5 * Math.PI, ease: ease.cubicOut }
            ]),
            [PuzzleKnotAnimation.OPENED]: KeyframeSampler<number>(lerp)([
                { time: 0, value: -0.5 * Math.PI },
                { time: 7, value: 2 * Math.PI - 0.5 * Math.PI, ease: ease.linear }
            ]),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 1, value: 2 * Math.PI, ease: ease.sineOut }
            ]),
            [PuzzleKnotAnimation.ENABLED]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 26, value: -2 * Math.PI, ease: ease.linear }
            ])
        }
    }, {
        target: '2', property: AnimationProperty.rotation,
        animations: {
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 1, value: 0.5 * Math.PI, ease: ease.cubicOut }
            ]),
            [PuzzleKnotAnimation.OPENED]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 * Math.PI },
                { time: 5, value: -2 * Math.PI + 0.5 * Math.PI, ease: ease.linear }
            ]),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 1, value: 2 * Math.PI, ease: ease.sineOut }
            ]),
            [PuzzleKnotAnimation.ENABLED]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 26, value: -2 * Math.PI, ease: ease.linear }
            ])
        }
    }, {
        target: '0', property: AnimationProperty.scale,
        animations: {
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<vec2>(vec2.lerp)([
                { time: 0, value: vec2(1, 1) },
                { time: 1, value: vec2(1.2, 1.2), ease: ease.sineInOut }
            ]),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<vec2>(vec2(1.2, 1.2))
        }
    }, {
        target: '2', property: AnimationProperty.scale,
        animations: {
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<vec2>(vec2.lerp)([
                { time: 0, value: vec2(1, 1) },
                { time: 1, value: vec2(1.2, 1.2), ease: ease.sineInOut }
            ]),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<vec2>(vec2(1.2, 1.2))
        }
    }, {
        target: '3', property: AnimationProperty.rotation,
        animations: {
            [PuzzleKnotAnimation.OPENED]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 9, value: 2 * Math.PI, ease: ease.linear }
            ]),
            [PuzzleKnotAnimation.ENABLE]: StaticSampler<number>(0.5 * Math.PI),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<number>(0.5 * Math.PI)
        }
    }, {
        target: '1', property: AnimationProperty.rotation,
        animations: {
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 1, value: 0.5 * Math.PI, ease: ease.cubicOut }
            ]),
            [PuzzleKnotAnimation.CLOSE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 * Math.PI },
                { time: 1, value: 0, ease: ease.cubicIn }
            ])
        }
    }, {
        target: '1', property: AnimationProperty.scale,
        animations: {
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<vec2>(vec2.lerp)([
                { time: 0, value: vec2(1, 1) },
                { time: 1, value: vec2.ZERO, ease: ease.quartIn }
            ]),
            [PuzzleKnotAnimation.OPENED]: StaticSampler<vec2>(vec2.ZERO),
            [PuzzleKnotAnimation.CLOSE]: KeyframeSampler<vec2>(vec2.lerp)([
                { time: 0, value: vec2.ZERO },
                { time: 1, value: vec2(1, 1), ease: ease.elasticOut }
            ]),
            [PuzzleKnotAnimation.ENABLE]: StaticSampler<vec2>(vec2.ZERO),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<vec2>(vec2.ZERO)
        }
    }, {
        target: 'eye', property: AnimationProperty.scale,
        animations: {
            [PuzzleKnotAnimation.OPENED]: KeyframeSampler<vec2>(vec2.lerp)([
                { time: 0, value: vec2(0.8, 0.8) },
                { time: 1, value: vec2(1.2, 1.2), ease: ease.cubicIn },
                { time: 2, value: vec2(0.8, 0.8), ease: ease.cubicOut }
            ]),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<vec2>(vec2.lerp)([
                { time: 0, value: vec2(1, 1) },
                { time: 1, value: vec2(1.6, 1.6), ease: ease.elasticOut }
            ]),
            [PuzzleKnotAnimation.ENABLED]: KeyframeSampler<vec2>(vec2.lerp)([
                { time: 0, value: vec2(1.6, 1.6) },
                { time: 3, value: vec2(1.3, 1.3), ease: ease.cubicIn },
                { time: 6, value: vec2(1.6, 1.6), ease: ease.cubicOut }
            ])
        }
    }, {
        target: 'eye', property: AnimationProperty.color,
        animations: {
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<rgba>(rgba.lerp)([
                { time: 0, value: rgba(0x7F, 0x7F, 0x7F, 0xFF) },
                { time: 1, value: rgba.WHITE, ease: ease.cubicIn }
            ]),
            [PuzzleKnotAnimation.OPENED]: StaticSampler<rgba>(rgba.WHITE),
            [PuzzleKnotAnimation.CLOSE]: KeyframeSampler<rgba>(rgba.lerp)([
                { time: 0, value: rgba.WHITE },
                { time: 1, value: rgba(0x7F, 0x7F, 0x7F, 0xFF), ease: ease.cubicOut }
            ]),
            [PuzzleKnotAnimation.ENABLE]: StaticSampler<rgba>(rgba.WHITE),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<rgba>(rgba.WHITE)
        }
    }, {
        target: 'eye', property: AnimationProperty.tint,
        animations: {
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<rgb>(rgb.lerp)([
                { time: 0, value: rgb.BLACK },
                { time: 1, value: rgb(0x3F, 0xFF, 0x3F), ease: ease.quadOut }
            ]),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<rgb>(rgb(0x3F, 0xFF, 0x3F))
        }
    }, {
        target: 'glow', property: AnimationProperty.tint,
        animations: {
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<rgb>(rgb.lerp)([
                { time: 0, value: rgb.BLACK },
                { time: 1, value: rgb(0x3F, 0xFF, 0x3F), ease: ease.sineOut }
            ]),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<rgb>(rgb(0x3F, 0xFF, 0x3F))
        }
    }, {
        target: 'glow', property: AnimationProperty.color,
        animations: {
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<rgba>(rgba.lerp)([
                { time: 0, value: rgba(0xFF, 0xFF, 0xFF, 0x00) },
                { time: 0.4, value: rgba.WHITE, ease: ease.quadOut },
                { time: 1, value: rgba(0xFF, 0xFF, 0xFF, 0x00), ease: ease.quadIn }
            ]),
            [PuzzleKnotAnimation.OPENED]: KeyframeSampler<rgba>(rgba.lerp)([
                { time: 0, value: rgba(0xFF, 0xFF, 0xFF, 0x00) },
                { time: 2, value: rgba(0xFF, 0xFF, 0xFF, 0x7F), ease: ease.sineOut },
                { time: 4, value: rgba(0xFF, 0xFF, 0xFF, 0x00), ease: ease.sineIn }
            ]),
            [PuzzleKnotAnimation.ENABLED]: KeyframeSampler<rgba>(rgba.lerp)([
                { time: 0, value: rgba(0x7F, 0xFF, 0x3F, 0x00) },
                { time: 4, value: rgba(0x3F, 0xFF, 0x3F, 0x7F), ease: ease.sineOut },
                { time: 8, value: rgba(0x3F, 0xFF, 0x3F, 0x00), ease: ease.sineIn }
            ]),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<rgba>(rgba.lerp)([
                { time: 0, value: rgba(0xFF, 0xFF, 0xFF, 0x00) },
                { time: 0.4, value: rgba(0x3F, 0xFF, 0x3F, 0xFF), ease: ease.quadOut },
                { time: 1, value: rgba(0x3F, 0xFF, 0x3F, 0x00), ease: ease.quadIn }
            ])
        }
    }, {
        target: 'glow', property: AnimationProperty.scale,
        animations: {
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<vec2>(vec2.lerp)([
                { time: 0, value: vec2(1, 1) },
                { time: 1, value: vec2(1.4, 1.4), ease: ease.quadOut }
            ]),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<vec2>(vec2.lerp)([
                { time: 0, value: vec2(1, 1) },
                { time: 1, value: vec2(1.5, 1.5), ease: ease.quadOut }
            ])
        }
    }, {
        target: 'highlight', property: AnimationProperty.color,
        animations: {
            [PuzzleKnotAnimation.HIGHLIGHT]: StaticSampler<rgba>(rgba.WHITE)
        }
    }],
    [PuzzleKnotType.TOGGLE]: [{
        target: '0', property: AnimationProperty.rotation,
        animations: {
            [PuzzleKnotAnimation.OPENED]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 7, value: 2 * Math.PI, ease: ease.linear }
            ]),
            [PuzzleKnotAnimation.ENABLED]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 16, value: -2 * Math.PI, ease: ease.linear }
            ])
        }
    }, {
        target: '2', property: AnimationProperty.rotation,
        animations: {
            [PuzzleKnotAnimation.OPENED]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 5, value: 2 * Math.PI, ease: ease.linear }
            ]),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 1, value: -2 * Math.PI, ease: ease.quadOut }
            ]),
            [PuzzleKnotAnimation.ENABLED]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 13, value: 2 * Math.PI, ease: ease.linear }
            ])
        }
    }, {
        target: '3', property: AnimationProperty.rotation,
        animations: {
            [PuzzleKnotAnimation.OPENED]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 2, value: 2 * Math.PI, ease: ease.linear }
            ]),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 1, value: 2 * Math.PI, ease: ease.quadOut }
            ]),
            [PuzzleKnotAnimation.ENABLED]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 7, value: -2 * Math.PI, ease: ease.linear }
            ])
        }
    }, {
        target: '4', property: AnimationProperty.rotation,
        animations: {
            [PuzzleKnotAnimation.OPENED]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 20, value: -2 * Math.PI, ease: ease.linear }
            ]),
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 1, value: 2 * Math.PI, ease: ease.cubicOut }
            ]),
            [PuzzleKnotAnimation.ENABLED]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0 },
                { time: 16, value: -2 * Math.PI, ease: ease.linear }
            ])
        }
    },
    ...range(6).map(i => ({
        target: `1${i}`, property: AnimationProperty.originY,
        animations: {
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 },
                { time: 1, value: 0.5 + 0.12, ease: ease.cubicOut }
            ]),
            [PuzzleKnotAnimation.OPENED]: StaticSampler<number>(0.5 + 0.12),
            [PuzzleKnotAnimation.CLOSE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 + 0.12 },
                { time: 1, value: 0.5, ease: ease.cubicOut }
            ]),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<number>(lerp)([
                { time: 0, value: 0.5 + 0.12 },
                { time: 0.3, value: 0.5 + 0.13, ease: ease.quadOut },
                { time: 1, value: 0.5 + 0.06, ease: ease.elasticOut }
            ]),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<number>(0.5 + 0.06)
        }
    })),
    ...range(6).map(i => ({
        target: `1${i}`, property: AnimationProperty.rotation,
        animations: {
            [PuzzleKnotAnimation.OPENED]: KeyframeSampler<number>(lerp)([
                { time: 0, value: i * 2 * Math.PI / 6 },
                { time: 8, value: -2 * Math.PI + i * 2 * Math.PI / 6, ease: ease.linear }
            ])
        }
    })),
    {
        target: 'eye', property: AnimationProperty.tint,
        animations: {
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<rgb>(rgb.lerp)([
                { time: 0, value: rgb.BLACK },
                { time: 1, value: rgb(0x7F, 0xFF, 0x00), ease: ease.sineOut }
            ]),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<rgb>(rgb(0x7F, 0xFF, 0x00))
        }
    }, {
        target: 'eye', property: AnimationProperty.color,
        animations: {
            [PuzzleKnotAnimation.OPENED]: StaticSampler<rgba>(rgba.WHITE),
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<rgba>(rgba.lerp)([
                { time: 0, value: rgba(0x7F, 0x7F, 0x7F, 0xFF) },
                { time: 1, value: rgba.WHITE, ease: ease.quadOut }
            ]),
            [PuzzleKnotAnimation.CLOSE]: KeyframeSampler<rgba>(rgba.lerp)([
                { time: 0, value: rgba.WHITE },
                { time: 1, value: rgba(0x7F, 0x7F, 0x7F, 0xFF), ease: ease.quadIn }
            ]),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<rgba>(rgba.lerp)([
                { time: 0, value: rgba.WHITE },
                { time: 1, value: rgba(0x7F, 0xFF, 0x00, 0xFF), ease: ease.sineOut }
            ]),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<rgba>(rgba(0x7F, 0xFF, 0x00, 0xFF))
        }
    }, {
        target: 'glow', property: AnimationProperty.tint,
        animations: {
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<rgb>(rgb.lerp)([
                { time: 0, value: rgb.BLACK },
                { time: 1, value: rgb(0x7F, 0xFF, 0x00), ease: ease.sineOut }
            ]),
            [PuzzleKnotAnimation.ENABLED]: StaticSampler<rgb>(rgb(0x7F, 0xFF, 0x00))
        }
    }, {
        target: 'glow', property: AnimationProperty.color,
        animations: {
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<rgba>(rgba.lerp)([
                { time: 0, value: rgba(0xFF, 0xFF, 0xFF, 0x00) },
                { time: 0.4, value: rgba.WHITE, ease: ease.quadOut },
                { time: 1, value: rgba(0xFF, 0xFF, 0xFF, 0x00), ease: ease.quadIn }
            ]),
            [PuzzleKnotAnimation.OPENED]: KeyframeSampler<rgba>(rgba.lerp)([
                { time: 0, value: rgba(0xFF, 0xFF, 0xFF, 0x00) },
                { time: 2, value: rgba(0xFF, 0xFF, 0xFF, 0x7F), ease: ease.sineOut },
                { time: 4, value: rgba(0xFF, 0xFF, 0xFF, 0x00), ease: ease.sineIn }
            ]),
            [PuzzleKnotAnimation.ENABLED]: KeyframeSampler<rgba>(rgba.lerp)([
                { time: 0, value: rgba(0x7F, 0xFF, 0x3F, 0x00) },
                { time: 4, value: rgba(0x7F, 0xFF, 0x3F, 0x7F), ease: ease.sineOut },
                { time: 8, value: rgba(0x7F, 0xFF, 0x3F, 0x00), ease: ease.sineIn }
            ]),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<rgba>(rgba.lerp)([
                { time: 0, value: rgba(0xFF, 0xFF, 0xFF, 0x00) },
                { time: 0.4, value: rgba(0x7F, 0xFF, 0x3F, 0xFF), ease: ease.quadOut },
                { time: 1, value: rgba(0x7F, 0xFF, 0x3F, 0x00), ease: ease.quadIn }
            ])
        }
    }, {
        target: 'glow', property: AnimationProperty.scale,
        animations: {
            [PuzzleKnotAnimation.OPEN]: KeyframeSampler<vec2>(vec2.lerp)([
                { time: 0, value: vec2(1, 1) },
                { time: 1, value: vec2(1.4, 1.4), ease: ease.quadOut }
            ]),
            [PuzzleKnotAnimation.ENABLE]: KeyframeSampler<vec2>(vec2.lerp)([
                { time: 0, value: vec2(1, 1) },
                { time: 1, value: vec2(1.5, 1.5), ease: ease.quadOut }
            ])
        }
    }, {
        target: 'highlight', property: AnimationProperty.color,
        animations: {
            [PuzzleKnotAnimation.HIGHLIGHT]: StaticSampler<rgba>(rgba.WHITE)
        }
    }]
}
const parts: Record<PuzzleKnotType, Array<{
    key: string
    order: number
    texture: string
    blend?: BlendMode
    color?: rgba
    rotation?: number
}>> = {
    [PuzzleKnotType.ENTRY]: [
        { key: 'eye', order: Layer.MIDGROUND, texture: 'knot/a_eye.png' },
        { key: '3', order: Layer.MIDGROUND, texture: 'knot/a_3.png' },
        { key: '2r', order: Layer.MIDGROUND, texture: 'knot/a_2r.png' },
        { key: '2l', order: Layer.MIDGROUND, texture: 'knot/a_2l.png' },
        { key: '1', order: Layer.MIDGROUND, texture: 'knot/a_1.png' },
        { key: '0r', order: Layer.MIDGROUND, texture: 'knot/a_0r.png' },
        { key: '0l', order: Layer.MIDGROUND, texture: 'knot/a_0l.png' },
        { key: 'glow', order: Layer.EFFECTS, texture: 'knot/a_glow.png',
        blend: BlendMode.ADD, color: rgba(0xFF, 0xFF, 0xFF, 0x00) }
    ],
    [PuzzleKnotType.SINGLE]: [
        { key: 'eye', order: Layer.MIDGROUND, texture: 'knot/b_eye.png' },
        { key: '3', order: Layer.MIDGROUND, texture: 'knot/b_3.png' },
        { key: '2r', order: Layer.MIDGROUND, texture: 'knot/b_2r.png' },
        { key: '2l', order: Layer.MIDGROUND, texture: 'knot/b_2l.png' },
        { key: '1', order: Layer.MIDGROUND, texture: 'knot/b_1.png' },
        { key: '0r', order: Layer.MIDGROUND, texture: 'knot/b_0r.png' },
        { key: '0l', order: Layer.MIDGROUND, texture: 'knot/b_0l.png' },
        { key: 'glow', order: Layer.EFFECTS, texture: 'knot/b_glow.png',
        blend: BlendMode.ADD, color: rgba(0xFF, 0xFF, 0xFF, 0x00) }
    ],
    [PuzzleKnotType.REGROW]: [
        { key: '4', order: Layer.MIDGROUND, texture: 'knot/c_4.png' },
        { key: 'eye', order: Layer.MIDGROUND, texture: 'knot/c_eye.png', color: rgba(0x7F, 0x7F, 0x7F, 0xFF) },
        { key: '3', order: Layer.MIDGROUND, texture: 'knot/c_3.png' },
        { key: '2', order: Layer.MIDGROUND, texture: 'knot/c_2.png' },
        { key: '1', order: Layer.MIDGROUND, texture: 'knot/c_1.png' },
        { key: '0', order: Layer.MIDGROUND, texture: 'knot/c_0.png' },
        { key: 'glow', order: Layer.EFFECTS, texture: 'knot/c_glow.png',
        blend: BlendMode.ADD, color: rgba(0xFF, 0xFF, 0xFF, 0x00) }
    ],
    [PuzzleKnotType.TOGGLE]: [
        { key: 'eye', order: Layer.MIDGROUND, texture: 'knot/d_eye.png', color: rgba(0x7F, 0x7F, 0x7F, 0xFF) },
        { key: '4', order: Layer.MIDGROUND, texture: 'knot/d_4.png' },
        { key: '3', order: Layer.MIDGROUND, texture: 'knot/d_3.png' },
        { key: '2', order: Layer.MIDGROUND, texture: 'knot/d_2.png' },
        ...range(6).map(i => ({ key: `1${i}`, order: Layer.MIDGROUND, texture: 'knot/d_1.png', rotation: i * 2 * Math.PI / 6 })),
        { key: '0', order: Layer.MIDGROUND, texture: 'knot/d_0.png' },
        { key: 'glow', order: Layer.EFFECTS, texture: 'knot/d_glow.png',
        blend: BlendMode.ADD, color: rgba(0xFF, 0xFF, 0xFF, 0x00) }
    ]
}
const entityMap: { [key: string]: number } = Object.create(null)

export function createPuzzleKnot(
    manager: EntityManager, type: PuzzleKnotType, x: number, y: number, size: number,
    particles: (knot: PuzzleKnot) => void,
    sound: (knot: PuzzleKnot, animation: PuzzleKnotAnimation) => void
): number {
    const entity = manager.createEntity()
    manager.createComponent(entity, Transform2D, {
        position: vec2(x, y),
        scale: vec2(type === PuzzleKnotType.ENTRY || size != 1 ? size : randomFloat(0.86, 1, rng))
    })
    manager.createComponent(entity, PuzzleKnot, type)

    background: {
        const variant = randomInt(0, 3, rng)
        const background = manager.createEntity()
        manager.createComponent(background, Transform2D, { parent: entity, rotation: variant != 2 ? randomFloat(0, 2 * Math.PI, rng) : 0 })
        manager.createComponent(background, Material, { program: 0, blend: BlendMode.NORMAL, texture: `knot/back_${variant}.png` })
        manager.createComponent(background, Sprite2D, { origin: Sprite2D.CENTER, order: Layer.BACKGROUND - 8 })
    }

    const highlight = entityMap['highlight'] = manager.createEntity()
    manager.createComponent(highlight, Transform2D, { parent: entity })
    manager.createComponent(highlight, Material, {
        program: 0, blend: BlendMode.ADD, texture: `effects/highlight.png`, color: rgba(0xFF, 0xFF, 0xFF, 0x00)
    })
    manager.createComponent(highlight, Sprite2D, { origin: Sprite2D.CENTER, order: Layer.EFFECTS })

    parts[type].forEach(({ key, order, texture, blend = BlendMode.NORMAL, color, rotation = 0 }) => {
        const part = entityMap[key] = manager.createEntity()
        manager.createComponent(part, Transform2D, { parent: entity, rotation })
        manager.createComponent(part, Material, { program: 0, blend: blend, texture, color })
        manager.createComponent(part, Sprite2D, { origin: Sprite2D.CENTER, order })
    })

    const animationContext = manager.aquireComponent(entity, PuzzleKnot) as PuzzleKnot
    const animationTimelines = animations[type].map(<T>({ target, property, animations }: AnimationBlueprint<T>) => bindAnimationProperty(
        manager, entityMap[target], property, animations, animationContext
    ))
    animationTimelines.push(bindAnimationTrigger(manager, () => particles(animationContext), {
        [PuzzleKnotAnimation.ENABLE]: One
    }) as any)
    animationTimelines.push(bindAnimationTrigger(manager, () => sound(animationContext, PuzzleKnotAnimation.ENABLE), {
        [PuzzleKnotAnimation.ENABLE]: One
    }) as any)
    animationTimelines.push(bindAnimationTrigger(manager, () => sound(animationContext, PuzzleKnotAnimation.CLOSE), {
        [PuzzleKnotAnimation.CLOSE]: One
    }) as any)
    animationTimelines.push(bindAnimationTrigger(manager, () => sound(animationContext, PuzzleKnotAnimation.OPEN), {
        [PuzzleKnotAnimation.OPEN]: One
    }) as any)
    manager.createComponent(entity, AnimationMixer, animationTimelines)

    return entity
}