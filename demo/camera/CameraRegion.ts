import { vec2, AABB } from 'math'
import { ReusableComponent } from 'framework'

interface CameraRegionOptions {
    bounds: AABB
    view: vec2
    lockX: number
    lockY: number
}

export class CameraRegion extends ReusableComponent<CameraRegionOptions> {
    aabb: AABB = AABB()
    view: vec2 = vec2()
    lockX: number = null
    lockY: number = null

    setup(options: CameraRegionOptions){
        AABB.copy(options.bounds, this.aabb)
        vec2.copy(options.view, this.view)
        this.lockX = options.lockX
        this.lockY = options.lockY
    }
    reset(){}
}