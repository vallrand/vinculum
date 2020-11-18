import { Deferred } from '../common/Deferred'
import { Manager, ISystem } from '../framework/Manager'
import { IResource, IMiddleware, IProgressHandler } from './IMiddleware'

export class Store implements ISystem {
    private static readonly PRECISION = 1e3
    private static readonly FLAG_PROPERTY = 'loading'
    private readonly resources: Record<string, Deferred<IResource>> = Object.create(null)
    constructor(
        protected readonly manager: Manager,
        private readonly middleware: IMiddleware[]
    ){}
    requestSync<T>(key: string): T {
        return this.resources[key].unwrap().data
    }
    request(key: string): Deferred<IResource> {
        if(!this.resources[key]) this.resources[key] = new Deferred<IResource>()
        return this.resources[key]
    }
    load(resources: (string | IResource)[], progress?: IProgressHandler): Deferred<IResource[]> {
        const progressArray = new Uint32Array(resources.length)
        let totalProgress: number = 0
        function updateProgress(index: number, value: number){
            const delta = Math.max(0, Math.round(value * Store.PRECISION) - progressArray[index])
            progressArray[index] += delta
            totalProgress += delta
            if(progress) progress(totalProgress / Store.PRECISION / progressArray.length)
        }
        return Deferred.join(resources
            .map(url => typeof url === 'string' ? { url } : url)
            .map((resource: IResource, index: number) => {
                const deferred = this.request(resource.url)
                if(!deferred[Store.FLAG_PROPERTY]){
                    deferred[Store.FLAG_PROPERTY] = true

                    deferred.from(() => this.middleware
                    .map(middleware => middleware.bind(this, resource, updateProgress.bind(this, index)))
                    .reduce((prev, next) => prev.then(next), Deferred.VOID)
                    .then(() => (
                        updateProgress(index, 1),
                        resource
                    )))
                }
                return deferred
            })
        )
    }
}