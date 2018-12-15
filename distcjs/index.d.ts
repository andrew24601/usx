export declare function createUIContext(): {
    usx: (tag: any, props: any, ...children: any[]) => any;
    updateUI: () => void;
    onUpdateUI: (el: Element, callback: (Element: any) => void) => void;
    onUnmountUI: (el: Element, callback: (Element: any) => void) => void;
    forEachUI: (cb: (el: Element) => void) => void;
    unmountUI: (el: Element) => void;
};
export declare const defaultContext: {
    usx: (tag: any, props: any, ...children: any[]) => any;
    updateUI: () => void;
    onUpdateUI: (el: Element, callback: (Element: any) => void) => void;
    onUnmountUI: (el: Element, callback: (Element: any) => void) => void;
    forEachUI: (cb: (el: Element) => void) => void;
    unmountUI: (el: Element) => void;
};
export declare const updateUI: () => void;
export declare const onUpdateUI: (el: Element, callback: (Element: any) => void) => void;
export declare const onUnmountUI: (el: Element, callback: (Element: any) => void) => void;
export declare const forEachUI: (cb: (el: Element) => void) => void;
export declare const unmountUI: (el: Element) => void;
declare const usx: (tag: any, props: any, ...children: any[]) => any;
export default usx;
