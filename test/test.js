require('jsdom-global')()
const { expect } = require('chai');
const usxmodule = require('../distcjs/index');

const usx = usxmodule.default;
const WebComponent = usxmodule.WebComponent;
const automount = usxmodule.automount;

const SVGNS = "http://www.w3.org/2000/svg";

class MyComponent {
    constructor(props, children) {
        this._el = usx('div', {class: props.class}, "My Component");
    }
}

class MyList {
    constructor(props, children) {
        this._el = usx('ol');
        for (const ch of children) {
            if (ch instanceof MyItem) {
                this._el.appendChild(usx("li", null, ch.text));
            }
        }
    }
}

class MyItem {
    constructor(props, children) {
        this.value = props.value;
        this.text = props.text;
    }
}

function MyButton(props, children) {
    return usx('button', {class: 'my-button'}, children);
}

WebComponent("MyComponent")(MyComponent);
WebComponent("MyList")(MyList);
WebComponent("MyItem")(MyItem);

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


describe('Web component test', ()=>{
    it('construct WebComponent', () => {
        const el = usx(MyComponent, {class: 'my-component'});
        expect(el).is.instanceOf(MyComponent);
    })
    it('nesting WebComponent', ()=>{
        const el = usx('div', null, usx(MyComponent, {class: 'my-component'}));
        expect(el.outerHTML).to.equal('<div><div class="my-component">My Component</div></div>')
    })
});

class TestStream {
    constructor(v) {
        this.v = v;
        this.callbacks = [];
        this.valueFn = (callback)=>{
            this.callbacks.push(callback);
            callback(this.v);
        }
    }

    push(v) {
        this.v = v;
        this.callbacks.forEach(callback=>callback(v));
    }
}

describe('Streaming', ()=>{
    it('div content', ()=>{
        const stream = new TestStream('');
        const el = usx('div', null, stream.valueFn);
        expect(el.textContent).is.equal('');
        stream.push('Hello')
        expect(el.textContent).is.equal('Hello');
        stream.push('World')
        expect(el.textContent).is.equal('World');
    })
    it('div numeric content', ()=>{
        const stream = new TestStream(0);
        const el = usx('div', null, stream.valueFn);
        expect(el.textContent).is.equal('0');
        stream.push(1)
        expect(el.textContent).is.equal('1');
        stream.push(2)
        expect(el.textContent).is.equal('2');
    })
    it('div pre content', ()=>{
        const stream = new TestStream('');
        const el = usx('div', null, 'content: ', stream.valueFn);
        expect(el.textContent).is.equal('content: ');
        stream.push('Hello')
        expect(el.textContent).is.equal('content: Hello');
        stream.push('World')
        expect(el.textContent).is.equal('content: World');
    })
    it('div post content', ()=>{
        const stream = new TestStream('');
        const el = usx('div', null, stream.valueFn, ": content");
        expect(el.textContent).is.equal(': content');
        stream.push('Hello')
        expect(el.textContent).is.equal('Hello: content');
        stream.push('World')
        expect(el.textContent).is.equal('World: content');
    })
    it('div mid content', ()=>{
        const stream = new TestStream('');
        const el = usx('div', null, "[", stream.valueFn, "]");
        expect(el.textContent).is.equal('[]');
        stream.push('Hello')
        expect(el.textContent).is.equal('[Hello]');
        stream.push('World')
        expect(el.textContent).is.equal('[World]');
    })
    it('div attribute', ()=>{
        const stream = new TestStream('Start');
        const el = usx('div', {class: stream.valueFn});
        expect(el.className).is.equal('Start');
        stream.push('Hello')
        expect(el.className).is.equal('Hello');
        stream.push('World')
        expect(el.className).is.equal('World');
    })
    it('div style', ()=>{
        const stream = new TestStream('Start');
        const el = usx('div', {style: {fontFamily: stream.valueFn}});
        expect(el.style.fontFamily).is.equal('Start');
        stream.push('Hello')
        expect(el.style.fontFamily).is.equal('Hello');
        stream.push('World')
        expect(el.style.fontFamily).is.equal('World');
    })
    it('div style px', ()=>{
        const stream = new TestStream(10);
        const el = usx('div', {style: {fontSize: stream.valueFn}});
        expect(el.style.fontSize).is.equal('10px');
        stream.push(12)
        expect(el.style.fontSize).is.equal('12px');
        stream.push(14)
        expect(el.style.fontSize).is.equal('14px');
    })
});

describe('automount', ()=>{
    it('automount single', ()=>{
        document.body.innerHTML = '<MyComponent class="automount"/>';
        automount();
        expect(document.body.innerHTML).is.equal('<div class="automount">My Component</div>');
    })
    it('automount composite', ()=>{
        document.body.innerHTML = '<div>\n<MyList>\n   <MyItem text="One"></MyItem>\n   <MyItem text="Two"></MyItem>\n   <MyItem text="Three"></MyItem>\n</MyList></div>';
        automount();
        expect(document.body.innerHTML).is.equal('<div>\n<ol><li>One</li><li>Two</li><li>Three</li></ol></div>');
    })
    it('automount nonhtml', ()=>{
        document.body.innerHTML = '<div>\n<MyItem text="Three"></MyItem>\n</div>';
        automount();
        expect(document.body.innerHTML).is.equal('<div>\n\n</div>');
    })
});
