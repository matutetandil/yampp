package com.yampp.plugin.actions;

import com.intellij.execution.ExecutionException;
import com.intellij.execution.configurations.GeneralCommandLine;
import com.intellij.execution.process.ProcessHandler;
import com.intellij.execution.process.ProcessHandlerFactory;
import com.intellij.execution.process.ProcessTerminatedListener;
import com.intellij.openapi.actionSystem.AnAction;
import com.intellij.openapi.actionSystem.AnActionEvent;
import com.intellij.openapi.actionSystem.CommonDataKeys;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.ui.Messages;
import com.intellij.openapi.vfs.VirtualFile;
import org.jetbrains.annotations.NotNull;

import java.util.ArrayList;
import java.util.List;

public class RunTaskAction extends AnAction {
    
    @Override
    public void actionPerformed(@NotNull AnActionEvent e) {
        Project project = e.getProject();
        if (project == null) return;
        
        VirtualFile file = e.getData(CommonDataKeys.VIRTUAL_FILE);
        if (file == null || !isYamfile(file)) {
            Messages.showMessageDialog(project, 
                "Please select a Yamfile", 
                "No Yamfile Selected", 
                Messages.getErrorIcon());
            return;
        }
        
        // Show task selection dialog
        String[] tasks = getTasksFromFile(file);
        if (tasks.length == 0) {
            Messages.showMessageDialog(project,
                "No tasks found in Yamfile",
                "No Tasks",
                Messages.getWarningIcon());
            return;
        }
        
        String selectedTask = Messages.showEditableChooseDialog(
            "Select task to run",
            "Run Yam++ Task",
            Messages.getQuestionIcon(),
            tasks,
            tasks[0],
            null
        );
        
        if (selectedTask != null) {
            runTask(project, selectedTask, file);
        }
    }
    
    @Override
    public void update(@NotNull AnActionEvent e) {
        VirtualFile file = e.getData(CommonDataKeys.VIRTUAL_FILE);
        e.getPresentation().setEnabledAndVisible(file != null && isYamfile(file));
    }
    
    private boolean isYamfile(VirtualFile file) {
        String name = file.getName();
        return name.equals("Yamfile") || name.endsWith(".yamfile");
    }
    
    private String[] getTasksFromFile(VirtualFile file) {
        // TODO: Parse Yamfile and extract task names
        // This is a stub implementation
        return new String[]{"build", "test", "deploy", "clean"};
    }
    
    private void runTask(Project project, String taskName, VirtualFile yamfile) {
        try {
            GeneralCommandLine commandLine = new GeneralCommandLine();
            commandLine.setExePath("yampp");
            commandLine.addParameter(taskName);
            commandLine.setWorkDirectory(yamfile.getParent().getPath());
            
            ProcessHandler processHandler = ProcessHandlerFactory.getInstance()
                .createColoredProcessHandler(commandLine);
            ProcessTerminatedListener.attach(processHandler);
            
            // TODO: Show output in console
            processHandler.startNotify();
            
            Messages.showMessageDialog(project,
                "Task '" + taskName + "' started",
                "Task Running",
                Messages.getInformationIcon());
                
        } catch (ExecutionException ex) {
            Messages.showMessageDialog(project,
                "Failed to run task: " + ex.getMessage(),
                "Execution Error",
                Messages.getErrorIcon());
        }
    }
}