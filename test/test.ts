import 'jsdom-global/register.js';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import {jsx, USXComponent, updateUI, onRemoveUI, removeUI, applyUI, Fragment} from "../src/index.js"

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
        const el = jsx('a', {class:'linky', href:' #', onClick: ()=>clickCount++, children: 'Click me'}) as HTMLLinkElement;

        el.click();
        expect(clickCount).to.equal(1);
    }),
    it('construct link with bad click handler', () => {
        let clickCount = 0;
        const el = jsx('a', {class:'linky', href:' #', onClick: "clicky", children: ['Click me']}) as HTMLLinkElement;

        el.click();
        expect(clickCount).to.equal(0);
    }),
    it('direct attribute test', ()=>{
        let isChecked = false;
        const el = jsx('input', {type: 'checkbox', checked: ()=>isChecked}) as HTMLInputElement;
        expect(el.checked).to.equal(false);
        isChecked = true;
        updateUI();
        expect(el.checked).to.equal(true);
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

        applyUI(el, ()=>{
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

        applyUI(el, (param, param2)=>{
            expect(param).to.be.equal(123);
            expect(param2).to.be.equal(321);
            wasUpdated = true;
        }, 123, ()=>computedParam2);

        myId = "div2";
        updateUI();
        expect(el.id).to.equal('div2');
        expect(wasUpdated).to.equal(true);
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
        onRemoveUI(el, ()=>{
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
        onRemoveUI(el, ()=>{
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
        const el = jsx('div', { onMyTestEvent:()=>{
            invokeCount++;
        } }) as HTMLDivElement;
        const el2 = jsx('div') as HTMLDivElement;
        applyUI(el2, ()=>{
            el.dispatchEvent(new CustomEvent("mytestevent"));
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

});

class MyButtonComponent extends USXComponent<any> {
    render(props: any) {
        return jsx("button", {children: [props.caption]});
    }
}
