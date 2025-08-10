import { handleToolCall } from './index.js';
import { logger } from '../utils/logger.js';

export interface ToolExecutionResult {
  toolCallId: string;
  toolName: string;
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
}

export interface PendingToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
  index: number;
}

/**
 * Real-time tool executor that processes tools immediately when they're complete.
 * This eliminates the buffering issue where tools were executed all at once at stream end.
 */
export class RealTimeToolExecutor {
  private pendingToolCalls: Map<string, PendingToolCall> = new Map();
  private completedToolCalls: Map<string, ToolExecutionResult> = new Map();

  /**
   * Add a tool call to the pending queue.
   * This is called during streaming as tool calls are received.
   */
  public addPendingToolCall(toolCall: PendingToolCall): void {
    this.pendingToolCalls.set(toolCall.id, toolCall);
    logger.debug('Added pending tool call', {
      toolCallId: toolCall.id,
      toolName: toolCall.function.name,
      argumentsLength: toolCall.function.arguments?.length || 0
    });
  }

  /**
   * Update tool call arguments as they stream in.
   * This accumulates partial arguments until they're complete.
   */
  public updateToolCallArguments(toolCallId: string, newArguments: string): void {
    const existing = this.pendingToolCalls.get(toolCallId);
    if (existing) {
      existing.function.arguments += newArguments;
      logger.debug('Updated tool call arguments', {
        toolCallId,
        toolName: existing.function.name,
        argumentsLength: existing.function.arguments.length
      });
    }
  }

  /**
   * Check if a tool call has complete arguments (valid JSON).
   */
  public isToolCallComplete(toolCallId: string): boolean {
    const toolCall = this.pendingToolCalls.get(toolCallId);
    if (!toolCall || !toolCall.function.arguments) {
      return false;
    }

    try {
      const args = toolCall.function.arguments.trim();
      // Basic heuristics for complete JSON
      if (!args.startsWith('{') || !args.endsWith('}')) {
        return false;
      }
      
      // Test if it's valid JSON
      JSON.parse(args);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all complete tool calls that are ready for execution.
   */
  public getCompleteToolCalls(): PendingToolCall[] {
    const complete: PendingToolCall[] = [];
    
    for (const [toolCallId, toolCall] of this.pendingToolCalls.entries()) {
      if (this.isToolCallComplete(toolCallId)) {
        complete.push(toolCall);
      }
    }
    
    return complete;
  }

  /**
   * Execute a tool call immediately when it's complete.
   * This is the key fix for real-time tool execution.
   */
  public async executeToolCall(toolCall: PendingToolCall, effectiveUserId: string): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Parse and validate arguments
      let parsedArgs = JSON.parse(toolCall.function.arguments);
      
      // Fix placeholder user IDs
      if (parsedArgs.userId === 'uuid' || parsedArgs.userId === 'user_id' || 
          parsedArgs.userId === 'user' || !parsedArgs.userId || 
          typeof parsedArgs.userId !== 'string' || parsedArgs.userId.length < 10) {
        parsedArgs.userId = effectiveUserId;
        logger.warn('✅ Replaced placeholder userId with actual userId', {
          toolName: toolCall.function.name,
          originalUserId: toolCall.function.arguments,
          effectiveUserId
        });
      }

      // Execute the tool
      const result = await handleToolCall({
        id: toolCall.id,
        type: 'function',
        function: {
          name: toolCall.function.name,
          arguments: JSON.stringify(parsedArgs)
        }
      });

      const executionResult: ToolExecutionResult = {
        toolCallId: toolCall.id,
        toolName: toolCall.function.name,
        success: true,
        result,
        executionTime: Date.now() - startTime
      };

      // Mark as completed
      this.completedToolCalls.set(toolCall.id, executionResult);
      this.pendingToolCalls.delete(toolCall.id);

      logger.info('Tool executed successfully', {
        toolCallId: toolCall.id,
        toolName: toolCall.function.name,
        executionTime: executionResult.executionTime
      });

      return executionResult;

    } catch (error) {
      const executionResult: ToolExecutionResult = {
        toolCallId: toolCall.id,
        toolName: toolCall.function.name,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - startTime
      };

      // Mark as completed (with error)
      this.completedToolCalls.set(toolCall.id, executionResult);
      this.pendingToolCalls.delete(toolCall.id);

      logger.error('Tool execution failed', {
        toolCallId: toolCall.id,
        toolName: toolCall.function.name,
        error: executionResult.error,
        executionTime: executionResult.executionTime
      });

      return executionResult;
    }
  }

  /**
   * Execute all complete tool calls immediately.
   * This processes tools in real-time as they become ready.
   */
  public async executeAllCompleteToolCalls(effectiveUserId: string): Promise<ToolExecutionResult[]> {
    const completeToolCalls = this.getCompleteToolCalls();
    
    if (completeToolCalls.length === 0) {
      return [];
    }

    logger.info('Executing complete tool calls', {
      count: completeToolCalls.length,
      toolNames: completeToolCalls.map(tc => tc.function.name)
    });

    // Execute tools sequentially to avoid concurrent UI updates and race conditions
    const results: ToolExecutionResult[] = [];
    for (const toolCall of completeToolCalls) {
      // eslint-disable-next-line no-await-in-loop
      const result = await this.executeToolCall(toolCall, effectiveUserId);
      results.push(result);
    }

    return results;
  }

  /**
   * Get execution status for debugging.
   */
  public getStatus(): {
    pendingCount: number;
    completedCount: number;
    pendingToolNames: string[];
    completedToolNames: string[];
  } {
    return {
      pendingCount: this.pendingToolCalls.size,
      completedCount: this.completedToolCalls.size,
      pendingToolNames: Array.from(this.pendingToolCalls.values()).map(tc => tc.function.name),
      completedToolNames: Array.from(this.completedToolCalls.values()).map(tc => tc.toolName)
    };
  }

  /**
   * Clear all state (useful for testing or cleanup).
   */
  public clear(): void {
    this.pendingToolCalls.clear();
    this.completedToolCalls.clear();
  }
}

// Export singleton instance
export const realTimeToolExecutor = new RealTimeToolExecutor();
