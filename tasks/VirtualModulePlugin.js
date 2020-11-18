const constants = require('constants')
const path = require('path')

class VirtualStats {
    constructor(stats){
        Object.assign(this, stats)
    }
    _checkModeProperty(property){ return (this.mode & constants.S_IFMT) === property }
    isDirectory(){ return this._checkModeProperty(constants.S_IFDIR) }
    isFile(){ return this._checkModeProperty(constants.S_IFREG) }
    isBlockDevice(){ return this._checkModeProperty(constants.S_IFBLK) }
    isCharacterDevice(){ return this._checkModeProperty(constants.S_IFCHR) }
    isSymbolicLink(){ return this._checkModeProperty(constants.S_IFLNK) }
    isFIFO(){ return this._checkModeProperty(constants.S_IFIFO) }
    isSocket(){ return this._checkModeProperty(constants.S_IFSOCK) }
}
VirtualStats.inode = 45000000



const getData = (storage, key) => storage.data instanceof Map
? storage.data.get(key)
: storage.data[key]
const setData = (storage, key, value) => storage.data instanceof Map 
? storage.data.set(key, value) 
: (storage.data[key] = value)

module.exports = class VirtualModulePlugin {
    constructor(staticModules){
        this.bound = {}
        this.staticQueue = Object.keys(staticModules)
        .map(path => ({ path, content: staticModules[path] }))
    }
    writeModule(filepath, content){
        const length = content ? content.length : 0
        const timestamp = Date.now()
        const date = new Date(timestamp)

        const stats = new VirtualStats({
            dev: 8675309,
            nlink: 0,
            uid: 1000,
            gid: 1000,
            rdev: 0,
            blksize: 4096,
            ino: VirtualStats.inode++,
            mode: 33188,
            size: length,
            blocks: Math.floor(length / 4096),
            atime: date,
            mtime: date,
            ctime: date,
            birthtime: date
        })
        const modulePath = path.isAbsolute(filepath) ? filepath : path.join(this.bound.compiler.context, filepath)
      
        this.inputFileSystem._writeVirtualFile(modulePath, stats, content)
        if(this.watchFileSystem)
            this.watchFileSystem.watcher.fileWatchers.forEach(fileWatcher => {
                if(fileWatcher.path === modulePath) fileWatcher.emit('change', timestamp, null)
            })
    }
    apply(compiler){
        this.bound.compiler = compiler
        const PLUGIN_NAME = 'virtual-module-plugin'
        compiler.hooks.afterEnvironment.tap(PLUGIN_NAME, () => {
            if(this.inputFileSystem._writeVirtualFile) return

            this.inputFileSystem.purge = (originalPurge => function(){
                originalPurge.apply(this, arguments)
                if(this._virtualFiles)
                    Object.keys(this._virtualFiles).forEach(file => {
                        const data = this._virtualFiles[file]
                        this._writeVirtualFile(file, data.stats, data.contents)
                    })
            })(this.inputFileSystem.purge)

            this.inputFileSystem._writeVirtualFile = function(file, stats, contents){
                this._virtualFiles = this._virtualFiles || {}
                this._virtualFiles[file] = { stats, contents }
                setData(this._statStorage, file, [null, stats])
                setData(this._readFileStorage, file, [null, contents])
                const segments = file.split(/[\\/]/)
                const minCount = segments[0] ? 1 : 0
                for(let count = segments.length - 1; count > minCount; count--){
                    const directory = segments.slice(0, count).join(path.sep) || path.sep
                    try{
                        this.readdirSync(directory)
                    }catch(error){
                        const time = Date.now()
                        const directoryStats = new VirtualStats({
                            dev: 8675309,
                            nlink: 0,
                            uid: 1000,
                            gid: 1000,
                            rdev: 0,
                            blksize: 4096,
                            ino: VirtualStats.inode++,
                            mode: 16877,
                            size: stats.size,
                            blocks: Math.floor(stats.size / 4096),
                            atime: time,
                            mtime: time,
                            ctime: time,
                            birthtime: time
                        })
                        setData(this._readdirStorage, directory, [null, []])
                        setData(this._statStorage, directory, [null, directoryStats])
                    }
                    const directoryData = getData(this._readdirStorage, directory)
                    const filename = segments[count]
                    if(~directoryData[1].indexOf(filename)) break

                    const files = directoryData[1].concat([filename]).sort()
                    setData(this._readdirStorage, directory, [null, files])
                }
            }
        })
        compiler.hooks.afterResolvers.tap(PLUGIN_NAME, () => {
            while(this.staticQueue.length){
                const { path, content } = this.staticQueue.pop()
                this.writeModule(path, content)
            }
        })
        compiler.hooks.watchRun.tapAsync(PLUGIN_NAME, (watcher, callback) => {
            this.bound.watcher = watcher.compiler || watcher
            callback()
        })
    }
    get watchFileSystem(){
        const { watcher } = this.bound
        let watchFileSystem = watcher && watcher.watchFileSystem
        while(watchFileSystem && watchFileSystem.wfs) watchFileSystem = watchFileSystem.wfs
        return watchFileSystem
    }
    get inputFileSystem(){
        const { compiler } = this.bound
        let inputFileSystem = compiler.inputFileSystem
        while(inputFileSystem && inputFileSystem._inputFileSystem)
            inputFileSystem._inputFileSystem
        return inputFileSystem
    }
}