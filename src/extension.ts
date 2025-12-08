import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface FolderQuickPickItem extends vscode.QuickPickItem {
  folderPath: string;
  isBack?: boolean;
}

function parseGitignore(workspaceRoot: string): string[] {
  const gitignorePath = path.join(workspaceRoot, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    return [];
  }

  const content = fs.readFileSync(gitignorePath, 'utf-8');
  const patterns: string[] = [];

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    let pattern = trimmed.replace(/\/$/, '');
    if (pattern.startsWith('/')) {
      pattern = pattern.slice(1);
    }
    patterns.push(pattern);
  }

  return patterns;
}

function getGitignoredDirectories(workspaceRoot: string): string[] {
  const patterns = parseGitignore(workspaceRoot);
  const ignoredDirs: string[] = [];

  for (const pattern of patterns) {
    if (pattern.includes('*')) {
      continue;
    }
    const fullPath = path.join(workspaceRoot, pattern);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      ignoredDirs.push(fullPath);
    }
  }

  return ignoredDirs;
}

function getSubfolders(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory())
    .map(e => path.join(dirPath, e.name));
}

async function showFolderPicker(
  workspaceRoot: string,
  gitignoredRoots: string[],
  currentPath: string | null
): Promise<string | undefined> {
  const quickPick = vscode.window.createQuickPick<FolderQuickPickItem>();
  quickPick.placeholder = 'Select a gitignored folder (or navigate into subfolders)';

  const buildItems = (browsePath: string | null): FolderQuickPickItem[] => {
    const items: FolderQuickPickItem[] = [];

    if (browsePath === null) {
      for (const dir of gitignoredRoots) {
        const relativePath = path.relative(workspaceRoot, dir);
        items.push({
          label: `$(folder) ${relativePath}`,
          description: 'gitignored',
          folderPath: dir,
        });
      }
    } else {
      items.push({
        label: `$(check) Select this folder`,
        description: path.relative(workspaceRoot, browsePath),
        folderPath: browsePath,
      });
      
      items.push({
        label: '$(arrow-left) ..',
        description: 'Go back',
        folderPath: path.dirname(browsePath),
        isBack: true,
      });
      const subfolders = getSubfolders(browsePath);
      for (const sub of subfolders) {
        const name = path.basename(sub);
        items.push({
          label: `$(folder) ${name}`,
          folderPath: sub,
        });
      }
    }

    return items;
  };

  return new Promise<string | undefined>((resolve) => {
    let browsing: string | null = currentPath;

    const updateItems = () => {
      quickPick.items = buildItems(browsing);
    };

    updateItems();
    quickPick.show();

    quickPick.onDidAccept(() => {
      const selected = quickPick.selectedItems[0];
      if (!selected) {
        return;
      }

      if (selected.isBack) {
        const parent = path.dirname(browsing!);
        const isStillInGitignored = gitignoredRoots.some(
          root => parent.startsWith(root) || parent === root
        );
        browsing = isStillInGitignored ? parent : null;
        updateItems();
        return;
      }

      if (selected.label.startsWith('$(check)')) {
        quickPick.hide();
        resolve(selected.folderPath);
        return;
      }

      browsing = selected.folderPath;
      updateItems();
    });

    quickPick.onDidHide(() => {
      quickPick.dispose();
      resolve(undefined);
    });
  });
}

export function activate(context: vscode.ExtensionContext) {
  console.log('Extension "move-to-gitignored" is now active');

  const disposable = vscode.commands.registerCommand(
    'extension.moveToGitignored',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active file to move.');
        return;
      }

      const fileUri = editor.document.uri;

      if (fileUri.scheme !== 'file') {
        vscode.window.showErrorMessage('Current document is not a file on disk.');
        return;
      }

      const filePath = fileUri.fsPath;
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);

      if (!workspaceFolder) {
        vscode.window.showErrorMessage(
          'File is not inside a workspace folder. Open a folder/workspace first.'
        );
        return;
      }

      const workspaceRoot = workspaceFolder.uri.fsPath;
      const gitignoredDirs = getGitignoredDirectories(workspaceRoot);

      if (gitignoredDirs.length === 0) {
        vscode.window.showErrorMessage(
          'No gitignored directories found at the workspace root.'
        );
        return;
      }

      const selectedFolder = await showFolderPicker(workspaceRoot, gitignoredDirs, null);
      if (!selectedFolder) {
        return;
      }

      if (!fs.existsSync(selectedFolder)) {
        fs.mkdirSync(selectedFolder, { recursive: true });
      }

      const fileName = path.basename(filePath);
      const newPath = path.join(selectedFolder, fileName);

      if (fs.existsSync(newPath)) {
        vscode.window.showErrorMessage(
          `A file named "${fileName}" already exists in ${path.relative(workspaceRoot, selectedFolder)}.`
        );
        return;
      }

      try {
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

        fs.renameSync(filePath, newPath);

        const newUri = vscode.Uri.file(newPath);
        const doc = await vscode.workspace.openTextDocument(newUri);
        await vscode.window.showTextDocument(doc);

        vscode.window.showInformationMessage(
          `Moved "${fileName}" to ${path.relative(workspaceRoot, selectedFolder)}.`
        );
      } catch (err: any) {
        vscode.window.showErrorMessage(`Failed to move file: ${err.message ?? String(err)}`);
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
