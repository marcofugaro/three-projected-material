var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var isImplemented = function () {
	var assign = Object.assign,
	    obj;
	if (typeof assign !== "function") return false;
	obj = { foo: "raz" };
	assign(obj, { bar: "dwa" }, { trzy: "trzy" });
	return obj.foo + obj.bar + obj.trzy === "razdwatrzy";
};

var isImplemented$1 = function () {
	try {
		return true;
	} catch (e) {
		return false;
	}
};

// eslint-disable-next-line no-empty-function

var noop = function () {};

var _undefined = noop(); // Support ES3 engines

var isValue = function (val) {
  return val !== _undefined && val !== null;
};

var keys = Object.keys;

var shim = function (object) {
  return keys(isValue(object) ? Object(object) : object);
};

var keys$1 = isImplemented$1() ? Object.keys : shim;

var validValue = function (value) {
	if (!isValue(value)) throw new TypeError("Cannot use null or undefined");
	return value;
};

var max = Math.max;

var shim$1 = function (dest, src /*, …srcn*/) {
	var error,
	    i,
	    length = max(arguments.length, 2),
	    assign;
	dest = Object(validValue(dest));
	assign = function (key) {
		try {
			dest[key] = src[key];
		} catch (e) {
			if (!error) error = e;
		}
	};
	for (i = 1; i < length; ++i) {
		src = arguments[i];
		keys$1(src).forEach(assign);
	}
	if (error !== undefined) throw error;
	return dest;
};

var assign = isImplemented() ? Object.assign : shim$1;

var forEach = Array.prototype.forEach,
    create = Object.create;

var process$1 = function (src, obj) {
	var key;
	for (key in src) {
		obj[key] = src[key];
	}
};

// eslint-disable-next-line no-unused-vars
var normalizeOptions = function (opts1 /*, …options*/) {
	var result = create(null);
	forEach.call(arguments, function (options) {
		if (!isValue(options)) return;
		process$1(Object(options), result);
	});
	return result;
};

// Deprecated

var isCallable = function (obj) {
  return typeof obj === "function";
};

var str = "razdwatrzy";

var isImplemented$2 = function () {
	if (typeof str.contains !== "function") return false;
	return str.contains("dwa") === true && str.contains("foo") === false;
};

var indexOf = String.prototype.indexOf;

var shim$2 = function (searchString /*, position*/) {
	return indexOf.call(this, searchString, arguments[1]) > -1;
};

var contains = isImplemented$2() ? String.prototype.contains : shim$2;

var d_1 = createCommonjsModule(function (module) {

	var d;

	d = module.exports = function (dscr, value /*, options*/) {
		var c, e, w, options, desc;
		if (arguments.length < 2 || typeof dscr !== 'string') {
			options = value;
			value = dscr;
			dscr = null;
		} else {
			options = arguments[2];
		}
		if (dscr == null) {
			c = w = true;
			e = false;
		} else {
			c = contains.call(dscr, 'c');
			e = contains.call(dscr, 'e');
			w = contains.call(dscr, 'w');
		}

		desc = { value: value, configurable: c, enumerable: e, writable: w };
		return !options ? desc : assign(normalizeOptions(options), desc);
	};

	d.gs = function (dscr, get, set /*, options*/) {
		var c, e, options, desc;
		if (typeof dscr !== 'string') {
			options = set;
			set = get;
			get = dscr;
			dscr = null;
		} else {
			options = arguments[3];
		}
		if (get == null) {
			get = undefined;
		} else if (!isCallable(get)) {
			options = get;
			get = set = undefined;
		} else if (set == null) {
			set = undefined;
		} else if (!isCallable(set)) {
			options = set;
			set = undefined;
		}
		if (dscr == null) {
			c = true;
			e = false;
		} else {
			c = contains.call(dscr, 'c');
			e = contains.call(dscr, 'e');
		}

		desc = { get: get, set: set, configurable: c, enumerable: e };
		return !options ? desc : assign(normalizeOptions(options), desc);
	};
});

var validCallable = function (fn) {
	if (typeof fn !== "function") throw new TypeError(fn + " is not a function");
	return fn;
};

var eventEmitter = createCommonjsModule(function (module, exports) {

	var apply = Function.prototype.apply,
	    call = Function.prototype.call,
	    create = Object.create,
	    defineProperty = Object.defineProperty,
	    defineProperties = Object.defineProperties,
	    hasOwnProperty = Object.prototype.hasOwnProperty,
	    descriptor = { configurable: true, enumerable: false, writable: true },
	    on,
	    once,
	    off,
	    emit,
	    methods,
	    descriptors,
	    base;

	on = function (type, listener) {
		var data;

		validCallable(listener);

		if (!hasOwnProperty.call(this, '__ee__')) {
			data = descriptor.value = create(null);
			defineProperty(this, '__ee__', descriptor);
			descriptor.value = null;
		} else {
			data = this.__ee__;
		}
		if (!data[type]) data[type] = listener;else if (typeof data[type] === 'object') data[type].push(listener);else data[type] = [data[type], listener];

		return this;
	};

	once = function (type, listener) {
		var once, self;

		validCallable(listener);
		self = this;
		on.call(this, type, once = function () {
			off.call(self, type, once);
			apply.call(listener, this, arguments);
		});

		once.__eeOnceListener__ = listener;
		return this;
	};

	off = function (type, listener) {
		var data, listeners, candidate, i;

		validCallable(listener);

		if (!hasOwnProperty.call(this, '__ee__')) return this;
		data = this.__ee__;
		if (!data[type]) return this;
		listeners = data[type];

		if (typeof listeners === 'object') {
			for (i = 0; candidate = listeners[i]; ++i) {
				if (candidate === listener || candidate.__eeOnceListener__ === listener) {
					if (listeners.length === 2) data[type] = listeners[i ? 0 : 1];else listeners.splice(i, 1);
				}
			}
		} else {
			if (listeners === listener || listeners.__eeOnceListener__ === listener) {
				delete data[type];
			}
		}

		return this;
	};

	emit = function (type) {
		var i, l, listener, listeners, args;

		if (!hasOwnProperty.call(this, '__ee__')) return;
		listeners = this.__ee__[type];
		if (!listeners) return;

		if (typeof listeners === 'object') {
			l = arguments.length;
			args = new Array(l - 1);
			for (i = 1; i < l; ++i) {
				args[i - 1] = arguments[i];
			}listeners = listeners.slice();
			for (i = 0; listener = listeners[i]; ++i) {
				apply.call(listener, this, args);
			}
		} else {
			switch (arguments.length) {
				case 1:
					call.call(listeners, this);
					break;
				case 2:
					call.call(listeners, this, arguments[1]);
					break;
				case 3:
					call.call(listeners, this, arguments[1], arguments[2]);
					break;
				default:
					l = arguments.length;
					args = new Array(l - 1);
					for (i = 1; i < l; ++i) {
						args[i - 1] = arguments[i];
					}
					apply.call(listeners, this, args);
			}
		}
	};

	methods = {
		on: on,
		once: once,
		off: off,
		emit: emit
	};

	descriptors = {
		on: d_1(on),
		once: d_1(once),
		off: d_1(off),
		emit: d_1(emit)
	};

	base = defineProperties({}, descriptors);

	module.exports = exports = function (o) {
		return o == null ? create(base) : defineProperties(Object(o), descriptors);
	};
	exports.methods = methods;
});
var eventEmitter_1 = eventEmitter.methods;

var performanceNow = createCommonjsModule(function (module) {
  // Generated by CoffeeScript 1.12.2
  (function () {
    var getNanoSeconds, hrtime, loadTime, moduleLoadTime, nodeLoadTime, upTime;

    if (typeof performance !== "undefined" && performance !== null && performance.now) {
      module.exports = function () {
        return performance.now();
      };
    } else if (typeof process !== "undefined" && process !== null && process.hrtime) {
      module.exports = function () {
        return (getNanoSeconds() - nodeLoadTime) / 1e6;
      };
      hrtime = process.hrtime;
      getNanoSeconds = function () {
        var hr;
        hr = hrtime();
        return hr[0] * 1e9 + hr[1];
      };
      moduleLoadTime = getNanoSeconds();
      upTime = process.uptime() * 1e9;
      nodeLoadTime = moduleLoadTime - upTime;
    } else if (Date.now) {
      module.exports = function () {
        return Date.now() - loadTime;
      };
      loadTime = Date.now();
    } else {
      module.exports = function () {
        return new Date().getTime() - loadTime;
      };
      loadTime = new Date().getTime();
    }
  }).call(commonjsGlobal);

  });

var root = typeof window === 'undefined' ? commonjsGlobal : window,
    vendors = ['moz', 'webkit'],
    suffix = 'AnimationFrame',
    raf = root['request' + suffix],
    caf = root['cancel' + suffix] || root['cancelRequest' + suffix];

for (var i = 0; !raf && i < vendors.length; i++) {
  raf = root[vendors[i] + 'Request' + suffix];
  caf = root[vendors[i] + 'Cancel' + suffix] || root[vendors[i] + 'CancelRequest' + suffix];
}

// Some versions of FF have rAF but not cAF
if (!raf || !caf) {
  var last = 0,
      id = 0,
      queue = [],
      frameDuration = 1000 / 60;

  raf = function (callback) {
    if (queue.length === 0) {
      var _now = performanceNow(),
          next = Math.max(0, frameDuration - (_now - last));
      last = next + _now;
      setTimeout(function () {
        var cp = queue.slice(0);
        // Clear queue here to prevent
        // callbacks from appending listeners
        // to the current frame's queue
        queue.length = 0;
        for (var i = 0; i < cp.length; i++) {
          if (!cp[i].cancelled) {
            try {
              cp[i].callback(last);
            } catch (e) {
              setTimeout(function () {
                throw e;
              }, 0);
            }
          }
        }
      }, Math.round(next));
    }
    queue.push({
      handle: ++id,
      callback: callback,
      cancelled: false
    });
    return id;
  };

  caf = function (handle) {
    for (var i = 0; i < queue.length; i++) {
      if (queue[i].handle === handle) {
        queue[i].cancelled = true;
      }
    }
  };
}

var raf_1 = function (fn) {
  // Wrap in a new function to prevent
  // `cancel` potentially being assigned
  // to the native rAF function
  return raf.call(root, fn);
};
var cancel = function () {
  caf.apply(root, arguments);
};
var polyfill = function (object) {
  if (!object) {
    object = root;
  }
  object.requestAnimationFrame = raf;
  object.cancelAnimationFrame = caf;
};
raf_1.cancel = cancel;
raf_1.polyfill = polyfill;

var field = Field;

function Field(name, initialValue, parentField, config) {
  if (/\./.test(name)) {
    throw new Error('Field names may not contain a period');
  }

  config = config || {};

  var value = initialValue;

  this.parent = parentField || null;
  this.events = new eventEmitter();

  this.type = null;
  this.name = name;

  this.batchedUpdates = {};
  this.batchUpdatePaths = [];
  this.batchUpdateRaf = null;

  Object.defineProperties(this, {
    '$field': {
      enumerable: false,
      value: this
    },
    '$config': {
      enumerable: false,
      value: config
    },
    'value': {
      get: function () {
        return value;
      },
      set: function (newValue) {
        var event = {
          field: this,
          name: this.name,
          path: this.path,
          fullPath: this.path,
          oldValue: value,
          value: newValue
        };

        var path = [];
        var field = this;

        do {
          event.path = path.join('.');

          var changes = {};
          changes[event.path || this.name] = Object.assign({}, event);

          if (field.events.emit) {
            field.events.emit('beforeChange', Object.assign({}, event));
            field.events.emit('beforeChanges', changes);
          }

          if (field._batchEmit) {
            field._batchEmit(event.path, Object.assign({}, event));
          }

          path.unshift(field.name);
        } while (field = field.parent);

        value = newValue;
      }
    },
    'path': {
      enumerable: true,
      get: function () {
        var parentPath = (this.parent || {}).path;
        if (!this.name) return null;
        return (parentPath ? parentPath + '.' : '') + this.name;
      }
    }
  });
}

Field.prototype = {
  onBeforeChange: function (callback) {
    this.events.on('beforeChange', callback);
    return this;
  },
  offBeforeChange: function (callback) {
    this.events.off('beforeChange', callback);
    return this;
  },

  onBeforeChanges: function (callback) {
    this.events.on('beforeChanges', callback);
    return this;
  },
  offBeforeChanges: function (callback) {
    this.events.off('beforeChanges', callback);
    return this;
  },

  onChange: function (callback) {
    this.events.on('change', callback);
    return this;
  },
  offChange: function (callback) {
    this.events.off('change', callback);
    return this;
  },

  onChanges: function (callback) {
    this.events.on('changes', callback);
    return this;
  },
  offChanges: function (callback) {
    this.events.off('changes', callback);
    return this;
  },

  _emitUpdate: function () {
    this.events.emit('changes', Object.assign({}, this.batchedUpdates));

    while (this.batchUpdatePaths.length) {
      var updateKeys = Object.keys(this.batchedUpdates);
      for (var i = 0; i < updateKeys.length; i++) {
        var event = this.batchedUpdates[updateKeys[i]];
        var path = this.batchUpdatePaths.pop();
        this.events.emit('change', event);
        this.events.emit('change:' + path, event);
      }
    }
    this.batchedUpdates = {};
    this.batchUpdateRaf = null;
  },
  _batchEmit: function (path, event) {
    var existingUpdate = this.batchedUpdates[event.path];
    if (existingUpdate) {
      event.oldValue = existingUpdate.oldValue;
    }
    this.batchUpdatePaths.push(path);
    this.batchedUpdates[path] = event;

    if (!this.batchUpdateRaf) {
      this.batchUpdateRaf = raf_1(this._emitUpdate.bind(this));
    }
  }
};

var raw = Raw;

function Raw(name, htmlContent, config, parentField) {
  if (!(this instanceof Raw)) return new Raw(name, htmlContent, config, parentField);

  field.call(this, name, htmlContent, parentField, config);

  this.type = 'raw';
}

Raw.prototype = Object.create(field.prototype);

var slider = Slider;

function identity(x) {
  return x;
}

function Slider(name, initialValue, config, parentField) {
  if (!(this instanceof Slider)) return new Slider(name, initialValue, config, parentField);

  initialValue = initialValue === undefined ? 0 : initialValue;
  config = config || {};

  field.call(this, name, initialValue, parentField, config);

  var isValueBetween0and1 = 0 <= initialValue && initialValue <= 1;
  var defaultMin = isValueBetween0and1 ? 0 : Math.min(initialValue * 2, 0);
  var defaultMax = isValueBetween0and1 ? 1 : Math.max(initialValue * 2, 1);
  var defaultStep = isValueBetween0and1 ? 0.01 : 1;
  this.min = config.min === undefined ? defaultMin : config.min;
  this.max = config.max === undefined ? defaultMax : config.max;
  this.mapping = typeof config.mapping !== 'function' ? identity : config.mapping;
  this.inverseMapping = typeof config.inverseMapping !== 'function' ? identity : config.inverseMapping;

  this.steps = Math.round((this.max - this.min) / defaultStep);
  if (config.steps !== undefined) {
    this.steps = config.steps;
  } else if (config.step !== undefined) {
    this.steps = Math.round((this.max - this.min) / config.step);
  }

  this.type = 'slider';
}

Slider.prototype = Object.create(field.prototype);

var button = Button;

function Button(name, htmlContent, config, parentField) {
  if (!(this instanceof Button)) return new Button(name, htmlContent, config, parentField);

  field.call(this, name, htmlContent, parentField, config);

  this.type = 'button';
}

Button.prototype = Object.create(field.prototype);

var textinput = TextInput;

function TextInput(name, initialValue, config, parentField) {
  if (!(this instanceof TextInput)) return new TextInput(name, initialValue, config, parentField);

  initialValue = initialValue === undefined ? '' : initialValue;

  field.call(this, name, initialValue, parentField, config);

  this.type = 'textinput';
}

TextInput.prototype = Object.create(field.prototype);

var color = Color;

function Color(name, initialValue, config, parentField) {
  if (!(this instanceof Color)) return new Color(name, initialValue, config);

  initialValue = initialValue === undefined ? '#ffffff' : initialValue;

  field.call(this, name, initialValue, parentField, config);

  this.type = 'color';
}

Color.prototype = Object.create(field.prototype);

var checkbox = Checkbox;

function Checkbox(name, initialValue, config, parentField) {
  if (!(this instanceof Checkbox)) return new Checkbox(name, initialValue, config, parentField);

  initialValue = initialValue === undefined ? true : !!initialValue;

  field.call(this, name, initialValue, parentField, config);

  this.type = 'checkbox';
}

Checkbox.prototype = Object.create(field.prototype);

var win;

if (typeof window !== "undefined") {
    win = window;
} else if (typeof commonjsGlobal !== "undefined") {
    win = commonjsGlobal;
} else if (typeof self !== "undefined") {
    win = self;
} else {
    win = {};
}

var window_1 = win;

function isHTMLElement(element) {
  return window_1.Element && element instanceof window_1.Element || window_1.HTMLDocument && element instanceof window_1.HTMLDocument;
}

var COLOR_REGEX = /(#(?:[0-9a-fA-F]{2,4}){2,4}|(#[0-9a-fA-F]{3})|(rgb|hsl)a?((-?\d+%?[,\s]+){2,3}\s*[\d.]+%?))/;

var inferType = function inferType(value) {
  if (value && value.type) {
    return value.type + 'field';
  }

  if (isHTMLElement(value)) {
    return 'rawfield';
  }

  if (typeof value === 'function') {
    return 'button';
  }

  switch (typeof value) {
    case 'string':
      if (COLOR_REGEX.test(value)) {
        return 'color';
      }
      return 'textinput';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'raw':
      return 'raw';
    case 'button':
      return 'button';
    case 'object':
      return 'object';
  }
};

var section = Section;

function constructField(fieldName, fieldValue, parentField) {
  switch (inferType(fieldValue)) {
    case 'rawfield':
    case 'buttonfield':
    case 'colorfield':
    case 'textfield':
    case 'sliderfield':
    case 'selectfield':
    case 'rangesliderfield':
    case 'checkboxfield':
    case 'sectionfield':
    case 'tabsfield':
      if (fieldValue.path) {
        throw new Error('You may only add an field to a set of controls once.');
      }

      fieldValue.$field.parent = parentField;
      fieldValue.name = fieldName;

      return fieldValue;
    case 'color':
      return new color(fieldName, fieldValue, {}, parentField);
    case 'raw':
      return new raw(fieldName, fieldValue, {}, parentField);
    case 'button':
      return new button(fieldName, fieldValue, {}, parentField);
    case 'textinput':
      return new textinput(fieldName, fieldValue, {}, parentField);
    case 'number':
      return new slider(fieldName, fieldValue, {}, parentField);
    case 'boolean':
      return new checkbox(fieldName, fieldValue, {}, parentField);
    case 'object':
      return new Section(fieldName, fieldValue, {}, parentField);
    default:
      return null;
  }
}

function Section(name, inputFields, config, parentField) {
  var _this = this;

  config = config || {};
  var displayFields = {};
  var fieldAccessor = {};
  var value = {};

  field.call(this, name, value, parentField, config);

  this.type = 'section';

  Object.defineProperty(fieldAccessor, '$field', {
    enumerable: false,
    value: this
  });

  Object.defineProperties(value, {
    '$field': {
      enumerable: false,
      value: this
    },
    '$path': {
      enumerable: false,
      value: fieldAccessor
    },
    '$displayFields': {
      enumerable: false,
      value: displayFields
    }
  });

  Object.keys(inputFields).forEach(function (fieldName) {
    var field = displayFields[fieldName] = constructField(fieldName, inputFields[fieldName], _this);
    var config = field.$config;

    if (field.type === 'raw' || field.type === 'button') {

      var enumerable = config.enumerable === undefined ? false : !!config.enumerable;

      Object.defineProperty(value, fieldName, {
        enumerable: enumerable,
        get: function () {
          return field.value;
        }
      });

      Object.defineProperty(fieldAccessor, fieldName, {
        enumerable: enumerable,
        get: function () {
          return field;
        }
      });
    } else if (field.type === 'section' || field.type === 'tabs') {

      var enumerable = config.enumerable === undefined ? true : !!config.enumerable;

      // For folders, it needs to return the section object with fancy getters and setters
      Object.defineProperty(value, fieldName, {
        enumerable: enumerable,
        value: field.value
      });

      Object.defineProperty(fieldAccessor, fieldName, {
        enumerable: enumerable,
        value: field.value.$path
      });
    } else {

      var enumerable = config.enumerable === undefined ? true : !!config.enumerable;

      Object.defineProperty(value, fieldName, {
        enumerable: enumerable,
        get: function () {
          return field.value;
        },
        set: function (value) {
          field.value = value;
        }
      });

      Object.defineProperty(fieldAccessor, fieldName, {
        enumerable: enumerable,
        get: function () {
          return field;
        }
      });
    }
  });

  Object.defineProperties(value, {
    $onBeforeChanges: {
      enumerable: false,
      value: this.onBeforeChanges.bind(this)
    },
    $onBeforeChange: {
      enumerable: false,
      value: this.onBeforeChange.bind(this)
    },

    $offBeforeChanges: {
      enumerable: false,
      value: this.offBeforeChanges.bind(this)
    },
    $offBeforeChange: {
      enumerable: false,
      value: this.offBeforeChange.bind(this)
    },

    $onChanges: {
      enumerable: false,
      value: this.onChanges.bind(this)
    },
    $onChange: {
      enumerable: false,
      value: this.onChange.bind(this)
    },

    $offChanges: {
      enumerable: false,
      value: this.offChanges.bind(this)
    },
    $offChange: {
      enumerable: false,
      value: this.offChange.bind(this)
    }
  });
}

Section.prototype = Object.create(field.prototype);

var tabs = function Tabs(name, inputFields, config, parentField) {
  var section$1 = new section(name, inputFields, config, parentField);

  section$1.type = 'tabs';

  return section$1;
};

var select = Select;

function Select(name, initialValue, config, parentField) {
  if (!(this instanceof Select)) return new Select(name, initialValue, config, parentField);

  initialValue = initialValue === undefined ? null : initialValue;

  field.call(this, name, initialValue, parentField, config);

  this.options = config.options;

  this.type = 'select';
}

Select.prototype = Object.create(field.prototype);

function Controls(fields, options) {
  return new section('', fields, options).value;
}

Controls.Slider = function (value, opts) {
  return new slider(null, value, opts);
};

Controls.Textinput = function (value, opts) {
  return new textinput(null, value, opts);
};

Controls.Select = function (value, opts) {
  return new select(null, value, opts);
};

Controls.Checkbox = function (value, opts) {
  return new checkbox(null, value, opts);
};

Controls.Color = function (value, opts) {
  return new color(null, value, opts);
};

Controls.Section = function (value, opts) {
  return new section(null, value, opts);
};

Controls.Tabs = function (value, opts) {
  return new tabs(null, value, opts);
};

Controls.Raw = function (value, opts) {
  return new raw(null, value, opts);
};

var src = Controls;

export default src;
