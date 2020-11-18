import { IMiddleware, IResource } from '../IMiddleware'
import { DATA_TYPE } from './DetectType'

export const ParseXML: IMiddleware = function(resource: IResource){
    if(resource.type !== DATA_TYPE.XML || typeof resource.data !== 'string') return
    resource.data = new DOMParser().parseFromString(resource.data, 'text/xml')
}