
# Merkle Album

##### Generator + Validator

Clone the project, then:
```
cd merkle-album
mkdir input-flac
<copy flacs into input-flac>
node flac.js
<stripped flac0s will be in stripped-flac>
<finalized flacs will be in flac>
<other selected export formats will be in their dirs (mp3, etc)>
```

#### For a song:

All [metadata blocks]() are removed (via `--remove-all --dont-use-padding`) (the mandatory `STREAMINFO` block remains untouched).

The file's modtime is set to the unix epoch, Jan 1 1970.

This 'stripped' `.flac0` (deterministic flac) file is then hashed with sha3d (256 bits). This is the 'Song Hash'.

#### For an album:

The song files are added to the merkle tree, in track order (1-n), as their sha3d hashes.

The album art also must be added and hashed as a file, at position 0. It must be a Lossless 24bit/px PNG, of dimensions 2850px X 2850px (the standard size of a CD cover jewel case insert at 600dpi - archival print). Its `tIME` chunk must be set to the unix epoch, and there must be no `sPLT`, `iTXt`, `tEXt`, or `zTXt` chunks.

The merkle root is then computed. This is the 'Album Hash'.

---

As an artist, you should publish the album merkle root **before** you publish the album. This should be done in a permanent and public way - best done as an `OP_RETURN` transaction on Bitcoin, with an address you've also published. This can be used to prove that you are the original creator of the original files.

### Utils (TODO)

`make-flac0 <input-flac>`

`make-final-flac <input-flac> (<metadata-yaml-file>)`

`validate-song <input-flac> <hash> (<hashtype>='sha3d')`


### Glossary

Song

Album

Song Hash

Album Hash

Hash

Original FLAC

Stripped FLAC

Final FLAC
