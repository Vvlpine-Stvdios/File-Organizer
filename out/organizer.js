"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizeDocument = organizeDocument;
exports.documentTrim = documentTrim;
const vscode_1 = require("vscode");
const config_1 = require("./config");
const using_1 = require("./passes/using");
const parser_1 = require("./parser");
const members_1 = require("./passes/members");
function organizeDocument(document) {
    const config = (0, config_1.loadConfig)();
    const source = document.getText();
    const tree = (0, parser_1.parse)(source);
    const edits = [];
    edits.push(...(0, using_1.organizeUsingStatementsPass)(document, tree, config.projectNamespaces));
    edits.push(...(0, members_1.organizeMembersPass)(document, tree, config));
    edits.push(...documentTrim(document));
    return resolveEditConflicts(edits);
}
/**
 * Removes all unnecessary newlines
 */
function documentTrim(document) {
    const edits = [];
    // If it's a blank document, return an empty array.
    if (document.lineCount === 0) {
        return edits;
    }
    // Find the first non-empty line.
    let firstNonEmptyLine = 0;
    while (firstNonEmptyLine < document.lineCount && document.lineAt(firstNonEmptyLine).isEmptyOrWhitespace) {
        firstNonEmptyLine++;
    }
    // If the entire file is blank lines, clear everything.
    if (firstNonEmptyLine === document.lineCount) {
        edits.push(vscode_1.TextEdit.delete(new vscode_1.Range(0, 0, document.lineCount, 0)));
        return edits;
    }
    // Remove leading whitespace
    if (firstNonEmptyLine > 0) {
        edits.push(vscode_1.TextEdit.delete(new vscode_1.Range(0, 0, firstNonEmptyLine, 0)));
    }
    // Find the last non-empty line.
    let lastNonEmptyLine = document.lineCount - 1;
    while (lastNonEmptyLine >= 0 && document.lineAt(lastNonEmptyLine).isEmptyOrWhitespace) {
        lastNonEmptyLine--;
    }
    // Remove ending whitespace
    if (lastNonEmptyLine < document.lineCount - 1) {
        edits.push(vscode_1.TextEdit.delete(new vscode_1.Range(document.lineAt(lastNonEmptyLine).range.end, document.lineAt(document.lineCount - 1).range.end)));
    }
    // Square consecutive blank lines
    let consecutiveEmptyLines = 0;
    let emptyBlockStart = -1;
    for (let i = firstNonEmptyLine + 1; i <= lastNonEmptyLine; i++) {
        if (document.lineAt(i).isEmptyOrWhitespace) {
            consecutiveEmptyLines++;
            if (consecutiveEmptyLines === 2) {
                emptyBlockStart = i;
            }
        }
        else {
            if (consecutiveEmptyLines > 1) {
                edits.push(vscode_1.TextEdit.delete(new vscode_1.Range(emptyBlockStart, 0, i, 0)));
            }
            consecutiveEmptyLines = 0;
        }
    }
    return edits;
}
/**
 * Resolves text-edit conflicts
 */
function resolveEditConflicts(edits) {
    const sorted = [...edits].sort((a, b) => {
        const startDifference = a.range.start.compareTo(b.range.start);
        if (startDifference !== 0) {
            return startDifference;
        }
        return b.range.end.compareTo(a.range.end);
    });
    const safeEdits = [];
    let lastEditEnd = null;
    for (const edit of sorted) {
        if (!lastEditEnd || edit.range.start.isAfterOrEqual(lastEditEnd)) {
            safeEdits.push(edit);
            lastEditEnd = edit.range.end;
        }
    }
    return safeEdits;
}
//# sourceMappingURL=organizer.js.map