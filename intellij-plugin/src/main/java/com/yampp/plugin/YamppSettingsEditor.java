package com.yampp.plugin;

import com.intellij.openapi.options.ConfigurationException;
import com.intellij.openapi.options.SettingsEditor;
import org.jetbrains.annotations.NotNull;

import javax.swing.*;

public class YamppSettingsEditor extends SettingsEditor<YamppRunConfiguration> {
    @Override
    protected void resetEditorFrom(@NotNull YamppRunConfiguration configuration) {
        // Stub implementation
    }

    @Override
    protected void applyEditorTo(@NotNull YamppRunConfiguration configuration) throws ConfigurationException {
        // Stub implementation
    }

    @NotNull
    @Override
    protected JComponent createEditor() {
        return new JPanel();
    }
}