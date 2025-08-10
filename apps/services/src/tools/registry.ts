import { tools } from './index.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { logger } from '../utils/logger.js';

/**
 * Session-based tool registry that's initialized once per server startup.
 * This eliminates the need to convert tools to JSON Schema on every request.
 */
export class ToolRegistry {
  private static instance: ToolRegistry;
  private openAITools: any[] = [];
  private toolsByName: Map<string, any> = new Map();
  private initialized = false;

  private constructor() {}

  public static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  /**
   * Initialize the tool registry once per server startup.
   * This converts all Zod schemas to OpenAI-compatible JSON Schema format.
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      logger.info('Initializing tool registry', { toolCount: tools.length });

      // Convert tools to OpenAI-compatible JSON Schema format
      this.openAITools = tools.map((tool: any) => {
        if (tool.type === 'function') {
          const openAITool = {
            type: 'function' as const,
            function: {
              name: tool.function.name,
              description: tool.function.description,
              parameters: zodToJsonSchema(tool.function.parameters, { target: 'openApi3' })
            }
          };

          // Store tool by name for quick lookup
          this.toolsByName.set(tool.function.name, tool);

          return openAITool;
        }
        return tool;
      });

      this.initialized = true;
      logger.info('Tool registry initialized successfully', {
        openAIToolsCount: this.openAITools.length,
        toolsByNameCount: this.toolsByName.size
      });

      // Log first few tools for debugging
      if (process.env['LOG_OPENAI'] === 'true') {
        logger.warn('Tool registry debug info', {
          firstToolName: this.openAITools[0]?.function?.name,
          firstToolDescription: this.openAITools[0]?.function?.description,
          totalTools: this.openAITools.length
        });
      }
    } catch (error) {
      logger.error('Failed to initialize tool registry', { error });
      throw error;
    }
  }

  /**
   * Get the OpenAI-compatible tools array.
   * This is the same array for all conversations and sessions.
   */
  public getOpenAITools(): any[] {
    if (!this.initialized) {
      throw new Error('Tool registry not initialized. Call initialize() first.');
    }
    return this.openAITools;
  }

  /**
   * Get a specific tool by name.
   */
  public getToolByName(name: string): any {
    if (!this.initialized) {
      throw new Error('Tool registry not initialized. Call initialize() first.');
    }
    return this.toolsByName.get(name);
  }

  /**
   * Check if the registry is initialized.
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get registry status for debugging.
   */
  public getStatus(): { initialized: boolean; toolCount: number; openAIToolsCount: number } {
    return {
      initialized: this.initialized,
      toolCount: tools.length,
      openAIToolsCount: this.openAITools.length
    };
  }
}

// Export singleton instance
export const toolRegistry = ToolRegistry.getInstance();
