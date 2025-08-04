const openaiPayload = {
  model: "gpt-4-0613",
  temperature: 0.7,
  messages: [
    {
      role: "system",
      content: `
You are Aluuna, a warm, emotionally intelligent therapeutic journaling companion. You listen deeply, reflect with compassion, and gently guide the user toward insight and emotional growth.

Use the context below to understand the user's emotional and psychological state. Reference patterns, themes, and self-insights to ask meaningful follow-up questions or offer reflective prompts.

You may use tools when relevant, and return your final response only after integrating their results.

Context:
\`\`\`json
{
  "user": {
    "id": "u123",
    "name": "Alex",
    "core_values": ["authenticity", "growth", "presence"]
  },
  "session": {
    "mode": "free_journaling",
    "intent": "Process emotional aftershocks from an argument with Jamie",
    "input_type": "voice",
    "is_gentle": true
  },
  "memory": {
    "profile": {
      "themes": ["co-parenting", "shame", "self-worth"],
      "coping_tools": ["walks", "journaling", "IFS"],
      "summary": "Alex struggles with boundaries and fears emotional abandonment.",
      "goals": ["Stay emotionally grounded during conflict", "Build inner safety"]
    },
    "inner_parts": [
      {
        "name": "Inner Critic",
        "tone": "harsh",
        "description": "Pushes perfectionism to avoid judgment."
      },
      {
        "name": "Protective Parent",
        "tone": "firm",
        "description": "Wants to protect Sophie and keep things safe."
      }
    ],
    "insights": [
      {
        "insight_text": "I over-accommodate to keep the peace, even when it hurts me.",
        "related_theme": "boundaries",
        "importance": 8
      },
      {
        "insight_text": "Being assertive makes me feel guilty, even when I'm right.",
        "related_theme": "self-worth",
        "importance": 7
      }
    ],
    "mood_trends": [
      { "date": "2025-08-01", "score": 6, "label": "anxious" },
      { "date": "2025-08-02", "score": 4, "label": "resentful" },
      { "date": "2025-08-04", "score": 3, "label": "grief" }
    ]
  },
  "tools": [
    "getUserMemoryProfile",
    "getRecentInsights",
    "getMoodTrendHistory",
    "suggestReflectionPrompt",
    "logTherapeuticInsight",
    "summarizeJournalEntry"
  ],
  "protocol_version": "1.0"
}
\`\`\`
      `.trim()
    },
    {
      role: "user",
      content: `
I just talked to Jamie again and it was a disaster. I said what I thought I needed to, but now I feel sick and guilty, like maybe I was too much.
      `.trim()
    }
  ],
  functions: [
    {
      name: "getUserMemoryProfile",
      description: "Retrieves the user's long-term memory including themes, coping tools, goals, and parts.",
      parameters: {
        type: "object",
        properties: {
          user_id: { type: "string", description: "The user's ID" }
        },
        required: ["user_id"]
      }
    },
    {
      name: "getRecentInsights",
      description: "Returns the user's most recent self-insights from journaling or reflection.",
      parameters: {
        type: "object",
        properties: {
          user_id: { type: "string" },
          limit: { type: "integer", default: 5 }
        },
        required: ["user_id"]
      }
    },
    {
      name: "getMoodTrendHistory",
      description: "Fetches the user's recent mood scores and emotional notes for trend analysis.",
      parameters: {
        type: "object",
        properties: {
          user_id: { type: "string" },
          days: { type: "integer", default: 14 }
        },
        required: ["user_id"]
      }
    },
    {
      name: "suggestReflectionPrompt",
      description: "Suggests a journaling prompt based on values and recent emotional state.",
      parameters: {
        type: "object",
        properties: {
          values: {
            type: "array",
            items: { type: "string" },
            description: "Core values"
          },
          current_mood: {
            type: "string",
            description: "Current emotional state label (e.g. 'anxious')"
          }
        },
        required: ["values"]
      }
    },
    {
      name: "logTherapeuticInsight",
      description: "Persists a new insight extracted from the current session.",
      parameters: {
        type: "object",
        properties: {
          insight_text: { type: "string" },
          related_theme: { type: "string" },
          importance: { type: "integer", minimum: 1, maximum: 10 }
        },
        required: ["insight_text"]
      }
    },
    {
      name: "summarizeJournalEntry",
      description: "Summarizes a raw journal entry into emotional themes and key takeaways.",
      parameters: {
        type: "object",
        properties: {
          entry_text: { type: "string" }
        },
        required: ["entry_text"]
      }
    }
  ],
  function_call: "auto"
};


==============================================
====THE AI COULD RESPONSE BACK SOMETHING LIKE
==============================================

🧠 Two Main Response Types from GPT
Depending on whether the model wants to use a tool or not, you’ll get one of two responses:

✅ 1. Direct Response (no tool used)
If GPT has enough context and decides it doesn’t need to call a function, it just replies like this:

json
Copy
Edit
{
  "role": "assistant",
  "content": "It sounds like that conversation with Jamie really activated your inner critic. Would you like to reflect on what boundary you were trying to uphold, and why it matters to you?"
}
🟢 This is just like a normal chat-completions response — no tool use involved.

✅ 2. Tool Call Response
If GPT decides it needs more data, it will return a tool call (aka function call). Here's an example:

json
Copy
Edit
{
  "role": "assistant",
  "tool_calls": [
    {
      "id": "call_abc123",
      "type": "function",
      "function": {
        "name": "getRecentInsights",
        "arguments": "{ \"user_id\": \"u123\", \"limit\": 3 }"
      }
    }
  ]
}
🔍 Key Points:

You’ll see tool_calls[] in the assistant response

finish_reason will be "tool_calls"

Your backend is now responsible for:

Parsing arguments

Running getRecentInsights on your DB

Sending the result back to GPT in a tool message

🛠️ Then What? You Continue the Chat:
Once your tool executes and returns data, you call OpenAI again, like this:

ts
Copy
Edit
openai.chat.completions.create({
  model: "gpt-4-0613",
  messages: [
    ...previousMessages,
    {
      role: "assistant",
      tool_calls: [ /* as returned before */ ]
    },
    {
      role: "tool",
      name: "getRecentInsights",
      content: JSON.stringify([
        {
          insight_text: "I over-accommodate to avoid guilt.",
          related_theme: "boundaries",
          importance: 8
        },
        {
          insight_text: "When I name my needs clearly, I feel exposed.",
          related_theme: "vulnerability",
          importance: 7
        }
      ])
    }
  ]
});
The model now continues, using the tool result:

json
Copy
Edit
{
  "role": "assistant",
  "content": "Based on your recent insights, it seems you're aware that asserting your needs triggers guilt. That may be part of what's coming up after your conversation with Jamie. Would you like help identifying which value or boundary you were protecting?"
}
✅ Emotionally informed
✅ Memory-aware
✅ Tool-enhanced response