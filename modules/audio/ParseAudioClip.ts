import { IMiddleware, IResource, Store } from '../loader'
import { DATA_TYPE } from '../loader/middleware/DetectType'

import { AudioResource, DecodeAudio } from './DecodeAudio'

export const ParseAudioClip: IMiddleware = function(this: Store, resource: IResource){
    if(resource.type !== DATA_TYPE.JSON || !resource.data.clips) return

    const { clips, filename } = resource.data
    const audioFilepath = `${resource.url.replace(/[^\/]*$/i,'')}${filename}`
    return this.request(audioFilepath).then((audioResource: IResource & { data: AudioResource }) =>
        this.load(Object.keys(clips).map(key => {
            const [ offset, duration, loop ] = clips[key]
            return <IResource> {
                url: key,
                type: 'soundclip',
                data: <AudioResource> {
                    index: ++DecodeAudio.index,
                    buffer: audioResource.data.buffer,
                    offset: offset * 1e-3,
                    duration: duration * 1e-3,
                    loop: loop * 1e-3
                }
            }
        }))) as any
}