export function monkeyPatch(shader, { header = '', main = '', ...replaces }) {
  let patchedShader = shader

  Object.keys(replaces).forEach((key) => {
    patchedShader = patchedShader.replace(key, replaces[key])
  })

  return patchedShader.replace(
    'void main() {',
    `
    ${header}
    void main() {
      ${main}
    `
  )
}

// run the callback when the image will be loaded
export function addLoadListener(texture, callback) {
  // return if it's already loaded
  if (texture.image) {
    return
  }

  let interval = setInterval(() => {
    console.log('intercalll')
    if (texture.image) {
      clearInterval(interval)
      return callback(texture)
    }
  }, 16)
}
