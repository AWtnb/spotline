import * as vscode from "vscode";

class EditorCursors {
  private readonly _editor: vscode.TextEditor;
  constructor(editor: vscode.TextEditor) {
    this._editor = editor;
  }

  private getCursorLines(): number[] {
    const lines: number[] = [];
    this._editor.selections.forEach((sel) => {
      const line = sel.active.line;
      if (lines.includes(line)) {
        return;
      }
      lines.push(line);
    });
    return lines.sort((a: number, b: number): number => {
      if (a < b) return -1;
      if (b < a) return 1;
      return 0;
    });
  }

  private getLineEnd(lineIdx: number): vscode.Position {
    return this._editor.document.lineAt(lineIdx).range.end;
  }

  private getLineStart(lineIdx: number): vscode.Position {
    return this._editor.document.lineAt(lineIdx).range.start;
  }

  getInterCursorRanges(): vscode.Range[] {
    const ranges: vscode.Range[] = [];
    const lines = this.getCursorLines();
    const firstCursorLine = lines[0];
    if (0 < firstCursorLine) {
      const bof = this.getLineStart(0);
      const end = this.getLineStart(firstCursorLine);
      const range = new vscode.Range(bof, end);
      ranges.push(range);
    }
    for (let i = 1; i < lines.length; i++) {
      const start = this.getLineEnd(lines[i - 1]);
      const end = this.getLineStart(lines[i]);
      const range = new vscode.Range(start, end);
      ranges.push(range);
    }
    const maxLineIdx = this._editor.document.lineCount - 1;
    const lastCursorLine = lines[lines.length - 1];
    if (lastCursorLine < maxLineIdx) {
      const start = this.getLineEnd(lastCursorLine);
      const eof = this.getLineEnd(maxLineIdx);
      const range = new vscode.Range(start, eof);
      ranges.push(range);
    }
    return ranges;
  }
}

export class Spotter {
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
    const st = new EditorCursors(editor);
    const blurTarget = st.getInterCursorRanges();
    editor.setDecorations(this.deco, blurTarget);
    this.applied = true;
  }

  reset(editor: vscode.TextEditor) {
    editor.setDecorations(this.deco, []);
    this.applied = false;
  }
}
