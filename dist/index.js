var matchPx = /^(left|top|right|bottom|width|height|(margin|padding|border)(Left|Top|Right|Bottom)(Width)?|border(Top|Bottom)?(Left|Right)?Radius|(min|max)Width|flexBasis|fontSize)$/;
var matchSVGEl = /^svg|line|circle|rect|ellipse|path|image|poly(gon|line)|text(Path)?|g$/;
var SVGNS = "http://www.w3.org/2000/svg";
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
    }
    else if (prop === "style") {
        if (typeof val === "object" && val != null) {
            Object.keys(val).forEach(function (k) {
                var stylePropVal = val[k];
                if (typeof stylePropVal === "function") {
                    stylePropVal(function (v) { return applyStyleProp(el, k, v); });
                }
                else {
                    applyStyleProp(el, k, stylePropVal);
                }
            });
        }
    }
    else if (typeof val === "function") {
        val(function (v) { return el.setAttribute(prop, v); });
    }
    else {
        el.setAttribute(prop, val);
    }
}
function append(el, c, before) {
    if (c == null)
        return;
    if (c instanceof Node) {
        if (before)
            el.insertBefore(c, before);
        else
            el.appendChild(c);
    }
    else if (c instanceof Array) {
        c.forEach(function (i) { return append(el, i, before); });
    }
    else if (typeof c === "function") {
        var c1_1 = document.createComment("");
        var c2_1 = document.createComment("");
        el.appendChild(c1_1);
        el.appendChild(c2_1);
        c(function (v) {
            while (c1_1.nextSibling != c2_1) {
                el.removeChild(c1_1.nextSibling);
            }
            append(el, v, c2_1);
        });
    }
    else if (c != null) {
        if (before)
            el.insertBefore(document.createTextNode("" + c), before);
        else
            el.appendChild(document.createTextNode("" + c));
    }
}
export default function usx(tag, props) {
    var children = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        children[_i - 2] = arguments[_i];
    }
    if (typeof tag === 'string') {
        var el_1 = matchSVGEl.test(tag) ? document.createElementNS(SVGNS, tag) : document.createElement(tag);
        append(el_1, children, null);
        if (props != null) {
            Object.keys(props).forEach(function (k) { return setAttribute(el_1, k, props[k]); });
        }
        return el_1;
    }
    else if (typeof tag === 'function') {
        var result = tag.apply(void 0, [props].concat(children));
        return result;
    }
    else {
        return null;
    }
}
