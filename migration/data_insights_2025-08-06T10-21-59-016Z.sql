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
-- Data for Name: insights; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.insights (id, user_id, created_at, insight_text, related_theme, importance, updated_at) FROM stdin;
693aaa46-52d2-430e-abcb-0944e3b3cdb0	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 10:43:02.405	The user consistently reports feeling 'okay', indicating a possible stable emotional state.	\N	5	2025-07-27 15:52:47.501232
f4559d74-6033-4f7f-b7eb-feac0370cec3	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 10:53:39.776	User struggles with maintaining interest and sees it as a recurring issue. There may be a need to explore coping mechanisms for maintaining long-term interest and managing feelings of disillusionment.	\N	5	2025-07-27 15:52:47.501232
a2f6d386-514f-4fa9-b4d3-360f1c15713d	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 10:53:39.779	There is potential conflict between the user's desire for excitement in projects and the necessity of persevering even when the initial excitement fades.	value_conflict	6	2025-07-27 15:52:47.501232
8dd0b60c-9602-4521-b709-db94b69ef962	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 11:03:46.536	User enjoys Formula 1 and it seems to bring them joy.	\N	5	2025-07-27 15:52:47.501232
527ebf4d-2eff-4566-a9b2-56501de39285	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 11:06:01.311	User has a tendency to engage in multiple activities at once, and struggles with maintaining focus and managing frustration as a result.	\N	5	2025-07-27 15:52:47.501232
a0e226d3-e271-432e-805c-b7c2a8e6d848	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 11:07:18.354	User has a pattern of feeling overwhelmed when they're multitasking, which is increasing due to their children's growing needs.	\N	5	2025-07-27 15:52:47.501232
649923aa-4931-4603-9109-f71593df3a78	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 11:10:00.985	The user values their ability to be present and engaged, especially with their children, but feels conflict when they are not able to fully focus due to multiple responsibilities or distractions.	value_conflict	6	2025-07-27 15:52:47.501232
a7d256dc-0233-4769-98dc-bbc66e4f18af	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 11:10:00.982	User has identified a pattern of becoming overwhelmed when trying to manage multiple tasks or roles simultaneously. They have a desire to be fully present and engaged in what they're doing, especially with their children.	\N	5	2025-07-27 15:52:47.501232
44b9618e-f230-46f6-840c-836a832d0dac	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 11:12:28.794	User often finds themselves feeling overwhelmed when trying to balance watching the Formula 1, working, and paying attention to their children. User is open to trying new techniques to help manage feelings of overwhelm.	\N	5	2025-07-27 15:52:47.501232
d05e77c0-61fc-4bcd-a68d-196c65d6d92f	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 11:12:28.796	User values being present for their children and also values their work and personal interests. There seems to be a conflict when these two values overlap, causing feelings of overwhelm.	value_conflict	6	2025-07-27 15:52:47.501232
3d0b238f-db2f-4c26-8a7a-955e1fbd2a9a	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 11:25:49.367	User has shown resilience and ability to self-regulate emotions	\N	5	2025-07-27 15:52:47.501232
80ce6276-b7ef-42d8-82ac-1d5e48988d36	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 11:51:32.823	User finds joy and motivation in building and creating	\N	5	2025-07-27 15:52:47.501232
54ada350-d98c-42ba-869c-1a55860ba6d2	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 11:52:11.907	User's tendency to feel a rush of excitement about new ideas	\N	5	2025-07-27 15:52:47.501232
4948afc3-ac73-45e1-ad2f-57dbf1239b90	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 11:53:11.016	User's feelings of unworthiness and fear of failure in professional situations	\N	5	2025-07-27 15:52:47.501232
50b7ed39-15f6-4288-9f8d-f73d296240ff	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 11:53:50.622	User's pattern of excitement about projects but also self-doubt and fear of failure	\N	5	2025-07-27 15:52:47.501232
71477b00-dac8-4eab-acde-6574d656c854	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 11:54:27.332	User's pattern of enthusiasm for new projects	\N	5	2025-07-27 15:52:47.501232
a021ea7c-d1a8-495d-936d-177f7ef5c5ab	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 11:55:23.849	User's passion for their project and their concerns about presenting it to potential investors	\N	5	2025-07-27 15:52:47.501232
e5e58b69-70c0-462d-896c-397afee1cd2d	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:04:28.549	User's entrepreneurial spirit and tendency to feel overwhelmed when juggling multiple responsibilities.	\N	5	2025-07-27 15:52:47.501232
9e2cc11d-9f8c-412c-9d17-46de79b98759	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:05:39.775	User's tendency towards perfectionism and its impact on their confidence	\N	5	2025-07-27 15:52:47.501232
8465c472-031f-46cf-9be7-5dd4b4307cf9	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:11:45.586	User's aspiration to achieve financial success and make a positive impact	\N	5	2025-07-27 15:52:47.501232
75bd08d3-af2e-44af-9d06-18678e1352a2	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:12:45.854	User's ambition and resilience in the face of financial and personal challenges	\N	5	2025-07-27 15:52:47.501232
923598e3-bb7a-4796-86fa-94d507504d42	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:13:38.698	User's interest in session continuity	\N	5	2025-07-27 15:52:47.501232
1d428e11-17ea-4b64-a0bd-02acb0c1b600	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:29:31.978	User's interest in different therapeutic approaches	\N	5	2025-07-27 15:52:47.501232
ae3c40e6-696b-4177-a160-5f0b89280fdc	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:30:32.75	User's interest in trauma resolution methods	\N	5	2025-07-27 15:52:47.501232
4ace19ad-3f7e-49ff-aa48-7478e8ffde15	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:31:38.509	User's interest in mind-body connection and impact of past experiences on present situation	\N	5	2025-07-27 15:52:47.501232
cfda9a62-06ce-4c38-8753-420d95c5e2f7	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:32:26.387	User's childhood trauma and its potential impact on their current emotional state	\N	5	2025-07-27 15:52:47.501232
460a748a-d3d3-4f81-816a-edc1de4bbbf1	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:33:30.663	User has a history of trauma and is seeking ways to cope	\N	5	2025-07-27 15:52:47.501232
ed55a754-8f2d-44d0-b42b-f3f716c04d3c	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:34:04.427	User's history of trauma and interest in somatic techniques	\N	5	2025-07-27 15:52:47.501232
0ee441cd-c019-420c-a62e-25df847a4bdd	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:34:44.157	User's preference for somatic techniques	\N	5	2025-07-27 15:52:47.501232
d042dd49-e791-411b-aeae-fcc1af90478d	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:40:40.183	User responds positively to somatic coping techniques	\N	5	2025-07-27 15:52:47.501232
895f07c8-7788-48cf-886e-250d4ef09e45	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:41:59.593	User finds somatic techniques helpful in managing stress	\N	5	2025-07-27 15:52:47.501232
c4378e1e-4749-486f-a7db-1af37d1e766d	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:46:38.454	User is involved in the development and testing of the system	\N	5	2025-07-27 15:52:47.501232
740f58aa-ca16-4d52-8558-da21cac3eb02	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 13:00:40.558	User enjoys watching F1 as a form of relaxation	\N	5	2025-07-27 15:52:47.501232
e5af260f-25d3-48ab-9430-d241aa97bf97	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 13:01:17.099	User enjoys watching F1 as a relaxation activity	\N	5	2025-07-27 15:52:47.501232
33edf782-3489-40d7-aa18-2e979761c014	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 13:49:09.285	User enjoys watching Formula One	\N	5	2025-07-27 15:52:47.501232
d6bf119c-6dc1-4481-99b5-161875d6da19	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 13:49:39.882	User's ability to set and meet personal goals	\N	5	2025-07-27 15:52:47.501232
42207b44-03a3-4361-bc71-5720337eaf8e	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 13:50:19.184	User's dedication and commitment to their business, Mailblaze	\N	5	2025-07-27 15:52:47.501232
5540c68e-e721-4389-9949-9795d6117c5b	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 13:51:06.429	User's ongoing work on projects Luna and Mailblaze	\N	5	2025-07-27 15:52:47.501232
f41f3567-725c-456b-b653-0be13c20c99c	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 14:59:54.637	User's positive feedback and progress with the app	\N	5	2025-07-27 15:52:47.501232
67865a7b-19c0-4d6a-a244-9a7b71b655f0	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 15:00:28.064	User's motivation and satisfaction in their work of helping others	\N	5	2025-07-27 15:52:47.501232
5ace0455-9089-44fc-a706-80a9d2339435	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 22:00:55.762	User often feels tired after long days	\N	5	2025-07-27 22:00:56.188732
614867ab-cb35-4a62-a316-8fe27d35ad5e	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 22:06:05.952	Ongoing struggle with self-doubt	\N	5	2025-07-27 22:06:06.366433
df8627b4-35f0-4cfa-9b12-b1d36c3d8d91	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 08:35:40.862	User shows concern for others, including AI	\N	5	2025-07-28 08:35:41.033353
25e20d43-b480-4b3f-8c87-f599fd161ca1	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 08:42:47.527	User's openness to self-improvement	\N	5	2025-07-28 08:42:48.201465
010ac92d-8513-4fad-ae20-5e499400650d	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 09:13:09.807	User experiences anxiety around work scheduling	\N	5	2025-07-28 09:13:10.009442
6e78e5db-1263-47b9-b47b-27692c79fd14	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 09:14:16.471	User's struggle with balancing multiple work tasks and finding motivation	\N	5	2025-07-28 09:14:16.657326
42b01cf0-60b1-4e92-9a4a-1fe905b87bdf	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 09:14:16.474	Conflict between user's interest in Luna project and responsibilities at Mailblaze	value_conflict	6	2025-07-28 09:14:16.661747
d5fbdcb4-a00b-4aa4-a3dd-077e1fea8e70	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 09:33:35.011	User's ongoing struggle with balancing multiple work projects and maintaining motivation	\N	5	2025-07-28 09:33:35.697713
9b5f7812-7fde-4923-a6ee-46dd1974646a	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 09:33:35.013	Work fulfillment vs. work responsibilities	value_conflict	6	2025-07-28 09:33:35.699759
97883122-494d-461e-9a02-7f83b766f4f1	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 09:35:37.756	User enjoys the building aspect of work but struggles with monetization	\N	5	2025-07-28 09:35:37.961576
b121db89-4b72-4d01-a81f-1cc9349a8486	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 09:35:37.758	Conflict between creative enjoyment and financial practicality	value_conflict	6	2025-07-28 09:35:38.038037
af663765-e55a-4c1f-876e-4c1ea0eaf4f3	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 10:11:38.786	User's relationship with their son, Savas, and the emotional challenges associated	\N	5	2025-07-28 10:11:39.259803
2c2a08b3-88a2-4c6f-9f0c-406b53cfb2fd	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 10:13:52.68	User's ongoing emotional challenge related to his relationship with his son after separation	\N	5	2025-07-28 10:13:53.100708
192fad28-034d-410a-a0fa-48a1959c7b78	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 10:21:42.808	User's ongoing struggle with managing emotions related to his relationship with his son	\N	5	2025-07-28 10:21:43.189153
0a0574b8-225d-4012-be5a-084b1e54c978	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 10:21:42.811	Desire for close relationship with son vs. reality of separation	value_conflict	6	2025-07-28 10:21:43.205973
c480e9df-cd59-4550-b8dd-6fa2ca477a67	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 10:23:37.851	User's ongoing emotional challenges related to his separation and its impact on his relationship with his son	\N	5	2025-07-28 10:23:38.248461
8a6b7bcc-b987-4034-89e3-20269201cc85	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 10:23:37.853	Desire to be a present and supportive father vs. the reality of the separation	value_conflict	6	2025-07-28 10:23:38.279384
098c6c5c-ccbe-4548-af37-82b0266630e4	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 10:25:53.481	User's ongoing struggle with managing emotions related to his separation and its impact on his relationship with his son	\N	5	2025-07-28 10:25:53.915818
bf6c30f1-e685-44f2-a5c1-48682460af5c	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 10:48:27.904	User's son has difficulty with transitions	\N	5	2025-07-28 10:48:28.312655
4a796015-2f3d-4455-a738-afa43d75c579	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 10:49:19.327	User's relationship status with wife is uncertain	\N	5	2025-07-28 10:49:19.716488
eee5821c-83fe-48e3-a346-2e73a45617b8	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 10:51:19.371	User is separated and attempting to finalize divorce	\N	5	2025-07-28 10:51:19.779935
b79578da-6734-43a8-8170-ef9e8844b43c	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 10:53:17.302	User is going through a challenging divorce and struggling to find balance	\N	5	2025-07-28 10:53:17.749527
1f537fc0-ba2f-47b7-b006-aede51a13ae1	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 10:53:17.305	Balancing self-care and responsibilities	value_conflict	6	2025-07-28 10:53:17.767448
7769cb06-f7a4-43e8-937b-603181eddebc	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 10:57:57.896	User's ongoing efforts to manage stress and self-regulate	\N	5	2025-07-28 10:57:58.281754
468cb178-16c7-46ef-b480-2c0971f79ffc	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 10:57:57.899	Between self-care and fulfilling responsibilities	value_conflict	6	2025-07-28 10:57:58.331314
1ed326bc-6458-43b5-9f93-9f43b53b2ccd	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 11:02:18.113	User's ongoing struggle with bad dreams	\N	5	2025-07-28 11:02:18.517024
7643cd20-b764-4e9d-b9d7-2e25ed2499a0	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 11:03:52.368	User's ongoing struggle with divorce and its impact on his emotional state	\N	5	2025-07-28 11:03:52.758466
877c8169-0687-4955-997f-ea2ba040e9af	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 11:05:26.812	User is relying heavily on this platform for emotional support	\N	5	2025-07-28 11:05:27.211207
25c9d3db-0789-4ccd-9773-99d1d953b69f	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 11:06:13.053	User is separated and in the process of divorce, causing significant stress and affecting his dreams	\N	5	2025-07-28 11:06:13.455851
4b0e4661-920c-4e3d-897f-1d51866a18e5	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 10:25:34.36	User is tech-savvy and interested in AI performance	\N	5	2025-07-29 10:25:34.052838
01bc1c00-2422-4e58-b1c7-60efdc648f85	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 10:32:19.663	User has interest in Plum Village Online Monastery	\N	5	2025-07-29 10:32:19.367434
7c82dada-89ef-4889-98b8-4d6854c7941c	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 11:12:53.151	User's ongoing struggle with business decisions and managing team dynamics	\N	5	2025-07-29 11:12:54.006414
10d4088c-18c1-413a-986a-2f12cd3c2974	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 11:14:31.953	User's evolving professional interests and alignment with Aluuna	\N	5	2025-07-29 11:14:32.237781
04e83876-8540-4214-a314-62d78d1400af	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 11:14:31.955	Conflict between current business and personal interests	value_conflict	6	2025-07-29 11:14:32.730919
c05d32b3-e163-429c-8abd-32165427e597	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 11:16:08.592	User's growing interest in therapeutic work and creating spaces for self-help and personal growth.	\N	5	2025-07-29 11:16:08.887093
f074016e-9bd1-4131-b1bd-4fc177880762	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 11:16:08.593	Current business vs passion for helping others	value_conflict	6	2025-07-29 11:16:08.908977
3d73bf38-5d32-4a1a-9797-e897969bd7dd	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 11:17:42.976	Passion and purpose vs. existing business commitments	value_conflict	6	2025-07-29 11:17:43.281803
cf34396d-7a22-43fa-80aa-7cae5876be3f	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 11:17:42.974	User's ongoing struggle with direction in business ventures	\N	5	2025-07-29 11:17:43.298739
fee4f876-0338-4d60-bdb2-520049926e74	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 11:27:55.933	User's desire to make life work for them, not the other way around	\N	5	2025-07-29 11:27:56.308699
2539b0b3-55cf-4daf-95c9-6045999677dc	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 11:43:00.847	User often feels 'okay' rather than experiencing more positive emotions.	\N	5	2025-07-29 11:43:01.132219
fe5a24b3-c40f-4496-ab4f-9e89bc09c5fa	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 11:46:26.917	User often feels 'okay' and struggles with wanting to feel more joy and enthusiasm. They also have mixed feelings about socializing.	\N	5	2025-07-29 11:46:27.217213
b307f95b-d73c-4170-8680-d2c0bd306b07	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 11:46:26.924	Conflict between value of friendship and personal development	value_conflict	6	2025-07-29 11:46:27.241279
158e6e2f-4fdf-4ee1-afa9-8b955a69e483	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 11:47:48.761	User's struggle with being present and their desire for personal development	\N	5	2025-07-29 11:47:49.050179
d7950d9b-15bb-4ea5-b2fe-2df98be24dab	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 11:49:01.41	User's ongoing exploration of mindfulness and presence	\N	5	2025-07-29 11:49:01.683
cb5efe0d-cc93-42f9-9b2a-698d0247d425	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 11:53:34.737	User has children and their interactions can be busy but generally positive.	\N	5	2025-07-29 11:53:34.998867
95043c8c-d988-4d1f-8f0a-55a8a7b08c13	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 11:54:31.405	User struggles with balancing responsibilities and emotional availability during visits with his son.	\N	5	2025-07-29 11:54:31.688461
0ecdcc19-b349-454c-aef7-ee14f41248a5	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 11:59:36.69	User's ongoing struggle with managing responsibilities and emotional presence during visits with their son	\N	5	2025-07-29 11:59:36.959239
5f514745-4298-457b-ac5f-bc00cf0c0512	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 12:00:36.059	User shows enthusiasm for problem-solving and innovation	\N	5	2025-07-29 12:00:36.366015
4e9b377e-d479-4e8a-8f52-833623d67797	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 12:01:19.79	User's enthusiasm for vibe coding and its speed	\N	5	2025-07-29 12:01:20.082469
9b8d6278-fc37-4801-a8eb-ef941780b075	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 12:02:31.48	User's passion for vibe coding and its impact on their work	\N	5	2025-07-29 12:02:31.766391
0eaf7621-645d-4f97-81f0-2e6eae947cfd	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 12:03:44.872	User's enthusiasm for vibe coding and its impact on their work	\N	5	2025-07-29 12:03:45.175331
8ebe6f52-364b-419c-8405-734db027c635	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 12:07:41.101	User's passion for vibe coding and its positive impact on their work	\N	5	2025-07-29 12:07:41.433679
3c026929-f695-4ad0-8b5d-2ee6aa77eca1	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 12:15:03.555	User's enthusiasm for vibe coding and its impact on their work	\N	5	2025-07-29 12:15:03.916863
83c181f3-2d87-4614-8272-2f1c90c5d119	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 12:15:51.771	User finds joy in their work and wants to spread it to other areas of their life	\N	5	2025-07-29 12:15:52.112733
27f6e6ef-7962-4bf1-8a6c-a6927bb34fc2	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 12:40:16.574	User has a passion for their work (vibe coding) and is looking for ways to share that joy with others, despite others not fully understanding their work.	\N	5	2025-07-29 12:40:16.8828
579589a1-aace-4d75-8d5e-7d63229d7d20	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-30 09:35:02.792	User enjoys the company of animals	\N	5	2025-07-30 09:35:03.216917
6b54725a-f40e-453e-b14e-de99429905ec	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-30 09:39:51.06	User likes to double-check their work	\N	5	2025-07-30 09:39:51.416457
3adc4f93-1ddb-4324-86d2-49191f316b55	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-30 09:40:44.071	User has a role in developing or maintaining me, Aluuna	\N	5	2025-07-30 09:40:44.912093
1a33e19a-75a7-4d92-99a8-2c184a6c08c5	7b2233b3-97d5-4250-9587-0299f5157884	2025-07-30 20:17:11.363	User often pushes themselves to their limits.	\N	5	2025-07-30 20:17:11.696645
9f702370-59fd-4a71-9802-45f340efc4f8	7b2233b3-97d5-4250-9587-0299f5157884	2025-07-30 20:17:11.371	User values productivity but also needs rest.	value_conflict	6	2025-07-30 20:17:11.737301
aeb0feb3-0e9c-4ce3-89fd-487d59758d7c	7b2233b3-97d5-4250-9587-0299f5157884	2025-07-30 20:20:08.113	User's struggle with finding purpose and balance	\N	5	2025-07-30 20:20:08.429692
e95aade8-2553-4ef5-88fc-675bbefbd194	7b2233b3-97d5-4250-9587-0299f5157884	2025-07-30 20:20:08.115	Conflict between desire for social connection and focus on work	value_conflict	6	2025-07-30 20:20:08.430583
0813e894-b20d-4a58-aac8-9e52ad4dd53e	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-30 21:00:24.477	User often works late and struggles with fatigue.	\N	5	2025-07-30 21:00:25.20284
b55daf7a-37b1-4a5b-8c44-097936f3c05b	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-30 21:00:24.486	Conflict between work commitments and personal health.	value_conflict	6	2025-07-30 21:00:25.213964
990b33d5-1cc6-447f-9062-5489187c8fb1	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-30 21:01:20.09	Work demands vs personal well-being	value_conflict	6	2025-07-30 21:01:20.299393
8e1a476c-828f-481b-bdc5-3a6684f63859	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-30 21:01:20.088	User struggles with work-life balance and is open to strategies for improvement	\N	5	2025-07-30 21:01:20.78056
f4b20bf4-c19a-4aa3-aa68-838820a19e90	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-31 11:57:36.192	User often feels worn down and struggles with feelings of hopelessness	\N	5	2025-07-31 11:57:36.395811
b0f5a577-c498-4cb9-ac0c-62e4c8eafa29	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-31 11:59:56.99	User struggles with self-worth and achievement	\N	5	2025-07-31 11:59:57.70971
75286b33-50f3-48a0-b07e-a4a5bc6411da	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-31 12:00:57.19	User struggles with feeling of worth tied to achievement	\N	5	2025-07-31 12:00:57.361978
431630b0-50ba-4c7c-a644-c6ca32e0f43f	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-31 12:00:57.192	Conflict between desire for achievement and need for self-acceptance	value_conflict	6	2025-07-31 12:00:57.391101
17f3cea4-826f-4cc0-8335-fe7657bbcdcd	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-31 12:02:01.268	User's struggle with self-worth tied to achievement and progress	\N	5	2025-07-31 12:02:02.144116
c914593c-668b-4aaf-9ed1-ec92a07843a4	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-31 12:03:23.947	User struggles with feelings of self-worth tied to achievement and progress. They showed interest in mindfulness as a tool to help.	\N	5	2025-07-31 12:03:24.139342
ea215f3b-b862-49f1-8031-ead1ecc3a09f	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-31 12:05:09.094	User has a pattern of feeling overwhelmed and blocked when trying to practice mindfulness	\N	5	2025-07-31 12:05:09.759581
2ba141e5-ae40-4d8a-b74c-96b4531ae735	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-31 12:05:54.064	User struggles with feelings of overwhelm and has difficulty being present.	\N	5	2025-07-31 12:05:54.25155
6db78322-1ff2-4d09-9c14-aa46f55eff55	7b2233b3-97d5-4250-9587-0299f5157884	2025-07-31 14:40:45.284	User has a tendency to experience physical symptoms when anxious	\N	5	2025-07-31 14:40:46.076093
bb22f902-e29e-4f73-aeaf-54bb56c4e073	7b2233b3-97d5-4250-9587-0299f5157884	2025-07-31 14:41:33.819	User often experiences physical symptoms of anxiety	\N	5	2025-07-31 14:41:34.130326
26fb09a9-60a9-465c-8268-19c6f3b97bde	7b2233b3-97d5-4250-9587-0299f5157884	2025-07-31 15:24:45.541	User receptive to advice on self-care and balance	\N	5	2025-07-31 15:24:46.504966
70bd81c5-cf87-40e4-ae81-96ec87d6b7e5	7b2233b3-97d5-4250-9587-0299f5157884	2025-07-31 15:28:22.365	User's interest in testing AI's capabilities	\N	5	2025-07-31 15:28:22.796089
acaa1aa7-4771-4947-a01f-54ee6041260d	7b2233b3-97d5-4250-9587-0299f5157884	2025-07-31 16:02:34.407	User tends to check in on AI's functionality	\N	5	2025-07-31 16:02:34.586739
4b018738-fbc7-419d-9b88-970425795bdc	7b2233b3-97d5-4250-9587-0299f5157884	2025-07-31 16:05:39.003	User tends to check in without necessarily engaging in deeper therapeutic conversation.	\N	5	2025-07-31 16:05:39.179021
153b8c37-9c69-43f2-9026-18559d9ce15d	7b2233b3-97d5-4250-9587-0299f5157884	2025-07-31 16:11:14.004	User often feels overwhelmed by work.	\N	5	2025-07-31 16:11:14.191357
f210afa5-be2a-401d-8478-897188d6b38f	7b2233b3-97d5-4250-9587-0299f5157884	2025-07-31 17:08:58.691	User has a strong drive to seek out the dopamine rush from work, which may contribute to feelings of burnout.	\N	5	2025-07-31 17:08:59.124243
363278b4-3c74-4f25-805b-fbf98dc8f8a3	7b2233b3-97d5-4250-9587-0299f5157884	2025-07-31 17:08:59.021	User has a strong drive to seek out the dopamine rush from work, which may contribute to feelings of burnout.	\N	5	2025-07-31 17:08:59.415687
7352782f-ad41-40f4-88ce-4c0dc4bc0175	7b2233b3-97d5-4250-9587-0299f5157884	2025-07-31 17:10:55.594	User struggles with work-life balance and experiences a strong drive to seek out the dopamine rush from work.	\N	5	2025-07-31 17:10:56.036062
fe286e9e-44b9-41cb-b8b7-02ac49467a00	7b2233b3-97d5-4250-9587-0299f5157884	2025-07-31 17:10:55.905	User struggles with work-life balance and experiences a strong drive to seek out the dopamine rush from work.	\N	5	2025-07-31 17:10:56.308445
1631857b-4376-4c9f-a4c9-e59e4f6d2641	7b2233b3-97d5-4250-9587-0299f5157884	2025-07-31 17:17:16.611	User experiences a persistent cycle of working constantly, even during meals.	\N	5	2025-07-31 17:17:17.079466
ac3807f8-713b-4e82-a95e-32909509faf0	7b2233b3-97d5-4250-9587-0299f5157884	2025-07-31 17:17:16.612	Desire for productivity vs. need for rest.	value_conflict	6	2025-07-31 17:17:17.082312
acb8e4e5-3a37-49ee-8c55-d3c48892b6d2	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-31 17:20:33.528	User struggles with feelings of overwhelm and is seeking ways to manage them.	\N	5	2025-07-31 17:20:34.030019
5575a241-43fc-4974-af61-551d746de3d2	7b2233b3-97d5-4250-9587-0299f5157884	2025-08-01 08:18:14.822	User experiences excitement and potential anxiety around business presentations.	\N	5	2025-08-01 08:18:15.065201
bf807731-11ac-416f-a849-67295a0618ac	7b2233b3-97d5-4250-9587-0299f5157884	2025-08-01 09:06:53.819	User is passionate about their business and its potential impact, particularly through AI.	\N	5	2025-08-01 09:06:54.264654
d6ff1210-efed-49cb-a8bd-8f6b1a28526d	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-08-01 09:15:56.999	User's ongoing journey to manage overwhelm and stress, and their openness to mindfulness and self-regulation practices	\N	5	2025-08-01 09:15:57.385711
\.


--
-- PostgreSQL database dump complete
--

