"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchPx = /^(left|top|right|bottom|width|height|(margin|padding|border)(Left|Top|Right|Bottom)?(Width)?|border(Top|Bottom)?(Left|Right)?Radius|(min|max)Width|flexBasis|fontSize)$/;
var matchSVGEl = /^(svg|line|circle|rect|ellipse|path|image|poly(gon|line)|text(Path)?|g)$/;
var directAttribute = /^(value|checked)$/;
var isEvent = /^on[A-Z]/;
var SVGNS = "http://www.w3.org/2000/svg";
var Component = /** @class */ (function () {
    function Component(props, children) {
        this.props = props;
        this.children = children;
    }
    return Component;
}());
exports.Component = Component;
function createUIContext() {
    var elementMap = new Map();
    var inUpdateUI = false;
    function forEachUI(cb) {
        elementMap.forEach(function (map, el) {
            cb(el);
        });
    }
    function updateUI() {
        if (inUpdateUI) {
            return;
        }
        inUpdateUI = true;
        try {
            elementMap.forEach(function (map, el) {
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
    function action(fn) {
        try {
            return fn();
        }
        finally {
            updateUI();
        }
    }
    function unmountUI(el) {
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
            unmountUI(c);
        }
    }
    function clearUI() {
        elementMap.clear();
    }
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
    function onUpdateUI(el, callback) {
        dataForEl(el, true).updates.push(callback);
        callback(el);
    }
    function onUnmountUI(el, callback) {
        dataForEl(el, true).unmounts.push(callback);
    }
    function applyStyleProp(el, k, val) {
        if (typeof val === "number" && exports.matchPx.test(k))
            el.style[k] = val + "px";
        else
            el.style[k] = val;
    }
    function applyAttribute(el, k, val) {
        if (k.startsWith("__"))
            return;
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
            onUpdateUI(el, function () { return callback(pval()); });
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
        else if (c instanceof Component) {
            append(el, c._render, before);
        }
        else if (needsApply(c)) {
            var c1_1 = document.createTextNode("");
            var c2_1 = document.createTextNode("");
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
        else if (typeof tag === "function" && tag.prototype instanceof Component) {
            var instance = new tag(props, children);
            instance._render = instance.render(props, children);
            return instance;
        }
        else if (typeof tag === 'function') {
            return tag(props, children);
        }
        else {
            return null;
        }
    }
    usx.create = createUIContext;
    usx.update = updateUI;
    usx.onUpdate = onUpdateUI;
    usx.onUnmount = onUnmountUI;
    usx.unmount = unmountUI;
    usx.forEach = forEachUI;
    usx.clear = clearUI;
    return usx;
}
var usx = createUIContext();
exports.default = usx;
