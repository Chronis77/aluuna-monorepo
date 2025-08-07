import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { config } from './config.js';

// Import the router type from the server
export type AppRouter = {
  login: {
    input: {
      email: string;
      password: string;
    };
    output: {
      success: boolean;
      user: {
        id: string;
        email: string;
        name: string;
      };
      token: string;
    };
  };
  register: {
    input: {
      email: string;
      password: string;
      name?: string;
    };
    output: {
      success: boolean;
      user: {
        id: string;
        email: string;
        name: string;
      };
      token: string;
    };
  };
  respond: {
    input: {
      user_input: string;
      mode?: 'free_journaling' | 'daily_check_in' | 'crisis_support' | 'insight_generation';
      mood_score?: number;
      session_context?: Record<string, any>;
    };
    output: {
      gpt_response: string;
      insights?: string[];
      tts_url?: string;
      metadata?: Record<string, any>;
    };
  };
  getMemoryProfile: {
    input: { userId: string };
    output: {
      success: boolean;
      memoryProfile: any;
      innerParts: any[];
      insights: any[];
      emotionalTrends: any[];
    };
  };
  health: {
    input: void;
    output: {
      status: string;
      timestamp: string;
      version: string;
    };
  };
};

const getBaseUrl = () => {
  return config.server.url;
};

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      headers: {
        'x-api-key': config.server.apiKey,
      },
    }),
  ],
}); 