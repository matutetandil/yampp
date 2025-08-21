package com.yampp.plugin.actions;

import com.intellij.openapi.actionSystem.AnAction;
import com.intellij.openapi.actionSystem.AnActionEvent;
import com.intellij.openapi.actionSystem.CommonDataKeys;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.ui.Messages;
import com.intellij.openapi.vfs.VirtualFile;
import org.jetbrains.annotations.NotNull;

public class ListTasksAction extends AnAction {

    @Override
    public void actionPerformed(@NotNull AnActionEvent e) {
        Project project = e.getProject();
        if (project == null) return;

        // TODO: Find Yamfile in project and extract tasks
        // This is a stub implementation
        
        VirtualFile yamfile = findYamfile(project);
        if (yamfile == null) {
            Messages.showMessageDialog(project,
                "No Yamfile found in project",
                "No Yamfile",
                Messages.getWarningIcon());
            return;
        }

        // TODO: Parse Yamfile and extract actual tasks
        String[] tasks = {"build", "test", "deploy", "clean"}; // Stub data
        
        StringBuilder tasksList = new StringBuilder("Available tasks:\n");
        for (String task : tasks) {
            tasksList.append("• ").append(task).append("\n");
        }

        Messages.showMessageDialog(project,
            tasksList.toString(),
            "Yam++ Tasks",
            Messages.getInformationIcon());
    }

    @Override
    public void update(@NotNull AnActionEvent e) {
        Project project = e.getProject();
        e.getPresentation().setEnabledAndVisible(project != null && findYamfile(project) != null);
    }

    private VirtualFile findYamfile(Project project) {
        // TODO: Implement proper Yamfile search
        // This is a stub implementation
        VirtualFile baseDir = project.getBaseDir();
        if (baseDir != null) {
            VirtualFile yamfile = baseDir.findChild("Yamfile");
            if (yamfile != null && yamfile.exists()) {
                return yamfile;
            }
        }
        return null;
    }
}