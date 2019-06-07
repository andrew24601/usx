require('jsdom-global')()
const { expect } = require('chai');
const usxmodule = require('../distcjs/index');

const usx = usxmodule.default;
const updateUI = usx.update;
const onUpdateUI = usx.onUpdate;

const SVGNS = "http://www.w3.org/2000/svg";

function MyButton(props, children) {
    return usx('button', {class: 'my-button'}, children);
}

afterEach(()=>{
    usx.clear();
});

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

        onUpdateUI(el, ()=>{
            wasUpdated = true;
        });

        myId = "div2";
        updateUI();
        expect(el.id).to.equal('div2');
        expect(wasUpdated).to.equal(true);
    }),
    it('unmount', ()=>{
        let myId = "div1";
        const el = usx('div', {class: 'my-div', id: ()=>myId});
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
        usx.unmount(el);
        myId = "div2";
        updateUI();
        expect(el.id).to.equal('div1');
    }),
    it('unmount', ()=>{
        let myId = "div1";
        const el = usx('div', {class: 'my-div', id: ()=>myId});
        const root = usx("div", {class: 'my-div', name: "fred"}, el)
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');

        let wasUnmounted = false;
        usx.onUnmount(el, ()=>{
            wasUnmounted = true;
        })

        usx.unmount(root);
        myId = "div2";
        updateUI();
        expect(el.id).to.equal('div1');
        expect(wasUnmounted).to.equal(true);
    })
});

describe('Multi context', ()=>{
    it('single context', ()=>{
        const ctx = usx.create();
        let myId = "div1";
        const el = ctx('div', {class: 'my-div', id: ()=>myId});
        expect(el.className).to.equal('my-div');
        expect(el.id).to.equal('div1');
        myId = "div2";
        ctx.update();
        expect(el.id).to.equal('div2');
    });
    it('single context is separate from default', ()=>{
        const ctx = usx.create();
        let myId = "div1";
        const el = ctx('div', {class: 'my-div', id: ()=>myId});
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
        const el = usx('div', { onMyTestEvent:()=>{
            invokeCount++;
        } });
        const el2 = usx('div');
        onUpdateUI(el2, ()=>{
            el.dispatchEvent(new CustomEvent("mytestevent"));
        });
        expect(invokeCount).to.equal(2);
        updateUI();
        expect(invokeCount).to.equal(3);
    })
});

function contextCount(ctx) {
    let count = 0;
    ctx.forEach(e=>count++);
    return count;
}

describe('introspect', ()=>{
    it('test', ()=>{
        expect(contextCount(usx)).to.equal(0);

        const staticEl = usx("input", {type: "text"});

        expect(contextCount(usx)).to.equal(0);

        let myId = "div1";
        const el = usx('div', {class: 'my-div', id: ()=>myId});

        expect(contextCount(usx)).to.equal(1);

        count = 0;
        usx.forEach(e=>count++);
        expect(count).to.equal(1);

        usx.unmount(el);

        expect(contextCount(usx)).to.equal(0);
    })
});

describe('components', ()=>{
    it('construct', ()=>{
        const el = usx(MyButtonComponent, {caption: "Hello"});
        expect(el).to.be.instanceOf(MyButtonComponent);
    })

    it('usage', ()=>{
        const btn = usx(MyButtonComponent, {caption: "Hello"});
        expect(btn).to.be.instanceOf(MyButtonComponent);
        const el = usx("div", {__source: {fileName: 'test.js', lineNumber: 294}}, btn);
        expect(el.firstChild).to.be.instanceOf(HTMLButtonElement);
    })
});

class MyButtonComponent extends usxmodule.Component {
    render(props, children) {
        return usx("button", {}, props.caption);
    }
}

describe('custom event', ()=>{
    it('test', ()=>{
        const el = usx('div');
        const el2 = usx('div', null, ()=>"hello");
        let validateCalled = 0;
        const data = {
            called : false
        }
        usx.on(el, "validate", (payload)=>{
            validateCalled++;
            payload.called = true;
        });
        expect(validateCalled).to.eq(0);
        usx.trigger("validate", data);
        expect(validateCalled).to.eq(1);
        expect(data.called).to.eq(true);
        usx.update();
    })
});

describe('custom style', ()=>{
    it('create', ()=>{
        const style = usx.style({
            fontWeight: "bold"
        }).withSubRule("a", {
            textDecoration: "none"
        }).withMediaQuery({maxWidth:1024}, {color: "red"})
        .withMediaQuery({maxWidth:1024, orientation: "landscape"}, {color: "blue"});
    });
    it('test', ()=>{
        let colour = "red";
        const style = usx.style({
            color: ()=>colour
        });
        colour = "blue";
        usx.update();
        colour = null;
        usx.update();
    })
    it('apply as class', ()=>{
        const style = usx.style({
            color: "red"
        });
        const div = usx('div', {class: style});
        expect(div.getAttribute('class')).to.eq(style.className);
    });
    it('apply as class array', ()=>{
        const style = usx.style({
            color: "red"
        });
        const div = usx('div', {class: [style, "block"]});
        expect(div.getAttribute('class')).to.eq(style.className + " block");
    });
    it('direct test', ()=>{
        let colour = "red";
        const style = usx.style("body", {
            color: ()=>colour
        });
        colour = "blue";
        usx.update();
        colour = null;
        usx.update();
    })
});

function DivWithContext(props) {
    return usx('div', null, props.count);
}

describe('Context test', ()=>{
    it('set context', ()=>{
        let invoked = false;
        let captureCount;
        usxmodule.withProps({count: 3}, ()=>{
            invoked = true;
            captureCount = usxmodule.getActiveProps().count;
        });
        expect(invoked).to.be.eq(true);
        expect(captureCount).to.be.eq(3);
    });

    it('nested context', ()=>{
        let invoked = false;
        let captureCount, subCaptureCount;
        let capturePants;
        usxmodule.withProps({count: 3}, ()=>{
            invoked = true;
            captureCount = usxmodule.getActiveProps().count;
            usxmodule.withProps({count: 5, pants: "green"}, ()=>{
                subCaptureCount = usxmodule.getActiveProps().count;
                capturePants = usxmodule.getActiveProps().pants;
            });
        });
        expect(invoked).to.be.eq(true);
        expect(captureCount).to.be.eq(3);
        expect(subCaptureCount).to.be.eq(5);
        expect(capturePants).to.be.eq("green");
    });

    it('applied context', ()=>{
        usxmodule.withProps({count: 3}, ()=>{
            el = usx(DivWithContext);
        });
        expect(el.textContent).to.be.eq('3');
    })

});