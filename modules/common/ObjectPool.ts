export class ObjectPool<T> {
    constructor(private readonly factory: (index: number) => T){}
    private readonly items: Array<T> = []
    private index: number = 0
    recycle(item: T): void {
        let index = this.items.indexOf(item)
        if(index == -1) this.items.push(item)
    }
    aquire(): T {
        return this.items.length
        ? this.items.pop()
        : this.factory(++this.index)
    }
}