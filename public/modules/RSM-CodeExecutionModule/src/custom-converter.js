let OpMode = ""

const replaceJSString = [
    , ["{}", "{\n}"]
]

const functionReplacementMap = [ // note: do not include parentheses in here
    { find: "waitForStart", replace: "linearOpMode.waitForStart", expression: undefined },
    { find: "idle", replace: "linearOpMode.idle", expression: undefined },
    { find: "sleep", replace: "linearOpMode.sleep", expression: undefined },
    { find: "opModeIsActive", replace: "linearOpMode.opModeIsActive", expression: undefined },
    { find: "isStarted", replace: "linearOpMode.isStarted", expression: undefined },
    { find: "isStopRequested", replace: "linearOpMode.isStopRequested", expression: undefined },
    { find: "requestOpModeStop", replace: "linearOpMode.requestOpModeStop", expression: undefined },
    { find: "getRuntime", replace: "linearOpMode.getRuntime", expression: undefined },
    { find: "resetStartTime", replace: "linearOpMode.resetStartTime", expression: undefined },
    { find: "Range.clip", replace: "range.clip", expression: undefined },
];

const asyncReplacementList = [
    "linearOpMode.waitForStart",
    "linearOpMode.sleep",
    "linearOpMode.idle"
];

var motorVars = {}
var colorVars = {}
var elapsedTimeVars = {}
var accelerateVars = {}
var normalizedColors = {}


const checkBrackets = (str) => {
    const openBrackets = (str.match(/{/g) || []).length;
    const closeBrackets = (str.match(/}/g) || []).length;
    const netChange = openBrackets - closeBrackets;
    return { openBrackets, closeBrackets, netChange };
}


const getBracketContent = (str) => {
    let returnStr = ""
    let bracketCount = 0

    for (var i = 0; i < str.length; i++) {
        if (str[i] == "(") bracketCount++
        else if (str[i] == ")") bracketCount--
        if (bracketCount < 0) break
        returnStr += str[i]
    }

    return returnStr

}

const valueConverter = (str) => {
    return str;
}
const capitalize = (str) => {
    const lower = str.toLowerCase();
    return str.charAt(0).toUpperCase() + lower.slice(1);
}
const valueSwapper = (str) => { // given a line of code, marches through until it finds a terminating ")". Then replaces the value with valueChecker(). Eg if ("(randomstuffinhere())) { "
    let parenthCount = 0;
    for (var i = 0; i < str.length; i++) {
        if (str[i] == "(") parenthCount++;
        else if (str[i] == ")") parenthCount--;
        if (parenthCount < 0) {
            return valueChecker(str.substring(0, i)) + str.substring(i, str.length);
        }
    }
    throw new Error("Could not find matching ending parenthesis for if statement");
}
const valueChecker = (str) => {
    var words = str.split(" ")
    if (words.length > 0) {
        for (var i = 0; i < words.length; i++)
            words[i] = valueConverter(words[i]);
        return words.join(" ")
    } else
        return str;
}

const typescriptProcessor = (tsCode) => {
    // Note that this is easiest to understand in typescript and with intellisense. See the tsTransformer.ts file
    let sourceFile = ts.createSourceFile(
        "tsCode.ts", tsCode, ts.ScriptTarget.Latest
    );

    // helpers
    const printer = ts.createPrinter();

    // Remove "export" keyword from classes
    const exportRemoverTransformer = (context) => {
        return (rootNode) => {
            function visit(node) {
                node = ts.visitEachChild(node, visit, context);

                if (ts.isClassDeclaration(node) && ts.isModifier(node.modifiers[0])) {
                    return context.factory.updateClassDeclaration(
                        node, node.modifiers.filter(m => m.kind !== ts.SyntaxKind.ExportKeyword),
                        node.name, node.typeParameters, node.heritageClauses, node.members);
                }
                return node;
            }

            return ts.visitNode(rootNode, visit);
        };
    };
    // Replace type casts with internalCaster.cast(object, type)
    const typeCastTransformer = (context) => {
        return (rootNode) => {
            function visit(node) {
                node = ts.visitEachChild(node, visit, context);

                if (ts.isTypeAssertionExpression(node)) {
                    return context.factory.createCallExpression(
                        context.factory.createPropertyAccessExpression(
                            context.factory.createIdentifier("VRSJavaInternals"),
                            context.factory.createIdentifier("castObject")
                        ),
                        undefined,
                        [node.expression, context.factory.createIdentifier(node.type.getText(sourceFile))]
                    );
                }
                return node;
            }

            return ts.visitNode(rootNode, visit);
        };
    };
    // Replace certain functions with their equivalent
    const functionReplaceTransformer = (context) => {
        return (rootNode) => {
            function visit(node) {
                node = ts.visitEachChild(node, visit, context);

                if (ts.isCallExpression(node)) {
                    let str = node.expression.getText(sourceFile);

                    let replacementPair = functionReplacementMap.find(pair => pair.find === str);
                    if (replacementPair) {
                        if (!replacementPair.expression) { // if not in memory
                            // convert string to expression
                            let replacementSrcFile = ts.createSourceFile("temp.ts", replacementPair.replace, ts.ScriptTarget.Latest);
                            let newExpression = replacementSrcFile.statements[0].getChildAt(0, replacementSrcFile); // gets first line (statement) and its first child
                            if (ts.isPropertyAccessExpression(newExpression) || ts.isIdentifier(newExpression)) {
                                replacementPair.expression = newExpression; // record into memory
                                return context.factory.updateCallExpression(node, newExpression, node.typeArguments, node.arguments);
                            }
                        } else { // if in memory just use it
                            return context.factory.updateCallExpression(node, replacementPair.expression, node.typeArguments, node.arguments);
                        }
                    }
                }
                return node;
            }

            return ts.visitNode(rootNode, visit);
        };
    };
    // Add linearOpMode.idle() into loops
    const sleepLoopTransformer = (context) => {
        return (rootNode) => {
            function injectIdle(statement) {
                if (ts.isBlock(statement)) {
                    return context.factory.updateBlock(statement, [
                        context.factory.createExpressionStatement(context.factory.createCallExpression(
                            context.factory.createPropertyAccessExpression(
                                context.factory.createIdentifier("linearOpMode"),
                                context.factory.createIdentifier("idle")
                            ),
                            undefined,
                            []
                        )),
                        ...statement.statements
                    ]);
                } else {
                    return context.factory.createBlock([
                        context.factory.createExpressionStatement(context.factory.createCallExpression(
                            context.factory.createPropertyAccessExpression(
                                context.factory.createIdentifier("linearOpMode"),
                                context.factory.createIdentifier("idle")
                            ),
                            undefined,
                            []
                        )),
                        statement
                    ]);
                }
            }
            function visit(node) {
                node = ts.visitEachChild(node, visit, context);

                if (ts.isDoStatement(node)) {
                    return context.factory.updateDoStatement(node, injectIdle(node.statement), node.expression);
                } else if (ts.isWhileStatement(node)) {
                    return context.factory.updateWhileStatement(node, node.expression, injectIdle(node.statement));
                } else if (ts.isForStatement(node)) {
                    return context.factory.updateForStatement(node, node.initializer, node.condition, node.incrementor, injectIdle(node.statement));
                } else if (ts.isForInStatement(node)) {
                    return context.factory.updateForInStatement(node, node.initializer, node.expression, injectIdle(node.statement));
                } else if (ts.isForOfStatement(node)) {
                    return context.factory.updateForOfStatement(node, node.awaitModifier, node.initializer, node.expression, injectIdle(node.statement));
                }
                return node;
            }

            return ts.visitNode(rootNode, visit);
        };
    };
    // Add async await to certain function calls
    const asyncifyTransformer = (context) => {
        return (rootNode) => {
            function visit(node) {
                node = ts.visitEachChild(node, visit, context);

                if (ts.isCallExpression(node)) {
                    let str = node.expression.getText(sourceFile);

                    if (asyncReplacementList.includes(str)) {
                        return context.factory.createAwaitExpression(node);
                    }
                }
                return node;
            }

            return ts.visitNode(rootNode, visit);
        };
    };

    const activeTransformers = [typeCastTransformer, exportRemoverTransformer, functionReplaceTransformer, sleepLoopTransformer, asyncifyTransformer];

    const finalTransformedSourceFile = activeTransformers.reduce((lastSourceFile, transformer) => {
        const transformationResult = ts.transform(lastSourceFile, [transformer]);
        const transformedSourceFile = transformationResult.transformed[0];
        sourceFile = ts.createSourceFile("code.ts", printer.printNode(ts.EmitHint.Unspecified, transformedSourceFile, undefined), ts.ScriptTarget.Latest);;
        return sourceFile;
    }, sourceFile);

    return printer.printNode(
        ts.EmitHint.Unspecified,
        finalTransformedSourceFile,
        undefined
    );
}

const customConvert = (str) => {
    let result = str;
    // this check sees if the user forgot to include a java type when initializing the variable
    // which transpiles into a set variable with no let and no this. Very dumb, and limited to hardwaremap
    if (/(let )?(this\.)?(\w+) = hardwareMap\.get\((\w+), "(\w+)"\);/.test(str)) {
        let hardmaps = /(let )?(this\.)?(\w+) = hardwareMap\.get\((\w+), "(\w+)"\);/g.exec(result);
        if (!hardmaps || hardmaps.length < 6) throw new Error("HardwareMap parse failed: " + str);
        const letPrefix = hardmaps[1];
        const thisPrefix = hardmaps[2];
        const varName = hardmaps[3];
        const deviceType = hardmaps[4];
        const deviceName = hardmaps[5];
        if ((letPrefix && thisPrefix) || (!letPrefix && !thisPrefix)) throw new Error("HardwareMap variable '" + varName + "' not initialized properly.");
        if (letPrefix) return str;
        return "let " + str; // because this. are deleted, we need to insert let. (temporary solution)
    }

    // else if (str.includes("GoToPosition(")) { // not sure what this is
    //     let sides = str.split("GoToPosition(");
    //     const value = valueChecker(sides[1].split(");")[0]);
    //     return `${sides[0]} GoToPosition(${value});`;
    // }
    else if (str.includes("telemetry.addData(")) {
        let sides = str.split("telemetry.addData(")[1].split(");")[0]
        // .split(" ")
        let bracketCount = 0
        let s = 0
        for (s = 0; s < sides.length; s++) {
            if (sides[s] == '(') bracketCount++
            else if (sides[s] == ')') bracketCount--
            if (bracketCount == 0 && sides[s] == ',') break;
        }
        sides = [sides.substring(0, s), sides.substring(s + 2, sides.length)]
        let newVars = []
        sides.map(item => {
            newVars.push(valueChecker(item))
        })
        newVars = newVars.join(", ");
        return `telemetry.addData(${newVars});`
    } else
        return valueChecker(str);
}
async function convert_2js(url, javaCode) {
    var rawTS = "";
    var processedTS = "";
    var rawJS = ""
    var resultMessage = "";
    var result = "";
    var jsString = '';
    var brackets = 0;
    var funcBlocks = {};
    var funcValues = {};
    var existingVars = [];
    var funcName = '';
    var lineTxt = "";

    try {
        // Log raw editor code
        console.log("Raw editor code:\n" + javaCode);

        // Convert java to typescript
        await axios({
            method: 'post',
            url: url,
            data: {
                javaCode: javaCode
            }
        }).then(response => {
            rawTS = response.data;
        });

        // Log raw TS code
        console.log("Raw transpiled TS code:\n" + rawTS);

        // Process the TS AST with any changes we want
        processedTS = typescriptProcessor(rawTS);

        // Log processed TS code
        console.log("Processed TS code:\n" + processedTS);
        
        // Convert typescript to javascript
        rawJS = ts.transpileModule(processedTS, {
            compilerOptions: {
                module: ts.ModuleKind.CommonJS,
                target: ts.ScriptTarget.ES2017, // We need ES2017 for async/await
            }
        }).outputText;

        // Log JS code
        console.log("Raw transpiled JS code:\n" + rawJS);

        // Determine what type of OpMode we are working with
        if (/public class (\w+) extends LinearOpMode/.test(javaCode)) {
            OpMode = "LinearOpMode";
        } else if (/public class (\w+) extends OpMode/.test(javaCode)) {
            OpMode = "OpMode";
        } else {
            throw new Error("No OpMode or LinearOpMode found");
        }

        // Start replacing stuff
        result = rawJS;
        replaceJSString.map(word => {
            result = result.replaceAll(word[0], word[1])
        });

        // Total remove vars
        result = result.replaceAll(/: (\w+);/g, " = null;")
        result = result.replaceAll(/<(\w+)>/g, "")
        result = result.replaceAll(/\bparseFloat\b/g, "")




        // Analyze each line
        result = result.split('\n');
        for (let i = 1; i < result.length; i++) {
            lineTxt = result[i].trim();

            let bracketCounter = checkBrackets(lineTxt);
            brackets += bracketCounter.netChange;

            // var
            if (brackets == 1 && !funcName) {
                // Capture function definitions: specifically the name of function and any args
                const values = /(\w+)\((.*)\) {/.exec(lineTxt);
                funcName = values[1];
                funcBlocks[funcName] = [];
                funcValues[funcName] = values[2];
            } else if (brackets > 0) {

                var jsLine = customConvert(lineTxt);
                if (jsLine != "") funcBlocks[funcName].push(jsLine);

            } else if (brackets == 0 && funcName) {
                if (funcName != 'constructor')
                    funcBlocks[funcName] = funcBlocks[funcName].join("\n");
                funcName = '';
            } else if (brackets == 0 && !funcName && bracketCounter.netChange == 0 && bracketCounter.openBrackets > 0) {
                // We've got an empty function. Keep it so it stays defined
                const values = /(\w+)\((.*)\) {(.*)}/.exec(lineTxt);
                funcName = values[1];
                funcBlocks[funcName] = values[3];
                funcValues[funcName] = values[2];
                funcName = "";
            }
        }

        console.log("Vars : ", motorVars, colorVars, funcBlocks, funcValues)
        // funcBlocks['runOpMode'] = funcBlocks['runOpMode'].join("\n")
        if (typeof funcBlocks['constructor'] != 'function' && funcBlocks['constructor'])
            funcBlocks['constructor'].map(line => {
                if (line.includes("super(")) return false; // skip super() line
                const varValue = line.trim().split(" = ")
                if (motorVars[varValue[0]] != undefined || colorVars[varValue[0]] != undefined) return false

                if (existingVars.includes(varValue[0])) { // fix duplicate var declarations
                    jsString += line + "\n";
                } else {
                    jsString += "let " + line + "\n";
                    existingVars.push(varValue[0]);
                }
            })
        Object.keys(funcBlocks).map(key => {
            if (key === 'constructor') return
            Object.keys(funcBlocks).map(key1 => {
                if (key == key1 || key1 === 'constructor') return
                let regex = new RegExp("(this\\.)?" + key + "\\(", "g"); // replace "this.key(" or "key("
                funcBlocks[key1] = funcBlocks[key1].replaceAll(regex, ("await " + key + "("));
            })
        })

        Object.keys(funcBlocks).map(key => {
            if (key != "constructor")
                jsString += `async function ${key}(${funcValues[key]}) {
                ${funcBlocks[key]}
            }\n`
        })

        // remove "this."
        jsString = jsString.replaceAll("this.", "");

        // Branch depending on what type of opmode we're handling
        if (OpMode == "LinearOpMode") {
            // Add base implementation
            jsString = `
            const gamepad1 = new Gamepad(0);
            const gamepad2 = new Gamepad(1);
            ` + jsString;

            // Append run method
            jsString += `await runOpMode();`;
        } else {
            // Add base implementations for empty user methods (non-abstract)
            jsString = `
            const gamepad1 = new Gamepad(0);
            const gamepad2 = new Gamepad(1);
            async function init_loop() {}
            async function start() {}
            async function stop() {}
            ` + jsString;

            // Append run method
            jsString += `
            async function runOpMode() {
                await init();
                while (!linearOpMode.isStarted()) {
                  await init_loop();
                  await linearOpMode.sleep(1);
                }
                await start();
                while (linearOpMode.opModeIsActive()) {
                  await loop();
                  await linearOpMode.sleep(1);
                }
                await stop();
              }

            await runOpMode();`;
        }
        jsString = js_beautify(jsString);

        resultMessage = "success";

    } catch (e) {
        console.log("Got stuck on line:", lineTxt);
        console.log("parse error : ", e);
        resultMessage = "parse error";
        jsString = e;
    }

    return {
        javaCode,
        rawTS,
        rawJS,
        resultMessage,
        finalResult: jsString
    }
}