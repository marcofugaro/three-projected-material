export function monkeyPatch(shader, { header = '', main = '', ...replaces }) {
  let patchedShader = shader

  Object.keys(replaces).forEach(key => {
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