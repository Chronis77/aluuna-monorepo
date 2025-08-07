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
-- Data for Name: mantras; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mantras (id, user_id, text, source, created_at, is_favorite, tags, is_pinned) FROM stdin;
df6109b6-38db-4540-b264-a6bcf8e6152a	f416eb32-ce7d-4074-a02c-5ce98b679320	I bring my thoughts to life with passion and efficiency	ai_generated	2025-07-29 12:02:31.816	f	\N	f
47bcf03c-8ab4-4eab-8778-915204ddb053	f416eb32-ce7d-4074-a02c-5ce98b679320	My creativity and passion drive my efficiency	ai_generated	2025-07-29 12:07:41.461	f	\N	f
a153297a-71ab-4204-a25a-fd39a2e54462	f416eb32-ce7d-4074-a02c-5ce98b679320	My excitement fuels my creativity and efficiency	ai_generated	2025-07-29 12:15:03.892	f	\N	f
314b2471-610a-4b39-a601-1123b3911d2b	f416eb32-ce7d-4074-a02c-5ce98b679320	I can bring the joy I find in my work into all areas of my life	ai_generated	2025-07-29 12:15:52.101	f	\N	f
73874208-1b79-48a9-9ab5-73ad5aa08bbe	f416eb32-ce7d-4074-a02c-5ce98b679320	I can spread my joy and passion to others, regardless of whether they understand my work	ai_generated	2025-07-29 12:40:16.94	f	\N	f
a2bda31a-b759-411b-b9a4-1783fe433222	f416eb32-ce7d-4074-a02c-5ce98b679320	I find joy in the simple moments of life	ai_generated	2025-07-30 09:35:03.62	f	\N	f
46be5fe1-2528-4618-aea4-4a8f93c4e640	7b2233b3-97d5-4250-9587-0299f5157884	I am enough, and it's okay to rest.	ai_generated	2025-07-30 20:17:11.691	f	\N	f
e5d01bee-280b-4625-bd1d-641b4c669835	7b2233b3-97d5-4250-9587-0299f5157884	I am enough just as I am	ai_generated	2025-07-30 20:19:08.351	f	\N	f
fb10581c-6fb4-48df-a6ba-8bca0a22353d	7b2233b3-97d5-4250-9587-0299f5157884	I am more than my work. I deserve balance and joy in my life.	ai_generated	2025-07-30 20:20:08.419	f	\N	f
1e1a6eb4-e4c2-478d-a664-047c13bdae50	f416eb32-ce7d-4074-a02c-5ce98b679320	I am more than my work, and my health is important.	ai_generated	2025-07-30 21:00:25.306	f	\N	f
e00f6a17-dcc0-4c67-8a1a-2b51223f4781	f416eb32-ce7d-4074-a02c-5ce98b679320	I am capable of managing my workload and achieving balance in my life	ai_generated	2025-07-30 21:01:20.408	f	\N	f
6a833c77-a76a-47f5-ba76-56ce34c2d640	f416eb32-ce7d-4074-a02c-5ce98b679320	I am capable and I can find hope	ai_generated	2025-07-31 11:57:36.609	f	\N	f
1877bb07-e742-4ccf-81b9-b4123446e07f	f416eb32-ce7d-4074-a02c-5ce98b679320	I am worthy just as I am	ai_generated	2025-07-31 11:59:57.84	f	\N	f
3d0b929f-5094-4a45-9782-e4cfb57681fe	f416eb32-ce7d-4074-a02c-5ce98b679320	I am present in the moment	ai_generated	2025-07-31 12:03:24.36	f	\N	f
9a2caf24-1e3d-4535-9bc8-d5e41aa06697	f416eb32-ce7d-4074-a02c-5ce98b679320	I can be present with my feelings, even when they are overwhelming	ai_generated	2025-07-31 12:05:09.417	f	\N	f
c94b7114-b811-4840-ae4f-dbdc707954dc	f416eb32-ce7d-4074-a02c-5ce98b679320	I notice I'm feeling overwhelmed right now, and that's okay.	ai_generated	2025-07-31 12:05:54.472	f	\N	f
177ca802-9315-4460-91b0-97283da9db36	7b2233b3-97d5-4250-9587-0299f5157884	I am safe, I can breathe deeply and release my anxiety	ai_generated	2025-07-31 14:40:46.098	f	\N	f
48ce5df5-994a-4eb8-b769-561e1b3a0b52	f416eb32-ce7d-4074-a02c-5ce98b679320	I am enough!	user_created	2025-07-27 16:47:01.258	f	\N	t
f00387cf-5b60-4a4f-a052-42c6e1399360	f416eb32-ce7d-4074-a02c-5ce98b679320	i am a wonderful father	user_created	2025-07-27 17:02:46.007	f	\N	t
12fd2917-520c-41d9-9e3f-0d3765fedf4d	f416eb32-ce7d-4074-a02c-5ce98b679320	I honor my need for rest and rejuvenation	ai_generated	2025-07-27 22:00:56.571	f	\N	f
d580c3c7-2d62-4fd6-b787-4f5ccf988786	f416eb32-ce7d-4074-a02c-5ce98b679320	I am inherently valuable and enough just as I am	ai_generated	2025-07-27 22:06:06.302	f	\N	f
7e792493-7e3f-4c2e-9b1b-852302611d12	f416eb32-ce7d-4074-a02c-5ce98b679320	I am open to growth and self-improvement	ai_generated	2025-07-28 08:42:47.879	f	\N	f
9c1059f3-9d24-4b09-9b94-80bd9758ae2c	f416eb32-ce7d-4074-a02c-5ce98b679320	I can handle my work schedule with calm and confidence	ai_generated	2025-07-28 09:13:10.66	f	\N	f
01284ef9-3653-403d-b8fb-413b77f3da17	f416eb32-ce7d-4074-a02c-5ce98b679320	I can prioritize my tasks and find balance in my work	ai_generated	2025-07-28 09:14:16.821	f	\N	f
81ffd52a-3b49-42b2-9e45-ccf69c65cd47	f416eb32-ce7d-4074-a02c-5ce98b679320	I can balance my responsibilities and honor my needs	ai_generated	2025-07-28 09:33:35.836	f	\N	f
18d79736-4f8d-4e64-a95e-6efe80ef9c59	f416eb32-ce7d-4074-a02c-5ce98b679320	I have the creativity and resourcefulness to find a way to monetize my work	ai_generated	2025-07-28 09:35:38.16	f	\N	f
38eea769-1736-481e-ae4e-f705b715df0f	f416eb32-ce7d-4074-a02c-5ce98b679320	I am a caring and patient parent, doing the best I can	ai_generated	2025-07-28 10:11:39.157	f	\N	f
925c9501-ad4e-491c-be58-ebc41c57dbe4	f416eb32-ce7d-4074-a02c-5ce98b679320	I am a loving and caring father, even in times of change and challenge	ai_generated	2025-07-28 10:13:53.015	f	\N	f
93ece560-4b06-46d0-ba0e-1b0447df9fb2	f416eb32-ce7d-4074-a02c-5ce98b679320	It's okay to feel my feelings and express them in safe ways	ai_generated	2025-07-28 10:21:43.169	f	\N	f
76a80301-e660-4689-bd3a-0c97d04caefc	f416eb32-ce7d-4074-a02c-5ce98b679320	It's okay to feel my feelings. I'm doing my best in a difficult situation.	ai_generated	2025-07-28 10:23:38.246	f	\N	f
52956480-e7f3-446a-8a20-dbf47db8929e	f416eb32-ce7d-4074-a02c-5ce98b679320	It's okay to feel my feelings and let others feel theirs	ai_generated	2025-07-28 10:25:53.837	f	\N	f
7a8ff1cf-3abb-4a58-b8b8-a432d58f55b4	f416eb32-ce7d-4074-a02c-5ce98b679320	I can support my son through change with love and patience	ai_generated	2025-07-28 10:48:28.265	f	\N	f
38f698e2-08ab-4561-a08c-faa5ef8dbe7d	f416eb32-ce7d-4074-a02c-5ce98b679320	I have the strength and patience to navigate this challenging process	ai_generated	2025-07-28 10:51:19.723	f	\N	f
e98912b8-9b3c-420d-8e02-35c723c3a9aa	f416eb32-ce7d-4074-a02c-5ce98b679320	I am allowed to take time for myself	ai_generated	2025-07-28 10:53:17.655	f	\N	f
09dce6f5-35ec-4641-a246-be803d94cdf4	f416eb32-ce7d-4074-a02c-5ce98b679320	I have the strength and resilience to navigate through my challenges	ai_generated	2025-07-28 10:57:58.246	f	\N	f
302150a7-d462-47e8-9a43-869015b450c6	f416eb32-ce7d-4074-a02c-5ce98b679320	I am safe and at peace, even in my dreams	ai_generated	2025-07-28 11:02:18.466	f	\N	f
6a7d9b84-1bfb-4f38-8764-48f4c312a524	f416eb32-ce7d-4074-a02c-5ce98b679320	I am capable of navigating through these challenges	ai_generated	2025-07-28 11:05:27.196	f	\N	f
edf568d5-0702-4f0a-91d1-6b64cc512c27	f416eb32-ce7d-4074-a02c-5ce98b679320	I am navigating this challenging time with strength and resilience	ai_generated	2025-07-28 11:06:13.378	f	\N	f
d9dc58c8-a134-4cb8-8831-eeae2019edd5	f416eb32-ce7d-4074-a02c-5ce98b679320	I have the wisdom and resilience to navigate these business challenges	ai_generated	2025-07-29 11:12:54.017	f	\N	f
b87e149d-d9f7-4448-9334-002922beb49b	f416eb32-ce7d-4074-a02c-5ce98b679320	I trust my intuition in aligning my work with my passion	ai_generated	2025-07-29 11:14:32.299	f	\N	f
20293d6c-56a6-42f7-9886-41f6562d5d05	f416eb32-ce7d-4074-a02c-5ce98b679320	I am guided by my passion and purpose	ai_generated	2025-07-29 11:16:08.938	f	\N	f
54bc3d3f-af98-4492-91d1-e13906c489f1	f416eb32-ce7d-4074-a02c-5ce98b679320	I trust in my ability to make the right decisions for my path	ai_generated	2025-07-29 11:17:43.31	f	\N	f
65d3e9fb-a636-40ff-b457-1af760153188	f416eb32-ce7d-4074-a02c-5ce98b679320	I am capable of making life work for me	ai_generated	2025-07-29 11:27:56.327	f	\N	f
a63241d3-d596-42bd-8f99-716d8867bd22	f416eb32-ce7d-4074-a02c-5ce98b679320	I am open to experiencing joy and enthusiasm in my life.	ai_generated	2025-07-29 11:43:01.207	f	\N	f
144d4c20-2480-4950-839e-fda5bbde0f7e	f416eb32-ce7d-4074-a02c-5ce98b679320	I can balance my social life and personal development	ai_generated	2025-07-29 11:46:27.295	f	\N	f
1cd54b4c-2d93-4ade-aec2-24d05c95ca72	f416eb32-ce7d-4074-a02c-5ce98b679320	I am enough as I am in this moment	ai_generated	2025-07-29 11:47:49.092	f	\N	f
b6adc79a-5c57-475b-8444-aada8743c621	f416eb32-ce7d-4074-a02c-5ce98b679320	I am open to exploring new practices for my well-being	ai_generated	2025-07-29 11:49:01.749	f	\N	f
db9c1f2e-243f-482a-bb9d-93e33f39d4c5	f416eb32-ce7d-4074-a02c-5ce98b679320	I can manage my responsibilities and be present for my son	ai_generated	2025-07-29 11:54:31.751	f	\N	f
7d600139-8f63-4c5e-a6f2-26a1e983c787	f416eb32-ce7d-4074-a02c-5ce98b679320	I can create balance and calm in my interactions with my son	ai_generated	2025-07-29 11:59:37.13	f	\N	f
c0bf0fd2-4929-493e-b9bd-33efe6bdc7fb	f416eb32-ce7d-4074-a02c-5ce98b679320	I embrace new ideas and solutions with enthusiasm	ai_generated	2025-07-29 12:00:36.424	f	\N	f
fc4f0b6e-2862-4cb9-ad5c-65f191304e26	f416eb32-ce7d-4074-a02c-5ce98b679320	I thrive in the fast-paced world of vibe coding	ai_generated	2025-07-29 12:01:20.122	f	\N	f
7d054748-9f7d-4e87-9619-a3834d69da5a	f416eb32-ce7d-4074-a02c-5ce98b679320	I'm feeling overwhelmed right now, and that's okay. I'm here, and I'm safe.	ai_generated	2025-07-31 17:20:33.931	f	\N	f
24e8bc9a-16ee-4598-95c6-ec40780ca6f3	7b2233b3-97d5-4250-9587-0299f5157884	I am competent, powerful, and worth it.	ai_generated	2025-08-01 09:07:41.073	f	\N	f
11f6caa1-33a2-4c44-ac40-3b2e9fa058bd	7b2233b3-97d5-4250-9587-0299f5157884	I am safe, I am calm, I can handle this!	ai_generated	2025-07-31 14:41:34.166	f	\N	f
\.


--
-- PostgreSQL database dump complete
--

