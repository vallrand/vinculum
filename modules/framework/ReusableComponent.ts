import { ObjectPool } from 'common/ObjectPool'
import { Manager } from './Manager'
import { IComponent } from './Component'

export type Mutable<T> = { -readonly [P in keyof T]-?: T[P] }

const POOL_PROPERTY = '$pool'
interface IReusableComponent<Data, Options> extends IComponent<Data, Options> {
    new(): Data
    [POOL_PROPERTY]: ObjectPool<Data>
    setup(item: Mutable<Data>, entity: number, timeframe: number, manager: Manager): void
    reset(item: Mutable<Data>): void
}

export abstract class ReusableComponent<Options = any> {
    readonly entity: number
    readonly timeframe: number
    static create<Options, T extends ReusableComponent<Options>>(
        this: IReusableComponent<T, Options>,
        options: Options,
        entity: number,
        timeframe: number,
        manager: Manager
    ): T {
        if(!Object.hasOwnProperty.call(this, POOL_PROPERTY))
            this[POOL_PROPERTY] = new ObjectPool<T>(index => new this())
        
        const item: T = this[POOL_PROPERTY].aquire()
        this.setup(item as Mutable<T>, entity, timeframe, manager)
        item.setup(options, manager)
        return item
    }
    static delete<T extends ReusableComponent>(
        this: IReusableComponent<T, any>,
        item: T
    ): void {
        item.reset()
        this.reset(item as Mutable<T>)
        item.constructor[POOL_PROPERTY].recycle(item)
    }
    protected static setup(
        item: Mutable<ReusableComponent>,
        entity: number,
        timeframe: number,
        manager: Manager
    ): void {
        item.entity = entity
        item.timeframe = timeframe
    }
    protected static reset(
        item: Mutable<ReusableComponent>,
    ): void {
        item.entity = 0
    }
    abstract setup(options: Options, manager: Manager): void
    abstract reset(): void
}