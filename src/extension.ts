import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  console.log('Extension "move-to-scratchpad" is now active');

  const disposable = vscode.commands.registerCommand(
    'extension.moveToScratchpad',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active file to move.');
        return;
      }

      const fileUri = editor.document.uri;

      // Only handle real files (not untitled / virtual docs)
      if (fileUri.scheme !== 'file') {
        vscode.window.showErrorMessage('Current document is not a file on disk.');
        return;
      }

      const filePath = fileUri.fsPath;

      // Find the workspace folder that contains this file
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);

      if (!workspaceFolder) {
        vscode.window.showErrorMessage(
          'File is not inside a workspace folder. Open a folder/workspace first.'
        );
        return;
      }

      const workspaceRoot = workspaceFolder.uri.fsPath;
      const scratchpadDir = path.join(workspaceRoot, 'scratchpad');

      // Require scratchpad to exist at the workspace root
      if (!fs.existsSync(scratchpadDir) || !fs.statSync(scratchpadDir).isDirectory()) {
        vscode.window.showErrorMessage(
          'scratchpad folder does not exist at the workspace root.'
        );
        return;
      }

      const fileName = path.basename(filePath);
      const newPath = path.join(scratchpadDir, fileName);

      // Simple behavior: do not overwrite if file already exists there
      if (fs.existsSync(newPath)) {
        vscode.window.showErrorMessage(
          `A file named "${fileName}" already exists in scratchpad.`
        );
        return;
      }

      try {
        // Close the current editor before moving the file
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

        fs.renameSync(filePath, newPath);

        const newUri = vscode.Uri.file(newPath);
        const doc = await vscode.workspace.openTextDocument(newUri);
        await vscode.window.showTextDocument(doc);

        vscode.window.showInformationMessage(
          `Moved "${fileName}" to scratchpad.`
        );
      } catch (err: any) {
        vscode.window.showErrorMessage(`Failed to move file: ${err.message ?? String(err)}`);
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
