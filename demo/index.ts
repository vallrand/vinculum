import './index.css'

import { EntityManager, ProcedureUpdateSystem } from 'framework'

import { CameraSystem, CameraSetup } from './camera'
import { CharacterSystem } from './character'
import { TerrainSystem, TerrainSetup } from './terrain'
import { PuzzleSystem, PuzzleSetup } from './puzzle'
import { SoulSystem } from './collector'
import { SoundscapeSystem } from './soundscape'
import { ParallaxSystem } from './parallax'
import { RevealSystem, RevealSetup } from './effects'

import Application from '../modules'

Application({
    manifest: <string[]> require('./assets/manifest.json'),
    keybindings: {
        'up': ['ArrowUp','KeyW'],
        'down': ['ArrowDown','KeyS'],
        'right': ['ArrowRight','KeyD'],
        'left': ['ArrowLeft','KeyA'],
        'action': ['Space']
    },
    width: 800, height: 600,
    initialize(manager: EntityManager){
        console.log(`%cApp: %O`, 'color:#0873a8;text-shadow:0px 0px 1px #000;font-weight:bold', window['app'] = manager)
        const scene = <{
            puzzle: PuzzleSetup,
            terrain: TerrainSetup,
            camera: CameraSetup,
            blocks: RevealSetup
        }> require('./scene.json')
    
        manager.registerSystem(SoundscapeSystem, null)
        manager.registerSystem(CharacterSystem, null)
        manager.registerSystem<CameraSetup>(CameraSystem, scene.camera)
        manager.registerSystem<TerrainSetup>(TerrainSystem, scene.terrain)
        manager.registerSystem<PuzzleSetup>(PuzzleSystem, scene.puzzle)
        manager.registerSystem(SoulSystem, null)
        manager.registerSystem(ParallaxSystem, null)
        manager.registerSystem(RevealSystem, scene.blocks)
    }
}).then(
    manager => console.log(`%cInitialization Complete.`, 'color:#0873a8;text-shadow:0px 0px 1px #000;font-weight:bold'),
    error => console.error(error)
)