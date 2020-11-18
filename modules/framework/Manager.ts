export interface ISystem {}

export type SystemInitializer<System extends ISystem, Options = any> =
    new (manager: Manager, options: Options) => System

export class Manager {
    private static INDEX: number = 0
    protected readonly cachePrefix: string = `$0-${Manager.INDEX++}`
    private readonly systems: ISystem[] = []
    registerSystem<Options>(System: SystemInitializer<ISystem, Options>, options: Options): this {
        if(Object.hasOwnProperty.call(System, this.cachePrefix))
            throw new RangeError(`Duplicate Declaration!`)
        const index: number = this.systems.length++
        Object.defineProperty(System, this.cachePrefix, { value: index })
        this.systems[index] = new System(this, options)
        return this
    }
    resolveSystem<Instance extends ISystem>(System: SystemInitializer<Instance>): Instance {
        if(!Object.hasOwnProperty.call(System, this.cachePrefix))
            throw new RangeError(`Missing Declaration!`)
        const index: number = System[this.cachePrefix]
        return <Instance> this.systems[index]
    }
}