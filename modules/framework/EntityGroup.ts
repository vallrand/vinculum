import { StorageMatrix } from './StorageMatrix'
import { Stream } from '../common/Stream'

export class EntityGroup {
    readonly entities: number[] = []
    public readonly mountEvent: Stream<number> = new Stream<number>()
    public readonly unmountEvent: Stream<number> = new Stream<number>()
    constructor(
        private readonly storage: StorageMatrix,
        readonly segments: number[]
    ){}
    public get length(): number { return this.entities.length }
    public matchEntity(entity: number): boolean {
        for(let i = this.segments.length - 1; i >= 0; i--)
            if(!this.storage.lookupIndex(this.segments[i], entity)) return false
        return true
    }
    public insertEntity(entity: number): void {
        if(~this.entities.indexOf(entity)) return
        this.entities.push(entity)

        this.mountEvent.dispatch(entity)
    }
    public removeEntity(entity: number): void {
        const index = this.entities.indexOf(entity)
        if(!~index) return
        this.entities.splice(index, 1)

        this.unmountEvent.dispatch(entity)
    }
}