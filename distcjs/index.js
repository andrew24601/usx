"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var matchPx = /^(left|top|right|bottom|width|height|(margin|padding|border)(Left|Top|Right|Bottom)(Width)?|border(Top|Bottom)?(Left|Right)?Radius|(min|max)Width|flexBasis|fontSize)$/;
var matchSVGEl = /^svg|line|circle|rect|ellipse|path|image|poly(gon|line)|text(Path)?|g$/;
var SVGNS = "http://www.w3.org/2000/svg";
var callbackMap = new Map();
var debug = false;
function enableDebugging() {
    debug = true;
}
exports.enableDebugging = enableDebugging;
function updateUI() {
    callbackMap.forEach(function (callbacks, el) {
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
        for (var _i = 0, callbacks_1 = callbacks; _i < callbacks_1.length; _i++) {
            var cb = callbacks_1[_i];
            cb();
        }
    });
}
exports.updateUI = updateUI;
function act(fn) {
    try {
        fn();
    }
    finally {
        updateUI();
    }
}
exports.act = act;
function unmount(el) {
    callbackMap.delete(el);
    for (var c = el.firstElementChild; c; c = c.nextElementSibling)
        unmount(c);
}
exports.unmount = unmount;
function onUpdate(el, callback) {
    var callbacks = callbackMap.get(el);
    if (callbacks == null) {
        callbacks = [];
        callbackMap.set(el, callbacks);
    }
    callbacks.push(callback);
}
exports.onUpdate = onUpdate;
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
    return (typeof val === 'function');
}
function applyValue(el, pval, callback) {
    if (typeof pval === 'function') {
        callback(pval());
        onUpdate(el, function () { return callback(pval()); });
    }
    else {
        callback(pval);
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
