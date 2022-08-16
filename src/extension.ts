import * as vscode from 'vscode';

// https://github.com/L3v3L/vs-focus/blob/master/extension.js

class Spotter {
	deco: vscode.TextEditorDecorationType;
	focusStart: number;
	focusEnd: number;

	constructor() {
		this.deco = vscode.window.createTextEditorDecorationType({});
		this.focusStart = -1;
		this.focusEnd = -1;
	}

	spotlight() {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			console.log('no editor is opened.');
			return
		}

		const selTop = editor.selection.start.line;
		const selBottom = editor.selection.end.line;

		this.deco.dispose();
		if (selTop == this.focusStart && selBottom == this.focusEnd) {
			this.focusStart = -1;
			this.focusEnd = -1;
			return;
		}

		const docStart = new vscode.Position(0, 0);
		const docEnd = editor.document.lineAt(editor.document.lineCount - 1).rangeIncludingLineBreak.end;
		const blurRange = [];
		if (selTop > 0) {
			const prevLineEnd = editor.document.lineAt(selTop - 1).rangeIncludingLineBreak.end;
			blurRange.push(new vscode.Range(docStart, prevLineEnd));
		}
		if (selBottom < editor.document.lineCount - 1) {
			const nextLineStart = editor.document.lineAt(selBottom + 1).range.start;
			blurRange.push(new vscode.Range(nextLineStart, docEnd));
		}
		const config = vscode.workspace.getConfiguration("spotline");
		this.deco = vscode.window.createTextEditorDecorationType({
			opacity: `${config.get("opacity")} !important`
		});
		editor.setDecorations(this.deco, blurRange);

		this.focusStart = selTop;
		this.focusEnd = selBottom;

	}

	unSpotlight() {
		this.deco.dispose();
		this.focusStart = -1;
		this.focusEnd = -1;
	}

}


export function activate(context: vscode.ExtensionContext) {
	const sp = new Spotter();

	context.subscriptions.push(
		vscode.commands.registerCommand( 'spotline.apply', () => sp.spotlight() )
	);
	context.subscriptions.push(
		vscode.commands.registerCommand( 'spotline.reset', () => sp.unSpotlight() )
	);

}

export function deactivate() {}
