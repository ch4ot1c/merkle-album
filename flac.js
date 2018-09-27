
//strippedFlac
//Flac
//Mp3
//Other

const fs = require('fs-extra')
const path = require('path')
const copy = require('copy')
const { execFile, execFileSync } = require('child_process')
const SHA3 = require('sha3')
const merkle = require('merkle')

const MUSIC_DIR = 'music/album/'

var Flac = {
    init: function() {

    },
    readFlacMetadata: function(filenames, cb) {
        //TODO read from file and/or user input into dictionary (keys = original filenames)
        //TODO also integrate album art - let hashes = [pngHash].concat(loadAndHashFlac0s(files))
    },
    convertToFlac0s: function(filenames, cb) {
        filenames = filenames.map(f => 'stripped-flac/' + f)
        filenames.shift() // Remove empty entry for album art, for now
        execFile('metaflac', filenames.concat(['--remove-all', '--dont-use-padding']), (err, stdout, stderr) => {
            if (err) throw err
            console.log(stdout, stderr)

            execFileSync('touch', filenames.concat(['-t 197001010000.00'])) // Set modtime to Jan 1, 1970 for determinism
            return cb(true)
        })
    },
    sortSongsByTracknumber: function(filenames, cb) {
        filenames = filenames.map(f => 'input-flac/' + f)
        execFile('metaflac', filenames.concat(['--show-tag', 'TRACKNUMBER']), (err, stdout, stderr) => {
            if (err) throw err
            if (stderr) console.log(stderr)
            console.log(stdout)

            let trackFiles = []
            stdout.split('\n').forEach(line => {
                let trackData = line.split(':TRACKNUMBER=') //TODO validate harder
                if (trackData.length <= 1) {
                    console.log('(skip unknown line...)')
                } else {
                    trackFiles[parseInt(trackData.last, 10)] = path.basename(trackData[0])
                }

                //console.log(trackFiles[parseInt(trackData.last, 10)])
            })
            
            return cb(trackFiles)
        })
    }
}


var Files = {
    init: function() {

    },
    // Precondition: There should be an `input-flac` dir, populated with a new album of
    // `.flac`s, with appropriate track order
    prepareWorkspace: function(cb) {
        fs.ensureDirSync('stripped-flac')
        fs.ensureDirSync('flac')
        fs.ensureDirSync('mp3')

        // Copy all files from input-flac into stripped-flac for processing - TODO validate
        copy('input-flac/*.flac', 'stripped-flac/', function(err, files) {
            if (err) throw err
            console.log(files)
            return cb()
        })
    },
    getOrderedSongFilenames: function(userDefinedOrder, cb) { // (ordered by track #)
        userDefinedOrder = (typeof userDefinedOrder === 'string') ? 'none' : userDefinedOrder

        if (userDefinedOrder !== 'none') {
            return cb(userDefinedOrder)
        }

        Flac.sortSongsByTracknumber(fs.readdirSync('./input-flac'), function(trackFiles) {
            cb(trackFiles)
        })
    },
    getMockOrderedSongFilenames: function() {
        return ['test1.flac', 'test2.flac']
        //fs.readdirSync(path.join(ROOT, input-flac))
        //TODO metaflac sort ascending by track #, throw if err
    },
    loadAndHashAlbumArt: function(albumPNGFile) {
        //TODO
    },
    loadAndHashFlac0s: function(orderedSongFilenames) { // (ordered by track)
        let fileHashes = []
        //console.log(orderedSongFilenames)
        for (const f of orderedSongFilenames) {
            console.log('Hashing:', f)
            if (typeof f === 'undefined') {
                console.log('(skip undefined...)')
                continue
            }

            let strippedPathPrefix = 'stripped-flac/'
            let flac0Path = path.join(strippedPathPrefix, f)
            let fileData = fs.readFileSync(flac0Path) //TODO sanitize / validate

            // sha3d
            let h1 = new SHA3.SHA3Hash(256)
            h1.update(fileData, 'binary')
            let first = h1.digest('hex')

            let h2 = new SHA3.SHA3Hash(256)
            h2.update(first, 'hex')
            let second = h2.digest('hex')
            console.log('Done.')

            fileHashes.push(second)
        }
        return fileHashes
    }
}

// Array helper
if (!Array.prototype.hasOwnProperty("last")) {
    Object.defineProperty(Array.prototype, "last", {
        get: function() {
            return this[this.length - 1]
        }
    })
}

function processAllInputFiles(cb) { // (export)
    Files.prepareWorkspace(function() {
        Files.getOrderedSongFilenames('none', function(inputSongFilenames) {
            console.log()
            console.log('Processing song files:')
            console.log(inputSongFilenames) //TODO first element as album :)
            console.log()
        
            Flac.convertToFlac0s(inputSongFilenames, function(success) { // files are created in stripped-flac/
                if (!success) throw Error('Failed to convert input files to flac0 (stripped)')
                // Build merkle tree of file hashes
                let fileHashes = Files.loadAndHashFlac0s(inputSongFilenames) //TODO run from proper dir / concat prefix path
                let tree = merkle('sha3d_256').sync(fileHashes)
                //console.log(tree)
                return cb(tree)
            })
        })
        // getMockOrderedSongFilenames() (['test1.flac', 'test2.flac'])
    })
}

// Kickoff
(function() {
    Flac.init()
    Files.init()

    processAllInputFiles(function(tree) {
        console.log('Processing Done! Merkle Tree Info:')
        console.log()
        console.log('Root:', tree.root())
        console.log('Depth:', tree.depth())
        console.log('Levels:', tree.levels())
        console.log('Nodes:', tree.nodes())
    })
})()
