# usx

USX is a small JSX runtime that creates DOM nodes directly, without a virtual DOM.

## Install

```sh
npm install usx
```

Configure TypeScript to use the automatic JSX runtime:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "usx"
  }
}
```

## JSX

```tsx
const name = "World";
const element = <div class="greeting">Hello <strong>{name}</strong></div>;

document.body.appendChild(element);
```

The `jsx` function can also be called directly:

```ts
import { jsx } from "usx";

const element = jsx("div", {
  class: "greeting",
  children: ["Hello ", jsx("strong", { children: "World" })]
});
```

Fragments, strings, numbers, arrays, DOM elements, and USX components can all be used as children.

## Events and reactive properties

Properties beginning with `on` and a capital letter are registered as event listeners. Other function-valued properties are reevaluated by `updateUI`.

```tsx
import { updateUI } from "usx";

let count = 0;
const counter = (
  <button onClick={() => count++} title={() => `${count} clicks`}>
    Click me
  </button>
);

count++;
updateUI();
```

Event handlers registered by USX call `updateUI` automatically after they run.

Style properties may also be reactive. Numeric values for dimensional properties are converted to pixels:

```tsx
let width = 100;
const panel = <div style={{ width: () => width, fontWeight: "bold" }} />;
```

## Components

Function components receive their properties as one object:

```tsx
interface HeadingProps {
  children: unknown;
}

function Heading({ children }: HeadingProps) {
  return <h1>{children}</h1>;
}

const heading = <Heading>Hello</Heading>;
```

Class components extend `USXComponent`. Their instance is returned from JSX and their rendered output can be used as a child:

```tsx
import { USXComponent } from "usx";

class List extends USXComponent<{ items: string[] }> {
  render({ items }: { items: string[] }) {
    return <ul>{items.map(item => <li>{item}</li>)}</ul>;
  }
}
```

## Cleanup and custom bindings

Reactive bindings remain registered until their element is removed with `removeUI`:

```ts
import { applyUI, onRemoveUI, removeUI } from "usx";

applyUI(element, value => {
  element.textContent = value;
}, () => currentValue);

onRemoveUI(element, () => disposeResource());
removeUI(element);
```

`removeUI` detaches each supplied element, removes bindings for it and its descendants, and runs their removal callbacks.
