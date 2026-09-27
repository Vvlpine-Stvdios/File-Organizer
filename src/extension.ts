import { commands, ExtensionContext, languages, ProviderResult, TextDocument, TextEdit, TextEditor, window, workspace, WorkspaceEdit } from "vscode";

import { initParser       } from "./parser";
import { organizeDocument } from "./organizer";

export async function activate(context: ExtensionContext): Promise<void> {
	await initParser(context.extensionPath);

	context.subscriptions.push(
		languages.registerDocumentFormattingEditProvider(
			{ language: "csharp", scheme: "file" },
			{
				provideDocumentFormattingEdits(document: TextDocument): ProviderResult<TextEdit[]> {
					return organizeDocument(document);
				}
			}
		)
	);

	context.subscriptions.push(
		commands.registerCommand("file-contents-organizer.organize", () => {
			const editor : TextEditor | undefined = window.activeTextEditor;

			if (!editor) { return; }

			const document : TextDocument  = editor.document;
			const edit     : WorkspaceEdit = new WorkspaceEdit();

			edit.set(document.uri, organizeDocument(document));

			workspace.applyEdit(edit);
		})
	);
}

export function deactivate(): void { }