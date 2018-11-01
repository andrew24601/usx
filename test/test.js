require('jsdom-global')()
const { expect } = require('chai');
const usxmodule = require('../distcjs/index');

const usx = usxmodule.default;
const updateUI = usxmodule.updateUI;

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
        const clickHandler = ()=>{
            clickCount++;
        }
        const el = usx('a', {class:'linky', href:' #', onClick: clickHandler}, 'Click me');

        el.click();
        expect(clickCount).to.equal(1);
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

        usxmodule.onUpdate(el, ()=>{
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
        usxmodule.act(()=>myId = "div2");
        expect(el.id).to.equal('div2');
    }),
    it('unmount', ()=>{
        let myId = "div1";
        const el = usx('div', {class: 'my-div', id: ()=>myId});
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
        usxmodule.unmount(el);
        usxmodule.act(()=>myId = "div2");
        expect(el.id).to.equal('div1');
    }),
    it('unmount', ()=>{
        let myId = "div1";
        const el = usx('div', {class: 'my-div', id: ()=>myId});
        const root = usx("div", {class: 'my-div', name: ()=>myId}, el)
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
        usxmodule.unmount(root);
        usxmodule.act(()=>myId = "div2");
        expect(el.id).to.equal('div1');
    })

})