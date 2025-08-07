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
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, created_at, onboarding_skipped, updated_at) FROM stdin;
b88b5471-bdeb-480e-85f2-317e9059eebe	Spiro	spiromalamoglou+test@gmail.com	2025-07-30 10:43:34.583	f	2025-07-30 12:25:24.476619
af09e26e-76ba-47ed-ae70-167717dee22a	Spiro	spiromalamoglou+test2@gmail.com	2025-07-30 12:03:29.651	f	2025-07-30 12:25:24.476619
f416eb32-ce7d-4074-a02c-5ce98b679320	Spiro	spiro@malamoglou.com	2025-07-26 13:06:32.357	t	2025-07-30 12:25:24.476619
7b2233b3-97d5-4250-9587-0299f5157884	Spiro	spiromalamoglou+test3@gmail.com	2025-07-30 12:12:45.632	t	2025-07-30 12:25:24.476619
88547949-7c34-4a4e-8c51-84802e2a771b	Spiro	spiromalamoglou+test4@gmail.com	2025-07-30 21:02:20.339	t	2025-07-30 21:02:20.556108
b5ca6b0b-b5b3-476b-8d5c-84db3501973a	Apple Tester	apple+review@aluuna.ai	2025-07-30 21:31:05.02	f	2025-07-30 21:31:05.860254
\.


--
-- PostgreSQL database dump complete
--

