"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initParser = initParser;
exports.createParser = createParser;
exports.parse = parse;
const node_path_1 = require("node:path");
const web_tree_sitter_1 = require("web-tree-sitter");
let CSharpLanguage;
/**
 * Initializes Tree-Sitter and allows for parsers to be created.
 * Currently only loads C#
 * @param { string } extensionPath The file path to the extension root folder.
 */
async function initParser(extensionPath) {
    // Initialize tree-sitter
    await web_tree_sitter_1.Parser.init();
    // Load the CSharp WASM if it hasn't been loaded yet.
    if (!CSharpLanguage) {
        const wasmPath = (0, node_path_1.join)(extensionPath, "wasm", "tree-sitter-c_sharp.wasm");
        CSharpLanguage = await web_tree_sitter_1.Language.load(wasmPath);
    }
}
/**
 * Creates a Tree-Sitter parser for C#.
 * @throws `Error`: Must call initParser() before this function can run.
 * @returns { Parser }
 */
function createParser() {
    // Sanity Check
    if (!CSharpLanguage) {
        throw new Error("Parser not initialized; call `initParser()` first.");
    }
    const parser = new web_tree_sitter_1.Parser();
    parser.setLanguage(CSharpLanguage);
    return parser;
}
/**
 * Parses the given file assuming C#.
 * @param   { string } source
 * @throws  `Error`: When the parser fails to parse the source file.
 * @returns { Tree }
 */
function parse(source) {
    const tree = createParser().parse(source);
    if (tree === null) {
        throw new Error("Failed to create tree.");
    }
    return tree;
}
//# sourceMappingURL=parser.js.map