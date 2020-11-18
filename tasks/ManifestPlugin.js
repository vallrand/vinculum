const fs = require('fs')
const path = require('path')

const { createReadFileStream, collectStream } = require('./utils')
const generateSpritesheet = require('./spritesheet')
const bundleResources = require('./bundle')

const AssetCollector = (assets = []) =>
    (chunk, done) => done ? assets
    : assets.push({
        filename: chunk.filename,
        data: chunk.data,
        source(){ return this.data },
        size(){ return this.data.length }
    })


module.exports = class ManifestPlugin {
    constructor(options){
        this.options = options
    }
    apply(compiler){
        const inputDirectory = path.resolve(compiler.context, this.options.entry)
        const manifestModuleName = this.options.manifest
        const virtualModulePlugin = compiler.options.plugins.find(plugin => plugin.writeModule)
        const PLUGIN_NAME = 'manifest-plugin'

        const assets = []
        async function preprocess(){
            if(assets.length) return
            console.log(`Preprocessing assets: ${inputDirectory}`)
            await collectStream(
                createReadFileStream(inputDirectory)
                .pipe(generateSpritesheet({
                    trim: { alphaThreshold: 0 },
                    pad: { extrude: true, padding: 1 }
                }))
                .pipe(bundleResources({
                    filter: filename => !(/\.png$/i).test(filename)
                })),
                AssetCollector(assets)
            )
            const manifest = assets.map(({ filename }) => filename)
            console.log(`Injecting manifest module "${manifestModuleName}".`)
            virtualModulePlugin.writeModule(manifestModuleName, JSON.stringify(manifest))
        }

        compiler.hooks.run.tapPromise(PLUGIN_NAME, preprocess)
        compiler.hooks.watchRun.tapPromise(PLUGIN_NAME, preprocess)
        compiler.hooks.emit.tapPromise(PLUGIN_NAME, async compilation => {
            for(let asset of assets)
                if(compilation.getAsset(asset.filename))
                    compilation.updateAsset(asset.filename, asset)
                else
                    compilation.emitAsset(asset.filename, asset)
        })
    }
}