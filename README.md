# usx

USX is a small JSX runtime that creates DOM nodes directly and keeps them synchronized with application state. It has no virtual DOM, component instances, or implicit dependency tracking.

## Install

USX 4 requires Node.js 24.19 or newer for development and tooling.

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

## Create DOM with JSX

JSX expressions create ordinary DOM nodes:

```tsx
const element = <div class="greeting">Hello <strong>World</strong></div>;
document.body.appendChild(element);
```

Fragments, strings, numbers, arrays, DOM nodes, and function components can all be used as children. Boolean and nullish children are ignored.

The `jsx` function can also be called directly:

```ts
import { jsx } from "usx";

const element = jsx("div", {
  class: "greeting",
  children: ["Hello ", jsx("strong", {children: "World"})]
});
```

## Synchronize UI

Function-valued properties are evaluated immediately and again when `syncUI` runs. A registered event handler calls `syncUI` automatically after it finishes:

```tsx
import { syncText, syncUI } from "usx";

let count = 0;

const counter = (
  <button on-click={() => count++} title={() => `${count} clicks`}>
    Clicked {syncText(() => count)} times
  </button>
);

document.body.appendChild(counter);

// State changed outside a USX event handler:
count++;
syncUI();
```

Properties beginning with `on-` are registered with `addEventListener`. The text after `on-` is passed unchanged, preserving native and custom event names:

```tsx
<div on-dblclick={handleDoubleClick} />
<div on-CaseSensitive={handleCustomEvent} />
```

### Synchronized text

`syncText` returns a real `Text` node. Strings and numbers become text; booleans and nullish values become empty text.

```tsx
let total = 12;
const label = <p>Total: {syncText(() => total)}</p>;
```

### Styles

Style objects and individual style properties may be synchronized. Numeric values for dimensional properties are converted to pixels:

```tsx
let compact = false;

const panel = (
  <div style={() => ({
    width: compact ? 200 : 400,
    fontWeight: compact ? "normal" : "bold"
  })} />
);
```

When a synchronized style object stops returning a property, that property is cleared.

## Function components

Function components receive their properties as one object and return USX children:

```tsx
import type { USXChildren } from "usx";

interface HeadingProps {
  children: USXChildren;
}

function Heading({children}: HeadingProps) {
  return <h1>{children}</h1>;
}

const heading = <Heading>Hello</Heading>;
```

Function components are ordinary functions. Classes that manage DOM can expose their node explicitly; USX does not add a separate component lifecycle or instance type.

## Custom synchronization

Use `syncElement` when a property or integration needs custom behavior:

```ts
import { syncElement } from "usx";

syncElement(
  element,
  [() => currentValue, () => enabled],
  (value, enabled) => {
    element.textContent = enabled ? value : "";
  }
);
```

`syncElement` evaluates its inputs and invokes the updater immediately. On later `syncUI` calls, it invokes the updater only when an evaluated input has changed by identity. With an empty input list, the updater runs on every `syncUI`:

```ts
syncElement(element, [], () => refreshImperativeWidget());
```

## Connectivity and cleanup

`syncUI` only synchronizes connected nodes. A detached node retains its synchronization and catches up on the next `syncUI` after it is reconnected.

Use `removeUI` for permanent removal. It detaches each supplied node, removes synchronization and USX event listeners from it and its descendants, and runs removal callbacks child-first:

```ts
import { onRemoveElement, removeUI } from "usx";

onRemoveElement(element, () => disposeResource());
removeUI(element);
```

Native operations such as `element.remove()`, `replaceChildren()`, and `innerHTML` do not dispose USX synchronization. They only leave affected nodes disconnected. Call `removeUI` before dropping permanently removed UI.

Reactive `textContent` and `innerHTML` properties do dispose synchronization and event listeners belonging to the descendants they replace. If a removal callback throws, USX continues the remaining cleanup before rethrowing the error.

## API

- `jsx(factory, props)` creates an intrinsic element or calls a function component.
- `Fragment(props)` creates a `DocumentFragment` containing its children.
- `syncText(getValue)` creates a synchronized `Text` node.
- `syncElement(element, inputs, updater)` registers custom element synchronization.
- `syncUI()` synchronizes all connected registered nodes.
- `onRemoveElement(element, callback)` registers explicit removal work.
- `removeUI(...children)` removes nodes and disposes their synchronization recursively.
