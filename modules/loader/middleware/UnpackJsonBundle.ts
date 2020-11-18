import { IMiddleware, IResource, IProgressHandler } from '../IMiddleware'
import { Store } from '../Store'
import { DATA_TYPE } from './DetectType'

export const UnpackJsonBundle: IMiddleware = function(this: Store, resource: IResource, progress: IProgressHandler){
    if(resource.type !== DATA_TYPE.JSON || !resource.data) return
    const { meta, resources } = resource.data
    if(!resources) return
    resource.shallow = true

    return this.load(Object.keys(resources)
    .map(url => {
        const dataURI = resources[url]

        if(typeof dataURI !== 'string')
            return { url, data: dataURI }

        const [ metaData, data ] = dataURI.split(',')
        const [ mediaType, encoding ] = metaData.replace('data:','').split(';')
        const [ type, subType ] = mediaType.split('/')

        switch(type){
            case 'image': return { url, data: dataURI, type: DATA_TYPE.IMAGE }
            case 'audio': return { url, data: dataURI, type: DATA_TYPE.AUDIO }
            case 'text': 
                if(subType === 'html' || subType === 'xml')
                    return { url, data, type: DATA_TYPE.XML }
                else
                    return { url, data, type: DATA_TYPE.TEXT }
            default: throw new Error(`Unrecognized base64 type: "${metaData}".`)
        }
    }), progress) as any
}