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
-- Data for Name: emotional_trends; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.emotional_trends (id, user_id, recorded_at, mood_score, mood_label, notes, created_at) FROM stdin;
6e74fafe-14dc-43a8-9d85-b5493063e9d1	7b2233b3-97d5-4250-9587-0299f5157884	2025-07-30 19:59:23.982	5	Anxious	Initial mood from onboarding	2025-08-05 13:47:08.793757
\.


--
-- PostgreSQL database dump complete
--

