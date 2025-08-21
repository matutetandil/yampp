package com.yampp.plugin;

import com.intellij.lang.Language;

public class YamfileLanguage extends Language {
    public static final YamfileLanguage INSTANCE = new YamfileLanguage();
    
    private YamfileLanguage() {
        super("Yamfile");
    }
}