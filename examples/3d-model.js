import * as THREE from 'three'
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils'
import ProjectedMaterial, { project } from '..'
import WebGLApp from './lib/WebGLApp.js'
import assets from './lib/AssetManager.js'

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

// grab our canvas
const canvas = document.querySelector('#app')

// setup the WebGLRenderer
const webgl = new WebGLApp({
  canvas,
  // set the scene background color
  background: '#E6E6E6',
  // show the fps counter from stats.js
  showFps: true,
  orbitControls: { distance: 4 },
})

// attach it to the window to inspect in the console
window.webgl = webgl

// hide canvas
webgl.canvas.style.visibility = 'hidden'

// preload the texture
const textureKey = assets.queue({
  url: 'images/uv.jpg',
  type: 'texture',
})

// preload the model
const modelsKey = assets.queue({
  url: 'models/suzanne.gltf',
  type: 'gltf',
})

// load any queued assets
assets.load({ renderer: webgl.renderer }).then(() => {
  // show canvas
  webgl.canvas.style.visibility = ''

  // create the mesh with the projected material
  const gltf = assets.get(modelsKey).scene.clone()
  const geometry = extractGeometry(gltf)
  const material = new ProjectedMaterial({
    camera: webgl.camera,
    texture: assets.get(textureKey),
    color: '#cccccc',
    textureScale: 0.8,
  })
  const mesh = new THREE.Mesh(geometry, material)
  webgl.scene.add(mesh)

  // move the mesh any way you want!
  // (in this case no translations/rotations)

  // and when you're ready project the texture!
  project(mesh)

  // rotate for demo purposes
  mesh.rotation.y = Math.PI / 3
  webgl.onUpdate(() => {
    mesh.rotation.y -= 0.003
  })

  // add lights
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
  directionalLight.position.set(0, 10, 10)
  webgl.scene.add(directionalLight)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  webgl.scene.add(ambientLight)

  // start animation loop
  webgl.start()
  webgl.draw()
})
