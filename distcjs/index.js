"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const matchPx = /^(left|top|right|bottom|width|height|(margin|padding|border)(Left|Top|Right|Bottom)(Width)?|border(Top|Bottom)?(Left|Right)?Radius|(min|max)Width|flexBasis|fontSize)$/;
const matchSVGEl = /^svg|line|circle|rect|ellipse|path|image|poly(gon|line)|text(Path)?|g$/;
const SVGNS = "http://www.w3.org/2000/svg";
const ComponentRegistry = {};
function WebComponent(name) {
    return function (constructor) {
        constructor["__WebComponent"] = name;
        ComponentRegistry[name.toLowerCase()] = constructor;
    };
}
exports.WebComponent = WebComponent;
function applyStyleProp(el, k, val) {
    if (typeof val === "number" && matchPx.test(k))
        el.style[k] = val + "px";
    else
        el.style[k] = val;
}
function applyAttribute(el, k, val) {
    el.setAttribute(k, val);
}
function needsApply(ctx, val) {
    return ((typeof val === 'object' && typeof val.then === 'function') ||
        (typeof val === 'object' && typeof val.value === 'function') ||
        (typeof val === 'function' && ctx != null));
}
function applyValue(ctx, pval, callback) {
    const val = (typeof pval === 'function' && ctx != null) ? ctx.value(pval) : pval;
    if (typeof val === 'object' && typeof val.then === 'function') {
        val.then((v) => callback(v));
    }
    else if (typeof val === 'object' && typeof val.value === 'function') {
        callback(val.value());
        if (typeof val.on === 'function') {
            val.on("update", (v) => callback(v));
        }
    }
    else {
        callback(val);
    }
}
function setAttribute(ctx, el, prop, val) {
    if (val == null || prop == '$') {
        return;
    }
    if (prop.length > 2 && prop.substring(0, 2) === "on") {
        el[prop.toLowerCase()] = val;
    }
    else if (prop === "style") {
        if (typeof val === "object" && val != null) {
            Object.keys(val).forEach(k => {
                let stylePropVal = val[k];
                applyValue(ctx, stylePropVal, (v) => applyStyleProp(el, k, v));
            });
        }
    }
    else {
        applyValue(ctx, val, (v) => applyAttribute(el, prop, v));
    }
}
function applyContent(ctx, el, c1, c2, v) {
    while (c1.nextSibling != c2) {
        el.removeChild(c1.nextSibling);
    }
    append(ctx, el, v, c2);
}
function append(ctx, el, c, before) {
    if (c == null)
        return;
    if (c instanceof Node) {
        if (before)
            el.insertBefore(c, before);
        else
            el.appendChild(c);
    }
    else if (c instanceof Array) {
        c.forEach(i => append(ctx, el, i, before));
    }
    else if (typeof c === "object" && "constructor" in c && c.constructor.__WebComponent != null) {
        append(ctx, el, c._el, before);
    }
    else if (needsApply(ctx, c)) {
        const c1 = document.createComment("");
        const c2 = document.createComment("");
        el.appendChild(c1);
        el.appendChild(c2);
        applyValue(ctx, c, (v) => applyContent(ctx, el, c1, c2, v));
    }
    else if (typeof c === 'object' && typeof c.on === 'function') {
        c.on('data', (v) => {
            el.appendChild(document.createTextNode("" + v));
        });
    }
    else if (before) {
        el.insertBefore(document.createTextNode("" + c), before);
    }
    else {
        el.appendChild(document.createTextNode("" + c));
    }
}
function usx(tag, props, ...children) {
    const ctx = props != null ? props.$ : null;
    if (typeof tag === 'string') {
        const el = matchSVGEl.test(tag) ? document.createElementNS(SVGNS, tag) : document.createElement(tag);
        append(ctx, el, children, null);
        if (props != null) {
            Object.keys(props).forEach(k => setAttribute(ctx, el, k, props[k]));
        }
        return el;
    }
    else if (typeof tag === 'function') {
        let result;
        if (tag["__WebComponent"] != null) {
            return new tag(props, children);
        }
        else
            return tag(props, children);
    }
    else {
        return null;
    }
}
exports.default = usx;
function componentFromDOM(el, construct) {
    const props = {};
    const children = [];
    for (var i = 0; i < el.attributes.length; i++) {
        var attrib = el.attributes[i];
        props[attrib.name] = attrib.value;
    }
    for (let child = el.firstChild; child; child = child.nextSibling) {
        if (child.nodeType == 1 && ComponentRegistry[child.localName.toLowerCase()]) {
            children.push(componentFromDOM(child, ComponentRegistry[child.localName.toLowerCase()]));
        }
        else {
            children.push(child);
        }
    }
    return new construct(props, children);
}
function automount(root) {
    if (root == null)
        root = document.body;
    let nextSibling;
    for (let el = root.firstChild; el; el = nextSibling) {
        nextSibling = el.nextSibling;
        if (el.nodeType != 1)
            continue;
        const lowerName = el.localName.toLowerCase();
        if (ComponentRegistry[lowerName]) {
            const component = componentFromDOM(el, ComponentRegistry[lowerName]);
            append(null, el.parentElement, component, el);
            el.parentElement.removeChild(el);
        }
        else {
            automount(el);
        }
    }
}
exports.automount = automount;
