import { Manager } from './Manager'
import { StorageMatrix } from './StorageMatrix'
import { DataView } from './DataView'
import { EntityGroup } from './EntityGroup'
import { IComponent } from './Component'

export class EntityManager extends Manager {
    private readonly storage: StorageMatrix = new StorageMatrix
    private readonly components: IComponent<any>[] = []
    private readonly views: DataView<any>[] = []
    private readonly groups: Record<string, EntityGroup> = Object.create(null)
    
    public createEntity(): number {
        const entity: number = this.storage.nextUnit()
        //TODO create components based on provided options?
        return entity
    }
    public removeEntity(entity: number): void {
        if(!this.storage.lookupIndex(0, entity)) return

        for(let i = this.components.length - 1; i > 0; i--)
            if(this.storage.lookupIndex(i, entity))
                this.removeComponent(entity, this.components[i])
        
        this.storage.recycleUnit(entity)
    }
    public createComponent<Data, Options>(entity: number, Component: IComponent<Data, Options>, options?: Options): Data {
        const segment: number = this.indexComponent(Component)
        if(this.storage.lookupIndex(segment, entity))
            throw new Error(`Duplicate Entry: [${segment},${entity}]`)

        const data: Data = Component.create(options, entity, this.storage.lastIndex, this)
        this.storage.insertData(segment, entity, data)
        
        for(let groupKey in this.groups){
            let group: EntityGroup = this.groups[groupKey]

            if(!~group.segments.indexOf(segment)) continue
            if(!group.matchEntity(entity)) continue

            group.insertEntity(entity)
        }
        return data
    }
    public removeComponent<Data>(entity: number, Component: IComponent<Data>): void {
        const segment: number = this.indexComponent(Component)
        if(!this.storage.lookupIndex(segment, entity))
            throw new Error(`Missing entry: [${segment},${entity}].`)
        
        for(let groupKey in this.groups){
            let group: EntityGroup = this.groups[groupKey]

            if(!~group.segments.indexOf(segment)) continue
            if(!group.matchEntity(entity)) continue

            group.removeEntity(entity)
        }

        const data: Data = this.storage.removeData(segment, entity)
        Component.delete(data)
    }
    public aquireComponent<Data>(entity: number, Component: IComponent<Data>, timeframe?: number): Data {
        const segment: number = this.indexComponent(Component)
        return this.storage.getData(segment, entity, timeframe)
    }
    protected indexComponent(Component: IComponent<any>): number {
        Component = Component.delegate || Component
        if(!Object.hasOwnProperty.call(Component, this.cachePrefix)){
            const segment = this.storage.nextSegment(Component.allocate && Component.allocate())
            this.components[Component[this.cachePrefix] = segment] = Component
        }
        return Component[this.cachePrefix]
    }
    public queryEntityGroup(components: IComponent<any>[]): EntityGroup {
        const segments = components.map(this.indexComponent, this).sort()
        const key = segments.join('-')
        if(!this.groups[key]){
            const group: EntityGroup = this.groups[key] = new EntityGroup(this.storage, segments)
            for(let entity = this.storage.total; entity > 0; entity--)
                if(group.matchEntity(entity)) group.insertEntity(entity)
        }
        return this.groups[key]
    }
    public aquireDataView<Data>(Component: IComponent<Data>): DataView<Data> {
        const segment: number = this.indexComponent(Component)
        if(!this.views[segment]) this.views[segment] = new DataView<Data>(this.storage, segment)
        return this.views[segment]
    }
    public linkEntity(entity: number, references: number[], timeframe: number): number {
        let shift = 0
        for(let length = references.length, i = 0; i < length; i++){
            if(shift) references[i - shift] = references[i]
            const lastIndex = this.storage.lookupIndex(0, references[i])
            if(lastIndex && lastIndex <= timeframe) continue
            shift++ 
        }
        references.length -= shift
        references.push(entity)
        return this.storage.lookupIndex(0, entity)
    }
}