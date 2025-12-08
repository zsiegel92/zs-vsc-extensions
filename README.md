# ZS VS Code Extensions

A VS Code extension that lets you quickly move the current file to a gitignored folder.

## Features

- **Move to Gitignored Folder** - Move the active file to any directory listed in your `.gitignore`
- Browse into subfolders of gitignored directories with an interactive picker
- Navigate up/down the folder tree before selecting a destination

## Usage

1. Open the file you want to move
2. Run the command `Move to Gitignored Folder` from the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
3. Select a gitignored folder (or navigate into its subfolders)
4. The file is moved and reopened at its new location

## Installation

```sh
# From source
pnpm install
pnpm run compile
pnpm run package
code --install-extension zs-vsc-exts-0.0.1.vsix
```

## Requirements

- A workspace with a `.gitignore` file
- At least one gitignored directory that exists on disk

## License

[MIT](LICENSE.md)
