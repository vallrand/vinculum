import { addVisibilityEventListener } from 'common/visibility'
import { Manager, ISystem } from './Manager'
import { EntityManager } from './EntityManager'
import { UpdateLoop, IUpdateContext } from './UpdateLoop'

export abstract class ProcedureSystem implements ISystem {
    public static readonly prioritySort = (a: ProcedureSystem, b: ProcedureSystem) => (a.priority || 0) - (b.priority || 0)
    priority?: number
    constructor(protected readonly manager: EntityManager){}
    abstract execute(context: IUpdateContext): void
}

export class ProcedureUpdateSystem implements ISystem {
    private readonly loop: UpdateLoop = new UpdateLoop()
    constructor(private readonly manager: Manager){}
    public start(): void {
        const procedureSystems: ProcedureSystem[] = (this.manager as any).systems
        .filter(system => system instanceof ProcedureSystem)
        .sort(ProcedureSystem.prioritySort)

        this.loop.subscribe(function(context: IUpdateContext){
            for(let system: ProcedureSystem, i = 0; system = procedureSystems[i]; i++) system.execute(context)
        }).start()

        addVisibilityEventListener(toggle => toggle ? this.loop.start() : this.loop.stop())
    }
}