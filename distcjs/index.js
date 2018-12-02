"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var matchPx = /^(left|top|right|bottom|width|height|(margin|padding|border)(Left|Top|Right|Bottom)(Width)?|border(Top|Bottom)?(Left|Right)?Radius|(min|max)Width|flexBasis|fontSize)$/;
var matchSVGEl = /^(svg|line|circle|rect|ellipse|path|image|poly(gon|line)|text(Path)?|g)$/;
var directAttribute = /^(value|checked)$/;
var isEvent = /^on[A-Z]/;
var SVGNS = "http://www.w3.org/2000/svg";
var elementMap = new Map();
var debug = false;
var inUpdateUI = false;
function enableDebugging() {
    debug = true;
}
exports.enableDebugging = enableDebugging;
function updateUI() {
    if (inUpdateUI) {
        /* develblock:start */
        if (debug) {
            console.log("Nested call to updateUI");
        }
        /* develblock:end */
        return;
    }
    inUpdateUI = true;
    try {
        elementMap.forEach(function (map, el) {
            /* develblock:start */
            if (debug) {
                var p = void 0;
                for (p = el; p; p = p.parentNode) {
                    if (p.nodeType == 9) {
                        break;
                    }
                }
                if (p == null) {
                    console.log("Updating unmounted [" + el.nodeName + "]");
                }
            }
            /* develblock:end */
            for (var _i = 0, _a = map.updates; _i < _a.length; _i++) {
                var cb = _a[_i];
                cb(el);
            }
        });
    }
    finally {
        inUpdateUI = false;
    }
}
exports.updateUI = updateUI;
function action(fn) {
    try {
        return fn();
    }
    finally {
        updateUI();
    }
}
exports.action = action;
function unmount(el) {
    try {
        var ed = dataForEl(el, false);
        if (ed) {
            for (var _i = 0, _a = ed.unmounts; _i < _a.length; _i++) {
                var cb = _a[_i];
                cb(el);
            }
        }
    }
    finally {
        elementMap.delete(el);
    }
    for (var c = el.firstElementChild; c; c = c.nextElementSibling) {
        unmount(c);
    }
}
exports.unmount = unmount;
function dataForEl(el, create) {
    var ed = elementMap.get(el);
    if (ed == null && create) {
        ed = {
            updates: [],
            unmounts: []
        };
        elementMap.set(el, ed);
    }
    return ed;
}
function onUpdateEl(el, callback) {
    dataForEl(el, true).updates.push(callback);
    callback(el);
}
exports.onUpdateEl = onUpdateEl;
function onUnmountEl(el, callback) {
    dataForEl(el, true).unmounts.push(callback);
}
exports.onUnmountEl = onUnmountEl;
function applyStyleProp(el, k, val) {
    if (typeof val === "number" && matchPx.test(k))
        el.style[k] = val + "px";
    else
        el.style[k] = val;
}
function applyAttribute(el, k, val) {
    if (el.tagName === "INPUT" && directAttribute.test(k))
        el[k] = val;
    else if (val != null)
        el.setAttribute(k, val);
    else
        el.removeAttribute(k);
}
function needsApply(val) {
    return (typeof val === 'function');
}
function applyValue(el, pval, callback) {
    if (typeof pval === 'function') {
        onUpdateEl(el, function () { return callback(pval()); });
    }
    else {
        callback(pval);
    }
}
function setAttribute(el, prop, val) {
    if (val == null) {
        return;
    }
    if (isEvent.test(prop)) {
        if (typeof val === "function") {
            el.addEventListener(prop.substr(2).toLowerCase(), function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return action(val.bind.apply(val, [this].concat(args)));
            });
        }
        /* develblock:start */
        else
            console.log("non-function event");
        /* develblock:end */
    }
    else if (prop === "style") {
        if (typeof val === "object" && val != null) {
            Object.keys(val).forEach(function (k) {
                var stylePropVal = val[k];
                applyValue(el, stylePropVal, function (v) { return applyStyleProp(el, k, v); });
            });
        }
    }
    else {
        applyValue(el, val, function (v) { return applyAttribute(el, prop, v); });
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
    else if (needsApply(c)) {
        var c1_1 = document.createComment("");
        var c2_1 = document.createComment("");
        el.appendChild(c1_1);
        el.appendChild(c2_1);
        applyValue(el, c, function (v) { return applyContent(el, c1_1, c2_1, v); });
    }
    else if (before) {
        el.insertBefore(document.createTextNode("" + c), before);
    }
    else {
        el.appendChild(document.createTextNode("" + c));
    }
}
function usx(tag, props) {
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
        return tag(props, children);
    }
    else {
        return null;
    }
}
exports.default = usx;
