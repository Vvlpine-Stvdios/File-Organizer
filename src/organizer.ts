import { TextDocument, TextEdit, Range, Position } from "vscode";
import { Tree                                    } from "web-tree-sitter";

import { Config, loadConfig          } from "./config";
import { organizeUsingStatementsPass } from "./passes/using";
import { parse                       } from "./parser";
import { organizeMembersPass         } from "./passes/members";

export function organizeDocument(document: TextDocument): TextEdit[] {
	const config : Config     = loadConfig       ();
	const source : string     = document.getText ();
	const tree   : Tree       = parse            (source);
	
	const edits  : TextEdit[] = [];

	edits.push(...organizeUsingStatementsPass(document, tree, config.projectNamespaces));
	edits.push(...organizeMembersPass        (document, tree, config                  ));
	edits.push(...documentTrim               (document                                ));

	return resolveEditConflicts(edits);
}

/**
 * Removes all unnecessary newlines
 */
export function documentTrim(document: TextDocument): TextEdit[] {
	const edits: TextEdit[] = [];

	// If it's a blank document, return an empty array.
	if (document.lineCount === 0) { return edits; }

	// Find the first non-empty line.
	let firstNonEmptyLine = 0;
	while (firstNonEmptyLine < document.lineCount && document.lineAt(firstNonEmptyLine).isEmptyOrWhitespace) { firstNonEmptyLine++; }

	// If the entire file is blank lines, clear everything.
	if (firstNonEmptyLine === document.lineCount) {
		edits.push(TextEdit.delete(new Range(0, 0, document.lineCount, 0)));

		return edits;
	}

	// Remove leading whitespace
	if (firstNonEmptyLine > 0) {
		edits.push(TextEdit.delete(new Range(0, 0, firstNonEmptyLine, 0)));
	}

	// Find the last non-empty line.
	let lastNonEmptyLine = document.lineCount - 1;
	while (lastNonEmptyLine >= 0 && document.lineAt(lastNonEmptyLine).isEmptyOrWhitespace) { lastNonEmptyLine--; }

	// Remove ending whitespace
	if (lastNonEmptyLine < document.lineCount - 1) {
		edits.push(TextEdit.delete(new Range(document.lineAt(lastNonEmptyLine).range.end, document.lineAt(document.lineCount - 1).range.end)));
	}

	// Square consecutive blank lines
	let consecutiveEmptyLines =  0;
	let emptyBlockStart       = -1;

	for (let i = firstNonEmptyLine + 1; i <= lastNonEmptyLine; i++) {
		if (document.lineAt(i).isEmptyOrWhitespace) {
			consecutiveEmptyLines++;

			if (consecutiveEmptyLines === 2) {
				emptyBlockStart = i;
			}
		} else {
			if (consecutiveEmptyLines > 1) {
				edits.push(TextEdit.delete(new Range(emptyBlockStart, 0, i, 0)));
			}

			consecutiveEmptyLines = 0;
		}
	}

	return edits;
}

/**
 * Resolves text-edit conflicts
 */
function resolveEditConflicts(edits: TextEdit[]): TextEdit[] {
	const sorted = [...edits].sort((a: TextEdit, b: TextEdit): number => {
		const startDifference = a.range.start.compareTo(b.range.start);

		if (startDifference !== 0) { return startDifference; }

		return b.range.end.compareTo(a.range.end);
	});

	const safeEdits   : TextEdit[]      = [];
	let   lastEditEnd : Position | null = null;

	for (const edit of sorted) {
		if (!lastEditEnd || edit.range.start.isAfterOrEqual(lastEditEnd)) {
			safeEdits.push(edit);
			lastEditEnd = edit.range.end;
		}
	}

	return safeEdits;
}