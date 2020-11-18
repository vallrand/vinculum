import { Deferred } from 'common/Deferred'
import { ProcedureSystem, EntityManager, IUpdateContext, DataView } from 'framework'

import { SpatialAudio } from './spatial/SpatialAudio'
import { ListenerTransform } from './spatial/ListenerTransform'
import { unlockAudio } from './unlockAudio'

export class AudioSystem extends ProcedureSystem {
    public readonly context: AudioContext
	private readonly sources: DataView<SpatialAudio> = this.manager.aquireDataView<SpatialAudio>(SpatialAudio)
	
	public readonly listener: ListenerTransform
    constructor(manager: EntityManager){
		super(manager)
		this.context = new AudioContext
		this.listener = new ListenerTransform(this.context)
    }
    unlock(): Deferred<void> {
        return unlockAudio(this.context)
    }
	execute(context: IUpdateContext){
		if(this.listener.lastFrame === -1)
			this.listener.lastFrame = context.frame

		const sources: SpatialAudio[] = this.sources.data as any
		for(let i = sources.length - 1; i >= 0; i--){
			const source = sources[i]
			source.update(this.manager, this, context.frame)
		}
	}
}