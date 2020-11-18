import { vec2, mat3x2, rgba, AABB, snapToGrid } from 'math'
import { DataView } from 'framework'
import { RigidBody, ShapeType, Shape, Line, Convex, Circle, Particle, PhysicsSystem } from 'physics'
import { Transform2D } from 'scene'
import { EditorSubSystem, IEditorUpdateContext, HTMLNode } from './editor'

export class PhysicsDebugSystem extends EditorSubSystem {
    private static readonly temp: vec2 = vec2()
    private static readonly tempAABB: AABB = AABB()
    private static readonly shapeTransform: mat3x2 = mat3x2()

    private readonly bodies: DataView<RigidBody> = this.manager.aquireDataView<RigidBody>(RigidBody)
    private readonly transforms: DataView<Transform2D> = this.manager.aquireDataView<Transform2D>(Transform2D)
    private readonly prevPosition: vec2 = vec2()

    private visible: boolean = false
    private showAABB: boolean = false
    private lineColor: rgba = rgba(0x7F, 0x7F, 0x7F, 0xFF)
    private fillColor: rgba = rgba(0x3F, 0x3F, 0x3F, 0x7F)
    private aabbColor: rgba = rgba(0x7F, 0x00, 0x00, 0xFF)

    readonly key: string = 'physics'
    update(context: IEditorUpdateContext){
        this.graphics.clear()
        if(this.visible) this.renderShapes(context)
        
        if(this.enabled){
            const targetEntity = this.queryEntity(context.worldPosition)
            
            if(context.trigger){
                vec2.copy(context.worldPosition, this.prevPosition)
                context.selectedEntity = targetEntity
                if(context.selectedEntity){
                    const transform = this.manager.aquireComponent<Transform2D>(context.selectedEntity, Transform2D)
                    vec2.subtract(this.prevPosition, transform.localPosition, this.prevPosition)
                }
            }else if(context.pressed && context.selectedEntity){
                const transform = this.manager.aquireComponent<Transform2D>(context.selectedEntity, Transform2D)
                vec2.subtract(context.worldPosition, this.prevPosition, transform.localPosition)
                if(EditorSubSystem.gridSize) snapToGrid(transform.localPosition, EditorSubSystem.gridSize, transform.localPosition)
                transform.lastFrame = -1
            }

            this.menu.entity['value'] = context.selectedEntity
        }
    }
    queryEntity(worldPosition: vec2){
        const physicsSystem = this.manager.resolveSystem(PhysicsSystem)
        const aabb = AABB.fromValues(
            worldPosition[0], worldPosition[1], worldPosition[0], worldPosition[1],
            PhysicsDebugSystem.tempAABB)
        //TODO find closest one?
        let hitBody: RigidBody = null
        physicsSystem.broadphase.queryAABB(aabb, (body: RigidBody) => {
            hitBody = body
            return false
        })
        if(hitBody) this.graphics
            .setTransform(mat3x2.IDENTITY)
            .beginPath(hitBody.aabb[0], hitBody.aabb[1])
            .lineTo(hitBody.aabb[2], hitBody.aabb[1])
            .lineTo(hitBody.aabb[2], hitBody.aabb[3])
            .lineTo(hitBody.aabb[0], hitBody.aabb[3])
            .closePath()
            .fill(rgba(0xFF, 0xFF, 0xFF, 0x3F))
        return hitBody ? hitBody.entity : 0
    }
    renderShapes(context: IEditorUpdateContext){
        const { temp, shapeTransform } = PhysicsDebugSystem
        const bodies: RigidBody[] = (this.bodies.data as any).internal
        for(let i = 0; i < bodies.length; i++){
            let body = bodies[i]
            for(let j = 0; j < body.shapes.length; j++){
                let shape = body.shapes[j]
                vec2.rotate(shape.position, body.angle, PhysicsDebugSystem.temp)
                mat3x2.fromTransform(
                    body.position[0] + temp[0],
                    body.position[1] + temp[1],
                    0, 0, 1, 1,
                    body.angle + shape.angle, 0, 0,
                    shapeTransform
                )
                this.graphics.setTransform(shapeTransform)
                switch(shape.type){
                    case ShapeType.LINE: {
                        const line: Line = shape as Line
                        this.graphics
                        .beginPath(-0.5 * line.length, 0)
                        .lineTo(0.5 * line.length, 0)
                        .stroke(this.lineColor, 2 * Math.max(context.pixelWidth, context.pixelHeight))
                        break
                    }
                    case ShapeType.PARTICLE: {
                        const particle: Particle = shape as Particle
                        this.graphics
                        .beginPath(10, 0)
                        .arc(0, 0, 2 * Math.max(context.pixelWidth, context.pixelHeight), 0, 2 * Math.PI)
                        .fill(this.lineColor)
                        break
                    }
                    case ShapeType.CIRCLE: {
                        const circle: Circle = shape as Circle
                        this.graphics
                        .beginPath(0, 0)
                        .arc(0, 0, circle.radius, 0, 2 * Math.PI)
                        .closePath()
                        .fill(this.fillColor)
                        .stroke(this.lineColor, Math.max(context.pixelWidth, context.pixelHeight))
                        break
                    }
                    case ShapeType.BOX:
                    case ShapeType.CONVEX: {
                        const convex: Convex = shape as Convex
                        for(let i = 0; i < convex.vertices.length; i++)
                            if(i) this.graphics.lineTo(convex.vertices[i][0], convex.vertices[i][1])
                            else this.graphics.beginPath(convex.vertices[i][0], convex.vertices[i][1])
                        this.graphics.closePath()
                        .fill(this.fillColor)
                        .stroke(this.lineColor, Math.max(context.pixelWidth, context.pixelHeight))
                        break
                    }
                }
            }
            if(this.showAABB && body.shapes.length) this.graphics
            .setTransform(mat3x2.IDENTITY)
            .beginPath(body.aabb[0], body.aabb[1])
            .lineTo(body.aabb[2], body.aabb[1])
            .lineTo(body.aabb[2], body.aabb[3])
            .lineTo(body.aabb[0], body.aabb[3])
            .closePath()
            .stroke(this.aabbColor, Math.max(context.pixelWidth, context.pixelHeight))
        }
    }
    buildMenu(){
        this.menu.entity = HTMLNode('input', { type: 'number', disabled: true, min: 0, max: 1e6 })

        return [HTMLNode('div', { className: 'vertical' }, [
            HTMLNode('div', { className: 'horizontal', innerText: 'Show: ' }, [
                HTMLNode('input', { type: 'checkbox', checked: this.visible }, null, {
                    change: (event: Event) => {
                        this.visible = (event.target as HTMLInputElement).checked
                    }
                })
            ]),
            HTMLNode('div', { className: 'horizontal', innerText: 'Entity: ' }, [this.menu.entity]),
            HTMLNode('div', { className: 'horizontal', innerText: 'AABB: ' }, [
                HTMLNode('input', { type: 'checkbox', checked: this.showAABB }, null, {
                    change: (event: Event) => {
                        this.showAABB = (event.target as HTMLInputElement).checked
                    }
                })
            ])
        ])]
    }
}