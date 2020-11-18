import { ReusableComponent, Mutable, Manager, EntityManager } from 'framework'

export abstract class GroupComponent<Options = any> extends ReusableComponent<Options> {
    readonly manager: EntityManager
    readonly references: number[] = []

    protected static setup(
        item: Mutable<GroupComponent>,
        entity: number,
        timeframe: number,
        manager: Manager
    ): void {
        item.manager = manager as EntityManager

        super.setup(item, entity, timeframe, manager)
    }
    protected static reset(
        item: Mutable<GroupComponent>
    ): void {
        for(let i = item.references.length - 1; i >= 0; i--)
            item.manager.removeEntity(item.references[i])
        item.references.length = 0
        item.manager = null

        super.reset(item)
    }
    createEntity(): number {
        const entity = this.manager.createEntity()
        this.references.push(entity)
        return entity
    }
}