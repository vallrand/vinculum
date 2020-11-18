import { Deferred } from 'common/Deferred'
import { IMiddleware, IResource, Store } from '../loader'
import { DATA_TYPE } from '../loader/middleware/DetectType'
import { AudioSystem } from './AudioSystem'

export interface AudioResource {
    index: number
    buffer: AudioBuffer
    offset: number
    duration: number
    loop: number
}

export const DecodeAudio: IMiddleware & { index: number } =
function(this: Store, resource: IResource){
    if(resource.type !== DATA_TYPE.AUDIO) return

    const [ metaData, base64 ] = resource.data.split(',')
    const data = atob(base64)
    const arraybuffer = new Uint8Array(data.length)
    for(let i = 0; i < arraybuffer.length; arraybuffer[i] = data.charCodeAt(i++));

    const audioContext = this.manager.resolveSystem(AudioSystem).context
    return new Deferred<AudioBuffer>().from(function(resolve, reject){
        audioContext.decodeAudioData(arraybuffer.buffer, resolve, reject)
    }).then(buffer => {
        resource.data = <AudioResource> {
            index: ++DecodeAudio.index,
            buffer,
            offset: 0,
            loop: 0,
            duration: buffer.duration
        }
        resource.type = 'sound'
    })
}
DecodeAudio.index = 0