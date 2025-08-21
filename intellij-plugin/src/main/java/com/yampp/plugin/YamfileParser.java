package com.yampp.plugin;

import com.intellij.lang.ASTNode;
import com.intellij.lang.PsiBuilder;
import com.intellij.lang.PsiParser;
import com.intellij.psi.tree.IElementType;
import org.jetbrains.annotations.NotNull;

public class YamfileParser implements PsiParser {
    @NotNull
    @Override
    public ASTNode parse(@NotNull IElementType root, @NotNull PsiBuilder builder) {
        PsiBuilder.Marker rootMarker = builder.mark();
        
        while (!builder.eof()) {
            IElementType tokenType = builder.getTokenType();
            if (tokenType != null) {
                builder.advanceLexer();
            } else {
                break;
            }
        }
        
        rootMarker.done(root);
        return builder.getTreeBuilt();
    }
}