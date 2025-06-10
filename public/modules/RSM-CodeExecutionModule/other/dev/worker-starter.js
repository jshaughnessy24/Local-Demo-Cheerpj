var postToWorker;

(function() {
    createWorker();

    function createWorker() {
        let worker = new Worker("assets/js/worker-code.js", { type: "module" });

        worker.onmessage = function ({ data: { type, data } }) {
            if (type && typeof (type) === "string") {
                processWorkerRequest(type, data);
            } else {
                postToWorker("ERROR", { message: "Invalid request from worker", error: arguments[0] });
                editorOutput.getDoc().setValue("Error:\n\tInvalid request from worker");
            }
        };

        function postToWorker(type, data) {
            console.log("postToWorker(", type, ",", data, ")");
            worker.postMessage({ type: type, data: data });
        }

        function processWorkerRequest(type, data) {
            console.log("processWorkerRequest(", type, ",", data,")");
            switch (type) {
                default:
                    postToWorker("ERROR", { message: "Unknown request type", error: { type, data } });
                    break;
                case "GET": // get a sensor value (eg distanceSensor inches)
                    postToWorker("ERROR", { message: "GET data not implemented", error: null });
                    break;
                case "POST": // update a value (eg motor direction)
                    postToWorker("ERROR", { message: "POST value not implemented", error: null });
                    break;
                case "ERROR":
                    editorOutput.getDoc().setValue(editorOutput.getValue() + "\n" + data.message + "\n  " + data.error.stack);
                    break;
                case "PRINT":
                    editorOutput.getDoc().setValue(editorOutput.getValue() + data + "\n");
                    break;
                case "TELEMETRY":
                    editorOutput.getDoc().setValue(editorOutput.getValue() + data.join("\n") + "\n");
                    break;
                case "SPEECH-SYNTHESIS":
                    if ("speechSynthesis" in window) {
                        let { text, languageCode, countryCode } = data; // Note that original uses ISO 639 langCode while this uses BCP 47
                        let utterance = new SpeechSynthesisUtterance(text);
                        utterance.lang = languageCode || window.navigator.language;
                        window.speechSynthesis.speak(utterance);
                    } else {
                        console.log("Sorry, but Speech synthesis is not supported on your browser.");
                    }
                    break;
                case "RESTART":
                    console.log("Restart requested");
                    worker.terminate();
                    createWorker();
                    break;
                case "TERMINATE":
                    console.log("Termination requested");
                    worker.terminate();
                    break;
                case "PING":
                    console.log("Main got a PING");
                    break;
            }
        }

        globalThis.postToWorker = postToWorker;
    }
})();