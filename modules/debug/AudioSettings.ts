import { EditorSubSystem, IEditorUpdateContext, HTMLNode } from './editor'
import { AudioChannel } from 'audio'
import { SoundscapeSystem } from '../../demo/soundscape'

export class AudioSettings extends EditorSubSystem {
    readonly key: string = 'audio'
    update(context: IEditorUpdateContext){
    }
    buildMenu(){
        this.menu.sfx = HTMLNode('input', { type: 'range', value: 50, min: 0, max: 100 }, null, {
            change: (event: Event) => {
                const volume = 0.01 * parseFloat((event.target as HTMLSelectElement).value)
                const channel = this.manager.resolveSystem(SoundscapeSystem).sfx
                this.manager.aquireComponent<AudioChannel<any>>(channel, AudioChannel).volume = volume
            }
        })
        this.menu.music = HTMLNode('input', { type: 'range', value: 50, min: 0, max: 100 }, null, {
            change: (event: Event) => {
                const volume = 0.01 * parseFloat((event.target as HTMLSelectElement).value)
                const channel = this.manager.resolveSystem(SoundscapeSystem).music
                this.manager.aquireComponent<AudioChannel<any>>(channel, AudioChannel).volume = volume
            }
        })

        return [HTMLNode('div', { className: 'vertical', style: { alignItems: 'flex-end' } }, [
            HTMLNode('div', { className: 'horizontal', innerText: 'Sound Effects: ' }, [this.menu.sfx]),
            HTMLNode('div', { className: 'horizontal', innerText: 'Music: ' }, [this.menu.music])
        ])]
    }
}