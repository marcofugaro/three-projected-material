// These two imports bring in the whole Three.js lib, taking more time to
// download than necessary. https://discourse.threejs.org/t/idea-update-all-modules-to-not-import-the-entire-three-js-library/36956/21
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'

// from https://discourse.threejs.org/t/functions-to-calculate-the-visible-width-height-at-a-given-z-depth-from-a-perspective-camera/269
export function visibleHeightAtZDepth(depth, camera) {
	if (camera.isOrthographicCamera) {
		return Math.abs(camera.top - camera.bottom)
	}

	// compensate for cameras not positioned at z=0
	const cameraOffset = camera.position.z
	if (depth < cameraOffset) {
		depth -= cameraOffset
	} else {
		depth += cameraOffset
	}

	// vertical fov in radians
	const vFOV = (camera.fov * Math.PI) / 180

	// Math.abs to ensure the result is always positive
	return 2 * Math.tan(vFOV / 2) * Math.abs(depth)
}

export function visibleWidthAtZDepth(depth, camera) {
	if (camera.isOrthographicCamera) {
		return Math.abs(camera.right - camera.left)
	}

	const height = visibleHeightAtZDepth(depth, camera)
	return height * camera.aspect
}

// extract all geometry from a gltf scene
export function extractGeometry(gltf) {
	const geometries = []
	gltf.traverse(child => {
		if (child.isMesh) {
			geometries.push(child.geometry)
		}
	})

	return BufferGeometryUtils.mergeBufferGeometries(geometries)
}

// promise wrapper of the GLTFLoader
export function loadGltf(url) {
	return new Promise((resolve, reject) => {
		new GLTFLoader().load(url, resolve, null, reject)
	})
}
