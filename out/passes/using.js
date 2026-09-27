"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizeUsingStatementsPass = organizeUsingStatementsPass;
const vscode_1 = require("vscode");
/**
 * Formats all using statements.
 */
function organizeUsingStatementsPass(document, tree, projectNamespaces) {
    const root = tree.rootNode;
    const usingNodes = root.children.filter((n) => n && n.type === "using_directive");
    if (usingNodes.length === 0) {
        return [];
    }
    const namespaces = usingNodes
        .map((n) => n.text.replace(/^using\s+/, "").replace(/;\s*$/, "").trim())
        .filter((ns) => ns.length > 0);
    const formatted = organizeUsingStatments(namespaces, projectNamespaces).join("\n");
    const first = usingNodes[0];
    const last = usingNodes[usingNodes.length - 1];
    const range = new vscode_1.Range(document.positionAt(first.startIndex), document.positionAt(last.endIndex));
    return [vscode_1.TextEdit.replace(range, formatted)];
}
/**
 * Formats the using statements alphabetically, excluding project stuff
 * @param   { string[] } usingNamespaces All of the using statements in the file
 * @param   { string[] } projectRoots    Project namespaces
 * @returns { string[] }
 */
function organizeUsingStatments(usingNamespaces, projectRoots) {
    // Test if the current using statement is a project namespace
    const isProject = (ns) => projectRoots.some((root) => ns === root || ns.startsWith(root + "."));
    // Get the root of the current using statement
    const root = (ns) => ns.split(".")[0];
    // Get all the non-project namespaces and all the project namespaces, respectively,
    // each sorted alphabetically.
    const nonProject = usingNamespaces.filter((ns) => !isProject(ns)).sort();
    const project = usingNamespaces.filter((ns) => isProject(ns)).sort();
    // Format a group of using statement.
    const renderGroup = (group) => {
        // Create array to store the formatted lines; record to store information about groups
        const lines = [];
        const roots = new Map();
        // Loop over lines, retrieving the index and the node.
        for (const [i, ns] of group.entries()) {
            // Get the root
            const r = root(ns);
            // If roots doesn't have r, add it.
            if (!roots.has(r)) {
                roots.set(r, { index: i, number: 0 });
            }
            // Increment number in current group.
            lines.push(`using ${ns};`);
            roots.get(r).number++;
        }
        // If every root only has one import associated with it, just smoosh them together.
        if ([...roots.entries()].every((r) => r[1].number == 1)) {
            return lines;
        }
        // Otherwise, insert newlines backwards through the map so indices stay the same (skipping the first group).
        for (const [, info] of [...roots.entries()].reverse()) {
            if (info.index !== 0) {
                lines.splice(info.index, 0, "");
            }
        }
        return lines;
    };
    // Format the non-project and project lines respectively.
    const nonProjectLines = renderGroup(nonProject);
    const projectLines = renderGroup(project);
    // If there are only project or non-project lines, just return the ones that exist.
    if (nonProjectLines.length === 0 || projectLines.length === 0) {
        return [...nonProjectLines, ...projectLines];
    }
    // Return formatted lines.
    return [...nonProjectLines, "", ...projectLines];
}
//# sourceMappingURL=using.js.map