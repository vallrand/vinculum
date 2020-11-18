const power = (power: number) => (x: number) => Math.pow(x, power)
const sine = (x: number) => Math.sin(x * 0.5 * Math.PI)
const circular = (x: number) => Math.sqrt(1 - (--x * x))
const exponential = (x: number) => x ? Math.pow(2, 10 * --x) : 0
const curve = (offset: number) => (x: number) => (1 + offset) * x / (x + offset)

const split = (edge: number, easeA, easeB) => x => x < edge ? edge * easeA(x / edge) : edge + (1 - edge) * easeB((x - edge) / (1 - edge))
const flip = ease => x => 1 - ease(1 - x)

const bounce = (count, friction = 1): (value: number) => number => {
    const intervals = Array(count)
    for(let i = 0; i < intervals.length; i++) intervals[i] = Math.pow(0.5, i)
    const total = intervals.reduce((total, i) => total + i, 1)

    let threshold = 1
    let x = threshold / total
    let scale = 1 / Math.pow(x, 2)

    const out = [[threshold, scale, 0, 0]]
    
    for(let i = 0; i < intervals.length; i++){
        let interval = intervals[i]
        threshold += interval
        
        x = threshold / total
        scale *= friction
        const center = threshold - 0.5 * interval
        const offset = 1 - scale * Math.pow(x - center / total, 2)
        
        out.push([ threshold, scale, center, offset ])
    }
    
    return new Function('x', out.map(([ threshold, scale, center, offset ]) => `${
        threshold == total ? '' : `if(x < ${threshold} / ${total})`
        }{ return ${scale} * ${
        center ? `(x -= ${center} / ${total}) * x + ${offset}` : 'x * x'
        }; }`).join('else ')) as any
}

const elastic = (amplitude = 1, period = 0.5) => {
    period /= Math.min(1, amplitude)
    amplitude = Math.max(1, amplitude)
    const s = period / (2 * Math.PI) * Math.asin(1 / amplitude) || 0
    const p = (2 * Math.PI) / period
    
    return x => amplitude * Math.pow(2, -10 * x) * Math.sin((x - s) * p) + 1
}

const back = (overshoot: number) => (x: number) => x * x * (x * (overshoot + 1) - overshoot)
back.v2p = (value) => {
    value = Math.min(1, -value) / 4
    const a = value * Math.sqrt(1/4 - value)
    const b = -27*value*value*value + 9*value*value - value/2
    return 3 * (Math.pow(b + a, 1/3) + Math.pow(b - a, 1/3) - 3 * value)
}
back.p2v = (x) => (-4*x*x*x)/(27*(x+1)*(x+1))

export const constant = () => 1
export const linear = x => x
    
export const fade = x => 4 * x * (1 - x)
export const wave = x => 0.5 + 0.5 * Math.cos(2 * Math.PI * x - Math.PI)
export const plato = x => 0.5 - 0.5 * Math.cos(Math.sin(x *= 2 * Math.PI) + x)
export const slideOut = curve(0.5)
export const slideIn = flip(curve(0.5))
export const slideInOut = split(0.5, flip(curve(0.5)), curve(0.5))
    
export const quadIn = power(2)
export const cubicIn = power(3)
export const quartIn = power(4)
export const quintIn = power(5)
    
export const quadOut = flip(power(2))
export const cubicOut = flip(power(3))
export const quartOut = flip(power(4))
export const quintOut = flip(power(5))
    
export const quadInOut = split(0.5, power(2), flip(power(2)))
export const cubicInOut = split(0.5, power(3), flip(power(3)))
export const quartInOut = split(0.5, power(4), flip(power(4)))
export const quintInOut = split(0.5, power(5), flip(power(5)))
    
export const bounceOut = bounce(3, 1)
    
export const sineOut = sine
export const sineIn = flip(sine)
export const sineInOut = split(0.5, flip(sine), sine)
    
export const circOut = circular
export const circIn = flip(circular)
export const circInOut = split(0.5, flip(circular), circular)
    
export const elasticOut = elastic()
export const elasticIn = flip(elastic())
export const backIn = back(back.v2p(0.1))
export const backOut = flip(back(back.v2p(0.1)))
    
export const expoIn = exponential
export const expoOut = flip(exponential)
export const expoInOut = split(0.5, exponential, flip(exponential))