import { ProcedureSystem, EntityManager, IUpdateContext, DataView, IComponent } from 'framework'

export interface IUpdateComponent {
    update(context: IUpdateContext, manager: EntityManager, deferred: Function[]): void
}

export class SceneUpdateSystem extends ProcedureSystem {
    private readonly views: DataView<IUpdateComponent>[]
    private readonly deferred: Function[] = []
    constructor(manager: EntityManager, components: IComponent<IUpdateComponent | any>[]){
        super(manager)
        this.views = components.map(Component => manager.aquireDataView(Component))
    }
    execute(context: IUpdateContext): void {
        for(let i = 0; i < this.views.length; i++){
            const components: IUpdateComponent[] = this.views[i].data as any
            for(let j = 0; j < components.length; j++)
                components[j].update(context, this.manager, this.deferred)
        }

        for(let length = this.deferred.length, i = 0; i < length; i++)
            this.deferred[i].call(this)
        this.deferred.length = 0
    }
}