import { clamp } from 'math/utilities'

export const enum AudioRampEase {
    LINEAR = 'linear',
    EXPONENTIAL = 'exponential',
    STEP = 'step'
}

export function scheduleAudioParameter(
    context: AudioContext, parameter: AudioParam,
    value: number = parameter.defaultValue, offset: number = 0, ease?: AudioRampEase, clear?: boolean
): void {
    if(clear) parameter.cancelScheduledValues(0)
    value = clamp(value, parameter.minValue, parameter.maxValue)
    switch(ease){
        case AudioRampEase.LINEAR:
            parameter.linearRampToValueAtTime(value, context.currentTime + offset)
            break
        case AudioRampEase.EXPONENTIAL:
            parameter.exponentialRampToValueAtTime(value, context.currentTime + offset)
            break
        case AudioRampEase.STEP:
        default:
            parameter.setValueAtTime(value, context.currentTime + offset)
    }
}