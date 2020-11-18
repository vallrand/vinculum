import { mat3 } from 'math/mat3'
import { ProcedureSystem, EntityManager, IUpdateContext, DataView } from 'framework'
import { Display } from 'common/Display'
import { GL, GLContext } from './gl'
import { Texture } from './context/Texture'
import { RenderTarget, RenderTargetPool } from './context/RenderTarget'

import { IRenderer2D, GlobalUniforms } from './programs/IRenderer2D'
import { FilterProgram } from './programs/FilterProgram'
import { DefaultTexture } from './UploadTexture'

import { Transform2D } from 'scene/Transform2D'
import { Camera2D } from 'scene/Camera2D'
import { Geometry2D } from './geometry/Geometry2D'
import { Material } from './Material'

export class Renderer2DSystem extends ProcedureSystem {
    private readonly cameras: DataView<Camera2D>
    private readonly geometries: DataView<Geometry2D>

    public readonly renderTargetPool: RenderTargetPool
    private readonly filterProgram: FilterProgram
    private readonly globalUniforms: GlobalUniforms = {
        premultipliedAlpha: false,
        defaultTexture: null,
        defaultRenderTarget: null,
        renderTarget: null,
        invViewMatrix: mat3()
    }
    protected readonly defaultTexture: Texture
    public readonly gl: GLContext
    constructor(
        manager: EntityManager,
        private readonly programs: IRenderer2D[]
    ){
        super(manager)
        const display = manager.resolveSystem(Display)
        this.gl = GLContext.createContext(display.canvas) //TODO separate system for GL?

        this.cameras = manager.aquireDataView<Camera2D>(Camera2D)
        this.geometries = manager.aquireDataView<Geometry2D>(Geometry2D)

        this.renderTargetPool = new RenderTargetPool(this.gl)
        this.filterProgram = new FilterProgram(this.manager, this.gl)
        this.globalUniforms.defaultTexture = DefaultTexture(this.gl)
        this.globalUniforms.defaultRenderTarget = new RenderTarget(this.gl, null)
        for(let program: IRenderer2D, i = 0; program = this.programs[i]; i++)
            program.initialize(this.gl)
    }
    execute(context: IUpdateContext): void {
        this.gl.disable(GL.CULL_FACE)

        const cameras = this.cameras.data
        for(let camera: Camera2D, c = 0; camera = cameras[c]; c++){
            const viewTransform = this.manager.aquireComponent<Transform2D>(camera.entity, Transform2D)

            //TODO initialize FBO if needed etc
            if(!camera.renderTarget) camera.renderTarget = this.globalUniforms.defaultRenderTarget
            camera.calculateViewMatrix(viewTransform, context.frame)
            this.globalUniforms.viewMatrix = camera.viewMatrix
            mat3.fromMat3x2(camera.invViewMatrix, this.globalUniforms.invViewMatrix)
            this.globalUniforms.renderTarget = camera.renderTarget

            let { renderTarget, postEffects } = camera
            if(postEffects.length){
                renderTarget = this.renderTargetPool.aquire(camera.renderTarget.viewport[2], camera.renderTarget.viewport[3], true)
                renderTarget.viewbox(0, 0, camera.renderTarget.viewport[2], camera.renderTarget.viewport[3])
            }
            
            renderTarget.bind()
            renderTarget.clear(context.frame)

            this.geometries.update(context.frame)
            const geometries = this.geometries.data
            
            let program: IRenderer2D = null
            for(let geometry: Geometry2D, i = 0; geometry = geometries[i]; i++){
                if(geometry.order < camera.range[0]) continue
                else if(geometry.order > camera.range[1]) break

                const modelTransform = this.manager.aquireComponent<Transform2D>(geometry.entity, Transform2D)
                const material = this.manager.aquireComponent<Material>(geometry.entity, Material)

                if(!material || !material.renderable) continue
                geometry.calculateVertexData(modelTransform, material, context.frame)
                if(!camera.cull(geometry.aabb)) continue
                geometry.lastRenderFrame = context.frame

                if(program && program !== this.programs[material.program]) program.flush(this.globalUniforms)
                program = this.programs[material.program]
                program.render(this.globalUniforms, geometry, material)
            }
            if(program) program.flush(this.globalUniforms)
            if(!postEffects.length) continue
            
            for(let i = postEffects.length - 1; i >= 0; i--){
                const material = this.manager.aquireComponent<Material>(postEffects[i], Material, camera.timeframe)
                const source = renderTarget
                const target = i ? this.renderTargetPool.aquire(source.viewport[2], source.viewport[3], true) : camera.renderTarget
                this.filterProgram.applyFilter(material as any, this.globalUniforms, context, source, renderTarget = target)
                this.renderTargetPool.recycle(source)
                if(!material) postEffects.splice(i, 1)
            }
        }
        this.globalUniforms.renderTarget = null
    }
}