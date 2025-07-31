# AI Feedback Processing

## Overview

The feedback system now includes AI-powered processing that automatically analyzes user feedback to provide structured insights, priority levels, and categorization.

## How It Works

### 1. User Submission
When a user submits feedback through the `FeedbackForm`, the raw feedback text is captured and sent to the `FeedbackService`.

### 2. AI Processing
The `FeedbackService.processFeedbackWithAI()` method:
- Sends the raw feedback to OpenAI's GPT-4 API
- Uses a specialized prompt designed for mental health app feedback analysis
- Receives structured JSON response with analysis

### 3. Database Storage
The processed feedback is stored in the database with:
- `raw_feedback`: Original user input (unchanged)
- `ai_summary`: AI-generated professional summary
- `priority`: AI-determined priority level
- `feedback_type`: AI-categorized feedback type
- `tags`: AI-generated relevant tags
- `metadata`: Additional AI insights

## AI Analysis Output

### Priority Levels
- **critical**: App crashes, data loss, security issues, accessibility problems
- **high**: Major functionality broken, significant UX issues, core feature requests
- **medium**: Minor bugs, feature requests, UI improvements, general suggestions
- **low**: Cosmetic issues, minor suggestions, general feedback

### Feedback Types
- **bug**: Technical issues, crashes, errors
- **feature_request**: New functionality requests
- **ui_ux**: Interface, design, user experience issues
- **performance**: Speed, responsiveness, resource usage
- **content**: Therapeutic content, AI responses, guidance
- **onboarding**: Registration, setup, first-time user experience
- **general**: General feedback, suggestions, comments

### Metadata Fields
- `sentiment`: positive/negative/neutral
- `urgency`: immediate/soon/later
- `impact`: high/medium/low
- `userType`: new/returning/power
- `therapeuticRelevance`: high/medium/low

## Example

### Input (Raw Feedback)
```
"What I think would be absolutely wonderful is if you could create on registration a wizard that goes through each of the steps to collect that memory information that's going to be so important for the initial sessions. To build up the memory over time is a bit more challenging."
```

### AI Output
```json
{
  "summary": "User requests an onboarding wizard to collect memory information during registration for better initial session quality.",
  "priority": "high",
  "feedbackType": "feature_request",
  "tags": ["onboarding", "memory", "wizard", "registration"],
  "metadata": {
    "sentiment": "positive",
    "urgency": "soon",
    "impact": "high",
    "userType": "new",
    "therapeuticRelevance": "high"
  }
}
```

## Error Handling

If AI processing fails:
- Falls back to basic processing
- Stores original feedback with default values
- Logs error details for debugging
- Continues to work without AI features

## Configuration

Requires `EXPO_PUBLIC_OPENAI_API_KEY` environment variable to be set with a valid OpenAI API key.

## Benefits

1. **Automatic Categorization**: No manual sorting required
2. **Priority Assessment**: Helps identify urgent issues quickly
3. **Structured Data**: Enables better analytics and reporting
4. **Contextual Understanding**: AI considers mental health app context
5. **Scalability**: Handles large volumes of feedback efficiently 