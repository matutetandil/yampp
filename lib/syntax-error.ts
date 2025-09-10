/**
 * Peggy-generated syntax error class with location and formatting support
 */
export class PeggySyntaxError extends SyntaxError {
  expected: any[];
  found: any;
  location: any;

  constructor(message: string, expected: any[], found: any, location: any) {
    super(message);
    this.expected = expected;
    this.found = found;
    this.location = location;
    this.name = "SyntaxError";
  }

  format(sources: Array<{ source: string; text: string }>): string {
    let str = "Error: " + this.message;
    if (this.location) {
      let src = null;
      const st = sources.find(s => s.source === this.location.source);
      if (st) {
        src = st.text.split(/\r\n|\n|\r/g);
      }
      const s = this.location.start;
      const offset_s = (this.location.source && (typeof this.location.source.offset === "function"))
        ? this.location.source.offset(s)
        : s;
      const loc = this.location.source + ":" + offset_s.line + ":" + offset_s.column;
      if (src) {
        const e = this.location.end;
        const filler = "".padEnd(offset_s.line.toString().length, " ");
        const line = src[s.line - 1];
        const last = s.line === e.line ? e.column : (line?.length || 0) + 1;
        const hatLen = (last - s.column) || 1;
        str += "\n --> " + loc + "\n"
            + filler + " |\n"
            + offset_s.line + " | " + line + "\n"
            + filler + " | " + "".padEnd(s.column - 1, " ")
            + "".padEnd(hatLen, "^");
      } else {
        str += "\n at " + loc;
      }
    }
    return str;
  }

  static buildMessage(expected: any[], found: any): string {
    function hex(ch: string): string {
      return ch.codePointAt(0)!.toString(16).toUpperCase();
    }

    const nonPrintable = Object.prototype.hasOwnProperty.call(RegExp.prototype, "unicode")
      ? new RegExp("[\\p{C}\\p{Mn}\\p{Mc}]", "gu")
      : null;
    
    function unicodeEscape(s: string): string {
      if (nonPrintable) {
        return s.replace(nonPrintable, ch => "\\u{" + hex(ch) + "}");
      }
      return s;
    }

    function literalEscape(s: string): string {
      return unicodeEscape(s
        .replace(/\\/g, "\\\\")
        .replace(/"/g,  "\\\"")
        .replace(/\0/g, "\\0")
        .replace(/\t/g, "\\t")
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/[\x00-\x0F]/g,          ch => "\\x0" + hex(ch))
        .replace(/[\x10-\x1F\x7F-\x9F]/g, ch => "\\x"  + hex(ch)));
    }

    function classEscape(s: string): string {
      return unicodeEscape(s
        .replace(/\\/g, "\\\\")
        .replace(/\]/g, "\\]")
        .replace(/\^/g, "\\^")
        .replace(/-/g,  "\\-")
        .replace(/\0/g, "\\0")
        .replace(/\t/g, "\\t")
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/[\x00-\x0F]/g,          ch => "\\x0" + hex(ch))
        .replace(/[\x10-\x1F\x7F-\x9F]/g, ch => "\\x"  + hex(ch)));
    }

    const DESCRIBE_EXPECTATION_FNS: Record<string, (expectation: any) => string> = {
      literal(expectation: any): string {
        return "\"" + literalEscape(expectation.text) + "\"";
      },

      class(expectation: any): string {
        const escapedParts = expectation.parts.map(
          (part: any) => (Array.isArray(part)
            ? classEscape(part[0]) + "-" + classEscape(part[1])
            : classEscape(part))
        );

        return "[" + (expectation.inverted ? "^" : "") + escapedParts.join("") + "]" + (expectation.unicode ? "u" : "");
      },

      any(): string {
        return "any character";
      },

      end(): string {
        return "end of input";
      },

      other(expectation: any): string {
        return expectation.description;
      }
    };

    function describeExpected(expected: any[]): string {
      const descriptions = expected.map((expectation: any) => 
        DESCRIBE_EXPECTATION_FNS[expectation.type]?.(expectation) || 'unknown'
      );

      const uniqueDescriptions = [...new Set(descriptions)];

      switch (uniqueDescriptions.length) {
        case 1:
          return uniqueDescriptions[0] || 'unknown';

        case 2:
          return uniqueDescriptions[0] + " or " + uniqueDescriptions[1];

        default:
          return uniqueDescriptions.slice(0, -1).join(", ")
            + ", or "
            + uniqueDescriptions[uniqueDescriptions.length - 1];
      }
    }

    function describeFound(found: any): string {
      return found ? "\"" + literalEscape(found) + "\"" : "end of input";
    }

    return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
  }
}