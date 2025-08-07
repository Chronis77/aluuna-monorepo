# Prisma Schema vs Database Schema Comparison

## Critical Issues Found

### 1. session_groups table
**Database Schema:**
```sql
CREATE TABLE public.session_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  started_at timestamp without time zone DEFAULT now(),
  ended_at timestamp without time zone,
  title text,
  context_summary text,
  mood_at_start integer,
  mood_at_end integer,
  context_json json,
  created_at timestamp without time zone,  -- NO DEFAULT VALUE!
  description text,
  ...
);
```

**Prisma Schema:**
```prisma
model session_groups {
  id          String    @id @default(cuid())
  user_id     String
  user        users     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  created_at  DateTime?  -- ✅ FIXED: Now nullable to match DB
  started_at  DateTime  @default(now())
  ended_at    DateTime?
  title       String?
  context_summary String?
  mood_at_start Int?
  mood_at_end Int?
  context_json Json?
  description String?
  sessions    sessions[]
  session_continuity session_continuity[]
}
```

### 2. users table
**Database Schema:**
```sql
CREATE TABLE public.users (
  id uuid NOT NULL,
  name text,
  email text UNIQUE,
  created_at timestamp without time zone DEFAULT now(),
  onboarding_skipped boolean DEFAULT false,
  updated_at timestamp without time zone DEFAULT now(),
  ...
);
```

**Prisma Schema:**
```prisma
model users {
  id                String   @id @default(cuid())  -- ❌ ISSUE: Should be @default(uuid())
  name              String?
  email             String   @unique
  created_at        DateTime @default(now())
  onboarding_skipped Boolean @default(false)
  updated_at        DateTime @default(now())
  ...
}
```

### 3. sessions table
**Database Schema:**
```sql
CREATE TABLE public.sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  session_group_id uuid,
  created_at timestamp without time zone DEFAULT now(),
  input_type text,
  input_transcript text,
  gpt_response text,
  audio_response_url text,
  summary text,
  mood_at_time integer,
  flagged boolean DEFAULT false,
  tags ARRAY,
  ...
);
```

**Prisma Schema:**
```prisma
model sessions {
  id                String   @id @default(cuid())  -- ❌ ISSUE: Should be @default(uuid())
  user_id           String
  user              users    @relation(fields: [user_id], references: [id], onDelete: Cascade)
  session_group_id  String?
  session_group     session_groups? @relation(fields: [session_group_id], references: [id])
  created_at        DateTime @default(now())
  input_type        String?
  input_transcript  String?
  gpt_response      String?
  audio_response_url String?
  summary           String?
  mood_at_time      Int?
  flagged           Boolean @default(false)
  tags              String[]
  ...
}
```

### 4. session_continuity table
**Database Schema:**
```sql
CREATE TABLE public.session_continuity (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_group_id uuid NOT NULL,
  last_message_count integer NOT NULL DEFAULT 0,
  last_session_phase character varying NOT NULL DEFAULT 'start'::character varying,
  last_therapeutic_focus text,
  last_emotional_state character varying,
  last_timestamp timestamp with time zone NOT NULL DEFAULT now(),
  session_duration_minutes integer DEFAULT 0,
  is_resuming boolean DEFAULT false,
  continuity_context text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  ...
);
```

**Prisma Schema:**
```prisma
model session_continuity {
  id          String   @id @default(cuid())  -- ❌ ISSUE: Should be @default(uuid())
  user_id     String
  user        users    @relation(fields: [user_id], references: [id], onDelete: Cascade)
  session_group_id String
  session_group session_groups @relation(fields: [session_group_id], references: [id])
  created_at  DateTime @default(now())
  updated_at  DateTime @default(now())
  last_message_count Int @default(0)
  last_session_phase String @default("start")
  last_therapeutic_focus String?
  last_emotional_state String?
  last_timestamp DateTime @default(now())
  session_duration_minutes Int @default(0)
  is_resuming  Boolean @default(false)
  continuity_context String?
}
```

### 5. feedback table
**Database Schema:**
```sql
CREATE TABLE public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  raw_feedback text NOT NULL,
  ai_summary text,
  priority character varying CHECK (priority::text = ANY (ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying]::text[])),
  feedback_type character varying DEFAULT 'general'::character varying,
  device_info jsonb,
  app_version character varying,
  created_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'processed'::character varying, 'resolved'::character varying, 'ignored'::character varying]::text[])),
  tags ARRAY,
  metadata jsonb,
  ...
);
```

**Prisma Schema:**
```prisma
model feedback {
  id          String   @id @default(cuid())  -- ❌ ISSUE: Should be @default(uuid())
  user_id     String
  user        users    @relation(fields: [user_id], references: [id], onDelete: Cascade)
  created_at  DateTime @default(now())
  raw_feedback String
  ai_summary  String?
  priority    String?  -- ❌ ISSUE: Missing CHECK constraint
  feedback_type String @default("general")
  device_info Json?
  app_version String?
  processed_at DateTime?
  status      String @default("pending")  -- ❌ ISSUE: Missing CHECK constraint
  tags        String[]
  metadata    Json?
}
```

### 6. onboarding_progress table
**Database Schema:**
```sql
CREATE TABLE public.onboarding_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  onboarding_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  ...
);
```

**Prisma Schema:**
```prisma
model onboarding_progress {
  id          String   @id @default(cuid())  -- ❌ ISSUE: Should be @default(uuid())
  user_id     String   @unique
  user        users    @relation(fields: [user_id], references: [id], onDelete: Cascade)
  created_at  DateTime @default(now())
  updated_at  DateTime @default(now())
  onboarding_data Json @default("{}")
}
```

## Summary of Required Fixes

1. **ID Generation**: ✅ FIXED - Updated key tables to use `@default(uuid())` to match `gen_random_uuid()` in DB
2. **CHECK Constraints**: Missing in Prisma for feedback.priority and feedback.status
3. **Nullable Fields**: ✅ FIXED - session_groups.created_at is now correctly nullable
4. **Data Types**: Some timestamp fields might need timezone handling

## Recommended Actions

1. ✅ Update Prisma schema to use `@default(uuid())` for tables that use `gen_random_uuid()` - DONE
2. Add CHECK constraints where needed (optional - can be handled at application level)
3. Regenerate Prisma client after schema changes
4. Test all database operations to ensure compatibility

## Fixed Tables
- ✅ users
- ✅ sessions  
- ✅ session_groups
- ✅ session_continuity
- ✅ feedback
- ✅ onboarding_progress 