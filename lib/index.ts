const matchPx = /^(left|top|right|bottom|width|height|(margin|padding|border)(Left|Top|Right|Bottom)(Width)?|border(Top|Bottom)?(Left|Right)?Radius|(min|max)Width|flexBasis|fontSize)$/;
var matchSVGEl = /^(svg|line|circle|rect|ellipse|path|image|poly(gon|line)|text(Path)?|g)$/;
const directAttribute = /^(value|checked)$/;
const isEvent = /^on[A-Z]/;
const SVGNS = "http://www.w3.org/2000/svg";

interface ElementData {
    updates: ((Element)=>void)[]
    unmounts: ((Element)=>void)[]
}

let elementMap = new Map<Element, ElementData>();
let debug = false;

export function enableDebugging() {
    debug = true;
}

export function updateUI() {
    elementMap.forEach((map, el)=>{
        /* develblock:start */
        if (debug) {
            let p;
            for (p = el as Node; p; p = p.parentNode) {
                if (p.nodeType == 9) {
                    break;
                }
            }
            if (p == null) {
                console.log("Updating unmounted [" + el.nodeName + "]");
            }
        }
        /* develblock:end */
        for (const cb of map.updates) {
            cb(el);
        }
    });
}

export function action<T>(fn:()=>T):T {
    try {
        return fn();
    } finally {
        updateUI();
    }
}

export function unmount(el: Element) {
    try {
        const ed = dataForEl(el, false);
        if (ed) {
            for (const cb of ed.unmounts) {
                cb(el);
            }
        }
    } finally {
        elementMap.delete(el);
    }
    for (let c = el.firstElementChild; c; c = c.nextElementSibling) {
        unmount(c);
    }
}

function dataForEl(el: Element, create: boolean) {
    let ed = elementMap.get(el);
    if (ed == null && create) {
        ed = {
            updates: [],
            unmounts: []
        };
        elementMap.set(el, ed);
    }
    return ed;
}

export function onUpdateEl(el: Element, callback:(Element)=>void) {
    dataForEl(el, true).updates.push(callback);
    callback(el);
}

export function onUnmountEl(el: Element, callback:(Element)=>void) {
    dataForEl(el, true).unmounts.push(callback);
}

function applyStyleProp(el, k, val) {
    if (typeof val === "number" && matchPx.test(k))
        el.style[k] = val + "px";
    else
        el.style[k] = val;
}

function applyAttribute(el, k, val) {
    if (el.tagName === "INPUT" && directAttribute.test(k))
        el[k] = val;
    else if (val != null)
        el.setAttribute(k, val);
    else
        el.removeAttribute(k);
}

function needsApply(val) {
    return (typeof val === 'function');
}

function applyValue(el:Element, pval, callback) {
    if (typeof pval === 'function') {
        onUpdateEl(el, ()=>callback(pval()))
    } else {
        callback(pval);
    }
}

function setAttribute(el, prop, val) {
    if (val == null) {
        return;
    }
    if (isEvent.test(prop)) {
        if(typeof val === "function")
            el[prop.toLowerCase()] = function(...args) { return action(val.bind(this, ...args));}
        /* develblock:start */
        else
            console.log("non-function event");
        /* develblock:end */
    } else if (prop === "style") {
        if (typeof val === "object" && val != null) {
            Object.keys(val).forEach(k=>{
                let stylePropVal = val[k];
                applyValue(el, stylePropVal, (v)=>applyStyleProp(el, k, v))
            });
        }
    } else {
        applyValue(el, val, (v)=>applyAttribute(el, prop, v));
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
    } else if (needsApply(c)) {
        const c1 = document.createComment("");
        const c2 = document.createComment("");
        el.appendChild(c1);
        el.appendChild(c2);
        applyValue(el, c, (v)=>applyContent(el, c1, c2, v));
    } else if (before) {
        el.insertBefore(document.createTextNode("" + c), before);
    } else {
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
        return tag(props, children);
    } else {
        return null;
    }
}
