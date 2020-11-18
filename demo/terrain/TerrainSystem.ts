import { vec2, rgb, rgba, AABB, randomInt, randomFloat } from 'math'
import { ProcedureSystem, EntityManager, IUpdateContext, DataView } from 'framework'
import { PhysicsSystem, RigidBody, BodyType, ShapeType, Line, Convex, Gravity } from 'physics'
import { Transform2D, Camera2D } from 'scene'
import { Material, Mesh2D, BlendMode, Geometry2D, Sprite2D } from 'renderer'
import { SpatialGrid } from 'physics/collision/broadphase/SpatialGrid'

import { Layer } from './constants'
import { rng } from '../helpers'
import { createTerrainMesh, createWallMesh } from './createTerrainMesh'
import { createPlants } from './createPlants'
import { Plant } from './Plant'
import { Tree } from './Tree'
import { CharacterSystem } from '../character'
import { CameraSystem } from '../camera'

export type TerrainSetup = Array<{ center: vec2, path: vec2[][], biome: number, aabb: AABB }>

export class TerrainSystem extends ProcedureSystem {
    readonly priority: number = -0x20
    private readonly geometries: DataView<Geometry2D> = this.manager.aquireDataView<Geometry2D>(Geometry2D)
    private readonly plants: DataView<Plant> = this.manager.aquireDataView<Plant>(Plant)
    private readonly trees: DataView<Tree> = this.manager.aquireDataView<Tree>(Tree)
    private readonly grid: SpatialGrid<any>
    constructor(manager: EntityManager, polygons: TerrainSetup){
        super(manager)

        const physics = this.manager.resolveSystem(PhysicsSystem)
        physics.forces.push(new Gravity(vec2(0, 978)))

        const worldAABB: AABB = AABB()
        for(let i = 0; i < polygons.length; i++){
            const { center, path, biome, aabb } = polygons[i]
            AABB.merge(worldAABB, aabb, worldAABB)

            const entity = this.manager.createEntity()
            this.manager.createComponent(entity, Transform2D, { position: center })
            this.manager.createComponent(entity, RigidBody, {
                mass: 0, type: BodyType.STATIC,
                shapes: path.map(function(path: vec2[]){
                    if(path.length === 2){
                        const [ start, end ] = path
                        const difference = vec2.subtract(end, start, vec2())
                        const center = vec2.add(start, end, vec2())
                        vec2.scale(center, 0.5, center)
                        return new Line(center, vec2.rotation(difference), vec2.magnitude(difference))
                    }
                })
            })
            this.manager.createComponent(entity, Material, {
                program: 0, blend: BlendMode.NORMAL, color: rgba(0xAF, 0xAF, 0xAF, 0xFF),
                texture: `terrain/floor_${['a','b','c'][biome]}.png`
            })
            this.manager.createComponent(entity, Mesh2D, {
                order: Layer.BACKGROUND,
                ...createTerrainMesh(path as any, this.manager.aquireComponent<Material>(entity, Material).diffuse)
            })

            const wall = this.manager.createEntity()
            this.manager.createComponent(wall, Transform2D, { position: center })
            this.manager.createComponent(wall, Material, {
                program: 0, blend: BlendMode.NORMAL, color: rgba(0xAF, 0xAF, 0xAF, 0xFF),
                texture: 'terrain/wall_a.png'
            })
            this.manager.createComponent(wall, Mesh2D, {
                order: Layer.BACKGROUND - 4,
                ...createWallMesh(path as any, this.manager.aquireComponent<Material>(wall, Material).diffuse)
            })

            createPlants(this.manager, path as any, biome, center)
        }

        this.grid = new SpatialGrid(worldAABB, 1000)

        const plants: Plant[] = this.plants.data as any
        for(let i = plants.length - 1; i >= 0; i--){
            const plant = plants[i]
            const position = this.manager.aquireComponent<Transform2D>(plant.entity, Transform2D).localPosition
            AABB.fromValues(position[0], position[1], position[0], position[1], plant.aabb)
            this.grid.insert(plant)
        }
    }
    execute(context: IUpdateContext){
        const character = this.manager.resolveSystem(CharacterSystem).character
        const characterTransform = this.manager.aquireComponent<Transform2D>(character, Transform2D)

        const camera = this.manager.resolveSystem(CameraSystem).camera
        const aabb = this.manager.aquireComponent<Camera2D>(camera, Camera2D).bounds

        const length = this.grid.query(aabb)
        for(let i = 0; i < length; i++){
            const pointer = this.grid.queryOutput[i]
            const item: Plant = this.grid.items[pointer]
            item.update(this.manager, context, characterTransform)
        }

        const trees: Tree[] = this.trees.data as any
        for(let i = trees.length - 1; i >= 0; i--){
            const tree: Tree = trees[i]
            const treeChange = tree.prevGrowth !== tree.growth
            tree.update(context)
            if(tree.lastFrame != context.frame) continue
            const mesh = this.manager.aquireComponent(tree.entity, Mesh2D) as Mesh2D
            if(mesh.lastRenderFrame > 0 && mesh.lastRenderFrame < context.frame - 1 && !treeChange) continue
            tree.updateVertices(mesh.vertices as any)
            mesh.lastFrame = -1
        }
    }
}