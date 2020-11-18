import { Deferred } from 'common/Deferred'
import { addVisibilityEventListener } from 'common/visibility'

export const unlockAudio = (context: AudioContext): Deferred<void> =>
new Deferred<void>().from(function(resolve){
    switch(context.state){
        case 'running': return resolve()
        case 'suspended':
        default: {
            const events = ['touchend', 'mousedown', 'keydown']
            const unlock = () => context.resume().then(() => {
                events.forEach(event => document.removeEventListener(event, unlock))
                addVisibilityEventListener(toggle => toggle ? context.resume() : context.suspend())
                resolve()
            })
            events.forEach(event => document.addEventListener(event, unlock))
        }
    }
})