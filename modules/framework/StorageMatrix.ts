import { IDataArray, DataArray } from './DataArray'

export class StorageMatrix {
    private readonly data: IDataArray[] = []
    private readonly pool: number[] = []
    private pointers: Uint32Array = new Uint32Array

    private segments: number = 0x01
    private capacity: number = 0x01
    private units: number = 0
    private index: number = 0

    public get total(): number { return this.units }
    public get lastIndex(): number { return this.index }
    public nextSegment(dataArray: IDataArray = DataArray.allocate()): number {
        const segments: number = this.data.push(dataArray)
        if(segments >= this.segments) this.reallocate(segments + 1, this.capacity)
        return segments
    }
    public nextUnit(): number {
        const unit: number = this.pool.pop() || (
            ++this.units > this.capacity && this.reallocate(this.segments, this.units),
        this.units)
        this.updateIndex(0, unit, ++this.index)
        return unit
    }
    public recycleUnit(unit: number): void {
        const pointer = this.segments * (unit - 1)
        if(!this.pointers[pointer]) return
        this.pointers[pointer] = 0
        this.pool.push(unit)
    }
    protected reallocate(segments: number, capacity: number){
        const {
            segments: prevSegments,
            capacity: prevCapacity,
            pointers: prevPointers
        } = this

        while(this.segments < segments) this.segments *= 2
        while(this.capacity < capacity) this.capacity *= 2

        const size = this.capacity * this.segments
        if(size === prevPointers.length) return

        this.pointers = new Uint32Array(this.segments * this.capacity)

        if(prevSegments === this.segments)
            this.pointers.set(prevPointers, 0)
        else for(let u = Math.min(prevCapacity, this.units) - 1; u >= 0; u--)
        for(let s = prevSegments - 1; s >= 0; s--)
            this.pointers[u * this.segments + s] = prevPointers[u * prevSegments + s]
    }
    public updateIndex(segment: number, unit: number, index: number): void {
        if(unit) this.pointers[segment + this.segments * --unit] = index
    }
    public lookupIndex(segment: number, unit: number): number {
        return unit ? this.pointers[segment + this.segments * --unit] : 0
    }
    public getData<T>(segment: number, unit: number, timeframe?: number): T {
        if(timeframe){
            const lastIndex: number = this.lookupIndex(0, unit)
            if(!lastIndex || lastIndex > timeframe) return undefined
        }
        let index: number = this.lookupIndex(segment, unit)
        return index ? this.data[--segment].get(index) : undefined
    }
    public insertData<T>(segment: number, unit: number, data: T): void {
        const pointer = segment + this.segments * (unit - 1)
        if(this.pointers[pointer]) throw new Error(`Address ${segment}x${unit} in use.`)
        this.pointers[pointer] = this.data[segment - 1].insert(data, segment, unit, this as any)
    }
    public removeData<T>(segment: number, unit: number): T {
        const pointer: number = segment + this.segments * (unit - 1)
        const index: number = this.pointers[pointer]
        this.pointers[pointer] = 0
        return index
        ? this.data[segment - 1].remove(index, segment, unit, this as any)
        : undefined
    }
}