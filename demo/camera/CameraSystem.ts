import { vec2, rgba, AABB, lerp, clamp, smoothstep } from 'math'
import { ProcedureSystem, EntityManager, IUpdateContext, DataView } from 'framework'
import { Transform2D, Camera2D, AnimationMixer } from 'scene'
import { QuadTree } from 'physics/collision/broadphase/QuadTree'

import { CharacterSystem } from '../character'
import { CameraRegion } from './CameraRegion'

function rectangle(aabb: AABB, position: vec2, padding: number): number {
    const x = 0.5 * (aabb[0] + aabb[2])
    const y = 0.5 * (aabb[1] + aabb[3])
    const w = 0.5 * (aabb[2] - aabb[0])
    const h = 0.5 * (aabb[3] - aabb[1])
    return 1 - Math.max(
        smoothstep(w - padding, w, Math.abs(x - position[0])),
        smoothstep(h - padding, h, Math.abs(y - position[1]))
    )
}

export interface CameraSetup {
    regions: Array<[AABB, number, number, number, number]>
}

export class CameraSystem extends ProcedureSystem {
    private static readonly tempAABB: AABB = AABB()
    private static readonly tempList: CameraRegion[] = []
    readonly priority: number = -0x20
    private character: number
    public readonly camera: number
    private readonly regions: DataView<CameraRegion>
    private readonly tree: QuadTree<CameraRegion> = new QuadTree<CameraRegion>(AABB(), { capacity: 1, depthLimit: 4 })
    enabled: boolean = true
    constructor(manager: EntityManager, { regions }: CameraSetup){
        super(manager)
        this.regions = this.manager.aquireDataView<CameraRegion>(CameraRegion)

        this.character = this.manager.resolveSystem(CharacterSystem).character

        this.camera = this.manager.createEntity()
        this.manager.createComponent(this.camera, Transform2D, { position: [0, 0] })
        this.manager.createComponent(this.camera, Camera2D, {
            viewport: [1024, 768],
            origin: [.5, .5],
            range: [-4096, 4096]
        })

        for(let i = 0; i < regions.length; i++)
            AABB.merge(regions[i][0], this.tree.root.bounds, this.tree.root.bounds)

        for(let i = 0; i < regions.length; i++){
            const [ bounds, width, height, x, y ] = regions[i]
            const entity = this.manager.createEntity()
            const cameraRegion = this.manager.createComponent(entity, CameraRegion, {
                bounds, view: [width, height], lockX: x, lockY: y
            }) as CameraRegion
            this.tree.insert(cameraRegion)
        }
    }
    execute(context: IUpdateContext): void {
        if(!this.character || !this.enabled) return
        const cameraTransform = this.manager.aquireComponent<Transform2D>(this.camera, Transform2D)
        const camera = this.manager.aquireComponent<Camera2D>(this.camera, Camera2D)
        
        const characterTransform = this.manager.aquireComponent<Transform2D>(this.character, Transform2D)
        const targetPosition = characterTransform.localPosition
        const characterRadius = 200
        const regions = this.tree.query(AABB.fromValues(
            targetPosition[0] - characterRadius,
            targetPosition[1] - characterRadius,
            targetPosition[0] + characterRadius,
            targetPosition[1] + characterRadius,
            CameraSystem.tempAABB
        ), CameraSystem.tempList)
        const viewport = vec2.copy(camera.viewport, vec2())
        const position = vec2.copy(targetPosition, vec2())

        let totalWeight = 0
        for(let i = 0; i < regions.length; i++){
            const region = regions[i]
            
            const weight = rectangle(region.aabb, targetPosition, 800)
            if(!weight) continue

            totalWeight += weight
            vec2.lerp(viewport, region.view, weight / totalWeight, viewport)
            position[0] = lerp(position[0], region.lockX == null ? position[0] : region.lockX, weight / totalWeight)
            position[1] = lerp(position[1], region.lockY == null ? position[1] : region.lockY, weight / totalWeight)
        }
        regions.length = 0

        const remainingWeight = Math.max(0, 1 - totalWeight)
        vec2.lerp(position, targetPosition, remainingWeight / 1, position)
        
        const factor = 1 - Math.pow(1 - 0.1, context.deltaTime * 30)
        if(camera.viewport[0] !== viewport[0] || camera.viewport[1] !== viewport[1]){
            vec2.lerp(camera.viewport, viewport, factor, camera.viewport)
            camera.lastFrame = -1
        }
        if(cameraTransform.localPosition[0] !== position[0] || cameraTransform.localPosition[1] !== position[1]){
            vec2.lerp(cameraTransform.localPosition, position, factor, cameraTransform.localPosition)

            cameraTransform.localPosition[0] = clamp(cameraTransform.localPosition[0],
                targetPosition[0] - 0.5 * camera.viewport[0],
                targetPosition[0] + 0.5 * camera.viewport[0])
            cameraTransform.localPosition[1] = clamp(cameraTransform.localPosition[1],
                targetPosition[1] - 0.5 * camera.viewport[1],
                targetPosition[1] + 0.5 * camera.viewport[1])

            cameraTransform.lastFrame = -1
        }

        
    }
}