export const matchPx = /^(left|top|right|bottom|width|height|(margin|padding|border)(Left|Top|Right|Bottom)?(Width)?|border(Top|Bottom)?(Left|Right)?Radius|(min|max)Width|flexBasis|fontSize)$/;
var matchSVGEl = /^(svg|line|circle|rect|ellipse|path|image|poly(gon|line)|text(Path)?|g)$/;
const directAttribute = /^(value|checked)$/;
const isEvent = /^on[A-Z]/;
const SVGNS = "http://www.w3.org/2000/svg";

type ActionCallback = (...args)=>void;

interface ElementData {
    update: ActionCallback[];
    unmount?: ActionCallback[];
}

type USXStaticElement = Node | string | Component<any> | Array<any>;
type USXDynamicElement = ()=>USXStaticElement;
type USXElement = USXStaticElement | USXDynamicElement;

interface ComponentFactory<T, U> {
    new(props:T, children: USXElement[]):U;
}

export abstract class Component<T> {
    _render: USXElement;

    constructor(readonly props: T, readonly children: USXElement[]) {

    }

    abstract render(props: T, children: USXElement[]):USXElement;
}

class StylesheetClass {
    private _pieces:string[] = [];
    private _updates:ActionCallback[] = [];

    constructor(readonly className: string, readonly clause: string, defn: StyleDefinition, private styleNode: Text) {
        this._pieces.push(`${this.clause}{`);
        this.compileDefinition(defn);
        this._pieces.push("}");
        this._update();
    }

    writeClause(idx: number, cssKey: string, k: string,val: string|number) {
        if (val == null) {
            this._pieces[idx] = "";
        } else {
            this._pieces[idx] = `${cssKey}:${formatStyleProp(k, val)}`;
        }
    }

    compileClause(k: string, v: StyleValue) {
        const cssKey = k.replace(/[A-Z]/g, v=>"-"+v.toLowerCase());
        const idx = this._pieces.push("") - 1;
        if (typeof v === "function") {
            this._updates.push(()=>{
                this.writeClause(idx, cssKey, k, v());
            })
        } else {
            this.writeClause(idx, cssKey, k, v);
        }
    }

    compileDefinition(defn: StyleDefinition) {
        Object.keys(defn).forEach(k=>{
            this.compileClause(k, defn[k]);
            this._pieces.push(";");
        })
    }

    withSubRule(clause: string, defn: StyleDefinition) {
        this._pieces.push(`${this.clause} ${clause}{`);
        this.compileDefinition(defn);
        this._pieces.push("}");
        this._update();
        return this;
    }

    withMediaQuery(condition: StyleDefinition, defn: StyleDefinition) {
        this._pieces.push(`@media `);
        const keys = Object.keys(condition);
        keys.forEach((k, idx)=>{
            if (idx > 0)
                this._pieces.push(" and ");
            this._pieces.push("(");
            this.compileClause(k, condition[k]);
            this._pieces.push(")");
        });
        this._pieces.push(` {${this.clause} {`);
        this.compileDefinition(defn);
        this._pieces.push("}}");
        this._update();
        return this;
    }

    _update() {
        this._updates.forEach(cb=>cb());
        this.styleNode.textContent = this._pieces.join("");
    }
}

type StyleValue = string|number|(()=>string)|(()=>number);
type StyleDefinition = {[index:string]: StyleValue};

function formatStyleProp(k: string, val: string|number) {
    if (typeof val === "number" && matchPx.test(k))
        return val + "px";
    else
        return val;
}

let styleSheet: HTMLStyleElement;

function createIsolatedContext() {
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
                for (const cb of map.update) {
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
            for (const cb of callbacksForEl(el, "unmount", false)) {
                cb(el);
            }
        } finally {
            elementMap.delete(el);
        }
        for (let c = el.firstElementChild; c; c = c.nextElementSibling) {
            unmountUI(c);
        }
    }

    function unmountAll() {
        elementMap.forEach((map, el)=>{
            if (map.unmount)
                for (const cb of map.unmount) {
                    cb(el);
                }
        });
        elementMap.clear();
    }
    
    function callbacksForEl(el: Element, action: string, create: boolean) {
        let ed = elementMap.get(el);
        if (ed == null) {
            if (!create) {
                return [];
            }
            elementMap.set(el, ed = {
                update:[]
            });
        }
        let callbacks = ed[action];
        if (callbacks == null) {
            if (!create) {
                return [];
            }
            callbacks = ed[action] = [];
        }
        return callbacks;        
    }
    
    function on(el: Element, action: string, callback:(...args)=>void) {
        callbacksForEl(el, action, true).push(callback);
    }

    function cssClass(clause: string, styles: StyleDefinition):StylesheetClass;
    function cssClass(styles: StyleDefinition):StylesheetClass;
    function cssClass(a:string|StyleDefinition, b?:StyleDefinition):StylesheetClass {
        const styleNode = document.createTextNode("");
        const className = typeof a === "string" ? null : "c" + Math.random().toString(16).substring(2);
        const clause = typeof a === "string" ? a : "." + className;
        const styles = typeof a === "string" ? b : a;
        const cls = new StylesheetClass(className, clause, styles, styleNode);

        if (styleSheet == null) {
            styleSheet = document.createElement("style");
            document.head.appendChild(styleSheet);
        }

        styleSheet.appendChild(styleNode);

        onUpdateUI(styleSheet, ()=>{
            cls._update();
        })

        return cls;
    }

    function onUpdateUI(el: Element, callback:(Element)=>void) {
        on(el, "update", callback);
        callback(el);
    }
    
    function onUnmountUI(el: Element, callback:(Element)=>void) {
        on(el, "unmount", callback);
    }
    
    function applyStyleProp(el, k, val) {
        el.style[k] = formatStyleProp(k, val);
    }
    
    function formatAttr(val) {
        if (val instanceof Array) {
            return val.filter(v=>v != null).map(k=>formatAttr(k)).join(" ");
        } else if (val instanceof StylesheetClass)
            return val.className;
        else
            return val;
    } 

    function applyAttribute(el, k:string, val) {
        if (k.startsWith("__")) return;
        if (el.tagName === "INPUT" && directAttribute.test(k))
            el[k] = val;
        else if (val != null)
            el.setAttribute(k, formatAttr(val));
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
    
    function propsWithContext(props) {
        const mergedProps = {};
        for (const k in defaultProps) {
            mergedProps[k] = defaultProps[k];
        }
        for (const k in props) {
            mergedProps[k] = props[k];
        }
        return mergedProps;
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
            const mergeProps = propsWithContext(props);
            const instance = new tag(mergeProps, children);
            instance._render = instance.render(mergeProps, children);
            return instance;
        } else if (typeof tag === 'function') {
            return tag(propsWithContext(props), children);
        } else {
            return null;
        }
    }
    usx.create = createIsolatedContext;
    usx.update = updateUI;
    usx.onUpdate = onUpdateUI;
    usx.onUnmount = onUnmountUI;
    usx.unmount = unmountUI;
    usx.forEach = forEachUI;
    usx.unmountAll = unmountAll;

    usx.cssClass = cssClass;

    return usx;
}

const usx = createIsolatedContext();
export default usx;

let defaultProps:any = {};

export function getDefaultProps<T>() {
    return defaultProps as T;
}

export function withDefaultProps(newProps: object, callback:()=>void) {
    let savedContext = defaultProps;
    try {
        defaultProps = {};
        for (const k in savedContext) {
            defaultProps[k] = savedContext[k];
        }
        for (const k in newProps) {
            defaultProps[k] = newProps[k];
        }
        callback();
    } finally {
        defaultProps = savedContext;
    }
}
