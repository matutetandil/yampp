// Yamfile Grammar for Peggy Parser Generator
// Yam++ (Yet Another Modern Task Runner)
// 
// This grammar defines the complete syntax for Yamfile DSL including:
// - Task definitions with modifiers
// - Parameters and dependencies  
// - File watching with glob patterns
// - Variables and constants
// - Internal task calls
// - Comments (single and multi-line)

{
  // Helper functions for AST construction
  
  function makeTask(modifiers, name, params, clauses, commands, location) {
    return {
      type: 'task',
      name: name,
      modifiers: modifiers || [],
      parameters: params || [],
      dependencies: clauses?.dependencies || [],
      dependencyParams: clauses?.dependencyParams || {},
      watchedFiles: clauses?.watchedFiles || [],
      commands: commands || [],
      location: location()
    };
  }
  
  function makeVariable(type, name, value, location) {
    return {
      type: type === 'const' ? 'constant' : 'variable',
      name: name,
      value: value,
      location: location()
    };
  }
  
  function makeCall(taskName, params, location) {
    return {
      type: 'call',
      taskName: taskName,
      parameters: params || [],
      location: location()
    };
  }
  
  function makeDependencyWithParams(name, params) {
    return {
      name: name,
      parameters: params || []
    };
  }
}

// ===== Main Rules =====

Yamfile
  = _ items:Item* _ {
      const result = {
        tasks: [],
        variables: [],
        constants: []
      };
      
      for (const item of items) {
        if (!item) continue;
        if (item.type === 'task') {
          result.tasks.push(item);
        } else if (item.type === 'variable') {
          result.variables.push(item);
        } else if (item.type === 'constant') {
          result.constants.push(item);
        }
      }
      
      return result;
    }

Item
  = Task
  / GlobalVariable
  / Comment { return null; } // Comments are ignored in AST

// ===== Task Definition =====

Task
  = mods:Modifiers? _ name:Identifier _ params:Parameters? _ clauses:Clauses? _ "{" _ body:TaskBody _ "}" _ {
      const { commands, localVars, localConsts, calls } = body || { commands: [], localVars: [], localConsts: [], calls: [] };
      const task = makeTask(mods, name, params, clauses, commands, location);
      task.localVariables = localVars || [];
      task.localConstants = localConsts || [];
      task.calls = calls || [];
      return task;
    }

Modifiers
  = mods:ModifierList { return mods; }

ModifierList
  = first:Modifier rest:(_ ":"? _ Modifier)* _ ":"? {
      const result = [first];
      for (const r of rest) {
        result.push(r[3]);
      }
      return result;
    }

Modifier
  = "always" { return 'always'; }
  / "serial" { return 'serial'; }
  / "critical" { return 'critical'; }

Parameters
  = "(" _ params:ParameterList? _ ")" { return params || []; }

ParameterList
  = first:Identifier rest:(_ "," _ Identifier)* {
      const result = [first];
      for (const r of rest) {
        result.push(r[3]);
      }
      return result;
    }

// ===== Task Clauses (needs/watches) =====

Clauses
  = needs:NeedsClause _ watches:WatchesClause? {
      return {
        dependencies: needs.dependencies,
        dependencyParams: needs.dependencyParams,
        watchedFiles: watches || []
      };
    }
  / watches:WatchesClause {
      return {
        dependencies: [],
        dependencyParams: {},
        watchedFiles: watches
      };
    }

NeedsClause
  = "needs" _ deps:DependencyList {
      const dependencies = [];
      const dependencyParams = {};
      
      for (const dep of deps) {
        dependencies.push(dep.name);
        if (dep.parameters && dep.parameters.length > 0) {
          dependencyParams[dep.name] = dep.parameters;
        }
      }
      
      return { dependencies, dependencyParams };
    }

DependencyList
  = first:DependencyWithParams rest:(_ !("watches" / "{") DependencyWithParams)* {
      const result = [first];
      for (const r of rest) {
        result.push(r[2]);
      }
      return result;
    }

DependencyWithParams
  = name:Identifier params:CallParameters? {
      return makeDependencyWithParams(name, params);
    }

WatchesClause
  = "watches" _ files:FilePatternList { return files; }

FilePatternList
  = first:FilePattern rest:(_ FilePattern)* {
      const result = [first];
      for (const r of rest) {
        result.push(r[1]);
      }
      return result;
    }

FilePattern
  = StringLiteral
  / UnquotedPattern

UnquotedPattern
  = chars:[^ \t\n\r{}"]+ { return chars.join(''); }

// ===== Task Body =====

TaskBody
  = lines:TaskLine* {
      const commands = [];
      const localVars = [];
      const localConsts = [];
      const calls = [];
      
      for (const line of lines) {
        if (!line) continue;
        if (line.type === 'command') {
          commands.push(line.value);
        } else if (line.type === 'variable') {
          localVars.push(line);
        } else if (line.type === 'constant') {
          localConsts.push(line);
        } else if (line.type === 'call') {
          calls.push(line);
        } else if (line.type === 'assignment') {
          // Assignments are treated as special commands
          commands.push(`_assign ${line.name} = ${line.value}`);
        }
      }
      
      return { commands, localVars, localConsts, calls };
    }

TaskLine
  = _ line:(LocalVariable / InternalCall / Assignment / Command / Comment) _ Newline? { return line; }
  / _ Newline { return null; }

LocalVariable
  = type:("const" / "var") _ name:Identifier _ "=" _ value:ValueExpression {
      return makeVariable(type, name, value, location);
    }

InternalCall
  = "_call" _ name:Identifier params:CallParameters? {
      return makeCall(name, params, location);
    }

CallParameters
  = "(" _ params:CallParameterList? _ ")" { return params || []; }

CallParameterList
  = first:CallParameter rest:(_ "," _ CallParameter)* {
      const result = [first];
      for (const r of rest) {
        result.push(r[3]);
      }
      return result;
    }

CallParameter
  = "$" name:Identifier { return { type: 'variable', name: name }; }
  / value:LiteralValue { return { type: 'literal', value: value }; }

LiteralValue
  = StringLiteral
  / chars:[^,)\s]+ { return chars.join(''); }

Assignment
  = name:Identifier _ "=" _ value:ValueExpression {
      return {
        type: 'assignment',
        name: name,
        value: value
      };
    }

Command
  = !("const" / "var" / "_call" / "}") chars:CommandCharacters+ {
      return {
        type: 'command',
        value: chars.join('').trim()
      };
    }

CommandCharacters
  = [^\n\r}]

// ===== Global Variables =====

GlobalVariable
  = type:("const" / "var") _ name:Identifier _ "=" _ value:ValueExpression _ Newline? {
      return makeVariable(type, name, value, location);
    }

ValueExpression
  = StringLiteral
  / CommandSubstitution
  / chars:ValueCharacters+ { return chars.join('').trim(); }

ValueCharacters
  = !Newline char:. { return char; }

CommandSubstitution
  = "$(" cmd:CommandSubContent ")" { return "$(" + cmd + ")"; }

CommandSubContent
  = chars:[^)]+ { return chars.join(''); }

// ===== Comments =====

Comment
  = SingleLineComment
  / MultiLineComment

SingleLineComment
  = "//" [^\n\r]* { return null; }

MultiLineComment
  = "/*" (!"*/" .)* "*/" { return null; }

// ===== Literals =====

StringLiteral
  = '"' chars:DoubleStringCharacter* '"' { return chars.join(''); }
  / "'" chars:SingleStringCharacter* "'" { return chars.join(''); }

DoubleStringCharacter
  = !('"' / "\\") char:. { return char; }
  / "\\" sequence:EscapeSequence { return sequence; }

SingleStringCharacter
  = !("'" / "\\") char:. { return char; }
  / "\\" sequence:EscapeSequence { return sequence; }

EscapeSequence
  = '"'
  / "'"
  / "\\"
  / "n" { return "\n"; }
  / "r" { return "\r"; }
  / "t" { return "\t"; }

// ===== Basic Elements =====

Identifier
  = first:[a-zA-Z_] rest:[a-zA-Z0-9_]* { return first + rest.join(''); }

// ===== Whitespace =====

_
  = Whitespace*

Whitespace
  = [ \t\n\r]
  / Comment

Newline
  = "\n"
  / "\r\n"
  / "\r"