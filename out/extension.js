"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode_1 = require("vscode");
const parser_1 = require("./parser");
const organizer_1 = require("./organizer");
async function activate(context) {
    await (0, parser_1.initParser)(context.extensionPath);
    context.subscriptions.push(vscode_1.languages.registerDocumentFormattingEditProvider({ language: "csharp", scheme: "file" }, {
        provideDocumentFormattingEdits(document) {
            return (0, organizer_1.organizeDocument)(document);
        }
    }));
    context.subscriptions.push(vscode_1.commands.registerCommand("file-organizer.organize", () => {
        const editor = vscode_1.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;
        const edit = new vscode_1.WorkspaceEdit();
        edit.set(document.uri, (0, organizer_1.organizeDocument)(document));
        vscode_1.workspace.applyEdit(edit);
    }));
}
function deactivate() { }
//# sourceMappingURL=extension.js.map