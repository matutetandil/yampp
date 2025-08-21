package com.yampp.plugin;

import com.intellij.lexer.FlexAdapter;

public class YamfileLexerAdapter extends FlexAdapter {
    public YamfileLexerAdapter() {
        super(new YamfileLexer(null));
    }
}