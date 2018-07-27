var matchPx = /^(left|top|right|bottom|width|height|(margin|padding|border)(Left|Top|Right|Bottom)(Width)?|border(Top|Bottom)?(Left|Right)?Radius|(min|max)Width|flexBasis|fontSize)$/;
var matchSVGEl = /^svg|line|circle|rect|ellipse|path|image|poly(gon|line)|text(Path)?|g$/;
var SVGNS = "http://www.w3.org/2000/svg";
var ComponentRegistry = {};
export function WebComponent(name) {
    return function (constructor) {
        constructor["__WebComponent"] = name;
        ComponentRegistry[name.toLowerCase()] = constructor;
    };
}
function applyStyleProp(el, k, val) {
    if (typeof val === "number" && matchPx.test(k))
        el.style[k] = val + "px";
    else
        el.style[k] = val;
}
function applyAttribute(el, k, val) {
    el.setAttribute(k, val);
}
function needsApply(val) {
    return ((typeof val === 'object' && typeof val.then === 'function') ||
        (typeof val === 'object' && typeof val.value === 'function'));
}
function applyValue(val, callback) {
    if (typeof val === 'object' && typeof val.then === 'function') {
        val.then(function (v) { return callback(v); });
    }
    else if (typeof val === 'object' && typeof val.value === 'function') {
        callback(val.value());
        if (typeof val.on === 'function') {
            val.on("update", function (v) { return callback(v); });
        }
    }
    else {
        callback(val);
    }
}
function setAttribute(el, prop, val) {
    if (val == null) {
        return;
    }
    if (prop.length > 2 && prop.substring(0, 2) === "on") {
        el[prop.toLowerCase()] = val;
    }
    else if (prop === "style") {
        if (typeof val === "object" && val != null) {
            Object.keys(val).forEach(function (k) {
                var stylePropVal = val[k];
                applyValue(stylePropVal, function (v) { return applyStyleProp(el, k, v); });
            });
        }
    }
    else {
        applyValue(val, function (v) { return applyAttribute(el, prop, v); });
    }
}
function applyContent(el, c1, c2, v) {
    while (c1.nextSibling != c2) {
        el.removeChild(c1.nextSibling);
    }
    append(el, v, c2);
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
    else if (typeof c === "object" && "constructor" in c && c.constructor.__WebComponent != null) {
        append(el, c._el, before);
    }
    else if (needsApply(c)) {
        var c1_1 = document.createComment("");
        var c2_1 = document.createComment("");
        el.appendChild(c1_1);
        el.appendChild(c2_1);
        applyValue(c, function (v) { return applyContent(el, c1_1, c2_1, v); });
    }
    else if (typeof c === 'object' && typeof c.on === 'function') {
        c.on('data', function (v) {
            el.appendChild(document.createTextNode("" + v));
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
        var result = void 0;
        if (tag["__WebComponent"] != null) {
            return new tag(props, children);
        }
        else
            return tag(props, children);
    }
    else {
        return null;
    }
}
function componentFromDOM(el, construct) {
    var props = {};
    var children = [];
    for (var i = 0; i < el.attributes.length; i++) {
        var attrib = el.attributes[i];
        props[attrib.name] = attrib.value;
    }
    for (var child = el.firstChild; child; child = child.nextSibling) {
        if (child.nodeType == 1 && ComponentRegistry[child.localName.toLowerCase()]) {
            children.push(componentFromDOM(child, ComponentRegistry[child.localName.toLowerCase()]));
        }
        else {
            children.push(child);
        }
    }
    return new construct(props, children);
}
export function automount(root) {
    if (root == null)
        root = document.body;
    for (var el = root.firstChild; el; el = el.nextSibling) {
        if (el.nodeType != 1)
            continue;
        var lowerName = el.localName.toLowerCase();
        if (ComponentRegistry[lowerName]) {
            var component = componentFromDOM(el, ComponentRegistry[lowerName]);
            append(el.parentElement, component, el);
            el.parentElement.removeChild(el);
        }
        else {
            automount(el);
        }
    }
}
