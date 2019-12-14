import 'regenerator-runtime/runtime'
import * as THREE from 'three'
import ProjectedMaterial, { project } from '..'
import { random } from 'lodash'
import WebGLApp from './lib/WebGLApp.js'
import assets from './lib/AssetManager.js'

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
  url: 'images/charles-unsplash.jpg',
  type: 'texture',
})

// load any queued assets
assets.load({ renderer: webgl.renderer }).then(() => {
  // show canvas
  webgl.canvas.style.visibility = ''

  // breate a bunch of meshes
  const elements = new THREE.Group()
  const NUM_ELEMENTS = 80
  for (let i = 0; i < NUM_ELEMENTS; i++) {
    const geometry = new THREE.IcosahedronGeometry(random(0.1, 0.4))
    const material = new ProjectedMaterial({
      // this time use the scene camera
      camera: webgl.camera,
      texture: assets.get(textureKey),
      color: '#3149D5',
      textureScale: 0.8,
    })
    const element = new THREE.Mesh(geometry, material)

    // move the meshes any way you want!
    if (i < Math.round(NUM_ELEMENTS * 0.3)) {
      element.position.x = random(-0.5, 0.5)
      element.position.y = random(-1.1, 0.5)
      element.position.z = random(-0.3, 0.3)
    } else {
      element.position.x = random(-1, 1, true)
      element.position.y = random(-2, 2, true)
      element.position.z = random(-0.5, 0.5)
    }
    element.rotation.x = random(0, Math.PI * 2)
    element.rotation.y = random(0, Math.PI * 2)
    element.rotation.z = random(0, Math.PI * 2)

    // and when you're ready project the texture!
    project(element)

    elements.add(element)
  }

  webgl.scene.add(elements)

  elements.rotation.y = Math.PI / 2
  webgl.onUpdate(() => {
    elements.rotation.y -= 0.003
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
