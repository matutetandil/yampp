const vscode = require('vscode');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

let taskProvider;
let outputChannel;

function activate(context) {
    console.log('Yam++ extension is now active');
    
    // Create output channel
    outputChannel = vscode.window.createOutputChannel('Yam++');
    
    // Register task provider
    taskProvider = new YamppTaskProvider();
    vscode.tasks.registerTaskProvider('yampp', taskProvider);
    
    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('yampp.runTask', runTask),
        vscode.commands.registerCommand('yampp.runAllTasks', runAllTasks),
        vscode.commands.registerCommand('yampp.listTasks', listTasks),
        vscode.commands.registerCommand('yampp.cleanCache', cleanCache),
        vscode.commands.registerCommand('yampp.showGraph', showGraph)
    );
    
    // Register code lens provider
    const codeLensProvider = new YamppCodeLensProvider();
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(
            { language: 'yamfile' },
            codeLensProvider
        )
    );
    
    // Register hover provider
    const hoverProvider = new YamppHoverProvider();
    context.subscriptions.push(
        vscode.languages.registerHoverProvider(
            { language: 'yamfile' },
            hoverProvider
        )
    );
    
    // Register completion provider
    const completionProvider = new YamppCompletionProvider();
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            { language: 'yamfile' },
            completionProvider,
            ':', ' '
        )
    );
}

function deactivate() {
    if (outputChannel) {
        outputChannel.dispose();
    }
}

class YamppTaskProvider {
    constructor() {
        this.tasks = [];
    }
    
    async provideTasks() {
        return this.getTasks();
    }
    
    async resolveTask(task) {
        return task;
    }
    
    async getTasks() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return [];
        }
        
        const yamfilePath = path.join(workspaceFolder.uri.fsPath, 'Yamfile');
        if (!fs.existsSync(yamfilePath)) {
            return [];
        }
        
        // Parse Yamfile to get tasks
        const tasks = await this.parseYamfile(yamfilePath);
        
        return tasks.map(taskName => {
            const task = new vscode.Task(
                { type: 'yampp', task: taskName },
                workspaceFolder,
                taskName,
                'yampp',
                new vscode.ShellExecution(`yampp ${taskName}`)
            );
            return task;
        });
    }
    
    async parseYamfile(filePath) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const taskPattern = /(?:\[([^\]]+)\]\s*:\s*)?(\w+)(?:\s+needs\s+[^{]+)?\s*\{/gm;
        const tasks = [];
        let match;
        
        while ((match = taskPattern.exec(content)) !== null) {
            tasks.push(match[2]);
        }
        
        return tasks;
    }
}

class YamppCodeLensProvider {
    provideCodeLenses(document) {
        const codeLenses = [];
        const text = document.getText();
        const taskPattern = /(?:\[([^\]]+)\]\s*:\s*)?(\w+)(?:\s+needs\s+[^{]+)?\s*\{/gm;
        let match;
        
        while ((match = taskPattern.exec(text)) !== null) {
            const taskName = match[2];
            const line = document.positionAt(match.index).line;
            const range = new vscode.Range(line, 0, line, 0);
            
            codeLenses.push(
                new vscode.CodeLens(range, {
                    title: '▶ Run',
                    command: 'yampp.runTask',
                    arguments: [taskName]
                })
            );
        }
        
        return codeLenses;
    }
}

class YamppHoverProvider {
    provideHover(document, position) {
        const range = document.getWordRangeAtPosition(position);
        const word = document.getText(range);
        
        // Check if it's a modifier
        const modifiers = {
            'always': 'Task will always run, ignoring cache',
            'serial': 'Task will run serially, not in parallel',
            'critical': 'If this task fails, entire execution will abort'
        };
        
        if (modifiers[word]) {
            return new vscode.Hover(
                new vscode.MarkdownString(`**${word}** modifier\n\n${modifiers[word]}`)
            );
        }
        
        // Check if it's a keyword
        if (word === 'needs') {
            return new vscode.Hover(
                new vscode.MarkdownString('**needs** keyword\n\nDeclares task dependencies')
            );
        }
        
        return null;
    }
}

class YamppCompletionProvider {
    provideCompletionItems(document, position) {
        const completions = [];
        
        // Modifier completions
        const modifiers = ['always', 'serial', 'critical'];
        for (const mod of modifiers) {
            const item = new vscode.CompletionItem(mod, vscode.CompletionItemKind.Keyword);
            item.detail = 'Task modifier';
            completions.push(item);
        }
        
        // Keyword completions
        const item = new vscode.CompletionItem('needs', vscode.CompletionItemKind.Keyword);
        item.detail = 'Declare dependencies';
        completions.push(item);
        
        return completions;
    }
}

async function runTask(taskName) {
    if (!taskName) {
        taskName = await vscode.window.showInputBox({
            prompt: 'Enter task name to run',
            placeHolder: 'build'
        });
    }
    
    if (!taskName) return;
    
    outputChannel.clear();
    outputChannel.show();
    outputChannel.appendLine(`Running task: ${taskName}`);
    
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }
    
    exec(`yampp ${taskName}`, {
        cwd: workspaceFolder.uri.fsPath
    }, (error, stdout, stderr) => {
        outputChannel.appendLine(stdout);
        if (stderr) outputChannel.appendLine(stderr);
        
        if (error) {
            vscode.window.showErrorMessage(`Task failed: ${taskName}`);
        } else {
            vscode.window.showInformationMessage(`Task completed: ${taskName}`);
        }
    });
}

async function runAllTasks() {
    runTask('');
}

async function listTasks() {
    outputChannel.clear();
    outputChannel.show();
    
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }
    
    exec('yampp -l', {
        cwd: workspaceFolder.uri.fsPath
    }, (error, stdout, stderr) => {
        outputChannel.appendLine(stdout);
        if (stderr) outputChannel.appendLine(stderr);
    });
}

async function cleanCache() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }
    
    exec('yampp -c', {
        cwd: workspaceFolder.uri.fsPath
    }, (error, stdout, stderr) => {
        if (error) {
            vscode.window.showErrorMessage('Failed to clean cache');
        } else {
            vscode.window.showInformationMessage('Cache cleaned successfully');
        }
    });
}

async function showGraph() {
    outputChannel.clear();
    outputChannel.show();
    
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }
    
    exec('yampp -g', {
        cwd: workspaceFolder.uri.fsPath
    }, (error, stdout, stderr) => {
        outputChannel.appendLine(stdout);
        if (stderr) outputChannel.appendLine(stderr);
    });
}

module.exports = {
    activate,
    deactivate
};