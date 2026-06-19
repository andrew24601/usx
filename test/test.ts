import 'jsdom-global/register.js';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import {jsx, USXComponent, updateUI, onRemoveElement, removeUI, applyElement, Fragment} from "../src/index.js"

const SVGNS = "http://www.w3.org/2000/svg";

interface MyButtonProps {
    children: any[];
}

function MyButton({children}: MyButtonProps) {
    return jsx('button', {class: 'my-button', children});
}

describe('Simple usx test', ()=>{
    it('construct div', () => {
        const el = jsx('div');
        expect(el).is.instanceOf(HTMLElement);
    })
    it('construct div with simple attributes', () => {
        const el = jsx('div', {class: 'my-div', id: 'div1'}) as HTMLDivElement;
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
    })
    it('construct div with null attributes', () => {
        const el = jsx('div', {class: 'my-div', id: null}) as HTMLDivElement;
        expect(el.outerHTML).to.equal('<div class="my-div"></div>')
    })
    it('construct div with null content', () => {
        const el = jsx('div', {class: 'my-div', id: null, children:["Hello ", null, "world"]}) as HTMLDivElement;
        expect(el.textContent).to.equal('Hello world')
    })
    it('construct div with style', () => {
        const el = jsx('div', {class: 'my-div', id: 'div1', style: {fontWeight: "bold"}}) as HTMLDivElement;
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
        expect(el.style.fontWeight).to.equal("bold");
    })
    it('adds pixels to numeric dimensional styles', () => {
        const el = jsx('div', {style: {fontSize: 12}}) as HTMLDivElement;
        expect(el.style.fontSize).to.equal('12px');
    })
    it('adds pixels to numeric logical, spacing, and height styles', () => {
        const el = jsx('div', {style: {minHeight: 12, marginInlineStart: 4, gap: 8, letterSpacing: 2, opacity: 0.5}}) as HTMLDivElement;
        expect(el.style.minHeight).to.equal('12px');
        expect(el.style.marginInlineStart).to.equal('4px');
        expect(el.style.gap).to.equal('8px');
        expect(el.style.letterSpacing).to.equal('2px');
        expect(el.style.opacity).to.equal('0.5');
    })
    it('construct div with computed style', () => {
        let isBold = true;
        const el = jsx('div', {class: 'my-div', id: 'div1', style: {fontWeight: ()=>isBold ? "bold" : "normal"}}) as HTMLDivElement;
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
        expect(el.style.fontWeight).to.equal("bold");
        isBold = false;
        updateUI();
        expect(el.style.fontWeight).to.equal("normal");
    })
    it('construct div with reset computed style', () => {
        let isBold = true;
        const el = jsx('div', {class: 'my-div', id: 'div1', style: {fontWeight: ()=>isBold ? "bold" : null}}) as HTMLDivElement;
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
        expect(el.style.fontWeight).to.equal("bold");
        isBold = false;
        updateUI();
        expect(el.style.fontWeight).to.equal("");
    })
    it('construct div with a computed style object', () => {
        let compact = false;
        const el = jsx('div', {style: () => compact ? {width: 20} : {width: 40, height: 10}}) as HTMLDivElement;
        expect(el.style.width).to.equal('40px');
        expect(el.style.height).to.equal('10px');
        compact = true;
        updateUI();
        expect(el.style.width).to.equal('20px');
        expect(el.style.height).to.equal('');
    })
    it('construct div with bad style', () => {
        const el = jsx('div', {class: 'my-div', id: 'div1', style: 12}) as HTMLDivElement;
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
    })
    it('construct div with content', () => {
        const el = jsx('div', {class: 'my-div', id: 'div1', children: ['Hello world']}) as HTMLDivElement;
        expect(el.textContent).to.equal('Hello world');
    })
    it('construct div with numeric content', () => {
        const el = jsx('div', {class: 'my-div', id: 'div1', children: 12}) as HTMLDivElement;
        expect(el.textContent).to.equal('12');
    })
    it('ignores boolean content', () => {
        const el = jsx('div', {children: [true, 'Hello', false]}) as HTMLDivElement;
        expect(el.outerHTML).to.equal('<div>Hello</div>');
    })
    it('construct div with mutiple content', () => {
        const el = jsx('div', {class: 'my-div', id: 'div1', children: ['Hello ', 'world']}) as HTMLDivElement;
        expect(el.textContent).to.equal('Hello world');
    })
    it('construct div with nested mutiple content', () => {
        const el = jsx('div', {class: 'my-div', id: 'div1', children: ['Hello ', ['world']]}) as HTMLDivElement;
        expect(el.textContent).to.equal('Hello world');
    })
    it('construct nested divs', ()=>{
        const el = jsx('div', {children: [jsx('div', {children: ['nested']})]}) as HTMLDivElement;
        expect(el.outerHTML).to.equal('<div><div>nested</div></div>')
    })
    it('construct link with click handler', () => {
        let clickCount = 0;
        const el = jsx('a', {class:'linky', href:' #', "on-click": ()=>clickCount++, children: 'Click me'}) as HTMLLinkElement;

        el.click();
        expect(clickCount).to.equal(1);
    }),
    it('construct link with bad click handler', () => {
        let clickCount = 0;
        const el = jsx('a', {class:'linky', href:' #', "on-click": "clicky", children: ['Click me']}) as HTMLLinkElement;

        el.click();
        expect(clickCount).to.equal(0);
        expect(el.hasAttribute('on-click')).to.equal(false);
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
        expect(doubleClicks).to.equal(1);
        expect(customEvents).to.equal(1);
        expect(listenerThis).to.equal(el);
    }),
    it('direct attribute test', ()=>{
        let isChecked = false;
        const el = jsx('input', {type: 'checkbox', checked: ()=>isChecked}) as HTMLInputElement;
        expect(el.checked).to.equal(false);
        isChecked = true;
        updateUI();
        expect(el.checked).to.equal(true);
    }),
    it('handles static and computed boolean properties', ()=>{
        let required = false;
        const el = jsx('input', {disabled: false, required: () => required}) as HTMLInputElement;
        expect(el.disabled).to.equal(false);
        expect(el.hasAttribute('disabled')).to.equal(false);
        expect(el.required).to.equal(false);
        required = true;
        updateUI();
        expect(el.required).to.equal(true);
    }),
    it('clear attribute test', ()=>{
        let className: string | null = "my-div";
        const el = jsx('div', {class: ()=>className, id: null}) as HTMLDivElement;
        expect(el.hasAttribute('class')).to.equal(true);
        expect(el.className).to.equal('my-div');
        className = null;
        updateUI();
        expect(el.hasAttribute('class')).to.equal(false);
    })
    it("simple fragment", ()=>{
        const frag = Fragment({children: ['Hello ', 'world']}) as DocumentFragment;
        expect(frag).to.be.instanceOf(DocumentFragment);
        const el = jsx('div', {children: frag}) as HTMLDivElement;
        expect(el.textContent).to.equal('Hello world');
        expect(el.outerHTML).to.equal('<div>Hello world</div>');
    })
});

describe('SVG content test', ()=>{
    it('construct circle', () => {
        const el = jsx('circle', {cx: 50, cy: 50, r: 50}) as SVGCircleElement;
        expect(el.namespaceURI).to.equal(SVGNS);
    })
    it('constructs additional SVG elements', () => {
        for (const tag of ['ellipse', 'clipPath', 'foreignObject', 'symbol', 'use', 'tspan']) {
            const el = jsx(tag) as SVGElement;
            expect(el.namespaceURI, tag).to.equal(SVGNS);
        }
    })
});

describe('Function component test', ()=>{
    it('construct function component', ()=>{
        const el = jsx(MyButton, {children: ['Hello world']}) as HTMLButtonElement;
        expect(el.outerHTML).is.equal('<button class="my-button">Hello world</button>');
    })
});

describe('Evaluated content', ()=>{
    it('evaluated attribute', ()=>{
        let myId = "div1";
        const el = jsx('div', {class: 'my-div', id: ()=>myId}) as HTMLDivElement;
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
        myId = "div2";
        updateUI();
        expect(el.id).to.equal('div2');
    }),
    it('evaluated attributes', ()=>{
        let myId = "div1";
        let myClass = "my-div";
        const el = jsx('div', {class: ()=>myClass, id: ()=>myId}) as HTMLDivElement;
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
        myId = "div2";
        myClass = "my-div2";
        updateUI();
        expect(el.id).to.equal('div2');
        expect(el.className).to.equal('my-div2');
    }),
    it("onUpdate", ()=>{
        let myId = "div1";
        const el = jsx('div', {class: 'my-div', id: ()=>myId}) as HTMLDivElement;
        let wasUpdated = false;
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');

        applyElement(el, ()=>{
            wasUpdated = true;
        });

        myId = "div2";
        updateUI();
        expect(el.id).to.equal('div2');
        expect(wasUpdated).to.equal(true);
    }),
    it("onUpdate params", ()=>{
        let myId = "div1";
        const el = jsx('div', {class: 'my-div', id: ()=>myId}) as HTMLDivElement;
        let wasUpdated = false;
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');

        let computedParam2 = 321;

        applyElement(el, (param, param2)=>{
            expect(param).to.be.equal(123);
            expect(param2).to.be.equal(321);
            wasUpdated = true;
        }, 123, ()=>computedParam2);

        myId = "div2";
        updateUI();
        expect(el.id).to.equal('div2');
        expect(wasUpdated).to.equal(true);
    }),
    it("applyElement applies immediately and latches computed values", ()=>{
        const el = jsx('div') as HTMLDivElement;
        let value = "first";
        const updates: string[] = [];

        applyElement(el, nextValue => {
            updates.push(nextValue);
        }, () => value);

        expect(updates).to.deep.equal(["first"]);
        updateUI();
        expect(updates).to.deep.equal(["first"]);

        value = "second";
        updateUI();
        updateUI();
        expect(updates).to.deep.equal(["first", "second"]);
    }),
    it("applyElement without values applies immediately and on every update", ()=>{
        const el = jsx('div') as HTMLDivElement;
        let updateCount = 0;

        applyElement(el, () => updateCount++);
        expect(updateCount).to.equal(1);

        updateUI();
        updateUI();
        expect(updateCount).to.equal(3);
    }),
    it('unmount', ()=>{
        let myId = "div1";
        const el = jsx('div', {class: 'my-div', id: ()=>myId}) as HTMLDivElement;
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
        removeUI(el);
        myId = "div2";
        updateUI();
        expect(el.id).to.equal('div1');
    }),
    it('unmount from parent', ()=>{
        let myId = "div1";
        const el = jsx('div', {class: 'my-div', id: ()=>myId}) as HTMLDivElement;
        const root = jsx("div", {class: 'my-div', name: "fred", children: [el]}) as HTMLDivElement;

        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');

        let wasUnmounted = false;
        onRemoveElement(el, ()=>{
            wasUnmounted = true;
        })

        removeUI(el);
        myId = "div2";
        updateUI();
        expect(el.id).to.equal('div1');
        expect(wasUnmounted).to.equal(true);
        expect(el.parentElement).to.equal(null);
    }),
    it('unmount', ()=>{
        let myId = "div1";
        const el = jsx('div', {class: 'my-div', id: ()=>myId}) as HTMLDivElement;
        const root = jsx("div", {class: 'my-div', name: "fred", children: [el]}) as HTMLDivElement;
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');

        let wasUnmounted = false;
        onRemoveElement(el, ()=>{
            wasUnmounted = true;
        })

        removeUI(root);
        myId = "div2";
        updateUI();
        expect(el.id).to.equal('div1');
        expect(wasUnmounted).to.equal(true);
    });
});

describe('nested updateUI', ()=>{
    it ('nest', ()=>{
        let invokeCount = 0;
        const el = jsx('div', { "on-MyTestEvent":()=>{
            invokeCount++;
        } }) as HTMLDivElement;
        const el2 = jsx('div') as HTMLDivElement;
        applyElement(el2, ()=>{
            el.dispatchEvent(new CustomEvent("MyTestEvent"));
        });
        expect(invokeCount).to.equal(1);
        updateUI();
        expect(invokeCount).to.equal(2);
    })
});

describe('components', ()=>{
    it('construct', ()=>{
        const el = jsx(MyButtonComponent, {caption: "Hello"}) as MyButtonComponent;
        expect(el).to.be.instanceOf(MyButtonComponent);
    })

    it('usage', ()=>{
        const btn = jsx(MyButtonComponent, {caption: "Hello"}) as MyButtonComponent;
        expect(btn).to.be.instanceOf(MyButtonComponent);
    })

    it('nested', ()=>{
        const btn = jsx(MyButtonComponent, {caption: "Hello"}) as MyButtonComponent;
        const wrapper = jsx("div", {children: [btn]}) as HTMLDivElement;
        expect(wrapper.outerHTML).to.equal('<div><button>Hello</button></div>')

    })

    it('can render boolean content', ()=>{
        const hidden = jsx(BooleanComponent, {visible: false}) as BooleanComponent;
        const visible = jsx(BooleanComponent, {visible: true}) as BooleanComponent;
        const wrapper = jsx('div', {children: [hidden, visible]}) as HTMLDivElement;
        expect(wrapper.outerHTML).to.equal('<div><span>visible</span></div>');
        removeUI(hidden, visible);
    })

});

class MyButtonComponent extends USXComponent<any> {
    render(props: any) {
        return jsx("button", {children: [props.caption]});
    }
}

class BooleanComponent extends USXComponent<{visible: boolean}> {
    render(props: {visible: boolean}) {
        return props.visible && jsx('span', {children: 'visible'});
    }
}
