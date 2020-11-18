import { vec2, mat3x2, rgba, AABB, snapToGrid } from 'math'
import { Transform2D } from 'scene'
import { RigidBody, ShapeType, Line, Convex, Circle, Box, Particle } from 'physics'
import { fromConcavePath } from 'physics/helpers/decomposePolygon'

import { EditorSubSystem, IEditorUpdateContext, HTMLNode } from './editor'

export class ShapeConstructor extends EditorSubSystem {
    private static readonly temp: vec2 = vec2()

    public drawType: ShapeType = ShapeType.LINE
    private readonly path: vec2[] = []

    readonly key: string = 'shape'

    update(context: IEditorUpdateContext){
        this.graphics.clear()
        if(!context.camera || !this.enabled) return

        if(EditorSubSystem.gridSize) snapToGrid(context.worldPosition, EditorSubSystem.gridSize, context.worldPosition)
        let entity = context.selectedEntity
        if(!entity){
            entity = context.selectedEntity = this.manager.createEntity()
            this.manager.createComponent(entity, Transform2D, { position: [0,0] })
        }
        let body = this.manager.aquireComponent(entity, RigidBody) as RigidBody
        if(!body) body = this.manager.createComponent(entity, RigidBody, {
            mass: 0, type: 0, shapes: []
        }) as RigidBody

        this.menu.entity['value'] = context.selectedEntity

        switch(this.drawType){
            case ShapeType.LINE: return this.drawLine(context, body)
            case ShapeType.CONVEX: return this.drawConvex(context, body)
            case ShapeType.PARTICLE: return this.drawParticle(context, body)
            case ShapeType.CIRCLE: return this.drawCircle(context, body)
        }
    }
    private drawLine(context: IEditorUpdateContext, body: RigidBody){
        if(context.trigger) this.path.push(
            vec2.copy(context.worldPosition, vec2()),
            vec2.copy(context.worldPosition, vec2())
        )
        else if(context.release){
            constructLine: {
                const start = this.path[0], end = this.path[1]
                const difference = vec2.subtract(end, start, vec2())
                const length = vec2.magnitude(difference)
                if(length < 1e-3) break constructLine
                const middle = vec2.add(start, end, vec2())
                vec2.scale(middle, 0.5, middle)
                vec2.subtract(middle, body.position, middle)
                vec2.rotate(middle, -body.angle, middle)
                const angle = vec2.rotation(difference)
                const shape = new Line(middle, angle - body.angle, length)
                body.shapes.push(shape.recalculateStaticProperties())
                body.recalculateStaticProperties()
            }

            this.path.length = 0
        }else if(context.pressed) vec2.copy(context.worldPosition, this.path[this.path.length - 1])

        for(let i = 0; i < this.path.length; i++)
            if(i) this.graphics.lineTo(this.path[i][0], this.path[i][1])
            else this.graphics.beginPath(this.path[i][0], this.path[i][1])
        if(this.path.length) this.graphics.stroke(rgba(0xFF,0xFF,0xFF,0xFF), 4)
    }
    private drawConvex(context: IEditorUpdateContext, body: RigidBody){
        if(context.trigger){ 
            this.path.push(vec2.copy(context.worldPosition, vec2()))
            if(this.path.length == 1) this.path.push(vec2.copy(context.worldPosition, vec2()))
        }else if(context.release){
            constructPolygon: {
                const distance = vec2.distance(this.path[0], this.path[this.path.length -1])
                if(distance > 1e-3) break constructPolygon
                this.path.pop()
                const { shapes, center } = fromConcavePath(this.path)
                shapes.forEach(shape => {
                    vec2.add(shape.position, center, shape.position)
                    vec2.subtract(shape.position, body.position, shape.position)
                    vec2.rotate(shape.position, -body.angle, shape.position)
                    shape.angle -= body.angle
                    body.shapes.push(shape.recalculateStaticProperties())
                })
                body.recalculateStaticProperties()
                this.path.length = 0
            }
        }else if(context.pressed) vec2.copy(context.worldPosition, this.path[this.path.length - 1])

        for(let i = 0; i < this.path.length; i++)
            if(i) this.graphics.lineTo(this.path[i][0], this.path[i][1])
            else this.graphics.beginPath(this.path[i][0], this.path[i][1])
        if(this.path.length) this.graphics.stroke(rgba(0xFF,0xFF,0xFF,0xFF), 4)
    }
    private drawParticle(context: IEditorUpdateContext, body: RigidBody){
        if(context.trigger) this.path.push(vec2.copy(context.worldPosition, vec2()))
        else if(context.release){
            constructParticle: {
                const position = this.path[0]
                vec2.subtract(position, body.position, position)
                vec2.rotate(position, -body.angle, position)
                const shape = new Particle(position, 0)
                body.shapes.push(shape.recalculateStaticProperties())
                body.recalculateStaticProperties()
            }
            this.path.length = 0
        }else if(context.pressed) vec2.copy(context.worldPosition, this.path[this.path.length - 1])

        if(this.path.length)
        this.graphics
        .beginPath(this.path[0][0] + 10, this.path[0][1])
        .arc(this.path[0][0], this.path[0][1], 10, 0, 2 * Math.PI)
        .fill(rgba(0xFF,0xFF,0xFF,0xFF))
    }
    private drawCircle(context: IEditorUpdateContext, body: RigidBody){
        if(context.trigger) this.path.push(
            vec2.copy(context.worldPosition, vec2()),
            vec2.copy(context.worldPosition, vec2())
        )
        else if(context.release){
            constructCircle: {
                const radius = vec2.distance(this.path[0], this.path[1])
                if(radius < 1e-3) break constructCircle
                const position = this.path[0]
                vec2.subtract(position, body.position, position)
                vec2.rotate(position, -body.angle, position)
                const shape = new Circle(position, 0, radius)
                body.shapes.push(shape.recalculateStaticProperties())
                body.recalculateStaticProperties()
            }
            this.path.length = 0
        }else if(context.pressed) vec2.copy(context.worldPosition, this.path[this.path.length - 1])

        if(this.path.length)
            this.graphics
            .beginPath(this.path[0][0], this.path[0][1])
            .arc(this.path[0][0], this.path[0][1], vec2.distance(this.path[0], this.path[1]), 0, 2 * Math.PI)
            .stroke(rgba(0xFF,0xFF,0xFF,0xFF), 4)
    }
    buildMenu(){
        this.menu.entity = HTMLNode('input', { type: 'number', disabled: true, min: 0, max: 1e6 })

        return [HTMLNode('div', { className: 'vertical' }, [
            HTMLNode('div', { className: 'horizontal', innerText: 'Entity: ' }, [this.menu.entity]),
            HTMLNode('div', { className: 'horizontal', innerText: 'Shape: ' }, [
                HTMLNode('select', {}, [
                    HTMLNode('option', { innerText: 'Line', value: ShapeType.LINE }),
                    HTMLNode('option', { innerText: 'Convex', value: ShapeType.CONVEX }),
                    HTMLNode('option', { innerText: 'Particle', value: ShapeType.PARTICLE }),
                    HTMLNode('option', { innerText: 'Circle', value: ShapeType.CIRCLE })
                ], {
                    change: (event: Event) => {
                        const value = (event.target as HTMLSelectElement).value
                        this.drawType = +value as ShapeType
                    }
                })
            ])
        ])]
    }
    print(): string {
        const biomes = [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,0]
        const bodies: RigidBody[] = (this.manager.aquireDataView<RigidBody>(RigidBody).data as any).internal
        return JSON.stringify(bodies.filter(body => body.type == 0).map((body, i) => {
            const center = vec2()
            for(let i = 0; i < body.shapes.length; i++) vec2.add(center, body.shapes[i].position, center)
            vec2.scale(center, 1 / body.shapes.length, center)
            if(EditorSubSystem.gridSize) snapToGrid(center, EditorSubSystem.gridSize, center)
            return {
                biome: biomes[i],
                aabb: [Infinity, Infinity, -Infinity, -Infinity],
                center: [...vec2.add(center, body.position, vec2())],
                path: body.shapes.map(function(shape){
                    const path: vec2[] = []
                    switch(shape.type){
                        case ShapeType.LINE: {
                            const line = shape as Line
                            path.push(
                                [-0.5 * line.length, 0],
                                [0.5 * line.length, 0]
                            )
                            break
                        }
                    }
                    return path.map(vertex => {
                        vec2.rotate(vertex, shape.angle, vertex)
                        vec2.add(vertex, shape.position, vertex)
                        vec2.subtract(vertex, center, vertex)
                        return snapToGrid(vertex, 1e-3, vertex)
                    })
                })
            }
        }).map(t => {
            t.path.forEach(s => s.forEach(v => {
                t.aabb[0] = Math.min(t.aabb[0], v[0] + t.center[0])
                t.aabb[1] = Math.min(t.aabb[1], v[1] + t.center[1])
                t.aabb[2] = Math.max(t.aabb[2], v[0] + t.center[0])
                t.aabb[3] = Math.max(t.aabb[3], v[1] + t.center[1])
            }))
            return t
        }),null,0)
    }
    //TODO remove
    appendLast(list){
        list = JSON.parse(list).map(l => ({ ...l, path: l.path.map(sh => sh.map(v => vec2.add(v, l.center, v))) }))
        let last = list[list.length - 1]
        let prevpath = last.path
        let flag = true
        return JSON.stringify(list.slice(0, -1).map(({ center, path }, i) => {
            if(!flag) return null
            if(path.some(([a,b]) => prevpath.some(([c,d]) => {
                return vec2.distance(a, c) < 1e-6 && vec2.distance(b, d) < 1e-6
            }))){
                flag = false
                return {
                    i,
                    center: center,
                    path: [
                        ...path.map(s => s.map(v => vec2.subtract(v, center, v))),
                        ...prevpath.map(s => s.map(v => vec2.subtract(v, center, v)))
                    ]
                }
            }
            return false
        }).find(v => !!v),null, 0)
    }
}