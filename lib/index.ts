type Doer = {
    do(callback:()=>void);
}

const matchPx = /^(left|top|right|bottom|width|height|(margin|padding|border)(Left|Top|Right|Bottom)(Width)?|border(Top|Bottom)?(Left|Right)?Radius|(min|max)Width|flexBasis|fontSize)$/;
const matchSVGEl = /^svg|line|circle|rect|ellipse|path|image|poly(gon|line)|text(Path)?|g$/;
const SVGNS = "http://www.w3.org/2000/svg";

function applyStyleProp(el, k, val) {
    if (typeof val === "number" && matchPx.test(k))
    el.style[k] = val + "px";
else
    el.style[k] = val;

}

function setAttribute(el, prop, val) {
    if (val == null || prop == "$ctx") {
        return;
    }
    if (prop.length > 2 && prop.substring(0, 2) === "on") {
        el[prop.toLowerCase()] = val;
    } else if (prop === "style") {
        if (typeof val === "object" && val != null) {
            Object.keys(val).forEach(k=>{
                let stylePropVal = val[k];

                if (typeof stylePropVal === "function") {
                    stylePropVal((v)=>applyStyleProp(el, k, v));
                } else {
                    applyStyleProp(el, k, stylePropVal);
                }
            });
        }
    } else if (typeof val === "function") {
        val((v)=>el.setAttribute(prop, v));
    } else {
        el.setAttribute(prop, val);
    }
}

function append(el, c, before:Node) {
    if (c == null) return;
    if (c instanceof Node) {
        if (before)
            el.insertBefore(c, before);
        else
            el.appendChild(c);
    } else if (c instanceof Array) {
        c.forEach(i => append(el, i, before));
    } else if (typeof c === "function") {
        const c1 = document.createComment("");
        const c2 = document.createComment("");
        el.appendChild(c1);
        el.appendChild(c2);
        c((v)=>{
            while (c1.nextSibling != c2) {
                el.removeChild(c1.nextSibling);
            }
            append(el, v, c2);
        });
    } else if (c != null) {
        if (before)
            el.insertBefore(document.createTextNode("" + c), before);
        else
            el.appendChild(document.createTextNode("" + c));
    }
}

export default function usx(tag, props, ...children) {
    if (typeof tag === 'string') {
        const el = matchSVGEl.test(tag) ? document.createElementNS(SVGNS, tag) : document.createElement(tag);
        append(el, children,null);
        if (props != null) {
            Object.keys(props).forEach(k => setAttribute(el, k, props[k]));
        }

        return el;
    } else if (typeof tag === 'function') {
        const result = tag(props, ...children);
        return result;
    } else {
        return null;
    }
}

