export const matchPx = /^(left|top|right|bottom|width|height|(margin|padding|border)(Left|Top|Right|Bottom)?(Width)?|border(Top|Bottom)?(Left|Right)?Radius|(min|max)Width|flexBasis|fontSize)$/;
var matchSVGEl = /^(svg|line|circle|rect|ellipse|path|image|poly(gon|line)|text(Path)?|g)$/;
const directAttribute = /^(value|checked)$/;
const isEvent = /^on[A-Z]/;
const SVGNS = "http://www.w3.org/2000/svg";

interface ElementData {
    updates: ((Element)=>void)[]
    unmounts: ((Element)=>void)[]
}

type USXElement = Node | string | Component<any> | Array<any>;

interface ComponentFactory<T, U> {
    new(props:T, children: USXElement[]):U;
}

export abstract class Component<T> {
    _render: USXElement;

    constructor(readonly props: T, readonly children: USXElement[]) {

    }

    abstract render(props: T, children: USXElement[]):USXElement;
}


function createUIContext() {
    let elementMap = new Map<Element, ElementData>();
    let inUpdateUI = false;

    function forEachUI(cb:(el:Element)=>void) {
        elementMap.forEach((map, el)=>{
            cb(el);
        });
    }

    function updateUI() {
        if (inUpdateUI) {
            return;
        }
        inUpdateUI = true;
        try {
            elementMap.forEach((map, el)=>{
                for (const cb of map.updates) {
                    cb(el);
                }
            });
        } finally {
            inUpdateUI = false;
        }
    }
    
    function action<T>(fn:()=>T):T {
        try {
            return fn();
        } finally {
            updateUI();
        }
    }
    
    function unmountUI(el: Element) {
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
            unmountUI(c);
        }
    }

    function clearUI() {
        elementMap.clear();
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
    
    function onUpdateUI(el: Element, callback:(Element)=>void) {
        dataForEl(el, true).updates.push(callback);
        callback(el);
    }
    
    function onUnmountUI(el: Element, callback:(Element)=>void) {
        dataForEl(el, true).unmounts.push(callback);
    }
    
    function applyStyleProp(el, k, val) {
        if (typeof val === "number" && matchPx.test(k))
            el.style[k] = val + "px";
        else
            el.style[k] = val;
    }
    
    function applyAttribute(el, k:string, val) {
        if (k.startsWith("__")) return;
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
            onUpdateUI(el, ()=>callback(pval()))
        } else {
            callback(pval);
        }
    }
    
    function setAttribute(el:HTMLElement|SVGElement, prop:string, val) {
        if (val == null) {
            return;
        }
        if (isEvent.test(prop)) {
            if(typeof val === "function") {
                el.addEventListener(prop.substr(2).toLowerCase(), function(...args) { return action(val.bind(this, ...args))})
            }
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
    
    function append(el:Element, c:USXElement, before:Node) {
        if (c == null) return;
        if (c instanceof Node) {
            if (before)
                el.insertBefore(c, before);
            else
                el.appendChild(c);
        } else if (c instanceof Array) {
            c.forEach(i => append(el, i, before));
        } else if (c instanceof Component) {
            append(el, c._render, before);
        } else if (needsApply(c)) {
            const c1 = document.createTextNode("");
            const c2 = document.createTextNode("");
            el.appendChild(c1);
            el.appendChild(c2);
            applyValue(el, c, (v)=>applyContent(el, c1, c2, v));
        } else if (before) {
            el.insertBefore(document.createTextNode("" + c), before);
        } else {
            el.appendChild(document.createTextNode("" + c));
        }
    }
    function usx(tag:"div", props, ...children):HTMLDivElement;
    function usx(tag:"span", props, ...children):HTMLSpanElement;
    function usx(tag:"a", props, ...children):HTMLAnchorElement;
    function usx(tag:"input", props, ...children):HTMLInputElement;
    function usx(tag:"script", props, ...children):HTMLScriptElement;
    function usx(tag:"select", props, ...children):HTMLSelectElement;
    function usx(tag:"option", props, ...children):HTMLOptionElement;
    function usx(tag:"form", props, ...children):HTMLFormElement;
    function usx<T, U>(tag:ComponentFactory<T,U>, props: T, ...children):U;
    function usx(tag, props, ...children):any {
        if (typeof tag === 'string') {
            const el = matchSVGEl.test(tag) ? document.createElementNS(SVGNS, tag) : document.createElement(tag);
            append(el, children,null);
            if (props != null) {
                Object.keys(props).forEach(k => setAttribute(el, k, props[k]));
            }
    
            return el;
        } else if (typeof tag === "function" && tag.prototype instanceof Component) {
            const instance = new tag(props, children);
            instance._render = instance.render(props, children);
            return instance;
        } else if (typeof tag === 'function') {
            return tag(props, children);
        } else {
            return null;
        }
    }
    usx.create = createUIContext;
    usx.update = updateUI;
    usx.onUpdate = onUpdateUI;
    usx.onUnmount = onUnmountUI;
    usx.unmount = unmountUI;
    usx.forEach = forEachUI;
    usx.clear = clearUI;

    return usx;
}

const usx = createUIContext();
export default usx;
