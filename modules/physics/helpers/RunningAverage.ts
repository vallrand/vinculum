export class RunningAverage {
    private mean: number = 0
    private count: number = 0
    private s: number = 0
    push(value: number){
        if(!this.count) this.mean = value
        this.count++
        const delta = value - this.mean
        this.mean += delta / this.count
        this.s += delta * (value - this.mean)
    }
    get variance(): number {
        return this.s / (this.count - 1)
    }
    get standardDeviation(): number {
        return Math.sqrt(this.variance)
    }
}