const fs = require('fs')
const path = require('path')
const stream = require('stream')
const { promisify } = require('util')

const { createReadFileStream, createWriteFileStream } = require('./utils')
const generateSpritesheet = require('./spritesheet')
const bundleResources = require('./bundle')

module.exports = (async function(inputDirectory, outputDirectory){
    const basepath = process.cwd() || __dirname

    await promisify(stream.pipeline)(
        createReadFileStream(path.resolve(basepath, inputDirectory)),
        generateSpritesheet({
            
        }),
        bundleResources({
            filter: filename => !(/\.png$/i).test(filename)
        }),
        createWriteFileStream(path.resolve(basepath, outputDirectory))
    )

    console.log('\x1b[32m%s\x1b[0m', 'Done')
})(...process.argv.slice(2))