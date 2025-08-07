import { logger } from './logger.js';

// Function to sanitize malformed array data
export function sanitizeArrayData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = { ...data };

  // Fields that should be arrays in memory_profiles
  const arrayFields = [
    'themes', 'coping_tools', 'goals', 'preferred_therapy_styles', 
    'preferred_tone', 'pattern_loops', 'shadow_themes', 'current_practices',
    'regulation_strategies', 'dysregulating_factors', 'role_model_traits',
    'growth_milestones', 'emotional_patterns', 'relationship_dynamics',
    'growth_opportunities', 'risk_factors', 'strengths', 'mood_trends',
    'emotional_states_initial', 'support_system', 'current_stressors',
    'daily_habits', 'substance_use'
  ];

  for (const field of arrayFields) {
    if (sanitized[field]) {
      try {
        // If it's a JSON string, parse it
        if (typeof sanitized[field] === 'string' && sanitized[field].startsWith('[')) {
          const parsed = JSON.parse(sanitized[field]);
          if (Array.isArray(parsed)) {
            sanitized[field] = parsed;
            logger.info('Sanitized malformed array data', { field, originalType: 'json_string' });
          }
        }
        // If it's already an array, ensure it's valid
        else if (Array.isArray(sanitized[field])) {
          // Filter out any invalid entries
          sanitized[field] = sanitized[field].filter((item: any) => 
            item !== null && item !== undefined && typeof item === 'string'
          );
        }
        // If it's not an array, convert to empty array
        else {
          sanitized[field] = [];
          logger.warn('Converted non-array field to empty array', { field, value: sanitized[field] });
        }
      } catch (error) {
        logger.error('Error sanitizing array field', { field, error, value: sanitized[field] });
        sanitized[field] = [];
      }
    } else {
      // Ensure field exists as empty array
      sanitized[field] = [];
    }
  }

  return sanitized;
}

// Function to validate and fix memory profile data before database operations
export function sanitizeMemoryProfileData(data: any): any {
  if (!data) return data;

  // Handle the specific case of memory profiles
  if (data.stuck_points) {
    try {
      if (typeof data.stuck_points === 'string' && data.stuck_points.startsWith('[')) {
        data.stuck_points = JSON.parse(data.stuck_points);
      }
      if (!Array.isArray(data.stuck_points)) {
        data.stuck_points = [];
      }
    } catch (error) {
      logger.error('Error sanitizing stuck_points', { error, value: data.stuck_points });
      data.stuck_points = [];
    }
  }

  return sanitizeArrayData(data);
}

// Function to check if data needs sanitization
export function needsSanitization(data: any): boolean {
  if (!data || typeof data !== 'object') return false;

  const arrayFields = [
    'themes', 'coping_tools', 'goals', 'preferred_therapy_styles', 
    'preferred_tone', 'pattern_loops', 'shadow_themes', 'current_practices',
    'regulation_strategies', 'dysregulating_factors', 'role_model_traits',
    'growth_milestones', 'emotional_patterns', 'relationship_dynamics',
    'growth_opportunities', 'risk_factors', 'strengths', 'mood_trends',
    'emotional_states_initial', 'support_system', 'current_stressors',
    'daily_habits', 'substance_use', 'stuck_points'
  ];

  for (const field of arrayFields) {
    if (data[field] && typeof data[field] === 'string' && data[field].startsWith('[')) {
      return true;
    }
  }

  return false;
} 