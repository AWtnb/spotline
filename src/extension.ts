import * as vscode from 'vscode';

// https://github.com/L3v3L/vs-focus/blob/master/extension.js

let dt = vscode.window.createTextEditorDecorationType({});
let blured = false;
let lastFocused = [-1, -1];

function isLastFocused(sel:vscode.Selection) {
	if (sel.start.line == lastFocused[0]) {
		return true;
	}
	if (sel.end.line == lastFocused[1]) {
		return true;
	}
	return false;
}

function unSpotlight() {
	dt.dispose();
	blured = false;
}

function spotlight() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		console.log('no editor is opened.');
		return
	}
	const docStart = new vscode.Position(0, 0);
	const docEnd = editor.document.lineAt(editor.document.lineCount - 1).rangeIncludingLineBreak.end;
	const rangesToBlur = [];
	const selTop = editor.selection.start.line;
	if (selTop > 0) {
		const prevLineEnd = editor.document.lineAt(selTop - 1).rangeIncludingLineBreak.end;
		rangesToBlur.push(new vscode.Range(docStart, prevLineEnd));
	}
	const selBottom = editor.selection.end.line;
	if (selBottom < editor.document.lineCount - 1) {
		const nextLineStart = editor.document.lineAt(selBottom + 1).range.start;
		rangesToBlur.push(new vscode.Range(nextLineStart, docEnd));
	}
	if (blured) {
		unSpotlight();
		if (isLastFocused(editor.selection)) {
			return;
		}
	}
	if (!blured || !isLastFocused(editor.selection)) {
		const config = vscode.workspace.getConfiguration("spotline");
		dt = vscode.window.createTextEditorDecorationType({
			opacity: `${config.get("opacity")} !important`
		});
		editor.setDecorations(dt, rangesToBlur);
		blured = true;
	}
	lastFocused = [selTop, selBottom];
}

export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(vscode.commands.registerCommand('spotline.apply',
		spotlight
	));
	context.subscriptions.push(vscode.commands.registerCommand('spotline.reset',
		unSpotlight
	));

}

export function deactivate() {}
