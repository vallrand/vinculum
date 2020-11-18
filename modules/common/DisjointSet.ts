export class DisjointSet {
    private readonly indices: number[] = []
    private readonly weights: number[] = []
    public allocate(partitions: number): this {
        for(let i = 0; i < partitions; i++){
            this.indices[i] = i
            this.weights[i] = 1
        }
        return this
    }
    public join(index0: number, index1: number): void {
        let i0 = this.find(index0)
        let i1 = this.find(index1)
        if(i0 === i1) return
        if(this.weights[i0] < this.weights[i1]){
            this.indices[i0] = i1
            this.weights[i1] += this.weights[i0]
        }else{
            this.indices[i1] = i0
            this.weights[i0] += this.weights[i1]
        }
    }
    public find(index: number): number {
        const { indices } = this
        while(index !== indices[index])
            index = indices[index] = indices[indices[index]]
        return index
    }
}