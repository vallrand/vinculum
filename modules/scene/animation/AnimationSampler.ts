import { Interpolation, clamp } from 'math/utilities'

export interface IAnimationSampler<T> {
    duration?: number
    loop?: boolean
    (t: number, out?: T): T
}

interface Keyframe<T> {
    time: number
    value: T
    ease?: (factor: number) => number
}

export const StaticSampler = <T>(value: T): IAnimationSampler<T> => (): T => value

export const TweenSampler = <T>(interpolate: Interpolation<T>) =>
(min: T, max: T, ease?: (factor: number) => number): IAnimationSampler<T> =>
(t: number, out?: T): T => interpolate(min, max, t = ease ? ease(t) : t, out)

export const KeyframeSampler = <T>(interpolate: Interpolation<T>) =>
(frames: Keyframe<T>[]): IAnimationSampler<T> => {
    frames.sort((a, b) => a.time - b.time)
    const lastIndex: number = frames.length - 1
    let playhead: number = 0
    return Object.assign((t: number, out?: T): T => {
        while(playhead >= 0 && playhead < lastIndex)
            if(frames[playhead].time > t) playhead--
            else if(frames[playhead + 1].time < t) playhead++
            else break
        if(playhead < 0) return frames[0].value
        else if(playhead >= lastIndex) return frames[lastIndex].value
        const prev = frames[playhead]
        const next = frames[playhead + 1]
        const factor = (t - prev.time) / (next.time - prev.time)
        return interpolate(prev.value, next.value, next.ease ? next.ease(factor) : factor, out)
    }, { duration: frames[lastIndex].time, loop: true })
}

export const FrameSampler = <T>(frames: T[], frameRate: number): IAnimationSampler<T> =>
    Object.assign(
        (t: number, out?: T): T => frames[clamp(t * frameRate | 0, 0, frames.length - 1)],
        { duration: frameRate && frames.length / frameRate, loop: true }
    )