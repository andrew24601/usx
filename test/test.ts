import assert from 'node:assert/strict';
import { after, afterEach, describe, it } from 'node:test';
import { dom } from './dom.js';
import {jsx, syncUI, onRemoveElement, removeUI, syncElement, syncText, Fragment} from "../src/index.js"
import {jsx as runtimeJsx, jsxs as runtimeJsxs, Fragment as RuntimeFragment} from "../src/jsx-runtime.js"
import {jsxDEV as runtimeJsxDEV, Fragment as RuntimeDevFragment} from "../src/jsx-dev-runtime.js"

const SVGNS = "http://www.w3.org/2000/svg";

function connect<T extends Node>(node: T): T {
    document.body.appendChild(node);
    return node;
}

afterEach(() => removeUI(Array.from(document.body.childNodes)));
after(() => dom.window.close());

interface MyButtonProps {
    children: any[];
}

function MyButton({children}: MyButtonProps) {
    return jsx('button', {class: 'my-button', children});
}

function BooleanContent({visible}: {visible: boolean}) {
    return visible && jsx('span', {children: 'visible'});
}

describe('Simple usx test', ()=>{
    it('exports the automatic JSX runtime', () => {
        const el = runtimeJsx('div', {children: 'Hello'}) as HTMLDivElement;
        const children = runtimeJsxs('span', {children: ['Hello', ' world']}) as HTMLSpanElement;
        const fragment = RuntimeFragment({children: [el, children]});
        const devElement = runtimeJsxDEV('strong', {children: 'Dev'}) as HTMLElement;
        const devFragment = RuntimeDevFragment({children: devElement});

        assert.equal(fragment.textContent, 'HelloHello world');
        assert.equal(devFragment.textContent, 'Dev');
    })
    it('construct div', () => {
        const el = jsx('div');
        assert.ok(el instanceof HTMLElement);
    })
    it('construct div with simple attributes', () => {
        const el = jsx('div', {class: 'my-div', id: 'div1'}) as HTMLDivElement;
        assert.equal(el.className, 'my-div');
        assert.equal(el.id, 'div1');
    })
    it('ignores inherited properties', () => {
        const props = Object.assign(Object.create({title: 'inherited'}), {id: 'own'});
        const el = jsx('div', props) as HTMLDivElement;

        assert.equal(el.id, 'own');
        assert.equal(el.hasAttribute('title'), false);
    })
    it('construct div with null attributes', () => {
        const el = jsx('div', {class: 'my-div', id: null}) as HTMLDivElement;
        assert.equal(el.outerHTML, '<div class="my-div"></div>');
    })
    it('construct div with null content', () => {
        const el = jsx('div', {class: 'my-div', id: null, children:["Hello ", null, "world"]}) as HTMLDivElement;
        assert.equal(el.textContent, 'Hello world');
    })
    it('construct div with style', () => {
        const el = jsx('div', {class: 'my-div', id: 'div1', style: {fontWeight: "bold"}}) as HTMLDivElement;
        assert.equal(el.className, 'my-div');
        assert.equal(el.id, 'div1');
        assert.equal(el.style.fontWeight, "bold");
    })
    it('adds pixels to numeric dimensional styles', () => {
        const el = jsx('div', {style: {fontSize: 12}}) as HTMLDivElement;
        assert.equal(el.style.fontSize, '12px');
    })
    it('adds pixels to numeric logical, spacing, and height styles', () => {
        const el = jsx('div', {style: {minHeight: 12, marginInlineStart: 4, gap: 8, letterSpacing: 2, opacity: 0.5}}) as HTMLDivElement;
        assert.equal(el.style.minHeight, '12px');
        assert.equal(el.style.marginInlineStart, '4px');
        assert.equal(el.style.gap, '8px');
        assert.equal(el.style.letterSpacing, '2px');
        assert.equal(el.style.opacity, '0.5');
    })
    it('construct div with computed style', () => {
        let isBold = true;
        const el = connect(jsx('div', {class: 'my-div', id: 'div1', style: {fontWeight: ()=>isBold ? "bold" : "normal"}}) as HTMLDivElement);
        assert.equal(el.className, 'my-div');
        assert.equal(el.id, 'div1');
        assert.equal(el.style.fontWeight, "bold");
        isBold = false;
        syncUI();
        assert.equal(el.style.fontWeight, "normal");
    })
    it('construct div with reset computed style', () => {
        let isBold = true;
        const el = connect(jsx('div', {class: 'my-div', id: 'div1', style: {fontWeight: ()=>isBold ? "bold" : null}}) as HTMLDivElement);
        assert.equal(el.className, 'my-div');
        assert.equal(el.id, 'div1');
        assert.equal(el.style.fontWeight, "bold");
        isBold = false;
        syncUI();
        assert.equal(el.style.fontWeight, "");
    })
    it('construct div with a computed style object', () => {
        let compact = false;
        const el = connect(jsx('div', {style: () => compact ? {width: 20} : {width: 40, height: 10}}) as HTMLDivElement);
        assert.equal(el.style.width, '40px');
        assert.equal(el.style.height, '10px');
        compact = true;
        syncUI();
        assert.equal(el.style.width, '20px');
        assert.equal(el.style.height, '');
    })
    it('construct div with bad style', () => {
        const el = jsx('div', {class: 'my-div', id: 'div1', style: 12}) as HTMLDivElement;
        assert.equal(el.className, 'my-div');
        assert.equal(el.id, 'div1');
    })
    it('construct div with content', () => {
        const el = jsx('div', {class: 'my-div', id: 'div1', children: ['Hello world']}) as HTMLDivElement;
        assert.equal(el.textContent, 'Hello world');
    })
    it('construct div with numeric content', () => {
        const el = jsx('div', {class: 'my-div', id: 'div1', children: 12}) as HTMLDivElement;
        assert.equal(el.textContent, '12');
    })
    it('ignores boolean content', () => {
        const el = jsx('div', {children: [true, 'Hello', false]}) as HTMLDivElement;
        assert.equal(el.outerHTML, '<div>Hello</div>');
    })
    it('construct div with mutiple content', () => {
        const el = jsx('div', {class: 'my-div', id: 'div1', children: ['Hello ', 'world']}) as HTMLDivElement;
        assert.equal(el.textContent, 'Hello world');
    })
    it('construct div with nested mutiple content', () => {
        const el = jsx('div', {class: 'my-div', id: 'div1', children: ['Hello ', ['world']]}) as HTMLDivElement;
        assert.equal(el.textContent, 'Hello world');
    })
    it('construct nested divs', ()=>{
        const el = jsx('div', {children: [jsx('div', {children: ['nested']})]}) as HTMLDivElement;
        assert.equal(el.outerHTML, '<div><div>nested</div></div>');
    })
    it('construct link with click handler', () => {
        let clickCount = 0;
        const el = jsx('a', {class:'linky', href:' #', "on-click": ()=>clickCount++, children: 'Click me'});

        el.click();
        assert.equal(clickCount, 1);
        removeUI(el);
    }),
    it('construct link with bad click handler', () => {
        let clickCount = 0;
        const el = jsx('a', {class:'linky', href:' #', "on-click": "clicky", children: ['Click me']});

        el.click();
        assert.equal(clickCount, 0);
        assert.equal(el.hasAttribute('on-click'), false);
        removeUI(el);
    }),
    it('uses exact native and custom event names', () => {
        let doubleClicks = 0;
        let customEvents = 0;
        let listenerThis: Element | undefined;
        const el = jsx('div', {
            "on-dblclick": () => doubleClicks++,
            "on-CaseSensitive": function (this: Element) {
                listenerThis = this;
                customEvents++;
            }
        }) as HTMLDivElement;

        el.dispatchEvent(new Event('dblclick'));
        el.dispatchEvent(new CustomEvent('casesensitive'));
        el.dispatchEvent(new CustomEvent('CaseSensitive'));
        assert.equal(doubleClicks, 1);
        assert.equal(customEvents, 1);
        assert.equal(listenerThis, el);
        removeUI(el);
    }),
    it('removes event listeners when disposed', () => {
        let clickCount = 0;
        const el = connect(jsx('button', {"on-click": () => clickCount++}) as HTMLButtonElement);

        el.click();
        assert.equal(clickCount, 1);

        removeUI(el);
        connect(el);
        el.click();
        assert.equal(clickCount, 1);
    }),
    it('direct attribute test', ()=>{
        let isChecked = false;
        const el = connect(jsx('input', {type: 'checkbox', checked: ()=>isChecked}) as HTMLInputElement);
        assert.equal(el.checked, false);
        isChecked = true;
        syncUI();
        assert.equal(el.checked, true);
    }),
    it('handles static and computed boolean properties', ()=>{
        let required = false;
        const el = connect(jsx('input', {disabled: false, required: () => required}) as HTMLInputElement);
        assert.equal(el.disabled, false);
        assert.equal(el.hasAttribute('disabled'), false);
        assert.equal(el.required, false);
        required = true;
        syncUI();
        assert.equal(el.required, true);
    }),
    it('clear attribute test', ()=>{
        let className: string | null = "my-div";
        const el = connect(jsx('div', {class: ()=>className, id: null}) as HTMLDivElement);
        assert.equal(el.hasAttribute('class'), true);
        assert.equal(el.className, 'my-div');
        className = null;
        syncUI();
        assert.equal(el.hasAttribute('class'), false);
    })
    it("simple fragment", ()=>{
        const frag = Fragment({children: ['Hello ', 'world']}) as DocumentFragment;
        assert.ok(frag instanceof DocumentFragment);
        const el = jsx('div', {children: frag}) as HTMLDivElement;
        assert.equal(el.textContent, 'Hello world');
        assert.equal(el.outerHTML, '<div>Hello world</div>');
    })
});

describe('SVG content test', ()=>{
    it('construct circle', () => {
        const el = jsx('circle', {cx: 50, cy: 50, r: 50}) as SVGCircleElement;
        assert.equal(el.namespaceURI, SVGNS);
    })
    it('constructs additional SVG elements', () => {
        for (const tag of ['ellipse', 'clipPath', 'foreignObject', 'symbol', 'use', 'tspan']) {
            const el = jsx(tag) as SVGElement;
            assert.equal(el.namespaceURI, SVGNS, tag);
        }
    })
});

describe('Function component test', ()=>{
    it('construct function component', ()=>{
        const el = jsx(MyButton, {children: ['Hello world']}) as HTMLButtonElement;
        assert.equal(el.outerHTML, '<button class="my-button">Hello world</button>');
    })
    it('nests function components', ()=>{
        const wrapper = jsx('div', {children: jsx(MyButton, {children: ['Hello']})}) as HTMLDivElement;
        assert.equal(wrapper.outerHTML, '<div><button class="my-button">Hello</button></div>');
    })
    it('can render boolean content', ()=>{
        const wrapper = jsx('div', {children: [
            jsx(BooleanContent, {visible: false}),
            jsx(BooleanContent, {visible: true})
        ]}) as HTMLDivElement;
        assert.equal(wrapper.outerHTML, '<div><span>visible</span></div>');
    })
});

describe('Synchronized text', ()=>{
    it('creates a text node and synchronizes evaluated values', ()=>{
        let value: string | number | boolean | null | undefined = "first";
        const node = syncText(() => value);
        const wrapper = connect(jsx('div', {children: ['Value: ', node]}) as HTMLDivElement);

        assert.ok(node instanceof Text);
        assert.equal(wrapper.textContent, 'Value: first');

        value = 12;
        syncUI();
        assert.equal(wrapper.textContent, 'Value: 12');

        for (const emptyValue of [true, false, null, undefined]) {
            value = emptyValue;
            syncUI();
            assert.equal(wrapper.textContent, 'Value: ');
        }
    })

    it('pauses while disconnected and is disposed with its ancestor', ()=>{
        let value = "first";
        const node = syncText(() => value);
        const wrapper = jsx('div', {children: node}) as HTMLDivElement;

        value = "second";
        syncUI();
        assert.equal(node.data, "first");

        connect(wrapper);
        syncUI();
        assert.equal(node.data, "second");

        removeUI(wrapper);
        value = "third";
        connect(node);
        syncUI();
        assert.equal(node.data, "second");
    })
});

describe('Evaluated content', ()=>{
    for (const property of ['textContent', 'innerHTML'] as const) {
        it(`disposes descendants replaced by reactive ${property}`, ()=>{
            let content = "before";
            let childTitle = "first";
            let childRemoved = false;
            const child = jsx('span', {title: () => childTitle}) as HTMLSpanElement;
            onRemoveElement(child, () => childRemoved = true);
            const parent = connect(jsx('div', {
                [property]: () => content,
                children: child
            }) as HTMLDivElement);

            content = property === 'innerHTML' ? '<strong>after</strong>' : 'after';
            syncUI();
            assert.equal(childRemoved, true);

            childTitle = "second";
            connect(child);
            syncUI();
            assert.equal(child.title, "first");

            removeUI(parent, child);
        })
    }

    it('evaluated attribute', ()=>{
        let myId = "div1";
        const el = connect(jsx('div', {class: 'my-div', id: ()=>myId}) as HTMLDivElement);
        assert.equal(el.className, 'my-div');
        assert.equal(el.id, 'div1');
        myId = "div2";
        syncUI();
        assert.equal(el.id, 'div2');
    }),
    it('evaluated attributes', ()=>{
        let myId = "div1";
        let myClass = "my-div";
        const el = connect(jsx('div', {class: ()=>myClass, id: ()=>myId}) as HTMLDivElement);
        assert.equal(el.className, 'my-div');
        assert.equal(el.id, 'div1');
        myId = "div2";
        myClass = "my-div2";
        syncUI();
        assert.equal(el.id, 'div2');
        assert.equal(el.className, 'my-div2');
    }),
    it("synchronizes without inputs", ()=>{
        let myId = "div1";
        const el = connect(jsx('div', {class: 'my-div', id: ()=>myId}) as HTMLDivElement);
        let wasUpdated = false;
        assert.equal(el.className, 'my-div');
        assert.equal(el.id, 'div1');

        syncElement(el, [], ()=>{
            wasUpdated = true;
        });

        myId = "div2";
        syncUI();
        assert.equal(el.id, 'div2');
        assert.equal(wasUpdated, true);
    }),
    it("synchronizes evaluated inputs", ()=>{
        let myId = "div1";
        const el = connect(jsx('div', {class: 'my-div', id: ()=>myId}) as HTMLDivElement);
        let wasUpdated = false;
        assert.equal(el.className, 'my-div');
        assert.equal(el.id, 'div1');

        let computedParam2 = 321;

        syncElement(el, [123, ()=>computedParam2], (param, param2)=>{
            assert.equal(param, 123);
            assert.equal(param2, 321);
            wasUpdated = true;
        });

        myId = "div2";
        syncUI();
        assert.equal(el.id, 'div2');
        assert.equal(wasUpdated, true);
    }),
    it("syncElement applies immediately and latches computed inputs", ()=>{
        const el = connect(jsx('div') as HTMLDivElement);
        let value = "first";
        const updates: string[] = [];

        syncElement(el, [() => value], nextValue => {
            updates.push(nextValue);
        });

        assert.deepEqual(updates, ["first"]);
        syncUI();
        assert.deepEqual(updates, ["first"]);

        value = "second";
        syncUI();
        syncUI();
        assert.deepEqual(updates, ["first", "second"]);
    }),
    it("pauses synchronization while disconnected and resumes when reconnected", ()=>{
        let value = "first";
        const el = jsx('div', {title: () => value}) as HTMLDivElement;

        assert.equal(el.title, "first");
        value = "second";
        syncUI();
        assert.equal(el.title, "first");

        connect(el);
        syncUI();
        assert.equal(el.title, "second");

        el.remove();
        value = "third";
        syncUI();
        assert.equal(el.title, "second");

        connect(el);
        syncUI();
        assert.equal(el.title, "third");
    }),
    it("syncElement without inputs applies immediately and on every sync", ()=>{
        const el = connect(jsx('div') as HTMLDivElement);
        let updateCount = 0;

        syncElement(el, [], () => updateCount++);
        assert.equal(updateCount, 1);

        syncUI();
        syncUI();
        assert.equal(updateCount, 3);
    }),
    it('unmount', ()=>{
        let myId = "div1";
        const el = connect(jsx('div', {class: 'my-div', id: ()=>myId}) as HTMLDivElement);
        assert.equal(el.className, 'my-div');
        assert.equal(el.id, 'div1');
        removeUI(el);
        myId = "div2";
        syncUI();
        assert.equal(el.id, 'div1');
    }),
    it('unmount from parent', ()=>{
        let myId = "div1";
        const el = jsx('div', {class: 'my-div', id: ()=>myId}) as HTMLDivElement;
        const root = connect(jsx("div", {class: 'my-div', name: "fred", children: [el]}) as HTMLDivElement);

        assert.equal(el.className, 'my-div');
        assert.equal(el.id, 'div1');

        let wasUnmounted = false;
        onRemoveElement(el, ()=>{
            wasUnmounted = true;
        })

        removeUI(el);
        myId = "div2";
        syncUI();
        assert.equal(el.id, 'div1');
        assert.equal(wasUnmounted, true);
        assert.equal(el.parentElement, null);
    }),
    it('unmount', ()=>{
        let myId = "div1";
        const el = jsx('div', {class: 'my-div', id: ()=>myId}) as HTMLDivElement;
        const root = connect(jsx("div", {class: 'my-div', name: "fred", children: [el]}) as HTMLDivElement);
        assert.equal(el.className, 'my-div');
        assert.equal(el.id, 'div1');

        let wasUnmounted = false;
        onRemoveElement(el, ()=>{
            wasUnmounted = true;
        })

        removeUI(root);
        myId = "div2";
        syncUI();
        assert.equal(el.id, 'div1');
        assert.equal(wasUnmounted, true);
    });

    it('continues child-first cleanup after a callback throws', ()=>{
        const calls: string[] = [];
        const child = jsx('span') as HTMLSpanElement;
        const parent = connect(jsx('div', {children: child}) as HTMLDivElement);

        onRemoveElement(child, () => {
            calls.push('child error');
            throw new Error('cleanup failed');
        });
        onRemoveElement(child, () => calls.push('child complete'));
        onRemoveElement(parent, () => calls.push('parent'));

        assert.throws(() => removeUI(parent), /cleanup failed/);
        assert.deepEqual(calls, ['child error', 'child complete', 'parent']);
    });
});

describe('nested syncUI', ()=>{
    it ('nest', ()=>{
        let invokeCount = 0;
        const el = jsx('div', { "on-MyTestEvent":()=>{
            invokeCount++;
        } }) as HTMLDivElement;
        const el2 = connect(jsx('div') as HTMLDivElement);
        syncElement(el2, [], ()=>{
            el.dispatchEvent(new CustomEvent("MyTestEvent"));
        });
        assert.equal(invokeCount, 1);
        syncUI();
        assert.equal(invokeCount, 2);
    })
});
