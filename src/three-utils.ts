import {LinearEncoding, sRGBEncoding, TextureEncoding} from 'three/src/constants.js'
import type {Texture} from 'three'

export function monkeyPatch(
	shader: string,
	{defines = {} as Record<string, string>, header = '', main = '', ...replaces},
) {
	let patchedShader = shader

	const replaceAll = (str: string, find: string, rep: string) => str.split(find).join(rep)

	Object.keys(replaces).forEach(key => {
		patchedShader = replaceAll(patchedShader, key, replaces[key])
	})

	patchedShader = patchedShader.replace(
		'void main() {',
		`
    ${header}
    void main() {
      ${main}
    `,
	)

	const stringDefines = Object.keys(defines)
		.map(d => `#define ${d} ${defines[d]}`)
		.join('\n')

	return `
    ${stringDefines}
    ${patchedShader}
  `
}

// run the callback when the image will be loaded
export function addLoadListener(texture: Texture, callback: (t: Texture) => void) {
	// return if it's already loaded
	if (texture.image && texture.image.videoWidth !== 0 && texture.image.videoHeight !== 0) {
		return
	}

	const interval = setInterval(() => {
		if (texture.image && texture.image.videoWidth !== 0 && texture.image.videoHeight !== 0) {
			clearInterval(interval)
			return callback(texture)
		}
	}, 16)
}

// https://github.com/mrdoob/three.js/blob/r139/src/renderers/webgl/WebGLProgram.js#L26
export function getEncodingComponents(encoding: TextureEncoding) {
	switch (encoding) {
		case LinearEncoding:
			return ['Linear', '( value )']
		case sRGBEncoding:
			return ['sRGB', '( value )']
		default:
			console.warn('THREE.WebGLProgram: Unsupported encoding:', encoding)
			return ['Linear', '( value )']
	}
}

// https://github.com/mrdoob/three.js/blob/3c60484ce033e0dc2d434ce0eb89fc1f59d57d65/src/renderers/webgl/WebGLProgram.js#L66-L71
export function getTexelDecodingFunction(functionName: string, encoding: TextureEncoding) {
	const components = getEncodingComponents(encoding)
	return `
    vec4 ${functionName}(vec4 value) {
      return ${components[0]}ToLinear${components[1]};
    }
  `
}
