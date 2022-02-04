import { GLContext } from '../gl'
import { Texture } from '../context/Texture'
import { RenderTarget } from '../context/RenderTarget'
import { Geometry2D } from '../geometry/Geometry2D'
import { Material } from '../Material'

export interface GlobalUniforms {
    defaultTexture: Texture
    defaultRenderTarget: RenderTarget
    renderTarget: RenderTarget
    [key: string]: any
}

export interface IRenderer2D {
    initialize(context: GLContext): void
    render(uniforms: GlobalUniforms, geometry: Geometry2D, material: Material): void
    flush(uniforms: GlobalUniforms): void
    delete(): void
}