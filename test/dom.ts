import { JSDOM } from "jsdom";

export const dom = new JSDOM("<!doctype html><html><body></body></html>");

Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    Node: dom.window.Node,
    Element: dom.window.Element,
    HTMLElement: dom.window.HTMLElement,
    DocumentFragment: dom.window.DocumentFragment,
    Text: dom.window.Text,
    Event: dom.window.Event,
    CustomEvent: dom.window.CustomEvent
});
