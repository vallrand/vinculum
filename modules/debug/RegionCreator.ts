import { vec2, mat3x2, rgba, AABB, snapToGrid } from 'math'

import { EditorSubSystem, IEditorUpdateContext, HTMLNode } from './editor'
import { CameraRegion, CameraSystem } from '../../demo/camera'

//? / (1024 / 768)
export class RegionCreator extends EditorSubSystem {
    private static readonly temp: vec2 = vec2()
    private static readonly colors = {
        bounds: rgba(0xFF, 0x7F, 0x00, 0xFF),
        region: rgba(0xFF,0x00,0xFF,0xFF)
    }
    private static readonly MODES = {
        SELECT: 'select',
        DRAW: 'draw'
    }
    private currentRegion: AABB = null
    private visible = false
    private mode: string = RegionCreator.MODES.SELECT
    readonly key: string = 'region'
    private context: IEditorUpdateContext
    update(context: IEditorUpdateContext){
        this.context = context
        this.graphics.clear()

        const cameraSystem = this.manager.resolveSystem(CameraSystem)
        const regions: CameraRegion[] = (cameraSystem as any).regions.data
        if(this.visible)
        for(let region: CameraRegion, i = 0; region = regions[i]; i++)
            this.graphics
            .beginPath(region.aabb[0], region.aabb[1])
            .lineTo(region.aabb[2], region.aabb[1])
            .lineTo(region.aabb[2], region.aabb[3])
            .lineTo(region.aabb[0], region.aabb[3])
            .closePath()
            .stroke(RegionCreator.colors.bounds, 8)

        if(!context.camera || !this.enabled) return

        switch(this.mode){
            case RegionCreator.MODES.SELECT: {
                const targetEntity = this.queryEntity(context.worldPosition)
                if(context.trigger)
                    context.selectedEntity = targetEntity
                break
            }
            case RegionCreator.MODES.DRAW:
                this.drawRegion(context)
                break
        }

        const region = context.selectedEntity ? this.manager.aquireComponent<CameraRegion>(context.selectedEntity, CameraRegion) : null
        if(region){
            this.menu.viewWidth['disabled'] = false
            if(document.activeElement !== this.menu.viewWidth)
                this.menu.viewWidth['value'] = region.view[0]
            this.menu.viewHeight['value'] = region.view[1]

            this.menu.lockX['value'] = region.lockX
            this.menu.lockY['value'] = region.lockY
        }else{
            this.menu.viewWidth['disabled'] = true
        }
    }
    queryEntity(position: vec2): number {
        const cameraSystem = this.manager.resolveSystem(CameraSystem)
        const regions: CameraRegion[] = (cameraSystem as any).regions.data

        const center = vec2()
        let index: number, minDistance = Infinity
        for(let i = 0; i < regions.length; i++){
            const aabb = regions[i].aabb
            const center = vec2.fromValues(0.5 * (aabb[0] + aabb[2]), 0.5 * (aabb[1] + aabb[3]), RegionCreator.temp)
            const distanceSquared = vec2.distanceSquared(center, position)
            if(distanceSquared >= minDistance) continue
            minDistance = distanceSquared
            index = i
        }
        return index != null ? regions[index].entity : 0
    }
    drawRegion(context: IEditorUpdateContext){
        if(EditorSubSystem.gridSize) snapToGrid(context.worldPosition, EditorSubSystem.gridSize, context.worldPosition)

        if(context.trigger)
            this.currentRegion = AABB(
                context.worldPosition[0], context.worldPosition[1],
                context.worldPosition[0], context.worldPosition[1])

        if(context.release){
            const bounds = AABB(
                Math.min(this.currentRegion[0], this.currentRegion[2]),
                Math.min(this.currentRegion[1], this.currentRegion[3]),
                Math.max(this.currentRegion[0], this.currentRegion[2]),
                Math.max(this.currentRegion[1], this.currentRegion[3])
            )
            const entity = this.manager.createEntity()
            this.manager.createComponent(entity, CameraRegion, { view: vec2(), bounds })
            this.currentRegion = null
        }
        if(this.currentRegion){
            this.currentRegion[2] = context.worldPosition[0]
            this.currentRegion[3] = context.worldPosition[1]
            const region = this.currentRegion
            this.graphics
            .beginPath(region[0], region[1])
            .lineTo(region[2], region[1])
            .lineTo(region[2], region[3])
            .lineTo(region[0], region[3])
            .closePath()
            .stroke(RegionCreator.colors.bounds, 8)
        }
    }
    buildMenu(){
        this.menu.viewWidth = HTMLNode('input', { type: 'number', min: 0, max: 1e4 }, null, {
            change: (event: Event) => {
                const region = this.context.selectedEntity
                ? this.manager.aquireComponent<CameraRegion>(this.context.selectedEntity, CameraRegion) : null
                if(!region) return
                const width = parseFloat((event.target as HTMLSelectElement).value)
                const aspectRatio = region.view[0] / region.view[1]
                region.view[0] = width
                region.view[1] = Math.round(width / aspectRatio)
            }
        })
        this.menu.viewHeight = HTMLNode('input', { type: 'number', min: 0, max: 1e4, disabled: true })
        this.menu.lockX = HTMLNode('input', { type: 'number', min: -1e4, max: 1e4, disabled: true })
        this.menu.lockY = HTMLNode('input', { type: 'number', min: -1e4, max: 1e4, disabled: true })

        return [HTMLNode('div', { className: 'vertical' }, [
            HTMLNode('div', { className: 'horizontal', innerText: 'Show: ' }, [
                HTMLNode('input', { type: 'checkbox', checked: this.visible }, null, {
                    change: (event: Event) => {
                        this.visible = (event.target as HTMLInputElement).checked
                    }
                })
            ]),
            HTMLNode('div', { className: 'horizontal', innerText: 'Mode: ' }, [
                HTMLNode('select', {}, [
                    HTMLNode('option', { innerText: 'Select', value: RegionCreator.MODES.SELECT }),
                    HTMLNode('option', { innerText: 'Draw', value: RegionCreator.MODES.DRAW })
                ], {
                    change: (event: Event) => this.mode = (event.target as HTMLSelectElement).value
                })
            ]),
            HTMLNode('div', { className: 'horizontal', innerText: 'Size:' }, [this.menu.viewWidth, this.menu.viewHeight]),
            HTMLNode('div', { className: 'horizontal', innerText: 'Lock:' }, [this.menu.lockX, this.menu.lockY])
        ])]
    }
    print(): string {
        const cameraSystem = this.manager.resolveSystem(CameraSystem)
        const regions: CameraRegion[] = (cameraSystem as any).regions.data

        return JSON.stringify(regions.map(({ aabb, view, lockX, lockY }) => [
            [...aabb],
            ...view, lockX, lockY
        ]), null, 0)
    }
}