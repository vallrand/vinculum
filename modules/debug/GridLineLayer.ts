import { vec2, rgba, mod } from 'math'
import { Camera2D } from 'scene'
import { EditorSubSystem, IEditorUpdateContext, HTMLNode } from './editor'

export class GridLineLayer extends EditorSubSystem {
    public readonly gridSize: vec2 = vec2(64, 64)
    public readonly gridColor: rgba = rgba(0x7F, 0x7F, 0x7F, 0xFF)

    private visible: boolean = false
    readonly key: string = 'grid'
    update(context: IEditorUpdateContext){
        if(!this.visible || !context.camera) return this.graphics.clear()

        const camera = this.manager.aquireComponent<Camera2D>(context.camera, Camera2D)
        if(this.graphics.lastFrame > camera.lastFrame && camera.lastFrame != -1) return

        let cellWidth = this.gridSize[0], cellHeight = this.gridSize[1]
        if(!cellWidth || !cellHeight) return this.graphics.clear()
        const maxCells = Math.max(camera.viewport[0] / cellWidth, camera.viewport[1] / cellHeight)
        const mergeCells = Math.max(1, maxCells / 32 | 0)
        cellWidth *= mergeCells
        cellHeight *= mergeCells
        
        const left = camera.bounds[0], top = camera.bounds[1],
        right = camera.bounds[2], bottom = camera.bounds[3]
        const offsetX = mod(left, cellWidth)
        const offsetY = mod(top, cellHeight)

        this.graphics.clear()
        vertical: for(let x = left - offsetX; x <= right; x += cellWidth)
            this.graphics.beginPath(x, top).lineTo(x, bottom).stroke(this.gridColor, context.pixelWidth)
        horizontal: for(let y = top - offsetY; y <= bottom; y += cellHeight)
            this.graphics.beginPath(left, y).lineTo(right, y).stroke(this.gridColor, context.pixelHeight)
    }
    buildMenu(){
        return [HTMLNode('div', { className: 'vertical', style: { alignItems: 'flex-end' } }, [
            HTMLNode('div', { className: 'horizontal', innerText: 'Show: ' }, [
                HTMLNode('input', { type: 'checkbox', checked: this.visible }, null, {
                    change: (event: Event) => {
                        this.visible = (event.target as HTMLInputElement).checked
                        this.graphics.lastFrame = -1
                    }
                })
            ]),
            HTMLNode('div', { className: 'horizontal', innerText: 'Grid: ' }, [
                HTMLNode('input', { type: 'number', min: 0, max: 100, step: 1, value: 0 }, null, {
                    change: (event: Event) => {
                        const value = +(event.target as HTMLInputElement).value
                        EditorSubSystem.gridSize = value
                        vec2.fromValues(value, value, this.gridSize)
                    }
                })
            ])
        ])]
    }
}