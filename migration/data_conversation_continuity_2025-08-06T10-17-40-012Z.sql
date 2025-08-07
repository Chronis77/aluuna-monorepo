--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.5 (Ubuntu 17.5-1.pgdg22.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: conversation_continuity; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.conversation_continuity (id, user_id, conversation_id, last_message_count, last_session_phase, last_therapeutic_focus, last_emotional_state, last_timestamp, session_duration_minutes, is_resuming, continuity_context, created_at, updated_at) FROM stdin;
2d8800b1-2bcc-44c2-aade-a176d7244338	f416eb32-ce7d-4074-a02c-5ce98b679320	e1d7cf63-348b-4b9d-bda8-23d0c4b1737b	8	late	exploration and insight	neutral	2025-07-29 11:47:19.828609+00	1	f	late | Focus: exploration and insight | Emotional State: neutral	2025-07-29 11:42:38.379991+00	2025-07-29 11:47:19.828609+00
543e8442-6b17-4646-9d96-c8ee754044c6	f416eb32-ce7d-4074-a02c-5ce98b679320	976c05b1-62ee-4a17-a07d-8d74a1391947	18	ending	exploration and insight	neutral	2025-07-29 12:39:59.093866+00	24	f	ending | Focus: exploration and insight | Emotional State: neutral	2025-07-29 11:59:44.646064+00	2025-07-29 12:39:59.093866+00
7a5093b7-5281-480e-80c1-7d6f4b689432	7b2233b3-97d5-4250-9587-0299f5157884	31397b8f-0f01-43e0-a057-13b6f59eaacb	16	ending	exploration and insight	neutral	2025-07-31 20:25:39.746514+00	1	f	ending | Focus: exploration and insight | Emotional State: neutral	2025-07-31 20:14:21.4555+00	2025-07-31 20:25:39.746514+00
e831f7e3-7129-42bb-99a3-37e7341aba42	7b2233b3-97d5-4250-9587-0299f5157884	262025e7-a087-4ad0-a09f-cfaa7d6ab772	0	start	rapport building	neutral	2025-07-31 21:42:41.644658+00	0	f	start | Focus: rapport building | Emotional State: neutral	2025-07-31 21:42:41.644658+00	2025-07-31 21:42:41.644658+00
85c0b499-e40e-473a-bfd6-f91f71241afa	f416eb32-ce7d-4074-a02c-5ce98b679320	0f33d680-4f35-434d-a7f3-73412fdf15ae	9	late	exploration and insight	neutral	2025-07-30 09:40:25.42066+00	1	f	late | Focus: exploration and insight | Emotional State: neutral	2025-07-30 09:33:50.790423+00	2025-07-30 09:40:25.42066+00
dcce0714-38a2-42f5-9b6a-c655339dd8f2	7b2233b3-97d5-4250-9587-0299f5157884	7a814de4-ff03-474e-8e40-fcd6a6885d3e	0	start	rapport building	neutral	2025-07-30 18:30:14.097099+00	0	f	start | Focus: rapport building | Emotional State: neutral	2025-07-30 18:30:14.097099+00	2025-07-30 18:30:14.097099+00
20b8582c-873a-48df-84e8-ebc0154dccaa	7b2233b3-97d5-4250-9587-0299f5157884	8375b94c-94b1-4289-bea3-6b31e1f79f25	7	late	exploration and insight	neutral	2025-07-30 20:19:45.355854+00	1	f	late | Focus: exploration and insight | Emotional State: neutral	2025-07-30 20:16:35.516712+00	2025-07-30 20:19:45.355854+00
796619e3-a100-4f53-8a73-02f54094500a	f416eb32-ce7d-4074-a02c-5ce98b679320	baa7acda-ae3b-47ce-a586-a44963ba4775	19	ending	exploration and insight	neutral	2025-08-01 09:15:15.512927+00	955	f	ending | Focus: exploration and insight | Emotional State: neutral	2025-07-31 11:56:27.338933+00	2025-08-01 09:15:15.512927+00
ca9436b6-865e-4c20-b4bd-5f6cf1667973	f416eb32-ce7d-4074-a02c-5ce98b679320	84e0a825-d3cc-4054-a14e-bc234579a0b5	5	mid	exploration and insight	neutral	2025-07-30 21:00:59.816596+00	1	f	mid | Focus: exploration and insight | Emotional State: neutral	2025-07-30 20:59:22.780518+00	2025-07-30 21:00:59.816596+00
ba635070-5dfb-40f4-ab7e-7182132d0b07	7b2233b3-97d5-4250-9587-0299f5157884	91c081a5-741b-4476-821b-3ccc178286d2	23	active	celebration	hopeful	2025-08-01 09:16:59.935206+00	9	f	active | Focus: celebration | Emotional State: hopeful	2025-08-01 08:17:45.129453+00	2025-08-01 09:16:59.935206+00
99b54ba4-6217-42d2-8886-230d5591f46a	7b2233b3-97d5-4250-9587-0299f5157884	05bade4c-8fd0-4695-a288-5c4458baa35e	0	start	rapport building	neutral	2025-08-01 09:53:38.132034+00	0	f	start | Focus: rapport building | Emotional State: neutral	2025-08-01 09:53:38.132034+00	2025-08-01 09:53:38.132034+00
12e27129-e7ae-465f-9120-89fa079f3a18	7b2233b3-97d5-4250-9587-0299f5157884	52d1534b-25b0-4621-b603-8b734cc8a813	40	ending	exploration and insight	neutral	2025-07-31 18:42:35.06734+00	1	f	ending | Focus: exploration and insight | Emotional State: neutral	2025-07-31 16:10:21.755995+00	2025-07-31 18:42:35.06734+00
8eee6beb-d468-4f13-8dba-ced69c193e21	7b2233b3-97d5-4250-9587-0299f5157884	90e2e55e-52c0-4954-9c66-45352e9ae4f5	5	mid	anxiety management and grounding	anxious	2025-07-31 14:41:12.741273+00	1	f	mid | Focus: anxiety management and grounding | Emotional State: anxious	2025-07-30 20:17:26.075056+00	2025-07-31 14:41:12.741273+00
342f97b9-0c81-45fd-b43f-74360aefd170	7b2233b3-97d5-4250-9587-0299f5157884	f4d22cad-5287-4da9-b06f-da144228f3f8	10	late	exploration and insight	neutral	2025-07-31 15:28:00.692805+00	4	f	late | Focus: exploration and insight | Emotional State: neutral	2025-07-31 15:03:11.712062+00	2025-07-31 15:28:00.692805+00
8e673252-74de-460b-9541-85a1e8633b42	7b2233b3-97d5-4250-9587-0299f5157884	8512635a-4636-459e-85d3-703c8756c5f7	10	late	containment	calm	2025-07-31 16:05:38.54199+00	0	f	late | Focus: containment | Emotional State: calm	2025-07-31 15:56:15.634774+00	2025-07-31 16:05:38.54199+00
bed7a781-37c6-474a-978c-108ea9784c48	7b2233b3-97d5-4250-9587-0299f5157884	f6042b61-42ad-4424-a1c3-bbbcff2a1e62	68	ending	exploration and insight	neutral	2025-07-31 20:13:04.176895+00	1	f	ending | Focus: exploration and insight | Emotional State: neutral	2025-07-31 19:01:35.204151+00	2025-07-31 20:13:04.176895+00
\.


--
-- PostgreSQL database dump complete
--

