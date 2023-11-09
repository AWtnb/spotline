import * as vscode from "vscode";

class EditorCursors {
  private readonly _editor: vscode.TextEditor;
  constructor(editor: vscode.TextEditor) {
    this._editor = editor;
  }

  private toLineRanges(): vscode.Range[] {
    return this._editor.selections.map((sel) => {
      const start = new vscode.Position(sel.start.line, 0);
      const end = new vscode.Position(sel.end.line, this._editor.document.lineAt(sel.end.line).text.length);
      return new vscode.Range(start, end);
    });
  }

  private getOrderedRanges(): vscode.Range[] {
    return this.toLineRanges().sort((a: vscode.Range, b: vscode.Range): number => {
      if (a.start.line < b.start.line) {
        return -1;
      }
      if (b.start.line < a.start.line) {
        return 1;
      }
      return 0;
    });
  }

  /**
   * When multiple cursors are on the same line (or one end of a selection is on the same line as another cursor), `toLineRanges()` creates overlapping Ranges.
   * This method unites the overlapping Ranges with each other. The finally returned Ranges will not overlap at all.
   */
  private uniteRanges(): vscode.Range[] {
    const cursorRanges = this.getOrderedRanges();
    const ranges: vscode.Range[] = [];
    for (let i = 0; i < cursorRanges.length; i++) {
      const c = cursorRanges[i];
      if (i < 1) {
        ranges.push(c);
        continue;
      }
      const last = ranges[ranges.length - 1];
      if (last.intersection(c)) {
        ranges.pop();
        ranges.push(last.union(c));
      } else {
        ranges.push(c);
      }
    }
    return ranges;
  }

  private getLineEnd(lineIdx: number): vscode.Position {
    return this._editor.document.lineAt(lineIdx).range.end;
  }

  private getLineStart(lineIdx: number): vscode.Position {
    return this._editor.document.lineAt(lineIdx).range.start;
  }

  getInterCursorRanges(): vscode.Range[] {
    const ranges: vscode.Range[] = [];
    const sels = this.uniteRanges();
    const firstSelection = sels[0];
    if (0 < firstSelection.start.line) {
      const bof = this.getLineStart(0);
      const end = firstSelection.start;
      const range = new vscode.Range(bof, end);
      ranges.push(range);
    }
    for (let i = 1; i < sels.length; i++) {
      const start = sels[i - 1].end;
      const end = sels[i].start;
      const range = new vscode.Range(start, end);
      ranges.push(range);
    }
    const maxLineIdx = this._editor.document.lineCount - 1;
    const lastSelection = sels[sels.length - 1];
    if (lastSelection.end.line < maxLineIdx) {
      const start = lastSelection.end;
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
  private asTypewriter: boolean;

  constructor(opacity: number, asTypewriter: boolean) {
    this.deco = vscode.window.createTextEditorDecorationType({
      opacity: `${opacity} !important`,
    });
    this.applied = false;
    this.asTypewriter = asTypewriter;
  }

  isApplied(): boolean {
    return this.applied;
  }

  isTypewriterMode(): boolean {
    return this.asTypewriter;
  }

  toggleTypewriterMode() {
    this.asTypewriter = !this.asTypewriter;
  }

  apply(editor: vscode.TextEditor) {
    const cursors = new EditorCursors(editor);
    const blurTarget = cursors.getInterCursorRanges();
    editor.setDecorations(this.deco, blurTarget);
    this.applied = true;
  }

  reset(editor: vscode.TextEditor) {
    editor.setDecorations(this.deco, []);
    this.applied = false;
  }
}
