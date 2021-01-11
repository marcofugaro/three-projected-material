// Taken from https://github.com/marcofugaro/threejs-modern-app/blob/master/src/lib/WebGLApp.js
import * as THREE from 'https://unpkg.com/three@0.124.0/build/three.module.js'
import { OrbitControls } from 'https://unpkg.com/three@0.124.0/examples/jsm/controls/OrbitControls.js'
import Stats from 'https://unpkg.com/three@0.124.0/examples/jsm/libs/stats.module.js'
// import CCapture from 'https://unpkg.com/ccapture.js@1.1.0/build/CCapture.all.min.js'
import { initControls } from './Controls.js'

export default class WebGLApp {
  _width
  _height
  _capturer
  isRunning = false
  time = 0
  dt = 0
  _lastTime = performance.now()
  _updateListeners = []
  _pointerdownListeners = []
  _pointermoveListeners = []
  _pointerupListeners = []
  _startX
  _startY

  get background() {
    return this.renderer.getClearColor(new THREE.Color())
  }

  get backgroundAlpha() {
    return this.renderer.getClearAlpha()
  }

  get isRecording() {
    return Boolean(this._capturer)
  }

  constructor({
    background = '#111',
    backgroundAlpha = 1,
    fov = 45,
    frustumSize = 3,
    near = 0.01,
    far = 100,
    ...options
  } = {}) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: !options.postprocessing,
      alpha: backgroundAlpha !== 1,
      // enabled for recording gifs or videos,
      // might disable it for performance reasons
      preserveDrawingBuffer: true,
      ...options,
    })
    if (options.sortObjects !== undefined) {
      this.renderer.sortObjects = options.sortObjects
    }
    if (options.gamma) {
      this.renderer.outputEncoding = THREE.sRGBEncoding
    }
    if (options.xr) {
      this.renderer.xr.enabled = true
    }

    this.canvas = this.renderer.domElement

    this.renderer.setClearColor(background, backgroundAlpha)

    // save the fixed dimensions
    this._width = options.width
    this._height = options.height

    // clamp pixel ratio for performance
    this.maxPixelRatio = options.maxPixelRatio || 1.5
    // clamp delta to avoid stepping anything too far forward
    this.maxDeltaTime = options.maxDeltaTime || 1 / 30

    // setup the camera
    const aspect = this._width / this._height
    if (!options.orthographic) {
      this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
    } else {
      this.camera = new THREE.OrthographicCamera(
        -(frustumSize * aspect) / 2,
        (frustumSize * aspect) / 2,
        frustumSize / 2,
        -frustumSize / 2,
        near,
        far
      )
      this.camera.frustumSize = frustumSize
    }
    this.camera.position.copy(options.cameraPosition || new THREE.Vector3(0, 0, 4))
    this.camera.lookAt(0, 0, 0)

    this.scene = new THREE.Scene()

    this.gl = this.renderer.getContext()

    // handle resize events
    window.addEventListener('resize', this.resize)
    window.addEventListener('orientationchange', this.resize)

    // force an initial resize event
    this.resize()

    // __________________________ADDONS__________________________

    // really basic pointer events handler, the second argument
    // contains the x and y relative to the top left corner
    // of the canvas.
    // In case of touches with multiple fingers, only the
    // first touch is registered.
    this.isDragging = false
    this.canvas.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary) return
      this.isDragging = true
      this._startX = event.offsetX
      this._startY = event.offsetY
      // call onPointerDown method
      this.scene.traverse((child) => {
        if (typeof child.onPointerDown === 'function') {
          child.onPointerDown(event, { x: event.offsetX, y: event.offsetY })
        }
      })
      // call the pointerdown listeners
      this._pointerdownListeners.forEach((fn) => fn(event, { x: event.offsetX, y: event.offsetY }))
    })
    this.canvas.addEventListener('pointermove', (event) => {
      if (!event.isPrimary) return
      // call onPointerMove method
      const position = {
        x: event.offsetX,
        y: event.offsetY,
        ...(this._startX !== undefined && { dragX: event.offsetX - this._startX }),
        ...(this._startY !== undefined && { dragY: event.offsetY - this._startY }),
      }
      this.scene.traverse((child) => {
        if (typeof child.onPointerMove === 'function') {
          child.onPointerMove(event, position)
        }
      })
      // call the pointermove listeners
      this._pointermoveListeners.forEach((fn) => fn(event, position))
    })
    this.canvas.addEventListener('pointerup', (event) => {
      if (!event.isPrimary) return
      this.isDragging = false
      // call onPointerUp method
      const position = {
        x: event.offsetX,
        y: event.offsetY,
        ...(this._startX !== undefined && { dragX: event.offsetX - this._startX }),
        ...(this._startY !== undefined && { dragY: event.offsetY - this._startY }),
      }
      this.scene.traverse((child) => {
        if (typeof child.onPointerUp === 'function') {
          child.onPointerUp(event, position)
        }
      })
      // call the pointerup listeners
      this._pointerupListeners.forEach((fn) => fn(event, position))

      this._startX = undefined
      this._startY = undefined
    })

    // set up OrbitControls
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
      this.controls = initControls(options.controls, options)
    }
  }

  get width() {
    return this._width || window.innerWidth
  }

  get height() {
    return this._height || window.innerHeight
  }

  get pixelRatio() {
    return Math.min(this.maxPixelRatio, window.devicePixelRatio)
  }

  resize = ({ width = this.width, height = this.height, pixelRatio = this.pixelRatio } = {}) => {
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

    // resize also the composer, width and height
    // are automatically extracted from the renderer
    if (this.composer) {
      this.composer.setSize()
    }

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

  // start recording of a gif or a video
  startRecording = ({
    width = 1920,
    height = 1080,
    fileName = 'Recording',
    format = 'gif',
    ...options
  } = {}) => {
    if (this._capturer) {
      return
    }

    // force a specific output size
    this.resize({ width, height, pixelRatio: 1 })
    this.draw()

    this._capturer = new CCapture({
      format,
      name: fileName,
      workersPath: '',
      motionBlurFrames: 2,
      ...options,
    })
    this._capturer.start()
  }

  stopRecording = () => {
    if (!this._capturer) {
      return
    }

    this._capturer.stop()
    this._capturer.save()
    this._capturer = undefined

    // reset to default size
    this.resize()
    this.draw()
  }

  update = (dt, time, xrframe) => {
    if (this.orbitControls) {
      this.orbitControls.update()
    }

    // recursively tell all child objects to update
    this.scene.traverse((obj) => {
      if (typeof obj.update === 'function' && !obj.isTransformControls) {
        obj.update(dt, time, xrframe)
      }
    })

    if (this.world) {
      // update the cannon-es physics engine
      this.world.step(1 / 60, dt)

      // update the debug wireframe renderer
      if (this.cannonDebugger) {
        this.cannonDebugger.update()
      }

      // recursively tell all child bodies to update
      this.world.bodies.forEach((body) => {
        if (typeof body.update === 'function') {
          body.update(dt, time)
        }
      })
    }

    // call the update listeners
    this._updateListeners.forEach((fn) => fn(dt, time, xrframe))

    return this
  }

  onUpdate(fn) {
    this._updateListeners.push(fn)
  }

  onPointerDown(fn) {
    this._pointerdownListeners.push(fn)
  }

  onPointerMove(fn) {
    this._pointermoveListeners.push(fn)
  }

  onPointerUp(fn) {
    this._pointerupListeners.push(fn)
  }

  offUpdate(fn) {
    const index = this._updateListeners.indexOf(fn)

    // return silently if the function can't be found
    if (index === -1) {
      return
    }

    this._updateListeners.splice(index, 1)
  }

  offPointerDown(fn) {
    const index = this._pointerdownListeners.indexOf(fn)

    // return silently if the function can't be found
    if (index === -1) {
      return
    }

    this._pointerdownListeners.splice(index, 1)
  }

  offPointerMove(fn) {
    const index = this._pointermoveListeners.indexOf(fn)

    // return silently if the function can't be found
    if (index === -1) {
      return
    }

    this._pointermoveListeners.splice(index, 1)
  }

  offPointerUp(fn) {
    const index = this._pointerupListeners.indexOf(fn)

    // return silently if the function can't be found
    if (index === -1) {
      return
    }

    this._pointerupListeners.splice(index, 1)
  }

  draw = () => {
    if (this.composer) {
      this.composer.render(this.dt)
    } else {
      this.renderer.render(this.scene, this.camera)
    }
    return this
  }

  start = () => {
    if (this.isRunning) return
    this.renderer.setAnimationLoop(this.animate)
    this.isRunning = true
    return this
  }

  stop = () => {
    if (!this.isRunning) return
    this.renderer.setAnimationLoop(null)
    this.isRunning = false
    return this
  }

  animate = (now, xrframe) => {
    if (!this.isRunning) return

    if (this.stats) this.stats.begin()

    this.dt = Math.min(this.maxDeltaTime, (now - this._lastTime) / 1000)
    this.time += this.dt
    this._lastTime = now
    this.update(this.dt, this.time, xrframe)
    this.draw()

    if (this._capturer) this._capturer.capture(this.canvas)

    if (this.stats) this.stats.end()
  }

  get cursor() {
    return this.canvas.style.cursor
  }

  set cursor(cursor) {
    if (cursor) {
      this.canvas.style.cursor = cursor
    } else {
      this.canvas.style.cursor = null
    }
  }
}
