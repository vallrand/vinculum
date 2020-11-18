import { GLContext, GL } from '../gl'

const checkPowerOf2 = (value: number): boolean => (value & --value) == 0

type TextureSource = HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageData | ImageBitmap | ArrayBufferView
interface TextureOptions {
    flipY?: boolean
    premultiplyAlpha?: boolean
    width?: number
    height?: number
    format?: number
    type?: number
    wrap?: number
    minFilter?: number
    magFilter?: number
}

export class Texture {
    public static DepthTexture(gl: GLContext, width: number, height: number): Texture {
        const texture = new Texture(gl, GL.DEPTH_COMPONENT)
        texture.upload(null, {
            width, height, format: GL.DEPTH_COMPONENT, type: GL.UNSIGNED_SHORT,
            wrap: GL.CLAMP_TO_EDGE, minFilter: GL.NEAREST, magFilter: GL.NEAREST
        })
        return texture
    }
    public static ColorTexture(gl: GLContext, width: number, height: number): Texture {
        const texture = new Texture(gl, GL.RGBA)
        texture.upload(null, {
            width, height, format: GL.RGBA, type: GL.UNSIGNED_BYTE,
            wrap: GL.CLAMP_TO_EDGE, minFilter: GL.LINEAR, magFilter: GL.LINEAR
        })
        return texture
    }
    private readonly texture: WebGLTexture
    width: number = 0
    height: number = 0
    private mipmaps: boolean = false
    constructor(private readonly gl: GLContext, readonly internalFormat: number = GL.RGBA){
        this.texture = gl.createTexture()
    }
    bind(location: number = 0){
        this.gl.activeTexture(GL.TEXTURE0 + location)
        this.gl.bindTexture(GL.TEXTURE_2D, this.texture)
    }
    upload(source: TextureSource, options: TextureOptions, offsetX?: number, offsetY?: number): void {
        this.bind()
        const { gl, internalFormat } = this
        const {
            flipY = false,
            premultiplyAlpha = false,
            format = GL.RGBA,
            type = GL.UNSIGNED_BYTE
        } = options

        let sourceWidth = source && ((source as HTMLVideoElement).videoWidth || (source as ImageData).width)
        let sourceHeight = source && ((source as HTMLVideoElement).videoHeight || (source as ImageData).height)
        if(offsetX != null || offsetY != null){
            if(sourceWidth != null || sourceHeight != null) gl.texSubImage2D(
                GL.TEXTURE_2D, 0, offsetX, offsetY, format, type,
                source as ImageData)
            else gl.texSubImage2D(
                GL.TEXTURE_2D, 0, offsetX, offsetY, options.width, options.height, format, type,
                source as ArrayBufferView)
            return
        }

        gl.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, flipY)
        gl.pixelStorei(GL.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultiplyAlpha)

        if(sourceWidth != null || sourceHeight != null) gl.texImage2D(
            GL.TEXTURE_2D, 0, internalFormat, format, type,
            source as ImageData)
        else gl.texImage2D(
            GL.TEXTURE_2D, 0, internalFormat,
            sourceWidth = options.width,
            sourceHeight = options.height,
            0, format, type,
            source as ArrayBufferView)
        this.width = sourceWidth
        this.height = sourceHeight
        
        const powerOf2 = checkPowerOf2(this.width) && checkPowerOf2(this.height)
        let {
            wrap = GL.REPEAT,
            minFilter = GL.LINEAR_MIPMAP_NEAREST,
            magFilter = GL.LINEAR
        } = options

        this.mipmaps = false
        switch(minFilter){
            case GL.LINEAR_MIPMAP_LINEAR:
            case GL.LINEAR_MIPMAP_NEAREST:
                if(!powerOf2){
                    minFilter = GL.LINEAR
                    break
                }
            case GL.NEAREST_MIPMAP_LINEAR:
            case GL.NEAREST_MIPMAP_NEAREST:
                if(!powerOf2){
                    minFilter = GL.NEAREST
                    break
                }
            this.mipmaps = true
        }

        gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, wrap)
        gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, wrap)

        gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, magFilter)
        gl.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, minFilter)

        if(this.mipmaps) gl.generateMipmap(GL.TEXTURE_2D)
    }
    delete(){
        this.gl.deleteTexture(this.texture)
    }
}