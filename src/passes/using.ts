import { TextDocument, TextEdit, Range } from "vscode";
import { Tree,         Node            } from "web-tree-sitter";

/**
 * Formats all using statements.
 */
export function organizeUsingStatementsPass(document: TextDocument, tree: Tree, projectNamespaces: string[]): TextEdit[] {
	const root       : Node   = tree.rootNode;
	const usingNodes : Node[] = root.children.filter((n: Node): boolean => n && n.type === "using_directive");

	if (usingNodes.length === 0) {
		return [];
	}

	const namespaces: string[] = usingNodes
		.map    ((n  : Node  ): string  => n!.text.replace(/^using\s+/, "").replace(/;\s*$/, "").trim())
		.filter ((ns : string): boolean => ns.length > 0);
	
	const formatted: string = organizeUsingStatments(namespaces, projectNamespaces).join("\n");

	const first : Node  = usingNodes[0]!;
	const last  : Node  = usingNodes[usingNodes.length - 1]!;
	const range : Range = new Range(
		document.positionAt(first.startIndex),
		document.positionAt(last .endIndex  )
	);

	return [TextEdit.replace(range, formatted)];
}

/**
 * Formats the using statements alphabetically, excluding project stuff
 * @param   { string[] } usingNamespaces All of the using statements in the file
 * @param   { string[] } projectRoots    Project namespaces
 * @returns { string[] }
 */
function organizeUsingStatments(usingNamespaces: string[], projectRoots: string[]): string[] {
	// Test if the current using statement is a project namespace
	const isProject: (ns: string) => boolean = (ns: string): boolean => projectRoots.some((root): boolean => ns === root || ns.startsWith(root + "."));

	// Get the root of the current using statement
	const root: (ns: string) => string = (ns: string): string => ns.split(".")[0];

	// Get all the non-project namespaces and all the project namespaces, respectively,
	// each sorted alphabetically.
	const nonProject : string[] = usingNamespaces.filter((ns): boolean => !isProject(ns)).sort();
	const project    : string[] = usingNamespaces.filter((ns): boolean =>  isProject(ns)).sort();

	// Format a group of using statement.
	const renderGroup : (group: string[]) => string[] = (group: string[]): string[] => {
		// Create array to store the formatted lines; record to store information about groups
		const lines : string[]                                       = [];
		const roots : Map<string, { index: number, number: number }> = new Map<string, { index: number, number: number }>();

		// Loop over lines, retrieving the index and the node.
		for (const [i, ns] of group.entries()) {
			// Get the root
			const r = root(ns);

			// If roots doesn't have r, add it.
			if (!roots.has(r)) { roots.set(r, { index: i, number: 0 }); }

			// Increment number in current group.
			lines.push(`using ${ ns };`);
			roots.get(r)!.number++;
		}

		// If every root only has one import associated with it, just smoosh them together.
		if ([...roots.entries()].every((r: [string, { index: number, number: number }]) => r[1].number == 1)) {
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
	const nonProjectLines : string[] = renderGroup(nonProject);
	const projectLines    : string[] = renderGroup( project  );

	// If there are only project or non-project lines, just return the ones that exist.
	if (nonProjectLines.length === 0 || projectLines.length === 0) {
		return [...nonProjectLines, ...projectLines];
	}

	// Return formatted lines.
	return [...nonProjectLines, "", ...projectLines];
}