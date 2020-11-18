import { ProcedureSystem, EntityManager, IUpdateContext, DataView } from 'framework'
import { Transform } from './Transform'

export class TransformUpdateSystem extends ProcedureSystem {
    private transforms: DataView<Transform>
    constructor(manager: EntityManager){
        super(manager)
        this.transforms = manager.aquireDataView<Transform>(Transform)
    }
    execute(context: IUpdateContext): void {
        const { frame } = context
        const transforms = this.transforms.data
        for(let transform: Transform, i = 0; transform = transforms[i]; i++){
            if(transform.lastFrame === frame) continue
            const parent = this.transforms.lookupIndex(transform.parent, transform.timeframe)
            if(parent > i){
                transforms[i] = transforms[parent - 1]
                transforms[parent - 1] = transform
                this.transforms.updateIndex(transform.entity, parent)
                this.transforms.updateIndex(transform.parent, i + 1)
                i--
                continue
            }
            const parentTransform = parent ? transforms[parent - 1] : null
            transform.calculateTransform(parentTransform, frame)
        }
    }
}