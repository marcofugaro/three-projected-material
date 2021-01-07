import State from './controls-state.module.js'
import wrapGUI from './controls-gui.module.js'

let controls

function mapValues(obj, fn) {
  return Object.fromEntries(Object.entries(obj).map(([k, v], i) => [k, fn(v, k, i)]))
}

function fromObjectToSlider(object) {
  return State.Slider(object.value, {
    min: object.min,
    max: object.max,
    step: object.step || 0.01,
    ...(object.scale === 'exp' && {
      min: object.min || 0.01,
      mapping: (x) => Math.pow(10, x),
      inverseMapping: Math.log10,
    }),
  })
}

export function initControls(object, options = {}) {
  const stateObject = mapValues(object, (value) => {
    if (
      typeof value === 'object' &&
      (value.hasOwnProperty('value') ||
        value.hasOwnProperty('max') ||
        value.hasOwnProperty('min') ||
        value.hasOwnProperty('step'))
    ) {
      return fromObjectToSlider(value)
    }

    if (typeof value === 'object') {
      return mapValues(value, (v) => {
        if (
          typeof v === 'object' &&
          (v.hasOwnProperty('value') ||
            v.hasOwnProperty('max') ||
            v.hasOwnProperty('min') ||
            v.hasOwnProperty('step'))
        ) {
          return fromObjectToSlider(v)
        }

        return value
      })
    }

    return value
  })

  const controlsState = State(stateObject)
  const controlsInstance = options.hideControls
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

  controls = controlsInstance
  return controlsInstance
}

function extractAccessor(fnString) {
  if (fnString.slice(-1) === '}') {
    fnString = fnString.slice(0, -1)
  }

  const accessorStart = fnString.indexOf('.controls.') + '.controls.'.length
  fnString = fnString.slice(accessorStart)

  return fnString.trim()
}

export function wireValue(object, fn) {
  const fnString = fn.toString()
  const accessor = extractAccessor(fnString)

  controls.$onChanges((cons) => {
    if (cons[accessor]) {
      object[accessor] = cons[accessor].value
    }
  })

  return fn()
}

export function wireUniform(object, fn) {
  const fnString = fn.toString()
  const accessor = extractAccessor(fnString)

  const key = accessor.includes('.') ? accessor.slice(accessor.lastIndexOf('.') + 1) : accessor

  controls.$onChanges((cons) => {
    if (cons[accessor]) {
      object.uniforms[key].value = cons[accessor].value
    }
  })

  return { value: fn() }
}
