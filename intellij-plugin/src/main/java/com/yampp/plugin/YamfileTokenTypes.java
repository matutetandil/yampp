package com.yampp.plugin;

import com.intellij.psi.tree.IElementType;

public interface YamfileTokenTypes {
    IElementType COMMENT_LINE = new YamfileTokenType("COMMENT_LINE");
    IElementType COMMENT_BLOCK = new YamfileTokenType("COMMENT_BLOCK");
    
    IElementType IDENTIFIER = new YamfileTokenType("IDENTIFIER");
    IElementType VARIABLE = new YamfileTokenType("VARIABLE");
    
    IElementType MODIFIER = new YamfileTokenType("MODIFIER");
    IElementType CONST = new YamfileTokenType("CONST");
    IElementType VAR = new YamfileTokenType("VAR");
    IElementType ENV = new YamfileTokenType("ENV");
    IElementType NEEDS = new YamfileTokenType("NEEDS");
    IElementType WATCHES = new YamfileTokenType("WATCHES");
    IElementType CALL = new YamfileTokenType("CALL");
    IElementType ASSIGN = new YamfileTokenType("ASSIGN");
    
    IElementType LBRACE = new YamfileTokenType("LBRACE");
    IElementType RBRACE = new YamfileTokenType("RBRACE");
    IElementType LPAREN = new YamfileTokenType("LPAREN");
    IElementType RPAREN = new YamfileTokenType("RPAREN");
    IElementType COMMA = new YamfileTokenType("COMMA");
    IElementType COLON = new YamfileTokenType("COLON");
}