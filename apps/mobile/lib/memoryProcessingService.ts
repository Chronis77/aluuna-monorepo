import { SessionService } from './sessionService';
import { supabase } from './supabase';

// Simple UUID generator for React Native
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface MemoryInference {
  inner_parts?: {
    name: string;
    role: string;
    tone: string;
    description: string;
  } | null;
  new_stuck_point?: string | null;
  crisis_signal?: boolean;
  value_conflict?: string | null;
  coping_tool_used?: string | null;
  new_shadow_theme?: string | null;
  new_pattern_loop?: string | null;
  new_mantra?: string | null;
  new_relationship?: {
    name: string;
    role: string;
    notes?: string;
  } | null;
}

export interface StructuredResponse {
  session_memory_commit: string;
  long_term_memory_commit: string;
  response: string;
  wellness_judgement: string;
  new_memory_inference: MemoryInference;
}

export interface ProcessingContext {
  userId: string;
  sessionId?: string;
  sessionGroupId?: string;
  currentSessionContext?: any;
}

export class MemoryProcessingService {
  /**
   * Process a structured JSON response from OpenAI and store relevant data across the database
   */
  static async processStructuredResponse(
    structuredResponse: StructuredResponse,
    context: ProcessingContext
  ): Promise<void> {
    console.log('=== MEMORY PROCESSING START ===');
    console.log('Processing structured response for user:', context.userId);
    console.log('Response data:', JSON.stringify(structuredResponse, null, 2));

    try {
      // Process all storage operations in parallel for better performance
      await Promise.all([
        this.storeSessionMemoryCommit(structuredResponse.session_memory_commit, context),
        this.storeLongTermMemoryCommit(structuredResponse.long_term_memory_commit, context),
        this.storeInnerPart(structuredResponse.new_memory_inference.inner_parts, context),
        this.storeStuckPoint(structuredResponse.new_memory_inference.new_stuck_point, context),
        this.storeCopingTool(structuredResponse.new_memory_inference.coping_tool_used, context),
        this.storeShadowTheme(structuredResponse.new_memory_inference.new_shadow_theme, context),
        this.storePatternLoop(structuredResponse.new_memory_inference.new_pattern_loop, context),
        this.storeMantra(structuredResponse.new_memory_inference.new_mantra, context),
        this.storeRelationship(structuredResponse.new_memory_inference.new_relationship, context),
        this.storeCrisisFlag(structuredResponse.new_memory_inference.crisis_signal, context),
        this.storeValueConflict(structuredResponse.new_memory_inference.value_conflict, context),
        this.storeMemorySnapshot(structuredResponse, context)
      ]);

      console.log('=== MEMORY PROCESSING COMPLETE ===');
    } catch (error) {
      console.error('Error processing structured response:', error);
      throw error;
    }
  }

  /**
   * 1. Store session_memory_commit to current sessions record
   */
  private static async storeSessionMemoryCommit(
    sessionMemoryCommit: string,
    context: ProcessingContext
  ): Promise<void> {
    if (!sessionMemoryCommit || !context.sessionId) {
      console.log('Skipping session memory commit - no data or session ID');
      return;
    }

    try {
      // Use SessionService to update the session summary
      await SessionService.updateSessionSummary(context.sessionId, sessionMemoryCommit);
      console.log('✅ Stored session memory commit:', sessionMemoryCommit);
    } catch (error) {
      console.error('Failed to store session memory commit:', error);
      throw error;
    }
  }

  /**
   * 2. Store long_term_memory_commit to insights table
   */
  private static async storeLongTermMemoryCommit(
    longTermMemoryCommit: string,
    context: ProcessingContext
  ): Promise<void> {
    if (!longTermMemoryCommit) {
      console.log('Skipping long term memory commit - no data');
      return;
    }

    try {
      const { error } = await supabase
        .from('insights')
        .insert({
          id: generateUUID(),
          user_id: context.userId,
          insight_text: longTermMemoryCommit,
          related_theme: null, // Could be enhanced to infer theme
          importance: 5,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error storing long term memory commit:', error);
        throw error;
      }

      console.log('✅ Stored long term memory commit:', longTermMemoryCommit);
    } catch (error) {
      console.error('Failed to store long term memory commit:', error);
      throw error;
    }
  }

  /**
   * 3. Store inner_parts if it exists
   */
  private static async storeInnerPart(
    innerPart: MemoryInference['inner_parts'],
    context: ProcessingContext
  ): Promise<void> {
    if (!innerPart) {
      console.log('Skipping inner part - no data');
      return;
    }

    try {
      // Check if inner part with same name already exists for this user
      const { data: existingPart } = await supabase
        .from('inner_parts')
        .select('id')
        .eq('user_id', context.userId)
        .eq('name', innerPart.name)
        .single();

      if (existingPart) {
        console.log('⏭️ Inner part already exists:', innerPart.name);
        return;
      }

      const { error } = await supabase
        .from('inner_parts')
        .insert({
          id: generateUUID(),
          user_id: context.userId,
          name: innerPart.name,
          role: innerPart.role,
          tone: innerPart.tone,
          description: innerPart.description,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error storing inner part:', error);
        throw error;
      }

      console.log('✅ Stored new inner part:', innerPart.name);
    } catch (error) {
      console.error('Failed to store inner part:', error);
      throw error;
    }
  }

  /**
   * 4. Store stuck_point by appending to memory_profiles.stuck_points array
   */
  private static async storeStuckPoint(
    stuckPoint: string | null | undefined,
    context: ProcessingContext
  ): Promise<void> {
    if (!stuckPoint) {
      console.log('Skipping stuck point - no data');
      return;
    }

    try {
      // Get current memory profile
      const { data: currentProfile, error: fetchError } = await supabase
        .from('memory_profiles')
        .select('stuck_points')
        .eq('user_id', context.userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching memory profile:', fetchError);
        throw fetchError;
      }

      let currentStuckPoints: string[] = [];
      if (currentProfile?.stuck_points) {
        currentStuckPoints = currentProfile.stuck_points;
      }

      // Check if stuck point already exists
      if (currentStuckPoints.includes(stuckPoint)) {
        console.log('⏭️ Stuck point already exists:', stuckPoint);
        return;
      }

      // Append new stuck point
      const updatedStuckPoints = [...currentStuckPoints, stuckPoint];

      // Update or insert memory profile
      if (currentProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('memory_profiles')
          .update({ 
            stuck_points: updatedStuckPoints,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', context.userId);

        if (error) {
          console.error('Error updating memory profile with stuck point:', error);
          throw error;
        }
      } else {
        // Create new profile
        const { error } = await supabase
          .from('memory_profiles')
          .insert({
            id: generateUUID(),
            user_id: context.userId,
            stuck_points: updatedStuckPoints,
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error creating memory profile with stuck point:', error);
          throw error;
        }
      }

      console.log('✅ Stored new stuck point:', stuckPoint);
    } catch (error) {
      console.error('Failed to store stuck point:', error);
      throw error;
    }
  }

  /**
   * 5. Store coping_tool_used by appending to memory_profiles.coping_tools array
   */
  private static async storeCopingTool(
    copingTool: string | null | undefined,
    context: ProcessingContext
  ): Promise<void> {
    if (!copingTool) {
      console.log('Skipping coping tool - no data');
      return;
    }

    try {
      // Get current memory profile
      const { data: currentProfile, error: fetchError } = await supabase
        .from('memory_profiles')
        .select('coping_tools')
        .eq('user_id', context.userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching memory profile:', fetchError);
        throw fetchError;
      }

      let currentCopingTools: string[] = [];
      if (currentProfile?.coping_tools) {
        currentCopingTools = currentProfile.coping_tools;
      }

      // Check if coping tool already exists
      if (currentCopingTools.includes(copingTool)) {
        console.log('⏭️ Coping tool already exists:', copingTool);
        return;
      }

      // Append new coping tool
      const updatedCopingTools = [...currentCopingTools, copingTool];

      // Update or insert memory profile
      if (currentProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('memory_profiles')
          .update({ 
            coping_tools: updatedCopingTools,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', context.userId);

        if (error) {
          console.error('Error updating memory profile with coping tool:', error);
          throw error;
        }
      } else {
        // Create new profile
        const { error } = await supabase
          .from('memory_profiles')
          .insert({
            id: generateUUID(),
            user_id: context.userId,
            coping_tools: updatedCopingTools,
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error creating memory profile with coping tool:', error);
          throw error;
        }
      }

      console.log('✅ Stored new coping tool:', copingTool);
    } catch (error) {
      console.error('Failed to store coping tool:', error);
      throw error;
    }
  }

  /**
   * 6. Store shadow_theme to memory profile
   */
  private static async storeShadowTheme(
    shadowTheme: string | null | undefined,
    context: ProcessingContext
  ): Promise<void> {
    if (!shadowTheme) {
      console.log('Skipping shadow theme - no data');
      return;
    }

    try {
      // Get current memory profile
      const { data: currentProfile } = await supabase
        .from('memory_profiles')
        .select('shadow_themes')
        .eq('user_id', context.userId)
        .single();

      // Prepare updated shadow themes array
      const currentShadowThemes = currentProfile?.shadow_themes || [];
      const updatedShadowThemes = [...currentShadowThemes];
      
      // Only add if not already present (deduplication)
      if (!updatedShadowThemes.includes(shadowTheme)) {
        updatedShadowThemes.push(shadowTheme);
      }

      // Update or insert memory profile
      if (currentProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('memory_profiles')
          .update({ 
            shadow_themes: updatedShadowThemes,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', context.userId);

        if (error) {
          console.error('Error updating memory profile with shadow theme:', error);
          throw error;
        }
      } else {
        // Create new profile
        const { error } = await supabase
          .from('memory_profiles')
          .insert({
            id: generateUUID(),
            user_id: context.userId,
            shadow_themes: updatedShadowThemes,
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error creating memory profile with shadow theme:', error);
          throw error;
        }
      }

      console.log('✅ Stored new shadow theme:', shadowTheme);
    } catch (error) {
      console.error('Failed to store shadow theme:', error);
      throw error;
    }
  }

  /**
   * 7. Store pattern_loop to memory profile
   */
  private static async storePatternLoop(
    patternLoop: string | null | undefined,
    context: ProcessingContext
  ): Promise<void> {
    if (!patternLoop) {
      console.log('Skipping pattern loop - no data');
      return;
    }

    try {
      // Get current memory profile
      const { data: currentProfile } = await supabase
        .from('memory_profiles')
        .select('pattern_loops')
        .eq('user_id', context.userId)
        .single();

      // Prepare updated pattern loops array
      const currentPatternLoops = currentProfile?.pattern_loops || [];
      const updatedPatternLoops = [...currentPatternLoops];
      
      // Only add if not already present (deduplication)
      if (!updatedPatternLoops.includes(patternLoop)) {
        updatedPatternLoops.push(patternLoop);
      }

      // Update or insert memory profile
      if (currentProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('memory_profiles')
          .update({ 
            pattern_loops: updatedPatternLoops,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', context.userId);

        if (error) {
          console.error('Error updating memory profile with pattern loop:', error);
          throw error;
        }
      } else {
        // Create new profile
        const { error } = await supabase
          .from('memory_profiles')
          .insert({
            id: generateUUID(),
            user_id: context.userId,
            pattern_loops: updatedPatternLoops,
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error creating memory profile with pattern loop:', error);
          throw error;
        }
      }

      console.log('✅ Stored new pattern loop:', patternLoop);
    } catch (error) {
      console.error('Failed to store pattern loop:', error);
      throw error;
    }
  }

  /**
   * 8. Store mantra to mantras table
   */
  private static async storeMantra(
    mantra: string | null | undefined,
    context: ProcessingContext
  ): Promise<void> {
    if (!mantra) {
      console.log('Skipping mantra - no data');
      return;
    }

    try {
      // Check if mantra already exists for this user
      const { data: existingMantra } = await supabase
        .from('mantras')
        .select('*')
        .eq('user_id', context.userId)
        .eq('text', mantra)
        .single();

      if (existingMantra) {
        console.log('Mantra already exists, skipping:', mantra);
        return;
      }

      // Insert new mantra
      const { error } = await supabase
        .from('mantras')
        .insert({
          id: generateUUID(),
          user_id: context.userId,
          text: mantra,
          source: 'ai_generated',
          created_at: new Date().toISOString(),
          is_favorite: false,
          tags: null,
          is_pinned: false
        });

      if (error) {
        console.error('Error storing mantra:', error);
        throw error;
      }

      console.log('✅ Stored new mantra:', mantra);
    } catch (error) {
      console.error('Failed to store mantra:', error);
      throw error;
    }
  }

  /**
   * 9. Store relationship to relationships table
   */
  private static async storeRelationship(
    relationship: MemoryInference['new_relationship'],
    context: ProcessingContext
  ): Promise<void> {
    if (!relationship || !relationship.name || !relationship.role) {
      console.log('Skipping relationship - no data or missing required fields');
      return;
    }

    try {
      // Check if relationship already exists for this user
      const { data: existingRelationship } = await supabase
        .from('relationships')
        .select('*')
        .eq('user_id', context.userId)
        .eq('name', relationship.name)
        .single();

      if (existingRelationship) {
        console.log('Relationship already exists, skipping:', relationship.name);
        return;
      }

      // Insert new relationship
      const { error } = await supabase
        .from('relationships')
        .insert({
          id: generateUUID(),
          user_id: context.userId,
          name: relationship.name,
          role: relationship.role,
          notes: relationship.notes || null,
          is_active: true
        });

      if (error) {
        console.error('Error storing relationship:', error);
        throw error;
      }

      console.log('✅ Stored new relationship:', relationship.name, 'as', relationship.role);
    } catch (error) {
      console.error('Failed to store relationship:', error);
      throw error;
    }
  }

  /**
   * 10. Store crisis_flag if crisis_signal is true
   */
  private static async storeCrisisFlag(
    crisisSignal: boolean | null | undefined,
    context: ProcessingContext
  ): Promise<void> {
    if (!crisisSignal) {
      console.log('Skipping crisis flag - no crisis signal');
      return;
    }

    try {
      const { error } = await supabase
        .from('crisis_flags')
        .insert({
          id: generateUUID(),
          user_id: context.userId,
          session_id: context.sessionId || null,
          flag_type: 'ai_crisis_detection',
          triggered_at: new Date().toISOString(),
          reviewed: false
        });

      if (error) {
        console.error('Error storing crisis flag:', error);
        throw error;
      }

      console.log('🚨 Stored crisis flag for user:', context.userId);
    } catch (error) {
      console.error('Failed to store crisis flag:', error);
      throw error;
    }
  }

  /**
   * 11. Store value_conflict to insights with special theme
   */
  private static async storeValueConflict(
    valueConflict: string | null | undefined,
    context: ProcessingContext
  ): Promise<void> {
    if (!valueConflict) {
      console.log('Skipping value conflict - no data');
      return;
    }

    try {
      const { error } = await supabase
        .from('insights')
        .insert({
          id: generateUUID(),
          user_id: context.userId,
          insight_text: valueConflict,
          related_theme: 'value_conflict',
          importance: 6,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error storing value conflict:', error);
        throw error;
      }

      console.log('✅ Stored value conflict insight:', valueConflict);
    } catch (error) {
      console.error('Failed to store value conflict:', error);
      throw error;
    }
  }

  /**
   * 12. Store memory snapshot of the session
   */
  private static async storeMemorySnapshot(
    structuredResponse: StructuredResponse,
    context: ProcessingContext
  ): Promise<void> {
    try {
      // Extract key themes from the response
      const keyThemes: string[] = [];
      
      // Add wellness judgement as a theme
      if (structuredResponse.wellness_judgement && structuredResponse.wellness_judgement !== 'n/a') {
        keyThemes.push(structuredResponse.wellness_judgement);
      }

      // Add coping tool as a theme if present
      if (structuredResponse.new_memory_inference.coping_tool_used) {
        keyThemes.push(structuredResponse.new_memory_inference.coping_tool_used);
      }

      // Add inner part name as a theme if present
      if (structuredResponse.new_memory_inference.inner_parts?.name) {
        keyThemes.push(structuredResponse.new_memory_inference.inner_parts.name);
      }

      const { error } = await supabase
        .from('memory_snapshots')
        .insert({
          id: generateUUID(),
          user_id: context.userId,
          summary: structuredResponse.session_memory_commit || 'Session snapshot',
          key_themes: keyThemes.length > 0 ? keyThemes : null,
          created_at: new Date().toISOString(),
          generated_by: 'gpt'
        });

      if (error) {
        console.error('Error storing memory snapshot:', error);
        throw error;
      }

      console.log('✅ Stored memory snapshot with themes:', keyThemes);
    } catch (error) {
      console.error('Failed to store memory snapshot:', error);
      throw error;
    }
  }

  /**
   * Helper method to get user's current memory profile
   */
  static async getMemoryProfile(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('memory_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching memory profile:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to get memory profile:', error);
      throw error;
    }
  }

  /**
   * Helper method to get user's insights
   */
  static async getUserInsights(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('insights')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user insights:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get user insights:', error);
      throw error;
    }
  }

  /**
   * Helper method to get user's inner parts
   */
  static async getUserInnerParts(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('inner_parts')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching user inner parts:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get user inner parts:', error);
      throw error;
    }
  }

  /**
   * Helper method to get user's mantras
   */
  static async getUserMantras(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('mantras')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching mantras:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get mantras:', error);
      throw error;
    }
  }

  /**
   * Helper method to get user's relationships
   */
  static async getUserRelationships(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('relationships')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching relationships:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get relationships:', error);
      throw error;
    }
  }
} 