import { supabase } from './supabase';

export interface MemoryUpdate {
  user_id: string;
  new_insights?: string[];
  new_emotional_patterns?: string[];
  new_relationship_dynamics?: string[];
  new_growth_opportunities?: string[];
  new_risk_factors?: string[];
  new_strengths?: string[];
  new_stuck_points?: string[];
  new_coping_tools?: string[];
  new_goals?: string[];
  updated_therapeutic_approach?: string;
  session_insights?: string;
}

export class MemoryUpdateService {
  // Update user's memory profile with new insights from sessions
  static async updateMemoryProfile(update: MemoryUpdate): Promise<boolean> {
    try {
      console.log('Updating memory profile for user:', update.user_id);
      console.log('Update data:', update);

      // Get current memory profile
      const { data: currentProfile, error: fetchError } = await supabase
        .from('memory_profiles')
        .select('*')
        .eq('user_id', update.user_id)
        .single();

      if (fetchError) {
        console.error('Error fetching current memory profile:', fetchError);
        return false;
      }

      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Merge new insights with existing ones
      if (update.new_insights && update.new_insights.length > 0) {
        const existingInsights = currentProfile.recent_insights || [];
        const combinedInsights = [...existingInsights, ...update.new_insights];
        // Keep only the last 10 insights
        updateData.recent_insights = combinedInsights.slice(-10);
      }

      // Merge new emotional patterns
      if (update.new_emotional_patterns && update.new_emotional_patterns.length > 0) {
        const existingPatterns = currentProfile.emotional_patterns || [];
        const newPatterns = update.new_emotional_patterns.filter(
          pattern => !existingPatterns.includes(pattern)
        );
        if (newPatterns.length > 0) {
          updateData.emotional_patterns = [...existingPatterns, ...newPatterns];
        }
      }

      // Merge new relationship dynamics
      if (update.new_relationship_dynamics && update.new_relationship_dynamics.length > 0) {
        const existingDynamics = currentProfile.relationship_dynamics || [];
        const newDynamics = update.new_relationship_dynamics.filter(
          dynamic => !existingDynamics.includes(dynamic)
        );
        if (newDynamics.length > 0) {
          updateData.relationship_dynamics = [...existingDynamics, ...newDynamics];
        }
      }

      // Merge new growth opportunities
      if (update.new_growth_opportunities && update.new_growth_opportunities.length > 0) {
        const existingOpportunities = currentProfile.growth_opportunities || [];
        const newOpportunities = update.new_growth_opportunities.filter(
          opportunity => !existingOpportunities.includes(opportunity)
        );
        if (newOpportunities.length > 0) {
          updateData.growth_opportunities = [...existingOpportunities, ...newOpportunities];
        }
      }

      // Merge new risk factors
      if (update.new_risk_factors && update.new_risk_factors.length > 0) {
        const existingRiskFactors = currentProfile.risk_factors || [];
        const newRiskFactors = update.new_risk_factors.filter(
          risk => !existingRiskFactors.includes(risk)
        );
        if (newRiskFactors.length > 0) {
          updateData.risk_factors = [...existingRiskFactors, ...newRiskFactors];
        }
      }

      // Merge new strengths
      if (update.new_strengths && update.new_strengths.length > 0) {
        const existingStrengths = currentProfile.strengths || [];
        const newStrengths = update.new_strengths.filter(
          strength => !existingStrengths.includes(strength)
        );
        if (newStrengths.length > 0) {
          updateData.strengths = [...existingStrengths, ...newStrengths];
        }
      }

      // Merge new stuck points
      if (update.new_stuck_points && update.new_stuck_points.length > 0) {
        const existingStuckPoints = currentProfile.stuck_points || [];
        const newStuckPoints = update.new_stuck_points.filter(
          point => !existingStuckPoints.includes(point)
        );
        if (newStuckPoints.length > 0) {
          updateData.stuck_points = [...existingStuckPoints, ...newStuckPoints];
        }
      }

      // Merge new coping tools
      if (update.new_coping_tools && update.new_coping_tools.length > 0) {
        const existingCopingTools = currentProfile.coping_tools || [];
        const newCopingTools = update.new_coping_tools.filter(
          tool => !existingCopingTools.includes(tool)
        );
        if (newCopingTools.length > 0) {
          updateData.coping_tools = [...existingCopingTools, ...newCopingTools];
        }
      }

      // Merge new goals
      if (update.new_goals && update.new_goals.length > 0) {
        const existingGoals = currentProfile.goals || [];
        const newGoals = update.new_goals.filter(
          goal => !existingGoals.includes(goal)
        );
        if (newGoals.length > 0) {
          updateData.goals = [...existingGoals, ...newGoals];
        }
      }

      // Update therapeutic approach if provided
      if (update.updated_therapeutic_approach) {
        updateData.therapeutic_approach = update.updated_therapeutic_approach;
      }

      // Update insight notes if provided
      if (update.session_insights) {
        const existingInsightNotes = currentProfile.insight_notes || '';
        const newInsightNotes = existingInsightNotes 
          ? `${existingInsightNotes}\n\n${update.session_insights}`
          : update.session_insights;
        updateData.insight_notes = newInsightNotes;
      }

      // Only update if there are changes
      if (Object.keys(updateData).length > 1) { // More than just updated_at
        const { error: updateError } = await supabase
          .from('memory_profiles')
          .update(updateData)
          .eq('user_id', update.user_id);

        if (updateError) {
          console.error('Error updating memory profile:', updateError);
          return false;
        }

        console.log('Successfully updated memory profile with new insights');
        return true;
      } else {
        console.log('No new insights to update');
        return true;
      }

    } catch (error) {
      console.error('Error in updateMemoryProfile:', error);
      return false;
    }
  }

  // Extract insights from structured AI response and update memory
  static async processStructuredResponse(
    user_id: string, 
    structuredData: any
  ): Promise<boolean> {
    if (!structuredData || !structuredData.new_memory_inference) {
      return false;
    }

    const inference = structuredData.new_memory_inference;
    const update: MemoryUpdate = {
      user_id
    };

    // Extract new insights from the structured response
    const newInsights: string[] = [];

    // Process inner parts
    if (inference.inner_parts && inference.inner_parts.name) {
      newInsights.push(`Discovered inner part: ${inference.inner_parts.name} (${inference.inner_parts.role})`);
    }

    // Process stuck points
    if (inference.new_stuck_point) {
      update.new_stuck_points = [inference.new_stuck_point];
      newInsights.push(`Identified stuck point: ${inference.new_stuck_point}`);
    }

    // Process crisis signals
    if (inference.crisis_signal) {
      update.new_risk_factors = ['acute_crisis_signal'];
      newInsights.push('Crisis signal detected - requires immediate attention');
    }

    // Process coping tools
    if (inference.coping_tool_used) {
      update.new_coping_tools = [inference.coping_tool_used];
      newInsights.push(`Used coping tool: ${inference.coping_tool_used}`);
    }

    // Process shadow themes
    if (inference.new_shadow_theme) {
      newInsights.push(`Explored shadow theme: ${inference.new_shadow_theme}`);
    }

    // Process pattern loops
    if (inference.new_pattern_loop) {
      newInsights.push(`Identified pattern loop: ${inference.new_pattern_loop}`);
    }

    // Process mantras
    if (inference.new_mantra) {
      newInsights.push(`Created new mantra: ${inference.new_mantra}`);
    }

    // Process relationships
    if (inference.new_relationship && inference.new_relationship.name) {
      newInsights.push(`Explored relationship: ${inference.new_relationship.name} (${inference.new_relationship.role})`);
    }

    // Process growth moments
    if (inference.growth_moment) {
      update.new_growth_opportunities = [inference.growth_moment];
      newInsights.push(`Growth moment: ${inference.growth_moment}`);
    }

    // Process therapeutic themes
    if (inference.therapeutic_theme) {
      newInsights.push(`Therapeutic theme: ${inference.therapeutic_theme}`);
    }

    // Process emotional needs
    if (inference.emotional_need) {
      newInsights.push(`Emotional need identified: ${inference.emotional_need}`);
    }

    // Process next steps
    if (inference.next_step) {
      update.new_goals = [inference.next_step];
      newInsights.push(`Next step identified: ${inference.next_step}`);
    }

    // Add session insights
    if (newInsights.length > 0) {
      update.new_insights = newInsights;
      update.session_insights = `Session insights: ${newInsights.join('; ')}`;
    }

    // Update the memory profile
    return await this.updateMemoryProfile(update);
  }

  // Get user's current memory profile
  static async getMemoryProfile(user_id: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('memory_profiles')
        .select('*')
        .eq('user_id', user_id)
        .single();

      if (error) {
        console.error('Error fetching memory profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getMemoryProfile:', error);
      return null;
    }
  }
} 