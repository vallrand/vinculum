import { AABB } from 'math/AABB'
import { clamp } from 'math/utilities'

export class SpatialGrid<T extends { aabb: AABB }> {
    private readonly invCellWidth: number
    private readonly invCellHeight: number
    private readonly columns: number
    private readonly rows: number
    private readonly columnOffset: number
    private readonly rowOffset: number

    private indexPool: number[] = []
    public readonly items: T[] = []
    private readonly visited: boolean[] = []
    public readonly queryOutput: number[] = []

    private readonly grid: Uint16Array
    private readonly pointers: number[] = []
    private pointerTail: number = 0

    constructor(bounds: AABB, cellSize: number){
        this.invCellWidth = 1 / cellSize
        this.invCellHeight = 1 / cellSize
        this.columns = Math.ceil((bounds[2] - bounds[0]) * this.invCellWidth)
        this.rows = Math.ceil((bounds[3] - bounds[1]) * this.invCellHeight)
        this.columnOffset = Math.ceil(bounds[0] * this.invCellWidth)
        this.rowOffset = Math.ceil(bounds[1] * this.invCellHeight)

        this.grid = new Uint16Array(this.columns * this.rows)
    }
    public insert(item: T): void {
        const reference = this.indexPool.pop() || this.items.length + 1
        this.items[reference - 1] = item

        const c0 = clamp((item.aabb[0] * this.invCellWidth | 0) - this.columnOffset, 0, this.columns - 1)
        const c1 = clamp((item.aabb[2] * this.invCellWidth | 0) - this.columnOffset, 0, this.columns - 1)
        const r0 = clamp((item.aabb[1] * this.invCellHeight | 0) - this.rowOffset, 0, this.rows - 1)
        const r1 = clamp((item.aabb[3] * this.invCellHeight | 0) - this.rowOffset, 0, this.rows - 1)
        for(let row = r0; row <= r1; row++)
        for(let column = c0; column <= c1; column++){
            const cell = row * this.columns + column
            const pointer = this.grid[cell]

            const { pointerTail } = this
            if(pointerTail){
                this.pointerTail = this.pointers[pointerTail]
                this.pointers[pointerTail - 1] = reference
                this.pointers[pointerTail] = pointer
                this.grid[cell] = pointerTail
            }else
                this.grid[cell] = this.pointers.push(reference, pointer) - 1
        }
    }
    public remove(item: T): void {
        const reference = this.items.indexOf(item) + 1
        if(!reference) return
        this.indexPool.push(reference)
        this.items[reference - 1] = null

        const c0 = clamp((item.aabb[0] * this.invCellWidth | 0) - this.columnOffset, 0, this.columns - 1)
        const c1 = clamp((item.aabb[2] * this.invCellWidth | 0) - this.columnOffset, 0, this.columns - 1)
        const r0 = clamp((item.aabb[1] * this.invCellHeight | 0) - this.rowOffset, 0, this.rows - 1)
        const r1 = clamp((item.aabb[3] * this.invCellHeight | 0) - this.rowOffset, 0, this.rows - 1)
        for(let row = r0; row <= r1; row++)
        for(let column = c0; column <= c1; column++){
            let cell = row * this.columns + column
            for(let prev = 0, pointer = this.grid[cell]; pointer; prev = pointer, pointer = this.pointers[pointer]){
                if(this.pointers[pointer - 1] !== reference) continue
                if(prev) this.pointers[prev] = this.pointers[pointer]
                else this.grid[cell] = this.pointers[pointer]

                this.pointers[pointer - 1] = 0
                this.pointers[pointer] = this.pointerTail
                this.pointerTail = pointer
                break
            }
        }
    }
    public query(bounds: AABB, log = false): number {
        this.visited.length = Math.max(this.visited.length, this.items.length)
        let count = 0

        const c0 = clamp((bounds[0] * this.invCellWidth | 0) - this.columnOffset, 0, this.columns - 1)
        const c1 = clamp((bounds[2] * this.invCellWidth | 0) - this.columnOffset, 0, this.columns - 1)
        const r0 = clamp((bounds[1] * this.invCellHeight | 0) - this.rowOffset, 0, this.rows - 1)
        const r1 = clamp((bounds[3] * this.invCellHeight | 0) - this.rowOffset, 0, this.rows - 1)
        if(log) console.log(c0, c1, r0, r1)
        for(let row = r0; row <= r1; row++)
        for(let column = c0; column <= c1; column++)
            for(let cell = row * this.columns + column, pointer = this.grid[cell]; pointer; pointer = this.pointers[pointer]){
                const reference = this.pointers[pointer - 1]
                if(!reference || this.visited[reference - 1]) continue
                this.visited[reference - 1] = true
                this.queryOutput[count++] = reference - 1
            }

        for(let i = count - 1; i >= 0; i--)
            this.visited[this.queryOutput[i]] = false
        return count
    }
    public clear(): void {
        this.items.length = 0
        for(let i = this.grid.length - 1; i >= 0; i--) this.grid[i] = 0
        this.pointerTail = Math.max(0, this.pointers.length - 1)
        for(let prev = 0, i = this.pointers.length - 1; i > 0; prev = i, i-=2){
            this.pointers[i - 1] = 0
            this.pointers[i] = prev
        }
    }
}