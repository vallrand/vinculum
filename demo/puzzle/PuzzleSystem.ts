import { DisjointSet, Stream } from 'common'
import { vec2, mat3x2, rgb, rgba, lerp, step, ease } from 'math'
import { ProcedureSystem, EntityManager, IUpdateContext, DataView } from 'framework'
import { Transform2D, AnimationMixer, KeyframeSampler, ParticleEmitter } from 'scene'
import { Material, BlendMode, Curve, Mesh2D, Sprite2D } from 'renderer'
import { AudioSource } from 'audio'

import { Layer, Tree } from '../terrain'
import { RevealSystem } from '../effects'
import { PuzzleKnotType, PuzzleKnotState, PuzzleKnotAnimation } from './constants'
import { PuzzleKnot } from './PuzzleKnot'
import { createPuzzleKnot } from './createPuzzleKnot'
import { PuzzleWire } from './PuzzleWire'
import { animateWire } from './animateWire'
import { activateParticles } from './activateParticles'
import { wireSoundEffect, activateSoundEffect } from './activateSoundEffect'
import { drawGlyph } from './drawGlyph'
import { createShockwave, createGlitch } from '../effects'
import { createTree } from './createTree'

export interface PuzzleSetup {
    knots: Array<[PuzzleKnotType,number,number,number,boolean]>
    wires: Array<[number, number]>
}

export class PuzzleSystem extends ProcedureSystem {
    private static readonly segmentLength: number = 20
    readonly priority: number = -0x20
    private readonly knots: DataView<PuzzleKnot> = this.manager.aquireDataView<PuzzleKnot>(PuzzleKnot)
    private readonly wires: DataView<PuzzleWire> = this.manager.aquireDataView<PuzzleWire>(PuzzleWire)
    private readonly pairs: Uint16Array
    public readonly enableKnotEvent: Stream<PuzzleKnot> = new Stream
    private hover: number = null
    constructor(manager: EntityManager, { knots, wires }: PuzzleSetup){
        super(manager)
        
        const particles: (knot: PuzzleKnot) => void = activateParticles(this.manager)
        const sound: (knot: PuzzleKnot, animation: PuzzleKnotAnimation) => void = activateSoundEffect(this.manager)
        const shockwave = createShockwave(this.manager)
        const glitch = createGlitch(this.manager)

        this.enableKnotEvent.subscribe((knot: PuzzleKnot) => {
            if(knot.type != PuzzleKnotType.ENTRY) return
            const transform = this.manager.aquireComponent<Transform2D>(knot.entity, Transform2D)
            shockwave(transform.localPosition)
        })

        this.enableKnotEvent.subscribe((enabledKnot: PuzzleKnot) => {
            if(enabledKnot.tree){
                this.manager.aquireComponent<Tree>(enabledKnot.tree, Tree).growth = 1
                glitch(2)
                this.manager.aquireComponent<ParticleEmitter>(enabledKnot.particles, ParticleEmitter).options.spawnAmount = 1
                this.manager.aquireComponent<AudioSource>(enabledKnot.tree, AudioSource).play()
            }
        })

        const size = knots.length
        const set: DisjointSet = new DisjointSet().allocate(size)
        const knotList: PuzzleKnot[] = this.knots.data as any
        for(let i = 0; i < knots.length; i++){
            let [ type, x, y, size, growTree ] = knots[i]
            let entity = createPuzzleKnot(this.manager, type, x, y + lerp(200, 0, size), size, particles, sound)
            const knot = this.manager.aquireComponent(entity, PuzzleKnot) as PuzzleKnot
            if(!growTree) continue

            attach: {
                const { tree, particles } = createTree(this.manager, x, y)
                knot.tree = tree
                knot.particles = particles
            }
        }
        this.pairs = new Uint16Array(size * size)
        for(let i = 0; i < wires.length; i++){
            let [ i0, i1 ] = wires[i]
            let entity = this.manager.createEntity()
            if(!knotList[i0] || !knotList[i1]) throw new Error(`Failed to connect [${i0},${i1}]`)
            if(knotList[i0].type !== PuzzleKnotType.ENTRY) set.join(i0, i1)
            const wire = this.manager.createComponent(entity, PuzzleWire, {
                entities: [knotList[i0].entity, knotList[i1].entity],
                indices: [i0, i1]
            }) as PuzzleWire
            this.manager.createComponent(entity, Material, {
                program: 0, blend: BlendMode.NORMAL, texture: 'knot/wire.png', color: rgba(0x7F, 0x7F, 0x7F, 0xFF)
            })
            this.manager.createComponent(entity, Curve, {
                order: -8, smoothness: 1, path: []
            })

            let index = this.wires.lookupIndex(entity, wire.timeframe)
            this.pairs[i0 * size + i1] = this.pairs[i1 * size + i0] = index
        }

        for(let i = 0; i < size; i++){
            knotList[i].group = set.find(i)
        }

        knotList[0].setState(PuzzleKnotState.OPENED)
        knotList.filter(knot => knot.type === PuzzleKnotType.ENTRY)[11].setState(PuzzleKnotState.OPENED)
    }
    execute(context: IUpdateContext){
        this.updateWires(context.deltaTime, context.frame)
    }
    private updateWires(deltaTime: number, frame: number){
        const knots: PuzzleKnot[] = this.knots.data as any
        const wires: PuzzleWire[] = this.wires.data as any
        for(let wire: PuzzleWire, i = 0; wire = wires[i]; i++){
            const entityA = wire.pair[0]
            const entityB = wire.pair[1]
            const transformA = this.manager.aquireComponent<Transform2D>(entityA, Transform2D, wire.timeframe)
            const transformB = this.manager.aquireComponent<Transform2D>(entityB, Transform2D, wire.timeframe)
            if(!transformA || !transformB) continue

            const curve = this.manager.aquireComponent(wire.entity, Curve) as Curve
            const latestFrame = Math.max(transformA.lastFrame, transformB.lastFrame)

            const stateA: PuzzleKnotState = knots[wire.indices[0]].state
            const stateB: PuzzleKnotState = knots[wire.indices[1]].state
            let targetAmplitude = stateA === PuzzleKnotState.OPENED || stateB === PuzzleKnotState.OPENED ? 1 : 0
            const idle = !wire.amplitude && !targetAmplitude
            wire.amplitude = lerp(wire.amplitude, targetAmplitude, 0.1)

            if(wire.lastFrame < latestFrame){
                wire.lastFrame = latestFrame
                const length = wire.updatePath(
                    transformA.globalTransform,
                    transformB.globalTransform,
                    PuzzleSystem.segmentLength
                )
                const material = this.manager.aquireComponent<Material>(wire.entity, Material)
                curve.uvScale[0] = Math.min(1, length / material.diffuse.width)
                curve.lastTextureIndex = -1
            }else if(curve.lastRenderFrame > 0 && curve.lastRenderFrame !== frame - 1 || idle) continue
            const path: vec2[] = wire.animatePath(deltaTime)
            curve.path = path
        }
    }
    updatePuzzle(targetTransform: mat3x2, radius: number, trigger: boolean): boolean {
        let index: number, minDistance = radius * radius
        const knots: PuzzleKnot[] = this.knots.data as any
        for(let knot: PuzzleKnot, i = 0; knot = knots[i]; i++){
            if(knot.state !== PuzzleKnotState.OPENED && !(knot.type === PuzzleKnotType.ENTRY && knot.state === PuzzleKnotState.ENABLED)) continue
            let transform = this.manager.aquireComponent<Transform2D>(knot.entity, Transform2D)
            let dx = targetTransform[4] - transform.globalTransform[4]
            let dy = targetTransform[5] - transform.globalTransform[5]
            let distanceSquared = dx * dx + dy * dy
            if(distanceSquared >= minDistance) continue
            minDistance = distanceSquared
            index = i
        }
        if(this.hover !== index){
            if(this.hover != null) this.toggleHighlight(this.hover, false)
            if(index != null) this.toggleHighlight(index, true)
            this.hover = index
        }

        if(index == null) return false

        if(!trigger) return false

        const states: PuzzleKnotState[] = knots.map(knot => knot.state)
        const forward = knots[index].state !== PuzzleKnotState.ENABLED
        if(forward) this.advance(index, knots, this.pairs as any, states)
        else this.retreat(index, knots, this.pairs as any, states)
        
        scheduleAnimations: for(let i = 0; i < knots.length; i++){
            const neighbour = this.pairs[index + i * knots.length]

            if(!forward){
                knots[i].setState(states[i], 0)
                if(i === index) this.enableKnotEvent.dispatch(knots[i])
                if(states[i] === PuzzleKnotState.CLOSED){
                    knots[i].references.forEach(entity => this.manager.removeEntity(entity))
                    knots[i].references.length = 0
                    if(knots[i].tree) this.manager.aquireComponent<Tree>(knots[i].tree, Tree).growth = 0
                    if(knots[i].particles) this.manager.aquireComponent<ParticleEmitter>(knots[i].particles, ParticleEmitter).options.spawnAmount = 0
                    if(knots[i].type === PuzzleKnotType.ENTRY)
                    this.manager.resolveSystem(RevealSystem).toggleBlock(knots[i].group, false)
                } 
                continue
            }

            if(knots[i].state !== PuzzleKnotState.ENABLED && states[i] === PuzzleKnotState.ENABLED){
                this.enableKnotEvent.dispatch(knots[i])
                if(knots[i].type === PuzzleKnotType.ENTRY){
                    drawGlyph(this.manager, knots[i])
                    this.manager.resolveSystem(RevealSystem).toggleBlock(knots[i].group, true)
                }
            }

            if(i === index){
                knots[i].setState(states[i], 0)
                const transform = this.manager.aquireComponent<Transform2D>(knots[i].entity, Transform2D)
                wireSoundEffect(this.manager, transform.localPosition)
            }else if(neighbour){
                const wire: PuzzleWire = this.wires.data.get(neighbour)
                animateWire(this.manager, wire, wire.pair[0] !== knots[i].entity)

                knots[i].setState(states[i], 1)
            }else if(states[i] === PuzzleKnotState.ENABLED){
                knots[i].setState(states[i], 1)
            }else{
                knots[i].setState(states[i], 2)
                if(knots[i].tree) this.manager.aquireComponent<Tree>(knots[i].tree, Tree).growth = 0
                if(knots[i].particles) this.manager.aquireComponent<ParticleEmitter>(knots[i].particles, ParticleEmitter).options.spawnAmount = 0
            }

        }
        return true
    }
    private toggleHighlight(index: number, value: boolean): void {
        const knots: PuzzleKnot[] = this.knots.data as any
        const knot = knots[index]
        const animations = this.manager.aquireComponent<AnimationMixer>(knot.entity, AnimationMixer)
        const transition = 0.2
        if(value){
            if(knot.state !== PuzzleKnotState.OPENED) return
            animations.createAnimation(PuzzleKnotAnimation.HIGHLIGHT).start(0, transition)

            for(let i = 0; i < knots.length; i++){
                const neighbour = this.pairs[index + i * knots.length]
                if(!neighbour) continue
                const wire: PuzzleWire = this.wires.data.get(neighbour)
                let material = this.manager.aquireComponent<Material>(wire.entity, Material)
                rgb.copy([0x36,0x00,0x00], material.tint)
            }
        }else{
            const highlight = animations.tracks.find(track => track.key === PuzzleKnotAnimation.HIGHLIGHT)
            if(highlight) highlight.end(transition, transition)

            for(let i = 0; i < knots.length; i++){
                const neighbour = this.pairs[this.hover + i * knots.length]
                if(!neighbour) continue
                const wire: PuzzleWire = this.wires.data.get(neighbour)
                let material = this.manager.aquireComponent<Material>(wire.entity, Material)
                rgb.copy(rgb.BLACK, material.tint)
            }
        }
    }
    private retreat(index: number, knots: PuzzleKnot[], pairs: boolean[], states: PuzzleKnotState[]){
        for(let i = 0; i < knots.length; i++){
            const neighbour = pairs[index + i * knots.length]
            if(knots[i].group > knots[index].group)
                states[i] = neighbour ? PuzzleKnotState.OPENED : PuzzleKnotState.CLOSED
        }
    }
    private advance(index: number, knots: PuzzleKnot[], pairs: boolean[], states: PuzzleKnotState[]){
        const length = knots.length
        if(states[index] !== PuzzleKnotState.OPENED) return
        states[index] = knots[index].type === PuzzleKnotType.TOGGLE ? PuzzleKnotState.CLOSED : PuzzleKnotState.ENABLED

        for(let i = 0; i < length; i++){
            const flag = pairs[index + i * length]
            switch(knots[i].type){
                case PuzzleKnotType.ENTRY:
                case PuzzleKnotType.SINGLE:
                    if(states[i] === PuzzleKnotState.ENABLED) continue
                    states[i] = flag ? PuzzleKnotState.OPENED : PuzzleKnotState.CLOSED
                    break
                case PuzzleKnotType.REGROW:
                    if(states[i] === PuzzleKnotState.ENABLED) continue
                    if(i === index) states[i] = PuzzleKnotState.CLOSED
                    if(!flag) continue
                    states[i] = PuzzleKnotState.OPENED
                    break
                case PuzzleKnotType.TOGGLE:
                    if(!flag) continue
                    if(states[i] === PuzzleKnotState.CLOSED) states[i] = PuzzleKnotState.OPENED
                    else if(states[i] === PuzzleKnotState.OPENED) states[i] = PuzzleKnotState.CLOSED
            }
        }
        const tempStates: PuzzleKnotState[] = states.slice()
        regrow: for(let i = 0; i < length; i++){
            if(knots[i].type !== PuzzleKnotType.REGROW) continue
            if(pairs[index + i * length]) continue
            for(let j = 0; j < length; j++)
                if(pairs[i + j * length] && tempStates[j] === PuzzleKnotState.CLOSED){
                    states[i] = PuzzleKnotState.CLOSED
                    break
                }
        }
        seal: for(let i = 0; i < length; i++){
            if(knots[i].type !== PuzzleKnotType.REGROW) continue
            for(let j = 0; j < length; j++)
                if(pairs[i + j * length] && tempStates[j] === PuzzleKnotState.CLOSED)
                    continue seal
            if(states[i] !== PuzzleKnotState.CLOSED)
                states[i] = PuzzleKnotState.ENABLED
        }
        const groups = Array(length).fill(true)
        for(let i = 0; i < length; i++){
            const group = knots[i].group
            const completed = (
                states[i] === PuzzleKnotState.ENABLED ||
                states[i] === PuzzleKnotState.OPENED && knots[i].type === PuzzleKnotType.TOGGLE
            )
            groups[group] = groups[group] && completed
        }
        for(let i = 0; i < length; i++){
            if(knots[i].type !== PuzzleKnotType.TOGGLE) continue
            const group = knots[i].group
            if(groups[group]) states[i] = PuzzleKnotState.ENABLED
        }

        if(index === 111){
            states[114] = PuzzleKnotState.OPENED
        }
    }
}