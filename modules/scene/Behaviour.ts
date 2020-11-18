import { ReusableComponent, EntityManager, IUpdateContext } from 'framework'
import { IUpdateComponent } from './SceneUpdateSystem'

export abstract class Behaviour<Options = any> extends ReusableComponent<Options> implements IUpdateComponent {
    static readonly delegate = Behaviour
    abstract update(context: IUpdateContext, manager: EntityManager, deferred: Function[]): void
}