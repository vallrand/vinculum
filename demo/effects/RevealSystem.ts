import { vec2, rgba, AABB, lerp, clamp, smoothstep } from 'math'
import { ProcedureSystem, EntityManager, IUpdateContext, DataView } from 'framework'
import { Transform2D, Camera2D, AnimationMixer, StaticSampler } from 'scene'
import { PhysicsSystem, RigidBody, BodyType, ShapeType, Line, Box, Convex, Gravity } from 'physics'
import { ShaderMaterial, ShaderMaterialOptions, BlendMode, Renderer2DSystem, Sprite2D, Material } from 'renderer'
import { GL, GLContext } from 'renderer/gl'

import { AnimationProperty, bindAnimationProperty } from '../helpers'
import { Layer } from '../terrain'

export type RevealSetup = Array<[AABB, number]>

const disableBlockAnimation = '0'
export class RevealSystem extends ProcedureSystem {
    private readonly globalAttributes = {
        uTime: 0
    }
    private readonly blocks: number[][] = []

    constructor(manager: EntityManager, blocks: RevealSetup){
        super(manager)

        for(let i = 0; i < blocks.length; i++){
            const [ aabb, group ] = blocks[i]
            const entity = manager.createEntity()
            manager.createComponent(entity, Transform2D, {
                position: vec2(0.5 * (aabb[0] + aabb[2]), 0.5 * (aabb[1] + aabb[3])),
                scale: vec2(aabb[2] - aabb[0], aabb[3] - aabb[1])
            })
            manager.createComponent(entity, RigidBody, {
                mass: 0, type: BodyType.STATIC,
                shapes: [new Box(vec2.ZERO, 0, aabb[2] - aabb[0], aabb[3] - aabb[1])]
            })
            manager.createComponent(entity, Sprite2D, {
                order: Layer.EFFECTS + 128,
                origin: Sprite2D.CENTER
            })
            manager.createComponent(entity, ShaderMaterial, {
                program: 1,
                blend: BlendMode.NORMAL,
                vertexSource: <string> require('./block_vert.glsl'),
                fragmentSource: <string> require('./block_frag.glsl'),
                attributes: this.globalAttributes
            })
            manager.createComponent(entity, AnimationMixer, [
                bindAnimationProperty(manager, entity, AnimationProperty.color, {
                    [disableBlockAnimation]: StaticSampler<rgba>(rgba(0xFF, 0xFF, 0xFF, 0x00))
                })
            ])
            this.blocks[group] = this.blocks[group] || []
            this.blocks[group].push(entity)
        }
    }
    toggleBlock(group: number, toggle: boolean){
        const blocks = this.blocks[group]
        if(!blocks) return
        for(let i = 0; i < blocks.length; i++){
            const entity = blocks[i]
            if(toggle){
                this.manager.aquireComponent<RigidBody>(entity, RigidBody).collisionResponse = false
                this.manager.aquireComponent<AnimationMixer>(entity, AnimationMixer)
                .createAnimation(disableBlockAnimation)
                .start(2, 2)
            }else{
                this.manager.aquireComponent<RigidBody>(entity, RigidBody).collisionResponse = true
                this.manager.aquireComponent<AnimationMixer>(entity, AnimationMixer).tracks
                .forEach(track => track.end(0.5, 0.5))
            }
        }
    }
    execute(context: IUpdateContext): void {
        this.globalAttributes.uTime += context.deltaTime
    }
}