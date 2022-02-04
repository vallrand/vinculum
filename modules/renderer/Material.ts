import { ReusableComponent } from 'framework/ReusableComponent'
import { Manager } from 'framework/Manager'
import { Store } from 'loader/Store'
import { rgba, rgb } from 'math/rgba'
import { TextureResource, DefaultTextureResource } from './UploadTexture'
import { BlendMode } from './programs/BlendMode'

export interface MaterialOptions {
    program: number
    color: rgba
    tint: rgb
    texture: string
    blend: BlendMode
}

export class Material<Options extends MaterialOptions = MaterialOptions> extends ReusableComponent<Options> {
    static readonly delegate = Material
    program: number

    readonly color: rgba = rgba()
    readonly tint: rgb = rgb()
    public diffuse: TextureResource
    public blend: BlendMode = BlendMode.NONE

    public get alpha(): number {
        return this.premultiply ? this.color[3]/0xFF : 1
    }
    public get premultiply(): boolean {
        return this.diffuse.texture?.premultiply
    }
    public get renderable(): boolean {
        return this.color[3] != 0
    }
    setup(options: Options, manager: Manager){
        this.program = options.program || 0
        this.diffuse = options.texture
        ? manager.resolveSystem(Store).requestSync<TextureResource>(options.texture)
        : DefaultTextureResource
        this.blend = options.blend || BlendMode.NONE
        rgba.copy(options.color || rgba.WHITE, this.color)
        rgb.copy(options.tint || rgb.BLACK, this.tint)
    }
    reset(){
        this.diffuse = null
    }
}