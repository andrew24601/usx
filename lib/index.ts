const matchPx = /^(left|top|right|bottom|width|height|(margin|padding|border)(Left|Top|Right|Bottom)?(Width)?|border(Top|Bottom)?(Left|Right)?Radius|(min|max)Width|flexBasis|fontSize)$/;
type USXFunctionFactory<T extends object> = (props: T) => USXChildren;
type USXClassFactory<T> = { new(props: T): USXComponent<T> };
type USXChildItem = string | number | Element | USXComponent<any> | null;
type USXChildren = USXChildItem | USXChildItem[];
type USXEventCallback = () => void;

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

export abstract class USXComponent<T> {
    _render?: USXChildren;

    constructor(readonly props: T) { }

    abstract render(props: T): USXChildren;
}

let defaultUIProps: any = {};
const bindings = new Map<Element, USXBinding>();

class USXBinding {
    updaters: USXEventCallback[] = [];
    onRemovers: USXEventCallback[] = [];
}

function append(el: Node, child: USXChildren) {
    if (child == null)
        return;
    if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
    } else if (typeof child === 'number') {
        el.appendChild(document.createTextNode(child + ""));
    } else if (child instanceof Array) {
        for (const item of child) {
            append(el, item);
        }
    } else if (child instanceof USXComponent) {
        append(el, child._render);
    } else
        el.appendChild(child);
}

function setAttribute(el: any, name: string, value: any) {
    if (/^(textContent|innerHTML|value|checked|disabled|hidden)$/.test(name))
        el[name] = value;
    else {
        if (value != null)
            el.setAttribute(name, value);
        else
            el.removeAttribute(name);
    }
}

function setStyle(el: any, value: any) {
    for (const k in value) {
        const applyValue = (v: any) => {
            if (typeof v === "number" && matchPx.test(k))
                el.style[k] = v + "px";
            else if (v == null)
                el.style[k] = "";
            else
                el.style[k] = v;
        }

        const v = value[k];

        if (typeof v === "function") {
            applyUI(el, applyValue, v)
        } else {
            applyValue(v);
        }
    }
}

export function jsx<T extends object>(factory: string | USXFunctionFactory<T> | USXClassFactory<T>, props?: T | null): USXChildren {
    const combinedProps: any = { ...defaultUIProps, ...props };
    const children: USXChildren = combinedProps["children"];

    if (typeof factory !== 'string') {
        if (factory.prototype instanceof USXComponent) {
            const component = new (factory as USXClassFactory<any>)(combinedProps);
            component._render = component.render(combinedProps);
            return component;
        } else
            return (factory as USXFunctionFactory<T>)(combinedProps);
    }
    const el = /^(svg|circle|defs|filter|g|line|linearGradient|marker|path|pattern|polygon|polyline|radialGradient|rect|stop|switch|text|fe[A-Z][A-Za-z]+)$/.test(factory) ? document.createElementNS(SVG_NAMESPACE, factory) : document.createElement(factory);
    for (const k in combinedProps) {
        if (k === "children")
            continue;
        const v = combinedProps[k];
        if (typeof v === "function") {
            if (/^on[A-Z]/.test(k)) {
                el.addEventListener(k.substring(2).toLowerCase(), function () {
                    try {
                        v.apply(null, arguments);
                    } finally {
                        updateUI();
                    }
                });
            } else {
                applyUI(el, value => setAttribute(el, k, value), v);
            }
        } else if (k === "style" && typeof v === "object") {
            setStyle(el, v);
        } else {
            setAttribute(el, k, v);
        }
    }
    if (children != null)
        append(el, children);
    return el;
}

export function Fragment(props: any) {
    const frag = new DocumentFragment();
    const children = props["children"];
    if (children != null)
        append(frag, children);
    return frag;
}

export function withDefaultUIProps<T>(props: object, callback: () => T) {
    const savedProps = defaultUIProps;
    try {
        defaultUIProps = { ...defaultUIProps, ...props };
        return callback();
    } finally {
        defaultUIProps = savedProps;
    }
}

function getOrCreateBinding(el: Element) {
    let bind = bindings.get(el);
    if (bind === undefined) {
        bind = new USXBinding();
        bindings.set(el, bind);
    }
    return bind;
}

export function applyUI(el: Element, fn: (...args: any[]) => void, ...args: any[]) {
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

export function onRemoveUI(el: Element, fn: USXEventCallback) {
    let bind = getOrCreateBinding(el);
    bind.onRemovers.push(fn);
}

function unbind(el: Element) {
    const bind = bindings.get(el);
    if (bind !== undefined) {
        bindings.delete(el);
        bind.onRemovers.forEach(fn => fn());
    }
    for (let child = el.firstElementChild; child; child = child.nextElementSibling) {
        unbind(child);
    }
}

export function removeUI(...elements: Element[]) {
    for (const el of elements) {
        if (el.parentNode) {
            el.parentNode.removeChild(el);
        }
        unbind(el);
    }
}

export function getDefaultUIProps() {
    return defaultUIProps;
}

let inUpdate = false;
export function updateUI() {
    if (inUpdate) {
        // ignore reentrant update
        return;
    }
    inUpdate = true;
    try {
        bindings.forEach(binding => {
            binding.updaters.forEach(v => v());
        })
    } finally {
        inUpdate = false;
    }
}

export function resetUIBindings() {
    bindings.forEach(binding => {
        binding.onRemovers.forEach(v => v());
    })
    bindings.clear;
}
