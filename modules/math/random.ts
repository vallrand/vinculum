export interface RandomGenerator {
    (seed: number): () => number
}

export const LCG: RandomGenerator = function(seed: number){
    const m = 0x80000000
    const a = 1103515245
    const c = 12345
    return function(){
        seed = (a * seed + c) % m
        return seed / m
    }
}