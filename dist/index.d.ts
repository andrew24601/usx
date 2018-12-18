declare function createUIContext(): {
    (tag: any, props: any, ...children: any[]): any;
    create: typeof createUIContext;
    update: () => void;
    onUpdate: (el: Element, callback: (Element: any) => void) => void;
    onUnmount: (el: Element, callback: (Element: any) => void) => void;
    unmount: (el: Element) => void;
    forEach: (cb: (el: Element) => void) => void;
};
declare const usx: {
    (tag: any, props: any, ...children: any[]): any;
    create: typeof createUIContext;
    update: () => void;
    onUpdate: (el: Element, callback: (Element: any) => void) => void;
    onUnmount: (el: Element, callback: (Element: any) => void) => void;
    unmount: (el: Element) => void;
    forEach: (cb: (el: Element) => void) => void;
};
export default usx;
