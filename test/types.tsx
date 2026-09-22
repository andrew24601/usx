import { jsx, syncElement, syncText, syncUI, type USXChildren } from "usx";

interface HeadingProps {
    children: USXChildren;
}

function Heading({children}: HeadingProps) {
    return <h1>{children}</h1>;
}

let count = 0;
const intrinsic: Node = <div />;
const view: USXChildren = (
    <button on-click={() => count++} title={() => `${count} clicks`}>
        <Heading>Clicked {syncText(() => count)} times</Heading>
    </button>
);

const div: HTMLDivElement = jsx("div", {children: view});
const circle: SVGCircleElement = jsx("circle", {cx: 10, cy: 10, r: 5});

syncElement(div, [() => count, " clicks"], (nextCount, suffix) => {
    const label: string = `${nextCount}${suffix}`;
    div.title = label;
});

syncUI();
void intrinsic;
void circle;

// @ts-expect-error syncText only accepts values that can be rendered as text.
syncText(() => ({count}));
