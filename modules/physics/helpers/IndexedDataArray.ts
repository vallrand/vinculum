import { Stream } from 'common/Stream'
import { IStorageMatrix, IDataArray } from 'framework'

interface IndexedData {
    identifier: number
    index: number
    entity?: number
}

export class IndexedDataArray<T extends IndexedData> implements IDataArray<T> {
    public readonly insertEvent: Stream<T> = new Stream
    public readonly removeEvent: Stream<T> = new Stream
    private readonly pool: number[] = []
    private sparseIndex: number = 0
    readonly internal: T[] = []
    public get length(): number { return this.internal.length }
    public get(index: number): T { return this.internal[index - 1] }
    public insert(data: T, segment: number, unit: number, storage: IStorageMatrix): number {
        const index = this.internal.push(data)
        data.index = index - 1
        data.identifier = this.pool.pop() || ++this.sparseIndex
        this.insertEvent.dispatch(data)
        return index
    }
    remove(index: number, segment: number, unit: number, storage: IStorageMatrix): T {
        const data: T = this.internal[index - 1]

        if(index === this.internal.length) this.internal.length--
        else {
            const swap: T = this.internal.pop()
            this.internal[index - 1] = swap
            swap.index = index - 1
            let unit = swap.entity
            if(unit) storage.pointers[segment + storage.segments * --unit] = index
        }

        this.removeEvent.dispatch(data)
        data.index = -1
        this.pool.push(data.identifier)
        data.identifier = -1
        return data
    }
}