import * as THREE from 'three'
import ProjectedMaterial, { allocateProjectionData, projectInstanceAt } from '..'
import State from 'controls-state'
import { random } from 'lodash'
import WebGLApp from './lib/WebGLApp.js'
import assets from './lib/AssetManager.js'
import { visibleWidthAtZDepth, visibleHeightAtZDepth } from './lib/three-utils'

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
  controls: {
    speed: State.Slider(0.3, { min: 0, max: 3, step: 0.01 }),
  },
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

  const width = visibleWidthAtZDepth(0, webgl.camera)
  const height = visibleHeightAtZDepth(0, webgl.camera)

  // breate a bunch of instanced elements
  const NUM_ELEMENTS = 1000
  const dummy = new THREE.Object3D()

  const geometry = new THREE.TetrahedronBufferGeometry(0.4)
  const material = new ProjectedMaterial({
    camera: webgl.camera,
    texture: assets.get(textureKey),
    color: '#cccccc',
    cover: true,
    instanced: true,
  })

  // allocate the projection data
  allocateProjectionData(geometry, NUM_ELEMENTS)

  // create the instanced mesh
  const instancedMesh = new THREE.InstancedMesh(geometry, material, NUM_ELEMENTS)

  const initialPositions = []
  const initialRotations = []
  for (let i = 0; i < NUM_ELEMENTS; i++) {
    // position the element
    dummy.position.x = random(-width / 2, width / 2)
    dummy.position.y = random(-height / 2, height / 2)
    dummy.rotation.x = random(0, Math.PI * 2)
    dummy.rotation.y = random(0, Math.PI * 2)
    dummy.rotation.z = random(0, Math.PI * 2)
    dummy.updateMatrix()
    instancedMesh.setMatrixAt(i, dummy.matrix)

    // project the texture!
    dummy.updateMatrixWorld()
    projectInstanceAt(i, instancedMesh, dummy.matrixWorld)

    // rotate the element a bit
    // so they don't show the image initially
    dummy.rotateX(-Math.PI / 2)
    dummy.updateMatrix()
    instancedMesh.setMatrixAt(i, dummy.matrix)

    // save the initial position and rotation
    initialPositions.push(dummy.position.clone())
    initialRotations.push(dummy.rotation.clone())
  }

  webgl.scene.add(instancedMesh)

  // rotate the elements
  webgl.onUpdate((dt, time) => {
    for (let i = 0; i < NUM_ELEMENTS; i++) {
      dummy.position.copy(initialPositions[i])
      dummy.rotation.copy(initialRotations[i])

      dummy.rotateX(time * webgl.controls.speed)
      dummy.updateMatrix()
      instancedMesh.setMatrixAt(i, dummy.matrix)
    }
    instancedMesh.instanceMatrix.needsUpdate = true
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
