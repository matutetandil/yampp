package com.yampp.plugin;

import com.intellij.lexer.FlexLexer;
import com.intellij.psi.tree.IElementType;
import com.intellij.psi.TokenType;

import static com.yampp.plugin.YamfileTokenTypes.*;

%%

%class YamfileLexer
%implements FlexLexer
%unicode
%function advance
%type IElementType
%eof{
  return;
%eof}

CRLF=\R
WHITE_SPACE=[\ \n\t\f]
IDENTIFIER=[a-zA-Z_][a-zA-Z0-9_]*
COMMENT_LINE=\/\/.*
COMMENT_BLOCK=\/\*([^*]|\*[^/])*\*\/

%state WAITING_VALUE

%%

<YYINITIAL> {COMMENT_LINE}         { return COMMENT_LINE; }
<YYINITIAL> {COMMENT_BLOCK}        { return COMMENT_BLOCK; }

<YYINITIAL> "always"               { return MODIFIER; }
<YYINITIAL> "serial"               { return MODIFIER; }
<YYINITIAL> "critical"             { return MODIFIER; }

<YYINITIAL> "const"                { return CONST; }
<YYINITIAL> "var"                  { return VAR; }
<YYINITIAL> "env"                  { return ENV; }

<YYINITIAL> "needs"                { return NEEDS; }
<YYINITIAL> "watches"              { return WATCHES; }

<YYINITIAL> "__call"               { return CALL; }
<YYINITIAL> "_assign"              { return ASSIGN; }

<YYINITIAL> "{"                    { return LBRACE; }
<YYINITIAL> "}"                    { return RBRACE; }
<YYINITIAL> "("                    { return LPAREN; }
<YYINITIAL> ")"                    { return RPAREN; }
<YYINITIAL> ","                    { return COMMA; }
<YYINITIAL> ":"                    { return COLON; }

<YYINITIAL> \$[a-zA-Z_][a-zA-Z0-9_]* { return VARIABLE; }

<YYINITIAL> {IDENTIFIER}           { return IDENTIFIER; }

({CRLF}|{WHITE_SPACE})+            { return TokenType.WHITE_SPACE; }

[^]                                { return TokenType.BAD_CHARACTER; }