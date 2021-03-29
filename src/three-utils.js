import * as THREE from 'three'

export function monkeyPatch(shader, { defines = '', header = '', main = '', ...replaces }) {
  let patchedShader = shader

  const replaceAll = (str, find, rep) => str.split(find).join(rep)
  Object.keys(replaces).forEach((key) => {
    patchedShader = replaceAll(patchedShader, key, replaces[key])
  })

  patchedShader = patchedShader.replace(
    'void main() {',
    `
    ${header}
    void main() {
      ${main}
    `
  )

  const stringDefines = Object.keys(defines)
    .map((d) => `#define ${d} ${defines[d]}`)
    .join('\n')

  return `
    ${stringDefines}
    ${patchedShader}
  `
}

// run the callback when the image will be loaded
export function addLoadListener(texture, callback) {
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

// https://github.com/mrdoob/three.js/blob/3c60484ce033e0dc2d434ce0eb89fc1f59d57d65/src/renderers/webgl/WebGLProgram.js#L22-L48s
export function getEncodingComponents(encoding) {
  switch (encoding) {
    case THREE.LinearEncoding:
      return ['Linear', '( value )']
    case THREE.sRGBEncoding:
      return ['sRGB', '( value )']
    case THREE.RGBEEncoding:
      return ['RGBE', '( value )']
    case THREE.RGBM7Encoding:
      return ['RGBM', '( value, 7.0 )']
    case THREE.RGBM16Encoding:
      return ['RGBM', '( value, 16.0 )']
    case THREE.RGBDEncoding:
      return ['RGBD', '( value, 256.0 )']
    case THREE.GammaEncoding:
      return ['Gamma', '( value, float( GAMMA_FACTOR ) )']
    case THREE.LogLuvEncoding:
      return ['LogLuv', '( value )']
    default:
      console.warn('THREE.WebGLProgram: Unsupported encoding:', encoding)
      return ['Linear', '( value )']
  }
}

// https://github.com/mrdoob/three.js/blob/3c60484ce033e0dc2d434ce0eb89fc1f59d57d65/src/renderers/webgl/WebGLProgram.js#L66-L71
export function getTexelDecodingFunction(functionName, encoding) {
  const components = getEncodingComponents(encoding)
  return `
    vec4 ${functionName}(vec4 value) {
      return ${components[0]}ToLinear${components[1]};
    }
  `
}
