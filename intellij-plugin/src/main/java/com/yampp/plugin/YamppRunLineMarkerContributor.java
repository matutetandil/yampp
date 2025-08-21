package com.yampp.plugin;

import com.intellij.execution.lineMarker.RunLineMarkerContributor;
import com.intellij.icons.AllIcons;
import com.intellij.psi.PsiElement;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

public class YamppRunLineMarkerContributor extends RunLineMarkerContributor {

    @Override
    public @Nullable Info getInfo(@NotNull PsiElement element) {
        // TODO: Provide run line markers for Yamfile tasks
        // This is a stub implementation
        // Should identify task definitions and provide run/debug actions
        return null;
    }
}