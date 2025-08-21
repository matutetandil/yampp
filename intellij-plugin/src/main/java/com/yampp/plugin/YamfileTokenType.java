package com.yampp.plugin;

import com.intellij.psi.tree.IElementType;
import org.jetbrains.annotations.NotNull;

public class YamfileTokenType extends IElementType {
    public YamfileTokenType(@NotNull String debugName) {
        super(debugName, YamfileLanguage.INSTANCE);
    }
    
    @Override
    public String toString() {
        return "YamfileTokenType." + super.toString();
    }
}