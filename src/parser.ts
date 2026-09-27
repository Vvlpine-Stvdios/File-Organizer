import { join                   } from "node:path";
import { Language, Parser, Tree } from "web-tree-sitter";

let CSharpLanguage: Language | undefined;

/**
 * Initializes Tree-Sitter and allows for parsers to be created.
 * Currently only loads C#
 * @param { string } extensionPath The file path to the extension root folder.
 */
export async function initParser(extensionPath: string): Promise<void> {
	// Initialize tree-sitter
	await Parser.init();

	// Load the CSharp WASM if it hasn't been loaded yet.
	if (!CSharpLanguage) {
		const wasmPath = join(extensionPath, "wasm", "tree-sitter-c_sharp.wasm");
		CSharpLanguage = await Language.load(wasmPath);
	}
}

/**
 * Creates a Tree-Sitter parser for C#.
 * @throws `Error`: Must call initParser() before this function can run.
 * @returns { Parser }
 */
export function createParser(): Parser {
	// Sanity Check
	if (!CSharpLanguage) {
		throw new Error("Parser not initialized; call `initParser()` first.");
	}

	const parser: Parser = new Parser();
	parser.setLanguage(CSharpLanguage);

	return parser;
}

/**
 * Parses the given file assuming C#.
 * @param   { string } source
 * @throws  `Error`: When the parser fails to parse the source file.
 * @returns { Tree }
 */
export function parse(source: string): Tree {
	const tree: Tree | null = createParser().parse(source);

	if (tree === null) {
		throw new Error("Failed to create tree.");
	}

	return tree;
}