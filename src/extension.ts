import * as vscode from "vscode";

import { Spotter } from "./spotter";

const stickToCursor = (editor: vscode.TextEditor) => {
  const visible = editor.visibleRanges[0];
  const half = Math.ceil((visible.end.line - visible.start.line) / 2);
  const a = editor.selections[0].active;
  const buffer = 4; // manually tuned
  if (a.line < visible.start.line + half - buffer) {
    return;
  }
  if (visible.end.line - half + buffer < a.line) {
    return;
  }
  const r = new vscode.Range(a, a);
  editor.revealRange(r, vscode.TextEditorRevealType.InCenter);
};

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration("spotline");
  const opacity = Number(config.get("opacity")) || 0.4;
  const asTypewriter = Boolean(config.get("asTypewriter")) || false;
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
      const editor = ev.textEditor;
      SPOTTER.apply(editor);
      if (asTypewriter) {
        stickToCursor(editor);
      }
    }
  });
}

export function deactivate() {}
