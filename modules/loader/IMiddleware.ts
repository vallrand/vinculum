import { Deferred } from '../common/Deferred'
import { Store } from './Store'

export type IProgressHandler = (progress: number) => void

export interface IResource {
    readonly url: string
    type?: string
    data?: any
    shallow?: boolean
}

export interface IMiddleware {
    (this: Store, resource: IResource, progressHandler?: IProgressHandler): Deferred<void> | void
}