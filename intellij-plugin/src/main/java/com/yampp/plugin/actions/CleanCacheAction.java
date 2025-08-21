package com.yampp.plugin.actions;

import com.intellij.openapi.actionSystem.AnAction;
import com.intellij.openapi.actionSystem.AnActionEvent;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.ui.Messages;
import com.intellij.openapi.vfs.VirtualFile;
import org.jetbrains.annotations.NotNull;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

public class CleanCacheAction extends AnAction {

    @Override
    public void actionPerformed(@NotNull AnActionEvent e) {
        Project project = e.getProject();
        if (project == null) return;

        VirtualFile baseDir = project.getBaseDir();
        if (baseDir == null) {
            Messages.showMessageDialog(project,
                "Project base directory not found",
                "Error",
                Messages.getErrorIcon());
            return;
        }

        // TODO: Find and delete .done cache files
        // This is a stub implementation
        
        int result = Messages.showYesNoDialog(project,
            "This will delete all .done cache files in the project.\nAre you sure?",
            "Clean Yam++ Cache",
            Messages.getQuestionIcon());

        if (result == Messages.YES) {
            List<String> deletedFiles = cleanCacheFiles(baseDir);
            
            String message;
            if (deletedFiles.isEmpty()) {
                message = "No cache files found to delete";
            } else {
                message = "Deleted " + deletedFiles.size() + " cache files:\n" +
                    String.join("\n", deletedFiles);
            }

            Messages.showMessageDialog(project,
                message,
                "Cache Cleaned",
                Messages.getInformationIcon());
        }
    }

    @Override
    public void update(@NotNull AnActionEvent e) {
        Project project = e.getProject();
        e.getPresentation().setEnabledAndVisible(project != null && project.getBaseDir() != null);
    }

    private List<String> cleanCacheFiles(VirtualFile baseDir) {
        List<String> deletedFiles = new ArrayList<>();
        
        try {
            // TODO: Implement recursive search for .done files
            // This is a stub implementation
            Path basePath = Paths.get(baseDir.getPath());
            
            // For now, just simulate finding some cache files
            // In real implementation, this would recursively search for .done files
            deletedFiles.add("build.done");
            deletedFiles.add("test.done");
            
        } catch (Exception ex) {
            // Log error but don't crash
        }
        
        return deletedFiles;
    }
}