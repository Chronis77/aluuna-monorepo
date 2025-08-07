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
-- Data for Name: value_compass; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.value_compass (id, user_id, core_values, anti_values, narrative, last_reflected_at) FROM stdin;
746652c1-f644-418e-80d5-ec219500d30e	7b2233b3-97d5-4250-9587-0299f5157884	{Honesty,Compassion,Balance}	{}	Friend	2025-07-30 19:59:23.381
\.


--
-- PostgreSQL database dump complete
--

