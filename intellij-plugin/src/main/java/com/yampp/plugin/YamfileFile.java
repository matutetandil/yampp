package com.yampp.plugin;

import com.intellij.extapi.psi.PsiFileBase;
import com.intellij.openapi.fileTypes.FileType;
import com.intellij.psi.FileViewProvider;
import org.jetbrains.annotations.NotNull;

public class YamfileFile extends PsiFileBase {
    public YamfileFile(@NotNull FileViewProvider viewProvider) {
        super(viewProvider, YamfileLanguage.INSTANCE);
    }

    @NotNull
    @Override
    public FileType getFileType() {
        return YamfileFileType.INSTANCE;
    }

    @Override
    public String toString() {
        return "Yamfile";
    }
}