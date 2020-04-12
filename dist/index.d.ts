declare type USXFunctionFactory = (props: object, children: USXChild[]) => USXChild;
declare type USXClassFactory<T> = {
    new (props: T): USXComponent<T>;
};
declare type USXChildItem = string | number | Element | USXComponent<any> | null;
declare type USXChild = USXChildItem | USXChildItem[];
declare type USXCallback = () => void;
export declare abstract class USXComponent<T> {
    readonly props: T;
    _render?: USXChild;
    constructor(props: T);
    abstract render(props: T, children: USXChild[]): USXChild;
}
declare function createContext(): {
    el: (factory: string | USXFunctionFactory | USXClassFactory<any>, props?: object, ...children: USXChild[]) => string | number | Element | SVGElement | USXComponent<any> | USXChildItem[];
    withDefaultProps: <T>(props: object, callback: () => T) => T;
    getDefaultProps: () => any;
    apply: (el: Element, fn: (...args: any[]) => void, ...args: any[]) => void;
    update: () => void;
    remove: (...elements: Element[]) => void;
    onRemove: (el: Element, fn: USXCallback) => void;
    createContext: typeof createContext;
    clear: () => void;
};
export declare const usx: {
    el: (factory: string | USXFunctionFactory | USXClassFactory<any>, props?: object, ...children: USXChild[]) => string | number | Element | SVGElement | USXComponent<any> | USXChildItem[];
    withDefaultProps: <T>(props: object, callback: () => T) => T;
    getDefaultProps: () => any;
    apply: (el: Element, fn: (...args: any[]) => void, ...args: any[]) => void;
    update: () => void;
    remove: (...elements: Element[]) => void;
    onRemove: (el: Element, fn: USXCallback) => void;
    createContext: typeof createContext;
    clear: () => void;
};
export {};
