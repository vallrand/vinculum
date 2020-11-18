import { IMiddleware, IResource, Store } from '../loader'
import { DATA_TYPE } from '../loader/middleware/DetectType'
import { vec4 } from '../math/vec4'
import { mat3x2 } from '../math/mat3x2'

import { TextureResource, UploadTexture } from './UploadTexture'

const calculateUVMatrix = (
    frame: { x: number, y: number, width: number, height: number },
    width: number, height: number, out: mat3x2
): mat3x2 => {
    out[0] = frame.width / width
    out[1] = 0
    out[2] = 0
    out[3] = frame.height / height
    out[4] = frame.x / width
    out[5] = frame.y / height
    return out
}

export const ParseTextureAtlas: IMiddleware = function(this: Store, resource: IResource){
    if(resource.type !== DATA_TYPE.JSON || !resource.data.frames) return

    const { frames, meta: { image, size } } = resource.data
    const textureFilepath = `${resource.url.replace(/[^\/]*$/i,'')}${image}`
    return this.request(textureFilepath).then((textureAtlas: IResource) => {
        const atlas: TextureResource = textureAtlas.data

        return this.load(Object.keys(frames).map(key => {
            const { frame, spriteSourceSize, sourceSize } = frames[key]

            return <IResource> {
                url: key,
                type: 'subtexture',
                data: <TextureResource> {
                    index: ++UploadTexture.index,
                    texture: atlas.texture,
                    uvTransform: calculateUVMatrix({
                        x: frame.x,
                        y: frame.y,
                        width: frame.w,
                        height: frame.h   
                    }, size.w, size.h, mat3x2()),
                    frame: vec4(spriteSourceSize.x, spriteSourceSize.y, spriteSourceSize.w, spriteSourceSize.h),
                    width: sourceSize.w, height: sourceSize.h
                }
            }
        })) as any
    })
}