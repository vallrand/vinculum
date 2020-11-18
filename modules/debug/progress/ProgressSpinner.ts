import { range, clamp } from 'math/utilities'
import { HTMLNode } from '../editor/HTMLNode'
import './spinner.css'

export class ProgressSpinner {
    private root: HTMLElement
    private segments: HTMLElement[]
    private icon: HTMLElement
    constructor(){
        this.segments = range(10).map(index => HTMLNode('div', {
            className: 'spinner-bar-segment-glow',
            style: { opacity: 0 }
        }))
        this.icon = HTMLNode('div', { className: 'spinner-play-icon' }, [
            HTMLNode('div', { className: 'spinner-play-triangle' })
        ])

        this.root = HTMLNode('div', { className: 'spinner-overlay' }, [
            HTMLNode('div', { className: 'spinner-bar' }, this.segments.map((glow, index) => (
                HTMLNode('div', {
                    className: 'spinner-bar-segment',
                    style: { animationDelay: `${index * 0.1}s` }
                }, [glow])
            ))),
            HTMLNode('div', { className: 'spinner-controls' }, [this.icon])
        ])

        document.body.appendChild(this.root)
    }
    set progress(value: number){
        const threshold = value * this.segments.length
        for(let i = 0; i < this.segments.length; i++)
            this.segments[i].style.opacity = clamp(threshold - i, 0, 1) as any
    }
    awaitGesture(){
        this.icon.classList.add('enabled')
    }
    delete(){
        this.root.parentNode.removeChild(this.root)
        this.root = this.icon = this.segments = null
    }
}