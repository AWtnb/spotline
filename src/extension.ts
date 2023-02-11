import * as vscode from "vscode";

class Spotter {
  readonly deco: vscode.TextEditorDecorationType;
  applied: boolean;

  constructor(opacity: number) {
    this.deco = vscode.window.createTextEditorDecorationType({
      opacity: `${opacity} !important`,
    });
    this.applied = false;
  }

  private clearDeco(editor: vscode.TextEditor) {
    editor.setDecorations(this.deco, []);
    this.applied = false;
  }

  spotlight(editor: vscode.TextEditor) {
    const selTop = editor.selection.start.line;
    const selBottom = editor.selection.end.line;

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

    this.applied = true;
  }

  unSpotlight(editor: vscode.TextEditor) {
    this.clearDeco(editor);
    this.applied = false;
  }
}

const getOpacityConfig = (): number => {
  const config = vscode.workspace.getConfiguration("spotline");
  return config.get("opacity") || 0.4;
};

const SPOTTER = new Spotter(getOpacityConfig());

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand("spotline.apply", (editor: vscode.TextEditor) => {
      if (!SPOTTER.applied) {
        SPOTTER.spotlight(editor);
      } else {
        SPOTTER.unSpotlight(editor);
      }
    })
  );
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand("spotline.reset", (editor: vscode.TextEditor) => {
      SPOTTER.unSpotlight(editor);
    })
  );
}

vscode.window.onDidChangeTextEditorSelection((ev) => {
  if (SPOTTER.applied) {
    SPOTTER.spotlight(ev.textEditor);
  }
});

export function deactivate() {}
