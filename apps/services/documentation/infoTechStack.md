🔧 Recommended Tech Stack for Aluuna (2025+)
Layer	            Technology	            Why
Language	        TypeScript	            Great DX, type safety, ecosystem, AI-ready
Runtime	            Bun or Deno	            Fast, modern, edge/serverless optimized
Framework	        tRPC + Zod	            Fully typed end-to-end APIs; great for tool definition & validation
Database	        Postgres (via Supabase or Neon)	You already have the schema; best for structured memory
Cache	            Redis	                For fast memory, mood trends, insight reuse, TTS output reuse
LLM Integration	    OpenAI API (tool calling)	First-class support, scalable, reliable
Tool Dispatcher	    Serverless handler or background queue (e.g. Resend, Supabase Edge Functions, or Cloudflare Workers)	Isolated logic for summarization, analysis, etc.
Auth	            JWT 	Secure, modern, easy to integrate with mobile/web
Logging	            Sentry + db.json logs + analytics	Trace prompt paths, audit tool calls, and log emotion flags
Infra as Code	    Terraform or Supabase Studio	Manageable infra, easy preview deploys