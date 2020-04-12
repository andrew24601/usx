import 'jsdom-global/register';
import { expect } from 'chai';
import {usx, USXComponent} from "../lib/index"

const updateUI = usx.update;

const SVGNS = "http://www.w3.org/2000/svg";

function MyButton(props, children) {
    return usx.el('button', {class: 'my-button'}, children);
}

afterEach(()=>{
    usx.clear();
});

describe('Simple usx test', ()=>{
    it('construct div', () => {
        const el = usx.el('div');
        expect(el).is.instanceOf(HTMLElement);
    })
    it('construct div with simple attributes', () => {
        const el = usx.el('div', {class: 'my-div', id: 'div1'}) as HTMLDivElement;
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
    })
    it('construct div with null attributes', () => {
        const el = usx.el('div', {class: 'my-div', id: null}) as HTMLDivElement;
        expect(el.outerHTML).to.equal('<div class="my-div"></div>')
    })
    it('construct div with null content', () => {
        const el = usx.el('div', {class: 'my-div', id: null}, ["Hello ", null, "world"]) as HTMLDivElement;
        expect(el.textContent).to.equal('Hello world')
    })
    it('construct div with style', () => {
        const el = usx.el('div', {class: 'my-div', id: 'div1', style: {fontWeight: "bold"}}) as HTMLDivElement;
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
        expect(el.style.fontWeight).to.equal("bold");
    })
    it('construct div with computed style', () => {
        let isBold = true;
        const el = usx.el('div', {class: 'my-div', id: 'div1', style: {fontWeight: ()=>isBold ? "bold" : "normal"}}) as HTMLDivElement;
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
        expect(el.style.fontWeight).to.equal("bold");
        isBold = false;
        updateUI();
        expect(el.style.fontWeight).to.equal("normal");
    })
    it('construct div with reset computed style', () => {
        let isBold = true;
        const el = usx.el('div', {class: 'my-div', id: 'div1', style: {fontWeight: ()=>isBold ? "bold" : null}}) as HTMLDivElement;
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
        expect(el.style.fontWeight).to.equal("bold");
        isBold = false;
        updateUI();
        expect(el.style.fontWeight).to.equal("");
    })
    it('construct div with bad style', () => {
        const el = usx.el('div', {class: 'my-div', id: 'div1', style: 12}) as HTMLDivElement;
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
    })
    it('construct div with style', () => {
        const el = usx.el('div', {class: 'my-div', id: 'div1', style: {fontBold: true, fontSize: 12}});
    })
    it('construct div with content', () => {
        const el = usx.el('div', {class: 'my-div', id: 'div1'}, 'Hello world') as HTMLDivElement;
        expect(el.textContent).to.equal('Hello world');
    })
    it('construct div with numeric content', () => {
        const el = usx.el('div', {class: 'my-div', id: 'div1'}, 12) as HTMLDivElement;
        expect(el.textContent).to.equal('12');
    })
    it('construct div with mutiple content', () => {
        const el = usx.el('div', {class: 'my-div', id: 'div1'}, 'Hello ', 'world') as HTMLDivElement;
        expect(el.textContent).to.equal('Hello world');
    })
    it('construct nested divs', ()=>{
        const el = usx.el('div', null, usx.el('div', null, 'nested')) as HTMLDivElement;
        expect(el.outerHTML).to.equal('<div><div>nested</div></div>')
    })
    it('construct link with click handler', () => {
        let clickCount = 0;
        const el = usx.el('a', {class:'linky', href:' #', onClick: ()=>clickCount++}, 'Click me') as HTMLLinkElement;

        el.click();
        expect(clickCount).to.equal(1);
    }),
    it('construct link with bad click handler', () => {
        let clickCount = 0;
        const el = usx.el('a', {class:'linky', href:' #', onClick: "clicky"}, 'Click me') as HTMLLinkElement;

        el.click();
        expect(clickCount).to.equal(0);
    }),
    it('direct attribute test', ()=>{
        let isChecked = false;
        const el = usx.el('input', {type: 'checkbox', checked: ()=>isChecked}) as HTMLInputElement;
        expect(el.checked).to.equal(false);
        isChecked = true;
        updateUI();
        expect(el.checked).to.equal(true);
    }),
    it('clear attribute test', ()=>{
        let className = "my-div";
        const el = usx.el('div', {class: ()=>className, id: null}) as HTMLDivElement;
        expect(el.hasAttribute('class')).to.equal(true);
        expect(el.className).to.equal('my-div');
        className = null;
        updateUI();
        expect(el.hasAttribute('class')).to.equal(false);
    })
});

describe('SVG content test', ()=>{
    it('construct circle', () => {
        const el = usx.el('circle', {cx: 50, cy: 50, r: 50}) as SVGCircleElement;
        expect(el.namespaceURI).to.equal(SVGNS);
    })
});

describe('Function component test', ()=>{
    it('construct function component', ()=>{
        const el = usx.el(MyButton, null, 'Hello world') as HTMLButtonElement;
        expect(el.outerHTML).is.equal('<button class="my-button">Hello world</button>');
    })
});

describe('Evaluated content', ()=>{
    it('evaluated attribute', ()=>{
        let myId = "div1";
        const el = usx.el('div', {class: 'my-div', id: ()=>myId}) as HTMLDivElement;
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
        myId = "div2";
        updateUI();
        expect(el.id).to.equal('div2');
    }),
    it('evaluated attributes', ()=>{
        let myId = "div1";
        let myClass = "my-div";
        const el = usx.el('div', {class: ()=>myClass, id: ()=>myId}) as HTMLDivElement as HTMLDivElement;
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
        const el = usx.el('div', {class: 'my-div', id: ()=>myId}) as HTMLDivElement;
        let wasUpdated = false;
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');

        usx.apply(el, ()=>{
            wasUpdated = true;
        });

        myId = "div2";
        updateUI();
        expect(el.id).to.equal('div2');
        expect(wasUpdated).to.equal(true);
    }),
    it("onUpdate params", ()=>{
        let myId = "div1";
        const el = usx.el('div', {class: 'my-div', id: ()=>myId}) as HTMLDivElement;
        let wasUpdated = false;
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');

        let computedParam2 = 321;

        usx.apply(el, (param, param2)=>{
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
        const el = usx.el('div', {class: 'my-div', id: ()=>myId}) as HTMLDivElement;
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
        usx.remove(el);
        myId = "div2";
        updateUI();
        expect(el.id).to.equal('div1');
    }),
    it('unmount from parent', ()=>{
        let myId = "div1";
        const el = usx.el('div', {class: 'my-div', id: ()=>myId}) as HTMLDivElement;
        const root = usx.el("div", {class: 'my-div', name: "fred"}, el) as HTMLDivElement;

        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');

        let wasUnmounted = false;
        usx.onRemove(el, ()=>{
            wasUnmounted = true;
        })

        usx.remove(el);
        myId = "div2";
        updateUI();
        expect(el.id).to.equal('div1');
        expect(wasUnmounted).to.equal(true);
        expect(el.parentElement).to.equal(null);
    }),
    it('unmount', ()=>{
        let myId = "div1";
        const el = usx.el('div', {class: 'my-div', id: ()=>myId}) as HTMLDivElement;
        const root = usx.el("div", {class: 'my-div', name: "fred"}, el) as HTMLDivElement;
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');

        let wasUnmounted = false;
        usx.onRemove(el, ()=>{
            wasUnmounted = true;
        })

        usx.remove(root);
        myId = "div2";
        updateUI();
        expect(el.id).to.equal('div1');
        expect(wasUnmounted).to.equal(true);
    });
    it('unmount all', ()=>{
        let myId = "div1";
        const el = usx.el('div', {class: 'my-div', id: ()=>myId}) as HTMLDivElement;
        const root = usx.el("div", {class: 'my-div', name: "fred"}, el) as HTMLDivElement;
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');

        let wasUnmounted = false;
        usx.onRemove(el, ()=>{
            wasUnmounted = true;
        })

        usx.clear();

        expect(wasUnmounted).to.equal(true);
    });

});

describe('Multi context', ()=>{
    it('single context', ()=>{
        const ctx = usx.createContext();
        let myId = "div1";
        const el = ctx.el('div', {class: 'my-div', id: ()=>myId}) as HTMLDivElement;
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
        myId = "div2";
        ctx.update();
        expect(el.id).to.equal('div2');
    });
    it('single context is separate from default', ()=>{
        const ctx = usx.createContext();
        let myId = "div1";
        const el = ctx.el('div', {class: 'my-div', id: ()=>myId}) as HTMLDivElement;
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
        myId = "div2";
        updateUI();
        expect(el.id).to.equal('div1');
        ctx.update();
        expect(el.id).to.equal('div2');
    });
})

describe('nested updateUI', ()=>{
    it ('nest', ()=>{
        let invokeCount = 0;
        const el = usx.el('div', { onMyTestEvent:()=>{
            invokeCount++;
        } }) as HTMLDivElement;
        const el2 = usx.el('div') as HTMLDivElement;
        usx.apply(el2, ()=>{
            el.dispatchEvent(new CustomEvent("mytestevent"));
        });
        expect(invokeCount).to.equal(1);
        updateUI();
        expect(invokeCount).to.equal(2);
    })
});

describe('components', ()=>{
    it('construct', ()=>{
        const el = usx.el(MyButtonComponent, {caption: "Hello"}) as HTMLButtonElement;
        expect(el).to.be.instanceOf(MyButtonComponent);
    })

    it('usage', ()=>{
        const btn = usx.el(MyButtonComponent, {caption: "Hello"}) as HTMLButtonElement;
        expect(btn).to.be.instanceOf(MyButtonComponent);
        const el = usx.el("div", {__source: {fileName: 'test.js', lineNumber: 294}}, btn) as HTMLDivElement;
        expect(el.firstChild).to.be.instanceOf(HTMLButtonElement);
    })
});

class MyButtonComponent extends USXComponent<any> {
    render(props) {
        return usx.el("button", {}, props.caption);
    }
}

function DivWithContext(props) {
    return usx.el('div', null, props.count);
}

describe('Context test', ()=>{
    it('set context', ()=>{
        let invoked = false;
        let captureCount;
        usx.withDefaultProps({count: 3}, ()=>{
            invoked = true;
            captureCount = usx.getDefaultProps().count;
        });
        expect(invoked).to.be.eq(true);
        expect(captureCount).to.be.eq(3);
    });

    it('nested context', ()=>{
        let invoked = false;
        let captureCount, subCaptureCount;
        let capturePants;
        usx.withDefaultProps({count: 3}, ()=>{
            invoked = true;
            captureCount = usx.getDefaultProps().count;
            usx.withDefaultProps({count: 5, pants: "green"}, ()=>{
                subCaptureCount = usx.getDefaultProps().count;
                capturePants = usx.getDefaultProps().pants;
            });
        });
        expect(invoked).to.be.eq(true);
        expect(captureCount).to.be.eq(3);
        expect(subCaptureCount).to.be.eq(5);
        expect(capturePants).to.be.eq("green");
    });

    it('applied context', ()=>{
        let el: HTMLDivElement;
        usx.withDefaultProps({count: 3}, ()=>{
            el = usx.el(DivWithContext) as HTMLDivElement;
        });
        expect(el.textContent).to.be.eq('3');
    });
});