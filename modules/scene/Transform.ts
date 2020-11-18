import { ReusableComponent } from 'framework'

export abstract class Transform<Options = any> extends ReusableComponent<Options> {
    static readonly delegate = Transform
    public parent: number = 0
    public lastFrame: number = -1
    abstract calculateTransform(parentTransform: Transform<Options>, frame: number): void
}