import { sortedLastIndex, insertionSort } from 'common/sorting'

export interface IStorageMatrix {
    readonly pointers: number[]
    readonly segments: number
    readonly units: number
}

export interface IDataArray<T = any> {
    readonly length: number
    get(index: number): T
    insert(data: T, segment: number, unit: number, storage: IStorageMatrix): number
    remove(index: number, segment: number, unit: number, storage: IStorageMatrix): T
    update?(segment: number, storage: IStorageMatrix): void
}

export class DataArray<T> extends Array<T> implements IDataArray<T> {
    public static allocate<T>(): DataArray<T> {
        return Object.setPrototypeOf([], this.prototype)
    }
    get(index: number): T { return this[--index] }
    insert(data: T): number { return this.push(data) }
    remove(index: number, segment: number, unit: number, storage: IStorageMatrix): T {
        if(index === this.length) return this.pop()
        const data: T = this[--index]
        this[index] = this.pop()
        this.updatePointer(this.length, index, segment, storage)
        return data
    }
    protected updatePointer(prev: number, next: number, segment: number, storage: IStorageMatrix): void {
        let unit = (this[next++] as any).entity
        if(unit) storage.pointers[segment + storage.segments * --unit] = next
        else for(let u = storage.units - 1; u >= 0; u--){
            const pointer = segment + storage.segments * u
            if(storage.pointers[pointer] === prev + 1) storage.pointers[pointer] = next
        }
    }
}

export class OrderedDataArray<T> extends Array<T> implements IDataArray<T> {
    public static allocate<T>(): OrderedDataArray<T> {
        return Object.setPrototypeOf([], this.prototype)
    }
    protected readonly comparator: (a: T, b: T) => number
    get(index: number): T { return this[--index] }
    insert(data: T, segment: number, unit: number, storage: IStorageMatrix): number {
        let index: number = sortedLastIndex(this, data, this.comparator)
        this.splice(index, 0, data)
        this.shiftPointers(++index, 1, segment, storage)
        return index
    }
    remove(index: number, segment: number, unit: number, storage: IStorageMatrix): T {
        const data: T = this.splice(--index, 1)[0]
        this.shiftPointers(index, -1, segment, storage)
        return data
    }
    protected shiftPointers(offset: number, value: number, segment: number, storage: IStorageMatrix): void {
        for(let length = this.length; offset < length; offset++){
            let unit = (this[offset] as any).entity
            if(unit) storage.pointers[segment + storage.segments * --unit] += value
            else break
        }
        if(offset < this.length)
        for(let u = storage.units - 1; u >= 0; u--){
            const pointer = segment + storage.segments * u
            if(storage.pointers[pointer] > offset) storage.pointers[pointer] += value
        }
    }
    update(segment: number, storage: IStorageMatrix): void {
        insertionSort(this, this.comparator)
        for(let i = this.length - 1; i >= 0; i--){
            let unit = (this[i] as any).entity
            if(unit) storage.pointers[segment + storage.segments * --unit] = i + 1
        }
    }
}