export declare const matchPx: RegExp;
declare type USXElement = Node | string | Component<any> | Array<any>;
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
};
export default usx;
