import * as vscode from "vscode";

import { Spotter } from "./spotter";

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
