"use strict";
import "./worker-globals.js";

// Import dependencies
import("./js-implementations/Gamepad.js").then(module => globalThis.Gamepad = module.Gamepad);
import("./js-implementations/ElapsedTime.js").then(module => globalThis.ElapsedTime = module.ElapsedTime);
import("./js-implementations/TimeUnit.js").then(module => globalThis.TimeUnit = module.TimeUnit);
import("./js-implementations/Telemetry.js").then(module => globalThis.Telemetry = module.Telemetry);


// enclosed to limit modification
const postToMain = (function () {
    self.onmessage = function ({ data: { type, data } }) {
        if (type && typeof (type) === "string") {
            processMainRequest(type, data);
        } else {
            console.logRaw(arguments[0]);
            postToMain("ERROR", { message: "Invalid request from main", error: arguments[0] });
        }
    };
    // prevent self.onmessage from modification
    Object.finalize(self, "onmessage");

    function postToMain(type, data) {
        console.logRaw("postToMain(", type, ",", data, ")");
        self.postMessage({ type: type, data: data });
    }

    function processMainRequest(type, data) {
        if (type === "CODE") console.log("processMainRequest(", type, ", [Code Not Logged] )");
        else console.log("processMainRequest(", type, ",", data, ")");

        switch (type) {
            case "CODE":
                console.logRaw("Worker received code from main:\n", data);
                try {
                    runCode(data);
                } catch (e) {
                    console.errorRaw(e);
                    postToMain("ERROR", { message: "Failed to run code", error: e });
                }
                //postToMain("RESTART", "Finished running code");
                break;
            case "DATA":

                break;
            case "ERROR":
                console.log("Worker received error from main:", { type, data });
                // do not post back to worker and cause infinite loop
                break;
            case "RESTART":
                postToMain("RESTART", "Main requested restart");
                break;
            default:
                postToMain("ERROR", { message: "Unknown request type: ", error: { type, data } });
                break;
        }
    }
    return postToMain;
})();

// prevent self.postToMain from modification
Object.finalize(self, "postToMain");

export { postToMain };

/****************************** Actually run code ******************************/

var exports = {}; // to emulate modules in transpiled code. Defined in global scope for importScripts access
console.log("******************* Restart Successful *******************");

function runCode(code) {
    "use strict";
    console.logRaw("Attempt to run: ", code);

    exports = {}; // reset exports object

    eval(code); // note to self, do not use async function constructor which doesn't have proper scoping
}
