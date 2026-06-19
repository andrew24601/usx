const pixelStyleProperties = new Set([
    "left", "top", "right", "bottom", "inset", "insetBlock", "insetBlockStart", "insetBlockEnd",
    "insetInline", "insetInlineStart", "insetInlineEnd",
    "width", "height", "minWidth", "maxWidth", "minHeight", "maxHeight",
    "blockSize", "inlineSize", "minBlockSize", "maxBlockSize", "minInlineSize", "maxInlineSize",
    "margin", "marginLeft", "marginTop", "marginRight", "marginBottom",
    "marginBlock", "marginBlockStart", "marginBlockEnd", "marginInline", "marginInlineStart", "marginInlineEnd",
    "padding", "paddingLeft", "paddingTop", "paddingRight", "paddingBottom",
    "paddingBlock", "paddingBlockStart", "paddingBlockEnd", "paddingInline", "paddingInlineStart", "paddingInlineEnd",
    "borderWidth", "borderLeftWidth", "borderTopWidth", "borderRightWidth", "borderBottomWidth",
    "borderBlockWidth", "borderBlockStartWidth", "borderBlockEndWidth",
    "borderInlineWidth", "borderInlineStartWidth", "borderInlineEndWidth",
    "borderRadius", "borderTopLeftRadius", "borderTopRightRadius", "borderBottomLeftRadius", "borderBottomRightRadius",
    "borderStartStartRadius", "borderStartEndRadius", "borderEndStartRadius", "borderEndEndRadius",
    "borderSpacing", "outlineOffset", "outlineWidth",
    "gap", "rowGap", "columnGap", "columnWidth",
    "flexBasis", "fontSize", "letterSpacing", "wordSpacing", "textIndent", "verticalAlign",
    "perspective", "scrollMargin", "scrollMarginBlock", "scrollMarginBlockStart", "scrollMarginBlockEnd",
    "scrollMarginInline", "scrollMarginInlineStart", "scrollMarginInlineEnd",
    "scrollPadding", "scrollPaddingBlock", "scrollPaddingBlockStart", "scrollPaddingBlockEnd",
    "scrollPaddingInline", "scrollPaddingInlineStart", "scrollPaddingInlineEnd", "shapeMargin"
]);
type USXFunctionFactory<T extends object> = (props: T) => USXChildren;
type USXClassFactory<T extends object> = { new(props: T): USXComponent<T> };
type USXChildItem = string | number | boolean | Node | USXComponent<any> | null | undefined;
type USXChildren = USXChildItem | USXChildren[];
type USXEventCallback = () => void;

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const svgTags = new Set([
    "svg", "animate", "animateMotion", "animateTransform", "circle", "clipPath", "defs", "desc",
    "discard", "ellipse", "filter", "foreignObject", "g", "image", "line", "linearGradient", "marker",
    "mask", "metadata", "mpath", "path", "pattern", "polygon", "polyline", "radialGradient", "rect",
    "set", "stop", "switch", "symbol", "text", "textPath", "tspan", "use", "view"
]);

const directProperties = new Set(["textContent", "innerHTML", "value"]);
const booleanProperties = new Set([
    "allowFullscreen", "autofocus", "autoplay", "checked", "controls", "default", "disabled",
    "formNoValidate", "hidden", "indeterminate", "inert", "loop", "multiple", "muted", "noModule",
    "noValidate", "open", "playsInline", "readOnly", "required", "reversed", "selected"
]);

export abstract class USXComponent<T> {
    _rendered?: USXChildren;
    readonly props: T;

    constructor(props: T) {
        this.props = props;
    }

    abstract render(props: T): USXChildren;
}

const bindings = new Map<Element, USXBinding>();

class USXBinding {
    updateCallbacks: USXEventCallback[] = [];
    removeCallbacks: USXEventCallback[] = [];
}

function append(el: Node, child: USXChildren | undefined) {
    if (child == null || typeof child === "boolean")
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
        append(el, child._rendered);
    } else
        el.appendChild(child);
}

function setAttribute(el: any, name: string, value: any) {
    if (booleanProperties.has(name))
        el[name] = Boolean(value);
    else if (directProperties.has(name))
        el[name] = value;
    else {
        if (value != null)
            el.setAttribute(name, value);
        else
            el.removeAttribute(name);
    }
}

function setStyleValue(el: any, name: string, value: any) {
    if (typeof value === "number" && pixelStyleProperties.has(name))
        el.style[name] = value + "px";
    else if (value == null)
        el.style[name] = "";
    else
        el.style[name] = value;
}

function setStyle(el: any, value: any) {
    for (const k of Object.keys(value ?? {})) {
        const v = value[k];

        if (typeof v === "function") {
            applyElement(el, value => setStyleValue(el, k, value), v)
        } else {
            setStyleValue(el, k, v);
        }
    }
}

function setReactiveStyle(el: any, getValue: () => any) {
    let previousKeys = new Set<string>();
    applyElement(el, () => {
        const value = getValue();
        const nextKeys = new Set<string>(Object.keys(value ?? {}));

        for (const k of previousKeys) {
            if (!nextKeys.has(k))
                setStyleValue(el, k, null);
        }
        for (const k of nextKeys) {
            const v = value[k];
            setStyleValue(el, k, typeof v === "function" ? v() : v);
        }
        previousKeys = nextKeys;
    });
}

function getEventName(property: string) {
    return property.startsWith("on-") && property.length > 3 ? property.substring(3) : undefined;
}

export function jsx<T extends object>(factory: string | USXFunctionFactory<T> | USXClassFactory<T>, props?: T | null): USXChildren {
    const combinedProps: any = props ?? {};
    const children: USXChildren = combinedProps["children"];

    if (typeof factory !== 'string') {
        if (factory.prototype instanceof USXComponent) {
            const component = new (factory as USXClassFactory<any>)(combinedProps);
            component._rendered = component.render(combinedProps);
            return component;
        } else
            return (factory as USXFunctionFactory<T>)(combinedProps);
    }
    const el = svgTags.has(factory) || /^fe[A-Z][A-Za-z]+$/.test(factory) ? document.createElementNS(SVG_NAMESPACE, factory) : document.createElement(factory);
    for (const k in combinedProps) {
        if (k === "children")
            continue;
        const v = combinedProps[k];
        const eventName = getEventName(k);
        if (eventName !== undefined) {
            if (typeof v === "function") {
                el.addEventListener(eventName, function (this: Element, event) {
                    try {
                        return v.call(this, event);
                    } finally {
                        updateUI();
                    }
                });
            }
        } else if (k === "style" && typeof v === "function") {
            setReactiveStyle(el, v);
        } else if (typeof v === "function") {
            applyElement(el, value => setAttribute(el, k, value), v);
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

function getOrCreateBinding(el: Element) {
    let bind = bindings.get(el);
    if (bind === undefined) {
        bind = new USXBinding();
        bindings.set(el, bind);
    }
    return bind;
}

export function applyElement(el: Element, fn: (...args: any[]) => void, ...args: any[]) {
    const values = evaluateArgs(args);
    fn(...values);
    addUpdateCallback(el, fn, args, values);
}

function evaluateArgs(args: any[]) {
    return args.map(arg => typeof arg === "function" ? arg() : arg);
}

function addUpdateCallback(el: Element, fn: (...args: any[]) => void, args: any[], values: any[]) {
    const bind = getOrCreateBinding(el);
    bind.updateCallbacks.push(() => {
        let changed = false;
        if (args.length > 0) {
            const newValues = evaluateArgs(args);
            for (let idx = 0; idx < args.length; idx++) {
                if (values[idx] !== newValues[idx]) {
                    changed = true;
                    values[idx] = newValues[idx];
                }
            }
        }

        if (changed || args.length === 0)
            fn(...values);
    });
}

export function onRemoveElement(el: Element, fn: USXEventCallback) {
    const bind = getOrCreateBinding(el);
    bind.removeCallbacks.push(fn);
}

function unbind(node: USXChildren) {
    if (node == null || typeof node === "string" || typeof node === "number" || typeof node === "boolean") {
        return;
    }

    if (node instanceof Array) {
        node.forEach(unbind);
        return;
    }

    if (node instanceof USXComponent) {
        if (node._rendered != null) {
            unbind(node._rendered);
        }
        return;
    }

    if (node instanceof Element) {
        const bind = bindings.get(node);
        if (bind !== undefined) {
            bindings.delete(node);
            bind.removeCallbacks.forEach(fn => fn());
        }
    }

    for (let child = node.firstChild; child; child = child.nextSibling) {
        unbind(child);
    }
}

export function removeUI(...items: USXChildren[]) {
    for (const item of items) {
        if (item == null || typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
            continue;
        }

        if (item instanceof Array) {
            removeUI(...item);
            continue;
        }

        if (item instanceof USXComponent) {
            if (item._rendered != null) {
                removeUI(item._rendered);
            }
            continue;
        }

        if (item.parentNode) {
            item.parentNode.removeChild(item);
        }
        unbind(item);
    }
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
            binding.updateCallbacks.forEach(fn => fn());
        })
    } finally {
        inUpdate = false;
    }
}
