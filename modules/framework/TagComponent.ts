import { True, Void, One } from 'common/static'
import { IComponent } from './Component'
import { IDataArray } from './DataArray'

interface ITagComponent extends IComponent<boolean, void> {
    (): ITagComponent
    new(): any
    staticData: IDataArray<boolean>
}

export const TagComponent = function(){
    return Object.create(TagComponent)
} as ITagComponent

TagComponent.create = True
TagComponent.delete = Void
TagComponent.staticData = {
    length: 1,
    get: True,
    insert: One,
    remove: True
}
TagComponent.allocate = (): IDataArray<boolean> => TagComponent.staticData