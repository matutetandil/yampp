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
      internalFunctions: [],
      watches: clauses?.watchedFiles || [],
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
  
  function makePlatformBlock(platforms, tasks, location) {
    return {
      type: 'platform_block',
      platforms: platforms || [],
      tasks: tasks || [],
      location: location()
    };
  }
  
  function makeAnnotationBlock(annotations, content, location) {
    return {
      type: 'annotation_block',
      annotations: annotations || [],
      content: content || [],
      location: location()
    };
  }
  
  function makeDefaultProfile(profileName, location) {
    return {
      type: 'default_profile',
      profileName: profileName,
      location: location()
    };
  }
  
  function makeInclude(filePath, location) {
    return {
      type: 'include',
      filePath: filePath,
      location: location()
    };
  }
}

// ===== Main Rules =====

Yamfile
  = _ items:Item* _ {
      const result = {
        tasks: [],
        variables: [],
        constants: [],
        environmentVariables: [],
        platformBlocks: [],
        annotationBlocks: [],
        includes: [],
        defaultProfile: null
      };
      
      for (const item of items) {
        if (!item) continue;
        if (item.type === 'task') {
          result.tasks.push(item);
        } else if (item.type === 'variable') {
          result.variables.push(item);
        } else if (item.type === 'constant') {
          result.constants.push(item);
        } else if (item.type === 'environment_variable') {
          result.environmentVariables.push(item);
        } else if (item.type === 'platform_block') {
          result.platformBlocks.push(item);
        } else if (item.type === 'annotation_block') {
          result.annotationBlocks.push(item);
        } else if (item.type === 'include') {
          result.includes.push(item);
        } else if (item.type === 'default_profile') {
          if (result.defaultProfile) {
            throw new Error(`Multiple default profile declarations found. Only one 'default' declaration is allowed per Yamfile.`);
          }
          result.defaultProfile = item.profileName;
        }
      }
      
      return result;
    }

Item
  = Include
  / DefaultProfile
  / AnnotationBlock
  / PlatformBlock
  / Task
  / GlobalVariable
  / GlobalEnvironmentVariable
  / Comment { return null; } // Comments are ignored in AST

// ===== Task Definition =====

Task
  = mods:Modifiers? _ name:Identifier _ params:Parameters? _ clauses:Clauses? _ "{" _ body:TaskBody _ "}" _ {
      const { commands, localVars, localConsts, localEnvVars, calls, internalFunctions } = body || { commands: [], localVars: [], localConsts: [], localEnvVars: [], calls: [], internalFunctions: [] };
      const task = makeTask(mods, name, params, clauses, commands, location);
      task.localVariables = localVars || [];
      task.localConstants = localConsts || [];
      task.localEnvironmentVariables = localEnvVars || [];
      task.calls = calls || [];
      task.internalFunctions = internalFunctions || [];
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
  = first:Parameter rest:(_ "," _ Parameter)* {
      const result = [first];
      for (const r of rest) {
        result.push(r[3]);
      }
      return result;
    }

Parameter
  = name:Identifier _ "=" _ defaultValue:StringLiteral {
      return { name: name, type: 'string', defaultValue: defaultValue };
    }
  / name:Identifier {
      return { name: name, type: 'string' };
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
  = name:Identifier _ params:CallParameters? {
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

// ===== Platform Block Definition =====

PlatformBlock
  = platforms:PlatformList _ "{" _ tasks:PlatformTask* _ "}" _ {
      return makePlatformBlock(platforms, tasks, location);
    }

PlatformList
  = first:Platform rest:(_ Platform)* {
      const result = [first];
      for (const r of rest) {
        result.push(r[1]);
      }
      return result;
    }

Platform
  = "@" name:Identifier { return name; }

PlatformTask
  = _ task:Task _ { return task; }

// ===== Generic Annotation Block Definition =====

AnnotationBlock
  = annotations:AnnotationList _ "{" _ content:AnnotationContent* _ "}" _ {
      return makeAnnotationBlock(annotations, content, location);
    }

AnnotationList
  = first:Annotation rest:(_ Annotation)* {
      const result = [first];
      for (const r of rest) {
        result.push(r[1]);
      }
      return result;
    }

Annotation
  = "@" name:Identifier { return name; }

AnnotationContent
  = _ item:(AnnotationBlock / Task) _ { return item; }

// ===== Default Profile Declaration =====

DefaultProfile
  = "default" _ profileName:Identifier _ Newline? {
      return makeDefaultProfile(profileName, location);
    }

// ===== Include Statement =====

Include
  = "include" _ filePath:StringLiteral _ Newline? {
      return makeInclude(filePath, location);
    }

// ===== Task Body =====

TaskBody
  = lines:TaskLine* {
      const commands = [];
      const localVars = [];
      const localConsts = [];
      const localEnvVars = [];
      const calls = [];
      const inputs = [];
      const internalFunctions = [];
      
      for (const line of lines) {
        if (!line) continue;
        if (line.type === 'command') {
          commands.push(line.value);
        } else if (line.type === 'variable') {
          localVars.push(line);
        } else if (line.type === 'constant') {
          localConsts.push(line);
        } else if (line.type === 'environment_variable') {
          localEnvVars.push(line);
        } else if (line.type === 'call') {
          calls.push(line);
        } else if (line.type === 'input') {
          inputs.push(line);
        } else if (line.type === 'internal_function') {
          internalFunctions.push(line);
        } else if (line.type === 'assignment') {
          // Regular assignments are treated as special commands
          commands.push(`_assign ${line.name} = ${line.value}`);
        }
      }
      
      return { commands, localVars, localConsts, localEnvVars, calls, inputs, internalFunctions };
    }

TaskLine
  = _ Comment _ Newline? { return null; }  // Comments return null and are filtered out
  / _ line:(LocalVariable / LocalEnvironmentVariable / InternalFunction / Assignment / Command) _ Newline? { return line; }
  / _ Newline { return null; }

LocalVariable
  = type:("const" / "var") _ name:Identifier _ "=" _ value:ValueExpression {
      return makeVariable(type, name, value, location);
    }

LocalEnvironmentVariable
  = "env" _ name:Identifier {
      return {
        type: 'environment_variable',
        name: name,
        location: location()
      };
    }

InternalFunction
  = "__" functionName:FunctionName params:(InlineSpace InlineFunctionToken)* {
      return {
        type: 'internal_function',
        name: functionName,
        params: params.map(p => p[1])
      };
    }


InlineSpace
  = [ \t]*

InlineFunctionToken
  = str:StringLiteral { return { type: 'string', value: str }; }
  / arr:ArrayLiteral { return { type: 'array', value: arr }; }
  / "(" _ params:CallParameterList _ ")" { return { type: 'params', value: params }; }
  / "$" name:Identifier { return { type: 'variable', name: name }; }
  / !Newline chars:[a-zA-Z0-9_.-]+ { return { type: 'identifier', value: chars.join('') }; }

FunctionName
  = first:[a-zA-Z_] rest:[a-zA-Z0-9_]* { return first + rest.join(''); }

FunctionToken
  = str:StringLiteral { return { type: 'string', value: str }; }
  / "(" _ params:CallParameterList _ ")" { return { type: 'params', value: params }; }
  / "$" name:Identifier { return { type: 'variable', name: name }; }
  / !("__") chars:[a-zA-Z0-9_.-]+ { return { type: 'identifier', value: chars.join('') }; }

ArrayLiteral
  = "[" _ first:StringLiteral rest:(_ "," _ StringLiteral)* _ "]" {
      const options = [first];
      for (const r of rest) {
        options.push(r[3]);
      }
      return options;
    }

SelectOptions
  = "[" _ first:StringLiteral rest:(_ "," _ StringLiteral)* _ "]" {
      const options = [first];
      for (const r of rest) {
        options.push(r[3]);
      }
      return options;
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
  / Identifier

Assignment
  = name:Identifier _ "=" _ value:ValueExpression {
      return {
        type: 'assignment',
        name: name,
        value: value
      };
    }

Command
  = !("const" / "var" / "__" / "}" / "//" / "/*" / "#") content:RawCommandContent {
      return {
        type: 'command',
        value: content.trim()
      };
    }

RawCommandContent
  = chars:RawCommandChar+ { return chars.join(''); }

RawCommandChar
  = "{" content:RawCommandContent? "}" { return "{" + (content || "") + "}"; }
  / [^\n\r{}]
  / "\n" { return "\n"; }
  / "\r" { return "\r"; }

// ===== Global Variables =====

GlobalVariable
  = type:("const" / "var") _ name:Identifier _ "=" _ value:ValueExpression _ Newline? {
      return makeVariable(type, name, value, location);
    }

GlobalEnvironmentVariable
  = "env" _ name:Identifier _ Newline? {
      return {
        type: 'environment_variable',
        name: name,
        location: location()
      };
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
  / "#" [^\n\r]* { return null; }

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