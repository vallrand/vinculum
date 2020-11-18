import { Deferred } from '../../common/Deferred'
import { IMiddleware, IResource, IProgressHandler } from '../IMiddleware'
import { DATA_TYPE } from './DetectType'

const DATA_RESPONSE_TYPE: Record<string, XMLHttpRequestResponseType> = {
    [DATA_TYPE.JSON]: 'json',
    [DATA_TYPE.IMAGE]: 'blob',
    [DATA_TYPE.AUDIO]: 'arraybuffer',
    [DATA_TYPE.XML]: 'document',
    [DATA_TYPE.TEXT]: 'text'
}

export const HttpRequest = (mapper: Record<string, XMLHttpRequestResponseType> = DATA_RESPONSE_TYPE): IMiddleware =>
function(resource: IResource, progress: IProgressHandler){
    if(resource.data) return
    const deferred = new Deferred<void>()
    const xhr = new XMLHttpRequest()
    xhr.open('GET', encodeURI(resource.url), true)
    xhr.onprogress = event => event.lengthComputable && progress(event.loaded / event.total)
    xhr.onreadystatechange = () => xhr.readyState === XMLHttpRequest.DONE && (
        progress(1),
        xhr.status === 200
        ? deferred.resolve(resource.data = xhr.response)
        : deferred.reject(xhr.statusText)
    )
    xhr.responseType = mapper[resource.type] || 'text'
    xhr.send()
    return deferred
}