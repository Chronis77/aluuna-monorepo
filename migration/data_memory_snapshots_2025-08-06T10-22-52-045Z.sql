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
-- Data for Name: memory_snapshots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.memory_snapshots (id, user_id, created_at, summary, key_themes, generated_by) FROM stdin;
25033c0e-3b3a-4154-be99-4f16c9ceaf96	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 10:43:02.41	The user reported feeling okay today.	{stable}	gpt
83e4d337-fb0e-434b-976a-1d0ae9fab224	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 10:53:39.779	User is feeling okay but is experiencing frustration with a pattern of losing interest in projects, specifically related to 'male players'.	{stable}	gpt
c412233d-713a-46b8-9a13-702f82e7f697	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 11:03:46.541	User is feeling good and looking forward to the Formula 1 race.	{stable,"Looking forward to enjoyable events"}	gpt
c640e5a2-c19e-4f4a-ba48-1bdecffe0ed6	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 11:06:01.314	User expressed frustration about struggling to focus on multiple activities simultaneously, leading to feelings of frustration and potential overwhelm.	{stable}	gpt
3c548d6a-a959-44de-8869-f6ea78f35986	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 11:07:18.357	User is struggling with feelings of overwhelm when juggling multiple tasks and responsibilities, especially related to their children.	{anxious,"Overwhelmed multitasker"}	gpt
0a6827e7-c81d-423d-ab1d-7a4a0d2c251c	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 11:10:00.985	User is expressing feelings of overwhelm from juggling responsibilities, particularly with their children. User is trying to manage this through breathing exercises and taking some space when necessary, but sometimes struggles with frustration.	{overwhelmed,"Breathing exercises, taking some space"}	gpt
2d8773ac-0ecd-4c8d-9dca-d96d1c666683	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 11:12:28.796	User is feeling overwhelmed juggling multiple roles and responsibilities. They are seeking ways to cope with feelings of stress. User demonstrated interest in learning new coping strategies.	{overwhelmed,"Breathing exercises and seeking space/quiet time"}	gpt
3255a085-0999-43b6-b1c2-7976c84e8c27	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 11:25:49.373	User is feeling okay and is content with the current situation	{stable}	gpt
76538e06-5d8e-43ff-9423-f9096f3eac48	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 11:51:32.825	User is feeling positive and excited about a project they are working on	{growing,"Creative Self"}	gpt
38ceb864-7eb3-4efb-87d8-c879786884c2	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 11:52:11.908	User is excited about a new project and considering seeking investment	{growing,"Entrepreneurial Spirit"}	gpt
a825168b-18ba-47a8-99ee-38b29ec5a568	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 11:53:11.017	User is feeling nervous about seeking investment for their project	{anxious,"Self-doubting part"}	gpt
84fa6d9b-8e77-4072-a8bc-2613b6664e40	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 11:53:50.624	User is developing a project and is seeking investment, but is feeling nervous and questioning their worthiness	{anxious,"Reassurance and validation",Self-doubter}	gpt
2899036c-f7b3-4698-bc35-560db494b80d	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 11:54:27.334	User is seeking feedback on a project idea	{growing,"active listening","Innovative Self"}	gpt
74a53a17-fa72-43fd-8d00-d353f96736ca	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 11:55:23.85	User shared their project idea - Aluna, a therapeutic AI app with long-term memory	{stable,Innovator}	gpt
cddb07d3-6688-49c3-9480-fceca7cb207f	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:04:28.552	User is passionate about their project 'Aluna' and is seeking investment, but experiences feelings of nervousness and self-doubt.	{anxious,"Entrepreneurial Spirit"}	gpt
95310618-2788-48da-960b-47d2eeb25c83	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:05:39.776	User is working on a project named Aluuna and is feeling nervous about presenting it for investment due to perfectionism	{stable,"Perfectionist part"}	gpt
8c60401e-05d2-4162-ad90-85f619332bc1	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:11:45.586	User is feeling motivated and has ambitious goals	{growing,"Ambitious part"}	gpt
fb4bada8-5978-4dba-858a-2d7ff0e209ef	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:12:45.855	User is excited about a new venture but also experiencing anxiety about its success	{anxious,"Ambitious part"}	gpt
a9e1a67f-d009-4d6a-aa2d-8a1ab762acd5	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:13:38.699	User inquiring about continuity of sessions	{stable}	gpt
f41df601-768f-44b1-825c-fbf421e58a26	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:29:31.981	User inquiring about Gaber Matur's approach to trauma resolution	\N	gpt
53d920fb-7442-48be-a5ce-403419a2b59a	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:30:32.751	User inquired about Gabor Maté	\N	gpt
5c2ba53f-9952-4e3d-8ae4-8bcc56bb85ac	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:31:38.511	User expressed interest in exploring Dr. Gabor Maté's approach to trauma resolution	{"Exploration of therapeutic approaches"}	gpt
e9f1b0c5-b83a-4207-bddf-da5b289b3cb5	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:32:26.388	User has a history of childhood trauma with an alcoholic mother and absent father	{anxious,"Childhood Trauma"}	gpt
a4395002-548f-402a-9e53-cb0cfeb2eb39	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:33:30.665	User expressed interest in exploring coping mechanisms	{anxious,"Traumatized Child"}	gpt
a98236b8-2945-4d1b-b932-f70899da394f	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:34:04.428	User is interested in exploring somatic coping techniques	{anxious,"Somatic techniques"}	gpt
259370f7-76a6-4ba7-896b-e73d408f707a	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:34:44.158	User expressed interest in learning somatic coping techniques	{growing,"Box Breathing"}	gpt
6417d936-78e6-44f5-8a8c-bf9ad7c688a8	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:40:40.184	User tried the 'Box Breathing' technique and reported feeling calmer	{stable,"Box Breathing"}	gpt
af01cb69-3e61-4869-a91d-720c093152b3	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:41:59.597	User tried the 'Box Breathing' technique and found it calming	{stable,"Box Breathing"}	gpt
900880ba-783b-418a-b992-b9fe84b17a04	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 12:46:38.455	User is testing the functionality of the system	{stable}	gpt
5f7bd25b-09e0-40fc-8ce7-8dda8aeaed6b	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 13:00:40.561	User is considering taking a break to watch F1	{stable,"Watching F1"}	gpt
6401fd4b-fae5-42e9-84b8-b332d79a5b5d	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 13:01:17.1	User is about to watch F1 as a break	{stable,"Taking a break with F1"}	gpt
00a58433-a98a-4e04-9579-d3c56e6ad5a0	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 13:15:28.142	User testing the chat interface	\N	gpt
9ef199f6-62d1-4552-aafa-e24675e6bdbe	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 13:49:09.291	User's interest in Formula One and their progress despite distractions	{stable,"Distraction management"}	gpt
0402e135-7f4e-4531-acfe-5410c855d7d0	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 13:49:39.884	User successfully achieved a weekend objective of building something	{growing,"goal setting"}	gpt
33d15758-f866-4001-8a06-6b354053ff00	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 13:50:19.188	User has achieved a significant goal with their email marketing company, Mailblaze	{growing,"Goal setting","Business Builder"}	gpt
5da814b0-a23d-4a79-a3ec-af7a6d2aefcd	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 13:51:06.43	User expressed satisfaction with progress on a project named Luna	{growing,"Project engagement",Creator}	gpt
c8b2f4f6-29ec-42f9-82cd-42560481250b	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 14:59:54.642	User expressed satisfaction with the app's development and the assistance provided	{growing}	gpt
583f1783-bc8f-496a-b1a1-c73e30a17501	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 15:00:28.064	User expressed satisfaction with the development of the app and their role in helping people	{growing}	gpt
f5b460dc-8516-4110-bd04-3f0e3d774b0f	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 15:01:37.611	User's sense of fulfillment and purpose in helping others through their work	{growing,"Helping Part"}	gpt
17b3fa9f-8460-418e-8490-b09043a9dd8c	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 22:00:55.769	User had a long day and is feeling tired	{stable,"Rest and sleep"}	gpt
8475b549-b5f8-476b-aba5-892ef0233418	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-27 22:06:05.956	User questioning self-worth	{anxious,"Self-doubting part"}	gpt
05288b82-8674-46df-87f5-8e213c820bd3	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 08:30:47.717	User checking in and asking if they can be heard	{stable}	gpt
01ac4ca1-6959-40f9-800f-daaf4119e9cc	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 08:35:40.863	User checking in on AI's wellbeing	\N	gpt
e05e4796-4c77-483d-9455-b7db5a2d1eb3	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 08:42:47.529	User seeking guidance on what to work on	{stable}	gpt
4e5cef5a-e916-4b29-bb72-aa27fdf9339a	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 08:44:01.882	User testing the system	{stable}	gpt
33adfccf-6575-488d-b9ba-28e82fff26b1	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 09:03:54.826	User experienced an issue but it seems to have resolved	{stable}	gpt
e0873c9d-003e-4fe7-989d-0e5824c4512b	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 09:08:29.452	User checked in for a morning chat	{stable}	gpt
f9ed5768-0c59-49aa-b61d-0d6e387b3994	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 09:13:09.812	User wants to discuss work scheduling and associated anxiety	{anxious,"Work Anxiety Part"}	gpt
a40ae9f1-1862-4bb5-b2d6-cd3e86de4df9	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 09:14:16.474	User feeling overwhelmed by multiple work responsibilities and lack of motivation for Mailblaze project	{overwhelmed,"Work Overwhelm"}	gpt
47b8ca67-5768-42a1-aa35-f661ff614ea4	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 09:33:35.013	User feeling overwhelmed by multiple work responsibilities and lack of motivation for Mailblaze	{anxious,"Work Overwhelm"}	gpt
674dd1b5-11cf-4f4b-906c-f95ba121efe5	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 09:35:37.758	User feeling overwhelmed and demotivated due to uncertainty about monetizing Mailblaze	{anxious,"Creative Builder"}	gpt
658b460c-bcd6-40df-9b32-468a5fd861de	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 10:11:38.789	User expressed sadness concerning their relationship with their son, Savas	{anxious,"Parent part"}	gpt
07057d33-2bd5-41f4-a8fe-8fae904b352f	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 10:13:52.683	User feeling sad about his relationship with his son, Savas, due to separation	{anxious,"Parent part"}	gpt
3c5ebeb9-35ce-4966-8d48-bf9b57f6c01d	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 10:21:42.813	User is feeling sad and overwhelmed by his relationship with his son, Savas, due to separation and changeover challenges	{overwhelmed,"Parent part"}	gpt
b2283cdf-f2ad-4a96-b2fc-cc21945c5a66	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 10:23:37.853	User is feeling sadness and frustration related to his relationship with his son, Savas, due to a separation situation	{anxious,Journaling,"Parent part"}	gpt
2a01ac72-d5c8-454c-b254-0ebb026db8de	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 10:25:53.484	User is dealing with feelings of sadness and frustration related to his son Savas and the separation from Savas's mother	{anxious,Journaling,"Parent part"}	gpt
59fd3a5c-9c5e-426c-970f-c931de65fb8b	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 10:48:27.912	User's son is struggling with a changeover, causing the user distress	{anxious,"Parental Protector"}	gpt
67a7b7ae-3ed2-4080-be81-df32e679c663	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 10:49:19.329	User asked about separation status with wife	{anxious}	gpt
fcde2641-e216-45c9-9a9c-e0534dc54a51	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 10:51:19.374	User shared about ongoing struggles with divorce process	{anxious,Protector}	gpt
f7ceb3a2-06a6-4a2a-8133-b5900a6b966e	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 10:53:17.305	User is feeling overwhelmed by multiple responsibilities and life changes	{overwhelmed,"Meditation, walking on the beach","Overwhelmed Part"}	gpt
eb36a268-7db4-4b78-af9a-7b3d62bac851	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 10:57:57.9	User is trying to regulate their nervous system amidst personal challenges	{anxious,"Nervous system regulation",Self-regulator}	gpt
e93d7522-d081-4c1f-88f4-6143e7cbd866	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 11:02:18.118	User experiences frequent bad dreams	{anxious,"Sleep regulation",Dreamer}	gpt
e596323f-a2a0-4de6-b235-76ff8756f31d	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 11:03:52.37	User experiencing dread in dreams related to his ex-partner and children	{overwhelmed,Meditation,"Worried part"}	gpt
9cc7d921-c8d1-4a37-bd7d-339083153ac0	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 11:05:26.814	User expressed frustration about being asked to seek additional support	{overwhelmed}	gpt
86bbeb69-c0d3-4ab5-94de-9026a3252211	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-28 11:06:13.055	User expressed feelings of dread and worry about his ongoing divorce and its impact on his children	{overwhelmed,"Nervous system regulation","Worried part"}	gpt
6e8d58ce-4649-4c37-ba18-5c24e010e54f	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 10:25:34.366	User is testing the AI on Android and curious about its performance	{stable}	gpt
6405797c-ce68-442f-93fd-88a0f1ef0d52	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 10:32:19.666	User mentioned the Plum Village Online Monastery	{stable,"Plum Village Online Monastery"}	gpt
744567a0-450d-4f21-a239-698048677136	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 11:12:53.156	User is experiencing business-related stress and uncertainty about where to focus energy	{anxious,"Business Leader"}	gpt
704b4bf0-8a75-4188-8292-23502b44f065	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 11:14:31.955	User considering a break from Mailblaze due to lack of motivation and alignment	{stable,"Business Leader"}	gpt
77705931-55b1-4979-9e3b-b3513705b677	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 11:16:08.593	User is considering a shift in focus from Mailblaze to Aluuna, which aligns more with their current passion and journey.	{stable,"Entrepreneurial Self"}	gpt
b3dbc099-eaba-415f-8785-59637cbd3a2e	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 11:17:42.976	User contemplating a shift in business focus, but concerned about potential failure	{anxious,"Fearful part"}	gpt
24dfadf9-d2be-4908-ae93-46438acd1349	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 11:27:55.936	User seeking practical advice to overcome apprehension about a potential business transition	{anxious,"Practical planning and risk assessment","Fearful part"}	gpt
883ed4ae-ea5b-4f4e-9d40-dc1a8c78cb41	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 11:43:00.854	User expressed frustration about consistently feeling 'okay' rather than 'amazing' or 'joyful'.	{stable,"Contentment Seeker"}	gpt
e9579933-7569-48f3-93ac-05f583221cd3	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 11:46:26.924	User expressed mixed feelings about socializing with friends due to a sense of obligation and a desire to focus on personal development	{anxious,"Social Obligation Part"}	gpt
6c658a6e-69b9-4329-b203-a3670867d4a9	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 11:47:48.765	User is seeking ways to be more present and questioning whether they should change certain aspects of themselves	{stable,Mindfulness,"Inner Striver"}	gpt
f3a71479-749d-4d1d-972e-3db63ee5a1bc	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 11:49:01.412	User's curiosity about the effectiveness of mindfulness practices	{growing,"Mindfulness practices","Curious Part"}	gpt
9d8dab79-ce57-4812-b8fe-5bf369b5f9b9	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 11:53:34.745	User is feeling good and is about to spend time with their kids, which they find busy.	{stable,"Parent part"}	gpt
451c00b8-c309-49c4-888b-dedf135a7934	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 11:54:31.408	User experiencing anxiety and overwhelm during visits with his son, who is missing his mother.	{anxious,"Overwhelmed Parent"}	gpt
d89408b4-3ca9-4c1f-92cb-cbfdeac02fa1	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 11:59:36.695	User expressed interest in exploring strategies to manage anxiety and chaos during visits with their son	{anxious,"Parenting Part"}	gpt
2f398760-1aec-444d-8d7f-1301f1a56ca1	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 12:00:36.063	User is excited about a new system bug report feature for testing	{stable,"Innovative Self"}	gpt
0fcb4162-25c0-4e73-94c1-d173f9ad2143	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 12:01:19.794	User expressed excitement about quick development with vibe coding	{growing,"Excited Developer"}	gpt
260f382d-b703-48a2-8674-0ec18b2a6d14	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 12:02:31.482	User's excitement about the speed of development with vibe coding	{growing,Creative}	gpt
f55d155c-b97e-4603-ab9f-5fbf21f5fe42	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 12:03:44.873	User's confusion about the session ending	{stable}	gpt
bd3e9ebc-d2b5-4e1d-91d7-6055e15d5706	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 12:07:41.102	User's excitement about vibe coding and its impact on their work efficiency	{growing,"Vibe coding","Creative Enthusiast"}	gpt
056b0caf-c1b4-4a50-be13-ccc983052c27	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 12:15:03.557	User is excited about their work with vibe coding	{growing,"Vibe coding"}	gpt
5064eb0a-8bdb-4b54-9753-e5ac1e53242a	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 12:15:51.772	User wants to bring the joy they find in their work into other areas of their life	{growing,"Joyful Creator"}	gpt
2588f5e2-2604-4f98-ab1f-0aa27a74af06	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-29 12:40:16.577	User is excited about their work and wants to bring that joy into other areas of their life. They were going to spend time with their kids.	{growing}	gpt
be270770-2424-4aca-8d5b-6013331c3780	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-30 09:35:02.801	User is feeling good and has a visiting cat	{stable,Mindfulness}	gpt
d8678ca2-8f20-4535-a4b1-9a28bd21a3c7	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-30 09:39:51.061	User mentioned a seam to bums, possibly a project or task they are working on	{stable,Perfectionist}	gpt
d6e7f47e-c32b-4f91-83e2-3467ac0537fd	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-30 09:40:44.073	User is working on me, Aluuna	{stable,"Creative part"}	gpt
1b96b69d-056c-4afa-8ae5-e67424c706e5	7b2233b3-97d5-4250-9587-0299f5157884	2025-07-30 20:19:08.008	User questioning their self-worth	{anxious,"Self-doubting part"}	gpt
7f2cf399-ab69-46cd-a86c-fec86c464bc7	7b2233b3-97d5-4250-9587-0299f5157884	2025-07-30 20:20:08.116	User questioning their priorities and work-life balance	{anxious,"Work-focused part"}	gpt
be5998d2-79bd-423e-861a-688669b8f802	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-30 21:00:24.487	User is feeling down due to late nights working and feeling tired and run down.	{overwhelmed,Workaholic}	gpt
584b505f-914b-4480-b3f3-6d785536144e	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-30 21:01:20.09	User is seeking ways to manage workload and achieve life balance	{overwhelmed,"Workload Manager"}	gpt
a01ab6e1-1669-491e-9e65-97cd58bd730e	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-31 11:57:36.196	User is feeling tired, worn down, and a bit hopeless	{overwhelmed,"Tired Part"}	gpt
f3e9cc54-8153-4d52-91a7-e361d7286167	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-31 11:59:56.992	User feels stuck and believes they need to achieve something to feel worth	{anxious,Achiever}	gpt
43e6f838-0c66-4fe1-873b-3316a4b268e8	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-31 12:00:57.193	User expressed interest in exploring ways to celebrate the present moment and find joy in the 'now'	{anxious,Mindfulness,Achiever}	gpt
08dd9885-1b16-4761-9503-4b378cee4e10	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-31 12:02:01.27	User's interest in exploring mindfulness to appreciate the present moment	{growing,Mindfulness}	gpt
ad08240f-155b-480f-b687-14d7cac4d9de	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-31 12:03:23.949	User showed interest in practicing mindfulness to help with feelings of being stuck and not moving forward.	{stable,Mindfulness}	gpt
03c8e20a-e10e-4897-b7b4-5057dfed5d74	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-31 12:05:09.096	User struggles with feeling present due to overwhelming feelings	{overwhelmed,"Breathing exercise","Overwhelmed part"}	gpt
fc6b8336-c137-4f3a-ae31-7bd803ca1c9b	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-31 12:05:54.069	User expressed feeling overwhelmed even when trying to practice mindfulness.	{overwhelmed,Mindfulness,"Overwhelmed part"}	gpt
9bcf3e74-8b39-4d5c-9c1e-45aeec8d3e28	7b2233b3-97d5-4250-9587-0299f5157884	2025-07-31 14:40:45.293	User is experiencing physical symptoms of anxiety	{anxious}	gpt
5bbffb56-f230-4c13-bf54-50bb3b911913	7b2233b3-97d5-4250-9587-0299f5157884	2025-07-31 14:41:33.824	User's anxiety seems to be increasing	{anxious,"Anxious part"}	gpt
ac19cde8-0970-4716-ae7b-30c85ea96b06	7b2233b3-97d5-4250-9587-0299f5157884	2025-07-31 15:24:45.549	User appreciated the advice on managing personal limits	{stable,"Self-care and balance"}	gpt
3a2843c3-719b-49ba-affc-99d2b5c4a355	7b2233b3-97d5-4250-9587-0299f5157884	2025-07-31 15:28:22.373	User testing AI's response capabilities	\N	gpt
480fea7d-d325-4e1a-9b00-719d13bddbaf	7b2233b3-97d5-4250-9587-0299f5157884	2025-07-31 16:02:34.415	User checked in on AI's functionality, expressed no major concerns	{stable}	gpt
91188b71-352b-4991-8b1d-758e27827b3d	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-07-31 17:20:33.531	User is open to trying a new approach to handle feelings of overwhelm.	{stable,Mindfulness}	gpt
8722c440-9e65-42a8-a69d-30c47dcfd9d5	7b2233b3-97d5-4250-9587-0299f5157884	2025-07-31 16:05:39.004	User checked in to ensure AI is functioning, but did not wish to discuss anything specific at this time!!!	{stable}	gpt
64edce6b-49e1-4665-bfa7-8752504bbab5	7b2233b3-97d5-4250-9587-0299f5157884	2025-07-30 20:17:11.372	User is feeling good but also tired and at the end of their tether..	{stable,"Recognition of need for sleep.","Exhausted Self"}	gpt
f25f7884-579b-4a85-a042-e372c2a66786	f416eb32-ce7d-4074-a02c-5ce98b679320	2025-08-01 09:15:57	User is open to practices for self-regulation and managing feelings of overwhelm	{stable,"Grounding technique"}	gpt
\.


--
-- PostgreSQL database dump complete
--

