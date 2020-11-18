import { DataView } from 'framework'
import { vec2, rgba, snapToGrid } from 'math'
import { Transform2D } from 'scene'
import { EditorSubSystem, IEditorUpdateContext, HTMLNode } from './editor'

export class EntitySelector extends EditorSubSystem {
    private readonly transforms: DataView<Transform2D> = this.manager.aquireDataView<Transform2D>(Transform2D)
    private readonly prevPosition: vec2 = vec2()
    private context: IEditorUpdateContext
    readonly key: string = 'select'
    update(context: IEditorUpdateContext){
        this.context = context
        this.graphics.clear()
        if(!this.enabled) return
        const targetEntity = this.queryEntity(context.worldPosition)
        
        if(context.trigger){
            vec2.copy(context.worldPosition, this.prevPosition)
            context.selectedEntity = targetEntity
            if(context.selectedEntity){
                const transform = this.manager.aquireComponent(context.selectedEntity, Transform2D) as Transform2D
                vec2.subtract(this.prevPosition, transform.localPosition, this.prevPosition)
            }
        }else if(context.pressed && context.selectedEntity){
            const transform = this.manager.aquireComponent(context.selectedEntity, Transform2D) as Transform2D
            vec2.subtract(context.worldPosition, this.prevPosition, transform.localPosition)
            if(EditorSubSystem.gridSize) snapToGrid(transform.localPosition, EditorSubSystem.gridSize, transform.localPosition)
            transform.lastFrame = -1
        }

        this.menu.entity['value'] = context.selectedEntity
    }
    queryEntity(worldPosition: vec2){
        const transforms: Transform2D[] = this.transforms.data as any
        let index: number, minDistance = Infinity
        for(let transform: Transform2D, i = 0; transform = transforms[i]; i++){
            const tx = transform.globalTransform[4]
            const ty = transform.globalTransform[5]
            let dx = tx - worldPosition[0]
            let dy = ty - worldPosition[1]
            const distanceSquared = dx*dx + dy*dy
            if(distanceSquared >= minDistance) continue
            minDistance = distanceSquared
            index = i
        }
        const transform = transforms[index]
        if(transform) this.graphics
            .setTransform(transform.globalTransform)
            .beginPath(-1024, 0).lineTo(1024, 0).stroke(rgba(0x00,0xFF,0x00,0xFF),4)
            .beginPath(0, -1024).lineTo(0, 1024).stroke(rgba(0x00,0xFF,0x00,0xFF),4)

        return transform.entity
    }
    buildMenu(){
        this.menu.entity = HTMLNode('input', { type: 'number', disabled: true, min: 0, max: 1e6 })
        const { manager, context } = this

        return [HTMLNode('div', { className: 'vertical' }, [
            HTMLNode('div', { className: 'horizontal', innerText: 'Entity: ' }, [this.menu.entity]),
            HTMLNode('button', { innerText: 'create' }, null, {
                click(event: Event){
                    context.selectedEntity = manager.createEntity()
                }
            }),
            HTMLNode('button', { innerText: 'delete' }, null, {
                click(event: Event){
                    if(!context.selectedEntity) return
                    manager.removeEntity(context.selectedEntity)
                    context.selectedEntity = 0
                }
            })
        ])]
    }
}