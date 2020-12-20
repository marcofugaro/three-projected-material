// Taken from https://github.com/marcofugaro/threejs-modern-app/blob/master/src/lib/WebGLApp.js
import * as THREE from 'https://unpkg.com/three@0.122.0/build/three.module.js'
import { OrbitControls } from 'https://unpkg.com/three@0.122.0/examples/jsm/controls/OrbitControls.js'
import Stats from 'https://unpkg.com/three@0.122.0/examples/jsm/libs/stats.module.js'
import State from './controls-state.module.js'
import wrapGUI from './controls-gui.module.js'

export default class WebGLApp {
  #updateListeners = []
  #rafID
  #lastTime

  constructor({
    background = '#000',
    backgroundAlpha = 1,
    fov = 45,
    frustumSize = 3,
    near = 0.01,
    far = 100,
    ...options
  } = {}) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      failIfMajorPerformanceCaveat: true,
      ...options,
    })

    if (options.outputEncoding) {
      this.renderer.outputEncoding = options.outputEncoding
    }

    this.renderer.sortObjects = false
    this.canvas = this.renderer.domElement

    this.renderer.setClearColor(background, backgroundAlpha)

    // clamp pixel ratio for performance
    this.maxPixelRatio = options.maxPixelRatio || 2
    // clamp delta to stepping anything too far forward
    this.maxDeltaTime = options.maxDeltaTime || 1 / 30

    // setup a basic camera
    if (!options.orthographic) {
      this.camera = new THREE.PerspectiveCamera(fov, 1, near, far)
    } else {
      const aspect = window.innerWidth / window.innerHeight
      this.camera = new THREE.OrthographicCamera(
        -(frustumSize * aspect) / 2,
        (frustumSize * aspect) / 2,
        frustumSize / 2,
        -frustumSize / 2,
        0.01,
        100
      )
      this.camera.frustumSize = frustumSize
    }
    this.camera.position.copy(options.cameraPosition || new THREE.Vector3(0, 0, 4))
    this.scene = new THREE.Scene()

    this.gl = this.renderer.getContext()

    this.time = 0
    this.isRunning = false
    this.#lastTime = performance.now()
    this.#rafID = null

    // handle resize events
    window.addEventListener('resize', this.resize)
    window.addEventListener('orientationchange', this.resize)

    // force an initial resize event
    this.resize()

    // __________________________ADDONS__________________________

    // set up a simple orbit controller
    if (options.orbitControls) {
      this.orbitControls = new OrbitControls(this.camera, this.canvas)

      this.orbitControls.enableDamping = true
      this.orbitControls.dampingFactor = 0.15
      this.orbitControls.enablePan = false

      if (options.orbitControls instanceof Object) {
        Object.keys(options.orbitControls).forEach((key) => {
          this.orbitControls[key] = options.orbitControls[key]
        })
      }
    }

    // show the fps meter
    if (options.showFps) {
      this.stats = new Stats()
      this.stats.showPanel(0)
      document.body.appendChild(this.stats.dom)
    }

    // initialize the controls-state
    if (options.controls) {
      const controlsState = State(options.controls)
      this.controls = options.hideControls
        ? controlsState
        : wrapGUI(controlsState, { expanded: !options.closeControls })

      // add the custom controls-gui styles
      if (!options.hideControls) {
        const styles = `
          [class^="controlPanel-"] [class*="__field"]::before {
            content: initial !important;
          }
          [class^="controlPanel-"] [class*="__labelText"] {
            text-indent: 6px !important;
          }
          [class^="controlPanel-"] [class*="__field--button"] > button::before {
            content: initial !important;
          }
        `
        const style = document.createElement('style')
        style.type = 'text/css'
        style.innerHTML = styles
        document.head.appendChild(style)
      }
    }
  }

  resize = ({
    width = window.innerWidth,
    height = window.innerHeight,
    pixelRatio = Math.min(this.maxPixelRatio, window.devicePixelRatio),
  } = {}) => {
    this.width = width
    this.height = height
    this.pixelRatio = pixelRatio

    // update pixel ratio if necessary
    if (this.renderer.getPixelRatio() !== pixelRatio) {
      this.renderer.setPixelRatio(pixelRatio)
    }

    // setup new size & update camera aspect if necessary
    this.renderer.setSize(width, height)
    if (this.camera.isPerspectiveCamera) {
      this.camera.aspect = width / height
    } else {
      const aspect = width / height
      this.camera.left = -(this.camera.frustumSize * aspect) / 2
      this.camera.right = (this.camera.frustumSize * aspect) / 2
      this.camera.top = this.camera.frustumSize / 2
      this.camera.bottom = -this.camera.frustumSize / 2
    }
    this.camera.updateProjectionMatrix()

    // recursively tell all child objects to resize
    this.scene.traverse((obj) => {
      if (typeof obj.resize === 'function') {
        obj.resize({
          width,
          height,
          pixelRatio,
        })
      }
    })

    // draw a frame to ensure the new size has been registered visually
    this.draw()
    return this
  }

  update = (dt, time) => {
    if (this.orbitControls) {
      this.orbitControls.update()
    }

    // recursively tell all child objects to update
    this.scene.traverse((obj) => {
      if (typeof obj.update === 'function') {
        obj.update(dt, time)
      }
    })

    // call the update listeners
    this.#updateListeners.forEach((fn) => fn(dt, time))

    return this
  }

  onUpdate(fn) {
    this.#updateListeners.push(fn)
  }

  draw = () => {
    this.renderer.render(this.scene, this.camera)
    return this
  }

  start = () => {
    if (this.#rafID !== null) return
    this.#rafID = window.requestAnimationFrame(this.animate)
    this.isRunning = true
    return this
  }

  stop = () => {
    if (this.#rafID === null) return
    window.cancelAnimationFrame(this.#rafID)
    this.#rafID = null
    this.isRunning = false
    return this
  }

  animate = () => {
    if (!this.isRunning) return
    window.requestAnimationFrame(this.animate)

    if (this.stats) this.stats.begin()

    const now = performance.now()
    const dt = Math.min(this.maxDeltaTime, (now - this.#lastTime) / 1000)
    this.time += dt
    this.#lastTime = now
    this.update(dt, this.time)
    this.draw()

    if (this.stats) this.stats.end()
  }

  traverse = (fn, ...args) => {
    this.scene.traverse((child) => {
      if (typeof child[fn] === 'function') {
        child[fn].apply(child, args)
      }
    })
  }
}
