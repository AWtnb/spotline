import * as vscode from "vscode";

class Spotter {
  private readonly deco: vscode.TextEditorDecorationType;
  private applied: boolean;

  constructor(opacity: number) {
    this.deco = vscode.window.createTextEditorDecorationType({
      opacity: `${opacity} !important`,
    });
    this.applied = false;
  }

  isApplied(): boolean {
    return this.applied;
  }

  apply(editor: vscode.TextEditor) {
    const selTop = editor.selection.start.line;
    const selBottom = editor.selection.end.line;

    const blurTarget = [];

    if (selTop > 0) {
      const docStart = new vscode.Position(0, 0);
      const prevLineEnd = editor.document.lineAt(selTop - 1).rangeIncludingLineBreak.end;
      blurTarget.push(new vscode.Range(docStart, prevLineEnd));
    }
    if (selBottom < editor.document.lineCount - 1) {
      const nextLineStart = editor.document.lineAt(selBottom + 1).range.start;
      const docEnd = editor.document.lineAt(editor.document.lineCount - 1).rangeIncludingLineBreak.end;
      blurTarget.push(new vscode.Range(nextLineStart, docEnd));
    }

    editor.setDecorations(this.deco, blurTarget);

    this.applied = true;
  }

  reset(editor: vscode.TextEditor) {
    editor.setDecorations(this.deco, []);
    this.applied = false;
  }
}

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration("spotline");
  const opacity = Number(config.get("opacity")) || 0.4;
  const SPOTTER = new Spotter(opacity);

  context.subscriptions.push(
    vscode.commands.registerCommand("spotline.apply", () => {
      if (SPOTTER.isApplied()) {
        vscode.window.visibleTextEditors.forEach((editor) => SPOTTER.reset(editor));
      } else {
        vscode.window.visibleTextEditors.forEach((editor) => SPOTTER.apply(editor));
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("spotline.reset", () => {
      if (SPOTTER.isApplied()) {
        vscode.window.visibleTextEditors.forEach((editor) => SPOTTER.reset(editor));
      }
    })
  );

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor && SPOTTER.isApplied()) {
      SPOTTER.apply(editor);
    }
  });

  vscode.window.onDidChangeTextEditorSelection((ev) => {
    if (SPOTTER.isApplied()) {
      SPOTTER.apply(ev.textEditor);
    }
  });
}

export function deactivate() {}
