import { Deferred } from '../../common/Deferred'
import { IMiddleware, IResource } from '../IMiddleware'
import { DATA_TYPE } from './DetectType'

export const LoadImageElement: IMiddleware = function(resource: IResource){
    if(resource.type !== DATA_TYPE.IMAGE) return
    let source = resource.data || encodeURI(resource.url)
    if(source instanceof Blob) source = URL.createObjectURL(source)
    if(!source || typeof source !== 'string') return
    return new Deferred<any>().from(function(resolve, reject){
        const data = resource.data = new Image()
        data.crossOrigin = 'anonymous'
        data.addEventListener('error', reject)
        data.addEventListener('load', resolve)
        data.src = source
    })
}

export const LoadAudioElement: IMiddleware = function(resource: IResource){
    if(resource.type !== DATA_TYPE.AUDIO) return
    let source = resource.data || encodeURI(resource.url)
    if(source instanceof Blob) source = URL.createObjectURL(source)
    if(!source || typeof source !== 'string') return
    return new Deferred<any>().from(function(resolve, reject){
        const data = resource.data = new Audio()
        data.crossOrigin = 'anonymous'
        data.addEventListener('error', reject)
        data.addEventListener('load', resolve)
        data.addEventListener('canplaythrough', resolve)
        data.src = source
    })
}