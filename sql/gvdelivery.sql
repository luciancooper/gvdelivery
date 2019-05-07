--
-- PostgreSQL database dump
--

-- Dumped from database version 11.2
-- Dumped by pg_dump version 11.2

-- Started on 2019-05-06 22:40:30 EDT

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 593 (class 1247 OID 24579)
-- Name: cuisine; Type: TYPE; Schema: public; Owner: lucian
--

CREATE TYPE public.cuisine AS ENUM (
    'American',
    'Cajun',
    'Caribbean',
    'Chinese',
    'French',
    'German',
    'Greek',
    'Indian',
    'Italian',
    'Japanese',
    'Korean',
    'Lebanese',
    'Mediterranean',
    'Mexican',
    'Moroccan',
    'Soul',
    'Spanish',
    'Thai',
    'Turkish',
    'Vietnamese',
    'Seafood',
    'Vegetarian'
);


ALTER TYPE public.cuisine OWNER TO postgres;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- TOC entry 200 (class 1259 OID 24720)
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    restaurant_id integer NOT NULL,
    delivery_address jsonb NOT NULL,
    price money NOT NULL,
    prepaid boolean NOT NULL,
    time_placed timestamp with time zone NOT NULL,
    time_ready timestamp with time zone NOT NULL,
    time_expected timestamp with time zone NOT NULL,
    time_delivered timestamp with time zone
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- TOC entry 199 (class 1259 OID 24718)
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.orders_id_seq OWNER TO postgres;

--
-- TOC entry 3193 (class 0 OID 0)
-- Dependencies: 199
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- TOC entry 198 (class 1259 OID 24658)
-- Name: restaurants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.restaurants (
    client_id integer NOT NULL,
    name character varying(30) NOT NULL,
    cuisine public.cuisine NOT NULL,
    address jsonb NOT NULL
);


ALTER TABLE public.restaurants OWNER TO postgres;

--
-- TOC entry 197 (class 1259 OID 24647)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(30) NOT NULL,
    password text NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 196 (class 1259 OID 24645)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 3194 (class 0 OID 0)
-- Dependencies: 196
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3054 (class 2604 OID 24723)
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- TOC entry 3053 (class 2604 OID 24650)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 3064 (class 2606 OID 24728)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 3062 (class 2606 OID 24732)
-- Name: restaurants restaurants_client_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT restaurants_client_id_key UNIQUE (client_id);


--
-- TOC entry 3056 (class 2606 OID 24730)
-- Name: users users_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_key UNIQUE (id);


--
-- TOC entry 3058 (class 2606 OID 24655)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3060 (class 2606 OID 24657)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 3066 (class 2606 OID 24733)
-- Name: orders orders_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(client_id);


--
-- TOC entry 3065 (class 2606 OID 24664)
-- Name: restaurants restaurants_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT restaurants_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id);


-- Completed on 2019-05-06 22:40:30 EDT

--
-- PostgreSQL database dump complete
--

