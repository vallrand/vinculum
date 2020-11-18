import { IDataArray } from './DataArray'
import { StorageMatrix } from './StorageMatrix'

export class DataView<T> {
    public lastFrame: number = -1
    constructor(
        private readonly storage: StorageMatrix,
        private readonly segment: number
    ){}
    public get data(): IDataArray<T> {
        return (this.storage as any).data[this.segment - 1] as IDataArray<T>
    }
    public lookupIndex(unit: number, timeframe: number): number {
        const lastIndex: number = this.storage.lookupIndex(0, unit)
        if(!lastIndex || lastIndex > timeframe) return 0
        return this.storage.lookupIndex(this.segment, unit)
    }
    public updateIndex(unit: number, index: number): void {
        this.storage.updateIndex(this.segment, unit, index)
    }
    public update(frame: number): void {
        if(this.lastFrame != -1) return
        this.data.update(this.segment, this.storage as any)
        this.lastFrame = frame
    }
}