export class Int16TupleMap<T> {
    private readonly values: Record<number, T> = Object.create(null)
    private readonly keys: number[] = []
    private combineKey(indexA: number, indexB: number): number {
        return indexA <= indexB
        ? (indexA << 16 | indexB & 0xFFFF)
        : (indexB << 16 | indexA & 0xFFFF)
    }
    public get(indexA: number, indexB: number): T {
        return this.values[this.combineKey(indexA, indexB)]
    }
    public set(indexA: number, indexB: number, value: T): void {
        const key = this.combineKey(indexA, indexB)
        if(this.values[key] === undefined) this.keys.push(key)
        this.values[key] = value
    }
    public clear(index?: number): void {
        if(index) for(let i = this.keys.length - 1; i >= 0; i--){
            let key = this.keys[i]
            if((key & 0xFFFF) !== index && (key >>> 16) !== index) continue
            this.keys.splice(i, 1)
            this.values[key] = undefined
        } else {
            for(let i = this.keys.length - 1; i >= 0; i--)
                this.values[this.keys[i]] = undefined
            this.keys.length = 0
        }
    }
}