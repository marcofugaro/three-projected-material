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
