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
-- Data for Name: relationships; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.relationships (id, user_id, name, role, notes, is_active) FROM stdin;
57591b69-c61e-4510-b5c7-69d4739c8515	f416eb32-ce7d-4074-a02c-5ce98b679320	Finley	Daughter	She is 9 years old	t
dede63db-3d6f-45aa-a234-38ce08c71fb9	f416eb32-ce7d-4074-a02c-5ce98b679320	Mailblaze	Work	Project that is currently causing stress and lack of motivation	t
966542d9-6017-4264-8a0b-755c7e8b374e	f416eb32-ce7d-4074-a02c-5ce98b679320	Savas	Child	User expressed sadness concerning their relationship with Savas	t
7f975ae8-3bcb-40ad-95c9-6261637ac187	f416eb32-ce7d-4074-a02c-5ce98b679320	son	Child	Struggles with transitions	t
d8601257-5521-41a7-b04a-70c69899eaee	f416eb32-ce7d-4074-a02c-5ce98b679320	Wife	Partner	Uncertainty about current relationship status	t
b07636b0-f3ad-4e87-8799-518830a1f63a	f416eb32-ce7d-4074-a02c-5ce98b679320	Tracy	Ex-partner	User is trying to get divorced from Tracy, the process is challenging	t
6e9e6269-3453-43d2-be6e-024f47545557	f416eb32-ce7d-4074-a02c-5ce98b679320	Operations Manager	Colleague	User's relationship with their operations manager seems to involve emotional support during business challenges	t
5297e43f-3a44-4dcd-b4d5-f486e31e9696	f416eb32-ce7d-4074-a02c-5ce98b679320	Lang	Friend	Seeing Lang brings joy but also a sense of obligation	t
1e0088b4-f333-49ee-b217-910b0b619de6	f416eb32-ce7d-4074-a02c-5ce98b679320	Children	Child	Interactions can be busy but generally positive	t
c8273e0a-b284-4f5d-a65a-21e2b7fcf189	f416eb32-ce7d-4074-a02c-5ce98b679320	Son	Child	Son is missing his mother, which adds to the user's stress during visits	t
2a046725-1f78-4b90-a066-d8daaab3fef4	f416eb32-ce7d-4074-a02c-5ce98b679320	Kids	Child	User wants to share their joy and passion with their kids	t
fc1e8b48-9587-413d-aade-830e157b6694	f416eb32-ce7d-4074-a02c-5ce98b679320	Aluuna	Other	User is working on developing or maintaining Aluuna	t
\.


--
-- PostgreSQL database dump complete
--

