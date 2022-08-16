import * as vscode from 'vscode';

// https://github.com/L3v3L/vs-focus/blob/master/extension.js

class Spotter {
	deco: vscode.TextEditorDecorationType;
	blured: boolean;
	lastFocused: number[];

	constructor() {
		this.deco = vscode.window.createTextEditorDecorationType({});
		this.blured = false;
		this.lastFocused = [-1, -1];
	}

	isLastFocused(sel: vscode.Selection) {
		if (sel.start.line == this.lastFocused[0]) {
			return true;
		}
		if (sel.end.line == this.lastFocused[1]) {
			return true;
		}
		return false;
	}

	unSpotlight() {
		this.deco.dispose();
		this.blured = false;
	}

	spotlight() {
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
		if (this.blured) {
			this.unSpotlight();
			if (this.isLastFocused(editor.selection)) {
				return;
			}
		}
		if (!this.blured || !this.isLastFocused(editor.selection)) {
			const config = vscode.workspace.getConfiguration("spotline");
			this.deco = vscode.window.createTextEditorDecorationType({
				opacity: `${config.get("opacity")} !important`
			});
			editor.setDecorations(this.deco, rangesToBlur);
			this.blured = true;
		}
		this.lastFocused = [selTop, selBottom];
	}

}

const sp = new Spotter();

export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(vscode.commands.registerCommand('spotline.apply',
		() => sp.spotlight()
	));
	context.subscriptions.push(vscode.commands.registerCommand('spotline.reset',
		() => sp.unSpotlight()
	));

}

export function deactivate() {}
