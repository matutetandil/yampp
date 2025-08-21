package com.yampp.plugin;

import com.intellij.extapi.psi.ASTWrapperPsiElement;
import com.intellij.lang.ASTNode;
import org.jetbrains.annotations.NotNull;

public class YamfilePsiElement extends ASTWrapperPsiElement {
    public YamfilePsiElement(@NotNull ASTNode node) {
        super(node);
    }
}