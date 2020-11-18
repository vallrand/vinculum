const fs = require('fs')
const path = require('path')
const stream = require('stream')

module.exports = function({
    filter = filename => true,
    templateFilename = 'bundle.json'
}){
    const TYPE = {
        TEXT: 0x000,
        JSON: 0x001,
        IMAGE: 0x002,
        AUDIO: 0x004,
        VIDEO: 0x008,
        XML: 0x0010
    }
    const dataTypeRegex = {
        [TYPE.JSON]: /\.json$/i,
        [TYPE.IMAGE]: /\.(png|jpg|jpeg|gif)$/i,
        [TYPE.AUDIO]: /\.(mp3|ogg|wav)$/i,
        [TYPE.XML]: /\.(fnt|xml|html)$/i,
        [TYPE.VIDEO]: /\.(mp4|webm)$/i
    }
    const dataTypeFormat = {
        [TYPE.JSON]: data => JSON.parse(data),
        [TYPE.iMAGE]: (data, ext) => `data:image/${ext.replace('jpg', 'jpeg')};base64,${data}`,
        [TYPE.AUDIO]: (data, ext) => `data:audio/${ext.replace('mp3','mpeg')};base64,${data}`,
        [TYPE.VIDEO]: (data, ext) => `data:video/${ext};base64,${data}`,
        [TYPE.XML]: data => `data:text/xml;charset=utf-8,${data}`,
        [TYPE.TEXT]: data => data
    }
    const determineDataType = filepath => Object.keys(dataTypeRegex)
    .find(type => dataTypeRegex[type].test(filepath)) || TYPE.TEXT

    const queue = []
    return new stream.Transform({
        objectMode: true,
        readableObjectMode: true,
        writableObjectMode: true,
        async transform(chunk, encoding, callback){
            let { filepath, filename, data, encoding: fileEncoding } = chunk
            if(!filter(filename))
                return this.push(chunk), callback()

            const extension = path.extname(filename).slice(1)
            const dataType = determineDataType(filename)
            const expectedEncoding = dataType & (TYPE.IMAGE | TYPE.AUDIO | TYPE.VIDEO) ? 'base64' : 'utf8'

            if(!data)
                data = await fs.promises.readFile(filepath, { encoding: expectedEncoding })
            else if(fileEncoding !== expectedEncoding)
                data = Buffer.from(data, fileEncoding).toString(expectedEncoding)

            const dataURI = dataTypeFormat[dataType](data, extension)
            queue.push({ filename, dataURI })
            callback()
        },
        async flush(callback){
            const json = { meta: {}, resources: {} }
            while(queue.length){
                const { filename, dataURI } = queue.pop()
                json.resources[filename] = dataURI
            }

            this.push({
                filename: templateFilename,
                data: JSON.stringify(json, null, 0),
                encoding: 'utf8'
            })

            callback()
        }
    })
}