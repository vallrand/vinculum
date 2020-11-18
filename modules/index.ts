import { Deferred } from 'common/Deferred'

import {
    Store,

    DetectType,
    HttpRequest,
    UnpackJsonBundle,
    LoadImageElement,
    LoadAudioElement,
    ParseXML,
    Throttle
} from 'loader'

import {
    TransformUpdateSystem, SceneUpdateSystem,
    Behaviour, AnimationMixer, ParticleEmitter
} from 'scene'

import { Renderer2DSystem, UploadTexture, ParseTextureAtlas } from 'renderer'
import { BatchRenderer } from 'renderer/programs/BatchRenderer'
import { ShaderRenderer } from 'renderer/programs/ShaderRenderer'
import { GL, GLContext } from 'renderer/gl'

import { DecodeAudio, ParseAudioClip, AudioSystem } from 'audio'

import { PhysicsSystem } from 'physics/PhysicsSystem'
import { MaterialCollection } from 'physics/dynamics/ContactMaterial'
import { ShapeType } from 'physics/constants'
import { BruteforceBroadphase } from 'physics/collision/broadphase/Bruteforce'
import { SweepAndPrune } from 'physics/collision/broadphase/SweepAndPrune'
import { AVLTree } from 'physics/collision/broadphase/AVLTree'
import {
    Narrowphase,
    testCircleVsCircle,
    testCircleVsConvex,
    testCircleVsLine,
    testConvexVsConvex,
    testParticleVsCircle,
    testParticleVsConvex
} from 'physics/collision/narrowphase'
import {
    Raycaster,
    testRayCircle,
    testRayLine,
    testRayConvex
} from 'physics/collision/raycaster'
import { GaussSeidelSolver } from 'physics/dynamics/solver/GaussSeidelSolver'
import { IslandSolver } from 'physics/dynamics/solver/IslandSolver'
import { ContinuousCollisionDetection } from 'physics/dynamics/CCD'

import { KeyboardSystem, PointerDeviceSystem } from 'interaction'

import { Display } from 'common/Display'
import { SystemInitializer, ProcedureSystem, EntityManager, ProcedureUpdateSystem, IUpdateContext } from 'framework'

import {
    //PerformanceMonitor,
	CameraController, AudioSettings, GridLineLayer, PhysicsDebugSystem, EntitySelector,
    //ShapeConstructor, PuzzleCreator, RegionCreator,
    EditorSystem
} from './debug'

import { ProgressSpinner } from './debug/progress'

declare global {
    const debug: boolean
}

export default function Application({
    manifest,
    keybindings,
    width, height,
    initialize
}: {
    manifest: string[],
    keybindings: Record<string, string[]>
    width: number
    height: number
    initialize: (manager: EntityManager) => void
}): Deferred<EntityManager> {
    const manager = new EntityManager()
    .registerSystem(ProcedureUpdateSystem, null)
    .registerSystem(Store, [
        DetectType(),
        LoadImageElement,
        Throttle(4)(HttpRequest()),
        UnpackJsonBundle,
        ParseXML,
        
        DecodeAudio,
        ParseAudioClip,
        UploadTexture,
        ParseTextureAtlas
    ])
    .registerSystem(Display, { width, height })
    .registerSystem(KeyboardSystem, { keybindings })
    .registerSystem(PointerDeviceSystem, null)

    .registerSystem(EditorSystem, [
        //PerformanceMonitor,
        CameraController,
        AudioSettings,
        GridLineLayer,
        PhysicsDebugSystem,
        EntitySelector,
        //ShapeConstructor, PuzzleCreator, RegionCreator
    ])

    .registerSystem(PhysicsSystem, {
        broadphase: new SweepAndPrune,
        narrowphase: new Narrowphase({
            [ShapeType.CIRCLE]: testCircleVsCircle,
            [ShapeType.CIRCLE | ShapeType.CONVEX]: testCircleVsConvex,
            [ShapeType.CIRCLE | ShapeType.BOX]: testCircleVsConvex,
            [ShapeType.CIRCLE | ShapeType.LINE]: testCircleVsLine,
            [ShapeType.CONVEX]: testConvexVsConvex,
            [ShapeType.BOX]: testConvexVsConvex,
            [ShapeType.CONVEX | ShapeType.BOX]: testConvexVsConvex,
            [ShapeType.PARTICLE | ShapeType.CIRCLE]: testParticleVsCircle,
            [ShapeType.PARTICLE | ShapeType.CONVEX]: testParticleVsConvex,
            [ShapeType.PARTICLE | ShapeType.BOX]: testParticleVsConvex
        }),
        raycaster: new Raycaster({
            [ShapeType.CIRCLE]: testRayCircle,
            [ShapeType.LINE]: testRayLine,
            [ShapeType.BOX]: testRayConvex,
            [ShapeType.CONVEX]: testRayConvex
        }),
        materials: new MaterialCollection,
        solver: new IslandSolver(new GaussSeidelSolver)
    })
    .registerSystem(SceneUpdateSystem, [
        Behaviour,
        AnimationMixer,
        ParticleEmitter
    ])
    .registerSystem(TransformUpdateSystem, null)
    .registerSystem(Renderer2DSystem, [
        new BatchRenderer(),
        new ShaderRenderer(undefined, undefined, BatchRenderer.QUAD_INDICES)
    ])
    .registerSystem(AudioSystem, null)

    const spinner = new ProgressSpinner()
    return manager.resolveSystem(Store)
    .load(manifest, progress => spinner.progress = progress)
    .then(() => {
        initialize(manager)
        spinner.awaitGesture()
        return manager.resolveSystem(AudioSystem).unlock()
    })
    .then(() => {
        spinner.delete()
        manager.resolveSystem(ProcedureUpdateSystem).start()
        return manager
    })
}