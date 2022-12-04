import * as vscode from "vscode";

class Spotter {
  readonly deco: vscode.TextEditorDecorationType;
  focusStart: number = -1;
  focusEnd: number = -1;

  constructor(opacity: number) {
    this.deco = vscode.window.createTextEditorDecorationType({
      opacity: `${opacity} !important`,
    });
  }

  private clrearDeco(editor: vscode.TextEditor) {
    editor.setDecorations(this.deco, []);
  }

  resetPosition() {
    this.focusStart = -1;
    this.focusEnd = -1;
  }

  spotlight() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      console.log("no editor is opened.");
      return;
    }
    const selTop = editor.selection.start.line;
    const selBottom = editor.selection.end.line;

    this.clrearDeco(editor);
    if (selTop == this.focusStart && selBottom == this.focusEnd) {
      this.resetPosition();
      return;
    }

    const docStart = new vscode.Position(0, 0);
    const docEnd = editor.document.lineAt(editor.document.lineCount - 1).rangeIncludingLineBreak.end;
    const blurTarget = [];

    if (selTop > 0) {
      const prevLineEnd = editor.document.lineAt(selTop - 1).rangeIncludingLineBreak.end;
      blurTarget.push(new vscode.Range(docStart, prevLineEnd));
    }
    if (selBottom < editor.document.lineCount - 1) {
      const nextLineStart = editor.document.lineAt(selBottom + 1).range.start;
      blurTarget.push(new vscode.Range(nextLineStart, docEnd));
    }

    editor.setDecorations(this.deco, blurTarget);

    this.focusStart = selTop;
    this.focusEnd = selBottom;
  }

  unSpotlight() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      console.log("no editor is opened.");
      return;
    }
    this.clrearDeco(editor);
    this.resetPosition();
  }
}

const getOpacityConfig = ():number => {
	const config = vscode.workspace.getConfiguration("spotline");
	return config.get("opacity") || 0.4;
}

const SPOTTER = new Spotter(getOpacityConfig());

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.commands.registerCommand("spotline.apply", () => SPOTTER.spotlight()));
  context.subscriptions.push(vscode.commands.registerCommand("spotline.reset", () => SPOTTER.unSpotlight()));
}

vscode.window.onDidChangeActiveTextEditor(() => {
  SPOTTER.resetPosition();
});

export function deactivate() {}
