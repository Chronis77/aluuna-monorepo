// Example client usage for the new Memory Profile API
// This shows how to interact with all the CRUD operations

import { trpc } from '../api/client.js'; // Adjust import path as needed

export class MemoryProfileClient {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Get complete memory profile
  async getProfile() {
    return await trpc.memoryProfile.getMemoryProfile.query({
      userId: this.userId
    });
  }

  // Update string fields
  async updateSummary(summary: string) {
    return await trpc.memoryProfile.updateStringField.mutate({
      userId: this.userId,
      field: 'summary',
      value: summary
    });
  }

  async updateTraumaPatterns(patterns: string) {
    return await trpc.memoryProfile.updateStringField.mutate({
      userId: this.userId,
      field: 'trauma_patterns',
      value: patterns
    });
  }

  async updateTherapeuticApproach(approach: string) {
    return await trpc.memoryProfile.updateStringField.mutate({
      userId: this.userId,
      field: 'therapeutic_approach',
      value: approach
    });
  }

  // Array operations - Add items
  async addCopingTool(tool: string) {
    return await trpc.memoryProfile.addArrayItem.mutate({
      userId: this.userId,
      field: 'coping_tools',
      item: tool
    });
  }

  async addStuckPoint(point: string) {
    return await trpc.memoryProfile.addArrayItem.mutate({
      userId: this.userId,
      field: 'stuck_points',
      item: point
    });
  }

  async addShadowTheme(theme: string) {
    return await trpc.memoryProfile.addArrayItem.mutate({
      userId: this.userId,
      field: 'shadow_themes',
      item: theme
    });
  }

  async addPatternLoop(loop: string) {
    return await trpc.memoryProfile.addArrayItem.mutate({
      userId: this.userId,
      field: 'pattern_loops',
      item: loop
    });
  }

  // Array operations - Update items
  async updateCopingTool(index: number, tool: string) {
    return await trpc.memoryProfile.updateArrayItem.mutate({
      userId: this.userId,
      field: 'coping_tools',
      index,
      item: tool
    });
  }

  async updateStuckPoint(index: number, point: string) {
    return await trpc.memoryProfile.updateArrayItem.mutate({
      userId: this.userId,
      field: 'stuck_points',
      index,
      item: point
    });
  }

  // Array operations - Delete items
  async deleteCopingTool(index: number) {
    return await trpc.memoryProfile.deleteArrayItem.mutate({
      userId: this.userId,
      field: 'coping_tools',
      index
    });
  }

  async deleteStuckPoint(index: number) {
    return await trpc.memoryProfile.deleteArrayItem.mutate({
      userId: this.userId,
      field: 'stuck_points',
      index
    });
  }

  async deleteShadowTheme(index: number) {
    return await trpc.memoryProfile.deleteArrayItem.mutate({
      userId: this.userId,
      field: 'shadow_themes',
      index
    });
  }

  async deletePatternLoop(index: number) {
    return await trpc.memoryProfile.deleteArrayItem.mutate({
      userId: this.userId,
      field: 'pattern_loops',
      index
    });
  }

  // Numeric field updates
  async updateSpiritualConnectionLevel(level: number) {
    return await trpc.memoryProfile.updateNumericField.mutate({
      userId: this.userId,
      field: 'spiritual_connection_level',
      value: level
    });
  }

  async updatePersonalAgencyLevel(level: number) {
    return await trpc.memoryProfile.updateNumericField.mutate({
      userId: this.userId,
      field: 'personal_agency_level',
      value: level
    });
  }

  async updateSuicidalRiskLevel(level: number) {
    return await trpc.memoryProfile.updateNumericField.mutate({
      userId: this.userId,
      field: 'suicidal_risk_level',
      value: level
    });
  }

  // People field (JSON object)
  async updatePeople(people: Record<string, any>) {
    return await trpc.memoryProfile.updatePeople.mutate({
      userId: this.userId,
      people
    });
  }

  // Bulk update multiple fields
  async bulkUpdate(updates: Record<string, any>) {
    return await trpc.memoryProfile.bulkUpdate.mutate({
      userId: this.userId,
      updates
    });
  }
}

// Usage examples:
/*
const client = new MemoryProfileClient('user-123');

// Get profile
const profile = await client.getProfile();

// Add coping tool
await client.addCopingTool('Deep breathing exercises');

// Update stuck point
await client.updateStuckPoint(0, 'Fear of failure in new ventures');

// Delete shadow theme
await client.deleteShadowTheme(1);

// Update numeric field
await client.updateSpiritualConnectionLevel(7);

// Bulk update
await client.bulkUpdate({
  summary: 'User shows significant progress in anxiety management',
  coping_tools: ['Meditation', 'Exercise', 'Journaling'],
  spiritual_connection_level: 8
});
*/ 