package com.yampp.plugin;

import com.intellij.lexer.Lexer;
import com.intellij.openapi.editor.DefaultLanguageHighlighterColors;
import com.intellij.openapi.editor.colors.TextAttributesKey;
import com.intellij.openapi.fileTypes.SyntaxHighlighterBase;
import com.intellij.psi.tree.IElementType;
import org.jetbrains.annotations.NotNull;

import static com.intellij.openapi.editor.colors.TextAttributesKey.createTextAttributesKey;
import static com.yampp.plugin.YamfileTokenTypes.*;

public class YamfileSyntaxHighlighter extends SyntaxHighlighterBase {
    
    public static final TextAttributesKey COMMENT_LINE = 
        createTextAttributesKey("YAMFILE_COMMENT_LINE", DefaultLanguageHighlighterColors.LINE_COMMENT);
    
    public static final TextAttributesKey COMMENT_BLOCK = 
        createTextAttributesKey("YAMFILE_COMMENT_BLOCK", DefaultLanguageHighlighterColors.BLOCK_COMMENT);
    
    public static final TextAttributesKey IDENTIFIER = 
        createTextAttributesKey("YAMFILE_IDENTIFIER", DefaultLanguageHighlighterColors.IDENTIFIER);
    
    public static final TextAttributesKey VARIABLE = 
        createTextAttributesKey("YAMFILE_VARIABLE", DefaultLanguageHighlighterColors.INSTANCE_FIELD);
    
    public static final TextAttributesKey MODIFIER = 
        createTextAttributesKey("YAMFILE_MODIFIER", DefaultLanguageHighlighterColors.KEYWORD);
    
    public static final TextAttributesKey CONST = 
        createTextAttributesKey("YAMFILE_CONST", DefaultLanguageHighlighterColors.KEYWORD);
    
    public static final TextAttributesKey VAR = 
        createTextAttributesKey("YAMFILE_VAR", DefaultLanguageHighlighterColors.KEYWORD);
    
    public static final TextAttributesKey NEEDS = 
        createTextAttributesKey("YAMFILE_NEEDS", DefaultLanguageHighlighterColors.KEYWORD);
    
    public static final TextAttributesKey WATCHES = 
        createTextAttributesKey("YAMFILE_WATCHES", DefaultLanguageHighlighterColors.KEYWORD);
    
    public static final TextAttributesKey CALL = 
        createTextAttributesKey("YAMFILE_CALL", DefaultLanguageHighlighterColors.KEYWORD);
    
    public static final TextAttributesKey BRACES = 
        createTextAttributesKey("YAMFILE_BRACES", DefaultLanguageHighlighterColors.BRACES);
    
    public static final TextAttributesKey PARENTHESES = 
        createTextAttributesKey("YAMFILE_PARENTHESES", DefaultLanguageHighlighterColors.PARENTHESES);
    
    public static final TextAttributesKey COMMA = 
        createTextAttributesKey("YAMFILE_COMMA", DefaultLanguageHighlighterColors.COMMA);

    private static final TextAttributesKey[] COMMENT_LINE_KEYS = new TextAttributesKey[]{COMMENT_LINE};
    private static final TextAttributesKey[] COMMENT_BLOCK_KEYS = new TextAttributesKey[]{COMMENT_BLOCK};
    private static final TextAttributesKey[] IDENTIFIER_KEYS = new TextAttributesKey[]{IDENTIFIER};
    private static final TextAttributesKey[] VARIABLE_KEYS = new TextAttributesKey[]{VARIABLE};
    private static final TextAttributesKey[] MODIFIER_KEYS = new TextAttributesKey[]{MODIFIER};
    private static final TextAttributesKey[] CONST_KEYS = new TextAttributesKey[]{CONST};
    private static final TextAttributesKey[] VAR_KEYS = new TextAttributesKey[]{VAR};
    private static final TextAttributesKey[] NEEDS_KEYS = new TextAttributesKey[]{NEEDS};
    private static final TextAttributesKey[] WATCHES_KEYS = new TextAttributesKey[]{WATCHES};
    private static final TextAttributesKey[] CALL_KEYS = new TextAttributesKey[]{CALL};
    private static final TextAttributesKey[] BRACES_KEYS = new TextAttributesKey[]{BRACES};
    private static final TextAttributesKey[] PARENTHESES_KEYS = new TextAttributesKey[]{PARENTHESES};
    private static final TextAttributesKey[] COMMA_KEYS = new TextAttributesKey[]{COMMA};
    private static final TextAttributesKey[] EMPTY_KEYS = new TextAttributesKey[0];

    @NotNull
    @Override
    public Lexer getHighlightingLexer() {
        return new YamfileLexerAdapter();
    }

    @NotNull
    @Override
    public TextAttributesKey[] getTokenHighlights(IElementType tokenType) {
        if (tokenType.equals(YamfileTokenTypes.COMMENT_LINE)) {
            return COMMENT_LINE_KEYS;
        } else if (tokenType.equals(YamfileTokenTypes.COMMENT_BLOCK)) {
            return COMMENT_BLOCK_KEYS;
        } else if (tokenType.equals(YamfileTokenTypes.IDENTIFIER)) {
            return IDENTIFIER_KEYS;
        } else if (tokenType.equals(YamfileTokenTypes.VARIABLE)) {
            return VARIABLE_KEYS;
        } else if (tokenType.equals(YamfileTokenTypes.MODIFIER)) {
            return MODIFIER_KEYS;
        } else if (tokenType.equals(YamfileTokenTypes.CONST)) {
            return CONST_KEYS;
        } else if (tokenType.equals(YamfileTokenTypes.VAR)) {
            return VAR_KEYS;
        } else if (tokenType.equals(YamfileTokenTypes.NEEDS)) {
            return NEEDS_KEYS;
        } else if (tokenType.equals(YamfileTokenTypes.WATCHES)) {
            return WATCHES_KEYS;
        } else if (tokenType.equals(YamfileTokenTypes.CALL)) {
            return CALL_KEYS;
        } else if (tokenType.equals(LBRACE) || tokenType.equals(RBRACE)) {
            return BRACES_KEYS;
        } else if (tokenType.equals(LPAREN) || tokenType.equals(RPAREN)) {
            return PARENTHESES_KEYS;
        } else if (tokenType.equals(YamfileTokenTypes.COMMA)) {
            return COMMA_KEYS;
        } else {
            return EMPTY_KEYS;
        }
    }
}