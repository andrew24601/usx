const matchPx = /^(left|top|right|bottom|width|height|(margin|padding|border)(Left|Top|Right|Bottom)?(Width)?|border(Top|Bottom)?(Left|Right)?Radius|(min|max)Width|flexBasis|fontSize)$/;
const svgns = "http://www.w3.org/2000/svg";
export class USXComponent {
    constructor(props) {
        this.props = props;
    }
}
function createContext() {
    let defaultProps = {};
    const bindings = new Map();
    class USXBinding {
        constructor() {
            this.updaters = [];
            this.onRemovers = [];
        }
    }
    function append(el, child) {
        if (child == null)
            return;
        if (typeof child === 'string') {
            el.appendChild(document.createTextNode(child));
        }
        else if (typeof child === 'number') {
            el.appendChild(document.createTextNode(child + ""));
        }
        else if (child instanceof Array) {
            for (const item of child) {
                append(el, item);
            }
        }
        else if (child instanceof USXComponent) {
            append(el, child._render);
        }
        else
            el.appendChild(child);
    }
    function setAttribute(el, name, value) {
        if (/^(textContent|innerHTML|value|checked)$/.test(name))
            el[name] = value;
        else if (name === "__source")
            el.setAttribute("__source", value.fileName + ":" + value.lineNumber);
        else {
            if (value != null)
                el.setAttribute(name, value);
            else
                el.removeAttribute(name);
        }
    }
    function setStyle(el, value) {
        for (const k in value) {
            const applyValue = (v) => {
                if (typeof v === "number" && matchPx.test(k))
                    el.style[k] = v + "px";
                else if (v == null)
                    el.style[k] = "";
                else
                    el.style[k] = v;
            };
            const v = value[k];
            if (typeof v === "function") {
                apply(el, applyValue, v);
            }
            else {
                applyValue(v);
            }
        }
    }
    function el(factory, props, ...children) {
        const combinedProps = Object.assign(Object.assign({}, defaultProps), props);
        if (typeof factory !== 'string') {
            if (factory.prototype instanceof USXComponent) {
                const component = new factory(combinedProps);
                component._render = component.render(combinedProps, children);
                return component;
            }
            else
                return factory(combinedProps, children);
        }
        const el = /^(svg|circle|defs|filter|g|line|linearGradient|marker|path|pattern|polygon|polyline|radialGradient|rect|stop|switch|text|fe[A-Z][A-Za-z]+)$/.test(factory) ? document.createElementNS(svgns, factory) : document.createElement(factory);
        for (const k in combinedProps) {
            const v = combinedProps[k];
            if (typeof v === "function") {
                if (/^on[A-Z]/.test(k)) {
                    el.addEventListener(k.substring(2).toLowerCase(), function () {
                        try {
                            v.apply(null, arguments);
                        }
                        finally {
                            update();
                        }
                    });
                }
                else {
                    apply(el, value => setAttribute(el, k, value), v);
                }
            }
            else if (k === "style" && typeof v === "object") {
                setStyle(el, v);
            }
            else {
                setAttribute(el, k, v);
            }
        }
        for (const c of children) {
            append(el, c);
        }
        return el;
    }
    function withDefaultProps(props, callback) {
        const savedProps = defaultProps;
        try {
            defaultProps = Object.assign(Object.assign({}, defaultProps), props);
            return callback();
        }
        finally {
            defaultProps = savedProps;
        }
    }
    function getOrCreateBinding(el) {
        let bind = bindings.get(el);
        if (bind === undefined) {
            bind = new USXBinding();
            bindings.set(el, bind);
        }
        return bind;
    }
    function apply(el, fn, ...args) {
        const applyArgs = args.map(a => typeof a === "function" ? a() : a);
        fn.apply(null, applyArgs);
        let bind = getOrCreateBinding(el);
        bind.updaters.push(() => {
            let changed = false;
            if (args.length > 0) {
                const newArgs = args.map(a => typeof a === "function" ? a() : a);
                for (let idx = 0; idx < args.length; idx++) {
                    if (applyArgs[idx] !== newArgs[idx]) {
                        changed = true;
                        applyArgs[idx] = newArgs[idx];
                    }
                }
            }
            if (changed || args.length == 0) {
                fn.apply(null, applyArgs);
            }
        });
    }
    function onRemove(el, fn) {
        let bind = getOrCreateBinding(el);
        bind.onRemovers.push(fn);
    }
    function unbind(el) {
        const bind = bindings.get(el);
        if (bind !== undefined) {
            bindings.delete(el);
            bind.onRemovers.forEach(fn => fn());
        }
        for (let child = el.firstElementChild; child; child = child.nextElementSibling) {
            unbind(child);
        }
    }
    function remove(...elements) {
        for (const el of elements) {
            if (el.parentNode) {
                el.parentNode.removeChild(el);
            }
            unbind(el);
        }
    }
    function getDefaultProps() {
        return defaultProps;
    }
    let inUpdate = false;
    function update() {
        if (inUpdate) {
            // ignore reentrant update
            return;
        }
        inUpdate = true;
        try {
            bindings.forEach(binding => {
                binding.updaters.forEach(v => v());
            });
        }
        finally {
            inUpdate = false;
        }
    }
    function clear() {
        bindings.forEach(binding => {
            binding.onRemovers.forEach(v => v());
        });
        bindings.clear;
    }
    return {
        el,
        withDefaultProps,
        getDefaultProps,
        apply,
        update,
        remove,
        onRemove,
        createContext,
        clear
    };
}
export const usx = createContext();
