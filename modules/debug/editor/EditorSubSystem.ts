import { EntityManager } from 'framework'
import { vec2, mat3x2, rgba, snapToGrid } from 'math'
import { VectorGraphics, Material, BlendMode } from 'renderer'

export interface IEditorUpdateContext {
    selectedEntity: number
    camera: number
    worldPosition: vec2
    pressed: boolean
    trigger: boolean
    release: boolean
    deltaZoom: number
    pixelWidth: number
    pixelHeight: number
}

export abstract class EditorSubSystem {
    public static gridSize: number = 0
    protected readonly graphics: VectorGraphics

    enabled: boolean = false
    abstract readonly key: string

    protected readonly menu: { [property: string]: HTMLElement } = Object.create(null)
    constructor(protected readonly manager: EntityManager){
        const graphics = manager.createEntity()
        manager.createComponent(graphics, Material, {
            program: 0, color: rgba.WHITE, blend: BlendMode.NORMAL
        })
        this.graphics = manager.createComponent(graphics, VectorGraphics, { order: 0 }) as VectorGraphics
    }
    abstract update(context: IEditorUpdateContext): void
    abstract buildMenu(): HTMLElement[]
}