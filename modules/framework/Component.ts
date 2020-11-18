import { Manager } from './Manager'
import { IDataArray } from './DataArray'

export interface IComponent<Data, Options = any> {
    allocate?(): IDataArray<Data>
    readonly delegate?: IComponent<Data, Options>
    create(options: Options, entity: number, timeframe: number, manager: Manager): Data
    delete(data: Data): void
}