import { vec2 } from 'math/vec2'
import { mat3x2 } from 'math/mat3x2'
import { ISystem, Manager } from 'framework/Manager'
import { Display } from 'common/Display'

export class PointerDeviceSystem implements ISystem {
    public readonly pointers: vec2[] = [vec2()]
    public readonly pressure: boolean[] = [false]
    public readonly scroll: vec2 = vec2()
    private readonly targetElement: Element
    private readonly display: Display
    private viewport: { top: number, left: number, width: number, height: number }
    private readonly displayTransform: mat3x2 = mat3x2()
    constructor(private readonly manager: Manager){
        this.display = manager.resolveSystem(Display)
        const target: EventTarget = this.targetElement = this.display.canvas

        target.addEventListener('touchstart', this.handleTouchStart)
        target.addEventListener('touchmove', this.handleTouchMove)
        target.addEventListener('touchend', this.handleTouchEnd)
        target.addEventListener('touchcancel', this.handleTouchEnd)
        target.addEventListener('mousedown', this.handleMouseDown)
        window.addEventListener('mousemove', this.handleMouseMove)
        window.addEventListener('mouseup', this.handleMouseUp)
        target.addEventListener('wheel', this.handleMouseWheel)
        window.addEventListener('contextmenu', this.handleAltMouse)
    }
    delete(){
        const target: EventTarget = this.targetElement
        target.removeEventListener('touchstart', this.handleTouchStart)
        target.removeEventListener('touchmove', this.handleTouchMove)
        target.removeEventListener('touchend', this.handleTouchEnd)
        target.removeEventListener('touchcancel', this.handleTouchEnd)
        target.removeEventListener('mousedown', this.handleMouseDown)
        window.removeEventListener('mousemove', this.handleMouseMove)
        window.removeEventListener('mouseup', this.handleMouseUp)
        target.removeEventListener('wheel', this.handleMouseWheel)
        window.removeEventListener('contextmenu', this.handleAltMouse)
    }
    private computeCoordinates(x: number, y: number, out: vec2){
        if(this.viewport !== this.display.viewport){
            this.viewport = this.display.viewport
            const { left, top, width, height } = this.viewport
            mat3x2.orthogonal(
                left, left + width,
                top + height, top,
                this.displayTransform
            )
        }
        out[0] = x
        out[1] = y
        mat3x2.transform(out, this.displayTransform, out)
    }
    private readonly handleTouchStart = (event: TouchEvent) => {
        event.preventDefault()
        for(let i = event.changedTouches.length - 1; i >= 0; i--){
            const { clientX, clientY, identifier } = event.changedTouches[i]
            this.pressure[identifier] = true
            if(!this.pointers[identifier]) this.pointers[identifier] = vec2()
            this.computeCoordinates(clientX, clientY, this.pointers[identifier])
        }
    }
    private readonly handleTouchMove = (event: TouchEvent) => {
        event.preventDefault()
        for(let i = event.changedTouches.length - 1; i >= 0; i--){
            const { clientX, clientY, identifier } = event.changedTouches[i]
            this.computeCoordinates(clientX, clientY, this.pointers[identifier])
        }
    }
    private readonly handleTouchEnd = (event: TouchEvent) => {
        event.preventDefault()
        for(let i = event.changedTouches.length - 1; i >= 0; i--){
            const { clientX, clientY, identifier } = event.changedTouches[i]
            this.pressure[identifier] = false
            this.computeCoordinates(clientX, clientY, this.pointers[identifier])
        }
    }
    private readonly handleMouseDown = (event: MouseEvent) => {
        event.preventDefault()
        const { clientX, clientY } = event
        this.pressure[0] = true
        this.computeCoordinates(clientX, clientY, this.pointers[0])
    }
    private readonly handleMouseMove = (event: MouseEvent) => {
        event.preventDefault()
        const { clientX, clientY } = event
        this.computeCoordinates(clientX, clientY, this.pointers[0])
    }
    private readonly handleMouseUp = (event: MouseEvent) => {
        event.preventDefault()
        const { clientX, clientY } = event
        this.pressure[0] = false
        this.computeCoordinates(clientX, clientY, this.pointers[0])
    }
    private readonly handleMouseWheel = (event: WheelEvent) => {
        event.preventDefault()
        const { deltaX, deltaY, deltaMode } = event
        this.scroll[0] += 0.01 * deltaX * [1, 40, 800][deltaMode]
        this.scroll[1] += 0.01 * deltaY * [1, 40, 800][deltaMode]
    }
    private readonly handleAltMouse = (event: MouseEvent) => {
        event.preventDefault()
        event.stopPropagation()
    }
}