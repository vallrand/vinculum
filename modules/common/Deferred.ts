enum STATE {
    PENDING,
    RESOLVED,
    REJECTED
}

export class Deferred<T> {
    private value: T | Error | any
    private state: STATE = STATE.PENDING
    private readonly listeners: ((self: this) => void)[] = []
    private drain(): void {
        if(this.state === STATE.PENDING) return
        while(this.listeners.length)
            this.listeners.pop().call(this)
    }
    from(initializer:
        (() => T | Deferred<T>) |
        ((resolve: (value: T) => void, reject: (error: any) => any) => void)
    ): this {
        try{
            const callable = typeof initializer === 'function'
            if(callable && initializer.length > 0)
                initializer.call(this, this.resolve.bind(this), this.reject.bind(this))
            else{
                const value = callable ? initializer.call(this) : initializer

                if(value && typeof value.then === 'function')
                    value.then(
                        this.resolve.bind(this),
                        this.reject.bind(this)
                    )
                else
                    this.resolve(value)
            }
        }catch(error){
            this.reject(error)
        }
        return this
    }
    unwrap(): T {
        if(this.state === STATE.RESOLVED)
            return this.value
        else if(this.state === STATE.REJECTED)
            throw this.value
    }
    resolve(value: T): this {
        if(this.state !== STATE.PENDING) return this
        this.state = STATE.RESOLVED
        this.value = value
        this.drain()
        return this
    }
    reject(error: any): this {
        if(this.state !== STATE.PENDING) return this
        this.state = STATE.REJECTED
        this.value = error
        this.drain()
        return this
    }
    then<R>(
        resolve?: (value: T) => R | Deferred<R>,
        reject?: (error: any) => R | Deferred<R>
    ): Deferred<R> {
        const deferred = new Deferred<R>()
        this.listeners.push(deferred.from.bind(deferred, () => {
            if(this.state === STATE.RESOLVED && resolve)
                return resolve(this.value)
            else if(this.state === STATE.REJECTED)
                if(reject) return reject(this.value)
                else throw this.value
            return this.value
        }))
        this.drain()
        return deferred
    }
    static join(array: Deferred<any>[]): Deferred<any[]> {
        const joined = new Deferred<any[]>()
        let remaining = array.length
        if(!remaining) return joined.resolve([])
        function listener(){
            if(this.state === STATE.REJECTED)
                joined.reject(this.value)
            else if(this.state === STATE.RESOLVED && !--remaining)
                joined.resolve(array.map(deferred => deferred.unwrap()))
        }
        array.forEach(function(deferred){
            deferred.listeners.push(listener)
            deferred.drain()
        })
        return joined
    }
    static VOID: Deferred<void> = new Deferred<void>().resolve()
}