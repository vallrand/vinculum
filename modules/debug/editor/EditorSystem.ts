import { EntityManager, EntityGroup, ProcedureSystem, IUpdateContext } from 'framework'
import { vec2, mat3x2 } from 'math'
import { PointerDeviceSystem } from 'interaction'
import { Transform2D, Camera2D } from 'scene'

import { EditorSubSystem, IEditorUpdateContext } from './EditorSubSystem'
import { HTMLNode } from './HTMLNode'
import './editor.css'

export class EditorSystem extends ProcedureSystem {
    private readonly subsystems: EditorSubSystem[]

    private readonly cameraGroup: EntityGroup
    private pressed: boolean = false
    private prevZoom: number = 0

    private readonly updateContext: IEditorUpdateContext = {
        selectedEntity: 0,
        camera: 0,
        worldPosition: vec2(),
        pressed: false,
        trigger: false,
        release: false,
        deltaZoom: 0,
        pixelWidth: 1,
        pixelHeight: 1
    }

    constructor(manager: EntityManager, subsystems: Array<new (manager: EntityManager) => EditorSubSystem>){
        super(manager)
        this.cameraGroup = this.manager.queryEntityGroup([Transform2D, Camera2D])
        this.subsystems = subsystems.map(SubSystem => new SubSystem(this.manager))

        document.body.appendChild(this.buildMenu())
    }
    buildMenu(): HTMLElement {
        const { subsystems } = this

        return HTMLNode('div', { className: 'editor-panel vertical' }, [
            HTMLNode('div', { className: 'horizontal', style: { width: '100%' } }, subsystems.map(system => (
                HTMLNode('div', { className: 'editor-tab', innerText: system.key }, null, {
                    click(event: Event){
                        document.querySelectorAll('.editor-tab').forEach((node: HTMLDivElement) =>
                            event.target === node
                                ? node.classList.add('active')
                                : node.classList.remove('active')
                        )
                        document.querySelectorAll('.editor-menu').forEach((node: HTMLDivElement) =>
                            node.dataset.key === system.key
                                ? node.style.removeProperty('display')
                                : node.style.setProperty('display', 'none')
                        )
                        subsystems.forEach(subsystem => subsystem.enabled = subsystem === system)
                    }
                })
            ))),
            ...subsystems.map(system => (
                HTMLNode('div', {
                    className: 'horizontal editor-menu',
                    dataset: { key: system.key },
                    style: { display: 'none' }
                }, system.buildMenu())
            ))
        ])
    }
    execute(context: IUpdateContext){
        const pointerDeviceSystem = this.manager.resolveSystem(PointerDeviceSystem)
        const pressed = pointerDeviceSystem.pressure[0]
        const normalizedCoordinates = pointerDeviceSystem.pointers[0]
        const zoom = pointerDeviceSystem.scroll[1]

        this.updateContext.trigger = !this.pressed && pressed
        this.updateContext.release = this.pressed && !pressed
        this.pressed = this.updateContext.pressed = pressed

        this.updateContext.deltaZoom = zoom - this.prevZoom
        this.prevZoom = zoom

        if(!this.cameraGroup.length) return
        this.updateContext.camera = this.cameraGroup.entities[0]
        const camera = this.manager.aquireComponent<Camera2D>(this.cameraGroup.entities[0], Camera2D)
        mat3x2.transform(normalizedCoordinates, camera.invViewMatrix, this.updateContext.worldPosition)

        const targetViewport: vec2 = (camera as any).targetViewport
        this.updateContext.pixelWidth = camera.viewport[0] / targetViewport[0]
        this.updateContext.pixelHeight = camera.viewport[1] / targetViewport[1]

        for(let i = 0; i < this.subsystems.length; i++)
            this.subsystems[i].update(this.updateContext)
    }
}