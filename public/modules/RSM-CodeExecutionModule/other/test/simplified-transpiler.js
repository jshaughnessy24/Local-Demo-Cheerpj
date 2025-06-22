// THIS FILE IS OUTDATED

var lastResult = "";

async function toTS() {
    console.log("***************************");
    console.log("Attempt java -> typescript");

    let rawJava = editorInput.getValue();
    console.log("Raw editor java: \n", rawJava);

    const tjs_url = 'https://transpiler.vrobotsim.online/students/convert-js'; // this server converts java to typescript

    let transpiledTS;

    console.time("Java to Typescript Time");

    try {
        await axios({
            method: 'post',
            url: tjs_url,
            data: { javaCode: rawJava }
        }).then(
            (response) => {
                transpiledTS = response.data;
                console.log("Response body: ", response);

                console.log("Transpiled typescript: \n", transpiledTS);
                editorOutput.getDoc().setValue("" + transpiledTS);
                lastResult = transpiledTS;
            });
    } catch (e) {
        console.error(e);
        editorOutput.getDoc().setValue("" + e + "\n\n\n");
    }

    console.timeEnd("Java to Typescript Time");

}

async function toJS() {
    console.log("***************************");
    console.log("Attempt java -> typescript");

    let rawTS = editorInput.getValue();
    console.log("Raw editor TS: \n", rawTS);

    console.time("Typescript to Javascript Time");

    // See API: https://microsoft.github.io/TypeScript-New-Handbook/reference/compiler-options/
    let transpiledJS = ts.transpileModule(rawTS, { compilerOptions: { 
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2015
    }});
    console.timeEnd("Typescript to Javascript Time");
    console.log("Response body: ", transpiledJS);
    console.log("Transpiled javascript: \n", transpiledJS.outputText);
    editorOutput.getDoc().setValue("" + transpiledJS.outputText);
    lastResult = transpiledJS.outputText;
}

async function legacyJavaToJS() {
    let rawJava = editorInput.getValue();

    const tjs_url = 'https://transpiler.vrobotsim.online/students/convert-js'; // this server converts java to typescript
    convert_2js(tjs_url, rawJava)
        .then(({ rawJava, rawTS, rawJS, resultMessage, finalResult}) => {
            console.log("Raw transpiled TS code: \n", rawTS);
            console.log("Raw transpiled JS code: \n", rawJS);
            console.log("=====v=====> js code source start <=====v===== \n",
                        finalResult,
                        "\n=====^=====> js code source ends  <=====^=====");

            if (resultMessage == "parse error") {
                console.log("<Java to Javascript Failed!>\n" + finalResult);
                editorOutput.getDoc().setValue("" + finalResult);
            } else {
                console.log("Successfully transpiled java to javascript");
                editorOutput.getDoc().setValue("" + finalResult);
            }
        });
}