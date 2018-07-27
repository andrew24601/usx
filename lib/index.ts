type Doer = {
    do(callback:()=>void);
}

const matchPx = /^(left|top|right|bottom|width|height|(margin|padding|border)(Left|Top|Right|Bottom)(Width)?|border(Top|Bottom)?(Left|Right)?Radius|(min|max)Width|flexBasis|fontSize)$/;
const matchSVGEl = /^svg|line|circle|rect|ellipse|path|image|poly(gon|line)|text(Path)?|g$/;
const SVGNS = "http://www.w3.org/2000/svg";

const ComponentRegistry = {

}

export function WebComponent(name: string) {
    return function(constructor: Function) {
        constructor["__WebComponent"] = name;
        ComponentRegistry[name.toLowerCase()] = constructor;
    }
}

function applyStyleProp(el, k, val) {
    if (typeof val === "number" && matchPx.test(k))
        el.style[k] = val + "px";
    else
        el.style[k] = val;
}

function applyAttribute(el, k, val) {
    el.setAttribute(k, val);
}

function needsApply(val) {
    return ((typeof val === 'object' && typeof val.then === 'function') ||
     (typeof val === 'object' && typeof val.value === 'function'));
}

function applyValue(val, callback) {
    if (typeof val === 'object' && typeof val.then === 'function') {
        val.then((v)=>callback(v))
    } else if (typeof val === 'object' && typeof val.value === 'function') {
        callback(val.value());
        if (typeof val.on === 'function') {
            val.on("update", (v)=>callback(v));
        }
    } else {
        callback(val);
    }
}

function setAttribute(el, prop, val) {
    if (val == null) {
        return;
    }
    if (prop.length > 2 && prop.substring(0, 2) === "on") {
        el[prop.toLowerCase()] = val;
    } else if (prop === "style") {
        if (typeof val === "object" && val != null) {
            Object.keys(val).forEach(k=>{
                let stylePropVal = val[k];
                applyValue(stylePropVal, (v)=>applyStyleProp(el, k, v))
            });
        }
    } else {
        applyValue(val, (v)=>applyAttribute(el, prop, v));
    }
}

function applyContent(el, c1, c2, v) {
    while (c1.nextSibling != c2) {
        el.removeChild(c1.nextSibling);
    }
    append(el, v, c2);
}

function append(el, c, before:Node) {
    if (c == null) return;
    if (c instanceof Node) {
        if (before)
            el.insertBefore(c, before);
        else
            el.appendChild(c);
    } else if (c instanceof Array) {
        c.forEach(i => append(el, i, before));
    } else if (typeof c === "object" && "constructor" in c && c.constructor.__WebComponent != null) {
        append(el, c._el, before);
    } else if (needsApply(c)) {
        const c1 = document.createComment("");
        const c2 = document.createComment("");
        el.appendChild(c1);
        el.appendChild(c2);
        applyValue(c, (v)=>applyContent(el, c1, c2, v));
    } else if (typeof c === 'object' && typeof c.on === 'function') {
        c.on('data',(v)=>{
            el.appendChild(document.createTextNode("" + v));
        })
    } else if (c != null) {
        if (before)
            el.insertBefore(document.createTextNode("" + c), before);
        else
            el.appendChild(document.createTextNode("" + c));
    }
}

export default function usx(tag, props, ...children) {
    if (typeof tag === 'string') {
        const el = matchSVGEl.test(tag) ? document.createElementNS(SVGNS, tag) : document.createElement(tag);
        append(el, children,null);
        if (props != null) {
            Object.keys(props).forEach(k => setAttribute(el, k, props[k]));
        }

        return el;
    } else if (typeof tag === 'function') {
        let result;
        if (tag["__WebComponent"] != null) {
            return new tag(props, children);
        } else
            return tag(props, children);
    } else {
        return null;
    }
}

function componentFromDOM(el, construct) {
    const props = {};
    const children = [];
    for (var i = 0; i < el.attributes.length; i++) {
        var attrib = el.attributes[i];
        props[attrib.name] = attrib.value;
    }
    for (let child = el.firstChild; child; child = child.nextSibling) {
        if (child.nodeType == 1 && ComponentRegistry[child.localName.toLowerCase()]) {
            children.push(componentFromDOM(child, ComponentRegistry[child.localName.toLowerCase()]))
        } else {
            children.push(child);
        }
    }

    return new construct(props, children);

}

export function automount(root?) {
    if (root == null) root = document.body;

    for (let el = root.firstChild; el; el = el.nextSibling) {
        if (el.nodeType != 1) continue;
        const lowerName = el.localName.toLowerCase();
        if (ComponentRegistry[lowerName]) {
            const component = componentFromDOM(el, ComponentRegistry[lowerName]);
            append(el.parentElement, component, el);
            el.parentElement.removeChild(el);

        } else {
            automount(el);
        }
    }
}