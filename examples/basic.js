import * as THREE from 'three'
import ProjectedMaterial, { project } from '..'
import WebGLApp from './lib/WebGLApp.js'
import assets from './lib/AssetManager.js'

// grab our canvas
const canvas = document.querySelector('#app')

// setup the WebGLRenderer
const webgl = new WebGLApp({
  canvas,
  // set the scene background color
  background: '#222',
  // show the fps counter from stats.js
  showFps: true,
  orbitControls: { distance: 4, phi: Math.PI / 2.5 },
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

// load any queued assets
assets.load({ renderer: webgl.renderer }).then(() => {
  // show canvas
  webgl.canvas.style.visibility = ''

  // create a new camera from which to project
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 3)
  camera.position.set(2, 1.2, 0.5)
  camera.lookAt(0, 0, 0)

  // add a camer frustum helper just for demostration purposes
  const helper = new THREE.CameraHelper(camera)
  webgl.scene.add(helper)

  // create the mesh with the projected material
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new ProjectedMaterial({
    camera,
    texture: assets.get(textureKey),
    color: '#37E140',
  })
  const box = new THREE.Mesh(geometry, material)
  webgl.scene.add(box)

  // move the mesh any way you want!
  box.rotation.y = -Math.PI / 6

  // and when you're ready project the texture!
  project(box)

  // rotate for demo purposes
  webgl.onUpdate(() => {
    box.rotation.y -= 0.003
  })

  // add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
  webgl.scene.add(ambientLight)

  // start animation loop
  webgl.start()
  webgl.draw()
})
