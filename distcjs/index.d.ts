export declare const matchPx: RegExp;
declare type USXStaticElement = Node | string | Component<any> | Array<any>;
declare type USXDynamicElement = () => USXStaticElement;
declare type USXElement = USXStaticElement | USXDynamicElement;
interface ComponentFactory<T, U> {
    new (props: T, children: USXElement[]): U;
}
export declare abstract class Component<T> {
    readonly props: T;
    readonly children: USXElement[];
    _render: USXElement;
    constructor(props: T, children: USXElement[]);
    abstract render(props: T, children: USXElement[]): USXElement;
}
declare class StylesheetClass {
    readonly className: string;
    readonly clause: string;
    private styleNode;
    private _pieces;
    private _updates;
    constructor(className: string, clause: string, defn: StyleDefinition, styleNode: Text);
    writeClause(idx: number, cssKey: string, k: string, val: string | number): void;
    compileClause(k: string, v: StyleValue): void;
    compileDefinition(defn: StyleDefinition): void;
    withSubRule(clause: string, defn: StyleDefinition): this;
    withMediaQuery(condition: StyleDefinition, defn: StyleDefinition): this;
    _update(): void;
}
declare type StyleValue = string | number | (() => string) | (() => number);
declare type StyleDefinition = {
    [index: string]: StyleValue;
};
export declare class UIUpdateContext {
    _dirty: boolean;
    dirty(): void;
}
declare function updateUI(): void;
declare function unmountUI(el: Element): void;
declare function clearUI(): void;
export declare function usxStyle(clause: string, styles: StyleDefinition): StylesheetClass;
export declare function usxStyle(styles: StyleDefinition): StylesheetClass;
declare function onUpdateUI(el: Element, callback: () => void): void;
declare function onUnmountUI(el: Element, callback: () => void): void;
declare function usx(tag: "div", props: any, ...children: any[]): HTMLDivElement;
declare namespace usx {
    var update: typeof updateUI;
    var onUpdate: typeof onUpdateUI;
    var onUnmount: typeof onUnmountUI;
    var unmount: typeof unmountUI;
    var clear: typeof clearUI;
}
declare function usx(tag: "span", props: any, ...children: any[]): HTMLSpanElement;
declare namespace usx {
    var update: typeof updateUI;
    var onUpdate: typeof onUpdateUI;
    var onUnmount: typeof onUnmountUI;
    var unmount: typeof unmountUI;
    var clear: typeof clearUI;
}
declare function usx(tag: "a", props: any, ...children: any[]): HTMLAnchorElement;
declare namespace usx {
    var update: typeof updateUI;
    var onUpdate: typeof onUpdateUI;
    var onUnmount: typeof onUnmountUI;
    var unmount: typeof unmountUI;
    var clear: typeof clearUI;
}
declare function usx(tag: "input", props: any, ...children: any[]): HTMLInputElement;
declare namespace usx {
    var update: typeof updateUI;
    var onUpdate: typeof onUpdateUI;
    var onUnmount: typeof onUnmountUI;
    var unmount: typeof unmountUI;
    var clear: typeof clearUI;
}
declare function usx(tag: "script", props: any, ...children: any[]): HTMLScriptElement;
declare namespace usx {
    var update: typeof updateUI;
    var onUpdate: typeof onUpdateUI;
    var onUnmount: typeof onUnmountUI;
    var unmount: typeof unmountUI;
    var clear: typeof clearUI;
}
declare function usx(tag: "select", props: any, ...children: any[]): HTMLSelectElement;
declare namespace usx {
    var update: typeof updateUI;
    var onUpdate: typeof onUpdateUI;
    var onUnmount: typeof onUnmountUI;
    var unmount: typeof unmountUI;
    var clear: typeof clearUI;
}
declare function usx(tag: "option", props: any, ...children: any[]): HTMLOptionElement;
declare namespace usx {
    var update: typeof updateUI;
    var onUpdate: typeof onUpdateUI;
    var onUnmount: typeof onUnmountUI;
    var unmount: typeof unmountUI;
    var clear: typeof clearUI;
}
declare function usx(tag: "form", props: any, ...children: any[]): HTMLFormElement;
declare namespace usx {
    var update: typeof updateUI;
    var onUpdate: typeof onUpdateUI;
    var onUnmount: typeof onUnmountUI;
    var unmount: typeof unmountUI;
    var clear: typeof clearUI;
}
declare function usx<T, U>(tag: ComponentFactory<T, U>, props: T, ...children: any[]): U;
declare namespace usx {
    var update: typeof updateUI;
    var onUpdate: typeof onUpdateUI;
    var onUnmount: typeof onUnmountUI;
    var unmount: typeof unmountUI;
    var clear: typeof clearUI;
}
export default usx;
export declare function getContext<T>(): T;
export declare function withContext(newContext: object, callback: () => void): void;
interface StoreProps<T> {
    name: string;
    initialState: T;
    uiContexts?: UIUpdateContext[];
    onReset?: () => void;
}
export declare class Store<T> {
    readonly props: StoreProps<T>;
    state: T;
    devTools: any;
    devToolsUnsubscribe: any;
    constructor(props: StoreProps<T>);
    _dispatch(action: string): void;
    _resetState(newState: T): void;
    toJS(state: T): T;
    fromJS(json: any): T;
    close(): void;
}
