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
-- Data for Name: onboarding_progress; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.onboarding_progress (id, user_id, onboarding_data, created_at, updated_at) FROM stdin;
4c4f04e7-90e2-4733-bdf7-6783b6acb8d7	88547949-7c34-4a4e-8c51-84802e2a771b	{"step1": {"moodScore": 7, "moodTrends": ["I've felt anxious or worried"], "sleepQuality": "Good (7-9 hours, restful)", "emotionalStates": ["Stressed"], "suicidalThoughts": "Never"}}	2025-07-30 21:02:36.702095	2025-07-30 21:02:36.504
c3fa190c-e285-4eea-907b-ab0071f7a9d0	b5ca6b0b-b5b3-476b-8d5c-84db3501973a	{}	2025-07-30 21:31:10.274706	2025-07-30 21:48:06.189
a65c2f6c-9a8b-4c7e-9bd8-4f4088af56d1	f416eb32-ce7d-4074-a02c-5ce98b679320	{"step1": {"moodScore": 5, "moodTrends": ["I've felt down or depressed"], "sleepQuality": "Good (7-9 hours, restful)", "emotionalStates": ["Anxious"], "suicidalThoughts": "Never"}}	2025-08-01 11:01:28.274201	2025-08-03 10:03:28.431
\.


--
-- PostgreSQL database dump complete
--

