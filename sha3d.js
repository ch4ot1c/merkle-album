// Standalone for IPC (fork / spawn)

var Sha3d = {
    sha3d: function(filename) {
        let fileData = fs.readFileSync(filename) //TODO sanitize / validate

        let h1 = new SHA3.SHA3Hash()
        h1.update(fileData, 'binary')
        let first = h1.digest('hex')

        let h2 = new SHA3.SHA3Hash()
        h2.update(first, 'hex')
        let second = h2.digest('hex')
        console.log('Done.')
    }
}

(function () {
    let filename = process.argv[2]
    process.stdout(sha3d(filename))
})