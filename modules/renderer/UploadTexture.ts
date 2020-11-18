import { IMiddleware, IResource, Store } from '../loader'
import { DATA_TYPE } from '../loader/middleware/DetectType'
import { GL, GLContext } from './gl'
import { Texture } from './context/Texture'
import { vec4 } from '../math/vec4'
import { mat3x2 } from '../math/mat3x2'
import { Renderer2DSystem } from './Renderer2DSystem'

export interface TextureResource {
    index: number,
    frame: vec4
    width: number, height: number,
    uvTransform: mat3x2
    texture: Texture
}

export function DefaultTexture(gl: GLContext): Texture {
    const texture = new Texture(gl)
    texture.upload(new Uint8Array([0xFF,0xFF,0xFF,0xFF]), {
        width: 1, height: 1,
        wrap: GL.CLAMP_TO_EDGE,
        minFilter: GL.NEAREST,
        magFilter: GL.NEAREST
    })
    return texture
}

export const DefaultTextureResource: TextureResource = {
    index: 0,
    texture: null,
    uvTransform: mat3x2.IDENTITY,
    frame: vec4(0, 0, 1, 1),
    width: 1, height: 1
}

export const UploadTexture: IMiddleware & { index: number } =
function(this: Store, resource: IResource){
    if(resource.type !== DATA_TYPE.IMAGE) return

    resource.type = 'texture'
    const gl: GLContext = this.manager.resolveSystem(Renderer2DSystem).gl
    const texture: Texture = new Texture(gl)
    texture.upload(resource.data, {
        flipY: false,
        premultiplyAlpha: false,
        wrap: GL.REPEAT,
        minFilter: GL.LINEAR_MIPMAP_NEAREST,
        magFilter: GL.LINEAR
    })
    resource.data = <TextureResource> {
        index: ++UploadTexture.index,
        texture,
        uvTransform: mat3x2.IDENTITY,
        frame: vec4(0, 0, texture.width, texture.height),
        width: texture.width, height: texture.height
    }
}
UploadTexture.index = 0