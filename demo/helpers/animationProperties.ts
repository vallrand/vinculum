import { Zero, One } from 'common/static'
import { ease, step, lerp, lerpAngle, rgb, rgba, vec2 } from 'math'
import { Transform2D, ParticleEmitter } from 'scene'
import { Sprite2D, Material, TextureResource } from 'renderer'

import { AnimationPropertyBlueprint } from './animationBinders'

export const AnimationProperty = {
    x: <AnimationPropertyBlueprint<Transform2D, number>> {
        component: Transform2D,
        interpolate: lerp,
        initial(target: Transform2D): number { return target.localPosition[0] },
        set(target: Transform2D, value: number): void {
            if(target.localPosition[0] === value) return
            target.localPosition[0] = value
            target.lastFrame = -1
        }
    },
    y: <AnimationPropertyBlueprint<Transform2D, number>> {
        component: Transform2D,
        interpolate: lerp,
        initial(target: Transform2D): number { return target.localPosition[1] },
        set(target: Transform2D, value: number): void {
            if(target.localPosition[1] === value) return
            target.localPosition[1] = value
            target.lastFrame = -1
        }
    },
    rotation: <AnimationPropertyBlueprint<Transform2D, number>> {
        component: Transform2D,
        interpolate: lerpAngle,
        initial(target: Transform2D): number { return target.localRotation },
        set(target: Transform2D, value: number): void {
            if(target.localRotation === value) return
            target.localRotation = value
            target.lastFrame = -1
        }
    },
    scaleX: <AnimationPropertyBlueprint<Transform2D, number>> {
        component: Transform2D,
        interpolate: lerp,
        initial(target: Transform2D): number { return target.localScale[0] },
        set(target: Transform2D, value: number): void {
            if(target.localScale[0] === value) return
            target.localScale[0] = value
            target.lastFrame = -1
        }
    },
    scaleY: <AnimationPropertyBlueprint<Transform2D, number>> {
        component: Transform2D,
        interpolate: lerp,
        initial(target: Transform2D): number { return target.localScale[1] },
        set(target: Transform2D, value: number): void {
            if(target.localScale[1] === value) return
            target.localScale[1] = value
            target.lastFrame = -1
        }
    },
    position: <AnimationPropertyBlueprint<Transform2D, vec2>> {
        component: Transform2D,
        interpolate: vec2.lerp,
        prev: vec2(), next: vec2(),
        initial(target: Transform2D): vec2 { return vec2.copy(target.localPosition, vec2()) },
        set(target: Transform2D, value: vec2): void {
            if(target.localPosition[0] === value[0] && target.localPosition[1] === value[1]) return
            vec2.copy(value, target.localPosition)
            target.lastFrame = -1
        }
    },
    scale: <AnimationPropertyBlueprint<Transform2D, vec2>> {
        component: Transform2D,
        interpolate: vec2.lerp,
        prev: vec2(), next: vec2(),
        initial(target: Transform2D): vec2 { return vec2.copy(target.localScale, vec2()) },
        set(target: Transform2D, value: vec2): void {
            if(target.localScale[0] === value[0] && target.localScale[1] === value[1]) return
            vec2.copy(value, target.localScale)
            target.lastFrame = -1
        }
    },
    originX: <AnimationPropertyBlueprint<any, number>> {
        component: Sprite2D,
        interpolate: lerp,
        initial(target: Sprite2D): number { return target.origin[0] },
        set(target: Sprite2D, value: number): void {
            if(target.origin[0] === value) return
            target.origin[0] = value
            target.lastFrame = -1
        }
    },
    originY: <AnimationPropertyBlueprint<any, number>> {
        component: Sprite2D,
        interpolate: lerp,
        initial(target: Sprite2D): number { return target.origin[1] },
        set(target: Sprite2D, value: number): void {
            if(target.origin[1] === value) return
            target.origin[1] = value
            target.lastFrame = -1
        }
    },
    opacity: <AnimationPropertyBlueprint<Material, number>> {
        component: Material,
        interpolate: lerp,
        initial(target: Material): number { return target.color[3] / 0xFF },
        set(target: Material, value: number): void { target.color[3] = value * 0xFF }
    },
    color: <AnimationPropertyBlueprint<Material, rgba>> {
        component: Material,
        interpolate: rgba.lerp,
        prev: rgba(), next: rgba(),
        initial(target: Material): rgba { return rgba.copy(target.color, rgba()) },
        set(target: Material, value: rgba): void { rgba.copy(value, target.color) }
    },
    tint: <AnimationPropertyBlueprint<Material, rgb>> {
        component: Material,
        interpolate: rgb.lerp,
        prev: rgb(), next: rgb(),
        initial(target: Material): rgb { return rgb.copy(target.tint, rgb()) },
        set(target: Material, value: rgb): void { rgb.copy(value, target.tint) }
    },
    diffuse: <AnimationPropertyBlueprint<Material, TextureResource>> {
        component: Material,
        interpolate: step,
        initial(target: Material): TextureResource { return target.diffuse },
        set(target: Material, value: TextureResource): void { target.diffuse = value }
    },
    spawnAmount: <AnimationPropertyBlueprint<ParticleEmitter, number>> {
        component: ParticleEmitter,
        interpolate: lerp,
        initial(target: ParticleEmitter): number { return target.options.spawnAmount },
        set(target: ParticleEmitter, value: number): void { target.options.spawnAmount = Math.round(value) }
    }
}