export declare function enableDebugging(setting?: boolean): void;
export declare function createContext(): {
    usx: (tag: any, props: any, ...children: any[]) => any;
    updateUI: () => void;
    onUpdateEl: (el: Element, callback: (Element: any) => void) => void;
    onUnmountEl: (el: Element, callback: (Element: any) => void) => void;
    unmount: (el: Element) => void;
    action: <T>(fn: () => T) => T;
};
export declare const defaultContext: {
    usx: (tag: any, props: any, ...children: any[]) => any;
    updateUI: () => void;
    onUpdateEl: (el: Element, callback: (Element: any) => void) => void;
    onUnmountEl: (el: Element, callback: (Element: any) => void) => void;
    unmount: (el: Element) => void;
    action: <T>(fn: () => T) => T;
};
export declare const updateUI: () => void;
export declare const onUpdateEl: (el: Element, callback: (Element: any) => void) => void;
export declare const onUnmountEl: (el: Element, callback: (Element: any) => void) => void;
export declare const unmount: (el: Element) => void;
export declare const action: <T>(fn: () => T) => T;
declare const usx: (tag: any, props: any, ...children: any[]) => any;
export default usx;
