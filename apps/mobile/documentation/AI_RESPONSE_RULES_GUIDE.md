# AI Response Rules Guide

This guide explains how to modify and customize the AI's response behavior in Aluuna.

## Overview

The AI response rules are centralized in `lib/aiResponseRules.ts`. This file contains all the rules, guidelines, and context that shape how the AI responds to users.

## Key Components

### 1. System Personality
Defines the AI's core identity and approach:
- Compassionate therapeutic companion
- Memory of past conversations
- Supportive but not medical

### 2. Memory Context
Explains how the AI should use user memory:
- Important events and experiences
- Ongoing challenges and themes
- Relationships and people
- Coping tools and strategies
- Recent insights and goals

### 3. Response Guidelines
List of positive behaviors the AI should follow:
- Empathy and understanding
- Thoughtful follow-up questions
- Reference past conversations
- Acknowledge progress and growth

### 4. Forbidden Responses
Phrases the AI should NEVER say:
- "I don't have the ability to recall past sessions"
- "I don't remember our previous conversations"
- "I can't access your history"

### 5. Therapeutic Approach
Defines the therapeutic framework:
- Person-centered approach
- Internal Family Systems (IFS) elements
- Mindfulness integration
- Appropriate boundaries

### 6. Session Context Rules
How to handle session continuity:
- Acknowledge therapeutic relationship
- Reference previous themes
- Build on past insights
- Recognize patterns and progress

## How to Modify Response Rules

### Adding New Guidelines

To add new response guidelines, edit the `responseGuidelines` array in `getResponseRules()`:

```typescript
responseGuidelines: [
  "Always respond with empathy and understanding",
  "Ask thoughtful follow-up questions to help users explore their feelings",
  // Add your new guideline here
  "Your new guideline here",
  // ... existing guidelines
],
```

### Adding Forbidden Phrases

To prevent the AI from saying certain things, add to the `forbiddenResponses` array:

```typescript
forbiddenResponses: [
  "I don't have the ability to recall past sessions",
  // Add new forbidden phrases here
  "Your forbidden phrase here",
  // ... existing forbidden responses
],
```

### Modifying System Personality

To change how the AI presents itself, edit the `systemPersonality` string:

```typescript
systemPersonality: `You are Aluuna, a compassionate and empathetic AI therapeutic companion...

// Add or modify personality traits here
You have a particular focus on [specific area]...
You approach therapy with [specific approach]...
`,
```

### Adding Memory Context

To enhance how the AI uses memory, modify the `memoryContext` section:

```typescript
memoryContext: `You have access to the user's memory profile which includes:
- Important events and experiences they've shared
// Add new memory elements here
- [New memory category]
// ... existing memory context
`,
```

## Validation System

The system automatically validates AI responses against the rules:

- **Response Validation**: Checks generated responses for forbidden phrases
- **Logging**: Issues are logged to the console for debugging
- **Future Enhancement**: Could automatically regenerate responses that violate rules

## Integration Points

The response rules are used in:

1. **OpenAI Service** (`lib/openaiService.ts`)
   - `generateResponse()` method
   - `generateStructuredResponse()` method
   - Automatic validation of responses

2. **Context Service** (`lib/contextService.ts`)
   - Session context building
   - User profile integration

3. **Memory Processing** (`lib/memoryProcessingService.ts`)
   - Memory-aware responses
   - Contextual understanding

## Best Practices

### When Adding Rules

1. **Be Specific**: Vague rules can lead to inconsistent behavior
2. **Test Thoroughly**: New rules should be tested with various user inputs
3. **Maintain Balance**: Don't make rules too restrictive
4. **Consider Context**: Rules should work across different session types

### When Modifying Personality

1. **Stay Consistent**: Changes should align with the therapeutic approach
2. **Preserve Boundaries**: Maintain appropriate therapeutic boundaries
3. **Test Memory Integration**: Ensure memory references work naturally
4. **Monitor Tone**: Keep the warm, supportive tone

### When Adding Forbidden Phrases

1. **Be Comprehensive**: Include variations of the same concept
2. **Consider Context**: Some phrases might be acceptable in certain contexts
3. **Test Edge Cases**: Ensure rules don't break legitimate responses
4. **Document Changes**: Keep track of why phrases were forbidden

## Example: Adding a New Therapeutic Focus

To add a new therapeutic focus (e.g., trauma-informed care):

```typescript
// In getResponseRules()
therapeuticApproach: `person-centered with elements of Internal Family Systems (IFS), mindfulness, and trauma-informed care. Focus on:
- Active listening and validation
- Trauma-sensitive language and approach
- Helping users identify and understand their inner parts
- Encouraging self-compassion and self-awareness
- Supporting emotional processing and integration
- Building healthy coping strategies
- Maintaining appropriate therapeutic boundaries
- Recognizing and responding to trauma triggers
`,

// Add to responseGuidelines
responseGuidelines: [
  // ... existing guidelines
  "Use trauma-sensitive language and approach",
  "Recognize potential trauma triggers in conversation",
  "Provide grounding techniques when appropriate",
],
```

## Troubleshooting

### Common Issues

1. **AI Still Says Forbidden Phrases**
   - Check that the phrase is exactly matched in the forbidden list
   - Ensure the validation is being called
   - Check console logs for validation warnings

2. **Responses Don't Feel Personal**
   - Verify memory context is being passed correctly
   - Check that user profile data is available
   - Ensure session context includes relevant information

3. **Tone Feels Off**
   - Review system personality description
   - Check response guidelines for tone-related rules
   - Verify therapeutic approach alignment

### Debugging

1. **Check Console Logs**: Look for validation warnings and response generation logs
2. **Test with Simple Inputs**: Use basic messages to isolate issues
3. **Verify Context**: Ensure session context is being built correctly
4. **Review Rules**: Make sure rules aren't conflicting with each other

## Future Enhancements

Potential improvements to the response rules system:

1. **Dynamic Rule Loading**: Load rules from external configuration
2. **User-Specific Rules**: Customize rules based on user preferences
3. **Rule Analytics**: Track which rules are most/least effective
4. **Automatic Rule Generation**: Learn from user feedback
5. **Multi-Language Support**: Rules for different languages
6. **Crisis Detection**: Enhanced rules for crisis situations 