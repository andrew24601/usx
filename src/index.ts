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
export type USXChild = string | number | boolean | Node | null | undefined;
export type USXChildren = USXChild | USXChildren[];
export type USXFunctionFactory<T extends object = Record<string, unknown>> = (props: T) => USXChildren;
export type USXTextValue = string | number | boolean | null | undefined;
export interface USXIntrinsicProps {
    children?: USXChildren;
    [name: string]: any;
}
type USXEventCallback = () => void;
export type USXInputValues<T extends readonly unknown[]> = {
    -readonly [K in keyof T]: T[K] extends () => infer V ? V : T[K]
};

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

const bindings = new Map<Node, USXBinding>();

class USXBinding {
    syncCallbacks: USXEventCallback[] = [];
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
    } else
        el.appendChild(child);
}

function setAttribute(el: any, name: string, value: any) {
    if (booleanProperties.has(name))
        el[name] = Boolean(value);
    else if (directProperties.has(name)) {
        const errors: unknown[] = [];
        if (name === "textContent" || name === "innerHTML")
            collectUnbindChildren(el, errors);
        try {
            el[name] = value;
        } catch (error) {
            errors.push(error);
        }
        throwCleanupErrors(errors);
    }
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
            syncElement(el, [v], value => setStyleValue(el, k, value))
        } else {
            setStyleValue(el, k, v);
        }
    }
}

function setReactiveStyle(el: any, getValue: () => any) {
    let previousKeys = new Set<string>();
    syncElement(el, [], () => {
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

export function jsx<K extends keyof HTMLElementTagNameMap>(factory: K, props?: USXIntrinsicProps | null): HTMLElementTagNameMap[K];
export function jsx<K extends keyof SVGElementTagNameMap>(factory: K, props?: USXIntrinsicProps | null): SVGElementTagNameMap[K];
export function jsx<T extends object, R extends USXChildren>(factory: (props: T) => R, props?: T | null): R;
export function jsx(factory: string | USXFunctionFactory<any>, props?: any | null): USXChildren;
export function jsx(factory: string | USXFunctionFactory<any>, props?: any | null): USXChildren {
    const combinedProps: any = props ?? {};
    const children: USXChildren = combinedProps["children"];

    if (typeof factory !== 'string')
        return factory(combinedProps);
    const el = svgTags.has(factory) || /^fe[A-Z][A-Za-z]+$/.test(factory) ? document.createElementNS(SVG_NAMESPACE, factory) : document.createElement(factory);
    for (const k of Object.keys(combinedProps)) {
        if (k === "children")
            continue;
        const v = combinedProps[k];
        const eventName = getEventName(k);
        if (eventName !== undefined) {
            if (typeof v === "function") {
                const listener = function (this: Element, event: Event) {
                    try {
                        return v.call(this, event);
                    } finally {
                        syncUI();
                    }
                };
                el.addEventListener(eventName, listener);
                addRemoveCallback(el, () => el.removeEventListener(eventName, listener));
            }
        } else if (k === "style" && typeof v === "function") {
            setReactiveStyle(el, v);
        } else if (typeof v === "function") {
            syncElement(el, [v], value => setAttribute(el, k, value));
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

export function Fragment(props: {children?: USXChildren}) {
    const frag = new DocumentFragment();
    const children = props["children"];
    if (children != null)
        append(frag, children);
    return frag;
}

function getOrCreateBinding(node: Node) {
    let bind = bindings.get(node);
    if (bind === undefined) {
        bind = new USXBinding();
        bindings.set(node, bind);
    }
    return bind;
}

export function syncElement<const T extends readonly unknown[]>(
    el: Element,
    inputs: T,
    fn: (...values: USXInputValues<T>) => void
): void;
export function syncElement(el: Element, inputs: readonly unknown[], fn: (...values: any[]) => void) {
    syncNode(el, inputs, fn);
}

function syncNode(node: Node, inputs: readonly unknown[], fn: (...values: any[]) => void) {
    const values = evaluateInputs(inputs);
    fn(...values);
    addSyncCallback(node, fn, inputs, values);
}

function evaluateInputs(inputs: readonly unknown[]) {
    return inputs.map(input => typeof input === "function" ? input() : input);
}

function addSyncCallback(node: Node, fn: (...values: any[]) => void, inputs: readonly unknown[], values: unknown[]) {
    const bind = getOrCreateBinding(node);
    bind.syncCallbacks.push(() => {
        let changed = false;
        if (inputs.length > 0) {
            const newValues = evaluateInputs(inputs);
            for (let idx = 0; idx < inputs.length; idx++) {
                if (values[idx] !== newValues[idx]) {
                    changed = true;
                    values[idx] = newValues[idx];
                }
            }
        }

        if (changed || inputs.length === 0)
            fn(...values);
    });
}

function textValue(value: USXTextValue) {
    return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

export function syncText(getValue: () => USXTextValue) {
    const node = document.createTextNode("");
    syncNode(node, [getValue], value => node.data = textValue(value));
    return node;
}

export function onRemoveElement(el: Element, fn: () => void) {
    addRemoveCallback(el, fn);
}

function addRemoveCallback(node: Node, fn: () => void) {
    const bind = getOrCreateBinding(node);
    bind.removeCallbacks.push(fn);
}

function collectUnbind(node: USXChildren, errors: unknown[]) {
    if (node == null || typeof node === "string" || typeof node === "number" || typeof node === "boolean") {
        return;
    }

    if (node instanceof Array) {
        node.forEach(item => collectUnbind(item, errors));
        return;
    }

    collectUnbindChildren(node, errors);

    const bind = bindings.get(node);
    if (bind !== undefined) {
        bindings.delete(node);
        for (const fn of bind.removeCallbacks) {
            try {
                fn();
            } catch (error) {
                errors.push(error);
            }
        }
    }
}

function collectUnbindChildren(node: Node, errors: unknown[]) {
    for (const child of Array.from(node.childNodes))
        collectUnbind(child, errors);
}

function throwCleanupErrors(errors: unknown[]) {
    if (errors.length === 1)
        throw errors[0];
    if (errors.length > 1)
        throw new AggregateError(errors, "USX cleanup failed");
}

export function removeUI(...items: USXChildren[]) {
    const errors: unknown[] = [];
    for (const item of items)
        removeItem(item, errors);
    throwCleanupErrors(errors);
}

function removeItem(item: USXChildren, errors: unknown[]) {
    if (item == null || typeof item === "string" || typeof item === "number" || typeof item === "boolean")
        return;
    if (item instanceof Array) {
        for (const child of item)
            removeItem(child, errors);
        return;
    }

    try {
        if (item.parentNode)
            item.parentNode.removeChild(item);
    } catch (error) {
        errors.push(error);
    }
    collectUnbind(item, errors);
}

let inSync = false;
export function syncUI() {
    if (inSync) {
        // ignore reentrant synchronization
        return;
    }
    inSync = true;
    try {
        bindings.forEach((binding, node) => {
            if (node.isConnected)
                binding.syncCallbacks.forEach(fn => fn());
        })
    } finally {
        inSync = false;
    }
}
