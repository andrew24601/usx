export const matchPx = /^(left|top|right|bottom|width|height|(margin|padding|border)(Left|Top|Right|Bottom)?(Width)?|border(Top|Bottom)?(Left|Right)?Radius|(min|max)Width|flexBasis|fontSize)$/;
var matchSVGEl = /^(svg|line|circle|rect|ellipse|path|image|poly(gon|line)|text(Path)?|g)$/;
const directAttribute = /^(value|checked)$/;
const isEvent = /^on[A-Z]/;
const SVGNS = "http://www.w3.org/2000/svg";

type ActionCallback = ()=>void;

interface ElementData {
    context: UIUpdateContext,
    update: ActionCallback[];
    unmount: ActionCallback[];
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

export class UIUpdateContext {
    _dirty = false;

    dirty() {
        this._dirty = true;
    }
}

let elementMap = new Map<Element, ElementData>();
let inUpdateUI = false;

function updateUI() {
    if (inUpdateUI) {
        return;
    }
    inUpdateUI = true;
    try {
        const contextMap = new Map<UIUpdateContext, boolean>();
        elementMap.forEach(map=>{
            if (map.context) {
                const context = map.context;
                if (!context._dirty)
                    return;
                contextMap.set(context, true);
            }
            for (const cb of map.update) {
                cb();
            }
        });
        contextMap.forEach((_, context)=>{
            context._dirty = false;
        })
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
        let ed = elementMap.get(el);
        if (ed)
            for (const cb of ed.unmount) {
                cb();
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

function dataForEl(el: Element):ElementData {
    let ed = elementMap.get(el);
    if (ed == null) {
        elementMap.set(el, ed = {
            context: getContext<{context: UIUpdateContext}>().context,
            update: [],
            unmount: []
        });
    }
    return ed;
}

export function usxStyle(clause: string, styles: StyleDefinition):StylesheetClass;
export function usxStyle(styles: StyleDefinition):StylesheetClass;
export function usxStyle(a:string|StyleDefinition, b?:StyleDefinition):StylesheetClass {
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

function onUpdateUI(el: Element, callback:()=>void) {
    dataForEl(el).update.push(callback);
    callback();
}

function onUnmountUI(el: Element, callback:()=>void) {
    dataForEl(el).unmount.push(callback);
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
    for (const k in currentContext) {
        mergedProps[k] = currentContext[k];
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
usx.update = updateUI;
usx.onUpdate = onUpdateUI;
usx.onUnmount = onUnmountUI;
usx.unmount = unmountUI;
usx.clear = clearUI;

export default usx;

let currentContext:any = {};

export function getContext<T>() {
    return currentContext as T;
}

export function withContext(newContext: object, callback:()=>void) {
    let savedContext = currentContext;
    try {
        currentContext = {};
        for (const k in savedContext) {
            currentContext[k] = savedContext[k];
        }
        for (const k in newContext) {
            currentContext[k] = newContext[k];
        }
        callback();
    } finally {
        currentContext = savedContext;
    }
}

interface StoreProps<T> {
    name: string;
    initialState:T;
    uiContexts?:UIUpdateContext[];
    onReset?:()=>void;
}

export class Store<T> {
    state:T
    devTools
    devToolsUnsubscribe
    
    constructor(readonly props: StoreProps<T>) {
        this.state = props.initialState;

        if (window["__REDUX_DEVTOOLS_EXTENSION__"]) {
            const serialInit = JSON.stringify(this.toJS(this.state));
            this.devTools = window["__REDUX_DEVTOOLS_EXTENSION__"].connect({
                name: props.name,
                features: {
                    persist: true, // persist states on page reloading
                    export: true, // export history of actions in a file
                    import: 'custom', // import history of actions from a file
                    jump: true, // jump back and forth (time travelling)
                    skip: false
                }
            });
            this.devTools.init(this.toJS(this.state));
            this.devToolsUnsubscribe = this.devTools.subscribe(message=>{
                if (message.type === "DISPATCH") {
                    switch (message.payload.type) {
                        case "RESET":
                            this._resetState(this.fromJS(JSON.parse(serialInit)));
                            this.devTools.init(this.toJS(this.state));
                            break;
                        case "COMMIT":
                            this.devTools.init(this.toJS(this.state));
                            break;
                        case "ROLLBACK":
                            this._resetState(this.fromJS(JSON.parse(message.state)));
                            this.devTools.init(this.toJS(this.state));
                            break;
                        case "JUMP_TO_STATE":
                        case "JUMP_TO_ACTION":
                            this._resetState(this.fromJS(JSON.parse(message.state)));
                            break;
                        case 'IMPORT_STATE': {
                            const { nextLiftedState } = message.payload;
                            const { computedStates } = nextLiftedState;
                            this._resetState(this.fromJS(computedStates[computedStates.length - 1].state));
                            this.devTools.send(null, nextLiftedState);
                            return;
                        }
                    }
                }
            });
        }
    }

    _dispatch(action:string) {
        if (this.devTools)
        this.devTools.send(action, this.toJS(this.state));
        if (this.props.uiContexts) {
            for (const ctx of this.props.uiContexts)
                ctx.dirty();
        }
    }

    _resetState(newState: T) {
        this.state = newState;
        if (this.props.onReset)
            this.props.onReset();
        usx.update();
    }

    toJS(state: T) {
        return state;
    }

    fromJS(json):T {
        return json;
    }

    close() {
        if (this.devToolsUnsubscribe) {
            this.devToolsUnsubscribe();
            delete this.devTools;
            delete this.devToolsUnsubscribe;
        }
    }

}
