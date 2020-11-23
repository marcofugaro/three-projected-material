var VNode = function VNode() {};

var options = {};

var stack = [];

var EMPTY_CHILDREN = [];

function h(nodeName, attributes) {
	var children = EMPTY_CHILDREN,
	    lastSimple,
	    child,
	    simple,
	    i;
	for (i = arguments.length; i-- > 2;) {
		stack.push(arguments[i]);
	}
	if (attributes && attributes.children != null) {
		if (!stack.length) stack.push(attributes.children);
		delete attributes.children;
	}
	while (stack.length) {
		if ((child = stack.pop()) && child.pop !== undefined) {
			for (i = child.length; i--;) {
				stack.push(child[i]);
			}
		} else {
			if (typeof child === 'boolean') child = null;

			if (simple = typeof nodeName !== 'function') {
				if (child == null) child = '';else if (typeof child === 'number') child = String(child);else if (typeof child !== 'string') simple = false;
			}

			if (simple && lastSimple) {
				children[children.length - 1] += child;
			} else if (children === EMPTY_CHILDREN) {
				children = [child];
			} else {
				children.push(child);
			}

			lastSimple = simple;
		}
	}

	var p = new VNode();
	p.nodeName = nodeName;
	p.children = children;
	p.attributes = attributes == null ? undefined : attributes;
	p.key = attributes == null ? undefined : attributes.key;

	if (options.vnode !== undefined) options.vnode(p);

	return p;
}

function extend(obj, props) {
	for (var i in props) {
		obj[i] = props[i];
	}return obj;
}

function applyRef(ref, value) {
	if (ref != null) {
		if (typeof ref == 'function') ref(value);else ref.current = value;
	}
}

var defer = typeof Promise == 'function' ? Promise.resolve().then.bind(Promise.resolve()) : setTimeout;

function cloneElement(vnode, props) {
	return h(vnode.nodeName, extend(extend({}, vnode.attributes), props), arguments.length > 2 ? [].slice.call(arguments, 2) : vnode.children);
}

var IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i;

var items = [];

function enqueueRender(component) {
	if (!component._dirty && (component._dirty = true) && items.push(component) == 1) {
		(options.debounceRendering || defer)(rerender);
	}
}

function rerender() {
	var p;
	while (p = items.pop()) {
		if (p._dirty) renderComponent(p);
	}
}

function isSameNodeType(node, vnode, hydrating) {
	if (typeof vnode === 'string' || typeof vnode === 'number') {
		return node.splitText !== undefined;
	}
	if (typeof vnode.nodeName === 'string') {
		return !node._componentConstructor && isNamedNode(node, vnode.nodeName);
	}
	return hydrating || node._componentConstructor === vnode.nodeName;
}

function isNamedNode(node, nodeName) {
	return node.normalizedNodeName === nodeName || node.nodeName.toLowerCase() === nodeName.toLowerCase();
}

function getNodeProps(vnode) {
	var props = extend({}, vnode.attributes);
	props.children = vnode.children;

	var defaultProps = vnode.nodeName.defaultProps;
	if (defaultProps !== undefined) {
		for (var i in defaultProps) {
			if (props[i] === undefined) {
				props[i] = defaultProps[i];
			}
		}
	}

	return props;
}

function createNode(nodeName, isSvg) {
	var node = isSvg ? document.createElementNS('http://www.w3.org/2000/svg', nodeName) : document.createElement(nodeName);
	node.normalizedNodeName = nodeName;
	return node;
}

function removeNode(node) {
	var parentNode = node.parentNode;
	if (parentNode) parentNode.removeChild(node);
}

function setAccessor(node, name, old, value, isSvg) {
	if (name === 'className') name = 'class';

	if (name === 'key') ; else if (name === 'ref') {
		applyRef(old, null);
		applyRef(value, node);
	} else if (name === 'class' && !isSvg) {
		node.className = value || '';
	} else if (name === 'style') {
		if (!value || typeof value === 'string' || typeof old === 'string') {
			node.style.cssText = value || '';
		}
		if (value && typeof value === 'object') {
			if (typeof old !== 'string') {
				for (var i in old) {
					if (!(i in value)) node.style[i] = '';
				}
			}
			for (var i in value) {
				node.style[i] = typeof value[i] === 'number' && IS_NON_DIMENSIONAL.test(i) === false ? value[i] + 'px' : value[i];
			}
		}
	} else if (name === 'dangerouslySetInnerHTML') {
		if (value) node.innerHTML = value.__html || '';
	} else if (name[0] == 'o' && name[1] == 'n') {
		var useCapture = name !== (name = name.replace(/Capture$/, ''));
		name = name.toLowerCase().substring(2);
		if (value) {
			if (!old) node.addEventListener(name, eventProxy, useCapture);
		} else {
			node.removeEventListener(name, eventProxy, useCapture);
		}
		(node._listeners || (node._listeners = {}))[name] = value;
	} else if (name !== 'list' && name !== 'type' && !isSvg && name in node) {
		try {
			node[name] = value == null ? '' : value;
		} catch (e) {}
		if ((value == null || value === false) && name != 'spellcheck') node.removeAttribute(name);
	} else {
		var ns = isSvg && name !== (name = name.replace(/^xlink:?/, ''));

		if (value == null || value === false) {
			if (ns) node.removeAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase());else node.removeAttribute(name);
		} else if (typeof value !== 'function') {
			if (ns) node.setAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase(), value);else node.setAttribute(name, value);
		}
	}
}

function eventProxy(e) {
	return this._listeners[e.type](options.event && options.event(e) || e);
}

var mounts = [];

var diffLevel = 0;

var isSvgMode = false;

var hydrating = false;

function flushMounts() {
	var c;
	while (c = mounts.shift()) {
		if (options.afterMount) options.afterMount(c);
		if (c.componentDidMount) c.componentDidMount();
	}
}

function diff(dom, vnode, context, mountAll, parent, componentRoot) {
	if (!diffLevel++) {
		isSvgMode = parent != null && parent.ownerSVGElement !== undefined;

		hydrating = dom != null && !('__preactattr_' in dom);
	}

	var ret = idiff(dom, vnode, context, mountAll, componentRoot);

	if (parent && ret.parentNode !== parent) parent.appendChild(ret);

	if (! --diffLevel) {
		hydrating = false;

		if (!componentRoot) flushMounts();
	}

	return ret;
}

function idiff(dom, vnode, context, mountAll, componentRoot) {
	var out = dom,
	    prevSvgMode = isSvgMode;

	if (vnode == null || typeof vnode === 'boolean') vnode = '';

	if (typeof vnode === 'string' || typeof vnode === 'number') {
		if (dom && dom.splitText !== undefined && dom.parentNode && (!dom._component || componentRoot)) {
			if (dom.nodeValue != vnode) {
				dom.nodeValue = vnode;
			}
		} else {
			out = document.createTextNode(vnode);
			if (dom) {
				if (dom.parentNode) dom.parentNode.replaceChild(out, dom);
				recollectNodeTree(dom, true);
			}
		}

		out['__preactattr_'] = true;

		return out;
	}

	var vnodeName = vnode.nodeName;
	if (typeof vnodeName === 'function') {
		return buildComponentFromVNode(dom, vnode, context, mountAll);
	}

	isSvgMode = vnodeName === 'svg' ? true : vnodeName === 'foreignObject' ? false : isSvgMode;

	vnodeName = String(vnodeName);
	if (!dom || !isNamedNode(dom, vnodeName)) {
		out = createNode(vnodeName, isSvgMode);

		if (dom) {
			while (dom.firstChild) {
				out.appendChild(dom.firstChild);
			}
			if (dom.parentNode) dom.parentNode.replaceChild(out, dom);

			recollectNodeTree(dom, true);
		}
	}

	var fc = out.firstChild,
	    props = out['__preactattr_'],
	    vchildren = vnode.children;

	if (props == null) {
		props = out['__preactattr_'] = {};
		for (var a = out.attributes, i = a.length; i--;) {
			props[a[i].name] = a[i].value;
		}
	}

	if (!hydrating && vchildren && vchildren.length === 1 && typeof vchildren[0] === 'string' && fc != null && fc.splitText !== undefined && fc.nextSibling == null) {
		if (fc.nodeValue != vchildren[0]) {
			fc.nodeValue = vchildren[0];
		}
	} else if (vchildren && vchildren.length || fc != null) {
		innerDiffNode(out, vchildren, context, mountAll, hydrating || props.dangerouslySetInnerHTML != null);
	}

	diffAttributes(out, vnode.attributes, props);

	isSvgMode = prevSvgMode;

	return out;
}

function innerDiffNode(dom, vchildren, context, mountAll, isHydrating) {
	var originalChildren = dom.childNodes,
	    children = [],
	    keyed = {},
	    keyedLen = 0,
	    min = 0,
	    len = originalChildren.length,
	    childrenLen = 0,
	    vlen = vchildren ? vchildren.length : 0,
	    j,
	    c,
	    f,
	    vchild,
	    child;

	if (len !== 0) {
		for (var i = 0; i < len; i++) {
			var _child = originalChildren[i],
			    props = _child['__preactattr_'],
			    key = vlen && props ? _child._component ? _child._component.__key : props.key : null;
			if (key != null) {
				keyedLen++;
				keyed[key] = _child;
			} else if (props || (_child.splitText !== undefined ? isHydrating ? _child.nodeValue.trim() : true : isHydrating)) {
				children[childrenLen++] = _child;
			}
		}
	}

	if (vlen !== 0) {
		for (var i = 0; i < vlen; i++) {
			vchild = vchildren[i];
			child = null;

			var key = vchild.key;
			if (key != null) {
				if (keyedLen && keyed[key] !== undefined) {
					child = keyed[key];
					keyed[key] = undefined;
					keyedLen--;
				}
			} else if (min < childrenLen) {
				for (j = min; j < childrenLen; j++) {
					if (children[j] !== undefined && isSameNodeType(c = children[j], vchild, isHydrating)) {
						child = c;
						children[j] = undefined;
						if (j === childrenLen - 1) childrenLen--;
						if (j === min) min++;
						break;
					}
				}
			}

			child = idiff(child, vchild, context, mountAll);

			f = originalChildren[i];
			if (child && child !== dom && child !== f) {
				if (f == null) {
					dom.appendChild(child);
				} else if (child === f.nextSibling) {
					removeNode(f);
				} else {
					dom.insertBefore(child, f);
				}
			}
		}
	}

	if (keyedLen) {
		for (var i in keyed) {
			if (keyed[i] !== undefined) recollectNodeTree(keyed[i], false);
		}
	}

	while (min <= childrenLen) {
		if ((child = children[childrenLen--]) !== undefined) recollectNodeTree(child, false);
	}
}

function recollectNodeTree(node, unmountOnly) {
	var component = node._component;
	if (component) {
		unmountComponent(component);
	} else {
		if (node['__preactattr_'] != null) applyRef(node['__preactattr_'].ref, null);

		if (unmountOnly === false || node['__preactattr_'] == null) {
			removeNode(node);
		}

		removeChildren(node);
	}
}

function removeChildren(node) {
	node = node.lastChild;
	while (node) {
		var next = node.previousSibling;
		recollectNodeTree(node, true);
		node = next;
	}
}

function diffAttributes(dom, attrs, old) {
	var name;

	for (name in old) {
		if (!(attrs && attrs[name] != null) && old[name] != null) {
			setAccessor(dom, name, old[name], old[name] = undefined, isSvgMode);
		}
	}

	for (name in attrs) {
		if (name !== 'children' && name !== 'innerHTML' && (!(name in old) || attrs[name] !== (name === 'value' || name === 'checked' ? dom[name] : old[name]))) {
			setAccessor(dom, name, old[name], old[name] = attrs[name], isSvgMode);
		}
	}
}

var recyclerComponents = [];

function createComponent(Ctor, props, context) {
	var inst,
	    i = recyclerComponents.length;

	if (Ctor.prototype && Ctor.prototype.render) {
		inst = new Ctor(props, context);
		Component.call(inst, props, context);
	} else {
		inst = new Component(props, context);
		inst.constructor = Ctor;
		inst.render = doRender;
	}

	while (i--) {
		if (recyclerComponents[i].constructor === Ctor) {
			inst.nextBase = recyclerComponents[i].nextBase;
			recyclerComponents.splice(i, 1);
			return inst;
		}
	}

	return inst;
}

function doRender(props, state, context) {
	return this.constructor(props, context);
}

function setComponentProps(component, props, renderMode, context, mountAll) {
	if (component._disable) return;
	component._disable = true;

	component.__ref = props.ref;
	component.__key = props.key;
	delete props.ref;
	delete props.key;

	if (typeof component.constructor.getDerivedStateFromProps === 'undefined') {
		if (!component.base || mountAll) {
			if (component.componentWillMount) component.componentWillMount();
		} else if (component.componentWillReceiveProps) {
			component.componentWillReceiveProps(props, context);
		}
	}

	if (context && context !== component.context) {
		if (!component.prevContext) component.prevContext = component.context;
		component.context = context;
	}

	if (!component.prevProps) component.prevProps = component.props;
	component.props = props;

	component._disable = false;

	if (renderMode !== 0) {
		if (renderMode === 1 || options.syncComponentUpdates !== false || !component.base) {
			renderComponent(component, 1, mountAll);
		} else {
			enqueueRender(component);
		}
	}

	applyRef(component.__ref, component);
}

function renderComponent(component, renderMode, mountAll, isChild) {
	if (component._disable) return;

	var props = component.props,
	    state = component.state,
	    context = component.context,
	    previousProps = component.prevProps || props,
	    previousState = component.prevState || state,
	    previousContext = component.prevContext || context,
	    isUpdate = component.base,
	    nextBase = component.nextBase,
	    initialBase = isUpdate || nextBase,
	    initialChildComponent = component._component,
	    skip = false,
	    snapshot = previousContext,
	    rendered,
	    inst,
	    cbase;

	if (component.constructor.getDerivedStateFromProps) {
		state = extend(extend({}, state), component.constructor.getDerivedStateFromProps(props, state));
		component.state = state;
	}

	if (isUpdate) {
		component.props = previousProps;
		component.state = previousState;
		component.context = previousContext;
		if (renderMode !== 2 && component.shouldComponentUpdate && component.shouldComponentUpdate(props, state, context) === false) {
			skip = true;
		} else if (component.componentWillUpdate) {
			component.componentWillUpdate(props, state, context);
		}
		component.props = props;
		component.state = state;
		component.context = context;
	}

	component.prevProps = component.prevState = component.prevContext = component.nextBase = null;
	component._dirty = false;

	if (!skip) {
		rendered = component.render(props, state, context);

		if (component.getChildContext) {
			context = extend(extend({}, context), component.getChildContext());
		}

		if (isUpdate && component.getSnapshotBeforeUpdate) {
			snapshot = component.getSnapshotBeforeUpdate(previousProps, previousState);
		}

		var childComponent = rendered && rendered.nodeName,
		    toUnmount,
		    base;

		if (typeof childComponent === 'function') {

			var childProps = getNodeProps(rendered);
			inst = initialChildComponent;

			if (inst && inst.constructor === childComponent && childProps.key == inst.__key) {
				setComponentProps(inst, childProps, 1, context, false);
			} else {
				toUnmount = inst;

				component._component = inst = createComponent(childComponent, childProps, context);
				inst.nextBase = inst.nextBase || nextBase;
				inst._parentComponent = component;
				setComponentProps(inst, childProps, 0, context, false);
				renderComponent(inst, 1, mountAll, true);
			}

			base = inst.base;
		} else {
			cbase = initialBase;

			toUnmount = initialChildComponent;
			if (toUnmount) {
				cbase = component._component = null;
			}

			if (initialBase || renderMode === 1) {
				if (cbase) cbase._component = null;
				base = diff(cbase, rendered, context, mountAll || !isUpdate, initialBase && initialBase.parentNode, true);
			}
		}

		if (initialBase && base !== initialBase && inst !== initialChildComponent) {
			var baseParent = initialBase.parentNode;
			if (baseParent && base !== baseParent) {
				baseParent.replaceChild(base, initialBase);

				if (!toUnmount) {
					initialBase._component = null;
					recollectNodeTree(initialBase, false);
				}
			}
		}

		if (toUnmount) {
			unmountComponent(toUnmount);
		}

		component.base = base;
		if (base && !isChild) {
			var componentRef = component,
			    t = component;
			while (t = t._parentComponent) {
				(componentRef = t).base = base;
			}
			base._component = componentRef;
			base._componentConstructor = componentRef.constructor;
		}
	}

	if (!isUpdate || mountAll) {
		mounts.push(component);
	} else if (!skip) {

		if (component.componentDidUpdate) {
			component.componentDidUpdate(previousProps, previousState, snapshot);
		}
		if (options.afterUpdate) options.afterUpdate(component);
	}

	while (component._renderCallbacks.length) {
		component._renderCallbacks.pop().call(component);
	}if (!diffLevel && !isChild) flushMounts();
}

function buildComponentFromVNode(dom, vnode, context, mountAll) {
	var c = dom && dom._component,
	    originalComponent = c,
	    oldDom = dom,
	    isDirectOwner = c && dom._componentConstructor === vnode.nodeName,
	    isOwner = isDirectOwner,
	    props = getNodeProps(vnode);
	while (c && !isOwner && (c = c._parentComponent)) {
		isOwner = c.constructor === vnode.nodeName;
	}

	if (c && isOwner && (!mountAll || c._component)) {
		setComponentProps(c, props, 3, context, mountAll);
		dom = c.base;
	} else {
		if (originalComponent && !isDirectOwner) {
			unmountComponent(originalComponent);
			dom = oldDom = null;
		}

		c = createComponent(vnode.nodeName, props, context);
		if (dom && !c.nextBase) {
			c.nextBase = dom;

			oldDom = null;
		}
		setComponentProps(c, props, 1, context, mountAll);
		dom = c.base;

		if (oldDom && dom !== oldDom) {
			oldDom._component = null;
			recollectNodeTree(oldDom, false);
		}
	}

	return dom;
}

function unmountComponent(component) {
	if (options.beforeUnmount) options.beforeUnmount(component);

	var base = component.base;

	component._disable = true;

	if (component.componentWillUnmount) component.componentWillUnmount();

	component.base = null;

	var inner = component._component;
	if (inner) {
		unmountComponent(inner);
	} else if (base) {
		if (base['__preactattr_'] != null) applyRef(base['__preactattr_'].ref, null);

		component.nextBase = base;

		removeNode(base);
		recyclerComponents.push(component);

		removeChildren(base);
	}

	applyRef(component.__ref, null);
}

function Component(props, context) {
	this._dirty = true;

	this.context = context;

	this.props = props;

	this.state = this.state || {};

	this._renderCallbacks = [];
}

extend(Component.prototype, {
	setState: function setState(state, callback) {
		if (!this.prevState) this.prevState = this.state;
		this.state = extend(extend({}, this.state), typeof state === 'function' ? state(this.state, this.props) : state);
		if (callback) this._renderCallbacks.push(callback);
		enqueueRender(this);
	},
	forceUpdate: function forceUpdate(callback) {
		if (callback) this._renderCallbacks.push(callback);
		renderComponent(this, 2);
	},
	render: function render() {}
});

function render(vnode, parent, merge) {
	return diff(merge, vnode, {}, false, parent, false);
}

function createRef() {
	return {};
}

var preact = {
	h: h,
	createElement: h,
	cloneElement: cloneElement,
	createRef: createRef,
	Component: Component,
	render: render,
	rerender: rerender,
	options: options
};

var preact$1 = /*#__PURE__*/Object.freeze({
	default: preact,
	h: h,
	createElement: h,
	cloneElement: cloneElement,
	createRef: createRef,
	Component: Component,
	render: render,
	rerender: rerender,
	options: options
});

var containers = []; // will store container HTMLElement references
var styleElements = []; // will store {prepend: HTMLElement, append: HTMLElement}

var usage = 'insert-css: You need to provide a CSS string. Usage: insertCss(cssString[, options]).';

function insertCss(css, options) {
    options = options || {};

    if (css === undefined) {
        throw new Error(usage);
    }

    var position = options.prepend === true ? 'prepend' : 'append';
    var container = options.container !== undefined ? options.container : document.querySelector('head');
    var containerId = containers.indexOf(container);

    // first time we see this container, create the necessary entries
    if (containerId === -1) {
        containerId = containers.push(container) - 1;
        styleElements[containerId] = {};
    }

    // try to get the correponding container + position styleElement, create it otherwise
    var styleElement;

    if (styleElements[containerId] !== undefined && styleElements[containerId][position] !== undefined) {
        styleElement = styleElements[containerId][position];
    } else {
        styleElement = styleElements[containerId][position] = createStyleElement();

        if (position === 'prepend') {
            container.insertBefore(styleElement, container.childNodes[0]);
        } else {
            container.appendChild(styleElement);
        }
    }

    // strip potential UTF-8 BOM if css was read from a file
    if (css.charCodeAt(0) === 0xFEFF) {
        css = css.substr(1, css.length);
    }

    // actually add the stylesheet
    if (styleElement.styleSheet) {
        styleElement.styleSheet.cssText += css;
    } else {
        styleElement.textContent += css;
    }

    return styleElement;
}
function createStyleElement() {
    var styleElement = document.createElement('style');
    styleElement.setAttribute('type', 'text/css');
    return styleElement;
}

var insertCss_1 = insertCss;
var insertCss_2 = insertCss;
insertCss_1.insertCss = insertCss_2;

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

function getCjsExportFromNamespace (n) {
	return n && n.default || n;
}

var clone_1 = createCommonjsModule(function (module) {
  var clone = function () {

    /**
     * Clones (copies) an Object using deep copying.
     *
     * This function supports circular references by default, but if you are certain
     * there are no circular references in your object, you can save some CPU time
     * by calling clone(obj, false).
     *
     * Caution: if `circular` is false and `parent` contains circular references,
     * your program may enter an infinite loop and crash.
     *
     * @param `parent` - the object to be cloned
     * @param `circular` - set to true if the object to be cloned may contain
     *    circular references. (optional - true by default)
     * @param `depth` - set to a number if the object is only to be cloned to
     *    a particular depth. (optional - defaults to Infinity)
     * @param `prototype` - sets the prototype to be used when cloning an object.
     *    (optional - defaults to parent prototype).
    */

    function clone(parent, circular, depth, prototype) {
      var filter;
      if (typeof circular === 'object') {
        depth = circular.depth;
        prototype = circular.prototype;
        filter = circular.filter;
        circular = circular.circular;
      }
      // maintain two arrays for circular references, where corresponding parents
      // and children have the same index
      var allParents = [];
      var allChildren = [];

      var useBuffer = typeof Buffer != 'undefined';

      if (typeof circular == 'undefined') circular = true;

      if (typeof depth == 'undefined') depth = Infinity;

      // recurse this function so we don't reset allParents and allChildren
      function _clone(parent, depth) {
        // cloning null always returns null
        if (parent === null) return null;

        if (depth == 0) return parent;

        var child;
        var proto;
        if (typeof parent != 'object') {
          return parent;
        }

        if (clone.__isArray(parent)) {
          child = [];
        } else if (clone.__isRegExp(parent)) {
          child = new RegExp(parent.source, __getRegExpFlags(parent));
          if (parent.lastIndex) child.lastIndex = parent.lastIndex;
        } else if (clone.__isDate(parent)) {
          child = new Date(parent.getTime());
        } else if (useBuffer && Buffer.isBuffer(parent)) {
          if (Buffer.allocUnsafe) {
            // Node.js >= 4.5.0
            child = Buffer.allocUnsafe(parent.length);
          } else {
            // Older Node.js versions
            child = new Buffer(parent.length);
          }
          parent.copy(child);
          return child;
        } else {
          if (typeof prototype == 'undefined') {
            proto = Object.getPrototypeOf(parent);
            child = Object.create(proto);
          } else {
            child = Object.create(prototype);
            proto = prototype;
          }
        }

        if (circular) {
          var index = allParents.indexOf(parent);

          if (index != -1) {
            return allChildren[index];
          }
          allParents.push(parent);
          allChildren.push(child);
        }

        for (var i in parent) {
          var attrs;
          if (proto) {
            attrs = Object.getOwnPropertyDescriptor(proto, i);
          }

          if (attrs && attrs.set == null) {
            continue;
          }
          child[i] = _clone(parent[i], depth - 1);
        }

        return child;
      }

      return _clone(parent, depth);
    }

    /**
     * Simple flat clone using prototype, accepts only objects, usefull for property
     * override on FLAT configuration object (no nested props).
     *
     * USE WITH CAUTION! This may not behave as you wish if you do not know how this
     * works.
     */
    clone.clonePrototype = function clonePrototype(parent) {
      if (parent === null) return null;

      var c = function () {};
      c.prototype = parent;
      return new c();
    };

    // private utility functions

    function __objToStr(o) {
      return Object.prototype.toString.call(o);
    }    clone.__objToStr = __objToStr;

    function __isDate(o) {
      return typeof o === 'object' && __objToStr(o) === '[object Date]';
    }    clone.__isDate = __isDate;

    function __isArray(o) {
      return typeof o === 'object' && __objToStr(o) === '[object Array]';
    }    clone.__isArray = __isArray;

    function __isRegExp(o) {
      return typeof o === 'object' && __objToStr(o) === '[object RegExp]';
    }    clone.__isRegExp = __isRegExp;

    function __getRegExpFlags(re) {
      var flags = '';
      if (re.global) flags += 'g';
      if (re.ignoreCase) flags += 'i';
      if (re.multiline) flags += 'm';
      return flags;
    }    clone.__getRegExpFlags = __getRegExpFlags;

    return clone;
  }();

  if (module.exports) {
    module.exports = clone;
  }
});

var defaults = function (options, defaults) {
  options = options || {};

  Object.keys(defaults).forEach(function (key) {
    if (typeof options[key] === 'undefined') {
      options[key] = clone_1(defaults[key]);
    }
  });

  return options;
};

var preact$2 = getCjsExportFromNamespace(preact$1);

// From preact-classless-component: https://github.com/laurencedorman/preact-classless-component#readme
//
// The MIT License (MIT)
// 
// Copyright (c) 2016 Laurence Dorman
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.


var preactClasslessComponent = function (obj) {
  function preactComponent() {
    preact$2.Component.apply(this, arguments);

    for (var i in obj) {
      if (i !== 'render' && typeof obj[i] === 'function') {
        this[i] = obj[i].bind(this);
      }
    }

    if (obj.init) {
      obj.init.call(this);
    }
  }

  preactComponent.prototype = Object.assign(Object.create(preact$2.Component.prototype), obj);

  preactComponent.prototype.constructor = preactComponent;

  return preactComponent;
};

var toPx = function toPx(number) {
  number = '' + number;
  return (/^[0-9\.\s]*$/.test(number) ? number + 'px' : number
  );
};

var _default = {
  fontFamily: "'Helvetica', sans-serif",
  fontSize: 13,
  sliderHeight: 22,
  controlBgColor: '#444',
  fieldBgColor: '#333',
  fieldHoverColor: '#383838',
  fieldActiveColor: '#383838',
  fieldBorderColor: '#232323',
  fieldHeight: 30,
  sectionHeadingBgColor: '#222',
  sectionHeadingHoverColor: '#444',
  sectionHeadingColor: '#e8e8e8',
  sectionHeadingBorderColor: '#222',
  controlBorderColor: '#666',
  sliderThumbColor: '#888',
  fontColor: '#e8e8e8',
  sectionHeadingHeight: 24,
  minLabelWidth: 110,
  minControlWidth: 130,
  visibilityFontColor: 'rgba(0, 0, 0, 0.3)',
  focusBorderColor: '#888',
  controlBorderRadius: 2
};

var computeStyles = function (className, theme, components) {
  var theme = Object.assign({}, defaults(theme || {}, _default));

  theme.fontSize = toPx(theme.fontSize);
  theme.sliderHeight = toPx(theme.sliderHeight);
  theme.fieldHeight = toPx(theme.fieldHeight);
  theme.sectionHeadingHeight = toPx(theme.sectionHeadingHeight);
  theme.minLabelWidth = toPx(theme.minLabelWidth);
  theme.minControlWidth = toPx(theme.minControlWidth);
  theme.controlBorderRadius = toPx(theme.controlBorderRadius);
  theme.focusBorder = '\n    outline: none;\n    border-color: ' + theme.focusBorderColor + ';\n    box-shadow: 0 0 3px ' + theme.focusBorderColor + ';\n  ';

  return '\n    .' + className + ' {\n      color: ' + theme.fontColor + ';\n      ' + (theme.fontSize ? 'font-size: ' + theme.fontSize : '') + ';\n      ' + (theme.fontFamily ? 'font-family: ' + theme.fontFamily : '') + ';\n      max-width: 100%;\n    }\n\n    .' + className + '__field {\n      position: relative;\n      background-color: ' + theme.fieldBgColor + ';\n      border-right: 1px solid ' + theme.fieldBorderColor + ';\n    }\n\n    .' + className + '__label {\n      display: block;\n      height: ' + theme.fieldHeight + ';\n      line-height: ' + theme.fieldHeight + ';\n      display: flex;\n      flex-direction: row;\n      background-color: ' + theme.fieldBgColor + ';\n    }\n\n    .' + className + '__field:hover {\n      background-color: ' + theme.fieldHoverColor + ';\n    }\n\n    .' + className + '__container {\n      display: flex;\n      flex-direction: row;\n      align-content: stretch;\n      justify-content: stretch;\n    \n      height: ' + theme.fieldHeight + ';\n      flex: 1;\n      position: relative;\n      align-items: center;\n      position: relative;\n\n      min-width: ' + theme.minControlWidth + ';\n      width: ' + theme.fieldHeight + ';\n      padding-right: 8px;\n      text-indent: 8px;\n    }\n\n    .' + className + '__labelText {\n      user-select: none;\n      -moz-user-select: -moz-none;\n      text-indent: 8px;\n      margin-right: 4px;\n      display: inline-block;\n      min-width: ' + theme.minLabelWidth + ';\n      line-height: ' + theme.fieldHeight + ';\n    }\n\n    .' + className + '__field::before {\n      content: \'\';\n      width: 3px;\n      display: inline-block;\n      vertical-align: middle;\n      position: absolute;\n      top: 0;\n      left: 0;\n      bottom: 0;\n    }\n\n    .' + className + '__field--text::before { background-color: #49f; }\n    .' + className + '__field--color::before { background-color: #94f; }\n    .' + className + '__field--checkbox::before { background-color: #f49; }\n    .' + className + '__field--slider::before { background-color: #f84; }\n    .' + className + '__field--select::before { background-color: #8f4; }\n    .' + className + '__field--button > button::before { background-color: #8ff; }\n\n    ' + Object.keys(components).map(function (name) {
    var css = components[name].css;
    if (!css) return '';
    return css(className, theme);
  }).join('\n') + '\n  ';
};

var factory = function GuiFactory() {
  var components = {};

  GUI.registerComponent = function (component) {
    components[component.name] = component;
    return GUI;
  };

  GUI.registerComponents = function (components) {
    for (var i = 0; i < components.length; i++) {
      GUI.registerComponent(components[i]);
    }
    return GUI;
  };

  function getComponent(name) {
    var component = components[name];
    if (!component) throw new Error('Unrecognized component, "' + name + '"');
    return component;
  }

  function GUI(state, opts) {
    opts = defaults(opts || {}, {
      containerCSS: "position:fixed;top:0;right:8px",
      style: true,
      className: 'controlPanel-' + Math.random().toString(36).substring(2, 15),
      expanded: true
    });

    opts.root = opts.root || document.body;

    var className = opts.className;

    state.$field.$config.expanded = opts.expanded;

    var ControlComponent = preactClasslessComponent({
      render: function () {
        return preact$2.h(getComponent(this.props.field.type).component, {
          ControlComponent: ControlComponent,
          className: className,
          field: this.props.field,
          state: state,
          h: preact$2.h
        });
      }
    });

    var App = preactClasslessComponent({
      state: { dummy: 0 },
      componentDidMount: function () {
        var _this = this;

        this.props.state.$field.onChanges(function (updates) {
          _this.setState({ dummy: _this.state.dummy + 1 });
        });
      },
      getRef: function (c) {
        var eventList = ['mousedown', 'mouseup', 'mousemove', 'touchstart', 'touchmove', 'touchend', 'wheel'];
        for (var i = 0; i < eventList.length; i++) {
          c.addEventListener(eventList[i], function (e) {
            e.stopPropagation();
          });
        }

        if (opts.containerCSS) {
          c.style.cssText = opts.containerCSS;
        }
      },
      render: function () {
        return preact$2.h('div', {
          className: '' + className,
          ref: this.getRef
        }, preact$2.h(ControlComponent, { field: this.props.state.$field }));
      }
    });

    if (opts.style) {
      insertCss_1(computeStyles(className, opts.theme, components));
    }

    preact$2.render(preact$2.h(App, {
      state: state
    }), opts.root);

    return state;
  }

  return GUI;
};

var h$1 = preact$2.h;

var select = {
  name: 'select',
  component: preactClasslessComponent({
    render: function () {
      var _this = this;

      var field = this.props.field;
      var config = field.$config;
      var className = this.props.className;
      return h$1('div', {
        className: className + '__field ' + className + '__field--select'
      }, h$1('label', {
        className: className + '__label',
        htmlFor: className + '-' + field.path
      }, h$1('span', {
        className: className + '__labelText'
      }, config.label || field.name), ' ', h$1('span', { className: className + '__container' }, h$1('select', {
        name: field.path,
        id: className + '-' + field.path,
        onChange: function (event) {
          return _this.props.field.value = event.target.value;
        }
      }, field.options.map(function (option) {
        return h$1('option', {
          value: option,
          selected: option === field.value
        }, option);
      })))));
    }
  }),
  css: function (className, theme) {
    return '\n      .' + className + '__field--select select {\n        font-family: inherit;\n        font-size: inherit;\n        height: ' + theme.sliderHeight + ';\n        width: 100%;\n        color: inherit;\n        -webkit-appearance: none;\n        -moz-appearance: none;\n        appearance: none;\n        background-color: ' + theme.controlBgColor + ';\n        border: 1px solid ' + theme.controlBorderColor + ';\n        outline: none;\n        margin: 0;\n        padding: 0 5px;\n        border-radius: ' + theme.controlBorderRadius + ';\n        background-image: linear-gradient(' + theme.controlBorderColor + ', ' + theme.controlBorderColor + '),\n          linear-gradient(-130deg, transparent 50%, ' + theme.controlBgColor + ' 52%),\n          linear-gradient(-230deg, transparent 50%, ' + theme.controlBgColor + ' 52%),\n          linear-gradient(' + theme.fontColor + ' 42%, ' + theme.controlBgColor + ' 42%);\n        background-repeat: no-repeat, no-repeat, no-repeat, no-repeat;\n        background-size: 1px 100%, 20px 16px, 20px 16px, 20px 60%;\n        background-position: right 20px center, right bottom, right bottom, right bottom;\n      }\n\n      .' + className + '__field--select select:focus {\n        ' + theme.focusBorder + '\n      }\n    ';
  }
};

var getElementHeight = function getElementHeight(el) {
  var elStyle = window.getComputedStyle(el);
  var elDisplay = elStyle.display;
  var elPosition = elStyle.position;
  var elVisibility = elStyle.visibility;
  var elMaxHeight = elStyle.maxHeight;
  var elMaxHeightNumber = elMaxHeight.replace('px', '').replace('%', '');
  var computedHeight = 0;

  if (elDisplay !== 'none' && elMaxHeightNumber !== '0') {
    return el.offsetHeight;
  }

  el.style.maxHeight = '';
  el.style.position = 'absolute';
  el.style.visibility = 'hidden';
  el.style.display = 'block';

  computedHeight = el.offsetHeight;

  el.style.maxHeight = elMaxHeight;
  el.style.display = elDisplay;
  el.style.position = elPosition;
  el.style.visibility = elVisibility;

  return computedHeight;
};

var toggleSlide = function toggleSlide(el, callback) {
  var elMaxHeightNumber = el.style.maxHeight.replace('px', '').replace('%', '');

  if (elMaxHeightNumber === '0') {
    var maxComputedHeight = getElementHeight(el) + 'px';

    el.style.transition = 'max-height 0.1s ease-in-out';
    el.style.overflowY = 'hidden';
    el.style.maxHeight = '0';
    el.style.display = 'block';

    var restore = function () {
      el.style.transition = 'none';
      el.style.overflowY = 'visible';
      el.style.maxHeight = '';
      el.removeEventListener('transitionend', restore);
      callback && callback();
    };

    el.addEventListener('transitionend', restore);

    setTimeout(function () {
      el.style.maxHeight = maxComputedHeight;
    }, 20);
  } else {
    var maxComputedHeight = getElementHeight(el) + 'px';

    el.style.transition = 'max-height 0.1s ease-in-out';
    el.style.overflowY = 'hidden';
    el.style.maxHeight = maxComputedHeight;
    el.style.display = 'block';

    var restore = function () {
      el.style.transition = 'none';
      el.removeEventListener('transitionend', restore);
      callback && callback();
    };
    el.addEventListener('transitionend', restore);

    setTimeout(function () {
      el.style.maxHeight = '0';
    }, 20);
  }
};

var h$2 = preact$2.h;

var section = {
  name: 'section',
  component: preactClasslessComponent({
    init: function () {
      var expanded = this.props.field.$config.expanded;
      expanded = expanded === undefined ? true : !!expanded;
      this.state = {
        expanded: expanded
      };
    },
    toggleCollapsed: function (event) {
      event.stopPropagation();

      toggleSlide(this.contentsEl);

      this.setState({ expanded: !this.state.expanded });
    },
    getRef: function (ref) {
      this.contentsEl = ref;
      if (this.state.expanded === false) {
        toggleSlide(this.contentsEl);
      }
    },
    render: function () {
      var _this = this;

      var field = this.props.field;
      var config = field.$config;
      var title = config.label || field.name;
      var className = this.props.className;
      if (!field.parentField && title === '') title = 'Controls';
      return h$2('fieldset', {
        className: className + '__section ' + (this.state.expanded ? className + '__section--expanded' : '')
      }, h$2('legend', {
        className: className + '__sectionHeading'
      }, h$2('button', { onClick: this.toggleCollapsed }, title)), h$2('div', {
        ref: this.getRef,
        className: className + '__sectionFields'
      }, Object.keys(field.value.$displayFields).map(function (key) {
        return h$2(_this.props.ControlComponent, {
          field: field.value.$path[key].$field
        });
      })));
    }
  }),
  css: function (className, theme) {
    return '\n      .' + className + '__section {\n        margin: 0;\n        margin-top: -1px;\n        padding: 0;\n        border: none;\n      }\n\n      .' + className + '__sectionHeading {\n        border: 1px solid ' + theme.sectionHeadingBorderColor + ';\n        position: relative;\n        z-index: 1;\n        box-sizing: border-box;\n      }\n\n      .' + className + '__sectionFields {\n        margin-left: 4px;\n        box-sizing: border-box;\n      }\n\n      .' + className + '__sectionFields .' + className + '__field {\n        border-bottom: 1px solid ' + theme.fieldBorderColor + ';\n        box-sizing: border-box;\n      }\n\n      .' + className + '__sectionFields .' + className + '__sectionFields {\n        border-right: none;\n        margin-right: 0;\n      }\n\n      .' + className + ' > .' + className + '__section:first-child > .' + className + '__sectionHeading:first-child {\n        border-right: 1px solid ' + theme.sectionHeadingBorderColor + ';\n      }\n\n      .' + className + '__sectionHeading {\n        padding: 0;\n        font-family: inherit;\n        user-select: none;\n        -moz-user-select: -moz-none;\n        text-indent: 5px;\n        cursor: pointer;\n        width: 100%;\n\n        color: ' + theme.sectionHeadingColor + ';\n        background-color: ' + theme.sectionHeadingBgColor + ';\n        height: ' + theme.sectionHeadingHeight + ';\n        line-height: ' + theme.sectionHeadingHeight + ';\n      }\n\n      .' + className + '__sectionHeading button:focus {\n        background-color: ' + theme.sectionHeadingHoverColor + ';\n      }\n\n      .' + className + '__sectionHeading > button {\n        height: 100%;\n        vertical-align: middle;\n        font-size: 1.0em;\n        cursor: pointer;\n        text-align: left;\n        outline: none;\n        color: inherit;\n        font-size: inherit;\n        font-family: inherit;\n        background: transparent;\n        border: none;\n        border-radius: 0;\n        display: block;\n        width: 100%;\n      }\n\n      .' + className + '__sectionHeading:hover {\n        background-color: ' + theme.sectionHeadingHoverColor + ';\n      }\n\n      .' + className + '__sectionHeading > button::before {\n        transform: translate(0, -1px) rotate(90deg);\n      }\n\n      .' + className + '__sectionHeading > button::before {\n        content: \'\u25B2\';\n        display: inline-block;\n        transform-origin: 50% 50%;\n        margin-right: 0.5em;\n        font-size: 0.5em;\n        vertical-align: middle;\n      }\n\n      .' + className + '__section--expanded > .' + className + '__sectionHeading > button::before {\n        transform: none;\n        content: \'\u25BC\';\n      }\n    ';
  }
};

var h$3 = preact$2.h;

var slider = {
  name: 'slider',
  component: preactClasslessComponent({
    render: function () {
      var _this = this;

      var field = this.props.field;
      var config = field.$config;
      var className = this.props.className;
      return h$3('div', {
        className: className + '__field ' + className + '__field--slider'
      }, h$3('label', {
        className: className + '__label',
        htmlFor: className + '-' + field.path
      }, h$3('span', {
        className: className + '__labelText'
      }, config.label || field.name), ' ', h$3('span', { className: className + '__container' }, h$3('input', {
        id: className + '-' + field.path,
        name: field.path,
        type: 'range',
        min: this.props.field.inverseMapping(field.min),
        max: this.props.field.inverseMapping(field.max),
        step: (this.props.field.inverseMapping(this.props.field.max) - this.props.field.inverseMapping(this.props.field.min)) / this.props.field.steps,
        value: this.props.field.inverseMapping(field.value),
        onInput: function (event) {
          return _this.props.field.value = parseFloat(_this.props.field.mapping(event.target.value));
        }
      }), h$3('span', { className: className + '__sliderValue' }, field.value.toFixed(4).replace(/\.?0*$/, '')))));
    }
  }),
  css: function sliderCSS(className, theme) {
    return '\n      .' + className + '__field--slider input[type=range] {\n        width: 100%;\n        height: ' + theme.sliderHeight + ';\n        -webkit-appearance: none;\n        vertical-align: middle;\n        border-radius: ' + theme.controlBorderRadius + ';\n        margin: 0;\n        cursor: resize-ew;\n        border: 1px solid ' + theme.controlBorderColor + ';\n      }\n\n      .' + className + '__field--slider input[type=range]:focus {\n        ' + theme.focusBorder + '\n      }\n\n      .' + className + '__field--slider input[type=range]::-webkit-slider-thumb {\n        height: ' + theme.sliderHeight + ';\n        width: ' + theme.sliderHeight + ';\n        background: ' + theme.sliderThumbColor + ';\n        border-radius: 0;\n        cursor: ew-resize;\n        -webkit-appearance: none;\n      }\n\n      .' + className + '__field--slider input[type=range]::-moz-range-thumb {\n        height: ' + theme.sliderHeight + ';\n        width: ' + theme.sliderHeight + ';\n        border-radius: 0;\n        background: ' + theme.sliderThumbColor + ';\n        cursor: ew-resize;\n      }\n\n      .' + className + '__field--slider input[type=range]::-ms-thumb {\n        height: ' + theme.sliderHeight + ';\n        width: ' + theme.sliderHeight + ';\n        border-radius: 0;\n        background: ' + theme.sliderThumbColor + ';\n        cursor: ew-resize;\n      }\n\n      .' + className + '__field--slider input[type=range]::-webkit-slider-runnable-track {\n        height: ' + theme.sliderHeight + ';\n        cursor: ew-resize;\n        background: ' + theme.controlBgColor + ';\n      }\n\n      .' + className + '__field--slider input[type=range]::-moz-range-track {\n        height: ' + theme.sliderHeight + ';\n        cursor: ew-resize;\n        background: ' + theme.controlBgColor + ';\n      }\n\n      .' + className + '__field--slider input[type=range]::-ms-track {\n        height: ' + theme.sliderHeight + ';\n        cursor: ew-resize;\n        background: transparent;\n        border-color: transparent;\n        color: transparent;\n      }\n\n      .' + className + '__field--slider input[type=range]::-ms-fill-lower {\n        background: ' + theme.controlBgColor + ';\n      }\n\n      .' + className + '__field--slider input[type=range]::-ms-fill-upper {\n        background: ' + theme.controlBgColor + ';\n      }\n\n      .' + className + '__field--slider input[type=range]:focus::-ms-fill-lower {\n        background: ' + theme.controlBgColor + ';\n        ' + theme.focusBorder + '\n      }\n\n      .' + className + '__field--slider input[type=range]:focus::-ms-fill-upper {\n        background: ' + theme.controlBgColor + ';\n        ' + theme.focusBorder + '\n      }\n\n      .' + className + '__sliderValue {\n        position: absolute;\n        pointer-events: none;\n        top: 0;\n        z-index: 11;\n        line-height: ' + theme.fieldHeight + ';\n        height: ' + theme.fieldHeight + ';\n        display: inline-block;\n        right: 15px;\n        text-shadow:  1px  0   ' + theme.visibilityFontColor + ',\n                      0    1px ' + theme.visibilityFontColor + ',\n                     -1px  0   ' + theme.visibilityFontColor + ',\n                      0   -1px ' + theme.visibilityFontColor + ',\n                      1px  1px ' + theme.visibilityFontColor + ',\n                      1px -1px ' + theme.visibilityFontColor + ',\n                     -1px  1px ' + theme.visibilityFontColor + ',\n                     -1px -1px ' + theme.visibilityFontColor + ';\n      }\n    ';
  }
};

var h$4 = preact$2.h;

var checkbox = {
  name: 'checkbox',
  component: preactClasslessComponent({
    render: function () {
      var _this = this;

      var field = this.props.field;
      var config = field.$config;
      var className = this.props.className;
      return h$4('div', {
        className: className + '__field ' + className + '__field--checkbox'
      }, h$4('label', {
        className: className + '__label',
        htmlFor: className + '-' + field.path
      }, h$4('span', {
        className: className + '__labelText'
      }, config.label || field.name), ' ', h$4('span', { className: className + '__container' }, h$4('input', {
        id: className + '-' + field.path,
        name: field.path,
        type: 'checkbox',
        checked: field.value,
        onInput: function (event) {
          return _this.props.field.value = event.target.checked;
        }
      }))));
    }
  }),
  css: function checkboxCSS(className, theme) {
    return '\n      .' + className + '__field--checkbox input[type=checkbox] {\n        height: 20px;\n        width: 20px;\n        margin-bottom: 0.2em;\n      }\n\n      .' + className + '__field--checkbox input[type=checkbox]:focus {\n        ' + theme.focusBorder + '\n      }\n    ';
  }
};

var h$5 = preact$2.h;

var textinput = {
  name: 'textinput',
  component: preactClasslessComponent({
    render: function () {
      var _this = this;

      var field = this.props.field;
      var config = field.$config;
      var className = this.props.className;
      return h$5('div', {
        className: className + '__field ' + className + '__field--text'
      }, h$5('label', {
        className: className + '__label',
        htmlFor: className + '-' + field.path
      }, h$5('span', {
        className: className + '__labelText'
      }, config.label || field.name), ' ', h$5('span', { className: className + '__container' }, h$5('input', {
        id: className + '-' + field.path,
        name: field.path,
        type: 'text',
        value: field.value,
        onInput: function (event) {
          return _this.props.field.value = event.target.value;
        }
      }))));
    }
  }),
  css: function (className, theme) {
    return '\n      .' + className + '__field--text input[type=text] {\n        font-size: inherit;\n        font-family: inherit;\n        width: 100%;\n        margin: 0;\n        padding: 0 5px;\n        border: none;\n        height: ' + theme.sliderHeight + ';\n        border-radius: ' + theme.controlBorderRadius + ';\n        background-color: ' + theme.controlBgColor + ';\n        border: 1px solid ' + theme.controlBorderColor + ';\n        color: inherit;\n      }\n\n      .' + className + '__field--text input[type=text]:focus {\n        ' + theme.focusBorder + '\n      }\n    ';
  }
};

var h$6 = preact$2.h;

var button = {
  name: 'button',
  component: preactClasslessComponent({
    render: function () {
      var field = this.props.field;
      var config = field.$config;
      var className = this.props.className;
      return h$6('div', {
        className: className + '__field ' + className + '__field--button'
      }, h$6('button', {
        onClick: field.value
      }, config.label || field.name));
    }
  }),
  css: function (className, theme) {
    return '\n      .' + className + '__field--button button {\n        height: ' + theme.fieldHeight + ';\n        font-size: inherit;\n        font-family: inherit;\n        outline: none;\n        cursor: pointer;\n        text-align: center;\n        display: block;\n        background: transparent;\n        color: inherit;\n        font-size: 1.0em;\n        width: 100%;\n        border: none;\n        border-radius: 0;\n      }\n\n      .' + className + '__field--button > button:hover {\n        background-color: ' + theme.fieldHoverColor + ';\n      }\n\n      .' + className + '__field--button > button:active {\n        background-color: ' + theme.fieldActiveColor + ';\n      }\n\n      .' + className + '__field--button > button:focus {\n        ' + theme.focusBorder + '\n      }\n\n      .' + className + '__field--button > button::before {\n        content: \'\';\n        width: 3px;\n        display: inline-block;\n        vertical-align: middle;\n        position: absolute;\n        top: 0;\n        left: 0;\n        bottom: 0;\n      }\n    ';
  }
};

var h$7 = preact$2.h;

var color = {
  name: 'color',
  component: preactClasslessComponent({
    render: function () {
      var _this = this;

      var field = this.props.field;
      var config = field.$config;
      var className = this.props.className;
      return h$7('div', {
        className: className + '__field ' + className + '__field--color'
      }, h$7('label', {
        className: className + '__label',
        htmlFor: className + '-' + field.path
      }, h$7('span', {
        className: className + '__labelText'
      }, config.label || field.name), ' ', h$7('span', { className: className + '__container' }, h$7('input', {
        id: className + '-' + field.path,
        name: field.path,
        type: 'color',
        value: field.value,
        onInput: function (event) {
          _this.props.field.value = event.target.value;
        }
      }))));
    }
  }),
  css: function (className, theme) {
    return '\n      .' + className + '__field--color input[type=color] {\n        margin: 0;\n        border: 1px solid #aaa;\n        width: 50px;\n        height: ' + theme.sliderHeight + ';\n        border-radius: ' + theme.controlBorderRadius + ';\n        padding: 0;\n      }\n\n      .' + className + '__field--color input[type=color]::-webkit-color-swatch-wrapper {\n        padding: 0px;\n        background-color: #888;\n      }\n\n      .' + className + '__field--color input[type=color]:focus {\n        ' + theme.focusBorder + '\n      }\n    ';
  }
};

var h$8 = preact$2.h;

var raw = {
  name: 'raw',
  component: preactClasslessComponent({
    getRef: function (el) {
      this.el = el;
    },

    getContent: function (props) {
      this.content = props.field.value;
      if (typeof this.content === 'function') {
        this.content = this.content(h$8, {
          field: props.field,
          state: props.state
        });
      }
      return this.content;
    },

    render: function () {
      var className = this.props.className;
      return h$8('div', {
        className: className + '__field--raw ' + className + '__field'
      }, h$8('div', {
        ref: this.getRef,
        className: className + '__rawContent'
      }, this.getContent(this.props)));
    }
  }),
  css: function (className, theme) {
    return '\n      .' + className + '__field--raw {\n        height: auto;\n        padding: 0 7px 0 10px;\n        overflow: hidden;\n      }\n\n      .' + className + '__rawContent {\n        max-width: 100%;\n        margin: 0;\n        padding: 0;\n      }\n\n      .' + className + '__rawContent a {\n        color: inherit;\n      }\n\n      .' + className + '__rawContent::before {\n        background-color: #aaa;\n      }\n\n      .' + className + '__rawContent::before {\n        content: \'\';\n        width: 3px;\n        display: inline-block;\n        vertical-align: middle;\n        position: absolute;\n        top: 0;\n        left: 0;\n        bottom: 0;\n      }\n\n      .' + className + '__rawContent > p:first-child {\n        margin-top: 5px;\n      }\n\n      .' + className + '__rawContent > p:last-child{\n        margin-bottom: 5px;\n      }\n\n      .' + className + '__rawContent p {\n        line-height: 1.8;\n      }\n\n      .' + className + '__rawContent pre {\n        line-height: 1.3;\n        font-size: 0.8em;\n        margin: 0;\n      }\n    ';
  }
};

var gui = factory();

gui.registerComponents([select, section, slider, checkbox, textinput, button, color, raw]);

var controlsGui = gui;

export default controlsGui;
