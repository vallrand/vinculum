import { vec2, rgba, snapToGrid } from 'math'
import { Transform2D } from 'scene'

import { EditorSubSystem, IEditorUpdateContext, HTMLNode } from './editor'
import { PuzzleKnot, PuzzleWire, PuzzleSystem, PuzzleKnotType } from '../../demo/puzzle'

export class PuzzleCreator extends EditorSubSystem {
    private static readonly colors = {
        [PuzzleKnotType.ENTRY]: rgba(120,210,180,100),
        [PuzzleKnotType.SINGLE]: rgba(200,67,67,100),
        [PuzzleKnotType.REGROW]: rgba(20,180,80,100),
        [PuzzleKnotType.TOGGLE]: rgba(230,210,80,100),
        4: rgba(30,20,180,100)
    }
    public static readonly MODES = {
        ENTRY: PuzzleKnotType.ENTRY,
        SINGLE: PuzzleKnotType.SINGLE,
        REGROW: PuzzleKnotType.REGROW,
        TOGGLE: PuzzleKnotType.TOGGLE,
        WIRE: 4
    }
    visible: boolean = false
    readonly key: string = 'puzzle'
    mode: number = PuzzleCreator.MODES.ENTRY

    update(context: IEditorUpdateContext){
        this.graphics.clear()
        const knots: PuzzleKnot[] = this.manager.resolveSystem<any>(PuzzleSystem).knots.data
        const wires: PuzzleWire[] = this.manager.resolveSystem<any>(PuzzleSystem).wires.data

        if(this.visible)
        for(let wire: PuzzleWire, i = 0; wire = wires[i]; i++){
            let transformA = this.manager.aquireComponent<Transform2D>(wire.pair[0], Transform2D)
            let transformB = this.manager.aquireComponent<Transform2D>(wire.pair[1], Transform2D)
            this.graphics
            .beginPath(transformA.localPosition[0], transformA.localPosition[1])
            .lineTo(transformB.localPosition[0], transformB.localPosition[1])
            .stroke(PuzzleCreator.colors[4], 8)
        }

        const radius = 64
        if(this.visible)
        for(let knot: PuzzleKnot, i = 0; knot = knots[i]; i++){
            let transform = this.manager.aquireComponent<Transform2D>(knot.entity, Transform2D)
            this.graphics
            .beginPath(transform.localPosition[0], transform.localPosition[1] - radius)
            .lineTo(transform.localPosition[0] + radius, transform.localPosition[1])
            .lineTo(transform.localPosition[0], transform.localPosition[1] + radius)
            .lineTo(transform.localPosition[0] - radius, transform.localPosition[1])
            .closePath()
            .fill(PuzzleCreator.colors[knot.type])
        }

        if(!context.camera || !this.enabled) return

        if(context.selectedEntity){
            let transform = this.manager.aquireComponent<Transform2D>(context.selectedEntity, Transform2D)
            this.graphics.beginPath(transform.localPosition[0], transform.localPosition[1])
            .lineTo(context.worldPosition[0], context.worldPosition[1])
            .stroke(rgba.WHITE, 8)
        }

        let index: number, minDistance = 4 * radius * radius
        for(let knot: PuzzleKnot, i = 0; knot = knots[i]; i++){
            let transform = this.manager.aquireComponent<Transform2D>(knot.entity, Transform2D)
            let distanceSquared = vec2.distanceSquared(transform.localPosition, context.worldPosition)
            if(distanceSquared >= minDistance) continue
            minDistance = distanceSquared
            index = i
        }

        switch(this.mode){
            case PuzzleCreator.MODES.ENTRY:
            case PuzzleCreator.MODES.SINGLE:
            case PuzzleCreator.MODES.REGROW:
            case PuzzleCreator.MODES.TOGGLE: {
                if(context.trigger && index != null){
                    knots[index].type = this.mode
                }else if(context.trigger){
                    if(EditorSubSystem.gridSize) snapToGrid(context.worldPosition, EditorSubSystem.gridSize, context.worldPosition)
                    const knot = this.manager.createEntity()
                    this.manager.createComponent(knot, Transform2D, { position: context.worldPosition })
                    this.manager.createComponent(knot, PuzzleKnot, this.mode)
                }
                break
            }
            case PuzzleCreator.MODES.WIRE: {
                if(context.trigger && index != null){
                    context.selectedEntity = knots[index].entity
                }else if(context.release && context.selectedEntity){
                    if(index != null && context.selectedEntity !== knots[index].entity &&
                        wires.every(wire => !(
                            wire.pair[0] === context.selectedEntity && wire.pair[1] === knots[index].entity ||
                            wire.pair[1] === context.selectedEntity && wire.pair[0] === knots[index].entity
                        ))
                    ){
                        const wire = this.manager.createEntity()
                        this.manager.createComponent(wire, PuzzleWire, [context.selectedEntity, knots[index].entity])
                    }
                    context.selectedEntity = 0
                }
                break
            }
        }

        this.menu.entity['value'] = context.selectedEntity
    }
    buildMenu(){
        this.menu.entity = HTMLNode('input', { type: 'number', disabled: true, min: 0, max: 1e6 })

        return [HTMLNode('div', { className: 'vertical' }, [
            HTMLNode('div', { className: 'horizontal', innerText: 'Show: ' }, [
                HTMLNode('input', { type: 'checkbox', checked: this.visible }, null, {
                    change: (event: Event) => {
                        this.visible = (event.target as HTMLInputElement).checked
                    }
                })
            ]),
            HTMLNode('div', { className: 'horizontal', innerText: 'Entity: ' }, [this.menu.entity]),
            HTMLNode('div', { className: 'horizontal', innerText: 'Shape: ' }, [
                HTMLNode('select', {}, Object.keys(PuzzleCreator.MODES).map(key => (
                    HTMLNode('option', { innerText: key, value: PuzzleCreator.MODES[key] })
                )), {
                    change: (event: Event) => {
                        const value = (event.target as HTMLSelectElement).value
                        this.mode = +value
                    }
                })
            ])
        ])]
    }
    print(): string {
        const system = this.manager.resolveSystem(PuzzleSystem) as any
        const knots: PuzzleKnot[] = this.manager.resolveSystem<any>(PuzzleSystem).knots.data
        const wires: PuzzleWire[] = this.manager.resolveSystem<any>(PuzzleSystem).wires.data

        const knotList = knots.map((knot, i) => ({
            i, type: knot.type, distance: null, entity: knot.entity,
            position: (this.manager.aquireComponent(knot.entity, Transform2D) as Transform2D).localPosition
        }))

        for(let lastIndex = 0, i = 0; i < knotList.length; i++){
            if(knotList[i].distance != null) continue
            knotList[i].distance = lastIndex
            const stack = [knotList[i]]
            while(stack.length){
                let knot = stack.pop()
                for(let j = 0; j < knotList.length; j++){
                    if(!system.pairs[knot.i + j * knotList.length]) continue
                    if(knotList[j].distance != null && knotList[j].distance <= knot.distance + 1) continue
                    knotList[j].distance = knot.distance + 1
                    lastIndex = Math.max(lastIndex, knot.distance + 2)
                    stack.push(knotList[j])
                }
            }
            i = Math.max(i, 305)
        }
        knotList.sort((a, b) => a.distance - b.distance)
        console.log(knotList)

        return JSON.stringify({
            knots: knotList.map(knot => [
                knot.type,
                ...knot.position
            ]),
            wires: wires.map(wire => [
                knotList.findIndex(knot => knot.entity === wire.pair[0]),
                knotList.findIndex(knot => knot.entity === wire.pair[1])
            ]).sort((a, b) => a[0] - b[0])
        },null,0)
    }
}