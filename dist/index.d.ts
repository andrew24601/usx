export declare function enableDebugging(): void;
export declare function updateUI(): void;
export declare function action<T>(fn: () => T): T;
export declare function unmount(el: Element): void;
export declare function onUpdate(el: Element, callback: (Element: any) => void): void;
export default function usx(tag: any, props: any, ...children: any[]): any;
