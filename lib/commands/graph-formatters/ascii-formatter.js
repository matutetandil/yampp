import { BaseGraphFormatter } from './base-formatter.js';
import chalk from 'chalk';

/**
 * ASCII formatter for graph output
 * Displays graph as ASCII art with boxes and arrows
 */
export class AsciiGraphFormatter extends BaseGraphFormatter {
  getName() {
    return 'ascii';
  }
  
  format(taskName) {
    if (taskName) {
      // For single task, show a focused view
      this.formatSingleTaskAscii(taskName);
    } else {
      // Show full graph in ASCII
      this.formatFullGraphAscii();
    }
  }
  
  formatSingleTaskAscii(taskName) {
    const task = this.tasks.get(taskName);
    if (!task) {
      throw new Error(`Task '${taskName}' not found`);
    }
    
    const deps = this.graph.getDependencies(taskName);
    const dependents = this.graph.getDependents(taskName);
    
    console.log(chalk.cyan('ASCII Dependency Graph:'));
    console.log();
    
    // Draw dependencies above
    if (deps.length > 0) {
      deps.forEach((dep, index) => {
        const box = this.createBox(dep);
        box.forEach(line => console.log('    ' + line));
        if (index < deps.length - 1) {
          console.log('         │');
        }
      });
      console.log('         ▼');
    }
    
    // Draw main task
    const mainBox = this.createBox(taskName, true);
    mainBox.forEach(line => console.log(line));
    
    // Draw dependents below
    if (dependents.length > 0) {
      console.log('         │');
      console.log('         ▼');
      dependents.forEach((dependent, index) => {
        const box = this.createBox(dependent);
        box.forEach(line => console.log('    ' + line));
        if (index < dependents.length - 1) {
          console.log('         │');
        }
      });
    }
  }
  
  formatFullGraphAscii() {
    console.log(chalk.cyan('ASCII Task Graph:'));
    console.log();
    
    // Get execution order to display tasks in levels
    const executionOrder = this.graph.getExecutionOrder();
    const levels = this.organizeLevels(executionOrder);
    
    // Draw each level
    levels.forEach((level, levelIndex) => {
      // Draw tasks in this level
      const boxes = level.map(task => this.createBox(task));
      const maxLines = Math.max(...boxes.map(b => b.length));
      
      // Print boxes side by side
      for (let i = 0; i < maxLines; i++) {
        let line = '';
        level.forEach((task, taskIndex) => {
          const box = boxes[taskIndex];
          if (i < box.length) {
            line += box[i];
          } else {
            line += ' '.repeat(this.getBoxWidth(task));
          }
          if (taskIndex < level.length - 1) {
            line += '    '; // Space between boxes
          }
        });
        console.log(line);
      }
      
      // Draw arrows to next level if exists
      if (levelIndex < levels.length - 1) {
        console.log();
        
        // Draw connection lines
        let connectionLine = '';
        level.forEach((task, index) => {
          const dependents = this.graph.getDependents(task);
          const hasConnection = dependents.some(d => levels[levelIndex + 1].includes(d));
          
          if (hasConnection) {
            const boxCenter = Math.floor(this.getBoxWidth(task) / 2);
            connectionLine += ' '.repeat(boxCenter) + '│' + ' '.repeat(this.getBoxWidth(task) - boxCenter - 1);
          } else {
            connectionLine += ' '.repeat(this.getBoxWidth(task));
          }
          
          if (index < level.length - 1) {
            connectionLine += '    ';
          }
        });
        console.log(connectionLine);
        
        // Draw arrow heads
        let arrowLine = '';
        level.forEach((task, index) => {
          const dependents = this.graph.getDependents(task);
          const hasConnection = dependents.some(d => levels[levelIndex + 1].includes(d));
          
          if (hasConnection) {
            const boxCenter = Math.floor(this.getBoxWidth(task) / 2);
            arrowLine += ' '.repeat(boxCenter) + '▼' + ' '.repeat(this.getBoxWidth(task) - boxCenter - 1);
          } else {
            arrowLine += ' '.repeat(this.getBoxWidth(task));
          }
          
          if (index < level.length - 1) {
            arrowLine += '    ';
          }
        });
        console.log(arrowLine);
        console.log();
      }
    });
  }
  
  organizeLevels(executionOrder) {
    const levels = [];
    const placed = new Set();
    
    for (const task of executionOrder) {
      if (placed.has(task)) continue;
      
      // Find the appropriate level for this task
      const deps = this.graph.getDependencies(task);
      let maxLevel = -1;
      
      for (const dep of deps) {
        for (let level = 0; level < levels.length; level++) {
          if (levels[level].includes(dep)) {
            maxLevel = Math.max(maxLevel, level);
          }
        }
      }
      
      const targetLevel = maxLevel + 1;
      
      if (!levels[targetLevel]) {
        levels[targetLevel] = [];
      }
      
      levels[targetLevel].push(task);
      placed.add(task);
    }
    
    return levels;
  }
  
  createBox(taskName, highlight = false) {
    const task = this.tasks.get(taskName);
    const modifiers = task ? Array.from(task.modifiers) : [];
    
    // Calculate box width
    const width = this.getBoxWidth(taskName);
    const innerWidth = width - 2;
    
    const lines = [];
    
    // Top border
    lines.push('┌' + '─'.repeat(innerWidth) + '┐');
    
    // Task name line
    const padding = Math.floor((innerWidth - taskName.length) / 2);
    const nameLine = taskName.padStart(padding + taskName.length).padEnd(innerWidth);
    lines.push('│' + (highlight ? chalk.bold.green(nameLine) : nameLine) + '│');
    
    // Modifiers line (if any)
    if (modifiers.length > 0) {
      const modText = `[${modifiers.join(',')}]`;
      const modPadding = Math.floor((innerWidth - modText.length) / 2);
      const modLine = modText.padStart(modPadding + modText.length).padEnd(innerWidth);
      lines.push('│' + chalk.yellow(modLine) + '│');
    }
    
    // Bottom border
    lines.push('└' + '─'.repeat(innerWidth) + '┘');
    
    return lines;
  }
  
  getBoxWidth(taskName) {
    const task = this.tasks.get(taskName);
    const modifiers = task ? Array.from(task.modifiers) : [];
    
    let maxWidth = taskName.length + 4; // Base width with padding
    
    if (modifiers.length > 0) {
      const modText = `[${modifiers.join(',')}]`;
      maxWidth = Math.max(maxWidth, modText.length + 4);
    }
    
    return Math.max(maxWidth, 12); // Minimum width of 12
  }
}