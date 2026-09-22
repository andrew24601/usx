import type { USXFunctionFactory, USXIntrinsicProps } from "./index.js";

export { jsx as jsxDEV } from "./index.js";
export { Fragment } from "./index.js";

export namespace JSX {
    export type Element = Node;
    export type ElementType = keyof IntrinsicElements | USXFunctionFactory<any>;

    export interface ElementChildrenAttribute {
        children: {};
    }

    export interface IntrinsicElements {
        [name: string]: USXIntrinsicProps;
    }
}
