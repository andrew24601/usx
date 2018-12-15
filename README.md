[![Build Status](https://travis-ci.org/andrew24601/usx.svg?branch=master)](https://travis-ci.org/andrew24601/usx)
[![Coverage Status](https://coveralls.io/repos/github/andrew24601/usx/badge.svg)](https://coveralls.io/github/andrew24601/usx)


# usx

USX is a JSX compatible generator but for direct DOM generation instead of a virtual DOM solution such as for React.

## Configuring TypeScript for use with USX

### Tsconfig settings

### Inline settings

## Simple usage
~~~~
Const x = <div class=“my-div”/>
~~~~

Would result in x containing a reference to an HTMLDIVElement ready for insertion into the regular DOM.

~~~~
Document.body.appendChild(x);
~~~~

~~~~
Const x = <div>This is a <b>Bold</b> message</div>;
~~~~

Similarly, variables can be substituted into the JSX as per normal

~~~~
Const text = “World”;

Const x = <div>Hello {text}</div>
~~~~

Or:

~~~~
Const items = [“one”, “two”, “three”];
Const x = <ul>{items.map((t)=><li>{t}</li>)}</ul>;
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

USX supports dynamic content by passing functions in the places where values are accepted in combination with calling the updateUI function.

~~~~
Const x = <div>Hello {()=>text}</div>
~~~~

This will evaluate the function at point of creation of the element, and will also be automatically recalculated when the updateUI function is executed.

~~~~
Let text = “World”;
Const x = <div>Hello {()=>text}</div>
Text = “Pig Monkey”;
updateUI();
~~~~

Needing to remember to call updateUI would be irritating, so USX also automagically inserts an invocation to updateUI after any event handler inserted with USX.

So a complete example might be:

~~~~
let count = 0;
const example = <div>You clicked {()=>count} times <button onClick={()=>count++}>Click</button></div>;
document.body.appendChild(example);
~~~~

## Unmounting elements

Adding a dynamic property to an element makes it easy to have dynamically updating elements without needing to remember to propagate changes from the model to your view. The only downside is that once a dynamic property is place then USX will keep on updating the DOM elements when updateUI is called.

In simple circumstances this is fine, but for user interfaces were there is a lot of content that is being mounted and unmounted, there is a issue where USX will get slower it’s continuing to be updating content that has been long unmounted from the DOM.

This is where the unmountUI function comes in.

Calling unmountUI on an element deregisters the dynamic property updating for the element and any of its child elements.

If you have more complex updating requirements than can’t be handled with a function on a single property, then the onUpdateUI function is a way to hook directly into the updateUI flow.

~~~~
onUpdateUI(el, ()=>{
…do stuff…
});
~~~~

The callback passed to onUpdateUI will execute when updateUI is called. The first parameter is the element that the update is associated with – this is necessary to make sure the update function is removed when the associated element is unmounted from USX by calling unmountUI.

## Introspection

The forEachUI(callback) function allows the current set of dynamic elements to be introspected. This is useful primarily for debugging purposes to try and track down any leaks where elements are unintentionally still mounted.

~~~~
let mountCount = 0;
forEachUI(e=>mountCount++);
~~~~

## Multiple Contexts

The default functions all belong to a single USX context that updates all the mounted elements with a single call to updateUI.

If there are circumstances where this isn’t appropriate – for example there is a section of your UI where you want to be updating elements dynamically but separate from the rest of the elements. E.g. Dynamic updates for a drag and drop operation but you don’t want the updateUI to be evaluated for all the elements on the page.

The createUIContext() function creates an entirely isolated USX context - the function returns an object with the fields usx, updateUI, onUpdateUI, onUnmountUI, forEachUI, unmountUI - which correspond to the normal USX functions, but applying just to the context that has just been created.

~~~~
const newContext = createUIContext();
const {usx, updateUI, onUpdateUI, onUnmountUI, forEachUI, unmountUI} = newContext;
~~~~
