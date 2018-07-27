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

class EventEmitter {
    constructor() {
        this.listeners = {};
    }
    on(name, callback) {
        let listeners = this.listeners[name];
        if (listeners == null) {
            listeners = this.listeners[name] = [];
        }
        listeners.push(callback);
    }
    emit(eventName, ...args) {
        const listeners = this.listeners[eventName];
        if (listeners == null) return;
        for (const listener of listeners) {
            listener.apply(this, args);
        }
    }
}

class TestStream extends EventEmitter {
    constructor(v) {
        super();
        this.v = v;
    }

    value() {
        return this.v;
    }

    push(v) {
        this.v = v;
        this.emit("update", v);
    }
}

describe('Evented value', ()=>{
    it('div content', ()=>{
        const stream = new TestStream('');
        const el = usx('div', null, stream);
        expect(el.textContent).is.equal('');
        stream.push('Hello')
        expect(el.textContent).is.equal('Hello');
        stream.push('World')
        expect(el.textContent).is.equal('World');
    })
    it('div numeric content', ()=>{
        const stream = new TestStream(0);
        const el = usx('div', null, stream);
        expect(el.textContent).is.equal('0');
        stream.push(1)
        expect(el.textContent).is.equal('1');
        stream.push(2)
        expect(el.textContent).is.equal('2');
    })
    it('div pre content', ()=>{
        const stream = new TestStream('');
        const el = usx('div', null, 'content: ', stream);
        expect(el.textContent).is.equal('content: ');
        stream.push('Hello')
        expect(el.textContent).is.equal('content: Hello');
        stream.push('World')
        expect(el.textContent).is.equal('content: World');
    })
    it('div post content', ()=>{
        const stream = new TestStream('');
        const el = usx('div', null, stream, ": content");
        expect(el.textContent).is.equal(': content');
        stream.push('Hello')
        expect(el.textContent).is.equal('Hello: content');
        stream.push('World')
        expect(el.textContent).is.equal('World: content');
    })
    it('div mid content', ()=>{
        const stream = new TestStream('');
        const el = usx('div', null, "[", stream, "]");
        expect(el.textContent).is.equal('[]');
        stream.push('Hello')
        expect(el.textContent).is.equal('[Hello]');
        stream.push('World')
        expect(el.textContent).is.equal('[World]');
    })
    it('div attribute', ()=>{
        const stream = new TestStream('Start');
        const el = usx('div', {class: stream});
        expect(el.className).is.equal('Start');
        stream.push('Hello')
        expect(el.className).is.equal('Hello');
        stream.push('World')
        expect(el.className).is.equal('World');
    })
    it('div style', ()=>{
        const stream = new TestStream('Start');
        const el = usx('div', {style: {fontFamily: stream}});
        expect(el.style.fontFamily).is.equal('Start');
        stream.push('Hello')
        expect(el.style.fontFamily).is.equal('Hello');
        stream.push('World')
        expect(el.style.fontFamily).is.equal('World');
    })
    it('div style px', ()=>{
        const stream = new TestStream(10);
        const el = usx('div', {style: {fontSize: stream}});
        expect(el.style.fontSize).is.equal('10px');
        stream.push(12)
        expect(el.style.fontSize).is.equal('12px');
        stream.push(14)
        expect(el.style.fontSize).is.equal('14px');
    })
});

describe('Unevented value', ()=>{
    it('div content', ()=>{
        const stream = {value() {return "hello"}};
        const el = usx('div', null, stream);
        expect(el.textContent).is.equal('hello');
    })
});

describe('promise', ()=>{
    it('div class', async ()=>{
        function promiseHello10() {
            return new Promise((resolve, reject)=>{
                setTimeout(()=>resolve('Hello'), 10);
            })
        }
        const p = promiseHello10();
        const el = usx('div', {class: p});
        expect(el.className).to.equal('');
        await p;
        expect(el.className).to.equal('Hello');
    }),
    it('div content', async ()=>{
        function promiseHello10() {
            return new Promise((resolve, reject)=>{
                setTimeout(()=>resolve('Hello'), 10);
            })
        }
        const p = promiseHello10();
        const el = usx('div', null, p);
        expect(el.textContent).to.equal('');
        await p;
        expect(el.textContent).to.equal('Hello');
    }),
    it('div style px', async ()=>{
        const p = new Promise((resolve, reject)=>{
            setTimeout(()=>resolve(12), 10);
        });
        const el = usx('div', {style:{fontSize: p}});
        await p;
        expect(el.style.fontSize).to.equal('12px');
    })
})

describe('stream', ()=>{
    it('div content', ()=>{
        const content = new EventEmitter();
        const el = usx('div', null, content);
        expect(el.textContent).to.equal('');
        content.emit('data', "Hello")
        expect(el.textContent).to.equal('Hello');
        content.emit('data', " World")
        expect(el.textContent).to.equal('Hello World');
    })
})

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
