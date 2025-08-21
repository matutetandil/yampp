package com.yampp.plugin;

import com.intellij.openapi.project.Project;
import com.intellij.openapi.wm.ToolWindow;
import com.intellij.openapi.wm.ToolWindowFactory;
import com.intellij.ui.content.Content;
import com.intellij.ui.content.ContentFactory;
import org.jetbrains.annotations.NotNull;

import javax.swing.*;
import java.awt.*;

public class YamppToolWindowFactory implements ToolWindowFactory {

    @Override
    public void createToolWindowContent(@NotNull Project project, @NotNull ToolWindow toolWindow) {
        YamppToolWindow yamppToolWindow = new YamppToolWindow(project);
        Content content = ContentFactory.getInstance().createContent(yamppToolWindow.getContent(), "", false);
        toolWindow.getContentManager().addContent(content);
    }

    // Simple tool window content
    private static class YamppToolWindow {
        private final JPanel content;

        public YamppToolWindow(Project project) {
            content = new JPanel(new BorderLayout());
            
            // TODO: Add proper tool window content
            // This is a stub implementation
            // Should show available tasks, execution history, etc.
            
            JLabel stubLabel = new JLabel("Yam++ Tasks Tool Window - Not Implemented Yet", SwingConstants.CENTER);
            content.add(stubLabel, BorderLayout.CENTER);
        }

        public JComponent getContent() {
            return content;
        }
    }
}