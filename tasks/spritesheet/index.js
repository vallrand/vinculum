const fs = require('fs')
const path = require('path')
const stream = require('stream')
const PngQuant = require('pngquant')

const { collectStream } = require('../utils')

const PNG = require('./png.js')
const binpacker = require('./binpacker')
const bitmap = require('./bitmap')

module.exports = options => {
    const preprocess = [
        bitmap.trim(options.trim || { alphaThreshold: 0 }),
        bitmap.pad(options.pad || { extrude: false, padding: 1 })
    ]
    const sprites = []
    const templateFilename = 'spritesheet_'

    return new stream.Transform({
        objectMode: true,
        readableObjectMode: true,
        writableObjectMode: true,
        async transform(chunk, encoding, callback){
            const { filepath, filename } = chunk
            if((/\.png$/).test(filepath)){
                const buffer = await fs.promises.readFile(filepath, { encoding: null })
                const image = PNG.decode(buffer)
                const { width, height, depth, ctype, frames, tabs, data } = image
                const arraybuffer = PNG.toRGBA8(image)[0]
                const imageData = bitmap({
                    width, height,
                    data: new Uint8Array(arraybuffer),
                    meta: { filename, width, height }
                })
                const sprite = preprocess.reduce((bitmap, process) => process(bitmap), imageData)
                sprites.push(sprite)
            }else
                this.push(chunk)
            callback()
        },
        async flush(callback){
            const spritesheets = binpacker(sprites, {
                width: 2048, height: 2048,
                powerOfTwo: true, square: false, sortCriteria: 'maxside'
            })
            sprites.length = 0
        
            for(let i = 0; i < spritesheets.length; i++){
                const { width, height, frames } = spritesheets[i]
                const spritesheet = bitmap({ width, height, colors: 4 })
                const hashMap = {}
                for(const { x, y, reference } of frames){
                    bitmap.copy(reference, spritesheet, x, y)
                    const { filename, width: sourceWidth, height: sourceHeight } = reference.meta
                    const {
                        x: offdetX, y: offsetY, width: frameWidth, height: frameHeight
                    } = reference.frame
                    
                    const left = Math.max(0, offdetX)
                    const top = Math.max(0, offsetY)
                    const right = Math.min(offdetX + frameWidth, reference.width)
                    const bottom = Math.min(offsetY + frameHeight, reference.height)
                    const scaleX = sourceWidth / frameWidth
                    const scaleY = sourceHeight / frameHeight
                    
                    hashMap[filename] = {
                        frame: {
                            x: x + left,
                            y: y + top,
                            w: right - left,
                            h: bottom - top
                        },
                        spriteSourceSize: {
                            x: (left - offdetX) * scaleX,
                            y: (top - offsetY) * scaleY,
                            w: (right - left) * scaleX,
                            h: (bottom - top) * scaleY
                        },
                        sourceSize: {
                            w: sourceWidth,
                            h: sourceHeight
                        }
                    }
                }

                const png = PNG.encode([spritesheet.data], spritesheet.width, spritesheet.height, 0)
        
                const json = {
                    frames: hashMap,
                    meta: {
                        image: `${templateFilename}${i}.png`,
                        format: 'RGBA8888',
                        size: { w: spritesheet.width, h: spritesheet.height }
                    }
                }

                this.push({
                    filename: `${templateFilename}${i}.json`,
                    data: JSON.stringify(json, null, 0),
                    encoding: 'utf8'
                })

                const imageData = await collectStream(
                    new stream.PassThrough()
                    .end(Buffer.from(png))
                    .pipe(new PngQuant([
                        256,
                        '--quality', '60-80',
                        '--nofs',
                        '--floyd=0.5',
                        '--strip'
                    ]))
                )

                this.push({
                    filename: `${templateFilename}${i}.png`,
                    data: imageData,
                    encoding: null
                })
            }
            callback()
        }
    })
}