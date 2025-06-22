// add String.format() and "str".format()
import "./format4js.js";
import { postToMain } from "./worker-code.js";

// Add Object.finalize
Object.finalize = function (parent, propertyName) {
    Object.defineProperty(parent, propertyName, { value: parent[propertyName], configurable: false, enumerable: false, writable: false });
}
Object.finalize(Object, "finalize");
Object.finalize(Object, "defineProperty");


// Override console.log(), console.warn(), and console.error()
console.logRaw = console.log;
console.warnRaw = console.warn;
console.errorRaw = console.error;

console.log = function (...args) {
    postToMain("PRINT", args.join(" "));
    console.logRaw(...args)
};
console.warn = function (...args) {
    postToMain("PRINT", args.join(" "));
    console.warnRaw(...args)
};
console.error = function (...args) {
    postToMain("ERROR", args.map(e => e.stack).join(" "));
    console.errorRaw(...args);
};
Object.finalize(self, "console");
Object.finalize(console, "logRaw");
Object.finalize(console, "warnRaw");
Object.finalize(console, "errorRaw");
Object.finalize(console, "log");
Object.finalize(console, "warn");
Object.finalize(console, "error");

