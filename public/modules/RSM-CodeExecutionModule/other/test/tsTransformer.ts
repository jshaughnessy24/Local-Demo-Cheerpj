/**
 * This file is just used for testing typescript ast modifications.
 * It should not be included in the final build.
 * 
 * Run this ts file by running: 
 *      bun run ./modules/RSM-CodeExecutionModule/other/test/tsTransformer.ts
 * Install bun by visiting (not available on Windows yet):
 *      https://bun.sh/
 */
import * as ts from "typescript";

const code = `
export class A { 
    public runOpMode(): void { 
        sleep(1000);

        do {
            stuff();
            stuff();
        } while (true);
        while (true) 
            stuff();
        
        for (let i = 0; i < 10; i++) 
            stuff();
        
        for (const key in object) {
            if (Object.prototype.hasOwnProperty.call(object, key)) {
                const element = object[key];
                
            }
        }
        for (const iterator of object) {
            stuff();
            while (true) {}
        }
        if () {}
        let x = <MyType>myObj;

    } 
}
`;

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
    "linearOpMode.idle",
];

let sourceFile = ts.createSourceFile("code.ts", code, ts.ScriptTarget.Latest);

const printer = ts.createPrinter();

/**
 * This transformer removes "export" keyword from classes
 */
const exportRemoverTransformer: ts.TransformerFactory<ts.Node> = (
    context: ts.TransformationContext
) => {
    return (rootNode) => {
        function visit(node: ts.Node): ts.Node {
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


/**
 * This transformer replaces type assertion expressions
 * with a call to `internalCaster.cast`.
 * 
 * Eg. '<OpticalDistanceSensor> colorSensor' 
 *        -> VRSJavaInternals.castObject(colorSensor, OpticalDistanceSensor)
 */
const typeCastTransformer: ts.TransformerFactory<ts.Node> = (
    context: ts.TransformationContext
) => {
    return (rootNode) => {
        function visit(node: ts.Node): ts.Node {
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

/**
 * This transformer replaces certain functions with their equivalent
 */
const functionReplaceTransformer: ts.TransformerFactory<ts.Node> = (
    context: ts.TransformationContext
) => {
    return (rootNode) => {
        function visit(node: ts.Node): ts.Node {
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

/**
 * This transformer injects a linearOpMode.idle() into 
 */
const sleepLoopTransformer: ts.TransformerFactory<ts.Node> = (
    context: ts.TransformationContext
) => {
    return (rootNode) => {
        function injectIdle(statement: ts.Statement): ts.Block {
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
        function visit(node: ts.Node): ts.Node {
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


/**
 * This transformer adds async await to certain functions
 */
const asyncifyTransformer: ts.TransformerFactory<ts.Node> = (
    context: ts.TransformationContext
) => {
    return (rootNode) => {
        function visit(node: ts.Node): ts.Node {
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

// For some reason, we need to recalculate the sourceFile after each Transform because added nodes do not update sourceFile and getText(sourceFile) no longer matches
const finalTransformedSourceFile = activeTransformers.reduce((lastSourceFile, transformer) => {
    const transformationResult = ts.transform(lastSourceFile, [transformer]);
    const transformedSourceFile = transformationResult.transformed[0];
    sourceFile = ts.createSourceFile("code.ts", printer.printNode(ts.EmitHint.Unspecified, transformedSourceFile, undefined), ts.ScriptTarget.Latest);;
    return sourceFile;
}, sourceFile);


const result = printer.printNode(
    ts.EmitHint.Unspecified,
    finalTransformedSourceFile,
    undefined
);

console.log("\n" + result); // const testsuffix: number = 1 + 2;

