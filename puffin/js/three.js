// The one line that lets every module here say `import * as THREE from
// './three.js'`. In the browser this resolves to /vendor/three/… (the hub
// mounts `vendor/` as a shared static dir — one copy in every device's offline
// cache, however many 3D games we build). In Node the same relative path walks
// the repo, so the tests import the exact bytes the iPad runs.
export * from '../../vendor/three/three.module.min.js';
