interface ISubscriber<T> {
    (value: T): void
    single?: boolean
}

export class Stream<T> {
    private readonly subscribers: ISubscriber<T>[] = []
    private readonly iterator: number[] = []
    subscribe(subscriber: ISubscriber<T>, options?: { single: boolean }): this {
        const index = this.subscribers.indexOf(subscriber)
        if(~index) return this
        Object.assign(subscriber, options)
        this.subscribers.push(subscriber)
        return this
    }
    unsubscribe(subscriber: ISubscriber<T>): this {
        const index = this.subscribers.indexOf(subscriber)
        if(!~index) return this
        this.subscribers.splice(index, 1)
        for(let i = this.iterator.length - 1; i >= 0; i--)
            if(index < this.iterator[i]) this.iterator[i]--
        return this
    }
    dispatch(value: T): this {
        const depth = this.iterator.length
        for(this.iterator[depth] = this.subscribers.length - 1; this.iterator[depth] >= 0; this.iterator[depth]--){
            const subscriber = this.subscribers[this.iterator[depth]]
            if(subscriber.single) this.unsubscribe(subscriber)
            subscriber.apply(this, arguments)
        }
        this.iterator.length--
        return this
    }
}