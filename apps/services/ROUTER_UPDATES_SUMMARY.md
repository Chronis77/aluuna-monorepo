# Router Updates Summary

## Overview
This document summarizes the comprehensive router updates made to align with the new normalized database structure. All routers have been updated to work with the new `user_*` tables and provide full CRUD operations with analytics.

## Router Organization

### Core Domain Routers (Updated)
- **`auth.ts`** - Authentication and user management
- **`user.ts`** - Core user data and preferences management
- **`userProfile.ts`** - User profile summary management (renamed from `memoryProfile.ts`)
- **`memory.ts`** - Memory data management (completely rewritten for normalized structure)
- **`conversation.ts`** - Conversation and session management
- **`feedback.ts`** - Feedback and crisis flag management
- **`insights.ts`** - User insights management
- **`mantras.ts`** - User mantras management
- **`innerParts.ts`** - Inner parts work management
- **`onboarding.ts`** - Onboarding progress management

### New Specialized Data Management Routers

#### 1. **`themes.ts`** - Theme Management
**Purpose**: Manage user themes and global themes
**Key Functions**:
- `getAllThemes()` - Get all global themes
- `getUserThemes(userId)` - Get user's personal themes
- `createUserTheme()` - Create new user theme
- `updateUserTheme()` - Update existing theme
- `deleteUserTheme()` - Soft delete theme
- `getThemesByCategory()` - Filter themes by category
- `getThemeStats()` - Theme analytics

#### 2. **`goals.ts`** - Goal Management
**Purpose**: Manage user goals and progress tracking
**Key Functions**:
- `getUserGoals(userId)` - Get user's goals
- `createGoal()` - Create new goal
- `updateGoal()` - Update goal details
- `deleteGoal()` - Delete goal
- `updateGoalProgress()` - Update goal progress
- `getGoalsByCategory()` - Filter goals by category
- `getOverdueGoals()` - Get overdue goals
- `getGoalStats()` - Goal analytics

#### 3. **`copingTools.ts`** - Coping Tools Management
**Purpose**: Manage user's coping strategies and tools
**Key Functions**:
- `getUserCopingTools(userId)` - Get user's coping tools
- `createCopingTool()` - Create new coping tool
- `updateCopingTool()` - Update coping tool
- `deleteCopingTool()` - Soft delete coping tool
- `getCopingToolsByCategory()` - Filter by category
- `getHighlyEffectiveTools()` - Get high-rated tools
- `getCopingToolStats()` - Coping tools analytics
- `searchCopingTools()` - Search functionality

#### 4. **`emotionalData.ts`** - Emotional Data Management
**Purpose**: Manage emotional states, patterns, and trends
**Key Functions**:
- **Emotional States**: `getUserEmotionalStates()`, `createEmotionalState()`, `updateEmotionalState()`
- **Emotional Patterns**: `getUserEmotionalPatterns()`, `createEmotionalPattern()`
- **Mood Trends**: `getUserMoodTrends()`, `createMoodTrend()`
- **Emotional Trends**: `getUserEmotionalTrends()`, `createEmotionalTrend()`
- **Analytics**: `getEmotionalStats()` - Comprehensive emotional analytics

#### 5. **`lifestyle.ts`** - Lifestyle Data Management
**Purpose**: Manage daily habits, sleep, and substance use
**Key Functions**:
- **Daily Habits**: `getUserDailyHabits()`, `createDailyHabit()`, `updateDailyHabit()`
- **Sleep Routine**: `getUserSleepRoutine()`, `upsertSleepRoutine()`
- **Substance Use**: `getUserSubstanceUse()`, `createSubstanceUse()`, `updateSubstanceUse()`
- **Analytics**: `getLifestyleStats()` - Wellness score calculation

#### 6. **`relationships.ts`** - Relationship Data Management
**Purpose**: Manage people, relationships, and support system
**Key Functions**:
- **People**: `getUserPeople()`, `createPerson()`, `updatePerson()`, `deletePerson()`
- **Relationships**: `getUserRelationships()`, `createRelationship()`, `updateRelationship()`
- **Relationship Dynamics**: `getUserRelationshipDynamics()`, `createRelationshipDynamic()`
- **Support System**: `getUserSupportSystem()`, `createSupportSystemEntry()`, `updateSupportSystemEntry()`
- **Relationship Status**: `getUserRelationshipStatus()`, `upsertRelationshipStatus()`
- **Analytics**: `getRelationshipStats()` - Relationship health score

#### 7. **`riskAssessment.ts`** - Risk Assessment Management
**Purpose**: Manage risk factors and suicidal thoughts
**Key Functions**:
- **Risk Factors**: `getUserRiskFactors()`, `createRiskFactor()`, `updateRiskFactor()`, `deleteRiskFactor()`
- **Suicidal Thoughts**: `getUserSuicidalThoughts()`, `createSuicidalThought()`, `updateSuicidalThought()`
- **Crisis Assessment**: `getHighRiskEntries()` - High-risk monitoring
- **Analytics**: `getRiskAssessmentStats()` - Risk level calculation

#### 8. **`growth.ts`** - Growth Data Management
**Purpose**: Manage growth milestones, opportunities, and strengths
**Key Functions**:
- **Growth Milestones**: `getUserGrowthMilestones()`, `createGrowthMilestone()`, `updateGrowthMilestone()`
- **Growth Opportunities**: `getUserGrowthOpportunities()`, `createGrowthOpportunity()`, `updateGrowthOpportunity()`
- **Strengths**: `getUserStrengths()`, `createStrength()`, `updateStrength()`
- **Growth Log**: `getUserGrowthMilestonesLog()`, `createGrowthMilestoneLog()`
- **Analytics**: `getGrowthStats()` - Growth score calculation

## Key Features Across All Routers

### 1. **Consistent CRUD Operations**
- All routers provide Create, Read, Update, Delete operations
- Soft deletes where appropriate (using `is_active` flag)
- Proper error handling and validation

### 2. **Advanced Filtering**
- Filter by categories, status, date ranges
- Active/inactive filtering
- Importance/severity level filtering

### 3. **Analytics and Statistics**
- Each router includes comprehensive analytics
- Score calculations for different domains
- Trend analysis and insights

### 4. **Search Functionality**
- Text-based search where relevant
- Category-based filtering
- Date range filtering

### 5. **Data Validation**
- Zod schema validation for all inputs
- Range validation for numeric fields (1-10 scales)
- Required field validation

## Router Usage Examples

### Basic CRUD Operations
```typescript
// Create a new goal
const goal = await trpc.goals.createGoal.mutate({
  userId: "user-123",
  goalTitle: "Improve sleep quality",
  goalDescription: "Get 8 hours of sleep consistently",
  priorityLevel: 4,
  targetDate: "2024-12-31"
});

// Get user's goals
const goals = await trpc.goals.getUserGoals.query({
  userId: "user-123",
  status: "active"
});

// Update goal progress
await trpc.goals.updateGoalProgress.mutate({
  goalId: "goal-456",
  progressPercentage: 75,
  status: "active"
});
```

### Analytics Usage
```typescript
// Get comprehensive growth statistics
const growthStats = await trpc.growth.getGrowthStats.query({
  userId: "user-123",
  days: 365
});

// Get emotional data analytics
const emotionalStats = await trpc.emotionalData.getEmotionalStats.query({
  userId: "user-123",
  days: 30
});

// Get risk assessment
const riskStats = await trpc.riskAssessment.getRiskAssessmentStats.query({
  userId: "user-123",
  days: 30
});
```

### Advanced Filtering
```typescript
// Get high-risk entries for crisis monitoring
const highRisk = await trpc.riskAssessment.getHighRiskEntries.query({
  userId: "user-123",
  days: 7
});

// Get highly effective coping tools
const effectiveTools = await trpc.copingTools.getHighlyEffectiveTools.query({
  userId: "user-123",
  minRating: 8
});

// Get themes by category
const anxietyThemes = await trpc.themes.getThemesByCategory.query({
  userId: "user-123",
  category: "anxiety"
});
```

## Database Integration

### Table Coverage
All new routers are fully integrated with the normalized database structure:
- ✅ All `user_*` tables have corresponding router functions
- ✅ Proper foreign key relationships maintained
- ✅ Indexed fields for optimal performance
- ✅ Timestamp fields (`created_at`, `updated_at`) handled automatically

### Performance Optimizations
- Efficient queries using proper indexing
- Batch operations where appropriate
- Pagination support for large datasets
- Optimized analytics calculations

## Security and Access Control
- All procedures use `protectedProcedure` for authentication
- User-specific data isolation
- Input validation and sanitization
- Proper error handling without data leakage

## Migration Notes

### Breaking Changes
1. **Router Rename**: `memoryProfile` → `userProfile`
2. **New Router Structure**: Specialized routers for different data domains
3. **Updated Function Names**: All functions now use consistent naming conventions

### Backward Compatibility
- Core functionality preserved
- Existing client code can be updated incrementally
- New routers provide enhanced functionality without breaking existing features

## Next Steps
1. **Client Integration**: Update client-side code to use new router structure
2. **Testing**: Comprehensive testing of all new router functions
3. **Documentation**: Update API documentation with new endpoints
4. **Performance Monitoring**: Monitor query performance and optimize as needed

## Router Structure Summary
```
📁 Core Routers (Updated)
├── auth.ts
├── user.ts
├── userProfile.ts (renamed)
├── memory.ts (rewritten)
├── conversation.ts
├── feedback.ts
├── insights.ts
├── mantras.ts
├── innerParts.ts
└── onboarding.ts

📁 Specialized Routers (New)
├── themes.ts
├── goals.ts
├── copingTools.ts
├── emotionalData.ts
├── lifestyle.ts
├── relationships.ts
├── riskAssessment.ts
└── growth.ts
```

This comprehensive router structure provides full coverage of the normalized database schema with advanced functionality for data management, analytics, and user experience optimization. 