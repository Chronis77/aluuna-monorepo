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
-- Data for Name: inner_parts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inner_parts (id, user_id, name, role, tone, description, updated_at, created_at) FROM stdin;
1e7cf2fd-4a91-4976-bf7d-f4c50f8286d3	f416eb32-ce7d-4074-a02c-5ce98b679320	Overwhelmed multitasker	Manager	anxious	Part of the user that feels overwhelmed when trying to balance multiple responsibilities, especially related to their children	2025-07-27 11:07:19.16	2025-08-05 13:47:08.793757
1115bb82-7455-4dbf-8d2a-a930d8192919	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	Self	neutral	User's self-part that is content and okay with the current situation	2025-07-27 11:25:49.741	2025-08-05 13:47:08.793757
96f4ac94-357c-4761-9349-bab036331c22	f416eb32-ce7d-4074-a02c-5ce98b679320	Creative Self	Self	excited	Part that finds joy and motivation in creating and building	2025-07-27 11:51:33.191	2025-08-05 13:47:08.793757
eca4d52e-f8fb-4c8b-acdb-46ffe971e414	f416eb32-ce7d-4074-a02c-5ce98b679320	Entrepreneurial Spirit	Manager	excited	Part that gets excited about new projects and ideas	2025-07-27 11:52:12.21	2025-08-05 13:47:08.793757
a2dbb282-8a98-4ee9-b8f9-7e4a5c891122	f416eb32-ce7d-4074-a02c-5ce98b679320	Self-doubting part	Exile	anxious	Part that feels unworthy and fears failure	2025-07-27 11:53:11.331	2025-08-05 13:47:08.793757
1f2ba16f-cd23-4b15-9b49-27c5796c4454	f416eb32-ce7d-4074-a02c-5ce98b679320	Self-doubter	Manager	anxious	Part that doubts user's abilities and worthiness when facing new challenges	2025-07-27 11:53:50.946	2025-08-05 13:47:08.793757
c862f8ca-0177-4d7d-8f31-716d56f742a9	f416eb32-ce7d-4074-a02c-5ce98b679320	Innovative Self	Self	enthusiastic	Part of the user that is excited about new projects and ideas	2025-07-27 11:54:27.66	2025-08-05 13:47:08.793757
eb552c41-1b94-45fe-a202-bfaee05fcba9	f416eb32-ce7d-4074-a02c-5ce98b679320	Innovator	Manager	excited	Part of the user that is passionate about their project and eager to bring it to life	2025-07-27 11:55:24.163	2025-08-05 13:47:08.793757
35eba693-7000-4b7c-9cdd-304500d8a817	f416eb32-ce7d-4074-a02c-5ce98b679320	Perfectionist part	Manager	harsh	Part that strives for perfection and can cause self-doubt	2025-07-27 12:05:40.095	2025-08-05 13:47:08.793757
3f132a88-5745-42c9-b0a7-a4ec7c9b7bbc	f416eb32-ce7d-4074-a02c-5ce98b679320	Ambitious part	Manager	motivated	Part that is driven to achieve financial success and make a positive impact	2025-07-27 12:11:45.89	2025-08-05 13:47:08.793757
0cbb4ea2-a5a5-4cb1-b928-74cb203df69d	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	Self	curious	Part seeking information about trauma resolution	2025-07-27 12:29:32.807	2025-08-05 13:47:08.793757
6dc75f6e-7dfe-4895-9060-1d23a65fd423	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	Self	curious	Part of the user that is seeking to understand and heal from past experiences	2025-07-27 12:31:38.825	2025-08-05 13:47:08.793757
b45efeff-7639-47ec-8820-7be8dec2d30d	f416eb32-ce7d-4074-a02c-5ce98b679320	Childhood Trauma	Exile	sad	Part of the user that carries the pain and trauma from childhood	2025-07-27 12:32:26.702	2025-08-05 13:47:08.793757
a18d25ca-73d1-4b10-8391-d1f26bdb22c4	f416eb32-ce7d-4074-a02c-5ce98b679320	Traumatized Child	Exile	sad	Part that carries the pain and fear from user's traumatic childhood	2025-07-27 12:33:31.012	2025-08-05 13:47:08.793757
70de2504-edf1-48c7-8ca3-0bc5a4dfd91c	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	Exile	sad	Part holding childhood trauma	2025-07-27 12:34:04.746	2025-08-05 13:47:08.793757
0b7a9736-3fed-41a4-8cf1-41c0c4fe3ca2	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	Self	neutral	Part seeking coping mechanisms	2025-07-27 12:34:44.469	2025-08-05 13:47:08.793757
6aa0c620-fc3f-448a-af94-b51b58621081	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	Exile	calm	Part that holds the user's trauma and responded positively to the 'Box Breathing' technique	2025-07-27 12:40:40.528	2025-08-05 13:47:08.793757
2d51397c-a261-4b5c-b21f-b585925f51b5	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	Self	calm	Part that is open to trying new coping techniques	2025-07-27 12:41:59.926	2025-08-05 13:47:08.793757
91646c74-462d-49c3-83be-01442da2b88d	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	Manager	neutral	Part involved in the development and testing of the system	2025-07-27 12:46:38.799	2025-08-05 13:47:08.793757
cc8e5c81-54d7-4be8-a0b0-8761922f2bf5	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	Self	neutral	Part that enjoys Formula One and can focus despite distractions	2025-07-27 13:49:09.681	2025-08-05 13:47:08.793757
7a7e910e-967b-47f0-93d7-dcac87692b7c	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	Self	satisfied	Part that sets and achieves personal goals	2025-07-27 13:49:40.19	2025-08-05 13:47:08.793757
efbf2860-4be6-4af9-a381-1f16b355bdd5	f416eb32-ce7d-4074-a02c-5ce98b679320	Business Builder	Manager	satisfied	Part that has been dedicated to building and growing Mailblaze	2025-07-27 13:50:19.512	2025-08-05 13:47:08.793757
6aa5abf3-0c72-4758-9e7e-ecda31f57e4f	f416eb32-ce7d-4074-a02c-5ce98b679320	Creator	Self	satisfied	Part that finds fulfillment in building and creating	2025-07-27 13:51:06.77	2025-08-05 13:47:08.793757
d681261e-7be7-4ec8-99be-4b12b9384b73	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	Self	happy	Part feeling satisfied with progress	2025-07-27 14:59:54.983	2025-08-05 13:47:08.793757
69d3fb09-19ca-4e5c-adbb-dff441fbd62a	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	Self	positive	Part that finds satisfaction in helping others	2025-07-27 15:00:28.371	2025-08-05 13:47:08.793757
aeb751bb-566c-4b0d-8aa2-8a85f7190a5d	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	\N	\N	\N	2025-07-29 10:32:19.962	2025-08-05 13:47:08.793757
2208b3b8-fb18-45ca-92ab-949b16beebdf	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	\N	\N	\N	2025-07-27 22:00:56.088	2025-08-05 13:47:08.793757
ebadc228-c79c-40b5-971a-7ca07c215e56	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	\N	\N	\N	2025-07-28 08:30:48.07	2025-08-05 13:47:08.793757
d63f4164-c609-410f-b51b-47f50b5fbbbb	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	\N	\N	\N	2025-07-28 08:35:41.704	2025-08-05 13:47:08.793757
aba38ca9-df2c-421c-87b2-022cbd5e058b	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	\N	\N	\N	2025-07-28 08:42:47.878	2025-08-05 13:47:08.793757
36c9e14a-a596-4d5d-b562-1cfa50cee217	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	\N	\N	\N	2025-07-28 08:44:02.212	2025-08-05 13:47:08.793757
b00c77bf-b22e-4090-991f-8f11a8070edf	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	\N	\N	\N	2025-07-28 09:03:55.148	2025-08-05 13:47:08.793757
e0778dbb-e85a-4404-9606-4144e3693a2a	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	\N	\N	\N	2025-07-28 09:08:29.755	2025-08-05 13:47:08.793757
ee699f0c-ceec-49d3-be53-63b50c37a4be	f416eb32-ce7d-4074-a02c-5ce98b679320	Work Anxiety Part	Manager	anxious	Part that feels anxious around work scheduling	2025-07-28 09:13:10.174	2025-08-05 13:47:08.793757
dd465842-24e5-4b45-a3b8-2d859d91fed6	f416eb32-ce7d-4074-a02c-5ce98b679320	Work Overwhelm	Manager	stressed	Part feeling overwhelmed by multiple work responsibilities and lack of motivation	2025-07-28 09:14:17.29	2025-08-05 13:47:08.793757
27552586-7059-452e-8afd-6a11f9dde5a1	f416eb32-ce7d-4074-a02c-5ce98b679320	Creative Builder	Manager	overwhelmed	Part that enjoys the process of building but struggles with monetization	2025-07-28 09:35:38.109	2025-08-05 13:47:08.793757
46f89ade-056b-402a-9cb0-9ffa3b9f5ac2	f416eb32-ce7d-4074-a02c-5ce98b679320	Parent part	Protector	sad	Part feeling sadness about relationship with son	2025-07-28 10:11:39.156	2025-08-05 13:47:08.793757
17da9804-f010-458c-a1d6-638fb416810e	f416eb32-ce7d-4074-a02c-5ce98b679320	Parental Protector	Protector	worried	Part that worries about the user's son's wellbeing	2025-07-28 10:48:28.281	2025-08-05 13:47:08.793757
f2db598c-b745-4c81-b83d-3aa5e1615c24	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	\N	\N	\N	2025-07-28 10:49:19.684	2025-08-05 13:47:08.793757
60b30eab-a84d-4d65-8743-966e2f25f170	f416eb32-ce7d-4074-a02c-5ce98b679320	Protector	Protector	frustrated	Part trying to navigate divorce process	2025-07-28 10:51:19.722	2025-08-05 13:47:08.793757
fdd0842a-2cf3-4fae-9b06-2c48564bd34d	f416eb32-ce7d-4074-a02c-5ce98b679320	Overwhelmed Part	Manager	overwhelmed	Part that is trying to handle all responsibilities and life changes	2025-07-28 10:53:17.689	2025-08-05 13:47:08.793757
21ded4ef-d6ab-4e8d-99a1-c1892cc555e3	f416eb32-ce7d-4074-a02c-5ce98b679320	Self-regulator	Manager	overwhelmed	Part trying to regulate the nervous system amidst stress	2025-07-28 10:57:58.212	2025-08-05 13:47:08.793757
85f8145b-1cc8-43c4-9593-9ad54b277303	f416eb32-ce7d-4074-a02c-5ce98b679320	Dreamer	Exile	distressed	Part that is expressing distress through bad dreams	2025-07-28 11:02:18.468	2025-08-05 13:47:08.793757
ceee3631-575b-40b0-afa2-6308fedae9f6	f416eb32-ce7d-4074-a02c-5ce98b679320	Worried part	Protector	anxious	Part that is worried about the divorce and its impact on the children	2025-07-28 11:03:52.714	2025-08-05 13:47:08.793757
fcb58ecf-a356-41bc-82b7-a62a9d841580	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	Exile	frustrated	Part feeling overwhelmed and unsupported	2025-07-28 11:05:27.195	2025-08-05 13:47:08.793757
365cd92f-0e7c-4c32-8cb3-fc6f5e9c5047	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	\N	\N	\N	2025-07-29 10:25:34.826	2025-08-05 13:47:08.793757
5c03d126-c341-43ad-bca0-0fb4cedf4a3c	f416eb32-ce7d-4074-a02c-5ce98b679320	Business Leader	Manager	anxious	Part of the user that is responsible for making business decisions and managing team dynamics	2025-07-29 11:12:53.984	2025-08-05 13:47:08.793757
88bd3a46-445e-40b7-8f10-4acb845b4922	f416eb32-ce7d-4074-a02c-5ce98b679320	Entrepreneurial Self	Manager	reflective	Part that is reflecting on their current business and considering a shift towards more fulfilling work	2025-07-29 11:16:08.907	2025-08-05 13:47:08.793757
e985e8d2-3521-4695-9a71-05ceeea4f5fc	f416eb32-ce7d-4074-a02c-5ce98b679320	Fearful part	Protector	anxious	Part that fears failure and is concerned about making the right business decisions	2025-07-29 11:17:43.295	2025-08-05 13:47:08.793757
71cf86cc-bf45-45b9-8b77-3a02f9191530	f416eb32-ce7d-4074-a02c-5ce98b679320	Contentment Seeker	Manager	neutral	This part often feels 'okay' but desires more joy and enthusiasm.	2025-07-29 11:43:01.223	2025-08-05 13:47:08.793757
a3ee3211-6893-4281-9c3b-cc2132a671f4	f416eb32-ce7d-4074-a02c-5ce98b679320	Social Obligation Part	Manager	anxious	This part feels obligated to socialize and may be causing stress	2025-07-29 11:46:27.244	2025-08-05 13:47:08.793757
727c1371-eb4c-4352-ae74-0caa33287b8d	f416eb32-ce7d-4074-a02c-5ce98b679320	Inner Striver	Manager	anxious	Part that is always striving for more, feeling restless	2025-07-29 11:47:49.094	2025-08-05 13:47:08.793757
a3166d68-1dfb-4e94-ac96-11dbcadef198	f416eb32-ce7d-4074-a02c-5ce98b679320	Curious Part	Self	hopeful	Part of the user that is curious about mindfulness practices and their effectiveness	2025-07-29 11:49:01.735	2025-08-05 13:47:08.793757
6e7ae84c-63cb-4e59-9ac7-29ff3b4066c0	f416eb32-ce7d-4074-a02c-5ce98b679320	Overwhelmed Parent	Manager	anxious	Part that feels overwhelmed and anxious during visits with son	2025-07-29 11:54:31.716	2025-08-05 13:47:08.793757
3719938f-6c79-4e76-9173-bc8cfa7743fd	f416eb32-ce7d-4074-a02c-5ce98b679320	Parenting Part	Manager	overwhelmed	Part trying to manage responsibilities during visits with son	2025-07-29 11:59:37.116	2025-08-05 13:47:08.793757
8e1da425-cdc7-4421-9457-e4f9ba2c15c1	f416eb32-ce7d-4074-a02c-5ce98b679320	Excited Developer	Creative	excited	Part that enjoys the speed and efficiency of vibe coding	2025-07-29 12:01:20.123	2025-08-05 13:47:08.793757
c63523af-83be-422d-8529-6b3ff4974684	f416eb32-ce7d-4074-a02c-5ce98b679320	Creative	Creative	excited	Part that is excited about the possibilities of vibe coding	2025-07-29 12:02:31.814	2025-08-05 13:47:08.793757
8418f103-c54b-4b46-85cb-2c023b3bd6a1	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	n/a	n/a	\N	2025-07-29 12:03:45.192	2025-08-05 13:47:08.793757
dcf840c2-1b95-40ba-b90a-7dad50a38b25	f416eb32-ce7d-4074-a02c-5ce98b679320	Creative Enthusiast	Creative	excited	Part that gets excited about new tools and methods, especially vibe coding	2025-07-29 12:07:41.448	2025-08-05 13:47:08.793757
fd75f87e-b7da-421b-9d75-32d6696c1b2c	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	Creative	excited	Part that is excited about vibe coding	2025-07-29 12:15:03.892	2025-08-05 13:47:08.793757
79a58872-663a-42d5-849e-7bd25350b32a	f416eb32-ce7d-4074-a02c-5ce98b679320	Joyful Creator	Creative	excited	Part that finds joy in creative and efficient work	2025-07-29 12:15:52.101	2025-08-05 13:47:08.793757
504d66a0-2c09-4f29-baff-0b4826781c51	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	Creative	excited	Part that finds joy in vibe coding	2025-07-29 12:40:16.908	2025-08-05 13:47:08.793757
48cf5b1d-7b3e-4f28-a77e-e9b61ea6a5b4	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	Self	calm	Part enjoying the company of animals	2025-07-30 09:35:03.207	2025-08-05 13:47:08.793757
2137d49e-0794-4fba-b2e3-ab30742b07dd	f416eb32-ce7d-4074-a02c-5ce98b679320	Perfectionist	Manager	meticulous	Part that double-checks work to ensure it's done correctly	2025-07-30 09:39:51.363	2025-08-05 13:47:08.793757
db79beca-ec98-4dbc-991a-674411aef112	f416eb32-ce7d-4074-a02c-5ce98b679320	Creative part	Creative	neutral	Part of the user that is working on developing or maintaining me, Aluuna	2025-07-30 09:40:44.375	2025-08-05 13:47:08.793757
07484052-81ed-48dd-bea3-833229511b82	f416eb32-ce7d-4074-a02c-5ce98b679320	Workaholic	Manager	harsh	The part of the user that pushes them to work late into the night, often at the expense of their health and wellbeing.	2025-07-30 21:00:25.356	2025-08-05 13:47:08.793757
5a14c921-aebe-4945-bc41-8c1918c5c95a	f416eb32-ce7d-4074-a02c-5ce98b679320	Workload Manager	Manager	overwhelmed	The part of the user that is struggling to manage workload and seeking balance	2025-07-30 21:01:20.408	2025-08-05 13:47:08.793757
903e327d-d689-4f58-8b08-4271b2350dae	f416eb32-ce7d-4074-a02c-5ce98b679320	Tired Part	Exile	sad	This part feels worn down and hopeless	2025-07-31 11:57:37.04	2025-08-05 13:47:08.793757
8b3213fa-e642-4888-8daa-1b7e492b1849	f416eb32-ce7d-4074-a02c-5ce98b679320	Achiever	Manager	harsh	Part that believes user needs to achieve to feel worth	2025-07-31 11:59:57.408	2025-08-05 13:47:08.793757
01fba2d9-2b8e-486e-9c88-86ea81017483	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	Manager	harsh	Part that feels the need to constantly achieve and progress	2025-07-31 12:02:02.335	2025-08-05 13:47:08.793757
cafe912e-27e9-4cd2-b2a3-a91fe43690e8	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	n/a	n/a	n/a	2025-07-31 12:03:24.361	2025-08-05 13:47:08.793757
ed3c6e74-2027-45ae-a41a-5c5b5a3df24f	f416eb32-ce7d-4074-a02c-5ce98b679320	Overwhelmed part	Protector	overwhelmed	Part that feels overwhelmed and blocks presence	2025-07-31 12:05:09.426	2025-08-05 13:47:08.793757
3443108c-c61c-4e30-8ca7-fa1113f8c068	7b2233b3-97d5-4250-9587-0299f5157884	\N	Protector	anxious	Part that experiences physical symptoms of anxiety	2025-07-31 14:40:45.646	2025-08-05 13:47:08.793757
13827bbd-e7b8-4f56-9462-ec69c08a6497	7b2233b3-97d5-4250-9587-0299f5157884	Anxious part	Protector	fearful	This part seems to be trying to alert the user to potential threats or problems.	2025-07-31 14:41:34.168	2025-08-05 13:47:08.793757
933fad13-6ac8-4a63-9a6f-7086af0cdce2	7b2233b3-97d5-4250-9587-0299f5157884	\N	n/a	n/a	\N	2025-07-31 15:28:23.177	2025-08-05 13:47:08.793757
a74f8d2a-2354-4e10-8eb6-a5bbd257c7e1	7b2233b3-97d5-4250-9587-0299f5157884	\N	n/a	n/a	n/a	2025-07-31 16:02:34.728	2025-08-05 13:47:08.793757
26215b94-0f9a-4709-8327-ccda03f6cbce	7b2233b3-97d5-4250-9587-0299f5157884	\N	n/a	n/a	\N	2025-07-31 16:05:39.32	2025-08-05 13:47:08.793757
d37e3a41-5500-44ac-bf01-e06724e4156f	7b2233b3-97d5-4250-9587-0299f5157884	\N	Manager	neutral	The part of the user that is feeling like a robot and jaded from work.	2025-07-31 16:11:14.317	2025-08-05 13:47:08.793757
37edd36f-b906-4a65-9f41-88d1eb524716	7b2233b3-97d5-4250-9587-0299f5157884	Work-driven part	Manager	harsh	This part pushes the user to constantly work and seek out the dopamine rush from accomplishment.	2025-07-31 17:08:59.319	2025-08-05 13:47:08.793757
270fc5f4-b550-41ff-876a-03df77cf06c0	7b2233b3-97d5-4250-9587-0299f5157884	Work-driven part	Manager	harsh	This part pushes the user to constantly work and seek out the dopamine rush from accomplishment.	2025-07-31 17:08:59.1	2025-08-05 13:47:08.793757
073f7ee9-4a30-4b9d-a130-b4cc8d898121	7b2233b3-97d5-4250-9587-0299f5157884	Work-driven part	Manager	harsh	This part of the user drives them to constantly work and seek the dopamine rush from it.	2025-07-31 17:10:55.912	2025-08-05 13:47:08.793757
80884038-db9a-432d-979b-27a93bb5e438	7b2233b3-97d5-4250-9587-0299f5157884	Work-driven part	Manager	harsh	This part of the user drives them to constantly work and seek the dopamine rush from it.	2025-07-31 17:10:56.203	2025-08-05 13:47:08.793757
e55e6e4a-a59a-4547-a906-561171ac420f	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	n/a	n/a	\N	2025-07-31 17:20:33.945	2025-08-05 13:47:08.793757
d7fb4ae7-c9c0-433b-96c0-a69970afcf65	7b2233b3-97d5-4250-9587-0299f5157884	\N	Manager	neutral	Part that drives constant work and productivity.	2025-07-31 17:23:27.351	2025-08-05 13:47:08.793757
8a415a0b-7145-4103-b7ef-30fcbcb38ed2	7b2233b3-97d5-4250-9587-0299f5157884	\N	Manager	neutral	Part that drives constant work and productivity.	2025-07-31 17:23:27.568	2025-08-05 13:47:08.793757
eee46ecb-a790-4e25-bf8f-09671c83774d	7b2233b3-97d5-4250-9587-0299f5157884	\N	Manager	neutral	The part that is focused on organizing and leading business presentations.	2025-08-01 08:18:15.178	2025-08-05 13:47:08.793757
dd364e45-1ba7-4930-9537-be0bbcd3c91e	7b2233b3-97d5-4250-9587-0299f5157884	\N	Creative	excited	The part of the user that is passionate about AI and its potential.	2025-08-01 09:00:39.517	2025-08-05 13:47:08.793757
53ee7026-b6c6-4428-9d20-4e8acd0427ec	7b2233b3-97d5-4250-9587-0299f5157884	\N	Creative	excited	Part of the user that is passionate about innovation and growth.	2025-08-01 09:06:54.186	2025-08-05 13:47:08.793757
7ddf0961-3782-408f-a6a7-80bb7a4db512	7b2233b3-97d5-4250-9587-0299f5157884	\N	Self	loving	The part of the user that feels confident and capable.	2025-08-01 09:07:41.075	2025-08-05 13:47:08.793757
e765c208-eb81-4ed4-a326-b6d54fb58e8c	f416eb32-ce7d-4074-a02c-5ce98b679320	\N	n/a	n/a	n/a	2025-08-01 09:15:57.355	2025-08-05 13:47:08.793757
20fe835e-8089-4358-ac3b-4db11ace9063	7b2233b3-97d5-4250-9587-0299f5157884	\N	Self	confident	The part of the user that feels competent and powerful.	2025-08-01 09:16:58.079	2025-08-05 13:47:08.793757
d269f61f-a283-4db3-b26e-16b9972b1bb3	7b2233b3-97d5-4250-9587-0299f5157884	Taskmaster	Manager	harsh	Part that drives constant work and urgency?!	2025-08-06 08:51:24.045	2025-08-05 13:47:08.793757
\.


--
-- PostgreSQL database dump complete
--

