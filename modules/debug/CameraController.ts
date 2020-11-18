import { vec2 } from 'math'
import { Transform2D, Camera2D } from 'scene'
import { EditorSubSystem, IEditorUpdateContext, HTMLNode } from './editor'

import { CameraSystem } from '../../demo/camera'

export class CameraController extends EditorSubSystem {
    private readonly prevPosition: vec2 = vec2()
    readonly key: string = 'view'
    update(context: IEditorUpdateContext){
        if(!this.enabled) return

        if(!context.camera) return
        const camera = this.manager.aquireComponent<Camera2D>(context.camera, Camera2D)
        const cameraTransform = this.manager.aquireComponent<Transform2D>(context.camera, Transform2D)
        
        if(context.deltaZoom){
            vec2.scale(camera.viewport, Math.pow(1.2, context.deltaZoom), camera.viewport)
            camera.lastFrame = -1
        }
        if(context.trigger) vec2.copy(context.worldPosition, this.prevPosition)
        if(context.pressed){
            vec2.add(cameraTransform.localPosition, this.prevPosition, cameraTransform.localPosition)
            vec2.subtract(cameraTransform.localPosition, context.worldPosition, cameraTransform.localPosition)
            cameraTransform.lastFrame = -1
        }

        this.menu.cameraX['value'] = cameraTransform.localPosition[0]
        this.menu.cameraY['value'] = cameraTransform.localPosition[1]
        this.menu.cameraWidth['value'] = camera.viewport[0]
        this.menu.cameraHeight['value'] = camera.viewport[1]
    }
    buildMenu(){
        this.menu.cameraX = HTMLNode('input', { type: 'number', disabled: true, value: 0, min: -1e6, max: 1e6 })
        this.menu.cameraY = HTMLNode('input', { type: 'number', disabled: true, value: 0, min: -1e6, max: 1e6 })
        this.menu.cameraWidth = HTMLNode('input', { type: 'number', disabled: true, value: 0, min: -1e6, max: 1e6 })
        this.menu.cameraHeight = HTMLNode('input', { type: 'number', disabled: true, value: 0, min: -1e6, max: 1e6 })

        return [HTMLNode('div', { className: 'vertical', style: { alignItems: 'flex-end' } }, [
            HTMLNode('div', { className: 'horizontal', innerText: 'Enable: ' }, [
                HTMLNode('input', { type: 'checkbox', checked: true }, null, {
                    change: (event: Event) =>
                    this.manager.resolveSystem(CameraSystem).enabled = (event.target as HTMLInputElement).checked
                })
            ]),
            HTMLNode('div', { className: 'horizontal', innerText: 'position: ' }, [
                this.menu.cameraX,
                this.menu.cameraY
            ]),
            HTMLNode('div', { className: 'horizontal', innerText: 'viewport: ' }, [
                this.menu.cameraWidth,
                this.menu.cameraHeight
            ])
        ])]
    }
}