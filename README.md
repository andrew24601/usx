[![Build Status](https://travis-ci.org/andrew24601/usx.svg?branch=master)](https://travis-ci.org/andrew24601/usx)
[![Coverage Status](https://coveralls.io/repos/github/andrew24601/usx/badge.svg)](https://coveralls.io/github/andrew24601/usx)


# usx

USX is a JSX compatible generator but for direct DOM generation instead of a virtual DOM solution such as for React.

## Configuring TypeScript for use with USX

### Tsconfig settings

### Inline settings

## Simple usage
~~~~
const x = <div class=“my-div”/>
~~~~

Would result in x containing a reference to an HTMLDIVElement ready for insertion into the regular DOM.

~~~~
document.body.appendChild(x);
~~~~

~~~~
const x = <div>This is a <b>Bold</b> message</div>;
~~~~

Similarly, variables can be substituted into the JSX as per normal

~~~~
const text = “World”;

const x = <div>Hello {text}</div>
~~~~

Or:

~~~~
const items = [“one”, “two”, “three”];
const x = <ul>{items.map(t=><li>{t}</li>)}</ul>;
~~~~

Usx can aso be used without a JSX environment.

~~~~
const x = jsx("div", {class: "my-div"});
const x = jsx("div", {children: ["This is a ", jsx("b", null, "Bold"), " message"]});
const x = jsx("div", {children: "Hello " + text});
const x = jsx("ul", {children: items.map(t=>jsx("li", null, t))});
~~~~

## Event handlers

USX recognises any attribute that starts with “on” followed by a capital letter to be an event handler, and translates this into a call to addEventListener with the “on” stripped and the name turned to lowercase.

Ie “onClick” will be translated to a “click” event listener.

~~~~
const x = <button onClick={()=>alert("clicked)}>Click me</button>

function changedHandler(evt) {

}

const in = <input type="text" onChange={changedHandler}/>
~~~~

This also applies to custom events, so if you have a custom event “myevent”, then you can add event listeners with “onMyEvent” (onMYEVENT, onMyevent, and onMyEvEnT would also work, but let’s try not to get too crazy).

## Dynamic content

USX supports dynamic content by passing functions in the places where values are accepted in combination with calling the usx.update function.

~~~~
const x = <div>Hello <span textContent={()=>text}/></div>
~~~~

This will evaluate the function at point of creation of the element, and will also be automatically recalculated when the usx.update function is executed.

~~~~
let text = “World”;
const x = <div>Hello <span textContent={()=>text}/></div>
text = “Pig Monkey”;
usx.update();
~~~~

Needing to remember to call usx.update would be irritating, so USX also automagically inserts an invocation to usx.update after any event handler inserted with USX.

So a complete example might be:

~~~~
let count = 0;
const example = <div>You clicked <span textContent={()=>count}/> times <button onClick={()=>count++}>Click</button></div>;
document.body.appendChild(example);
~~~~

## Unmounting elements

Adding a dynamic property to an element makes it easy to have dynamically updating elements without needing to remember to propagate changes from the model to your view. The only downside is that once a dynamic property is place then USX will keep on updating the DOM elements when usx.update is called.

In simple circumstances this is fine, but for user interfaces were there is a lot of content that is being mounted and unmounted, there is a issue where USX will get slower it’s continuing to be updating content that has been long unmounted from the DOM.

This is where the usx.remove function comes in.

Calling usx.remove on an element deregisters the dynamic property updating for the element and any of its child elements.

If you have more complex updating requirements than can’t be handled with a function on a single property, then the onRemoveUI function is a way to hook directly into the usx.update flow.

~~~~
onRemoveUI(el, ()=>{
    …do stuff…
});
~~~~

The callback passed to usx.onUpdate will execute when usx.update is called. The first parameter is the element that the update is associated with – this is necessary to make sure the update function is removed when the associated element is unmounted from USX by calling usx.remove.

## Components

USX supports two types of components, function components and class components.

### Function Components

A function component looks like:

~~~~
interface HeaderProps {
    text: string;
    title: string;
}

function Header({text, title}: HeaderProps) {
    return <h1 title={title}>{text}</h1>;
}
~~~~

and would be used like:
~~~~
<div>
    <Header text="Introduction" title="Introduction Header"/>
~~~~

Generally, function components are passed the properties as the first parameter, and any child elements are passed in
an array as the second parameter.

### Class Components

Function components are suitable for the majority of components, but there are often cases where you want to create
a component that can otherwise be inspected/manipulated through other code.

An example of a class component is:

~~~~
interface MyComponentProps {
    count: number
}

class MyComponent extends USXComponent<MyComponentProps> {
    myDivs: HTMLDivElement[] = [];

    render({count}: MyComponentProps) {
        for (let idx = 0; idx < count; idx++) {
            this.myDivs.push(<div>{idx}</div>);
        }
        return this.myDivs;
    }

    getItem(idx: number) {
        return this.myDivs[idx];
    }
}
~~~~

And could be used as

~~~~
const component:MyComponent = <MyComponent count={5}/>;
<div>
    {component}
</div>
~~~~

The difference from a function component, is that a reference to a MyComponent instance is retained which can
be used to access any properties/methods on the component.

## Injecting properties

A common use case is wanting to inject common properties into a number of components - someimes nested deep within other components - and it's a pain to need to inject these properties manually.

Examples of these use cases include things such as theming objects, or references to stores/controllers, etc.

In USX you use the withDefaultProps function that injects those properties into all the child components.

~~~~
return withDefaultProps({
    store: myStore,
    theme: myTheme
}, ()=><div><MyComponent/><MyOtherComponent theme={otherTheme}/></div>);
~~~~

All components that are created during the callback will have store and theme automatically added to their properties (unless they have been explicitly overridden). This includes both MyComponent and MyOtherComponent, as well as any other components that they create during the callback. Note that this only applies to components and not direct DOM elements created with USX.

If a component creates child components outside of the render cycle, it can capture the current active props that have been established with the getActiveProps method - and then apply them using withDefaultProps as appropriate.

Using withDefaultProps can also be nested, leading to a merged set of properties, with the inner properties overriding any common keys.

