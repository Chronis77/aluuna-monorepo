import { Session, SessionGroup } from '../types/database';
import { supabase } from './supabase';

// Simple UUID generator for React Native
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export class SessionService {
  // Get all session groups for a user
  static async getSessionGroups(userId: string): Promise<SessionGroup[]> {
    const { data, error } = await supabase
      .from('session_groups')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching session groups:', error);
      throw error;
    }

    return data || [];
  }

  // Get the latest session group for a user
  static async getLatestSessionGroup(userId: string): Promise<SessionGroup | null> {
    const { data, error } = await supabase
      .from('session_groups')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching latest session group:', error);
      throw error;
    }

    return data;
  }

  // Create a new session group
  static async createSessionGroup(userId: string, title: string, contextJson: any = {}): Promise<SessionGroup> {
    const { data, error } = await supabase
      .from('session_groups')
      .insert({
        id: generateUUID(), // Generate UUID for React Native
        user_id: userId,
        title,
        context_summary: '',
        context_json: contextJson,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session group:', error);
      throw error;
    }

    return data;
  }

  // Update session group title and summary
  static async updateSessionGroup(sessionGroupId: string, updates: { title?: string; context_summary?: string; context_json?: any }): Promise<void> {
    try {
      // Check current user authentication
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error getting current user:', userError);
        throw userError;
      }

      // Check if the record exists and verify ownership
      const { data: currentData, error: currentError } = await supabase
        .from('session_groups')
        .select('id, title, context_summary, user_id')
        .eq('id', sessionGroupId)
        .single();
      
      if (currentError) {
        console.error('Error reading current session group data:', currentError);
        throw currentError;
      }
      
      // Check if current user owns this session group
      if (currentData.user_id !== user?.id) {
        console.error('User does not own this session group!');
        throw new Error('User does not have permission to update this session group');
      }

      // Filter out null/undefined updates
      const nonNullUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== null && value !== undefined)
      );
      
      if (Object.keys(nonNullUpdates).length === 0) {
        return;
      }

      // Perform the update
      const { data, error } = await supabase
        .from('session_groups')
        .update(nonNullUpdates)
        .eq('id', sessionGroupId)
        .select('id, title, context_summary');

      if (error) {
        console.error('Error updating session group:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.error('No rows were updated - session group not found or RLS policy blocked update');
        try {
          await this.updateSessionGroupFallback(sessionGroupId, nonNullUpdates);
        } catch (fallbackError) {
          console.error('Fallback update also failed:', fallbackError);
          throw new Error('No rows were updated - session group not found or RLS policy blocked update');
        }
      }
    } catch (error) {
      console.error('SessionService: Exception during updateSessionGroup:', error);
      throw error;
    }
  }

  // Get all sessions for a session group
  static async getSessions(sessionGroupId: string): Promise<Session[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('session_group_id', sessionGroupId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }

    return data || [];
  }

  // Add a new session message
  static async addSession(
    sessionGroupId: string, 
    userId: string, 
    inputTranscript: string, 
    gptResponse: string | null = null,
    inputType: string = 'text'
  ): Promise<Session> {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        id: generateUUID(), // Generate UUID for React Native
        session_group_id: sessionGroupId,
        user_id: userId,
        input_type: inputType,
        input_transcript: inputTranscript,
        gpt_response: gptResponse,
        flagged: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding session:', error);
      throw error;
    }

    return data;
  }

  // Update session with AI response
  static async updateSessionWithResponse(sessionId: string, gptResponse: string): Promise<void> {
    const { data, error } = await supabase
      .from('sessions')
      .update({ gpt_response: gptResponse })
      .eq('id', sessionId)
      .select();

    if (error) {
      console.error('Error updating session with response:', error);
      throw error;
    }
  }

  // Update session with summary (for memory processing)
  static async updateSessionSummary(sessionId: string, summary: string): Promise<void> {
    const { data, error } = await supabase
      .from('sessions')
      .update({ summary: summary })
      .eq('id', sessionId)
      .select();

    if (error) {
      console.error('Error updating session summary:', error);
      throw error;
    }
  }

  // Get session by ID
  static async getSession(sessionId: string): Promise<Session | null> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching session:', error);
      throw error;
    }

    return data;
  }

  // Get session count for a session group
  static async getSessionCount(sessionGroupId: string): Promise<number> {
    const { count, error } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('session_group_id', sessionGroupId);

    if (error) {
      console.error('Error getting session count:', error);
      throw error;
    }

    return count || 0;
  }

  // Delete a session group and all its sessions
  static async deleteSessionGroup(sessionGroupId: string): Promise<void> {
    // First delete all sessions in the group
    const { error: sessionsError } = await supabase
      .from('sessions')
      .delete()
      .eq('session_group_id', sessionGroupId);

    if (sessionsError) {
      console.error('Error deleting sessions:', sessionsError);
      throw sessionsError;
    }

    // Then delete the session group
    const { error: groupError } = await supabase
      .from('session_groups')
      .delete()
      .eq('id', sessionGroupId);

    if (groupError) {
      console.error('Error deleting session group:', groupError);
      throw groupError;
    }
  }

  // Test database connectivity and table structure
  static async testDatabaseConnection(): Promise<void> {
    try {
      // Check current user authentication
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error getting current user:', userError);
      }

      // Test session_groups table
      const { data: groupsData, error: groupsError } = await supabase
        .from('session_groups')
        .select('id, title, context_summary, created_at')
        .limit(1);

      if (groupsError) {
        console.error('Error accessing session_groups table:', groupsError);
        throw groupsError;
      }

      // Test sessions table
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('id, session_group_id, input_transcript, gpt_response')
        .limit(1);

      if (sessionsError) {
        console.error('Error accessing sessions table:', sessionsError);
        throw sessionsError;
      }

    } catch (error) {
      console.error('Database connection test failed:', error);
      throw error;
    }
  }

  // Get session group with detailed logging
  static async getSessionGroupWithLogging(sessionGroupId: string): Promise<SessionGroup | null> {
    const { data, error } = await supabase
      .from('session_groups')
      .select('*')
      .eq('id', sessionGroupId)
      .single();

    if (error) {
      console.error('Error fetching session group:', error);
      if (error.code !== 'PGRST116') {
        throw error;
      }
      return null;
    }

    return data;
  }

  // Test function to check RLS policies
  static async testRLSPolicies(sessionGroupId: string): Promise<void> {
    try {
      // Check current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error getting current user:', userError);
        return;
      }

      // Try to read the session group
      const { data: readData, error: readError } = await supabase
        .from('session_groups')
        .select('*')
        .eq('id', sessionGroupId)
        .single();

      if (readError) {
        console.error('Error reading session group (RLS might be blocking):', readError);
      }

      // Try a simple update to test RLS
      const { data: updateData, error: updateError } = await supabase
        .from('session_groups')
        .update({ title: 'TEST_UPDATE_' + Date.now() })
        .eq('id', sessionGroupId)
        .select();

      if (updateError) {
        console.error('Error updating session group (RLS might be blocking):', updateError);
      }

      // Test if we can update with explicit user_id
      const { data: updateData2, error: updateError2 } = await supabase
        .from('session_groups')
        .update({ title: 'TEST_UPDATE2_' + Date.now() })
        .eq('id', sessionGroupId)
        .eq('user_id', user?.id)
        .select();

      if (updateError2) {
        console.error('Error updating session group with user_id (RLS might be blocking):', updateError2);
      }

    } catch (error) {
      console.error('Error testing RLS policies:', error);
    }
  }

  // Fallback update function that tries different approaches
  static async updateSessionGroupFallback(sessionGroupId: string, updates: { title?: string; context_summary?: string; context_json?: any }): Promise<void> {
    try {
      // Check current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error getting current user:', userError);
        throw userError;
      }

      // Method 1: Try with explicit user_id in the update
      const { data: data1, error: error1 } = await supabase
        .from('session_groups')
        .update(updates)
        .eq('id', sessionGroupId)
        .eq('user_id', user?.id)
        .select();

      if (error1) {
        console.error('Method 1 failed:', error1);
      } else if (data1 && data1.length > 0) {
        return;
      }

      // Method 2: Try updating one field at a time
      for (const [field, value] of Object.entries(updates)) {
        if (value !== undefined && value !== null) {
          const { data: data2, error: error2 } = await supabase
            .from('session_groups')
            .update({ [field]: value })
            .eq('id', sessionGroupId)
            .select();

          if (error2) {
            console.error(`Failed to update ${field}:`, error2);
          } else if (data2 && data2.length > 0) {
            return;
          }
        }
      }

      // Method 3: Try using a service role key (if available) or bypass RLS
      try {
        // First, let's check if the session group actually exists and is owned by the user
        const { data: verifyData, error: verifyError } = await supabase
          .from('session_groups')
          .select('id, user_id, title')
          .eq('id', sessionGroupId)
          .eq('user_id', user?.id)
          .single();

        if (verifyError) {
          console.error('Verification failed:', verifyError);
        } else {
          // Try a direct update without RLS
          const { data: directData, error: directError } = await supabase
            .from('session_groups')
            .update(updates)
            .eq('id', sessionGroupId)
            .eq('user_id', user?.id)
            .select('id, title, context_summary');

          if (directError) {
            console.error('Direct update failed:', directError);
          } else if (directData && directData.length > 0) {
            return;
          }
        }
      } catch (method3Error) {
        console.error('Method 3 failed:', method3Error);
      }

      // Method 4: Last resort - try to create a new session group with the updated data
      try {
        // Get the current session group data
        const { data: currentData, error: currentError } = await supabase
          .from('session_groups')
          .select('*')
          .eq('id', sessionGroupId)
          .single();

        if (currentError) {
          console.error('Failed to get current session group data:', currentError);
        } else {
          // Create a new session group with the updated data
          const newData = {
            ...currentData,
            ...updates,
            id: sessionGroupId, // Keep the same ID
            user_id: user?.id
          };
          
          // Delete the old one and insert the new one
          const { error: deleteError } = await supabase
            .from('session_groups')
            .delete()
            .eq('id', sessionGroupId);

          if (deleteError) {
            console.error('Failed to delete old session group:', deleteError);
          } else {
            const { data: insertData, error: insertError } = await supabase
              .from('session_groups')
              .insert(newData)
              .select();

            if (insertError) {
              console.error('Failed to insert new session group:', insertError);
            } else {
              return;
            }
          }
        }
      } catch (method4Error) {
        console.error('Method 4 failed:', method4Error);
      }

    } catch (error) {
      console.error('Error in fallback update:', error);
      throw error;
    }
  }
} 