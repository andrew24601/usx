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
declare function createUIContext(): {
    (tag: "div", props: any, ...children: any[]): HTMLDivElement;
    (tag: "span", props: any, ...children: any[]): HTMLSpanElement;
    (tag: "a", props: any, ...children: any[]): HTMLAnchorElement;
    (tag: "input", props: any, ...children: any[]): HTMLInputElement;
    (tag: "script", props: any, ...children: any[]): HTMLScriptElement;
    (tag: "select", props: any, ...children: any[]): HTMLSelectElement;
    (tag: "option", props: any, ...children: any[]): HTMLOptionElement;
    (tag: "form", props: any, ...children: any[]): HTMLFormElement;
    <T, U>(tag: ComponentFactory<T, U>, props: T, ...children: any[]): U;
    create: typeof createUIContext;
    update: () => void;
    onUpdate: (el: Element, callback: (Element: any) => void) => void;
    onUnmount: (el: Element, callback: (Element: any) => void) => void;
    unmount: (el: Element) => void;
    forEach: (cb: (el: Element) => void) => void;
    clear: () => void;
    on: (el: Element, action: string, callback: (...args: any[]) => void) => void;
    trigger: (action: string, ...params: any[]) => void;
    style: {
        (clause: string, styles: StyleDefinition): StylesheetClass;
        (styles: StyleDefinition): StylesheetClass;
    };
};
declare const usx: {
    (tag: "div", props: any, ...children: any[]): HTMLDivElement;
    (tag: "span", props: any, ...children: any[]): HTMLSpanElement;
    (tag: "a", props: any, ...children: any[]): HTMLAnchorElement;
    (tag: "input", props: any, ...children: any[]): HTMLInputElement;
    (tag: "script", props: any, ...children: any[]): HTMLScriptElement;
    (tag: "select", props: any, ...children: any[]): HTMLSelectElement;
    (tag: "option", props: any, ...children: any[]): HTMLOptionElement;
    (tag: "form", props: any, ...children: any[]): HTMLFormElement;
    <T, U>(tag: ComponentFactory<T, U>, props: T, ...children: any[]): U;
    create: typeof createUIContext;
    update: () => void;
    onUpdate: (el: Element, callback: (Element: any) => void) => void;
    onUnmount: (el: Element, callback: (Element: any) => void) => void;
    unmount: (el: Element) => void;
    forEach: (cb: (el: Element) => void) => void;
    clear: () => void;
    on: (el: Element, action: string, callback: (...args: any[]) => void) => void;
    trigger: (action: string, ...params: any[]) => void;
    style: {
        (clause: string, styles: StyleDefinition): StylesheetClass;
        (styles: StyleDefinition): StylesheetClass;
    };
};
export default usx;
