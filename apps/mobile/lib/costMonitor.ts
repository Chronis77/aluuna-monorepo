export interface CostMetrics {
  tokens: number;
  estimatedCost: number;
  contextType: string;
  sessionPhase: string;
  timestamp: Date;
}

export class CostMonitor {
  private static costHistory: CostMetrics[] = [];
  
  // GPT-4 pricing (approximate)
  private static readonly GPT4_INPUT_COST_PER_1K = 0.03; // $0.03 per 1k tokens
  private static readonly GPT4_OUTPUT_COST_PER_1K = 0.06; // $0.06 per 1k tokens
  
  // GPT-3.5 pricing (for comparison)
  private static readonly GPT35_INPUT_COST_PER_1K = 0.0015; // $0.0015 per 1k tokens
  private static readonly GPT35_OUTPUT_COST_PER_1K = 0.002; // $0.002 per 1k tokens

  // Track cost for a request
  static trackRequest(
    inputTokens: number, 
    outputTokens: number, 
    contextType: string, 
    sessionPhase: string
  ): CostMetrics {
    const inputCost = (inputTokens / 1000) * this.GPT4_INPUT_COST_PER_1K;
    const outputCost = (outputTokens / 1000) * this.GPT4_OUTPUT_COST_PER_1K;
    const totalCost = inputCost + outputCost;
    
    const metrics: CostMetrics = {
      tokens: inputTokens + outputTokens,
      estimatedCost: totalCost,
      contextType,
      sessionPhase,
      timestamp: new Date()
    };
    
    this.costHistory.push(metrics);
    
    console.log('💰 Cost Metrics:', {
      inputTokens,
      outputTokens,
      totalTokens: metrics.tokens,
      inputCost: `$${inputCost.toFixed(4)}`,
      outputCost: `$${outputCost.toFixed(4)}`,
      totalCost: `$${totalCost.toFixed(4)}`,
      contextType,
      sessionPhase
    });
    
    return metrics;
  }

  // Get cost summary
  static getCostSummary(): {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    averageCostPerRequest: number;
    costByContextType: Record<string, number>;
    costBySessionPhase: Record<string, number>;
  } {
    if (this.costHistory.length === 0) {
      return {
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        averageCostPerRequest: 0,
        costByContextType: {},
        costBySessionPhase: {}
      };
    }

    const totalTokens = this.costHistory.reduce((sum, metric) => sum + metric.tokens, 0);
    const totalCost = this.costHistory.reduce((sum, metric) => sum + metric.estimatedCost, 0);
    const averageCostPerRequest = totalCost / this.costHistory.length;

    // Group by context type
    const costByContextType: Record<string, number> = {};
    this.costHistory.forEach(metric => {
      costByContextType[metric.contextType] = (costByContextType[metric.contextType] || 0) + metric.estimatedCost;
    });

    // Group by session phase
    const costBySessionPhase: Record<string, number> = {};
    this.costHistory.forEach(metric => {
      costBySessionPhase[metric.sessionPhase] = (costBySessionPhase[metric.sessionPhase] || 0) + metric.estimatedCost;
    });

    return {
      totalRequests: this.costHistory.length,
      totalTokens,
      totalCost,
      averageCostPerRequest,
      costByContextType,
      costBySessionPhase
    };
  }

  // Get cost savings compared to full prompts
  static getCostSavings(): {
    originalEstimatedCost: number;
    optimizedCost: number;
    savings: number;
    savingsPercentage: number;
  } {
    const summary = this.getCostSummary();
    
    // Estimate what full prompts would cost (2000 tokens average)
    const fullPromptTokens = 2000;
    const fullPromptCost = (fullPromptTokens / 1000) * this.GPT4_INPUT_COST_PER_1K;
    const originalEstimatedCost = summary.totalRequests * fullPromptCost;
    
    const savings = originalEstimatedCost - summary.totalCost;
    const savingsPercentage = (savings / originalEstimatedCost) * 100;

    return {
      originalEstimatedCost,
      optimizedCost: summary.totalCost,
      savings,
      savingsPercentage
    };
  }

  // Clear cost history
  static clearHistory(): void {
    this.costHistory = [];
  }

  // Get recent costs (last N requests)
  static getRecentCosts(count: number = 10): CostMetrics[] {
    return this.costHistory.slice(-count);
  }

  // Estimate cost for a specific prompt
  static estimatePromptCost(
    promptLength: number, 
    expectedResponseLength: number = 200
  ): { inputCost: number; outputCost: number; totalCost: number } {
    const inputTokens = Math.ceil(promptLength / 4); // Rough approximation
    const outputTokens = Math.ceil(expectedResponseLength / 4);
    
    const inputCost = (inputTokens / 1000) * this.GPT4_INPUT_COST_PER_1K;
    const outputCost = (outputTokens / 1000) * this.GPT4_OUTPUT_COST_PER_1K;
    const totalCost = inputCost + outputCost;
    
    return {
      inputCost,
      outputCost,
      totalCost
    };
  }

  // Compare costs between different models
  static compareModelCosts(
    inputTokens: number, 
    outputTokens: number
  ): {
    gpt4: { inputCost: number; outputCost: number; totalCost: number };
    gpt35: { inputCost: number; outputCost: number; totalCost: number };
    savings: number;
    savingsPercentage: number;
  } {
    const gpt4InputCost = (inputTokens / 1000) * this.GPT4_INPUT_COST_PER_1K;
    const gpt4OutputCost = (outputTokens / 1000) * this.GPT4_OUTPUT_COST_PER_1K;
    const gpt4TotalCost = gpt4InputCost + gpt4OutputCost;
    
    const gpt35InputCost = (inputTokens / 1000) * this.GPT35_INPUT_COST_PER_1K;
    const gpt35OutputCost = (outputTokens / 1000) * this.GPT35_OUTPUT_COST_PER_1K;
    const gpt35TotalCost = gpt35InputCost + gpt35OutputCost;
    
    const savings = gpt4TotalCost - gpt35TotalCost;
    const savingsPercentage = (savings / gpt4TotalCost) * 100;
    
    return {
      gpt4: {
        inputCost: gpt4InputCost,
        outputCost: gpt4OutputCost,
        totalCost: gpt4TotalCost
      },
      gpt35: {
        inputCost: gpt35InputCost,
        outputCost: gpt35OutputCost,
        totalCost: gpt35TotalCost
      },
      savings,
      savingsPercentage
    };
  }

  // Generate cost report
  static generateCostReport(): string {
    const summary = this.getCostSummary();
    const savings = this.getCostSavings();
    
    if (summary.totalRequests === 0) {
      return 'No cost data available yet.';
    }
    
    return `
💰 COST REPORT
==============
Total Requests: ${summary.totalRequests}
Total Tokens: ${summary.totalTokens.toLocaleString()}
Total Cost: $${summary.totalCost.toFixed(4)}
Average Cost per Request: $${summary.averageCostPerRequest.toFixed(4)}

📊 COST SAVINGS
===============
Original Estimated Cost: $${savings.originalEstimatedCost.toFixed(4)}
Optimized Cost: $${savings.optimizedCost.toFixed(4)}
Total Savings: $${savings.savings.toFixed(4)}
Savings Percentage: ${savings.savingsPercentage.toFixed(1)}%

📈 COST BY CONTEXT TYPE
=======================
${Object.entries(summary.costByContextType)
  .map(([type, cost]) => `${type}: $${cost.toFixed(4)}`)
  .join('\n')}

📈 COST BY SESSION PHASE
========================
${Object.entries(summary.costBySessionPhase)
  .map(([phase, cost]) => `${phase}: $${cost.toFixed(4)}`)
  .join('\n')}
    `.trim();
  }
} 