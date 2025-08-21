package com.yampp.plugin;

import com.intellij.openapi.fileTypes.LanguageFileType;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

import javax.swing.*;

public class YamfileFileType extends LanguageFileType {
    public static final YamfileFileType INSTANCE = new YamfileFileType();
    
    private YamfileFileType() {
        super(YamfileLanguage.INSTANCE);
    }
    
    @NotNull
    @Override
    public String getName() {
        return "Yamfile";
    }
    
    @NotNull
    @Override
    public String getDescription() {
        return "Yam++ task runner file";
    }
    
    @NotNull
    @Override
    public String getDefaultExtension() {
        return "Yamfile";
    }
    
    @Nullable
    @Override
    public Icon getIcon() {
        return YamppIcons.FILE;
    }
}