import { debounce } from './debounce'
import { Manager, ISystem } from 'framework/Manager'

//TODO move somewhere else
export class Display implements ISystem {
    public readonly canvas: HTMLCanvasElement
    public viewport: { top: number, left: number, width: number, height: number }
    constructor(
        private readonly manager: Manager,
        { width, height }: { width: number, height: number }
    ){
        this.canvas = document.createElement('canvas')
        this.canvas.width = width
        this.canvas.height = height
        document.body.appendChild(this.canvas)
        window.addEventListener('resize', debounce(this.handleResize, 0))
        this.handleResize()
    }
    private readonly handleResize = (): void => {
        this.viewport = this.canvas.getBoundingClientRect()
        if(this.viewport.top >= 0) return
        const { top, left, width, height } = getComputedStyle(this.canvas)
        this.viewport = {
            top: parseFloat(top) || 0,
            left: parseFloat(left) || 0,
            width: parseFloat(width) || 0,
            height: parseFloat(height) || 0
        }
    }
    public get width(): number { return this.canvas.clientWidth }
    public get height(): number { return this.canvas.clientHeight }
}

// 16:9
// 2560x1440
// 1920x1080
// 1366x768
// 1280x720

// 16:10
// 1920x1200
// 1680x1050
// 1440x900
// 1280x800

// 4:3
// 1024x768
// 800x600
// 640x480