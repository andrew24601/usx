type USXFunctionFactory<T extends object> = (props: T) => USXChildren;
type USXClassFactory<T> = {
    new (props: T): USXComponent<T>;
};
type USXChildItem = string | number | Element | USXComponent<any> | null;
type USXChildren = USXChildItem | USXChildItem[];
type USXEventCallback = () => void;
export declare abstract class USXComponent<T> {
    readonly props: T;
    _render?: USXChildren;
    constructor(props: T);
    abstract render(props: T): USXChildren;
}
export declare function jsx<T extends object>(factory: string | USXFunctionFactory<T> | USXClassFactory<T>, props?: T | null): USXChildren;
export declare function Fragment(props: any): DocumentFragment;
export declare function withDefaultProps<T>(props: object, callback: () => T): T;
export declare function applyUI(el: Element, fn: (...args: any[]) => void, ...args: any[]): void;
export declare function onRemoveUI(el: Element, fn: USXEventCallback): void;
export declare function removeUI(...elements: Element[]): void;
export declare function getDefaultPropsUI(): any;
export declare function updateUI(): void;
export declare function resetUIBindings(): void;
export {};
