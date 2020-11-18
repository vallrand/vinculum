import { IMiddleware, IResource } from '../IMiddleware'

export const DATA_TYPE = {
    JSON: 'json',
    IMAGE: 'image',
    AUDIO: 'audio',
    VIDEO: 'video',
    XML: 'xml',
    TEXT: 'text',
    STYLE: 'style',
    SCRIPT: 'script'
}

export const DATA_TYPE_REGEX = {
    [DATA_TYPE.JSON]: /\.json$/,
    [DATA_TYPE.IMAGE]: /\.(png|jpg)$/,
    [DATA_TYPE.AUDIO]: /\.(mp3|wav)$/,
    [DATA_TYPE.VIDEO]: /\.(mp4|avi)$/,
    [DATA_TYPE.XML]: /\.(fnt|xml)$/,
    [DATA_TYPE.SCRIPT]: /\.js$/,
    [DATA_TYPE.STYLE]: /\.css$/
}

export const DetectType = (dataTypeRegex: Record<string, RegExp> = DATA_TYPE_REGEX): IMiddleware => 
function(resource: IResource){
    if(resource.type) return
    for(let type in dataTypeRegex)
        if(dataTypeRegex[type].test(resource.url)){
            resource.type = type
            break
        }
}