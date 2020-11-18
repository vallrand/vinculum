const fs = require('fs')
const path = require('path')
const stream = require('stream')

async function listFiles(directory){
    const list = []
    const files = await fs.promises.readdir(directory, { withFileTypes: true, encoding: 'utf8' })
	for(let file of files){
		const filepath = path.resolve(directory, file.name)
		if(file.isDirectory()){
			const sublist = await listFiles(filepath)
			list.push(...sublist)
		}else{
			list.push(filepath)
		}
	}
	return list
}

//https://github.com/substack/stream-handbook

exports.createReadFileStream = function(directory){
    const asyncFiles = listFiles(directory)
    return new stream.Readable({
        objectMode: true,
        async read(){
            const files = await asyncFiles
            if(!files.length) this.push(null)
            else{
                const filepath = files.shift()
                const filename = path.relative(directory, filepath).replace(/\\/g, '/')
                this.push({ filepath, filename })
            }
        }
    })
}

exports.createWriteFileStream = function(directory){
    const asyncCreateDirectory = fs.promises.mkdir(directory, { recursive: true })
    return new stream.Writable({
        objectMode: true,
        async write(chunk, chunkEncoding, callback){
            await asyncCreateDirectory
            
            const { filepath, filename, data, encoding } = chunk
            if(!data) return callback()

            const fullpath = path.resolve(directory, filename)
            console.log('\x1b[34m%s\x1b[0m', `Writing ${fullpath}`)
            await fs.promises.writeFile(fullpath, data, { encoding })

            callback()
        }
    })
}

function BufferCollector(){
    const chunks = []
    return (chunk, done) => done ? Buffer.concat(chunks) : chunks.push(chunk)
}

exports.collectStream = (stream, collector = BufferCollector()) => new Promise((resolve, reject) => {
    stream.on('data', chunk => collector(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(collector(null, true)))
})