# ZS VS Code Extensions

A collection of VS Code utilities for file management and Git workflows.

## Commands

### Move to Gitignored Folder

Move the active file to any directory listed in your `.gitignore`.

- Browse into subfolders of gitignored directories with an interactive picker
- Navigate up/down the folder tree before selecting a destination

**Usage:**
1. Open the file you want to move
2. Run `Move to Gitignored Folder` from the Command Palette
3. Select a gitignored folder (or navigate into its subfolders)
4. The file is moved and reopened at its new location

### Diff with Graphite Parent Branch

Compare the current file against its version in the Graphite parent branch.

**Usage:**
1. Open any file tracked in Git
2. Run `Diff with Graphite Parent Branch` from the Command Palette
3. A diff view opens showing changes between the parent branch and your current version

**Requirements:** [Graphite CLI](https://graphite.dev/) must be installed.

## Keyboard Shortcuts

These commands can be bound to keyboard shortcuts. Open your keybindings.json (`Cmd+K Cmd+S` → click the file icon in the top right) and add:

```json
{
  "key": "ctrl+shift+m",
  "command": "extension.moveToGitignored",
  "when": "editorTextFocus"
},
{
  "key": "ctrl+shift+d",
  "command": "extension.diffWithGraphiteParent",
  "when": "editorTextFocus"
}
```

## Installation

```sh
# Build from source
pnpm install
pnpm run compile
pnpm run package
```

Then install the `.vsix` file:

**Via VS Code UI:**
1. Open the Extensions view (`Cmd+Shift+X`)
2. Click the `...` menu (top right of the Extensions sidebar)
3. Select **Install from VSIX...**
4. Navigate to and select `zs-vsc-exts-0.0.1.vsix`

**Via command line:**
```sh
code --install-extension zs-vsc-exts-0.0.1.vsix
```

## Requirements

- A workspace with a `.gitignore` file (for Move to Gitignored)
- Graphite CLI installed (for Diff with Graphite Parent)

## License

[MIT](LICENSE.md)
