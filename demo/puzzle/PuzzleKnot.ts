import { EntityManager } from 'framework'
import { GroupComponent, AnimationMixer } from 'scene'

import { PuzzleKnotType, PuzzleKnotState, PuzzleKnotAnimation } from './constants'

export abstract class PuzzleKnot extends GroupComponent<PuzzleKnotType> {
    public state: PuzzleKnotState
    public type: PuzzleKnotType
    public group: number
    public tree: number
    public particles: number
    setup(type: PuzzleKnotType, manager: EntityManager){
        this.type = type
        this.state = PuzzleKnotState.CLOSED
    }
    setState(state: PuzzleKnotState, delay: number = 0){
        if(this.state === state) return

        const animations = this.manager.aquireComponent<AnimationMixer>(this.entity, AnimationMixer)
        const transition = 0.2
        for(let i = animations.tracks.length - 1; i >= 0; i--)
            animations.tracks[i].end(delay + transition, transition)

        switch(state){
            case PuzzleKnotState.CLOSED: {
                const transitionAnimation = animations.createAnimation(PuzzleKnotAnimation.CLOSE)
                transitionAnimation.start(delay, transition)
                transitionAnimation.end(delay + transitionAnimation.duration, transition)

                break
            }
            case PuzzleKnotState.OPENED: {
                const transitionAnimation = animations.createAnimation(PuzzleKnotAnimation.OPEN)
                transitionAnimation.start(delay, transition)
                transitionAnimation.end(delay + transitionAnimation.duration, transition)

                const idleAnimation = animations.createAnimation(PuzzleKnotAnimation.OPENED)
                idleAnimation.start(delay + transitionAnimation.duration - transition, transition)
                break
            }
            case PuzzleKnotState.ENABLED: {
                const transitionAnimation = animations.createAnimation(PuzzleKnotAnimation.ENABLE)
                transitionAnimation.start(delay, transition)
                transitionAnimation.end(delay + transitionAnimation.duration, transition)

                const idleAnimation = animations.createAnimation(PuzzleKnotAnimation.ENABLED)
                idleAnimation.start(delay + transitionAnimation.duration - transition, transition)
                break
            }
        }
        this.state = state
    }
    reset(){}
}
