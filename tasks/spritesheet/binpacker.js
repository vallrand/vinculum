class BinPacker {
    constructor(maxWidth, maxHeight){
        this.root = null
        this.maxWidth = maxWidth || Infinity
        this.maxHeight = maxHeight || Infinity
        this.frames = []
    }
    get width(){ return isFinite(this.maxWidth) ? Math.max(this.root.width, this.maxWidth) : this.root.width }
    get height(){ return isFinite(this.maxHeight) ? Math.max(this.root.height, this.maxHeight) : this.root.height }
    insert(item){
        const frame = this.fit(item.width, item.height)
        if(frame){
            frame.reference = item
            this.frames.push(frame)
        }
        return frame
    }
    fit(width, height){
        if(width > this.maxWidth || height > this.maxHeight) return null
        if(!this.root) this.root = { x: 0, y: 0, width, height }
        const node = this.findNode(this.root, width, height)
        return node ? this.splitNode(node, width, height) : this.growNode(width, height)
    }
    findNode(node, width, height){
        if(width > node.width || height > node.height) return null
        else if(!node.right && !node.down) return node
        else return this.findNode(node.right, width, height) || this.findNode(node.down, width, height)
    }
    splitNode(node, width, height){
        node.down = { x: node.x, y: node.y + height, width: node.width, height: node.height - height }
        node.right = { x: node.x + width, y: node.y, width: node.width - width, height: height }
        return node
    }
    growNode(width, height){
        const nextWidth = this.root.width + width
        const nextHeight = this.root.height + height
        let down = width <= this.root.width && nextHeight <= this.maxHeight
        let right = height <= this.root.height && nextWidth <= this.maxWidth
        if(!down && !right) return null
        down += down && this.root.width >= nextHeight
        right += right && this.root.height >= nextWidth
  
        this.root = right >= down ? {
            x: 0,
            y: 0,
            width: nextWidth,
            height: this.root.height,
            down: this.root,
            right: { x: this.root.width, y: 0, width: width, height: this.root.height }
        } : {
            x: 0,
            y: 0,
            width: this.root.width,
            height: nextHeight,
            down:  { x: 0, y: this.root.height, width: this.root.width, height: height },
            right: this.root
        }
        const node = this.findNode(this.root, width, height)
        return node && this.splitNode(node, width, height)
    }
}
const sort = {
    width: (a, b) => b.width - a.width,
    height: (a, b) => b.height - a.height,
    area: (a, b) => b.width * b.height - a.width * a.height,
    perimeter: (a, b) => b.width + b.height - a.width + a.height,
    max: (a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height),
    min: (a, b) => Math.min(b.width, b.height) - Math.min(a.width, a.height),
    join: criteria => function(a, b){
        for(let i = 0; i < criteria.length; i++){
            let difference = criteria[i](a, b)
            if(difference !== 0) return difference
        }
        return 0
    }
}
sort.maxside = sort.join([sort.max, sort.min, sort.height, sort.width])
const nextPow2 = value => {
    if(--value <= 0) return 1
    let out = 2
    while(value >>>= 1) out <<= 1
    return out
}

module.exports = function(items, {
    maxWidth = 2048,
    maxHeight = 2048,
    powerOfTwo = true,
    square = false,
    sortCriteria = 'maxside'
}){
    if(sort[sortCriteria]) items.sort(sort[sortCriteria])

    const bins = []
    items: for(let i = 0; i < items.length; i++){
        const item = items[i]
        for(let max = bins.length, j = 0; j <= max; j++){
            if(j === max) bins.push(new BinPacker(maxWidth, maxHeight))
            const packer = bins[j]
            if(packer.insert(item)) continue items
        }
        throw new Error(`${item.width}x${item.height} Exceeded texture size limit!`)
    }

    return bins.map(packer => {
        let { frames, root: { width, height } } = packer
        if(square) width = height = Math.max(width, height)
        if(powerOfTwo){
            width = nextPow2(width)
            height = nextPow2(height)
        }
        return { width, height, frames }
    })
}