require('jsdom-global')()
const { expect } = require('chai');
const usxmodule = require('../distcjs/index');

const usx = usxmodule.default;
const updateUI = usxmodule.updateUI;
const onUpdateEl = usxmodule.onUpdateEl;

const SVGNS = "http://www.w3.org/2000/svg";

function MyButton(props, children) {
    return usx('button', {class: 'my-button'}, children);
}

describe('Simple usx test', ()=>{
    it('construct div', () => {
        const el = usx('div');
        expect(el).is.instanceOf(HTMLElement);
    })
    it('construct invalid', () => {
        const el = usx(5);
        expect(el).to.equal(null);
    })
    it('construct div with simple attributes', () => {
        const el = usx('div', {class: 'my-div', id: 'div1'});
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
    })
    it('construct div with null attributes', () => {
        const el = usx('div', {class: 'my-div', id: null});
        expect(el.outerHTML).to.equal('<div class="my-div"></div>')
    })
    it('construct div with style', () => {
        const el = usx('div', {class: 'my-div', id: 'div1', style: {fontBold: true}});
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
        expect(el.style.fontBold).to.equal(true);
    })
    it('construct div with computed style', () => {
        let isBold = true;
        const el = usx('div', {class: 'my-div', id: 'div1', style: {fontBold: ()=>isBold}});
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
        expect(el.style.fontBold).to.equal(true);
        isBold = false;
        updateUI();
        expect(el.style.fontBold).to.equal(false);

    })
    it('construct div with bad style', () => {
        const el = usx('div', {class: 'my-div', id: 'div1', style: 12});
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
    })
    it('construct div with style', () => {
        const el = usx('div', {class: 'my-div', id: 'div1', style: {fontBold: true, fontSize: 12}});
    })
    it('construct div with content', () => {
        const el = usx('div', {class: 'my-div', id: 'div1'}, 'Hello world');
        expect(el.textContent).to.equal('Hello world');
    })
    it('construct div with numeric content', () => {
        const el = usx('div', {class: 'my-div', id: 'div1'}, 12);
        expect(el.textContent).to.equal('12');
    })
    it('construct div with mutiple content', () => {
        const el = usx('div', {class: 'my-div', id: 'div1'}, 'Hello ', 'world');
        expect(el.textContent).to.equal('Hello world');
    })
    it('construct nested divs', ()=>{
        const el = usx('div', null, usx('div', null, 'nested'));
        expect(el.outerHTML).to.equal('<div><div>nested</div></div>')
    })
    it('construct link with click handler', () => {
        let clickCount = 0;
        const el = usx('a', {class:'linky', href:' #', onClick: ()=>clickCount++}, 'Click me');

        el.click();
        expect(clickCount).to.equal(1);
    }),
    it('construct link with bad click handler', () => {
        let clickCount = 0;
        const el = usx('a', {class:'linky', href:' #', onClick: "clicky"}, 'Click me');

        el.click();
        expect(clickCount).to.equal(0);
    }),
    it('direct attribute test', ()=>{
        let isChecked = false;
        const el = usx('input', {type: 'checkbox', checked: ()=>isChecked});
        expect(el.checked).to.equal(false);
        isChecked = true;
        updateUI();
        expect(el.checked).to.equal(true);
    }),
    it('clear attribute test', ()=>{
        let className = "my-div";
        const el = usx('div', {class: ()=>className, id: null});
        expect(el.hasAttribute('class')).to.equal(true);
        expect(el.className).to.equal('my-div');
        className = null;
        updateUI();
        expect(el.hasAttribute('class')).to.equal(false);
    })
});

describe('SVG content test', ()=>{
    it('construct circle', () => {
        const el = usx('circle', {cx: 50, cy: 50, r: 50});
        expect(el.namespaceURI).to.equal(SVGNS);
    })
});

describe('Function component test', ()=>{
    it('construct function component', ()=>{
        const el = usx(MyButton, null, 'Hello world');
        expect(el.outerHTML).is.equal('<button class="my-button">Hello world</button>');
    })
});

describe('Evaluated content', ()=>{
    it('evaluated attribute', ()=>{
        let myId = "div1";
        const el = usx('div', {class: 'my-div', id: ()=>myId});
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
        myId = "div2";
        updateUI();
        expect(el.id).to.equal('div2');
    }),
    it('evaluated attributes', ()=>{
        let myId = "div1";
        let myClass = "my-div";
        const el = usx('div', {class: ()=>myClass, id: ()=>myId});
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
        myId = "div2";
        myClass = "my-div2";
        updateUI();
        expect(el.id).to.equal('div2');
        expect(el.className).to.equal('my-div2');
    }),
    it('evaluated content', ()=>{
        let content = "Hello";
        const el = usx('div', null, ()=>content);
        expect(el.textContent).to.equal('Hello');
        content = "World";
        updateUI();
        expect(el.textContent).to.equal('World');
        content = null;
        updateUI();
        expect(el.textContent).to.equal('');
    }),
    it('evaluated content', ()=>{
        let content = document.createTextNode('Bob');
        const el = usx('div', null, "Hello '", ()=>content, "'");
        expect(el.textContent).to.equal("Hello 'Bob'");
        content = "World";

        usxmodule.enableDebugging();

        document.body.appendChild(el);

        updateUI();
        expect(el.textContent).to.equal("Hello 'World'");
    }),
    it("onUpdate", ()=>{
        let myId = "div1";
        const el = usx('div', {class: 'my-div', id: ()=>myId});
        let wasUpdated = false;
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');

        onUpdateEl(el, ()=>{
            wasUpdated = true;
        });

        myId = "div2";
        updateUI();
        expect(el.id).to.equal('div2');
        expect(wasUpdated).to.equal(true);
    }),
    it('act', ()=>{
        let myId = "div1";
        const el = usx('div', {class: 'my-div', id: ()=>myId});
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
        usxmodule.action(()=>myId = "div2");
        expect(el.id).to.equal('div2');
    }),
    it('unmount', ()=>{
        let myId = "div1";
        const el = usx('div', {class: 'my-div', id: ()=>myId});
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
        usxmodule.unmount(el);
        usxmodule.action(()=>myId = "div2");
        expect(el.id).to.equal('div1');
    }),
    it('unmount', ()=>{
        let myId = "div1";
        const el = usx('div', {class: 'my-div', id: ()=>myId});
        const root = usx("div", {class: 'my-div', name: "fred"}, el)
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');

        let wasUnmounted = false;
        usxmodule.onUnmountEl(el, ()=>{
            wasUnmounted = true;
        })

        usxmodule.unmount(root);
        usxmodule.action(()=>myId = "div2");
        expect(el.id).to.equal('div1');
        expect(wasUnmounted).to.equal(true);
    })
});

describe('Multi context', ()=>{
    it('single context', ()=>{
        const ctx = usxmodule.createContext();
        const ctxusx = ctx.usx;
        let myId = "div1";
        const el = ctxusx('div', {class: 'my-div', id: ()=>myId});
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
        myId = "div2";
        ctx.updateUI();
        expect(el.id).to.equal('div2');
    });
    it('single context is separate from default', ()=>{
        const ctx = usxmodule.createContext();
        const ctxusx = ctx.usx;
        let myId = "div1";
        const el = ctxusx('div', {class: 'my-div', id: ()=>myId});
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
        myId = "div2";
        updateUI();
        expect(el.id).to.equal('div1');
        ctx.updateUI();
        expect(el.id).to.equal('div2');
    });
})

describe('nested updateUI', ()=>{
    it ('nest', ()=>{
        let invokeCount = 0;
        const el = usx('div', { onMyTestEvent:()=>{
            invokeCount++;
        } });
        const el2 = usx('div');
        onUpdateEl(el2, ()=>{
            el.dispatchEvent(new CustomEvent("mytestevent"));
        });
        expect(invokeCount).to.equal(2);
        usxmodule.enableDebugging(false);
        updateUI();
        expect(invokeCount).to.equal(3);
    })
});