import { EntityManager, IUpdateContext, ProcedureUpdateSystem, ISystem } from 'framework'
import { EditorSubSystem, IEditorUpdateContext, HTMLNode } from './editor'

import { Renderer2DSystem } from 'renderer'

export class PerformanceMonitor extends EditorSubSystem {
    readonly key: string = 'monitor'
    private readonly state = {
        drawCalls: 0,
        fps: 0,
        elapsed: []
    }
    private timeElapsed: number = 0
    private updateContext: IUpdateContext
    update(context: IEditorUpdateContext){
        if(!this.enabled) return

        this.attachListeners()

        this.timeElapsed += this.updateContext.deltaTime
        this.state.fps++
        if(this.timeElapsed >= 1){
            this.timeElapsed -= 1
            this.menu.fps.innerText = `${this.state.fps}`
            this.state.fps = 0
        }

        this.menu.drawCalls.innerText = `${this.state.drawCalls}`
        this.state.drawCalls = 0


        if(this.updateContext.frame % 10 == 0){
            this.state.elapsed.sort((b, a) => a.value - b.value)
            this.menu.elapsed.innerText = this.state.elapsed.slice(0, 6)
            .map(counter => (counter.value / 10).toFixed(2)).join('|') + ' - ' +
            this.state.elapsed.slice(0, 6).map(counter => counter.name).join('|')
            this.state.elapsed.forEach(counter => counter.value = 0)
        }
    }
    attachListeners(){
        if(this.updateContext) return
        this.updateContext = this.manager.resolveSystem<any>(ProcedureUpdateSystem).loop
        const gl = this.manager.resolveSystem(Renderer2DSystem).gl as any
        gl.drawElements = ((original, callback) => function(){
            callback()
            return original.apply(this, arguments)
        })(gl.drawElements, () => this.enabled && this.state.drawCalls++)
        gl.drawArrays = ((original, callback) => function(){
            callback()
            return original.apply(this, arguments)
        })(gl.drawArrays, () => this.enabled && this.state.drawCalls++)

        const systems: ISystem[] = (this.manager as any).systems.filter(system => system.execute)
        this.state.elapsed = systems.map((system: any) => {
            const counter = {
                value: 0,
                name: system.constructor.name
            }

            system.execute = ((original, callback) => function(){
                const timestamp = performance.now()
                const out = original.apply(this, arguments)
                callback(performance.now() - timestamp)
                return out
            })(system.execute, (elapsed) => {
                counter.value += elapsed
            })

            return counter
        })
    }
    buildMenu(){
        this.menu.drawCalls = HTMLNode('div', { className: 'horizontal', innerText: '' })
        this.menu.fps = HTMLNode('div', { className: 'horizontal', innerText: '' })
        this.menu.elapsed = HTMLNode('div', { className: 'horizontal', style: { whiteSpace: 'nowrap' }, innerText: '' })

        return [HTMLNode('div', { className: 'horizontal' }, [
            HTMLNode('div', { className: 'vertical' }, [
                HTMLNode('div', { className: 'horizontal', innerText: 'DrawCalls: ' }, [this.menu.drawCalls]),
                HTMLNode('div', { className: 'horizontal', innerText: 'FPS: ' }, [this.menu.fps]),
            ]),
            HTMLNode('div', { className: 'vertical' }, [
                HTMLNode('div', { className: 'horizontal', innerText: 'Elapsed: ' }, [this.menu.elapsed])
            ])
        ])]
    }
}