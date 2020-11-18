import { Deferred } from '../../common/Deferred'
import { IMiddleware, IResource, IProgressHandler } from '../IMiddleware'
import { Store } from '../Store'

export const Throttle = function(batchSize = 16){
    const queue: (() => IResource)[] = []
    const concurrent: IResource[] = []
    function drain(resource: IResource): void {
        const index = concurrent.indexOf(resource)
        if(!~index) concurrent.splice(index, 1)
        while(concurrent.length < batchSize && queue.length)
            concurrent.push(queue.shift()())
    }

    return (middleware: IMiddleware): IMiddleware =>
    function(this: Store, resource: IResource, progress: IProgressHandler){
        const deferred = new Deferred<void>()
        queue.push(() => {
            new Deferred<void>()
            .from(middleware.bind(this, resource, progress))
            .then(value => {
                drain(resource)
                deferred.resolve(value)
            }, error => {
                drain(resource)
                deferred.reject(error)
            })
            return resource
        })
        drain(null)
        return deferred
    }
}