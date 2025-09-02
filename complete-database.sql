--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (84ade85)
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pickup_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.pickup_status AS ENUM (
    'pending',
    'completed'
);


ALTER TYPE public.pickup_status OWNER TO neondb_owner;

--
-- Name: tool_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.tool_status AS ENUM (
    'checked_out',
    'returned',
    'damaged',
    'missing'
);


ALTER TYPE public.tool_status OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: buildings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.buildings (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    location character varying(100),
    description text,
    contact_person character varying(100),
    contact_email character varying(100),
    contact_phone character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    active boolean DEFAULT true,
    address text
);


ALTER TABLE public.buildings OWNER TO neondb_owner;

--
-- Name: buildings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.buildings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.buildings_id_seq OWNER TO neondb_owner;

--
-- Name: buildings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.buildings_id_seq OWNED BY public.buildings.id;


--
-- Name: cost_centers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.cost_centers (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cost_centers OWNER TO neondb_owner;

--
-- Name: cost_centers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.cost_centers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cost_centers_id_seq OWNER TO neondb_owner;

--
-- Name: cost_centers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.cost_centers_id_seq OWNED BY public.cost_centers.id;


--
-- Name: delivery_request_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.delivery_request_items (
    id integer NOT NULL,
    request_id integer,
    item_name character varying(255) NOT NULL,
    quantity integer NOT NULL,
    part_id character varying(255),
    fulfilled_quantity integer DEFAULT 0
);


ALTER TABLE public.delivery_request_items OWNER TO neondb_owner;

--
-- Name: delivery_request_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.delivery_request_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.delivery_request_items_id_seq OWNER TO neondb_owner;

--
-- Name: delivery_request_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.delivery_request_items_id_seq OWNED BY public.delivery_request_items.id;


--
-- Name: delivery_requests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.delivery_requests (
    id integer NOT NULL,
    requester_name character varying(255) NOT NULL,
    room_number character varying(50) NOT NULL,
    building_id integer,
    cost_center_id integer,
    notes text,
    status character varying(50) DEFAULT 'pending'::character varying,
    request_date timestamp without time zone DEFAULT now(),
    fulfilled_date timestamp without time zone,
    fulfilled_by integer
);


ALTER TABLE public.delivery_requests OWNER TO neondb_owner;

--
-- Name: delivery_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.delivery_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.delivery_requests_id_seq OWNER TO neondb_owner;

--
-- Name: delivery_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.delivery_requests_id_seq OWNED BY public.delivery_requests.id;


--
-- Name: manual_parts_review; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.manual_parts_review (
    id integer NOT NULL,
    scanned_barcode character varying(100) NOT NULL,
    description text NOT NULL,
    quantity integer NOT NULL,
    technician_used character varying(100) NOT NULL,
    date_scanned timestamp without time zone NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    approved_at timestamp without time zone,
    approved_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.manual_parts_review OWNER TO neondb_owner;

--
-- Name: manual_parts_review_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.manual_parts_review_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.manual_parts_review_id_seq OWNER TO neondb_owner;

--
-- Name: manual_parts_review_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.manual_parts_review_id_seq OWNED BY public.manual_parts_review.id;


--
-- Name: notification_settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notification_settings (
    id integer NOT NULL,
    work_orders_new boolean DEFAULT true,
    work_orders_status boolean DEFAULT true,
    work_orders_comments boolean DEFAULT true,
    inventory_low_stock boolean DEFAULT true,
    inventory_issuance boolean DEFAULT true,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notification_settings OWNER TO neondb_owner;

--
-- Name: notification_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notification_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_settings_id_seq OWNER TO neondb_owner;

--
-- Name: notification_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notification_settings_id_seq OWNED BY public.notification_settings.id;


--
-- Name: part_barcodes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.part_barcodes (
    id integer NOT NULL,
    part_id integer NOT NULL,
    barcode text NOT NULL,
    supplier text,
    is_primary boolean DEFAULT false NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.part_barcodes OWNER TO neondb_owner;

--
-- Name: part_barcodes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.part_barcodes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.part_barcodes_id_seq OWNER TO neondb_owner;

--
-- Name: part_barcodes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.part_barcodes_id_seq OWNED BY public.part_barcodes.id;


--
-- Name: parts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.parts (
    id integer NOT NULL,
    part_id character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    quantity integer DEFAULT 0 NOT NULL,
    reorder_level integer,
    unit_cost numeric(10,2),
    category character varying(50),
    location character varying(100),
    supplier character varying(100),
    last_restock_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    location_id integer,
    shelf_id integer
);


ALTER TABLE public.parts OWNER TO neondb_owner;

--
-- Name: parts_delivery; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.parts_delivery (
    id integer NOT NULL,
    part_id integer NOT NULL,
    quantity integer NOT NULL,
    staff_member_id integer NOT NULL,
    cost_center_id integer,
    delivered_at timestamp without time zone DEFAULT now() NOT NULL,
    delivered_by_id integer,
    notes text,
    project_code text,
    building_id integer,
    unit_cost text,
    signature text,
    status text DEFAULT 'pending'::text NOT NULL,
    confirmed_at timestamp without time zone
);


ALTER TABLE public.parts_delivery OWNER TO neondb_owner;

--
-- Name: parts_delivery_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.parts_delivery_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.parts_delivery_id_seq OWNER TO neondb_owner;

--
-- Name: parts_delivery_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.parts_delivery_id_seq OWNED BY public.parts_delivery.id;


--
-- Name: parts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.parts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.parts_id_seq OWNER TO neondb_owner;

--
-- Name: parts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.parts_id_seq OWNED BY public.parts.id;


--
-- Name: parts_issuance; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.parts_issuance (
    id integer NOT NULL,
    part_id integer NOT NULL,
    quantity integer NOT NULL,
    issued_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    issued_to character varying(100),
    issued_by integer,
    reason character varying(50) NOT NULL,
    project_code character varying(50),
    notes text,
    department text,
    building_id integer,
    cost_center character varying(50)
);


ALTER TABLE public.parts_issuance OWNER TO neondb_owner;

--
-- Name: parts_issuance_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.parts_issuance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.parts_issuance_id_seq OWNER TO neondb_owner;

--
-- Name: parts_issuance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.parts_issuance_id_seq OWNED BY public.parts_issuance.id;


--
-- Name: parts_pickup; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.parts_pickup (
    id integer NOT NULL,
    part_name text NOT NULL,
    part_number text,
    quantity integer DEFAULT 1 NOT NULL,
    supplier text,
    building_id integer,
    added_by_id integer,
    added_at timestamp without time zone DEFAULT now() NOT NULL,
    picked_up_by_id integer,
    picked_up_at timestamp without time zone,
    status public.pickup_status DEFAULT 'pending'::public.pickup_status NOT NULL,
    notes text,
    tracking_number text,
    po_number text,
    pickup_code text
);


ALTER TABLE public.parts_pickup OWNER TO neondb_owner;

--
-- Name: parts_pickup_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.parts_pickup_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.parts_pickup_id_seq OWNER TO neondb_owner;

--
-- Name: parts_pickup_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.parts_pickup_id_seq OWNED BY public.parts_pickup.id;


--
-- Name: parts_to_count; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.parts_to_count (
    id integer NOT NULL,
    part_id integer NOT NULL,
    assigned_by_id integer,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp without time zone,
    notes text
);


ALTER TABLE public.parts_to_count OWNER TO neondb_owner;

--
-- Name: parts_to_count_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.parts_to_count_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.parts_to_count_id_seq OWNER TO neondb_owner;

--
-- Name: parts_to_count_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.parts_to_count_id_seq OWNED BY public.parts_to_count.id;


--
-- Name: reset_flags; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.reset_flags (
    key text NOT NULL,
    value boolean,
    reset_at timestamp without time zone
);


ALTER TABLE public.reset_flags OWNER TO neondb_owner;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- Name: shelves; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.shelves (
    id integer NOT NULL,
    location_id integer NOT NULL,
    name text NOT NULL,
    description text,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.shelves OWNER TO neondb_owner;

--
-- Name: shelves_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.shelves_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shelves_id_seq OWNER TO neondb_owner;

--
-- Name: shelves_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.shelves_id_seq OWNED BY public.shelves.id;


--
-- Name: staff_members; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.staff_members (
    id integer NOT NULL,
    name text NOT NULL,
    building_id integer,
    cost_center_id integer,
    email text,
    phone text,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.staff_members OWNER TO neondb_owner;

--
-- Name: staff_members_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.staff_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.staff_members_id_seq OWNER TO neondb_owner;

--
-- Name: staff_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.staff_members_id_seq OWNED BY public.staff_members.id;


--
-- Name: storage_locations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.storage_locations (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.storage_locations OWNER TO neondb_owner;

--
-- Name: storage_locations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.storage_locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.storage_locations_id_seq OWNER TO neondb_owner;

--
-- Name: storage_locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.storage_locations_id_seq OWNED BY public.storage_locations.id;


--
-- Name: tool_signouts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tool_signouts (
    id integer NOT NULL,
    tool_id integer NOT NULL,
    technician_id integer NOT NULL,
    signed_out_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    returned_at timestamp without time zone,
    status public.tool_status DEFAULT 'checked_out'::public.tool_status NOT NULL,
    condition text,
    notes text
);


ALTER TABLE public.tool_signouts OWNER TO neondb_owner;

--
-- Name: tool_signouts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tool_signouts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tool_signouts_id_seq OWNER TO neondb_owner;

--
-- Name: tool_signouts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tool_signouts_id_seq OWNED BY public.tool_signouts.id;


--
-- Name: tools; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tools (
    id integer NOT NULL,
    tool_number integer NOT NULL,
    tool_name text NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.tools OWNER TO neondb_owner;

--
-- Name: tools_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tools_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tools_id_seq OWNER TO neondb_owner;

--
-- Name: tools_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tools_id_seq OWNED BY public.tools.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password character varying(255) NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100),
    role character varying(20) NOT NULL,
    department character varying(100),
    phone character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: buildings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.buildings ALTER COLUMN id SET DEFAULT nextval('public.buildings_id_seq'::regclass);


--
-- Name: cost_centers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cost_centers ALTER COLUMN id SET DEFAULT nextval('public.cost_centers_id_seq'::regclass);


--
-- Name: delivery_request_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.delivery_request_items ALTER COLUMN id SET DEFAULT nextval('public.delivery_request_items_id_seq'::regclass);


--
-- Name: delivery_requests id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.delivery_requests ALTER COLUMN id SET DEFAULT nextval('public.delivery_requests_id_seq'::regclass);


--
-- Name: manual_parts_review id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.manual_parts_review ALTER COLUMN id SET DEFAULT nextval('public.manual_parts_review_id_seq'::regclass);


--
-- Name: notification_settings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notification_settings ALTER COLUMN id SET DEFAULT nextval('public.notification_settings_id_seq'::regclass);


--
-- Name: part_barcodes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.part_barcodes ALTER COLUMN id SET DEFAULT nextval('public.part_barcodes_id_seq'::regclass);


--
-- Name: parts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.parts ALTER COLUMN id SET DEFAULT nextval('public.parts_id_seq'::regclass);


--
-- Name: parts_delivery id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.parts_delivery ALTER COLUMN id SET DEFAULT nextval('public.parts_delivery_id_seq'::regclass);


--
-- Name: parts_issuance id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.parts_issuance ALTER COLUMN id SET DEFAULT nextval('public.parts_issuance_id_seq'::regclass);


--
-- Name: parts_pickup id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.parts_pickup ALTER COLUMN id SET DEFAULT nextval('public.parts_pickup_id_seq'::regclass);


--
-- Name: parts_to_count id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.parts_to_count ALTER COLUMN id SET DEFAULT nextval('public.parts_to_count_id_seq'::regclass);


--
-- Name: shelves id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shelves ALTER COLUMN id SET DEFAULT nextval('public.shelves_id_seq'::regclass);


--
-- Name: staff_members id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staff_members ALTER COLUMN id SET DEFAULT nextval('public.staff_members_id_seq'::regclass);


--
-- Name: storage_locations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.storage_locations ALTER COLUMN id SET DEFAULT nextval('public.storage_locations_id_seq'::regclass);


--
-- Name: tool_signouts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tool_signouts ALTER COLUMN id SET DEFAULT nextval('public.tool_signouts_id_seq'::regclass);


--
-- Name: tools id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tools ALTER COLUMN id SET DEFAULT nextval('public.tools_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: buildings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.buildings (id, name, location, description, contact_person, contact_email, contact_phone, created_at, active, address) FROM stdin;
1	Affinty Commons	\N	\N	\N	\N	\N	2025-03-31 17:40:36.610481	t	\N
2	Affinty Village	\N	\N	\N	\N	\N	2025-03-31 17:40:36.702693	t	\N
3	Biggs	\N	\N	\N	\N	\N	2025-03-31 17:40:36.78777	t	\N
4	Brookhart	\N	\N	\N	\N	\N	2025-03-31 17:40:36.872771	t	\N
5	Business Services	\N	\N	\N	\N	\N	2025-03-31 17:40:36.9593	t	\N
6	CDC	\N	\N	\N	\N	\N	2025-03-31 17:40:37.044897	t	\N
7	Chapel	\N	\N	\N	\N	\N	2025-03-31 17:40:37.130571	t	\N
8	Counseling Center	\N	\N	\N	\N	\N	2025-03-31 17:40:37.217505	t	\N
9	Courtyard Apartments	\N	\N	\N	\N	\N	2025-03-31 17:40:37.302852	t	\N
10	Dial-Robertson Stadium	\N	\N	\N	\N	\N	2025-03-31 17:40:37.389054	t	\N
11	Dicke Hall	\N	\N	\N	\N	\N	2025-03-31 17:40:37.474475	t	\N
12	Dukes Memorial	\N	\N	\N	\N	\N	2025-03-31 17:40:37.560747	t	\N
13	Durbin-Hielman Softball Field	\N	\N	\N	\N	\N	2025-03-31 17:40:37.646206	t	\N
14	Founders	\N	\N	\N	\N	\N	2025-03-31 17:40:37.733889	t	\N
15	Freed Center	\N	\N	\N	\N	\N	2025-03-31 17:40:37.819421	t	\N
16	Heterick Library	\N	\N	\N	\N	\N	2025-03-31 17:40:37.904519	t	\N
17	IT	\N	\N	\N	\N	\N	2025-03-31 17:40:37.989753	t	\N
18	JLK	\N	\N	\N	\N	\N	2025-03-31 17:40:38.075174	t	\N
19	Kerscher Stadium	\N	\N	\N	\N	\N	2025-03-31 17:40:38.161083	t	\N
20	Klondike's Den	\N	\N	\N	\N	\N	2025-03-31 17:40:38.250377	t	\N
21	Lehr Kennedy House	\N	\N	\N	\N	\N	2025-03-31 17:40:38.335853	t	\N
22	Lehr Memorial	\N	\N	\N	\N	\N	2025-03-31 17:40:38.421161	t	\N
23	Lima	\N	\N	\N	\N	\N	2025-03-31 17:40:38.506785	t	\N
24	Maglott	\N	\N	\N	\N	\N	2025-03-31 17:40:38.594563	t	\N
25	Maintenance Building	\N	\N	\N	\N	\N	2025-03-31 17:40:38.680309	t	\N
26	Mathile	\N	\N	\N	\N	\N	2025-03-31 17:40:38.765721	t	\N
27	McIntosh	\N	\N	\N	\N	\N	2025-03-31 17:40:38.85091	t	\N
28	Meyer	\N	\N	\N	\N	\N	2025-03-31 17:40:38.936966	t	\N
29	Multicultrial Center	\N	\N	\N	\N	\N	2025-03-31 17:40:39.02991	t	\N
30	Northern Commons	\N	\N	\N	\N	\N	2025-03-31 17:40:39.124955	t	\N
31	Observatory	\N	\N	\N	\N	\N	2025-03-31 17:40:39.220609	t	\N
32	ONU Sports Center	\N	\N	\N	\N	\N	2025-03-31 17:40:39.307766	t	\N
33	Park	\N	\N	\N	\N	\N	2025-03-31 17:40:39.395236	t	\N
34	Pharmacy	\N	\N	\N	\N	\N	2025-03-31 17:40:39.483826	t	\N
35	Physical Plant	\N	\N	\N	\N	\N	2025-03-31 17:40:39.57067	t	\N
36	Picnic Pavillion	\N	\N	\N	\N	\N	2025-03-31 17:40:39.656872	t	\N
37	Polar Place	\N	\N	\N	\N	\N	2025-03-31 17:40:39.744818	t	\N
38	President's House	\N	\N	\N	\N	\N	2025-03-31 17:40:39.830312	t	\N
39	Presser	\N	\N	\N	\N	\N	2025-03-31 17:40:39.917183	t	\N
40	Public Safety	\N	\N	\N	\N	\N	2025-03-31 17:40:40.004898	t	\N
41	Roberts	\N	\N	\N	\N	\N	2025-03-31 17:40:40.091352	t	\N
42	Science Annex	\N	\N	\N	\N	\N	2025-03-31 17:40:40.177006	t	\N
43	Stadium View Apartments	\N	\N	\N	\N	\N	2025-03-31 17:40:40.263331	t	\N
44	Stambaugh	\N	\N	\N	\N	\N	2025-03-31 17:40:40.348559	t	\N
45	Starbucks	\N	\N	\N	\N	\N	2025-03-31 17:40:40.433803	t	\N
46	Student Health Center	\N	\N	\N	\N	\N	2025-03-31 17:40:40.520305	t	\N
48	The Inn	\N	\N	\N	\N	\N	2025-03-31 17:40:40.691262	t	\N
49	University Terrace	\N	\N	\N	\N	\N	2025-03-31 17:40:40.777314	t	\N
50	King Horn			\N	\N	\N	2025-05-06 19:17:59.455517	t	\N
51	Wilson			\N	\N	\N	2025-05-07 12:42:59.995973	t	\N
52	Mail Center			\N	\N	\N	2025-05-21 14:48:20.239277	t	\N
47	Taft-Law	\N	\N	\N	\N	\N	2025-03-31 17:40:40.606017	t	\N
53	Other			\N	\N	\N	2025-06-18 14:01:44.473954	t	\N
\.


--
-- Data for Name: cost_centers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.cost_centers (id, code, name, description, active, created_at) FROM stdin;
1	11000-13000	Stockroom Inventory	Stockroom Inventory	t	2025-04-23 19:20:57.083
2	122100-71510	Small Housing Equipment	Small Housing Equipment	t	2025-04-23 19:21:50.764
5	122100-71610	Small Housing Equipment	Less than 5,000	t	2025-04-23 19:55:14.259
6	122100-75500	Small Housing Building	Building Repairs	t	2025-04-23 19:55:14.584
7	122100-75510	Small Housing Equipment Repairs	Equpiment Repairs	t	2025-04-23 19:55:14.629
8	122100-75520	Small Housing Grounds	Grounds Maintenance	t	2025-04-23 19:55:14.678
9	122100-75530	Small Housing Vehicle	Vehicle Repairs	t	2025-04-23 19:55:14.726
10	122100-72200	Small Housing Contract Services	Facilities Contracted Services	t	2025-04-23 19:55:14.771
11	122100-55075	Small Housing Other	Other Non-Student Revenue	t	2025-04-23 19:55:14.814
12	122100-76110	Small Housing Janitorial	Janitorial	t	2025-04-23 19:55:14.864
13	122100-76200	Small Housing Office Supplies	Office Supplies	t	2025-04-23 19:55:14.911
14	122100-76000	Small Housing Non Inventory	Non Inventory	t	2025-04-23 19:55:14.956
15	121160-76200	Copy Services Office Supplies	Office Supplies	t	2025-04-23 19:55:15
16	121150-71510	Business Services Equipment	More than 5,000	t	2025-04-23 19:55:15.057
17	121150-71610	Business Services Equipment	Less than 5,000	t	2025-04-23 19:55:15.105
18	121150-75500	Business Services Building	Building Repairs	t	2025-04-23 19:55:15.154
19	121150-75510	Business Services Equipment Repairs	\N	t	2025-04-23 19:55:15.199
20	121150-75530	Business Services Vehicle	Vehicle Repairs	t	2025-04-23 19:55:15.243
21	121150-76200	Business Services Office	Office Supplies	t	2025-04-23 19:55:15.291
22	121150-76000	Business Services Non Inventory	Non Inventory	t	2025-04-23 19:55:15.335
23	121150-76100	Business Services Fuel	Fuel	t	2025-04-23 19:55:15.379
24	128910-71510	Physical Plant Equipment	More than 5,000	t	2025-04-23 19:55:15.427
25	128910-71610	Physical Plant Equipment	Less than 5,000	t	2025-04-23 19:55:15.472
26	128910-75500	Physical Plant Building	Building Repairs	t	2025-04-23 19:55:15.518
27	128910-75510	Physical Plant Equipment Repairs	Equpiment Repairs	t	2025-04-23 19:55:15.562
28	128910-75520	Physical Plant Grounds	Grounds Maintenance	t	2025-04-23 19:55:15.606
29	128910-75530	Physical Plant Vehicle	Vehicle Repairs	t	2025-04-23 19:55:15.658
30	128910-72200	Physical Plant Contract Services	Facilities Contracted Services	t	2025-04-23 19:55:15.703
31	128910-55075	Physical Plant Other	Other Non-Student Revenue	t	2025-04-23 19:55:15.748
32	128910-76110	Physical Plant Janitorial	Janitorial	t	2025-04-23 19:55:15.794
33	128910-76200	Physical Plant Office Supplies	Office Supplies	t	2025-04-23 19:55:15.845
34	128910-76000	Physical Plant Non Inventory	Non Inventory	t	2025-04-23 19:55:15.894
67	128915-71510	Grounds Equipment	More than 5,000	t	2025-04-24 12:41:47.666
68	128915-71610	Grounds Equipment	Less than 5,000	t	2025-04-24 12:41:47.955
69	128915-75500	Grounds Building	Building Repairs	t	2025-04-24 12:41:47.999
70	128915-75510	Grounds Equipment Repairs	Equipment Repairs	t	2025-04-24 12:41:48.039
71	128915-75520	Grounds Grounds	Grounds Maintenance	t	2025-04-24 12:41:48.081
72	128915-75530	Grounds Vehicle	Vehicle Repairs	t	2025-04-24 12:41:48.121
73	128915-72200	Grounds Contract Services	Facilities Contracted Services	t	2025-04-24 12:41:48.229
74	128915-55075	Grounds Other	Other Non-Student Revenue	t	2025-04-24 12:41:48.277
75	128915-76110	Grounds Janitorial	Janitorial	t	2025-04-24 12:41:48.318
76	128915-76200	Grounds Office Supplies	Office Supplies	t	2025-04-24 12:41:48.361
77	128915-76000	Grounds Non Inventory	Non Inventory	t	2025-04-24 12:41:48.401
78	128920-75530	Campus Fleet	Fleet Repairs	t	2025-04-24 12:41:48.441
79	129100-71510	McIntosh Equipment	More than 5,000	t	2025-04-24 12:41:48.481
80	129100-71610	McIntosh Equipment	Less than 5,000	t	2025-04-24 12:41:48.523
81	129100-75500	McIntosh Building	Building Repairs	t	2025-04-24 12:41:48.564
82	129100-75510	McIntosh Equipment Repairs	Equipment Repairs	t	2025-04-24 12:41:48.61
83	129100-75520	McIntosh Grounds	Grounds Maintenance	t	2025-04-24 12:41:48.653
84	129100-75530	McIntosh Vehicle	Vehicle Repairs	t	2025-04-24 12:41:48.693
85	129100-72200	McIntosh Contract Services	Facilities Contracted Services	t	2025-04-24 12:41:48.733
86	129100-55075	McIntosh Other	Other Non-Student Revenue	t	2025-04-24 12:41:48.774
87	129100-76110	McIntosh Janitorial	Janitorial	t	2025-04-24 12:41:48.814
88	129100-76200	McIntosh Office Supplies	Office Supplies	t	2025-04-24 12:41:48.854
89	129100-76000	McIntosh Non Inventory	Non Inventory	t	2025-04-24 12:41:48.895
90	129120-71510	Sodexo Food Service Equipment	More than 5,000	t	2025-04-24 12:41:48.936
91	129120-71610	Sodexo Food Service Equipment	Less than 5,000	t	2025-04-24 12:41:48.977
92	129120-75500	Sodexo Food Service Building	Building Repairs	t	2025-04-24 12:41:49.018
93	129120-75510	Sodexo Food Service Equipment Repairs	Equipment Repairs	t	2025-04-24 12:41:49.058
94	129120-75520	Sodexo Food Service Grounds	Grounds Maintenance	t	2025-04-24 12:41:49.099
95	129120-75530	Sodexo Food Service Vehicle	Vehicle Repairs	t	2025-04-24 12:41:49.142
96	129120-72200	Sodexo Food Service Contract Services	Facilities Contracted Services	t	2025-04-24 12:41:49.184
97	129120-55075	Sodexo Food Service Other	Other Non-Student Revenue	t	2025-04-24 12:41:49.228
98	129120-76110	Sodexo Food Service Janitorial	Janitorial	t	2025-04-24 12:41:49.269
99	129120-76200	Sodexo Food Service Office Supplies	Office Supplies	t	2025-04-24 12:41:49.31
100	129120-76000	Sodexo Food Service Non Inventory	Non Inventory	t	2025-04-24 12:41:49.35
101	129130-71510	Starbucks Equipment	More than 5,000	t	2025-04-24 12:41:49.39
102	129130-71610	Starbucks Equipment	Less than 5,000	t	2025-04-24 12:41:49.43
103	129130-75500	Starbucks Building	Building Repairs	t	2025-04-24 12:41:49.472
104	129130-75510	Starbucks Equipment Repairs	Equipment Repairs	t	2025-04-24 12:41:49.512
105	129130-75520	Starbucks Grounds	Grounds Maintenance	t	2025-04-24 12:41:49.552
106	129130-72200	Starbucks Contract Services	Facilities Contracted Services	t	2025-04-24 12:41:49.594
107	129130-55075	Starbucks Other	Other Non-Student Revenue	t	2025-04-24 12:41:49.633
108	129130-76110	Starbucks Janitorial	Janitorial	t	2025-04-24 12:41:49.673
109	129130-76200	Starbucks Office Supplies	Office Supplies	t	2025-04-24 12:41:49.715
110	129130-76000	Starbucks Non Inventory	Non Inventory	t	2025-04-24 12:41:49.755
111	129205-71510	Maglott/Founders/Park Equipment	More than 5,000	t	2025-04-24 12:41:49.796
112	129205-71610	Maglott/Founders/Park Equipment	Less than 5,000	t	2025-04-24 12:41:49.838
113	129205-75500	Maglott/Founders/Park Building	Building Repairs	t	2025-04-24 12:41:49.878
114	129205-75510	Maglott/Founders/Park Equipment Repairs	Equipment Repairs	t	2025-04-24 12:41:49.918
115	129205-75520	Maglott/Founders/Park Grounds	Grounds Maintenance	t	2025-04-24 12:41:49.959
116	129205-72200	Maglott/Founders/Park Contract Services	Facilities Contracted Services	t	2025-04-24 12:41:49.998
117	129205-55075	Maglott/Founders/Park Other	Other Non-Student Revenue	t	2025-04-24 12:41:50.041
118	129205-76110	Maglott/Founders/Park Janitorial	Janitorial	t	2025-04-24 12:41:50.083
119	129205-76200	Maglott/Founders/Park Office Supplies	Office Supplies	t	2025-04-24 12:41:50.123
120	129205-76000	Maglott/Founders/Park Non Inventory	Non Inventory	t	2025-04-24 12:41:50.163
121	129210-71510	Lima/Brookhart/Roberts Equipment	More than 5,000	t	2025-04-24 12:41:50.204
122	129210-71610	Lima/Brookhart/Roberts Equipment	Less than 5,000	t	2025-04-24 12:41:50.248
123	129210-75500	Lima/Brookhart/Roberts Building	Building Repairs	t	2025-04-24 12:41:50.288
124	129210-75510	Lima/Brookhart/Roberts Equipment Repairs	Equipment Repairs	t	2025-04-24 12:41:50.333
125	129210-75520	Lima/Brookhart/Roberts Grounds	Grounds Maintenance	t	2025-04-24 12:41:50.373
126	129210-72200	Lima/Brookhart/Roberts Contract Services	Facilities Contracted Services	t	2025-04-24 12:41:50.413
127	129210-55075	Lima/Brookhart/Roberts Other	Other Non-Student Revenue	t	2025-04-24 12:41:50.453
128	129210-76110	Lima/Brookhart/Roberts Janitorial	Janitorial	t	2025-04-24 12:41:50.493
129	129210-76200	Lima/Brookhart/Roberts Office Supplies	Office Supplies	t	2025-04-24 12:41:50.533
130	129210-76000	Lima/Brookhart/Roberts Non Inventory	Non Inventory	t	2025-04-24 12:41:50.573
131	129215-71510	Stambaugh Equipment	More than 5,000	t	2025-04-24 12:41:50.613
132	129215-71610	Stambaugh Equipment	Less than 5,000	t	2025-04-24 12:41:50.654
133	129215-75500	Stambaugh Building	Building Repairs	t	2025-04-24 12:41:50.695
134	129215-75510	Stambaugh Equipment Repairs	Equipment Repairs	t	2025-04-24 12:41:50.735
135	129230-71510	Student Apts Equipment	More than 5,000	t	2025-04-24 12:41:50.775
136	129230-71610	Student Apts Equipment	Less than 5,000	t	2025-04-24 12:41:50.816
137	129230-75500	Student Apts Building	Building Repairs	t	2025-04-24 12:41:50.856
138	129230-75510	Student Apts Equipment Repairs	Equipment Repairs	t	2025-04-24 12:41:50.896
139	129235-71510	Affinity Equipment	More than 5,000	t	2025-04-24 12:41:50.939
140	129235-71610	Affinity Equipment	Less than 5,000	t	2025-04-24 12:41:50.985
141	129235-75500	Affinity Building	Building Repairs	t	2025-04-24 12:41:51.025
142	129235-75510	Affinity Equipment Repairs	Equipment Repairs	t	2025-04-24 12:41:51.065
143	129240-71510	Courtyard Equipment	More than 5,000	t	2025-04-24 12:41:51.105
144	129240-71610	Courtyard Equipment	Less than 5,000	t	2025-04-24 12:41:51.144
145	129240-75500	Courtyard Building	Building Repairs	t	2025-04-24 12:41:51.184
146	129240-75510	Courtyard Equipment Repairs	Equipment Repairs	t	2025-04-24 12:41:51.224
147	161240-71510	President's House Equipment	More than 5,000	t	2025-04-24 12:41:51.264
148	161240-71610	President's House Equipment	Less than 5,000	t	2025-04-24 12:41:51.305
149	161240-75500	President's House Building	Building Repairs	t	2025-04-24 12:41:51.346
150	161240-75510	President's House Equipment Repairs	Equipment Repairs	t	2025-04-24 12:41:51.386
151	161240-75520	President's House Grounds	Grounds Maintenance	t	2025-04-24 12:41:51.426
152	161240-72200	President's House Contract Services	Facilities Contracted Services	t	2025-04-24 12:41:51.467
153	161240-55075	President's House Other	Other Non-Student Revenue	t	2025-04-24 12:41:51.507
154	161240-76110	President's House Janitorial	Janitorial	t	2025-04-24 12:41:51.548
155	161240-76200	President's House Office Supplies	Office Supplies	t	2025-04-24 12:41:51.588
156	161240-76000	President's House Non Inventory	Non Inventory	t	2025-04-24 12:41:51.629
157	11000-12760	The Inn Operating	Operating	t	2025-04-24 12:41:51.669
158	129900-71510	The Inn Equipment	More than 5,000	t	2025-04-24 12:41:51.709
159	129900-71610	The Inn Equipment	Less than 5,000	t	2025-04-24 12:41:51.75
160	129900-75500	The Inn Building	Building Repairs	t	2025-04-24 12:41:51.79
161	129900-75510	The Inn Equipment Repairs	Equipment Repairs	t	2025-04-24 12:41:51.83
162	129900-76200	The Inn Office Supplies	Office Supplies	t	2025-04-24 12:41:51.87
163	141230-76000	McIntosh Center-Operations	McIntosh Center-Operations	t	2025-04-24 12:41:51.91
164	111230-76200	Mathematics Office	Mathematics Office	t	2025-04-24 12:41:51.951
165	113010-76200	Pharmacy Office	Pharmacy Office	t	2025-04-24 12:41:51.993
166	112040-76200	Mechanical Engineering Office	Mechanical Engineering Office	t	2025-04-24 12:41:52.033
167	112030-76200	Electrical Engineering Office	Electrical Engineering Office	t	2025-04-24 12:41:52.076
168	112020-76200	Civil & Environmental Engineering Office	Civil & Environmental Engineering Office	t	2025-04-24 12:41:52.116
169	114010-76200	Law College Office	Law College Office	t	2025-04-24 12:41:52.158
170	111420-76200	Technology Office	Technology Office	t	2025-04-24 12:41:52.205
171	111210-76200	Biological & Allied Health Sciences Office	Biological & Allied Health Sciences Office	t	2025-04-24 12:41:52.247
172	115010-76200	Business College Office	Business College Office	t	2025-04-24 12:41:52.288
173	121120-76200	Controller Office Supplies	Controller Office Supplies	t	2025-04-24 12:41:52.329
174	121130-76200	Human Resources Office Supplies	Human Resources Office Supplies	t	2025-04-24 12:41:52.37
175	111120-76200	English Office Supplies	English Office Supplies	t	2025-04-24 12:41:52.412
176	118100-76200	Academic Affairs Office Supplies	Academic Affairs Office Supplies	t	2025-04-24 12:46:46.667
177	111542-76200	Performing Arts - Office Supplies	Performing Arts - Office Supplies	t	2025-05-01 13:03:27.484
178	115100-76020	Heterick		t	2025-05-13 17:31:37.18
179	111006-76200	Wilson Art		t	2025-05-13 17:33:51.476
180	116500-76200	Dukes Office		t	2025-05-13 17:37:04.856
181	115400-73210	Law		t	2025-05-16 16:57:22.908
202	114030-76200	Law Admissions		t	2025-05-16 17:28:10.833
203	111250-76000	Nursing		t	2025-05-16 17:40:26.792
204	121170-76200	Mail Center		t	2025-05-21 14:48:40.59
205	111220-76200	Chemistry Office Supplies		t	2025-05-27 14:06:25.94
206	111550-76200	Pressor Office Supplies 		t	2025-06-09 18:29:03.423
207	111010-76200	Dukes		t	2025-06-09 18:51:53.875
208	123100-76200	Public Safety Office Supplies 		t	2025-06-09 20:07:25.682
209	117100-76200	Taft Office Supplies		t	2025-06-11 13:36:30.021
210	112010-76000	JLK Dean's Suite		t	2025-06-11 15:04:45.097
213	121180-76200	Printing Services		t	2025-07-08 13:33:08.119
214	118101-76200	Student Success Center		t	2025-07-08 13:33:46.379
215	116300-76000	IT - Office Supplies		t	2025-08-12 15:10:04.884
216	112010-76200	JLK Office Supplies		t	2025-08-19 17:25:26.952
217	141110-76200	Chapel		t	2025-08-25 18:31:49.743
218	111240-76200	Physics		t	2025-08-26 15:20:08.678
\.


--
-- Data for Name: delivery_request_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.delivery_request_items (id, request_id, item_name, quantity, part_id, fulfilled_quantity) FROM stdin;
1	1	8 1/2 x 11 paper	1	400029	0
2	1	Cf226x Toner	1	801509344318	0
3	2	8 1/2 x 11 paper	1	400029	0
4	2	CF287X Toner	1	5900234159	0
5	2	Big T	5	\N	0
6	3	Test Manual Item	2	\N	0
7	4	8 1/2 x 11 paper	2	400029	0
8	4	HP42X TONER	3	801509159394	0
9	4	Big T	5	\N	0
\.


--
-- Data for Name: delivery_requests; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.delivery_requests (id, requester_name, room_number, building_id, cost_center_id, notes, status, request_date, fulfilled_date, fulfilled_by) FROM stdin;
2	Michael Gierhart	17	18	20	\N	approved	2025-08-12 15:11:45.269895	2025-08-12 15:36:17.195612	1
4	Michael Gierhart	17	11	20	Delivery now	approved	2025-08-12 15:51:19.523069	2025-08-12 16:01:26.252055	1
3	Test User	101	1	1	Test manual item handling	approved	2025-08-12 15:46:31.300378	2025-08-12 16:01:36.5435	1
1	Test	2121	5	18	\N	pending	2025-08-06 12:41:43.321551	\N	\N
\.


--
-- Data for Name: manual_parts_review; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.manual_parts_review (id, scanned_barcode, description, quantity, technician_used, date_scanned, status, approved_at, approved_by, created_at) FROM stdin;
4	012000182686	Pepsi Zero - Test	1	Bill Szippl	2025-07-30 14:12:53.661	approved	2025-07-30 18:47:14.04038	1	2025-07-30 14:12:53.761054
\.


--
-- Data for Name: notification_settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notification_settings (id, work_orders_new, work_orders_status, work_orders_comments, inventory_low_stock, inventory_issuance, updated_at) FROM stdin;
1	f	t	t	t	t	2025-04-08 19:09:09.96985
\.


--
-- Data for Name: part_barcodes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.part_barcodes (id, part_id, barcode, supplier, is_primary, active, created_at) FROM stdin;
1	1255	038244069507	Dayco	f	t	2025-07-08 16:43:08.582497
2	1268	687152175611	Supco	f	t	2025-07-08 17:44:50.807953
3	1302	1 4L270	Dayton	t	t	2025-07-09 12:46:31.614258
4	121	049793173348	primeline	t	t	2025-07-18 14:48:39.49257
5	1445	042805003060	Jameco	f	t	2025-07-22 15:20:35.200013
6	1362	781087090428	Philips Advance	f	t	2025-07-30 16:21:49.18572
7	1525	078477153574	Leviton	f	t	2025-07-31 13:25:13.82804
8	767	X002HXP5MR	energetic lighting 8w 60w 8 60	f	t	2025-07-31 16:23:10.539891
9	1553	783585393704	Hubbell	t	t	2025-08-06 18:10:17.527094
10	1553	883778102165	Hubbell	f	t	2025-08-06 18:10:17.584676
11	231	012800000456	Rayovac	f	t	2025-08-13 12:58:55.374074
12	1565	792363644907	Thunderbolt Edge	f	t	2025-08-13 12:59:35.916752
13	228	012800000418	Rayovac	f	t	2025-08-13 13:03:59.124922
14	1588	883778311208	Hubbell	t	t	2025-08-14 12:44:12.589671
15	1539	078477958285	Leviton	f	t	2025-08-14 12:46:31.171701
16	1590	078477958353	Leviton	t	t	2025-08-14 13:02:50.613572
17	1591	078477151358	Leviton	t	t	2025-08-14 15:10:11.739153
18	1535	883778201295	Hubbell	f	t	2025-08-18 14:15:42.16927
19	1133	000.000.019	\N	f	t	2025-08-26 15:11:18.33883
\.


--
-- Data for Name: parts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.parts (id, part_id, name, description, quantity, reorder_level, unit_cost, category, location, supplier, last_restock_date, created_at, location_id, shelf_id) FROM stdin;
254	167750	All PVC Male Adapters	\N	33	1	0.86	\N	Stockroom A-265	\N	\N	2025-03-31 17:33:15.036113	\N	\N
1186	TN328K	TN328K toner (ARCHIVED) (ARCHIVED)		0	1	0.00	\N	\N	\N	\N	2025-05-27 15:32:33.94753	\N	\N
152	150065B	5/16 Carriage Bolts-each	\N	193	1	0.17	\N	Stockroom A-163	\N	\N	2025-03-31 17:33:06.214685	\N	\N
153	150065C	3/8 Carriage Bolt-each	\N	232	1	0.25	\N	Stockroom A-164	\N	\N	2025-03-31 17:33:06.30132	\N	\N
1170	032886188879	14/3 wire	250' 14/3 w/ground	250	10	0.52	\N	Stockroom	\N	\N	2025-05-14 11:38:07.583451	\N	\N
504	300058A	5252 Brown or Ivory Receptacle		3	1	2.25	\N		\N	\N	2025-03-31 17:33:36.657472	\N	\N
1168	4ZAX8	Fuse 30A ATDR	Fuse 30A ATDR 4ZAX8	15	2	13.20	\N	Stockroom	\N	\N	2025-05-13 17:15:03.290969	\N	\N
553	047871330812	Smoke Alarms-Battery or DC	Smoke Detector	45	20	20.76	\N		\N	\N	2025-03-31 17:33:40.939548	1	303
420	250004	1BL001-PL36 pump	\N	2	1	323.02	\N	Stockroom A-432	\N	\N	2025-03-31 17:33:29.370912	\N	\N
159	150070	1/4 Hex Bolts	\N	1511	1	0.12	\N	Stockroom A-170	\N	\N	2025-03-31 17:33:06.829768	\N	\N
41	100151D	Pipe Joint Compound	\N	3	1	14.00	\N	Stockroom	\N	\N	2025-03-31 17:32:56.547857	\N	\N
373	210001B	1/2 gas valve	\N	3	1	8.20	\N	Stockroom A-385	\N	\N	2025-03-31 17:33:25.302856	\N	\N
768	350106	15 watt clear/frosted bulb\r\n\r\n\r\nmedium or candelabra base	\N	34	1	0.45	\N	Stockroom A-780	\N	\N	2025-03-31 17:33:59.618214	\N	\N
1161	885911026475	Magnetic Nut Driver	DeWalt DW2223IR	3	1	4.00	\N	Stockroom	\N	\N	2025-05-07 18:30:06.507548	\N	\N
1178	X0043Z9JIX	Simplex Detector	4098-9714	7	2	27.00	\N	Stockroom	\N	\N	2025-05-21 16:28:41.428451	\N	\N
314	200127B	AM ST Cartridge for single control -A954120-0070A	\N	7	1	11.75	\N	Stockroom A-326	\N	\N	2025-03-31 17:33:20.213275	\N	\N
1187	640263080106	Foot stopper	Toe tap stopper	12	2	7.00	\N	Stockroom - Shelf J2	\N	\N	2025-05-27 19:25:40.226123	\N	\N
1183	TN328C	TN328C toner	\N	1	1	0.00	\N	Stockroom - Shelf A2	\N	\N	2025-05-27 14:46:33.87552	\N	\N
800	352015	#14 THNN Wire- all colors-per foot	\N	1749	1	0.12	\N	Stockroom A-812	\N	\N	2025-03-31 17:34:02.368155	\N	\N
1172	30UL79	Faucet cross handle	3oul79	1	2	36.97	\N	Stockroom - Shelf J2	\N	\N	2025-05-14 18:35:11.382181	\N	\N
263	200001B	1 1/2 x 16 Flanged Tail Piece - PVC	\N	5	1	1.38	\N	Stockroom A-274	\N	\N	2025-03-31 17:33:15.82549	\N	\N
1181	724049291815	ProPress 90 Street Elbow	EZPE077	20	4	4.90	\N	Stockroom	\N	\N	2025-05-27 11:18:36.084112	\N	\N
230	160143	AA Battery (ARCHIVED) (ARCHIVED)		0	1	0.60	\N	\N	\N	\N	2025-03-31 17:33:12.964082	\N	\N
1165	X0035KPL11	Pre Rinse Spray Head	Krowne 21-129L	5	1	65.00	\N	Stockroom - Shelf H2	\N	\N	2025-05-12 18:46:18.921799	\N	\N
1174	38UU29	Perfect Valve Cartridge	RPG05-0533-CA	8	4	40.89	\N	Stockroom - Shelf J3	\N	\N	2025-05-15 18:41:39.217322	\N	\N
1175	039961100122	12" faucet supply line	Pro1F12 1/2"x3/8	5	4	4.07	\N	Stockroom	\N	\N	2025-05-21 16:02:34.309438	\N	\N
1179	034449017404	RP1740	Delta Stem Unit Assembly	13	2	11.48	\N	Stockroom - Shelf J2	\N	\N	2025-05-21 16:31:55.708991	1	177
536	300180	5747-5751 Wiremold Box	\N	1	1	5.31	\N	Stockroom A-548	\N	\N	2025-03-31 17:33:39.449936	\N	\N
892	630062	13/32''-1/2'' Drill Bits	\N	49	1	5.59	\N	Stockroom A-904	\N	\N	2025-03-31 17:34:10.454417	\N	\N
922	720003	8 oz. Wood Glue	\N	2	1	2.79	\N	Stockroom A-934	\N	\N	2025-03-31 17:34:13.054506	\N	\N
299	200078	Vacuum Breaker		27	5	10.34	\N	Stockroom - Shelf I3	\N	\N	2025-03-31 17:33:18.917322	1	174
156	150070B	3/8 Hex Cap Bolts -each	\N	1726	1	0.27	\N	Stockroom A-167	\N	\N	2025-03-31 17:33:06.560281	\N	\N
404	220013A	O Rings for Tail Pieces-each	\N	5	1	0.81	\N	Stockroom A-416	\N	\N	2025-03-31 17:33:28.000199	\N	\N
1188	032628909045	Johni Quick Bolt	1/4"	25	2	3.08	\N	Stockroom - Shelf J1	\N	\N	2025-05-29 17:14:24.543128	\N	\N
262	200001A	1 1/2 Threaded Tail Piece - Chrome	\N	2	1	7.93	\N	Stockroom A-273	\N	\N	2025-03-31 17:33:15.740176	\N	\N
717	350021B	LU-100 Medium Base Sodium	\N	1	1	13.89	\N	Stockroom A-729	\N	\N	2025-03-31 17:33:55.241004	\N	\N
140	150020	#8 Deck screws - box	\N	1	1	4.45	\N	Stockroom A-151	\N	\N	2025-03-31 17:33:05.18923	\N	\N
556	300284	Blue Wire Nuts-Box	\N	1	1	8.50	\N	Stockroom A-568	\N	\N	2025-03-31 17:33:41.195807	\N	\N
856	420010	Rubber Mallet-each	\N	1	1	10.24	\N	Stockroom A-868	\N	\N	2025-03-31 17:34:07.28404	\N	\N
45	100155	3-in-1 oil	\N	4	1	1.90	\N	Stockroom A-56	\N	\N	2025-03-31 17:32:56.88985	\N	\N
1162	010121544017	Condensate Pump	Little Giant VCMA-15	1	1	48.64	\N	Stockroom - Shelf H1	\N	\N	2025-05-12 13:33:32.197524	\N	\N
331	200145	Flush Handle Repair Kit\r\n\r\n\r\nP6000 Zurn	\N	4	1	13.85	\N	\N	\N	\N	2025-03-31 17:33:21.689078	1	300
1176	KTCR19X-C	1/4 turn ball stop	1/2" Inlet x 3/8" Outlet Brasscraft ball stop	9	2	10.01	\N	Stockroom - Shelf I1	\N	\N	2025-05-21 16:05:54.59876	1	172
889	630022	Drill Bit Extension	\N	7	1	5.79	\N	Stockroom A-901	\N	\N	2025-03-31 17:34:10.198412	\N	\N
802	352028	#10 THNN Wire - all colors-per foot	\N	846	1	0.08	\N	Stockroom A-814	\N	\N	2025-03-31 17:34:02.543852	\N	\N
1173	032628902411	Johni Ring	Wax toilet ring	19	6	5.24	\N	Stockroom - Shelf J1	\N	\N	2025-05-15 18:33:42.841469	1	176
215	159553	All BI Couplings and Reducers	\N	6	1	2.70	\N	Stockroom A-226	\N	\N	2025-03-31 17:33:11.663811	\N	\N
804	352044	12/2 with ground Romex - yellow-per foot	\N	500	25	0.26	\N	Stockroom	\N	\N	2025-03-31 17:34:02.717118	\N	\N
1166	1 4PA59	3" Hinge	4PA59C	12	1	4.00	\N	Stockroom	\N	\N	2025-05-12 19:16:01.716116	\N	\N
72	100427	#7 - 7/32 - 3/16 & 1/8 rope - per bag	\N	3	1	4.84	\N	Stockroom A-83	\N	\N	2025-03-31 17:32:59.305988	\N	\N
1107	045242082926	Milwaukee Wood / Metal / Plastic Universal Saw Blades 300mm Pack of 5	\N	4	1	14.81	\N	\N	\N	\N	2025-04-09 12:20:31.136621	\N	\N
136	150010	#4 or #6 Sheet Metal Screws - box	\N	11	1	3.00	\N	Stockroom A-147	\N	\N	2025-03-31 17:33:04.848008	\N	\N
384	210011	1/2 Threaded Ball or Sharkbite Valves	\N	17	1	16.51	\N	Stockroom A-396	\N	\N	2025-03-31 17:33:26.251973	\N	\N
1171	1NNx9	Hot/cold cartridge	G1407761	25	5	7.25	\N	Stockroom - Shelf J2	\N	\N	2025-05-14 18:32:46.56332	\N	\N
1184	TN328Y	TN328Y toner	\N	1	1	0.00	\N	Stockroom - Shelf A2	\N	\N	2025-05-27 14:47:07.022087	\N	\N
275	200026C	Shower Drain Caulk Gasket-Oatey 42156	\N	4	1	2.15	\N	Stockroom A-286	\N	\N	2025-03-31 17:33:16.851143	\N	\N
772	350110B	40 watt globe - LED clear	\N	11	1	5.25	\N	Stockroom A-784	\N	\N	2025-03-31 17:33:59.961077	\N	\N
339	200162D	Replacement Clamp-2''-2 1/2'' 3''	\N	12	1	20.10	\N	Stockroom A-351	\N	\N	2025-03-31 17:33:22.376047	\N	\N
1189	032628909052	Johni Quick Bolt	5/16"	26	2	3.27	\N	Stockroom - Shelf J1	\N	\N	2025-05-29 17:15:10.648421	\N	\N
109	110148A	Master Lock-key A844	\N	6	1	12.28	\N	Stockroom A-120	\N	\N	2025-03-31 17:33:02.493597	\N	\N
92	100558F	Hinge Pin or Spring Type Door Stop	\N	26	1	1.97	\N	Stockroom A-103	\N	\N	2025-03-31 17:33:01.027628	\N	\N
394	210101G	Bubbler Head for Drinking Fountains	\N	4	1	37.22	\N	Stockroom A-406	\N	\N	2025-03-31 17:33:27.121681	\N	\N
968	900123	Trip Lever Bathwaste-Overflow P9228-P9226	\N	8	1	14.38	\N	Stockroom A-980	\N	\N	2025-03-31 17:34:17.086679	\N	\N
1191	079340010352	Loctite 567 1.69 FL. OZ	Bigger tube 2087067	7	2	39.69	\N		\N	\N	2025-06-02 11:13:46.955278	\N	\N
1197	045923205798	LED Candalabra Bulb	S21264 2700k	50	10	5.00	\N	Stockroom - Shelf L2	\N	\N	2025-06-03 15:46:53.664663	\N	\N
1524	032167000012	PB blaster	penetrating fluid oil spray bottle	2	1	10.00	\N	Stockroom - Shelf T4	\N	\N	2025-07-30 14:40:37.138105	1	308
779	350118	50R20 - 45R20 Reflector Flood	\N	56	1	4.00	\N	Stockroom A-791	\N	\N	2025-03-31 17:34:00.566405	\N	\N
355	200227B	Flush Valve Gasket kit-Mansfield -red - 630-0030	\N	16	1	2.05	\N	Stockroom A-367	\N	\N	2025-03-31 17:33:23.752843	\N	\N
869	420023	Slip Joint Pliers	\N	3	1	7.32	\N	Stockroom A-881	\N	\N	2025-03-31 17:34:08.396552	\N	\N
138	150017A	#14 Sheet Metal Screws - box	\N	1	1	6.00	\N	Stockroom A-149	\N	\N	2025-03-31 17:33:05.018385	\N	\N
1190	BioBox	Biohazard Boxes	\N	70	10	0.00	\N	Stockroom	\N	\N	2025-05-29 18:20:34.88896	\N	\N
839	X002IXMAF1	Staples-SH-10	\N	3	2	21.21	\N	Stockroom - Shelf A4	\N	\N	2025-03-31 17:34:05.811864	\N	\N
370	209996A	Honeywell Transformer-AT87A-AT72D	\N	2	1	23.70	\N	Stockroom A-382	\N	\N	2025-03-31 17:33:25.047289	\N	\N
820	353020B	Universal Surface Igniter-40-766	\N	2	1	37.21	\N	Stockroom A-832	\N	\N	2025-03-31 17:34:04.11537	\N	\N
817	353004A	Honeywell Direct Coupled Actuator-ML616182073	\N	2	1	69.99	\N	Stockroom A-829	\N	\N	2025-03-31 17:34:03.854054	\N	\N
595	300442C	Photo Control Recept. K1222-K1221-K4123	\N	3	1	45.92	\N	Stockroom A-607	\N	\N	2025-03-31 17:33:44.568437	\N	\N
1163	856143001400	Exit Light	Hubbell Compass CCR CC Series	3	1	60.63	\N	Stockroom - Shelf A1	\N	\N	2025-05-12 13:35:53.301937	\N	\N
425	250012	B&G 186499 Seal Kit	\N	3	1	69.74	\N	Stockroom A-437	\N	\N	2025-03-31 17:33:29.797142	\N	\N
1193	657258447813	14" Wall Clock	Black Atomic Wall Clock	4	1	37.95	\N	Stockroom - Shelf A1	\N	\N	2025-06-02 11:33:07.677872	\N	\N
1158	S-11871	Fluorescent Bulbs T-8	T-8 , 48" CW Bulb	60	6	5.25	\N		\N	\N	2025-05-05 16:36:29.01748	\N	\N
325	200140A	G4123625 48UL71 Wax Free Seal	\N	6	1	6.29	\N	Stockroom A-337	\N	\N	2025-03-31 17:33:21.169582	\N	\N
1194	803492136048	Ceiling and Wall Register	14 x 6 wall ceiling register	6	1	16.97	\N	Stockroom	\N	\N	2025-06-02 11:56:10.338248	\N	\N
491	300025A	Photo Control Eye-K4221C-4236S	\N	6	1	19.00	\N	Stockroom A-503	\N	\N	2025-03-31 17:33:35.539212	\N	\N
914	680004	Snap Hose Connectors	\N	7	1	8.15	\N	Stockroom A-926	\N	\N	2025-03-31 17:34:12.345715	\N	\N
1198	017053280013	Elongated toilet seat	BEM1955CT Open Front	10	2	25.00	\N	Stockroom - Shelf K4	\N	\N	2025-06-03 15:49:32.644983	\N	\N
139	150017	#10 and #12 Sheet Metal Screws - box	\N	2	1	0.12	\N	Stockroom A-150	\N	\N	2025-03-31 17:33:05.104188	\N	\N
134	150007	#12 Self Drilling Screws-box	\N	2	1	0.12	\N	Stockroom A-145	\N	\N	2025-03-31 17:33:04.674856	\N	\N
135	150008	#14 Self-Drilling Screws -box	\N	2	1	0.12	\N	Stockroom A-146	\N	\N	2025-03-31 17:33:04.76034	\N	\N
1167	8 1RBT5	1" Hinge	1RBT5C	10	1	3.00	\N	Stockroom	\N	\N	2025-05-12 19:16:52.568915	\N	\N
329	200142	Toilet Bolts(johnny)-Toilet Seat Bolts-White Bolt caps - per pack	\N	37	1	2.02	\N	Stockroom A-341	\N	\N	2025-03-31 17:33:21.516722	\N	\N
794	350131A	50PAR20 Halogen/ 39PAR20 Halogen	\N	15	1	8.62	\N	Stockroom A-806	\N	\N	2025-03-31 17:34:01.853158	\N	\N
1154	718205662861	Leather Work Gloves		4	1	4.90	\N	Stockroom - Shelf T2	\N	\N	2025-05-01 11:50:31.668783	1	306
24	100078	Plumbers Roll-Sandpaper	\N	18	1	2.20	\N	Stockroom A-35	\N	\N	2025-03-31 17:32:55.029459	\N	\N
593	300434	Outside Box-Red Dot	\N	20	1	1.75	\N	Stockroom A-605	\N	\N	2025-03-31 17:33:44.39531	\N	\N
257	180002	All Sizes of Finishing Washers - per box	\N	20	1	2.88	\N	Stockroom A-268	\N	\N	2025-03-31 17:33:15.29987	\N	\N
1195	026607000236	Toilet bolts	68-7328	3	1	7.64	\N	Stockroom - Shelf J1	\N	\N	2025-06-02 18:24:14.315449	\N	\N
522	300096	Split Bolt Connector	\N	21	1	2.43	\N	Stockroom A-534	\N	\N	2025-03-31 17:33:38.252155	\N	\N
936	720091	All Caulking -tube or cartridge -silicone/acrylic latex	\N	19	1	3.79	\N	Stockroom A-948	\N	\N	2025-03-31 17:34:14.280219	\N	\N
704	350004	FT36/DL/835 twin fluorescent lamp	\N	26	1	7.88	\N	Stockroom A-716	\N	\N	2025-03-31 17:33:54.125214	\N	\N
1192	078477712764	White GFCI Receptacle	GFRST20W Leviton GFCI self testing outlet	14	2	16.20	\N	Stockroom - Shelf N2	\N	\N	2025-06-02 11:21:01.240878	\N	\N
1182	724049291709	ProPress 90 elbow	EZPE068	32	4	4.84	\N	Stockroom	\N	\N	2025-05-27 11:19:25.710245	\N	\N
125	122331B	Microwave Bulb	\N	36	1	2.24	\N	Stockroom A-136	\N	\N	2025-03-31 17:33:03.90382	1	300
1200	10739236501643	Drain Gasket	290-20320	100	10	1.06	\N	Stockroom - Shelf I1	\N	\N	2025-06-04 17:27:46.015397	\N	\N
1196	X00466VG9T	Candalabra LED bulb	X00466vg9t 5000k	20	4	1.42	\N	Stockroom	\N	\N	2025-06-02 18:31:47.934383	\N	\N
1217	070798006836	White silicone 2.8 fl oz	dap all purpose white silicone 100% silicone	2	2	10.00	\N	Stockroom	\N	\N	2025-06-27 13:28:09.320957	1	\N
1202	G600	Metal Electrical box	Southwire 9 cubic inch metal electrical box	5	10	1.62	\N	Stockroom - Shelf N1	\N	\N	2025-06-09 17:24:59.037583	\N	\N
1224	X004M0WQV1	Magnetic shower tape	\N	4	2	22.95	\N	Stockroom - Shelf K1	\N	\N	2025-07-02 18:07:57.959476	1	180
1225	80785592601006	DP switch box	2 1/2" metal switch box	30	6	5.00	\N	Stockroom - Shelf M1	\N	\N	2025-07-02 18:12:12.925209	1	265
165	150119B	3/8 Coupling Nuts -each	\N	13	1	0.15	\N	Stockroom A-176	\N	\N	2025-03-31 17:33:07.352875	\N	\N
1249	1 3L220	3L220 V Belt	Dayton 3L220 V Belt	2	2	5.66	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 15:30:06.194961	1	167
256	168220	All CPVC fittings	\N	65	1	1.26	\N	Stockroom A-267	\N	\N	2025-03-31 17:33:15.208846	\N	\N
1250	1 3L240	3L240 V Belt	Dayton 3L240 V Belt	3	2	5.51	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 16:32:50.697845	1	167
1213	200026A	Bathtub Toe Tap Replacement/Foot Stop Cartridge - 479330	\N	0	1	9.24	\N	\N	\N	\N	2025-06-17 18:01:13.939544	\N	\N
1216	070798006843	clear silicone 2.8 fl oz	dap all purpose 100% silicone	7	2	10.00	\N	Stockroom	\N	\N	2025-06-27 13:25:40.977387	1	306
1228	072053017519	A49 V Belt	Gates A49 HI-Power II V Belt	3	2	10.89	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 14:10:40.097665	1	167
95	100562	Assorted Snap-spring link-quick link	\N	230	1	2.14	\N	Stockroom A-106	\N	\N	2025-03-31 17:33:01.287132	\N	\N
1177	670240552081	3.5 Diaphragm Kit	Zurn Aqua flush P6000-ECR-WS	0	2	30.52	\N	Stockroom - Shelf I3	\N	\N	2025-05-21 16:15:22.591595	\N	\N
1251	038244069392	3L330 V Belt	Dayco 3L330 V Belt	2	2	6.42	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 16:36:16.571678	1	167
10	100049A	Screw Eyes-each	\N	265	1	0.08	\N	Stockroom A-21	\N	\N	2025-03-31 17:32:53.821866	\N	\N
1211	SAMPLE001	Sample Part	This is an example part for import	100	10	5.99	Hardware	Stockroom	Example Supplier	\N	2025-06-17 17:44:24.66069	\N	\N
1148	3KLF2	Zurn water closet flush valve Z6000-YB-YC		6	1	110.55	\N	Stockroom - Shelf K3	\N	\N	2025-04-09 12:20:35.028849	1	182
1169	Wx107	Wx-107 Waste Toner	Wx-107 Waste Toner Cartridge	1	1	0.00	\N	Stockroom	\N	\N	2025-05-13 17:39:52.901893	\N	\N
1230	038244144341	A59 V Belt	dayco super v belt	3	2	12.80	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 14:21:24.247474	1	167
1231	662289288311	A61 V Belt	Browning A61 V Belt	2	2	13.55	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 14:41:08.599169	1	167
1205	085267183925	T6 Pro Smart Thermostat	Honeywell Home smart programmable thermostat TH6220WF2006	3	2	140.08	\N	Stockroom - Shelf O3	\N	\N	2025-06-12 16:24:27.157138	\N	\N
1155	718205850367	Tinted Safety Glasses	\N	4	1	3.10	\N	\N	\N	\N	2025-05-01 11:56:53.173394	\N	\N
1209	033056043998	Lucerne Sink	Wall hung 20x18	3	2	75.00	\N		\N	\N	2025-06-17 11:52:27.999856	\N	\N
1199	073088156631	Toilet Seat	Bemis 1200E4 Elongated slow close	5	2	45.00	\N	Stockroom - Shelf K4	\N	\N	2025-06-03 15:50:59.555283	\N	\N
1201	500EC	Round toilet seat	Bemis 500EC 000 Toilet Seat	6	1	15.22	\N	Stockroom - Shelf K4	\N	\N	2025-06-05 19:26:43.95018	\N	\N
1207	UI76585459	Faucet Cartridge	RK7300-CART-3P	6	2	56.00	\N	Stockroom - Shelf J3	\N	\N	2025-06-12 16:44:35.206054	\N	\N
1206	098188735074	Control stop repair kit	Zurn 4HCU8 P6000-D-SD 10989000	11	5	12.00	\N	Stockroom - Shelf I3	\N	\N	2025-06-12 16:36:08.414769	\N	\N
1232	662289138340	A62 V Belt	Browning A62 V Belt	4	2	13.55	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 14:44:44.014131	1	167
1257	000.000.156	3L570 V Belt	Napa Modac 3L570 V Belt	2	2	10.92	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 16:57:25.359882	1	167
1258	1 5TXL1	BX25 V Belt	Dayton BX25 V Belt	2	2	9.63	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 16:59:30.222584	1	167
1236	1 1A104	B61 V Belt	Dayton B61 V Belt	3	2	19.40	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 14:57:03.646583	1	167
1214	662545040349	Boiler Drain	1/2" boiler drain, male threads	10	2	7.38	\N	Stockroom - Shelf K2	\N	\N	2025-06-25 12:45:08.818165	1	181
1203	TN324K	TN324 JK	Black Toner	4	4	0.00	\N		\N	\N	2025-06-11 14:48:33.213078	\N	\N
1238	685744720645	B64 V Belt	Dayco B64 V Belt	2	2	19.88	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 15:04:31.520938	1	167
204	156064	All Copper 90's and ST	\N	63	1	4.21	\N	Stockroom A-215	\N	\N	2025-03-31 17:33:10.718088	\N	\N
1223	X000OINMO5	Chrome Shower head	S-H100, High Flow Chrome Shower Head, Not Zurn. 2.5 gpm	1	2	18.00	\N	Stockroom - Shelf I3	\N	\N	2025-07-02 17:59:43.7364	1	174
1215	047871330836	Smoke and Carbon monoxide alarm	Kidde FireX dual smoke and carbon monoxide detector	0	1	65.00	\N	Stockroom	\N	\N	2025-06-27 13:19:16.389107	1	\N
1219	1 3GWG4	A21 V belt	\N	2	2	6.57	\N	Stockroom - Shelf E1	\N	\N	2025-07-02 15:31:56.452454	1	167
1222	1 3X471	A46 V belt	\N	3	2	10.89	\N	Stockroom - Shelf E1	\N	\N	2025-07-02 15:41:21.770638	1	167
1185	TN328M	TN328M toner	\N	0	1	0.00	\N	Stockroom	\N	\N	2025-05-27 14:47:32.421029	\N	\N
524	300134	1/2''-3/8''MC Tite Bite Connectors	\N	242	1	1.50	\N	Stockroom A-536	\N	\N	2025-03-31 17:33:38.423522	\N	\N
1246	1 3L150	3L150 V Belt	Dayton 3L150 V Belt	4	2	6.16	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 15:24:15.023113	1	167
1259	1 6A124	BX38 V Belt	Dayton BX38 V Belt	4	2	17.50	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 17:01:28.100748	1	167
1260	662289294985	BX46 V Belt	Browning BX46 V Belt	7	2	19.82	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 17:03:44.909151	1	167
1264	662289175116	BX64 V Belt	Browning BX64 V Belt	7	2	26.76	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 17:13:20.208718	1	167
1265	1 6L280	BX66 V Belt	Dayton BX66 V Belt	2	2	24.87	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 17:32:25.13498	1	167
1266	1 6A132	BX68 V Belt	Dayton BX68 V Belt	3	2	27.41	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 17:35:12.223863	1	167
1208	X004MOP385	Light diffuser	12X12 light diffuser ceiling light shade glass light cover	7	2	20.20	\N	Stockroom - Shelf H4	\N	\N	2025-06-16 19:36:58.070917	\N	\N
1248	1 3L180	3L180 V Belt	Dayton 3L180 V Belt	1	1	6.06	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 15:27:42.458977	1	167
1227	662289178131	A48 V Belt	Browning A48 V belt	1	1	11.02	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 14:06:11.135726	1	167
1244	072053018370	B136 V Belt	Gates B136 V Belt	1	1	40.75	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 15:17:58.646918	1	167
1240	1 3X644	B78 V Belt	Dayton B78 V Belt	1	1	24.66	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 15:08:50.566587	1	167
1261	662460346526	BX47 V Belt	Browning BX47 V Belt	1	1	20.53	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 17:06:15.962573	1	167
1263	000.000.161	BX52 V Belt	PIX BX52 V Belt	1	1	21.84	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 17:10:57.547621	1	167
514	300083	1/2-3/8 Romex Connectors	\N	118	1	0.65	\N	Stockroom A-526	\N	\N	2025-03-31 17:33:37.531932	\N	\N
1220	1 3X697	A26 V belt	\N	3	2	7.89	\N	Stockroom - Shelf E1	\N	\N	2025-07-02 15:33:18.498067	1	167
1226	045923294051	6.5 watt LED bulb	Par20/FL	10	4	12.00	\N	Stockroom - Shelf L2	\N	\N	2025-07-02 18:17:37.727312	1	275
1233	662289158515	A81 V Belt	Browning A81 V Belt	4	2	17.90	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 14:47:30.740674	1	167
1156	718205850350	Clear Safety Glasses	\N	4	1	2.00	\N	\N	\N	\N	2025-05-01 12:00:16.089462	\N	\N
224	159716	1 1/2 BI nipples	\N	38	1	2.27	\N	Stockroom A-235	\N	\N	2025-03-31 17:33:12.436315	\N	\N
223	159700	1 1/4 BI nipples	\N	51	1	1.84	\N	Stockroom A-234	\N	\N	2025-03-31 17:33:12.349258	\N	\N
727	350042B	F54T5/841/HO	\N	116	1	4.00	\N	Stockroom A-739	\N	\N	2025-03-31 17:33:56.100609	\N	\N
1237	1 3X613	B62 V Belt	Dayton B62 V Belt	3	2	19.41	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 14:58:45.067218	1	167
1245	662289309610	B150 V Belt	Browning B150 V Belt	2	2	47.16	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 15:19:38.811457	1	167
1247	662289264988	3L170 V Belt	Browning 3L170 V Belt	2	2	6.42	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 15:26:00.564355	1	167
1252	1 3L350	3L350 V Belt	Dayton 3L350 V Belt	2	2	6.86	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 16:37:52.453152	1	167
1262	072053204018	BX48 V Belt	Gates BX48 V Belt	4	2	21.08	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 17:07:32.557174	1	167
1267	072053457261	BX74 V Belt	Gates BX74 V Belt	2	2	26.21	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 17:36:50.545497	1	167
1268	662289295135	BX75 V Belt	Browning BX75 V Belt	5	2	27.74	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 17:43:52.447861	1	167
1269	662289145164	BX77 V Belt	Browning BX77 V Belt	2	2	28.54	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 17:48:18.645389	1	167
1270	662289155279	BX81 V Belt	Browning BX81 V Belt	3	2	33.00	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 17:53:01.164958	1	167
1272	1 13W531	BX88 V Belt	Dayton BX88 V Belt	5	2	39.24	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 18:19:43.178497	1	167
1273	662289175345	BX103 V Belt	Browning BX103 V Belt	2	2	45.40	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 18:22:17.077444	1	167
1274	1 459P41	BX113 V Belt	Continental BX113 V Belt	6	2	42.57	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 18:26:46.331715	1	167
1275	662460414638	AX20 V Belt	Browning AX20 V Belt	3	2	9.78	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 18:30:35.057047	1	167
1281	662460414737	AX52 V Belt	Browning AX52 V Belt	2	2	14.82	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 18:51:26.959093	1	167
1282	662289144785	AX60 V Belt	Browning AX60 V Belt	4	2	16.64	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 18:54:18.043883	1	167
1284	662460414881	AX81 V Belt	Browning AX81 Belt	2	2	31.33	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 19:06:46.977811	1	167
1285	662289359622	BX115 V Belt	Browning BX115 V Belt	2	2	45.17	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 19:10:49.213523	1	167
1286	662289185351	BX120 V Belt	Browning BX120 V Belt	2	2	46.38	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 19:13:40.731847	1	167
1278	662289284610	AX31 V Belt	Browning AX31 V Belt	1	1	11.74	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 18:36:32.741205	1	167
1239	1 3X643	B75 V Belt	Dayton B75 V Belt	1	1	21.66	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 15:05:43.945654	1	167
1241	662289179404	B96 V Belt	Browning B96 V Belt	1	1	30.47	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 15:10:18.451402	1	167
1229	1 6X565	A53 V Belt	Dayton A53 V Belt	6	2	12.34	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 14:12:31.87695	1	167
1280	662289254743	AX51 V Belt	Browning AX51 V Belt	1	2	15.51	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 18:40:05.475649	1	167
1525	883778101601	Ivory, Single Gang, Toggle Switch Cover	Hubbell Ivory, Single Gang, Flush Device, Toggle Switch Cover Plate	110	2	0.44	\N	Stockroom - Shelf N3	\N	\N	2025-07-30 14:44:21.457664	1	282
1210	033056025222	Aqualyn Sink	Countertop 20x17	3	1	88.00	\N		\N	\N	2025-06-17 11:53:29.32253	\N	\N
1221	1 1A109	A40 V belt	\N	2	2	9.56	\N	Stockroom - Shelf E1	\N	\N	2025-07-02 15:34:20.109282	1	167
1234	662289158973	B46 V Belt	Browning B46 V Belt	2	2	16.40	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 14:51:54.694811	1	167
1242	662460628912	B110 V Belt	Browning B110 V Belt	3	2	30.61	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 15:11:53.617069	1	167
1253	038244069477	3L410 V Belt	Dayco 3L410 V Belt	2	2	8.43	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 16:39:09.63529	1	167
1271	1 3GXC1	BX84 V Belt	Dayton BX84 V Belt	2	2	32.13	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 17:54:40.995625	1	167
1276	662460414645	AX25 V Belt	Browning AX25 V Belt	2	2	10.30	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 18:31:45.579739	1	167
1279	662289194605	AX35 V Belt	Browning AX35 V Belt	5	2	11.50	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 18:38:14.489536	1	167
119	120041A	All Continuous Hinges -each	\N	7	1	14.30	\N	Stockroom A-130	\N	\N	2025-03-31 17:33:03.349035	\N	\N
291	200075A	1 1/2 Spud Escutcheon & Coupling	\N	9	1	11.99	\N	Stockroom A-302	\N	\N	2025-03-31 17:33:18.217781	\N	\N
302	200091	All Cartridge Kits	\N	12	1	4.13	\N	Stockroom A-313	\N	\N	2025-03-31 17:33:19.176788	\N	\N
1283	662289274734	AX62 V Belt	Browning AX62 V Belt	2	2	17.14	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 18:55:35.772929	1	167
1287	1 459P48	BX133 V Belt	Continental BX133 V Belt	3	2	49.71	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 19:14:50.338857	1	167
482	280123A	Aqua Flo Connectors -Feed lines - Faucet and Toilet	\N	124	1	3.99	\N	Stockroom A-494	\N	\N	2025-03-31 17:33:34.76371	\N	\N
1235	662289138920	B48 V Belt	Browning B48 V Belt	4	2	17.00	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 14:53:50.51489	1	167
1243	662289149544	B112 V Belt	Browning B112 V Belt	3	2	33.73	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 15:14:13.238056	1	167
396	210103	Handle-Oasis Water Fountain	\N	2	1	55.00	\N	Stockroom A-408	\N	\N	2025-03-31 17:33:27.312005	\N	\N
410	230174	1 1/2'' Copper Pipe-per foot	\N	12	1	6.85	\N	Stockroom A-422	\N	\N	2025-03-31 17:33:28.516172	\N	\N
549	300250	KTK10-ATM10-ATDR10 fuse	\N	14	1	14.72	\N	Stockroom A-561	\N	\N	2025-03-31 17:33:40.589676	\N	\N
1254	662289115242	3L420 V Belt	Browning 3L420 V Belt	2	2	7.57	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 16:40:29.67584	1	167
1277	1 6L233	AX26 V Belt	Dayton AX26 V Belt	3	2	9.95	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 18:32:53.348077	1	167
1288	1 459P49	BX136 V Belt	Continental BX136 V Belt	4	2	56.70	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 19:16:58.281377	1	167
1255	1 3L430	3L430 V Belt	Dayton 3L430 V Belt	3	2	8.61	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 16:42:00.669157	1	167
1289	662289145393	BX144 V Belt	Browning BX144 V Belt	5	2	53.95	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 19:20:18.795316	1	167
1291	000.000.191	5VX1230 V Belt	PIX 5VX1230 V Belt	4	2	96.46	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 19:26:21.768314	1	167
1293	072053290509	5VX1320 V Belt	Gates 5VX1320 V Belt	3	2	90.56	\N	Stockroom - Shelf E1	\N	\N	2025-07-09 12:14:31.377339	1	167
477	250076	Sleeve Bearing Bracket Kit 3/4	\N	1	1	62.00	\N	Stockroom A-489	\N	\N	2025-03-31 17:33:34.334401	\N	\N
484	290001	1/2'' Black Pipe	\N	0	1	0.96	\N	Stockroom A-496	\N	\N	2025-03-31 17:33:34.939014	\N	\N
486	290004	1 1/4'' Black Pipe Nipple	\N	6	1	5.60	\N	Stockroom A-498	\N	\N	2025-03-31 17:33:35.111638	\N	\N
468	250060	B&G Impeller 186368	\N	2	1	149.00	\N	Stockroom A-480	\N	\N	2025-03-31 17:33:33.519535	\N	\N
962	860016	Stops -Pro Stops -Angle and Straight	\N	114	1	5.04	\N	Stockroom A-974	\N	\N	2025-03-31 17:34:16.521859	\N	\N
1297	1 4L220	4L220 V Belt	Dayton 4L220 V Belt	6	2	6.12	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 12:33:50.548247	1	166
1302	662289225552	4L270 V Belt	Browning V Belt	6	2	6.76	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 12:46:31.549136	1	166
1305	1 4L300	4L300 V Belt	Dayton 4L300 V Belt	6	2	7.63	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 12:55:38.125279	1	166
1306	662289265596	4L310 V Belt	Browning 4L310 V Belt	3	2	7.83	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 12:59:29.762608	1	166
1309	1 4L340	4L340 V Belt	Dayton 4L340 V Belt	2	2	8.22	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 13:04:28.667432	1	166
1312	1 4L380	4L380 V Belt	Dayton 4L380 V Belt	3	2	7.88	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 13:10:51.814012	1	166
1314	046684544003	4L400 V Belt	Service King 4L400 V Belt	3	2	8.22	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 13:15:05.642611	1	166
1315	662289185696	4L410 V Belt	Browning 4L410 V Belt	3	2	8.69	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 13:18:09.373791	1	166
1318	662289145706	4L440 V Belt	Browning 4L440 V Belt	2	2	9.27	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 13:23:38.496428	1	166
1319	662289275724	4L450 V Belt	Browning 4L450 V Belt	3	2	9.78	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 13:26:27.623986	1	166
1320	038244080731	4L460 V Belt	Dayco 4L460 V Belt	5	2	9.43	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 13:28:26.365745	1	166
1321	662289225781	4L470 V Belt	Browning 4L470 V Belt	2	2	11.15	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 13:31:11.368726	1	166
1323	662289285761	4L490 V Belt	Browning 4L490 V Belt	2	2	10.15	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 13:34:18.100176	1	166
1324	662289135790	4L500 V Belt	Browning 4L500 V Belt	2	2	9.85	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 13:36:19.758052	1	166
1328	662289215805	4L540 V Belt	Browning 4L540 V Belt	2	2	10.33	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 13:42:30.900665	1	166
1330	1 4L560	4L560 V Belt	Dayton 4L560 V Belt	3	2	10.20	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 13:47:07.923469	1	166
1331	1 4L570	4L570 V Belt	Dayton 4L570 V Belt	3	2	10.76	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 13:51:43.914829	1	166
1333	1 4L590	4L590 V Belt	Dayton 4L590 V Belt	4	2	11.47	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 13:55:33.454584	1	166
1335	1 4L610	4L610 V Belt	Dayton 4L610 V Belt	5	2	15.48	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 13:59:45.694124	1	166
1337	1 4L630	4L630 V Belt	Dayton 4L630 V Belt	2	2	13.70	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 14:03:33.978194	1	166
1338	1 4L650	4L650 V Belt	Dayton 4L650 V Belt	2	2	12.70	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 14:09:18.696248	1	166
1339	1 4L670	4L670 V Belt	Dayton 4L670 V Belt	4	2	15.02	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 14:12:03.754717	1	166
1341	685744740766	4L760 V Belt	Dayco 4L760 V Belt	3	2	12.73	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 14:16:59.527797	1	166
1342	1 4L790	4L790 V Belt	Dayton 4L790 V Belt	3	2	13.78	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 14:19:59.045932	1	166
1353	1 5L650	5L650 V Belt	Dayton 5L650 V Belt	2	2	22.99	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 14:37:28.819015	1	166
1355	000.000.094	5L940 V Belt	General Utility 5L940 V Belt	2	2	22.12	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 14:40:45.429031	1	166
1360	781087080726	2S28 Ballast	120V to 277V, Advance ICN-2S28-N Programmed Start Electronic Ballast	9	2	40.00	\N	Stockroom - Shelf S2	\N	\N	2025-07-10 14:03:23.597942	1	303
1361	046135494123	2X28 T5 Ballast	120V to 277V, Sylvania QS2X28T5/UNV PS95-SC 2-Lamp Stepped-Switching Programmed Start Electronic Ballast	2	2	78.50	\N	Stockroom - Shelf S2	\N	\N	2025-07-10 14:11:22.417273	1	303
1371	046135518331	2X26 CF Ballast	120V to 277V, Quicktronic QTP 2X26CF UNV DM Fluorescent Lamp Ballast	7	2	27.85	\N	Stockroom - Shelf S2	\N	\N	2025-07-10 15:31:46.487242	1	303
1364	781087110560	2S54 Ballast	120V to 277V, Advance ICN-2S54-N Programmed Start Electronic Ballast	2	2	35.00	\N	Stockroom - Shelf S2	\N	\N	2025-07-10 14:51:04.681123	1	303
1366	781087065341	2TTP40 Ballast	120V to 277V, Philips Advance ICN-2TTP40-SC Instant Start Electronic Ballast	9	2	40.95	\N	Stockroom - Shelf S2	\N	\N	2025-07-10 15:12:42.343042	1	303
1369	046135494291	2X40 DL Ballast	120V to 277V, Quicktronic QHE 2X40DL UNV ISN SC Fluorescent Lamp Ballast	4	2	46.53	\N	Stockroom - Shelf S2	\N	\N	2025-07-10 15:24:54.261607	1	303
1368	781087091494	3P32 Ballast	120V to 277V, Advance ICN-3P32-N Instant Start Electronic Ballast	14	2	26.86	\N	Stockroom - Shelf S2	\N	\N	2025-07-10 15:20:15.404177	1	303
1363	NAU342RS-ROHS	NAU342RS-ROHS Ballast	120V to 277V, Sage Lighting NAU342RS-ROHS Electronic Ballast	2	2	180.66	\N	Stockroom - Shelf S2	\N	\N	2025-07-10 14:23:08.743427	1	303
1365	781087138922	R-140-1-TP Ballast	120V, Advance Transformer Co. R-140-1-TP Rapid Start Ballast	6	2	31.50	\N	Stockroom - Shelf S2	\N	\N	2025-07-10 15:06:22.076068	1	303
1367	781087048856	REL-2P59-S-RH-TP Ballast	120V, Advance Transformer Co. REL-2P59-S-RH-TP Instant Start Electronic Ballast	4	2	20.00	\N	Stockroom - Shelf S2	\N	\N	2025-07-10 15:16:05.616142	1	303
1372	781087091517	4P32 Ballast	120V to 277V, Advance ICN-4P32-N Instant Start Electronic Ballast	8	2	19.47	\N	Stockroom - Shelf S2	\N	\N	2025-07-10 15:44:57.437543	1	303
1298	662289165513	4L230 V Belt	Browning 4L230 V Belt	1	1	6.75	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 12:35:44.486894	1	166
1303	662289155583	4L280 V Belt	Browning 4L280 V Belt	1	1	7.03	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 12:51:26.663578	1	166
1317	662289295777	4L430 V Belt	Browning 4L430 V Belt	1	1	8.75	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 13:21:55.854339	1	166
1329	1 4L550	4L550 V Belt	Dayton 4L550 V Belt	1	1	11.28	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 13:44:42.607113	1	166
1343	000.000.085	5L310 V Belt	NAPA 5L310 V Belt	1	1	8.97	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 14:22:23.452875	1	166
1346	000.000.086	5L320 V Belt	NAPA 5L320 V Belt	1	1	11.50	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 14:25:53.372522	1	166
1256	038244069514	3L440 V Belt	Dayco 3L440 V Belt	2	2	8.33	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 16:46:05.209264	1	167
1290	662289039203	5VX830 V Belt	Browning 5VX830 V Belt	5	2	64.31	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 19:23:04.07211	1	167
723	350029A	Exit Light Retrofit Kit-TCP 20715	\N	2	1	18.10	\N	Stockroom A-735	\N	\N	2025-03-31 17:33:55.751941	\N	\N
545	300218	Extension Socket-Metal Halide	\N	7	1	11.00	\N	Stockroom A-557	\N	\N	2025-03-31 17:33:40.221231	\N	\N
528	300161	V5711RH or V5711LH wiremold elbow	\N	8	1	5.00	\N	Stockroom A-540	\N	\N	2025-03-31 17:33:38.764268	\N	\N
521	300092A	1'' EMT coupling	\N	18	1	0.61	\N	Stockroom A-533	\N	\N	2025-03-31 17:33:38.165237	\N	\N
532	300171A	5738 Wiremold Box	\N	22	1	1.35	\N	Stockroom	\N	\N	2025-03-31 17:33:39.10487	\N	\N
1299	1 4L240	4L240 V Belt	Dayton 4L240 V Belt	4	2	6.93	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 12:39:12.420053	1	166
1304	662289285532	4L290 V Belt	Browning 4L290 V Belt	2	2	6.85	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 12:53:34.572887	1	166
1307	1 4L320	4L320 V Belt	Dayton 4L320 V Belt	2	2	7.19	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 13:01:20.2782	1	166
1311	1 4L370	4L370 V Belt	Dayton 4L370 V Belt	4	2	8.41	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 13:08:29.432663	1	166
1313	1 4L390	4L390 V Belt	Dayton 4L390 V Belt	2	2	8.54	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 13:12:30.234228	1	166
1316	662289165742	4L420 V Belt	Browning 4L420 V Belt	2	2	8.68	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 13:19:34.570648	1	166
1322	1 4L480	4L480 V Belt	Dayton 4L480 V Belt	4	2	9.54	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 13:32:16.77971	1	166
1332	1 4L580	4L580 V Belt	Dayton 4L580 V Belt	2	2	10.85	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 13:53:01.735664	1	166
1336	1 4L620	4L620 V Belt	Dayton 4L620 V Belt	5	2	13.11	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 14:02:06.285691	1	166
1340	1 4L710	4L710 V Belt	Dayton 4L710 V Belt	3	2	11.61	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 14:13:56.154857	1	166
1347	072053005141	5L340 V Belt	Gates 5L340 V Belt	2	2	9.69	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 14:27:23.758183	1	166
1354	1 5L640	5L640 V Belt	Dayton 5L640 V Belt	2	2	16.39	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 14:38:30.631548	1	166
1358	781087074060	1P32 Ballast	120V to 277V, Philips Advance ICN-1P32-N Instant Start Electronic Ballast	6	2	30.46	\N	Stockroom - Shelf S2	\N	\N	2025-07-10 13:44:17.7001	1	303
1373	046135498558	3X32 T8 Ballast	120V to 277V, Osram Quicktronic QHE 3X32T8/UNV ISN-SC Fluorescent Lamp Ballast	5	2	35.00	\N	Stockroom - Shelf S2	\N	\N	2025-07-10 15:48:35.376698	1	303
1370	781087065099	3TTP40 Ballast	120V to 277V, Advance ICN-3TTP40-SC Instant Start Electronic Ballast	3	2	41.37	\N	Stockroom - Shelf S2	\N	\N	2025-07-10 15:27:18.742171	1	303
1374	QT 2X32/120 IS	QT 2X32/120 IS Ballst	120V, Sylvania Quicktronic QT 2X32/120 IS 2-Lamp Instant Start Electronic Ballast	3	2	28.95	\N	Stockroom - Shelf S2	\N	\N	2025-07-10 15:52:46.347033	1	303
1379	734832019618	HP226SP 3P10085 Ballast	120V, Robertson HP226SP 3P10085 High Power Factor Preheat Start Ballast	2	2	79.50	\N	Stockroom - Shelf S1	\N	\N	2025-07-10 17:32:38.786966	1	302
1378	872180100012	WH1-120-L Ballast	120V, Fulham Workhorse WH1-120-L Solid State Electronic Ballast	3	2	28.98	\N	Stockroom - Shelf S1	\N	\N	2025-07-10 17:28:03.226929	1	302
1377	872180100760	WH33-120-L Ballast	120V, Fulham Workhorse WH33-120-L Solid State Electronic Ballast	4	2	43.68	\N	Stockroom - Shelf S1	\N	\N	2025-07-10 17:24:42.720138	1	302
1376	781087050521	4S40 Ballast	120V, Advance R-4S40-A-TP-AC Rapid Start Ballast	3	2	200.00	\N	Stockroom - Shelf S1	\N	\N	2025-07-10 16:00:31.087147	1	302
1380	781087047866	4S54 Ballast	120V to 277V, Philips Advance ICN-4S54-90C-2LS-G Programmed Start Electronic Ballast	2	2	101.02	\N	Stockroom - Shelf S1	\N	\N	2025-07-10 17:39:40.665078	1	302
1381	781087105320	RL-140-TP Ballast	120V, Philips Advance RL-140-TP Rapid Start Ballast	5	2	56.50	\N	Stockroom - Shelf S1	\N	\N	2025-07-10 17:45:05.454997	1	302
1382	781087102947	2S42 Ballast	120V to 277V, Advance ICF-2S42-M2-LD Programmed Start Electronic Ballast	3	2	49.68	\N	Stockroom - Shelf S1	\N	\N	2025-07-10 19:13:20.218778	1	302
1383	781087131787	2S54 Ballast	120V to 277V, Advance ICN-2S54-T Programmed Start Electric Ballast	5	2	52.01	\N	Stockroom - Shelf S1	\N	\N	2025-07-10 19:16:37.279681	1	302
1384	781087101728	RLQ-129-TP Ballast	120V, Philips Advance RLQ-120-TP Rapid Start Ballast	2	2	24.99	\N	Stockroom - Shelf S1	\N	\N	2025-07-10 19:21:04.222565	1	302
1385	781087101308	LC-14-20-C Transformer/Ballast	120V, Advance LC-14-20-C Type 1 Outdoor Transformer/Ballast	6	2	29.95	\N	Stockroom - Shelf S1	\N	\N	2025-07-10 19:29:39.390511	1	302
1386	872180103754	WH5-120-L Ballast	120V, Fulham Workhorse WH5-120-L Solid State Ballast	3	2	32.49	\N	Stockroom - Shelf S1	\N	\N	2025-07-10 19:33:05.886384	1	302
1387	781087106983	3S32 Ballast	277V, Advance VEZ-3S32-SC Dimmable Programmed Start Electronic Ballast	6	2	87.48	\N	Stockroom - Shelf S1	\N	\N	2025-07-10 19:37:19.483736	1	302
1388	046135491702	1X28 T5 Ballast	120V to 277V, Osram Quicktronic QTP 1X28T5/UNV PSN Fluorescent Lamp Ballast	2	2	19.95	\N	Stockroom - Shelf S1	\N	\N	2025-07-10 19:40:44.791303	1	302
1389	046135491801	2X28 T5 Ballast	120V to 277V, Quicktronic QTP 2X28T5 UNV PSN Fluorescent Lamp Ballast	1	2	49.99	\N	Stockroom - Shelf S1	\N	\N	2025-07-10 19:45:02.42973	1	302
1391	768386198321	B228PUNV-C Ballast	120V to 277V, Universal B228PUNV-C Programmed Rapid Start Electronic Ballast	1	2	75.91	\N	Stockroom - Shelf S1	\N	\N	2025-07-10 19:52:32.323563	1	302
1392	781087119044	2S54 Ballast	120V to 277V, Philips Advance ICN-2S54-90C Programmed Start Electronic Ballast	1	2	33.00	\N	Stockroom - Shelf S1	\N	\N	2025-07-10 19:55:11.955657	1	302
1393	781087106327	2SP20 Ballast	120V, Philips Advance RL-2SP20-TP Rapid Start Ballast With Preheat Lamps	4	2	28.99	\N	Stockroom - Shelf S1	\N	\N	2025-07-10 19:58:15.825224	1	302
1394	306260003	HP213P Ballast	120V, Robertson HP213P Simple Reactance Ballast	5	2	94.00	\N	Stockroom - Shelf S1	\N	\N	2025-07-10 20:01:02.132082	1	302
1334	1 4L600	4L600 V Belt	4L600 V Belt Dayton premium	4	2	10.47	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 13:57:08.332312	1	166
1395	781087114537	1T42 Ballast	120V, Philips Advance REZ-1T42-M2-LD Dimmable Programmed Start Electronic Ballast	4	2	87.63	\N	Stockroom - Shelf S1	\N	\N	2025-07-15 16:46:40.881637	1	302
1356	000.000.085B	5L400 V Belt	NAPA 5L400 V Belt	1	1	10.74	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 14:42:00.62013	1	166
1294	029769327067	5VX1400 V Belt	NAPA 5VX1400 V Belt	1	1	105.01	\N	Stockroom - Shelf E1	\N	\N	2025-07-09 12:20:11.77447	1	167
1292	1 3X475	B50 V Belt	Dayton B50 V Belt	1	1	17.16	\N	Stockroom - Shelf E1	\N	\N	2025-07-08 19:28:12.876941	1	167
1375	768386254140	C2642UNVME Ballast	120V to 277V, Triad C2642UNVME Electronic Ballast	2	2	24.48	\N	Stockroom - Shelf S2	\N	\N	2025-07-10 15:56:46.835638	1	303
1295	1 4L200	4L200 V Belt	Dayton 4L200 V Belt	3	2	6.85	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 12:24:29.74764	1	166
1300	1 4L250	4L250 V Belt	Dayton 4L250 V Belt	3	2	6.63	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 12:41:13.194637	1	166
1348	072053005172	5L370 V Belt	Gates 5L370 V Belt	3	2	10.20	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 14:29:10.611426	1	166
582	300333	T8400 Digital Electronic Stat	\N	3	1	143.00	\N	Stockroom A-594	\N	\N	2025-03-31 17:33:43.433525	\N	\N
578	300332F	TH5220 Large Display Stat-Pro 5000	\N	4	1	105.00	\N	Stockroom A-590	\N	\N	2025-03-31 17:33:43.074237	\N	\N
604	310035G	1224I-4 way switch	\N	6	1	12.03	\N	Stockroom A-616	\N	\N	2025-03-31 17:33:45.390963	\N	\N
628	311017N	Lutron T539-120 Dimming (HML)	\N	6	1	165.00	\N	Stockroom A-640	\N	\N	2025-03-31 17:33:47.446469	\N	\N
1359	046135758713	2X28 T5 Ballast	120V to 277V, Ledvance LHE2X28T5UNVPSN 2-Lamp Program Rapid Start Electronic Ballast	8	2	22.50	\N	Stockroom - Shelf S2	\N	\N	2025-07-10 13:51:10.074571	1	303
1396	890949002803	KTEB-240-UV-TP-PIC Ballast	120V to 277V, Keystone KTEB-240-UV-TP-PIC Rapid Start Electronic Ballast	1	2	23.00	\N	Stockroom - Shelf S1	\N	\N	2025-07-15 16:50:06.871453	1	302
1397	027557791984	EC3T832GU310 Ballast	120V to 277V, Lutron EC3T832GU310 Programmed Rapid Start Electronic Fluorescent Dimming Ballast	1	2	139.00	\N	Stockroom - Shelf S1	\N	\N	2025-07-15 16:57:50.38083	1	302
1398	781087106976	3S32 Ballast	120V, Philips Advance REZ-3S32-SC Dimmable Programmed Start Electronic Ballast	1	2	148.66	\N	Stockroom - Shelf S1	\N	\N	2025-07-15 17:02:13.742495	1	302
1399	2230YG002850	LED25W-36-C0700-D Driver/Ballast	120V to 277V, Thomas Research Products LED25W-36-C0700-D Constant Current Dimmable LED Driver/Ballast	1	2	32.42	\N	Stockroom - Shelf S1	\N	\N	2025-07-15 17:07:10.432714	1	302
1400	027557775076	H3DT832GU310 Ballast	120V to 277V, Lutron H3DT832GU310 Programmed Rapid Start Ballast	4	2	295.86	\N	Stockroom - Shelf S1	\N	\N	2025-07-15 17:11:13.781427	1	302
1326	1 4L520	4L520 V Belt	4L520 V Belt	4	2	10.12	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 13:39:09.763002	1	166
1402	697285607033	Supply Flex Hose	3/4" x 3/4" 18", Sharkbite Supply Flex Hose	1	2	23.99	\N	Stockroom - Shelf I1	\N	\N	2025-07-16 14:51:32.426054	1	172
1404	042867000021	3/4" MIP Water Heater Connector	3/4", 18" long, MIP, Ultracore WHC-118-PP Water Heater Connector	4	2	13.47	\N	Stockroom - Shelf I1	\N	\N	2025-07-16 14:59:48.882267	1	172
1403	697285082342	3/4" FIP Water Heater Connector	3/4" by 3/4", 18" long, FIP, Sharkbite Water Heater Connector	3	2	23.39	\N	Stockroom - Shelf I1	\N	\N	2025-07-16 14:54:57.870892	1	172
1401	697285604612	3/4" FIP Water Heater Connector	3/4" by 3/4", 18" long, FIP, Sharkbite Water Heater Connector with Lever	6	2	25.24	\N	Stockroom - Shelf I1	\N	\N	2025-07-16 14:48:53.952757	1	172
1308	662289305643	4L330 V Belt	Browning 4L330 V Belt	1	1	7.73	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 13:02:27.386246	1	166
1357	000.000.086B	5L350 V Belt	NAPA 5L350 V Belt	1	1	9.92	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 14:43:23.461808	1	166
1159	670240242647	Zurn Elkay Shower Head	Z7000-S5-2.0, Temp-Gard Large Brass Shower Head with Volume Control - 2.0 GPM	2	5	56.00	\N	Stockroom - Shelf I3	\N	\N	2025-05-05 16:41:25.472704	1	174
575	300328	1/2-3/4 Steel Lock Nuts	\N	164	1	0.29	\N	Stockroom A-587	\N	\N	2025-03-31 17:33:42.818349	\N	\N
1301	662289105526	4L260 V Belt	Browning 4L260 V Belt	4	2	6.79	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 12:42:31.388429	1	166
1327	662289305872	4L530 V Belt	Browning 4L530 V Belt	2	2	10.54	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 13:40:27.726107	1	166
1349	072053005165	5L360 V Belt	Gates 5L360 V Belt	4	2	10.04	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 14:30:52.88067	1	166
678	330004	Fuse Holder FEB 11-11-Outside lights	\N	3	1	30.00	\N	Stockroom A-690	\N	\N	2025-03-31 17:33:51.793901	\N	\N
691	330039	AJT30 Dual Element Fuse	\N	7	1	9.29	\N	Stockroom A-703	\N	\N	2025-03-31 17:33:53.000691	\N	\N
690	330035	FRN-10 Fuse	\N	8	1	5.00	\N	Stockroom A-702	\N	\N	2025-03-31 17:33:52.915998	\N	\N
637	311018D	71A5390-71A5750 Bollards -100W	\N	4	1	62.63	\N	Stockroom A-649	\N	\N	2025-03-31 17:33:48.218191	\N	\N
1405	042867000014	3/4" MIP Water Heater Connector	3/4", 12" long, MIP, Ultracore WHC-112-PP Water Heater Connector	1	2	18.00	\N	Stockroom - Shelf I1	\N	\N	2025-07-16 15:08:18.200023	1	172
1406	697285465770	Copper Male Adapter	3/4" by 3/4" MNPT, Sharkbite Copper Male Adapter	2	2	9.49	\N	Stockroom - Shelf I1	\N	\N	2025-07-16 15:12:18.956734	1	172
1408	Z-6001-A-WS	Vacuum Breaker	Zurn Industry Metal Vacuum Breaker	4	2	24.00	\N	Stockroom - Shelf I1	\N	\N	2025-07-16 15:25:59.953961	1	172
1409	66955-201-9	Outside Faucet/Hydrant Repair Parts	Contains #21 O Ring, #7 Operating Coupling, #16 Removeable Seat, #12 Seat Washer Screw, #23 Equa-Balance Seal, #11 Seat Washer, Hydrant Key, #5 Oper Screw Assy	4	2	267.96	\N	Stockroom - Shelf I1	\N	\N	2025-07-16 15:33:40.195517	1	172
1410	670240956186	Hydrant Repair Kit	Zurn HYD-RK-Z1321-CXL Hydrant Repair Kit for Z1321-CXL	2	2	61.99	\N	Stockroom - Shelf I1	\N	\N	2025-07-16 15:35:38.559071	1	172
1411	739236300430	Shower Module Drain	Sioux Chief 825-20P Screw-on Shower Module Drain	4	2	11.07	\N	Stockroom - Shelf I1	\N	\N	2025-07-16 15:51:20.642362	1	172
1407	V-500-AA	Vacuum Breaker	1-1/2" wide, 15" Long, Sloan Metal Vacuum Breaker	3	2	47.15	\N	Stockroom - Shelf I1	\N	\N	2025-07-16 15:20:26.171414	1	172
1414	046224006305	Extension Tubes	All Metal Extension Tubes of Various Lengths	33	2	16.68	\N	Stockroom - Shelf I1	\N	\N	2025-07-16 16:59:17.203154	1	172
1415	077578021195	Garage Door Top & Side Seal	1 3/4" wide, 30' long, Frost King Nail-On Neoprene Rubber	1	1	20.99	\N	Stockroom - Shelf I1	\N	\N	2025-07-16 17:03:56.786452	1	172
1416	27330-6148	Flush Valve Repair Kit	Zurn Aquaflush Replacement Parts	1	2	27.99	\N	Stockroom - Shelf I1	\N	\N	2025-07-16 17:21:41.956835	1	172
1417	29690-1088	B-10-K Parts Kit	Contains 2 #885-45 Bonnet Springs, 2 #974-45 Bonnet Washers, 2 #1015-25 Hose Washers, 2 #1040-45 Bonnet Binding Washers, 2 #1084-45 Seat Washers, 2 #1085-45 Rubber Rings, and 2 #1097-45 Packings	1	2	34.30	\N	Stockroom - Shelf I1	\N	\N	2025-07-16 17:25:53.266735	1	172
1418	DEAP9001	PVC Slip Joint Nut	1 1/2" PVC Slip Joint Nut	5	2	0.58	\N	Stockroom - Shelf I1	\N	\N	2025-07-16 17:28:20.110683	1	172
1419	00026607142110	Slip Joint Nut with Rubber Padding	1 1/2" by 1 1/4", Kissler 744-3202 Slip Joint Nut	3	2	8.34	\N	Stockroom - Shelf I1	\N	\N	2025-07-16 17:33:08.704343	1	172
1420	730284011606	Brass Shower Drain	Wal-Rich 2" No Caulk Brass Shower Drain	5	2	30.23	\N	Stockroom - Shelf I1	\N	\N	2025-07-16 18:11:53.014979	1	172
1421	B007E2N3Q0	Double Flanged Strainer Tailpiece	1 1/2" wide, 16" long, Dearborn Double Flanged Strainer Tailpiece	4	2	5.82	\N	Stockroom - Shelf I1	\N	\N	2025-07-16 18:18:36.780294	1	172
1422	P9793E	Slip Joint Extension Tube	2 3/4" wide, 12" long, Dearborn Slip Joint Extension Tube	11	2	4.24	\N	Stockroom - Shelf I1	\N	\N	2025-07-16 18:22:59.940555	1	172
1423	717510372021	PVC P-Trap	1 1/2" White Plastic P-Trap 	11	2	2.19	\N	Stockroom - Shelf K2	\N	\N	2025-07-16 19:17:59.176979	1	181
1424	018578006164	Wax Free Toilet Seal	Fernco 4" Wax Free Toilet Seal	5	2	8.59	\N	Stockroom - Shelf I1	\N	\N	2025-07-16 19:25:19.479313	1	172
1425	037155620944	Plunger	5" Cup, 18" Handle, Danco Plunger	12	2	11.20	\N	Stockroom - Shelf I1	\N	\N	2025-07-16 19:32:45.739416	1	172
1426	009326412443	All Angle Power Plunger	SIM Supply Tapered Cup All Angle Power Plunger	6	2	26.99	\N	Stockroom - Shelf I1	\N	\N	2025-07-16 19:36:07.557004	1	172
1428	X0041BTB5F	O Ring	O Ring Replacement H-5 (8-Pack)	32	2	7.04	\N	Stockroom - Shelf I2	\N	\N	2025-07-16 19:59:13.050026	1	173
1430	670240413436	Handle Gasket	Zurn P6000-M10 (12-Pack)	19	2	6.10	\N	Stockroom - Shelf I2	\N	\N	2025-07-16 20:04:17.295085	1	173
1431	671254045644	Vacuum Breaker Flush Connection	1 1/4" wide, 9" long, Sloan V-500-AA Vacuum Breaker Flush Connection for Sloan Flushometer	5	2	30.36	\N	Stockroom - Shelf I2	\N	\N	2025-07-17 14:35:40.928032	1	173
1434	671254000834	Cover Repair Part Model A72	Sloan Cover Repair Part Model A72 with Chrome Plate Finish	5	2	28.32	\N	Stockroom - Shelf I2	\N	\N	2025-07-17 15:11:02.732447	1	173
1435	1 4AYF1	Gasket PK Repair Part	 1 1/4" Gasket, Model 4AYF1, Sloan Gasket PK Repair Part (48 Pack)	46	2	57.47	\N	Stockroom - Shelf I2	\N	\N	2025-07-17 15:18:02.766241	1	173
1436	670240587205	Replacement Cap	Zurn P6000-LLS Replacement Cap for Sloan Royal & Regal	2	2	24.89	\N	Stockroom - Shelf I2	\N	\N	2025-07-17 15:21:43.717481	1	173
1432	670240576483	Inside Plastic Cover	Zurn P6000-L Inside Plastic Cover (Replaces Sloan A-71)	13	2	4.99	\N	Stockroom - Shelf I2	\N	\N	2025-07-17 14:45:44.153763	1	173
1325	00662441396366	4L510 V Belt	Totaline 4L510 V Belt	1	1	10.04	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 13:37:39.61645	1	166
1437	670240412651	P6003-H Spud Escutcheon and Coupling Assembly	3/4" Zurn P6003-H Spud Escutcheon and Coupling Assembly	7	2	14.05	\N	Stockroom - Shelf I2	\N	\N	2025-07-17 15:30:21.944003	1	173
1438	4HCX3	P6000-H Spud Escutcheon And Coupling Assembly	1 1/2" Zurn P6000-H Spud Escutcheon And Coupling Assembly	7	2	17.42	\N	Stockroom - Shelf I2	\N	\N	2025-07-17 16:13:59.494962	1	173
1439	086073183208	top guide	Johnson hardware universal folding door top guide set	10	5	15.00	\N	Stockroom - Shelf M2	\N	\N	2025-07-22 13:03:40.859401	1	278
1296	662289255436	4L210 V Belt	Browning 4L210 V Belt	1	1	6.62	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 12:26:35.483896	1	166
1310	1 4L350	4L350 V Belt	Dayton 4L350 V Belt	1	1	8.20	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 13:06:58.565848	1	166
1441	G2R10-C	1/4 Turn Stop	1/4" Turn Straight Stop, 3/8" FIP Inlet, 3/8" OD Tube Outlet, Brasscraft 1/4 Turn Stop 	1	2	23.48	\N	Stockroom - Shelf I2	\N	\N	2025-07-22 14:50:03.029381	1	173
1442	G2R12X-C	1/4 Turn Stop	1/4" Turn Straight Stop, 1/2" FIP Inlet, 3/8" OD Tube Outlet, Brasscraft 1/4 Turn Stop 	6	2	7.68	\N	Stockroom - Shelf I2	\N	\N	2025-07-22 14:58:06.119482	1	173
1443	R14X-C	Multi-Turn Stop	Sweat Straight Stop, 1/2" Nom Sweat Inlet, 3/8" OD Comp Outlet Brasscraft Multi-Turn Stop	10	2	10.13	\N	Stockroom - Shelf I2	\N	\N	2025-07-22 15:01:25.257536	1	173
1446	G2BRPX19X-C	1/4 Turn Stop	1/4" Turn Angle Stop, 1/2" NOM Barb Inlet, 3/8" OD Tube Outlet, Brasscraft 1/4 Turn Stop	3	2	9.45	\N	Stockroom - Shelf I2	\N	\N	2025-07-22 15:09:18.889754	1	173
1433	670240632301	Outside Brass Cover	Zurn P6000-LL-AV-WS1-CP	3	2	25.35	\N	Stockroom - Shelf I3	\N	\N	2025-07-17 15:06:34.580397	1	174
1350	1 5L430	5L430 V Belt	Dayton 5L430 V Belt	4	2	11.64	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 14:32:48.828018	1	166
742	350051A	100/T3Q/CL Halogen	\N	12	1	12.24	\N	Stockroom A-754	\N	\N	2025-03-31 17:33:57.387909	\N	\N
750	350055	F13T8/CW	\N	24	1	6.85	\N	Stockroom A-762	\N	\N	2025-03-31 17:33:58.073809	\N	\N
1473	028874054240	5/16" Masonry Bit	DeWalt Carbide Tipped, SDS Plus, 5/16" x 6" Hammer Drill Bit	1	1	4.39	\N	Stockroom - Shelf F1	\N	\N	2025-07-22 19:36:06.933812	1	168
1474	000346438635	9/16" Masonry Bit	Bosch Carbide Tip, SDS Plus, 9/16" x 8" Hammer Drill Bit	1	1	7.59	\N	Stockroom - Shelf F1	\N	\N	2025-07-22 19:40:37.37167	1	168
1413	V-500-AA (2)	Vacuum Breaker	3/4" wide, 15" long, Sloan V-500-AA Metal Vacuum Breaker	21	2	47.26	\N	Stockroom - Shelf I1	\N	\N	2025-07-16 16:02:24.449009	1	172
1429	X004LY6HBN	O Ring	O Ring H-553 (10-Pack)	100	2	8.80	\N	Stockroom - Shelf I2	\N	\N	2025-07-16 20:00:29.177302	1	173
1440	G2BRPX14X-C	1/4 Turn Stop	1/2" Barb Inlet X 3/8" Comp Outlet Brasscraft 1/4 Turn Stop	5	2	9.38	\N	Stockroom - Shelf I2	\N	\N	2025-07-22 14:46:23.344031	1	173
1445	R19X-C	Multi-Turn Stop	Sweat Angle Stop, 1/2" Nom Sweat Inlet, 3/8" OD Comp Outlet, Brasscraft Multi-Turn Stop	3	2	8.57	\N	Stockroom - Shelf I2	\N	\N	2025-07-22 15:05:47.388668	1	173
1447	039923800091	Quarter Turn	1/2" Sweat, 3/8" OD Comp, Pro-Stop Stop Valve, Angle Pattern Quarter Turn	2	2	11.98	\N	Stockroom - Shelf I2	\N	\N	2025-07-22 15:27:35.466078	1	173
1448	042805003107	Straight Valve	1/2" Copper Sweat, 3/8" OD Compression Jameco Straight Valve	2	2	6.99	\N	Stockroom - Shelf I2	\N	\N	2025-07-22 15:31:18.377271	1	173
1449	A224CPVC	Straight Valve	1/2" Nom Comp, For 3/8" OD Riser, Fluidyne Ansonia Straight Valve	2	2	2.98	\N	Stockroom - Shelf I2	\N	\N	2025-07-22 15:37:32.516608	1	173
1451	000.000.431	Closet Spud	All Closet Spuds	6	2	12.41	\N	Stockroom - Shelf I2	\N	\N	2025-07-22 17:06:36.643349	1	173
1454	1 5LYF2	1/4 Turn Ball Type	1/2"FIP x 3/8" Comp, Matco Norca Chrome Plated Supply Stop 1/4 Turn Ball Type	5	2	10.52	\N	Stockroom - Shelf I2	\N	\N	2025-07-22 17:24:51.031553	1	173
1455	B08C2LBVVZ	Quarter Turn	5/8" OD x 3/8" OD Angle Quarter Turn (10 Pack)	14	2	36.99	\N	Stockroom - Shelf I2	\N	\N	2025-07-22 17:29:39.661485	1	173
1453	NSF61-8	Shut Off Valve	1/2" Wide, 400 psi Shut Off Valve. Comes in Blue and Red	9	2	11.99	\N	Stockroom - Shelf I2	\N	\N	2025-07-22 17:18:54.893961	1	173
1456	cNSFuspw-G	Shut Off Valve	1/2" wide, 125 psi, Rifeng Shut Off Valve	1	2	10.80	\N	Stockroom - Shelf I2	\N	\N	2025-07-22 17:39:53.776462	1	173
1452	039923800121	Quarter Turn	1/2" Nom. Comp, (5/8" OD) x 3/8" OD Comp, Pro-Stop, Stop Valve Straight Pattern	2	2	6.55	\N	Stockroom - Shelf I2	\N	\N	2025-07-22 17:12:19.182126	1	173
1457	039923800084	Quarter Turn	1/2" CPVC x 3/8" OD Comp, Pro-Stop Quarter Turn	2	2	10.98	\N	Stockroom - Shelf I2	\N	\N	2025-07-22 17:51:09.77625	1	173
1459	697285071582	Angle Stop 1/4 Turn	1/2" x 3/8" OD, Sharkbite Copper Angle Stop 1/4 Turn	4	2	19.23	\N	Stockroom - Shelf I2	\N	\N	2025-07-22 18:02:39.12731	1	173
1460	697285071629	Straight Stop 1/4 Turn	1/2" x 3/8" OD, Sharkbite Copper Straight Stop 1/4 Turn	2	2	19.90	\N	Stockroom - Shelf I2	\N	\N	2025-07-22 18:05:38.766035	1	173
1461	697285056596	Angle Stop 1/4 Turn	1/2" x 3/8" OD, Sharkbite Copper Angle Stop 1/4 Turn Brushed with Nickel Finish	10	2	17.80	\N	Stockroom - Shelf I2	\N	\N	2025-07-22 18:12:09.726397	1	173
1462	697285605756	Straight Stop 1/4 Turn	1/2" x 3/8" OD, Sharkbite Copper Straight Stop 1/4 Turn with CPVC	12	2	12.45	\N	Stockroom - Shelf I2	\N	\N	2025-07-22 18:22:10.703275	1	173
1458	042805002988	Angle Valve	5/8" OD CPVC x 3/8" OD Compression, Chrome Plated Brass, Jameco Angle Valve	4	2	11.44	\N	Stockroom - Shelf I2	\N	\N	2025-07-22 17:55:13.674444	1	173
1463	PXSSQ050	1/4 Turn Straight Stop	1/2" PEX Crimp, Bluefin 1/4 Turn Straight Stop (Chrome)	4	2	5.24	\N	Stockroom - Shelf I2	\N	\N	2025-07-22 18:30:12.101911	1	173
1464	G2CR19X C	1/4 Turn Angle Stop	1/2" Nom Comp Inlet, 3/8" OD Comp Outlet, Brasscraft Chrome 1/4 Turn Angle Stop	1	2	9.73	\N	Stockroom - Shelf I2	\N	\N	2025-07-22 18:33:55.869833	1	173
1465	G2PR14 C	1/4 Turn Stop	1/2" Nom CPVC Inlet x 3/8" OD Tube Outlet, Brasscraft Chrome1/4 Turn Stop Solvent	6	2	11.65	\N	Stockroom - Shelf I2	\N	\N	2025-07-22 18:37:55.424954	1	173
1470	028874052222	3/16" Masonry Bit	DeWalt Carbide Tipped, Faster Drilling, No-Spin Shank, 3/16" x 3" Hammer Drill Bit	1	1	3.54	\N	Stockroom - Shelf F1	\N	\N	2025-07-22 19:14:16.016614	1	168
1471	028874052277	5/32" Masonry Bit	DeWalt Carbide Tipped, Faster Drilling, No-Spin Shank, 5/32" x 6" Hammer Drill Bit	3	1	2.25	\N	Stockroom - Shelf F1	\N	\N	2025-07-22 19:23:53.327063	1	168
1472	1 22UV62	3/8" Masonry Bit	Westward SDS-Plus Shank 3/8" x 6" Hammer Drill Bit	2	1	6.80	\N	Stockroom - Shelf F1	\N	\N	2025-07-22 19:26:53.980041	1	168
1468	009326315645	1/8" Masonry Bit	Do-It Masonry, Carbide Tip, 1/8" x 2 1/2" Hammer Drill Bit	1	1	6.05	\N	Stockroom - Shelf F1	\N	\N	2025-07-22 19:04:03.600231	1	168
1467	000346436280	1/8" Masonry Bit	Bosch Carbide Tip, Fast Spiral, 1/8" x 3" Hammer Drill Bit	2	1	2.69	\N	Stockroom - Shelf F1	\N	\N	2025-07-22 19:00:10.41548	1	168
1469	B00B2QYJ9E	3/16" Masonry Bit	GLBCOX63/16 3/16" x 6" Cobalt Hammer Drill Bit	2	1	9.29	\N	Stockroom - Shelf F1	\N	\N	2025-07-22 19:09:00.250958	1	168
1475	885911279147	1/4" Masonry Bit	DeWalt Carbide Tip, No-Spin Shank, Multi Material, 1/4" x 4 3/4" Hammer Drill Bit	10	1	4.69	\N	Stockroom - Shelf F1	\N	\N	2025-07-22 19:44:07.976962	1	168
1351	000.000.091	5L520 V Belt	D&D Dura-Prime 5L520 V Belt	1	1	13.62	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 14:34:05.626434	1	166
1477	H-1012-A	Control Stop	SLNH-1012-A Sloan Control Stop, Vandal Resistant Hex Cap (6 per Pack)	6	2	8.95	\N	Stockroom - Shelf I3	\N	\N	2025-07-23 13:38:10.288568	1	174
1478	717510383782	1 1/4" x 6" Threaded Tube	Part No. P38-078, 20 Gauge, 1 1/4" x 6" Threaded Tube	2	2	7.75	\N	Stockroom - Shelf I3	\N	\N	2025-07-23 13:48:16.512057	1	174
1480	No Barcode Yet	T-12 Bulb	\N	0	2	0.00	\N	\N	\N	\N	2025-07-23 14:53:41.929249	\N	\N
815	352101A	1'' EMT clamps	\N	6	1	0.25	\N	Stockroom A-827	\N	\N	2025-03-31 17:34:03.678636	\N	\N
824	355014B	MP50/U/Medium base	\N	7	1	20.00	\N	Stockroom A-836	\N	\N	2025-03-31 17:34:04.458098	\N	\N
788	350120	FB016/835 T8	\N	22	1	17.10	\N	Stockroom A-800	\N	\N	2025-03-31 17:34:01.336634	\N	\N
1218	079340648906	Loctite Power Grab	All purpose constriction adhesive	15	2	6.00	\N	Stockroom	\N	\N	2025-06-27 13:59:02.085221	1	307
1481	092097253162	Metal Tornadoes	EZ Ancor Drywall & Stud Anchor, Screw Size #7	5	2	18.18	\N	Stockroom - Shelf Q4	\N	\N	2025-07-23 17:07:44.523703	1	259
1362	781087074879	2S40 Ballast	120V to 277V, Advance ICN-2S40-N Rapid Start Electronic Ballast	6	2	32.75	\N	Stockroom - Shelf S2	\N	\N	2025-07-10 14:14:12.146755	1	303
1496	037155357284	#11 O Ring	Danco 35728B, 3/4" x 9/16" x 3/32" #11 O Ring	11	2	2.29	\N	Stockroom - Shelf I3	\N	\N	2025-07-24 13:30:03.339292	1	174
1516	10033886002902	sikaflex 1a	Sika construction sealant sikaflex	8	2	6.59	\N	Stockroom - Shelf T3	\N	\N	2025-07-30 14:27:23.767282	1	307
1483	037155357291	#12 O Ring	Danco 35729B, 13/16" x 5/8" x 3/32" #12 O Ring	7	2	1.69	\N	Stockroom - Shelf I3	\N	\N	2025-07-24 12:25:02.817673	1	174
1484	037155357567	#42 O Ring	Danco 35756B, 11/16" x 1/2" x 3/32" #42 O Ring	10	2	1.29	\N	Stockroom - Shelf I3	\N	\N	2025-07-24 12:27:15.689137	1	174
1485	037155357345	#17 O Ring	Danco 35734B, 1 1/16" x 7/8" x 3/32" #17 O Ring	5	2	1.55	\N	Stockroom - Shelf I3	\N	\N	2025-07-24 12:29:44.598254	1	174
1486	037155357789	#64 O Ring	Danco 35778, P/N:9D0035778B, 1 5/16" x 1 1/8" x 3/32" #64 O Ring	10	2	1.49	\N	Stockroom - Shelf I3	\N	\N	2025-07-24 12:33:35.412181	1	174
1487	037155357208	#73 O Ring	Danco 35720B, 2 3/16" x 2" x 3/32" #73 O Ring	10	2	7.83	\N	Stockroom - Shelf I3	\N	\N	2025-07-24 12:36:06.72264	1	174
1482	20037155357417	#27 O Ring Bag	Contains 5 #27 Fits Tracy O Ring, 1 1/8" OD x 7/8" ID	50	2	7.76	\N	Stockroom - Shelf I3	\N	\N	2025-07-24 12:22:12.431053	1	174
1488	037155357222	#5 O Ring	Danco 35722B, 3/8" x 1/4" x 1/16"	10	2	1.39	\N	Stockroom - Shelf I3	\N	\N	2025-07-24 12:42:13.155928	1	174
1489	037155357314	#14 O Ring	Danco 35731B, 15/16" x 3/4" x 3/32 #14 O Ring	10	2	1.49	\N	Stockroom - Shelf I3	\N	\N	2025-07-24 12:45:12.80976	1	174
1490	037155357338	#16 O Ring	Danco 35733B, 1 1/16" x 13/16" x 1/8" #16 O Ring	10	2	1.39	\N	Stockroom - Shelf I3	\N	\N	2025-07-24 12:47:24.706516	1	174
1491	037155357550	#41 O Ring	Danco 35755B, 9/16" x 7/16" x 1/16" #41 O Ring	10	2	1.49	\N	Stockroom - Shelf I3	\N	\N	2025-07-24 12:49:26.348617	1	174
1492	033056022306	Countertop Sink	American Standard, White Round Set In Sink	2	2	63.00	\N	Stockroom - Shelf B1	\N	\N	2025-07-24 12:56:46.154136	1	165
1493	037155357253	#8 O Ring	Danco 35725B, 9/16" x 3/8" x 3/32" #8 O Ring	10	2	1.49	\N	Stockroom - Shelf I3	\N	\N	2025-07-24 13:21:03.846724	1	174
1494	037155357260	#9 O Ring	Danco 35726B, 5/8" x 7/16" x 3/32" #9 O Ring	10	2	1.49	\N	Stockroom - Shelf I3	\N	\N	2025-07-24 13:25:16.189027	1	174
1495	037155357246	#7 O Ring	Danco 35724B, 1/2" x 3/8" x 1/16" #7 O Ring	10	2	1.59	\N	Stockroom - Shelf I3	\N	\N	2025-07-24 13:27:28.923193	1	174
1497	037155357239	#6 O Ring	Danco 35723B, 7/16" x 5/16" x 1/16" #6 O Ring	10	2	1.49	\N	Stockroom - Shelf I3	\N	\N	2025-07-24 14:21:46.053015	1	174
1499	037155357642	#50 O Ring	Danco 35764B, P/N: 9D0035763B, 1 5/8" x 1 7/16" #50 O Ring	10	2	1.45	\N	Stockroom - Shelf I3	\N	\N	2025-07-24 14:30:20.255102	1	174
1500	037155357598	#45 O Ring	Danco 35759B, 1 3/8" x 1 3/16" x 3/32" #45 O Ring	10	2	1.49	\N	Stockroom - Shelf I3	\N	\N	2025-07-24 14:34:21.606572	1	174
1501	670240433212	Outside Brass Cover	Zurn P6000-LL-WS1-CP, Outside Brass Cover CP-WS1	3	2	27.29	\N	Stockroom - Shelf I3	\N	\N	2025-07-24 14:47:39.5248	1	174
1502	670240413375	Outside Brass Cover	Zurn P6000-LL-CP, Outside Brass Cover CP	1	2	22.15	\N	Stockroom - Shelf I3	\N	\N	2025-07-24 14:50:46.815451	1	174
1503	060672130276	Worm Gear Clamp	4" Worm Gear Clamp, MC4ZW	1	2	2.89	\N	Stockroom - Shelf I3	\N	\N	2025-07-24 14:53:55.102041	1	174
1504	1 1PPJ7	Sink & Faucet Hole Cover	LDR 1 1/2" Sink & Faucet Hole Cover	3	2	1.99	\N	Stockroom - Shelf I3	\N	\N	2025-07-24 14:58:57.957708	1	174
1506	051652015492	Up Shot	Kilz upshot interior promer overhead stain sealer white	9	2	10.00	\N	Stockroom - Shelf T4	\N	\N	2025-07-24 19:10:02.479167	1	308
1508	X004B5O41R	4" x 10" Vent Cover	4" x 10" Vent Covers for Home Floor Winch (8 per box)	40	2	36.99	\N	Stockroom - Shelf B1	\N	\N	2025-07-29 17:45:10.603319	1	165
1512	783250463190	3/8" Heat Shrink	Ideal 3/8" x 6" ThermoShrink (10 per Pack), Voltage Rating: 600V	10	2	17.89	\N	Stockroom - Shelf N3	\N	\N	2025-07-30 13:16:51.085248	1	282
1505	032076561871	3/16" Heat Shrink	Gardener Bender 3/16" Heat Shrink (8 Pack), Voltage Rating: 600V	56	2	2.79	\N	Stockroom - Shelf N3	\N	\N	2025-07-24 18:29:21.476705	1	282
1511	783250463107	1/8" Heat Shrink	Ideal 1/8" x 6" ThermoShrink (20 per Pack), Voltage Rating: 600V	28	2	20.99	\N	Stockroom - Shelf N3	\N	\N	2025-07-30 13:12:20.95155	1	282
1513	070798086418	clear silicone 9.8 fl oz	dap window and door siding 100% silicone seal	1	1	7.39	\N	Stockroom - Shelf T3	\N	\N	2025-07-30 14:17:22.939409	1	307
1548	TA60WD12LED-0000	LED Driver	LTF Soft Start Short Circuit & Overload Protection LED Driver. For use with 12V LED	1	1	30.25	\N	Stockroom - Shelf N3	\N	\N	2025-08-06 16:44:08.776604	1	282
1530	020066190385	Frosted glass spray	Rust-oleum frosted glass semi transparent finish	4	1	8.29	\N	Stockroom - Shelf T4	\N	\N	2025-07-30 15:01:55.221628	1	308
1538	025989015579	corrugated fastener (Per pack)	6033	15	2	0.00	\N	Stockroom - Shelf T4	\N	\N	2025-07-30 17:44:28.715036	1	308
1544	024043350014	Carpet seam tape	\N	7	2	5.97	\N	Stockroom - Shelf T2	\N	\N	2025-07-31 16:16:38.772069	1	306
1479	049793101617	Shelf Pegs 5mm	primeline u10161 shelf pegs shelf support pegs	6	5	11.61	\N	Stockroom - Shelf M2	\N	\N	2025-07-23 13:52:22.527418	1	278
1507	036296504502	3/16" All Purpose Concrete & Drywall Anchor	Toggler Alligator AF5 Plastic Flanged Anchor with Screws, 3/16" All Purpose Concrete & Drywall Anchor (20 Pack)	0	1	14.25	\N	Stockroom - Shelf Q4	\N	\N	2025-07-29 17:01:38.128513	1	259
803	352032	#12 THNN wire - all colors-per foot	\N	1319	1	0.12	\N	Stockroom A-815	\N	\N	2025-03-31 17:34:02.631265	\N	\N
1476	1 10N725	Bonnet Nut	RP22734 Plated Bonnet Nut	12	2	8.59	\N	Stockroom - Shelf I3	\N	\N	2025-07-23 13:29:47.916711	1	174
1539	883778311185	Ivory, Single Gang, Blank Cover	Hubbell Ivory, Single Gang, Box Mount, Blank Wall Plate	54	2	2.59	\N	Stockroom - Shelf N3	\N	\N	2025-07-30 17:47:38.593112	1	282
1352	1 5L540	5L540 V Belt	Dayton 5L540 V Belt	3	2	14.08	\N	Stockroom - Shelf D1	\N	\N	2025-07-09 14:35:43.098794	1	166
1531	LL 40075	7 Assorted Fixture Screws	Carol 7 Assorted Fixture Screws, Contains 8/32" x 2" Fixture Screw, 8/32" x 1/2" Thumb Screw, 8/32" x 2" Stud	4	2	1.99	\N	Stockroom - Shelf N3	\N	\N	2025-07-30 15:14:14.487403	1	282
1532	078477428009	Stainless Steel, Single Gang, Toggle Switch Cover	Leviton Stainless Steel, Single Gang, Toggle Switch Wall Plate	12	2	1.39	\N	Stockroom - Shelf N3	\N	\N	2025-07-30 15:32:07.025307	1	282
880	610300A	Propane Torch Head Kit	\N	1	1	12.00	\N	Stockroom A-892	\N	\N	2025-03-31 17:34:09.426071	\N	\N
1510	078254140100	Wasp & Hornet Killer	CRC 14 oz Spray Bottle of Wasp & Hornet Killer Plus wasp spray	9	2	9.55	\N	Stockroom - Shelf T4	\N	\N	2025-07-29 18:11:35.843884	1	308
890	630053	1/16 thru 1/4 drill bits	\N	191	1	1.58	\N	Stockroom A-902	\N	\N	2025-03-31 17:34:10.2839	\N	\N
1517	783250464005	Underground UF Splice Kit	Ideal Underground UF Splice Kit, Includes 4 Position Barrel Connector and Heavy Wall Tubing, Voltage Rating: 600V	1	2	20.19	\N	Stockroom - Shelf N3	\N	\N	2025-07-30 14:29:41.718082	1	282
1527	079567100386	3 in one oil	3 in 1 multi purpose oil 8 fl oz	5	2	7.54	\N	Stockroom - Shelf T4	\N	\N	2025-07-30 14:51:39.253298	1	308
1533	046135498572	4X32 T8 Ballast	120V to 277V, Osram Quicktronic QHE 4X32T8/UNV ISN-SC Fluorescent Lamp Ballast	1	2	22.99	\N	Stockroom - Shelf S2	\N	\N	2025-07-30 17:21:24.002141	1	303
1534	046135499432	2X32 T8 Ballast	120V to 277V, Sylvania QTP 2X32T8/UNV ISN SC Fluorescent Lamp Ballast	4	2	17.85	\N	Stockroom - Shelf S1	\N	\N	2025-07-30 17:26:16.965408	1	302
1522	078477277812	Ivory, Single Gang, Telephone Wall Jack	Leviton Ivory, Single Gang, Flush Mount, Smooth Face, Telephone Wall Jack	13	2	3.21	\N	Stockroom - Shelf N3	\N	\N	2025-07-30 14:38:02.335782	1	282
1541	883778103841	Ivory, Single Gang, Telephone and Coax Plate	Hubbell Ivory, Single Gang, Telephone/Coaxial Plate	6	2	2.17	\N	Stockroom - Shelf N3	\N	\N	2025-07-30 18:01:54.054096	1	282
1545	044321019846	medicine cabinets	\N	4	1	72.70	\N	Stockroom	\N	\N	2025-07-31 19:38:47.033939	1	\N
1450	115c303	VHB Tape	3M 1/2 4910 double sided tape	1	2	33.55	\N	Stockroom - Shelf T2	\N	\N	2025-07-22 16:12:01.627699	1	306
1536	078477096802	Stainless Steel, Single Gang, Telephone Wallplate	Leviton Stainless Steel, Single Gang, QuickPort Telephone Wallplate, 4108W-SP	3	2	14.17	\N	Stockroom - Shelf N3	\N	\N	2025-07-30 17:42:49.425456	1	282
1546	X0020PH7Y1	White, Single Gang Home Theater Systems Wall Plate	VCELink Single Brush Wall Plate with Single Gang, Low Voltage Mounting Bracket Home Theater Systems (3 pack)	3	2	13.86	\N	Stockroom - Shelf N3	\N	\N	2025-08-05 15:00:03.554089	1	282
1526	078477955772	Ivory, Double Gang, Switch Cover	Leviton Ivory, Double Gang, Toggle Switch Wall Plate	6	2	1.89	\N	Stockroom - Shelf N3	\N	\N	2025-07-30 14:50:42.104918	1	282
1547	Err1	Cherry Wood, Single Gang Rocker Switch Cover	Cherry Wood, Single Gang Rocker Switch Wall Plate	6	2	11.70	\N	Stockroom - Shelf N3	\N	\N	2025-08-06 16:33:21.511841	1	282
1550	078477488447	Ivory, Double Gang, Rocker Switch Cover	Leviton Ivory, Double Gang, Rocker Switch Wall Plate	27	2	1.15	\N	Stockroom - Shelf N3	\N	\N	2025-08-06 17:38:08.208946	1	282
1551	Err2	Steel Junction Box Cover	4" x 4" Raised 5/8" Steel Junction Box Cover	30	2	1.79	\N	Stockroom - Shelf N3	\N	\N	2025-08-06 17:48:44.466106	1	282
1553	078477956076	Ivory, Double Gang, Outlet Cover	Leviton Ivory, Double Gang, Outlet Wall Plate	19	2	1.16	\N	Stockroom - Shelf N3	\N	\N	2025-08-06 18:10:17.463997	1	282
1543	X001GHE4YZ	Ivory, Double Gang, Blank Cover	Hubbell Ivory, Double Gang, Box Mount, Blank Wall Plate	9	2	1.65	\N	Stockroom - Shelf N3	\N	\N	2025-07-31 13:13:02.56071	1	282
1552	785007025774	Almond, Double Gang, Combination Cover	Pass & Seymour Almond, Double Gang, 1 Toggle Switch & 1 Blank Combination Wall Plate	6	2	5.39	\N	Stockroom - Shelf N3	\N	\N	2025-08-06 18:00:02.938864	1	282
1542	012000182686	Pepsi Zero - Test	Pepsi Zero - Test	1	1	2.22	\N	Shelf AA10D	Manual Entry	\N	2025-07-30 18:47:14.04038	\N	\N
1498	037155357215	#1 O Ring	Danco 35721B, 2 1/32" x 13/32" x 1/8" #1 O Ring	10	5	1.69	\N	Stockroom - Shelf I3	\N	\N	2025-07-24 14:24:55.876495	1	174
1515	783250463435	1/2" Heat Shrink	Ideal 1/2" x 6" Heavy Wall ThermoShrink (10 per Pack), Voltage Rating: 600V	4	2	72.49	\N	Stockroom - Shelf N3	\N	\N	2025-07-30 14:20:53.401631	1	282
1518	15chp4	Food Machinery Grease	jet lube FMG 14oz	8	2	23.74	\N	Stockroom - Shelf T4	\N	\N	2025-07-30 14:31:32.596612	1	308
948	760014	3 drawer chest	\N	4	1	164.59	\N	Stockroom A-960	\N	\N	2025-03-31 17:34:15.316907	\N	\N
1583	883778105104	Ivory, Double Gang, Combination Cover	Bryant Electric Ivory, Double Gang, 1 Round Outlet & 1 Blank Wall Plate	1	2	1.59	\N	Stockroom - Shelf N3	\N	\N	2025-08-13 19:48:13.744623	1	282
945	730048A	Floor Track-per foot	\N	17	1	1.35	\N	Stockroom A-957	\N	\N	2025-03-31 17:34:15.056137	\N	\N
1537	079423457609	Glazing points (Per Pack)	\N	4	1	0.00	\N	Stockroom - Shelf T4	\N	\N	2025-07-30 17:42:50.152928	1	308
1540	X003SPF519	Indoor Carpet Tape	ipg double sided carpet tape	14	2	16.79	\N	Stockroom - Shelf T2	\N	\N	2025-07-30 17:51:07.533936	1	306
1565	10039800019193	AA Battery	Energizer Industrial Alkaline AA Batteries	338	50	0.81	\N	Stockroom	\N	\N	2025-08-13 12:48:49.552085	1	\N
1554	Err3	Single Device Square Cover	4" x 4" Raised 1/2" Steel Single Device Square Cover	20	2	1.34	\N	Stockroom - Shelf N3	\N	\N	2025-08-06 18:18:23.869713	1	282
1584	883778102462	Almond, Single Gang, Rocker Switch Cover	Hubbell Almond, Single Gang, Rocker Switch Wall Plate	3	2	1.25	\N	Stockroom - Shelf N3	\N	\N	2025-08-13 19:52:27.46273	1	282
1549	078477086896	Ivory, Single Gang, Rocker Switch Cover	Leviton Ivory, Single Gang, Rocker Switch Decor Wall Plate	34	2	1.25	\N	Stockroom - Shelf N3	\N	\N	2025-08-06 17:31:10.313886	1	282
1558	883778312328	Ivory, Triple Gang, Blank Cover	Bryant Electric Ivory, Triple Gang, Blank Cover	4	2	2.98	\N	Stockroom - Shelf N3	\N	\N	2025-08-07 16:53:56.372615	1	282
1559	Err4	Ivory, Quadruple Gang, Toggle Switch Cover	Sta-Kleen Ivory, Quadruple Gang, Toggle Switch Cover	2	2	2.56	\N	Stockroom - Shelf N3	\N	\N	2025-08-07 17:02:37.13773	1	282
1585	078477153482	White, Single Gang, Outlet Cover	Leviton White, Single Gang, Outlet Wall Plate	10	2	0.93	\N	Stockroom - Shelf N3	\N	\N	2025-08-13 19:56:48.803012	1	282
1566	041333122106	6V Battery	Duracell 223 Lithium 6V Battery	2	10	9.79	\N	Stockroom	\N	\N	2025-08-13 13:22:28.311935	1	\N
1567	645397936206	Pen Light Flashlight	Nebo Waterproof Pen Light Flashlight with Adjustable Beam-Takes AAA	1	1	28.00	\N	Stockroom	\N	\N	2025-08-13 13:34:06.620637	1	\N
1568	015286204844	LED Flashlight	Coast Focusing Beam System LED Flashlight-Takes AA or is Rechargeable	2	1	23.37	\N	Stockroom	\N	\N	2025-08-13 13:38:09.365405	1	\N
1574	X00409YNE7	16" Ceiling Light	50W, 120V, 15" Modern LED Ceiling Light	2	2	34.00	\N	Stockroom - Shelf H3	\N	\N	2025-08-13 18:56:18.942867	1	266
1557	883951482282	Almond, Single Gang, Outlet Cover	Enerlites Almond, Single Gang, Outlet Cover	1	2	6.59	\N	Stockroom - Shelf N3	\N	\N	2025-08-07 16:40:26.762288	1	282
1569	078477436301	Brown, Single Gang, Telephone Cable Cover	Leviton Brown, Single Gang, Telephone Cable Wall Plate	36	2	3.67	\N	Stockroom - Shelf N3	\N	\N	2025-08-13 14:09:33.426722	1	282
1560	883778313004	Brown, Single Gang, Outlet Cover	Hubbell Brown, Single Gang, Outlet Cover	65	2	1.65	\N	Stockroom - Shelf N3	\N	\N	2025-08-07 17:09:16.378281	1	282
1571	Err5	Brown, Single Gang, Blank Cover	Hubbell Brown, Brown, Single Gang, Blank Wall Plate	1	2	1.36	\N	Stockroom - Shelf N3	\N	\N	2025-08-13 15:38:11.503156	1	282
1572	783585393711	Brown, Double Gang, Outlet Cover	Hubbell Brown, Single Gang, Blank Wall Plate	15	2	1.97	\N	Stockroom - Shelf N3	\N	\N	2025-08-13 15:43:40.086608	1	282
1570	783585393018	Brown, Single Gang, Toggle Switch Cover	Hubbell Brown, Single Gang, Toggle Switch Wall Plate	9	2	1.10	\N	Stockroom - Shelf N3	\N	\N	2025-08-13 15:35:57.559151	1	282
1573	783585860503	Brass, Single Gang, Toggle Switch Cover	Hubbell Brass, Single Gang, Toggle Switch Wall Plate	1	2	15.89	\N	Stockroom - Shelf N3	\N	\N	2025-08-13 15:49:50.870587	1	282
973	911004	Ant & Roach Spray	\N	12	1	3.88	\N	Stockroom A-985	\N	\N	2025-03-31 17:34:17.51378	\N	\N
1556	078477153598	Ivory, Single Gang, Outlet Cover	Leviton Ivory, Single Gang, Outlet Cover 	2	2	0.92	\N	Stockroom - Shelf N3	\N	\N	2025-08-07 15:06:22.632782	1	282
1575	883778200496	Brass, Single Gang, Outlet Cover	Bryant Electric Brass, Single Gang, Outlet Wall Plate	7	2	16.39	\N	Stockroom - Shelf N3	\N	\N	2025-08-13 19:04:16.196294	1	282
1586	078477185902	Socket Adapter	Leviton 001-2005 Socket Adapter	10	2	8.57	\N	Stockroom - Shelf N3	\N	\N	2025-08-13 20:00:36.873593	1	282
1528	071924052512	Grease	mobil grease polyrex em	0	1	11.49	\N	Stockroom - Shelf T4	\N	\N	2025-07-30 14:53:11.242688	1	308
1576	883778200380	Brass, Single Gang, Blank Cover	Hubbell Brass, Single Gang, Blank Wall Plate	11	2	7.95	\N	Stockroom - Shelf N3	\N	\N	2025-08-13 19:11:00.084822	1	282
1577	883778104480	Ivory, Double Gang, Combination Cover	Hubbell Ivory, Double Gang, 1 Toggle Switch & 1 Rocker Switch Combination Wall Plate	4	2	2.72	\N	Stockroom - Shelf N3	\N	\N	2025-08-13 19:18:08.265451	1	282
1578	883778105180	Ivory, Double Gang, Combination Cover	Hubbell, Double Gang, 1 Toggle Switch & 1 Outlet Wall Plate	5	2	1.08	\N	Stockroom - Shelf N3	\N	\N	2025-08-13 19:20:34.660914	1	282
1579	078477779491	Ivory, Double Gang, Combination Cover	Leviton Ivory, Double Gang, 1 Outlet & 1 Blank Wall Plate	2	2	3.57	\N	Stockroom - Shelf N3	\N	\N	2025-08-13 19:22:39.305944	1	282
1581	078477779118	Ivory, Double Gang, Combination Cover	Leviton Ivory, Double Gang, 1 Outlet & 1 Rocker Switch Wall Plate	12	2	1.99	\N	Stockroom - Shelf N3	\N	\N	2025-08-13 19:29:21.122089	1	282
1582	883778312748	Ivory, Single Gang, Round Outlet Cover	Bryant Electric Ivory, Single Gang, Round Outlet Cover	9	2	1.49	\N	Stockroom - Shelf N3	\N	\N	2025-08-13 19:35:52.963449	1	282
1587	783585208114	Portable Outlet Box	Hubbell SHC1039CR Portable Outlet Box	1	1	13.15	\N	Stockroom - Shelf N3	\N	\N	2025-08-14 12:38:08.346955	1	282
1588	078477772997	White, Single Gang, Blank Cover	Leviton White, Single Gang, Blank Wall Plate	15	2	0.67	\N	Stockroom - Shelf N3	\N	\N	2025-08-14 12:44:12.522992	1	282
1589	078477153581	White, Single Gang, Toggle Switch Cover	Leviton White, Single Gang, Toggle Switch Wall Plate	19	2	0.93	\N	Stockroom - Shelf N3	\N	\N	2025-08-14 12:58:59.839369	1	282
1590	883778311789	White, Double Gang, Blank Cover	Hubbell White, Double Gang, Blank Wall Plate	8	2	2.39	\N	Stockroom - Shelf N3	\N	\N	2025-08-14 13:02:50.535014	1	282
1591	078477957868	White, Double Gang, Rocker Switch Cover	Leviton White, Double Gang, Rocker Switch Wall Plate	4	2	4.05	\N	Stockroom - Shelf N3	\N	\N	2025-08-14 15:10:11.671646	1	282
1592	30078477300306	Pull Chain Switch	Leviton Nickel, On-Off Pull Chain Switch	9	2	7.99	\N	Stockroom - Shelf N3	\N	\N	2025-08-14 17:12:20.274266	1	282
1593	X004NBWZNN	Shower Handle Replacement Kit	PlumFix Shower Handle Replacement Kit	19	2	9.79	\N	Stockroom - Shelf J4	\N	\N	2025-08-14 17:56:19.675929	1	179
1015	1677763	2" x 1 1/2" PVC Bushing	\N	4	1	5.00	\N	Stockroom A-1027	\N	\N	2025-03-31 17:34:21.128648	\N	\N
1529	078477819999	Gray 1-Port F-Type Insert	Leviton 41084-FGF, Quickport, Snap-In, Gray 1-Port F-Type Insert	4	2	3.15	\N	Stockroom - Shelf N3	\N	\N	2025-07-30 14:54:18.461656	1	282
1562	MANUAL_BIG_T	Big T	Manual item: Big T	5	\N	0.00	\N	\N	\N	\N	2025-08-12 16:01:26.252055	1	1
1519	046500117176	Ant and roach spray	Raid ant and roach spray fragrance free	6	2	8.00	\N	Stockroom - Shelf T4	\N	\N	2025-07-30 14:33:19.609536	1	308
1580	883778104565	Ivory, Double Gang, Combination Cover	Hubbell Ivory, Double Gang, 1 Rocker Switch & 1 Blank Wall Plate	6	2	0.69	\N	Stockroom - Shelf N3	\N	\N	2025-08-13 19:24:24.469492	1	282
1595	032664139109	Rotary Switch	Cooper Wiring 125V, Single Pole Rotary Switch, BP443NP	3	2	4.95	\N	Stockroom - Shelf N3	\N	\N	2025-08-14 18:04:01.848556	1	282
1594	032664109508	Push Switch	Cooper Wiring 125V, Single Pole Push Switch, BP449NP	3	2	6.28	\N	Stockroom - Shelf N3	\N	\N	2025-08-14 18:00:41.376205	1	282
1596	078477202609	Stainless Steel, Double Gang, Outlet Cover	Leviton Stainless Steel, Double Gang, Single Device, 2.15" Opening, Outlet Wall Plate	7	2	8.29	\N	Stockroom - Shelf N3	\N	\N	2025-08-14 18:24:42.815428	1	282
1597	Err6	Stainless Steel Quad Outlet Cover	Southwire Raised Standard 4" Quad Outlet Cover	6	2	9.00	\N	Stockroom - Shelf N3	\N	\N	2025-08-14 18:31:54.256118	1	282
1598	883778200717	Stainless Steel, Single Gang, Blank Cover	Hubbell Stainless Steel, Single Gang, Blank Wall Plate	2	2	4.32	\N	Stockroom - Shelf N3	\N	\N	2025-08-14 18:36:38.97626	1	282
1599	078477000052	2 to 3 Plug Adapter	Cooper Wiring 15A 125V, Gray 2-Wire Polarized to 3-Wire Grounded Plug Adapter	4	2	0.74	\N	Stockroom - Shelf N3	\N	\N	2025-08-14 18:46:21.971708	1	282
1600	032664489853	Grounding Outlet Adapter	Cooper Wiring 15A 125V, Tri-Tap Grounding Outlet Adapter	2	2	7.79	\N	Stockroom - Shelf N3	\N	\N	2025-08-14 18:49:22.320976	1	282
1601	077578030401	Air Conditioner Foam	Frost King 2 1/4" x 2 1/4" x 42" long Air Conditioner Foam	16	2	6.15	\N	Stockroom - Shelf K3	\N	\N	2025-08-18 12:11:25.211855	1	182
1602	077578030418	Air Conditioner Foam	Frost King 1 1/4" x 1 1/4" x 42" Air Conditioner Foam	2	2	2.99	\N	Stockroom - Shelf K3	\N	\N	2025-08-18 12:17:00.091572	1	182
1603	784231173183	13" Ceiling Light	Lithonia 13" Saturn LED Ceiling Light, 11750BN	1	1	62.54	\N	Stockroom - Shelf H4	\N	\N	2025-08-18 12:52:26.201155	1	270
1563	MANUAL_TEST_MANUAL_ITEM	Test Manual Item	Manual item: Test Manual Item	2	\N	0.00	\N	\N	\N	\N	2025-08-12 16:01:36.5435	1	1
1036	008236385533	375289 0.18 X 2.75 in. Blue Slotted Tap Concrete Screw Anchor - 100 CountTapper 3/16 x 2 3/4	\N	49	1	0.75	\N	\N	\N	\N	2025-04-09 12:20:24.248223	\N	\N
1067	801509344318	Cf226x Toner	\N	5	1	0.00	\N	\N	\N	\N	2025-04-09 12:20:27.39209	\N	\N
1066	5900234159	CF287X Toner	\N	6	1	0.00	\N	\N	\N	\N	2025-04-09 12:20:27.310582	\N	\N
1564	039961100207	20" Supply Line	\N	39	2	13.79	\N	Stockroom - Shelf F1	\N	\N	2025-08-12 17:38:24.103236	1	168
1604	032664517808	Ivory Six Outlet Adapter	Cooper Wiring 15A 125V, Ivory, Duplex to Six Outlet Adapter, 1146V	4	2	8.91	\N	Stockroom - Shelf N3	\N	\N	2025-08-18 13:18:43.801198	1	282
1605	Err7	Stainless Steel, Single Gang, Telephone Cable Cover	Pass & Seymour Stainless Steel, Single Gang, Telephone Cable Wall Plate	2	2	4.80	\N	Stockroom - Shelf N3	\N	\N	2025-08-18 13:28:45.845542	1	282
1606	Err8	Stainless Steel, Single Gang, Blank Receptacle Cover	Garvin Industries Stainless Steel, Single Gang, Blank Utility Box Receptacle Wall Plate	2	2	3.39	\N	Stockroom - Shelf N3	\N	\N	2025-08-18 13:32:19.952743	1	282
1607	783585864419	Stainless Steel, Triple Gang, Combination Cover	Hubbell Stainless Steel, Triple Gang, 2 Toggle & 1 Rocker Switch Combination Wall Plate	1	1	3.70	\N	Stockroom - Shelf N3	\N	\N	2025-08-18 13:58:37.05326	1	282
1608	Err9	Stainless Steel, Single Gang, Round Outlet Cover	Stainless Steel, Single Gang, Round Outlet Wall Plate	1	2	2.18	\N	Stockroom - Shelf N3	\N	\N	2025-08-18 14:04:42.104708	1	282
1609	Err10	Gray, Single Gang, Blank Cover	Stainless Steel with Gray Finish, Single Gang, Blank Wall Plate	1	2	1.52	\N	Stockroom - Shelf N3	\N	\N	2025-08-18 14:10:14.527662	1	282
1610	783585358871	Portable Outlet Box Cover	Hubbell Gray, Single Gang, Portable Outlet Box Cover	1	2	7.36	\N	Stockroom - Shelf N3	\N	\N	2025-08-18 14:13:30.78793	1	282
1535	078477428405	Stainless Steel, Single Gang, Outlet Cover	Leviton Stainless Steel, Single Gang, Outlet Wall Plate 	14	2	1.63	\N	Stockroom - Shelf N3	\N	\N	2025-07-30 17:33:42.41211	1	282
1611	815333017379	Tri-Tap Adapter	GoGreen Gray Power 3-Outlet Heavy Duty Tri-Tap Adapter, 15A 125V, GG-03431BE	2	2	8.39	\N	Stockroom - Shelf N3	\N	\N	2025-08-18 14:19:33.835931	1	282
1612	783310324331	Nylon Fish Line	Greenlee 2150ft, 85lbs Strength Nylon Fish Line	2	2	45.75	\N	Stockroom - Shelf N3	\N	\N	2025-08-18 14:32:35.131797	1	282
1613	783250348152	Clear Glide Wire Pulling Lubricant	Ideal Clear Glide Wire Pulling Lubricant, 1 Quart	2	2	12.15	\N	Stockroom - Shelf N3	\N	\N	2025-08-18 14:36:11.125254	1	282
1614	034481024941	3/4" Carlon Conduit Clamp	Gray PVC 3/4" Carlon Conduit Clamp	6	2	4.85	\N	Stockroom - Shelf N3	\N	\N	2025-08-18 15:06:25.991877	1	282
1059	028874013650	Black and Decker Jig Saw Blade	\N	1	1	16.25	\N	\N	\N	\N	2025-04-09 12:20:26.75411	\N	\N
1064	821831093722	CE505A, 05A TONER	\N	2	1	0.00	\N	\N	\N	\N	2025-04-09 12:20:27.151743	\N	\N
1063	801509159554	CC364X	\N	3	1	0.00	\N	\N	\N	\N	2025-04-09 12:20:27.073985	\N	\N
1065	821831124532	CF280X Toner	\N	3	1	0.00	\N	\N	\N	\N	2025-04-09 12:20:27.232517	\N	\N
1146	821831074141	WX103 Waste Toner Cartridge	\N	9	1	0.00	\N	\N	\N	\N	2025-04-09 12:20:34.86757	\N	\N
1030	821831151668	206A 59513 TONER	\N	2	1	0.00	\N	\N	\N	\N	2025-04-09 12:20:23.634054	\N	\N
1040	821831110115	410A TONER	\N	2	1	0.00	\N	\N	\N	\N	2025-04-09 12:20:24.632842	\N	\N
1045	A0ATWY0	A0ATWY0 WASTE TONER	\N	3	1	0.00	\N	\N	\N	\N	2025-04-09 12:20:25.108523	\N	\N
1032	000.200.002	3/8 BI TEE	\N	5	1	1.25	\N	\N	\N	\N	2025-04-09 12:20:23.875844	\N	\N
1033	000.200.001	3/8 BI UNION	\N	6	1	1.25	\N	\N	\N	\N	2025-04-09 12:20:23.972086	\N	\N
1034	000.200.052	3/8 X 1 BI REDUCER	\N	3	1	1.25	\N	\N	\N	\N	2025-04-09 12:20:24.064008	\N	\N
1035	000.200.046	3/8 X 3/4 BI 90	\N	8	1	1.25	\N	\N	\N	\N	2025-04-09 12:20:24.155936	\N	\N
1615	MANUAL_COBS	cobs	Manual item: cobs	999995	\N	0.00	\N	\N	\N	\N	2025-08-19 16:34:03.48436	1	1
1616	Err11	1" Carlon Conduit Clamp	Gray PVC 1" Carlon Conduit Clamp	77	10	0.54	\N	Stockroom - Shelf N3	\N	\N	2025-08-19 19:15:06.005886	1	282
1617	032076555504	1/2" Carlon Cable Clamps	White PVC 1/2" Carlon Cable Clamps	93	10	0.23	\N	Stockroom - Shelf N3	\N	\N	2025-08-19 19:18:05.816813	1	282
1618	1 22N898	Tape Measure	Easy Read 25'	4	1	13.69	\N	Stockroom - Shelf E1	\N	\N	2025-08-22 17:12:25.427595	1	167
1619	1 1NNY3	Delta Cartridge	RP19801	8	1	0.00	\N	Stockroom - Shelf J3	\N	\N	2025-08-29 14:16:31.395011	1	178
1137	1PA33K232	TN512Y TONER	\N	1	1	0.00	\N	\N	\N	\N	2025-04-09 12:20:33.767119	\N	\N
1084	x0049ml2mb	HP 26A CF226A Toner	\N	2	1	0.00	\N	\N	\N	\N	2025-04-09 12:20:29.141937	\N	\N
1083	X002RWUSXJ	Emergency Ni-Cad battery	\N	2	1	5.00	\N	\N	\N	\N	2025-04-09 12:20:29.054842	\N	\N
1139	1PA9E813c	TN514JK TONER		2	1	0.00	\N		\N	\N	2025-04-09 12:20:33.938517	\N	\N
1092	821831125461	Katun 52399 Toner Waste Box AA7NR70400	\N	1	1	0.00	\N	\N	\N	\N	2025-04-09 12:20:29.84079	\N	\N
1095	077146041051	Graphited lock fluid	Lock-Ease General Purpose Lubricant Spray 3 Oz	5	1	11.25	\N	Stockroom - Shelf T4	\N	\N	2025-04-09 12:20:30.100146	1	308
1085	801509159394	HP42X TONER	\N	6	1	0.00	\N	\N	\N	\N	2025-04-09 12:20:29.228777	\N	\N
1129	1pA8DA430	TN324C Toner	\N	2	1	0.00	\N	\N	\N	\N	2025-04-09 12:20:33.072375	\N	\N
1131	1pA8DA230	TN324Y Toner	\N	2	1	0.00	\N	\N	\N	\N	2025-04-09 12:20:33.242822	\N	\N
1133	1pAAV813A	TN328AK Toner		0	1	0.00	\N	Stockroom - Shelf A3	\N	\N	2025-04-09 12:20:33.414149	1	163
1138	1PA33K031	TN513 TONER	\N	2	1	0.00	\N	\N	\N	\N	2025-04-09 12:20:33.852438	\N	\N
1140	1PA9E8330	TN514M TONER	\N	2	1	0.00	\N	\N	\N	\N	2025-04-09 12:20:34.029043	\N	\N
1141	1PA9E8230	TN514Y TONER	\N	2	1	0.00	\N	\N	\N	\N	2025-04-09 12:20:34.116252	\N	\N
1096	012611588518	Manual, 8" Mount, 4 Hole Low Arc Kitchen Faucet	\N	2	1	81.00	\N	\N	\N	\N	2025-04-09 12:20:30.185566	\N	\N
1086	192545175975	HP58x TONER	\N	3	1	0.00	\N	\N	\N	\N	2025-04-09 12:20:29.314142	\N	\N
1087	012611405112	Handle Kit, Reliant 3	\N	3	1	13.00	\N	\N	\N	\N	2025-04-09 12:20:29.402069	\N	\N
1135	1PA33K13D	TN512JK TONER	\N	4	1	0.00	\N	\N	\N	\N	2025-04-09 12:20:33.594042	\N	\N
1142	821831118586	TN516 TONER	\N	4	1	0.00	\N	\N	\N	\N	2025-04-09 12:20:34.204662	\N	\N
1128	1pa33k230	TN321Y Toner	\N	5	1	0.00	\N	\N	\N	\N	2025-04-09 12:20:32.984154	\N	\N
1125	1pa33k430	TN321C Toner	\N	8	1	0.00	\N	\N	\N	\N	2025-04-09 12:20:32.721367	\N	\N
1077	028874045187	DeWalt High Performance 4-1/2 in. D X 7/8 in. Aluminum Oxide Cutting/Grinding Wheel 1 Pc	\N	2	1	2.09	\N	\N	\N	\N	2025-04-09 12:20:28.187863	\N	\N
1079	034449953566	Delta Nicoli: Two Handle Widespread Bathroom Faucet	\N	2	1	117.52	\N	\N	\N	\N	2025-04-09 12:20:28.347128	\N	\N
1126	1pa33k130	TN321K Toner	\N	12	1	0.00	\N	\N	\N	\N	2025-04-09 12:20:32.807195	\N	\N
1110	4HCU8	P6000-D-SD	\N	18	1	8.75	\N	\N	\N	\N	2025-04-09 12:20:31.401575	\N	\N
1121	046135208850	Sylvania 20885 Cf32dt/E/in/835 32w W/ Gx24vq-3 Base- Neutral White- Cfl Bulb	\N	44	1	3.35	\N	Stockroom - Shelf G1	\N	\N	2025-04-09 12:20:32.37079	\N	\N
1134	1pA33K432	TN512C TONER	\N	1	1	0.00	\N	\N	\N	\N	2025-04-09 12:20:33.505942	\N	\N
25	100079	Plumbing Strap-Galvanized Hanger Strap	\N	8	1	1.19	\N	Stockroom A-36	\N	\N	2025-03-31 17:32:55.115974	\N	\N
17	100050F	Corner Brace 1 1/2'' -each	\N	9	1	0.50	\N	Stockroom A-28	\N	\N	2025-03-31 17:32:54.429636	\N	\N
70	100427C	3/16 x 500' nylon rope - spool	\N	1	1	105.00	\N	Stockroom A-81	\N	\N	2025-03-31 17:32:59.133931	\N	\N
1147	045325167977	Wire Wheel-coarse 4	\N	2	1	11.74	\N	\N	\N	\N	2025-04-09 12:20:34.948565	\N	\N
36	100136A	Hose Clamps-Small	\N	108	1	0.83	\N	Stockroom A-47	\N	\N	2025-03-31 17:32:56.057927	\N	\N
73	100431A	Plastic,Brass or Chrome Shelf Support -each	\N	293	1	0.15	\N	Stockroom A-84	\N	\N	2025-03-31 17:32:59.390815	\N	\N
6	100046C	Gate Hooks and Eyes	\N	42	1	1.55	\N	Stockroom A-17	\N	\N	2025-03-31 17:32:53.476738	\N	\N
47	857236004018	Kroil Oil	Kroil Penetrant Original Spray Lube, 10 oz Aerosol can	5	1	21.96	\N	Stockroom	\N	\N	2025-03-31 17:32:57.062022	1	\N
71	100427D	3/8 x 100 Nylon Rope	\N	2	1	15.95	\N	Stockroom A-82	\N	\N	2025-03-31 17:32:59.219532	\N	\N
1132	808220437077	TN325AK TONER	\N	2	1	0.00	\N	\N	\N	\N	2025-04-09 12:20:33.32919	\N	\N
65	100379A	Sump Pump Hose Kit	\N	1	1	12.91	\N	Stockroom A-76	\N	\N	2025-03-31 17:32:58.702464	\N	\N
66	100379	Sump Pump Check Valve	\N	2	1	9.37	\N	Stockroom A-77	\N	\N	2025-03-31 17:32:58.788872	\N	\N
50	100165	Sizzle Acid-per qt.		2	1	12.05	\N		\N	\N	2025-03-31 17:32:57.344703	\N	\N
39	100151A	Plumbers Caulk	\N	5	1	3.74	\N	Stockroom A-50	\N	\N	2025-03-31 17:32:56.314225	\N	\N
1130	1pA8DA330	TN324M Toner	\N	3	1	0.00	\N	\N	\N	\N	2025-04-09 12:20:33.157617	\N	\N
15	100050C	Corner Brace-2''-each	\N	30	1	0.59	\N	Stockroom A-26	\N	\N	2025-03-31 17:32:54.25403	\N	\N
26	100081A	Silicone-Lubricant Can	\N	3	1	7.99	\N	Stockroom A-37	\N	\N	2025-03-31 17:32:55.201154	\N	\N
7	100047A	U Clamps	\N	0	1	3.20	\N	Stockroom A-18	\N	\N	2025-03-31 17:32:53.562263	\N	\N
63	100323B	Screen Patch	\N	4	1	2.54	\N	Stockroom A-74	\N	\N	2025-03-31 17:32:58.531685	\N	\N
67	100385	Sump Pump	\N	4	1	201.72	\N	Stockroom A-78	\N	\N	2025-03-31 17:32:58.874785	\N	\N
57	100308	Anti-Sieze Lube	\N	4	1	7.52	\N	Stockroom A-68	\N	\N	2025-03-31 17:32:58.014186	\N	\N
2	100014H	GRC couplings	\N	5	1	0.70	\N	Stockroom A-13	\N	\N	2025-03-31 17:32:53.133574	\N	\N
1136	1PA33K332	TN512M TONER	\N	1	1	0.00	\N	\N	\N	\N	2025-04-09 12:20:33.680133	\N	\N
44	100152	Tub & Tile Adhesive Caulk	\N	5	1	2.19	\N	Stockroom A-55	\N	\N	2025-03-31 17:32:56.804025	\N	\N
56	100301	All T-50 Staples -per box	\N	6	1	2.88	\N	Stockroom A-67	\N	\N	2025-03-31 17:32:57.929106	\N	\N
30	100082	Grease Cartridge-14 oz.	\N	2	1	4.66	\N	Stockroom A-41	\N	\N	2025-03-31 17:32:55.542475	\N	\N
62	100320	Toilet Tank Gaskets	\N	15	1	5.00	\N	Stockroom A-73	\N	\N	2025-03-31 17:32:58.444563	\N	\N
46	100157B	PB Blaster -Penetrating Oil	\N	5	1	5.57	\N	Stockroom A-57	\N	\N	2025-03-31 17:32:56.976627	\N	\N
1150	1514781922	Viega ProPress 1 1/2	78192 Viega ProPress 1 1/2	6	2	42.00	\N	\N	\N	\N	2025-04-21 11:29:16.134319	\N	\N
68	100390	Towel Bars	\N	7	1	4.58	\N	Stockroom A-79	\N	\N	2025-03-31 17:32:58.960238	\N	\N
28	100082A	Food Grade Grease-Cartridge	\N	7	1	9.03	\N	Stockroom A-39	\N	\N	2025-03-31 17:32:55.372325	\N	\N
29	100082S	G-4700 Synthetic Grease-Dow	\N	7	1	12.08	\N	Stockroom A-40	\N	\N	2025-03-31 17:32:55.457387	\N	\N
19	100052	Mending Plate	\N	8	1	1.10	\N	Stockroom A-30	\N	\N	2025-03-31 17:32:54.601286	\N	\N
18	100051	Flat Stock-pre hardened	\N	7	1	8.20	\N	Stockroom A-29	\N	\N	2025-03-31 17:32:54.514333	\N	\N
1127	1pa33k330	TN321M Toner	\N	9	1	0.00	\N	\N	\N	\N	2025-04-09 12:20:32.893693	\N	\N
4	100039	All Air Deflectors/Registers	\N	72	1	4.16	\N	Stockroom A-15	\N	\N	2025-03-31 17:32:53.305406	\N	\N
13	100050A	Corner Brace-3''-each	\N	12	1	0.72	\N	Stockroom A-24	\N	\N	2025-03-31 17:32:54.081383	\N	\N
5	100043	Brass Door Holder- Kick down	\N	13	1	8.37	\N	Stockroom A-16	\N	\N	2025-03-31 17:32:53.390827	\N	\N
3	100031	All Strap/Butt/Door Hinges	\N	12	1	3.20	\N	Stockroom A-14	\N	\N	2025-03-31 17:32:53.220186	\N	\N
32	100087	Rubber Door Wedges-per pack	\N	14	1	1.13	\N	Stockroom A-43	\N	\N	2025-03-31 17:32:55.714862	\N	\N
16	100050D	Corner Brace 5'' -each	\N	15	1	0.94	\N	Stockroom A-27	\N	\N	2025-03-31 17:32:54.341749	\N	\N
14	100050B	Corner Brace-4''-each	\N	14	1	1.27	\N	Stockroom A-25	\N	\N	2025-03-31 17:32:54.168466	\N	\N
37	100136B	Hose Clamps-Medium	\N	62	1	0.70	\N	Stockroom A-48	\N	\N	2025-03-31 17:32:56.143605	\N	\N
64	100325	Chrome Beaded Chain-per foot	\N	20	1	0.45	\N	Stockroom A-75	\N	\N	2025-03-31 17:32:58.616955	\N	\N
11	100049B	Flat Corner Brace	\N	17	1	0.56	\N	Stockroom A-22	\N	\N	2025-03-31 17:32:53.908088	\N	\N
54	100213L	All 1/2 Eyebolts	\N	17	1	2.80	\N	Stockroom A-65	\N	\N	2025-03-31 17:32:57.694436	\N	\N
51	100213G	All 1/4 Eyebolts	\N	24	1	0.75	\N	Stockroom A-62	\N	\N	2025-03-31 17:32:57.431035	\N	\N
1152	WBL001	B&G Bearing Assembly	\N	2	1	42.00	\N	\N	\N	\N	2025-04-29 11:38:07.465304	\N	\N
34	100116	Air Conditioner Weather Strip	\N	29	1	2.25	\N	Stockroom A-45	\N	\N	2025-03-31 17:32:55.884571	\N	\N
8	100047	Cable Clips kit	\N	29	1	2.30	\N	Stockroom A-19	\N	\N	2025-03-31 17:32:53.647877	\N	\N
22	100067A	Large S Hooks-each	\N	33	1	0.35	\N	Stockroom A-33	\N	\N	2025-03-31 17:32:54.85756	\N	\N
55	100290A	Bungee Cords	\N	35	1	2.20	\N	Stockroom A-66	\N	\N	2025-03-31 17:32:57.843614	\N	\N
20	100056A	Large Cup Hooks-each	\N	40	1	0.28	\N	Stockroom A-31	\N	\N	2025-03-31 17:32:54.686505	\N	\N
61	100320C	Toilet Bowl-Reg. or Elongated	\N	1	1	105.07	\N	Stockroom A-72	\N	\N	2025-03-31 17:32:58.358357	\N	\N
1151	037155016082	American Standard Cold Stem	Cold stem	41	10	14.42	\N	Stockroom - Shelf J3	\N	\N	2025-04-29 11:28:52.283294	\N	\N
9	100048	Chair/ Table Braces	\N	40	1	1.86	\N	Stockroom A-20	\N	\N	2025-03-31 17:32:53.734667	\N	\N
49	100164	Acid Brushes -each	\N	53	1	0.16	\N	Stockroom A-60	\N	\N	2025-03-31 17:32:57.249436	\N	\N
38	100136C	Hose Clamps -Large	\N	64	1	2.06	\N	Stockroom A-49	\N	\N	2025-03-31 17:32:56.22887	\N	\N
52	100213J	All 5/16 Eyebolts	\N	79	1	0.88	\N	Stockroom A-63	\N	\N	2025-03-31 17:32:57.518784	\N	\N
58	100310	Screen Spline-per bag	\N	3	1	1.93	\N	Stockroom A-69	\N	\N	2025-03-31 17:32:58.102864	\N	\N
74	100431B	256BR brass shelf support -clip -each	\N	90	1	0.15	\N	Stockroom A-85	\N	\N	2025-03-31 17:32:59.479918	\N	\N
35	073754152363	Contact Cement	super glue contact cement 1 fl oz	8	5	8.99	\N	Stockroom - Shelf T2	\N	\N	2025-03-31 17:32:55.973124	1	306
53	100213K	All 3/8 Eyebolts	\N	120	1	1.38	\N	Stockroom A-64	\N	\N	2025-03-31 17:32:57.606263	\N	\N
23	100067	Small S Hooks-each	\N	186	1	0.24	\N	Stockroom A-34	\N	\N	2025-03-31 17:32:54.942712	\N	\N
21	100056	Small Cup Hooks	\N	240	1	0.08	\N	Stockroom A-32	\N	\N	2025-03-31 17:32:54.77276	\N	\N
42	100151	Plumbers Putty or Faucet Grease	\N	13	1	5.21	\N	Stockroom A-53	\N	\N	2025-03-31 17:32:56.633509	\N	\N
12	100049	Assorted Screw Hooks	\N	451	1	0.28	\N	Stockroom A-23	\N	\N	2025-03-31 17:32:53.99401	\N	\N
59	100320A	Toilet Tank	\N	2	1	67.34	\N	Stockroom A-70	\N	\N	2025-03-31 17:32:58.187848	\N	\N
90	100558C	Floor Door Stop	\N	15	1	3.87	\N	Stockroom A-101	\N	\N	2025-03-31 17:33:00.857864	\N	\N
113	110418H	160D masterlock - keyed different		0	1	13.38	\N		\N	\N	2025-03-31 17:33:02.83548	\N	\N
105	110118A	Folding Door Hardware Kit-Top Guides	\N	48	1	4.71	\N	Stockroom A-116	\N	\N	2025-03-31 17:33:02.146579	\N	\N
121	120053A	Cabinet Catches-Ball catch		12	1	1.15	\N	Stockroom	\N	\N	2025-03-31 17:33:03.521119	1	\N
79	100450	3/8 Yellow Nylon Rope -per foot	\N	450	1	0.10	\N	Stockroom A-90	\N	\N	2025-03-31 17:32:59.912347	\N	\N
97	100601F	Solder Flux-Paste	\N	3	1	3.83	\N	Stockroom A-108	\N	\N	2025-03-31 17:33:01.46122	\N	\N
132	150004	#8 Self Drilling Screws - box	\N	11	1	7.00	\N	Stockroom A-143	\N	\N	2025-03-31 17:33:04.504	\N	\N
86	100549	3/16 x 250, 250 or 300 spool rope	\N	2	1	27.73	\N	Stockroom A-97	\N	\N	2025-03-31 17:33:00.51125	\N	\N
124	122331	microwaves		9	1	79.53	\N		\N	\N	2025-03-31 17:33:03.810635	\N	\N
60	100320B	Urinal	\N	1	1	152.00	\N	Stockroom A-71	\N	\N	2025-03-31 17:32:58.273534	\N	\N
133	150006	#10 Self Drilling Screws- Box	\N	1	1	8.00	\N	Stockroom - Shelf A4	\N	\N	2025-03-31 17:33:04.589787	\N	\N
117	120029C	Hasp-Safety	\N	2	1	3.26	\N	Stockroom A-128	\N	\N	2025-03-31 17:33:03.178123	\N	\N
98	100603	Lead Free Solder	\N	2	1	17.15	\N	Stockroom A-109	\N	\N	2025-03-31 17:33:01.549006	\N	\N
128	130002R	Red Expandets-per box	\N	2	1	4.24	\N	Stockroom A-139	\N	\N	2025-03-31 17:33:04.161473	\N	\N
122	120057B	QOB 3100 - QO3100 breaker	\N	2	1	244.92	\N	Stockroom A-133	\N	\N	2025-03-31 17:33:03.606437	\N	\N
88	100554	Grab Hooks 5/16 Clevis	\N	3	1	4.20	\N	Stockroom A-99	\N	\N	2025-03-31 17:33:00.686002	\N	\N
103	110075	Great Stuff Insulating Foam	\N	2	1	16.48	\N	Stockroom A-114	\N	\N	2025-03-31 17:33:01.976227	\N	\N
27	100081	White Lithium Grease-Spray Can	\N	3	1	5.75	\N	Stockroom A-38	\N	\N	2025-03-31 17:32:55.287378	\N	\N
91	100558D	Wall Protecting Door Stops and Almond Plastic Covers	\N	4	1	2.66	\N	Stockroom A-102	\N	\N	2025-03-31 17:33:00.942856	\N	\N
112	110418G	Small Master lock 140D	\N	4	1	6.99	\N	Stockroom A-123	\N	\N	2025-03-31 17:33:02.748797	\N	\N
115	111012C	Threaded Rod-1/2-7/16-3/4 x 6'	\N	4	1	7.50	\N	Stockroom A-126	\N	\N	2025-03-31 17:33:03.006869	\N	\N
108	110139	Brown/Chrome Latch Guard	\N	4	1	14.50	\N	Stockroom A-119	\N	\N	2025-03-31 17:33:02.407114	\N	\N
110	110418D	Master Lock -key 3369	\N	4	1	6.10	\N	Stockroom A-121	\N	\N	2025-03-31 17:33:02.578845	\N	\N
48	100157	WD-40 and All LPS Products	\N	4	1	5.51	\N	Stockroom A-59	\N	\N	2025-03-31 17:32:57.159717	\N	\N
107	110139A	Weatherproof A844 Lock	\N	5	1	16.60	\N	Stockroom A-118	\N	\N	2025-03-31 17:33:02.319706	\N	\N
131	150004A	#6 Self Drilling Screws - Box	\N	5	1	4.25	\N	Stockroom A-142	\N	\N	2025-03-31 17:33:04.418688	\N	\N
102	110066	Showcase Lock	\N	6	1	4.23	\N	Stockroom A-113	\N	\N	2025-03-31 17:33:01.891434	\N	\N
123	120057	Coat and Hat Hooks-each	\N	7	1	2.11	\N	Stockroom A-134	\N	\N	2025-03-31 17:33:03.691721	\N	\N
99	100631	Picture Wire	\N	5	1	1.15	\N	Stockroom A-110	\N	\N	2025-03-31 17:33:01.635656	\N	\N
76	100433	Mirror Holder Kits	\N	8	1	1.59	\N	Stockroom A-87	\N	\N	2025-03-31 17:32:59.653918	\N	\N
126	130002B	Blue Expandets -per box	\N	7	1	9.91	\N	Stockroom A-137	\N	\N	2025-03-31 17:33:03.990413	\N	\N
137	150016	#8 Sheet Metal screws - box	\N	9	1	4.28	\N	Stockroom A-148	\N	\N	2025-03-31 17:33:04.933205	\N	\N
100	100651	All Pop Rivets-per pack	\N	12	1	1.30	\N	Stockroom A-111	\N	\N	2025-03-31 17:33:01.721083	\N	\N
33	100100	Vinyl Tubing-per foot	\N	1436	1	0.31	\N	Stockroom A-44	\N	\N	2025-03-31 17:32:55.799808	\N	\N
87	100552	Storage or Ladder Hooks	\N	13	1	0.71	\N	Stockroom A-98	\N	\N	2025-03-31 17:33:00.599341	\N	\N
116	111012	Threaded Rod 1/4 5/16 3/8 x 1' 2' 3'	\N	14	1	1.75	\N	Stockroom A-127	\N	\N	2025-03-31 17:33:03.09302	\N	\N
83	100455	Door Sweep	\N	13	1	6.93	\N	Stockroom A-94	\N	\N	2025-03-31 17:33:00.255061	\N	\N
94	100562A	Double End Bolt Snap	\N	15	1	1.78	\N	Stockroom A-105	\N	\N	2025-03-31 17:33:01.200223	\N	\N
31	100083	Zoom Spout Oiler	\N	16	1	2.35	\N	Stockroom A-42	\N	\N	2025-03-31 17:32:55.629944	\N	\N
127	130002G	Green expandets-per box	\N	18	1	5.13	\N	Stockroom A-138	\N	\N	2025-03-31 17:33:04.076116	\N	\N
96	100578	Assorted Picture Hangers-per pack	\N	21	1	1.15	\N	Stockroom A-107	\N	\N	2025-03-31 17:33:01.376113	\N	\N
77	100441	Brass plumbers chain-small chain -per foot	\N	24	1	0.45	\N	Stockroom A-88	\N	\N	2025-03-31 17:32:59.740511	\N	\N
101	110004	Lock-De-Icer	\N	24	1	1.54	\N	Stockroom A-112	\N	\N	2025-03-31 17:33:01.806152	\N	\N
84	100485	Copper and Tube Cleaning Brush	\N	26	1	3.14	\N	Stockroom A-95	\N	\N	2025-03-31 17:33:00.340581	\N	\N
106	110118	Closet Door Hangers-Stanley	\N	29	1	2.50	\N	Stockroom A-117	\N	\N	2025-03-31 17:33:02.23431	\N	\N
118	120039A	Front Drawer Pull-Brass	\N	41	1	1.17	\N	Stockroom A-129	\N	\N	2025-03-31 17:33:03.263773	\N	\N
114	111012B	Threaded Rod 1/4 5/16 3/8 x 6'	\N	42	1	2.80	\N	Stockroom A-125	\N	\N	2025-03-31 17:33:02.921491	\N	\N
104	110112	Closet Door Handles	\N	48	1	1.98	\N	Stockroom A-115	\N	\N	2025-03-31 17:33:02.061069	\N	\N
78	100443	White Link Chain -per ft.	\N	50	1	0.76	\N	Stockroom A-89	\N	\N	2025-03-31 17:32:59.826176	\N	\N
75	100431C	Shelf Rests - per pack	\N	1	1	1.09	\N	Stockroom A-86	\N	\N	2025-03-31 17:32:59.5657	\N	\N
85	100546	All Ceiling Hooks	\N	65	1	0.44	\N	Stockroom A-96	\N	\N	2025-03-31 17:33:00.425773	\N	\N
82	100454	Small link Chain-silver-per ft. double loop	\N	83	1	0.25	\N	Stockroom A-93	\N	\N	2025-03-31 17:33:00.170462	\N	\N
89	100557	All Turnbuckles	\N	87	1	3.67	\N	Stockroom A-100	\N	\N	2025-03-31 17:33:00.772267	\N	\N
81	100453	Steel Sash Chain-Gold per ft.	\N	117	1	0.60	\N	Stockroom A-92	\N	\N	2025-03-31 17:33:00.084726	\N	\N
80	100452	Large link Machine Chain-per ft. 2/0	\N	229	1	0.66	\N	Stockroom A-91	\N	\N	2025-03-31 17:32:59.998887	\N	\N
130	130032	Wej-It wedge anchor-each	\N	230	1	1.85	\N	Stockroom A-141	\N	\N	2025-03-31 17:33:04.333435	\N	\N
129	130023	Assorted Lag Screw Shields	\N	268	1	0.74	\N	Stockroom A-140	\N	\N	2025-03-31 17:33:04.246934	\N	\N
93	100559C	Black Rubber Chair Tips-24 per bag (BB162051) EACH	\N	408	1	0.36	\N	Stockroom A-104	\N	\N	2025-03-31 17:33:01.113019	\N	\N
151	150065A	1/4'' Carriage Bolts	\N	523	1	0.10	\N	Stockroom A-162	\N	\N	2025-03-31 17:33:06.128817	\N	\N
141	150025	All 1/4 Machine Screws -Bins-each	\N	972	1	0.10	\N	Stockroom A-152	\N	\N	2025-03-31 17:33:05.274122	\N	\N
188	150445	1'' 1 1/2'' PVC pipe - per foot	\N	0	1	1.90	\N	Stockroom A-199	\N	\N	2025-03-31 17:33:09.342651	\N	\N
142	150027	All #6 and #8 Machine Screws - bins each	\N	1322	1	0.02	\N	Stockroom A-153	\N	\N	2025-03-31 17:33:05.359345	\N	\N
120	120042	Cabinet Hinge -Brass or Aluminum	\N	61	1	1.68	\N	Stockroom A-131	\N	\N	2025-03-31 17:33:03.435326	\N	\N
143	150028	All #10 Machine Screws-Bins-each	\N	2074	1	0.02	\N	Stockroom A-154	\N	\N	2025-03-31 17:33:05.445013	\N	\N
149	150050	All Toggles - per box	\N	12	1	8.79	\N	Stockroom A-160	\N	\N	2025-03-31 17:33:05.957884	\N	\N
178	150250	EZ Anchor-Plastic -per box	\N	1	1	17.00	\N	Stockroom A-189	\N	\N	2025-03-31 17:33:08.481504	1	300
155	150070A	5/16 Hex Cap Bolts-each	\N	911	1	0.16	\N	Stockroom A-166	\N	\N	2025-03-31 17:33:06.474688	\N	\N
207	156162	All Copper Unions	\N	27	1	8.70	\N	Stockroom A-218	\N	\N	2025-03-31 17:33:10.978013	\N	\N
190	150447	3'' and 4'' PVC pipe -per foot	\N	0	1	6.25	\N	Stockroom A-201	\N	\N	2025-03-31 17:33:09.514252	\N	\N
189	150446	2'' PVC pipe-per foot	\N	0	1	2.78	\N	Stockroom A-200	\N	\N	2025-03-31 17:33:09.428579	\N	\N
182	150380	3/4 CPVC Pipe	\N	0	1	1.75	\N	Stockroom A-193	\N	\N	2025-03-31 17:33:08.82555	\N	\N
186	150432	4'' PVC Pipe Fittings	\N	2	1	4.10	\N	Stockroom A-197	\N	\N	2025-03-31 17:33:09.171141	\N	\N
183	150389C	All Swivel Pulleys	\N	27	1	2.80	\N	Stockroom A-194	\N	\N	2025-03-31 17:33:08.910655	\N	\N
181	150379	1/2'' CPVC Pipe	\N	0	1	0.94	\N	Stockroom A-192	\N	\N	2025-03-31 17:33:08.739732	\N	\N
264	200001C	1 1/4 Threaded Tail Piece - Chrome	\N	6	1	5.15	\N	Stockroom A-275	\N	\N	2025-03-31 17:33:15.910344	\N	\N
212	159518	All BI Bushing	\N	33	1	2.12	\N	Stockroom A-223	\N	\N	2025-03-31 17:33:11.406103	\N	\N
180	150316B	All 1/4 Tapcons -per box	\N	5	1	16.70	\N	Stockroom A-191	\N	\N	2025-03-31 17:33:08.653351	\N	\N
185	150431	3'' PVC fittings	\N	8	1	3.87	\N	Stockroom A-196	\N	\N	2025-03-31 17:33:09.085013	\N	\N
145	150032	All Drywall Screws-per box	\N	2	1	6.25	\N	Stockroom A-156	\N	\N	2025-03-31 17:33:05.616294	\N	\N
171	150228	All 3/8 Lag Screws-each	\N	309	1	0.18	\N	Stockroom A-182	\N	\N	2025-03-31 17:33:07.878175	\N	\N
179	150316A	All 3/16 Tapcons -per box	\N	6	1	12.03	\N	Stockroom A-190	\N	\N	2025-03-31 17:33:08.567415	\N	\N
268	200002D	1 1/4 x 6 Extension Tubes	\N	2	1	6.18	\N	Stockroom A-279	\N	\N	2025-03-31 17:33:16.253254	\N	\N
168	150154	Hex Nuts-1/4-5/16-3/8	\N	1448	1	0.06	\N	Stockroom A-179	\N	\N	2025-03-31 17:33:07.615945	\N	\N
174	150237	All Flat Washers - small	\N	4042	1	0.02	\N	Stockroom A-185	\N	\N	2025-03-31 17:33:08.134086	\N	\N
266	200002B	1 1/2 Extension Tubes - chrome	\N	6	1	11.56	\N	Stockroom A-277	\N	\N	2025-03-31 17:33:16.081512	\N	\N
267	200002C	1 1/2 Extension Tubes - PVC	\N	20	1	1.90	\N	Stockroom A-278	\N	\N	2025-03-31 17:33:16.167718	\N	\N
187	150444	1/2-3/4 PVC pipe-per foot	\N	0	1	0.20	\N	Stockroom A-198	\N	\N	2025-03-31 17:33:09.256965	\N	\N
942	730018	Carpet Tape	\N	14	1	3.92	\N	Stockroom A-954	\N	\N	2025-03-31 17:34:14.798766	\N	\N
147	150046	Zinc EZ Anchor and Molly Wall Anchors-per box	\N	5	1	9.88	\N	Stockroom A-158	\N	\N	2025-03-31 17:33:05.786676	\N	\N
265	200002A	1 1/4 Extension Tubes - Chrome	\N	19	1	10.94	\N	Stockroom A-276	\N	\N	2025-03-31 17:33:15.996267	\N	\N
213	159535	All BI Cap	\N	25	1	2.47	\N	Stockroom A-224	\N	\N	2025-03-31 17:33:11.491077	\N	\N
184	150389K	Variable Pitch Sheave Pully	\N	20	1	32.26	\N	Stockroom A-195	\N	\N	2025-03-31 17:33:08.999896	\N	\N
201	156016	All Copper Female Adapters	\N	21	1	3.79	\N	Stockroom A-212	\N	\N	2025-03-31 17:33:10.458966	\N	\N
166	150119C	1/2'' Coupling Nuts	\N	22	1	0.03	\N	Stockroom A-177	\N	\N	2025-03-31 17:33:07.438945	\N	\N
164	150119A	1/4'' Coupling Nuts	\N	22	1	0.03	\N	Stockroom A-175	\N	\N	2025-03-31 17:33:07.267339	\N	\N
206	156121	All Copper Caps	\N	56	1	2.07	\N	Stockroom A-217	\N	\N	2025-03-31 17:33:10.892533	\N	\N
208	156172	All Copper Coupling and Reducing Couplings	\N	41	1	3.15	\N	Stockroom A-219	\N	\N	2025-03-31 17:33:11.063874	\N	\N
146	150040	Nylon Fish Line	\N	1	1	38.00	\N	Stockroom A-157	\N	\N	2025-03-31 17:33:05.701426	\N	\N
162	150097A	Large Wing Nuts-each	\N	173	1	0.10	\N	Stockroom A-173	\N	\N	2025-03-31 17:33:07.093273	\N	\N
169	150208	All 1/4 Lag Screws-each	\N	650	1	0.08	\N	Stockroom A-180	\N	\N	2025-03-31 17:33:07.703243	\N	\N
160	150089	Barrel Bolt-Slide Latch	\N	3	1	5.83	\N	Stockroom A-171	\N	\N	2025-03-31 17:33:06.91655	1	278
202	156026	All Copper Male Adapters	\N	32	1	3.13	\N	Stockroom A-213	\N	\N	2025-03-31 17:33:10.547122	\N	\N
209	159436	All BI 90's and ST	\N	34	1	2.86	\N	Stockroom A-220	\N	\N	2025-03-31 17:33:11.150898	\N	\N
205	156095	All Copper Tee	\N	34	1	3.78	\N	Stockroom A-216	\N	\N	2025-03-31 17:33:10.806488	\N	\N
214	159544	All BI Plugs	\N	45	1	1.92	\N	Stockroom A-225	\N	\N	2025-03-31 17:33:11.576398	\N	\N
203	156037	All Copper 45's and ST	\N	48	1	4.88	\N	Stockroom A-214	\N	\N	2025-03-31 17:33:10.631848	\N	\N
211	159478	All BI Tee	\N	59	1	2.96	\N	Stockroom A-222	\N	\N	2025-03-31 17:33:11.320986	\N	\N
150	150057	Hex Nuts-3/4-1-1 1/2	\N	70	1	0.20	\N	Stockroom A-161	\N	\N	2025-03-31 17:33:06.043485	\N	\N
173	150237A	All Flat Washers -Large	\N	151	1	0.07	\N	Stockroom A-184	\N	\N	2025-03-31 17:33:08.048935	\N	\N
210	159469	All BI 45 and ST	\N	42	1	3.37	\N	Stockroom A-221	\N	\N	2025-03-31 17:33:11.235525	\N	\N
175	150238	All 1/2 Lag Screws -each	\N	189	1	0.26	\N	Stockroom A-186	\N	\N	2025-03-31 17:33:08.220151	\N	\N
170	150218	All 5/16 Lag Screws -each	\N	265	1	0.14	\N	Stockroom A-181	\N	\N	2025-03-31 17:33:07.789127	\N	\N
157	150070C	1/2 Hex Bolts -each	\N	307	1	0.46	\N	Stockroom A-168	\N	\N	2025-03-31 17:33:06.650961	\N	\N
154	150065D	1/2'' Carriage Bolt -each	\N	315	1	0.33	\N	Stockroom A-165	\N	\N	2025-03-31 17:33:06.387997	\N	\N
163	150097B	Small Wing Nuts-each	\N	344	1	0.10	\N	Stockroom A-174	\N	\N	2025-03-31 17:33:07.179119	\N	\N
148	150049	Assorted Toggle Bolts	\N	349	1	0.27	\N	Stockroom A-159	\N	\N	2025-03-31 17:33:05.872088	\N	\N
158	150070D	7/16 Hex Cap Bolts	\N	403	1	0.53	\N	Stockroom A-169	\N	\N	2025-03-31 17:33:06.741129	\N	\N
167	150131	Hex Nuts-6-32-10-32-8-32-12-24	\N	607	1	0.02	\N	Stockroom A-178	\N	\N	2025-03-31 17:33:07.528834	\N	\N
161	150095	All Sizes of Lock Nuts	\N	764	1	0.14	\N	Stockroom A-172	\N	\N	2025-03-31 17:33:07.00795	\N	\N
176	150244A	Medium Lock Washer-each	\N	973	1	0.03	\N	Stockroom A-187	\N	\N	2025-03-31 17:33:08.311436	\N	\N
177	150244B	Small Lock Washer-each	\N	1021	1	0.01	\N	Stockroom A-188	\N	\N	2025-03-31 17:33:08.396442	\N	\N
321	200129C	AM ST Cartridge-A951470-0070A-A951764-cartridge for 2 handle Monteray	\N	9	1	19.28	\N	Stockroom A-333	\N	\N	2025-03-31 17:33:20.817429	\N	\N
242	167066	All Brass 90's	\N	47	1	3.22	\N	Stockroom A-253	\N	\N	2025-03-31 17:33:14.001726	\N	\N
245	167090	All Brass Bushings	\N	43	1	3.86	\N	Stockroom A-256	\N	\N	2025-03-31 17:33:14.258873	\N	\N
277	200040A	Faucet Handles-AM ST	\N	7	1	59.65	\N	Stockroom A-288	\N	\N	2025-03-31 17:33:17.021789	\N	\N
272	200018J	P-Trap-PVC 1 1/2'' - 1 1/4''		18	1	1.53	\N		\N	\N	2025-03-31 17:33:16.595363	\N	\N
239	163584	1'' brass nipples	\N	5	1	0.25	\N	Stockroom A-250	\N	\N	2025-03-31 17:33:13.744227	\N	\N
261	180037	All Fender Washers	\N	688	1	0.07	\N	Stockroom A-272	\N	\N	2025-03-31 17:33:15.654781	\N	\N
312	200126	AM ST Metal Lever Handles - 050071-050081-0020A	\N	1	1	22.08	\N	Stockroom A-323	\N	\N	2025-03-31 17:33:20.040177	\N	\N
243	167079	All Brass Couplings	\N	8	1	2.42	\N	Stockroom A-254	\N	\N	2025-03-31 17:33:14.087616	\N	\N
313	200127A	AM ST Faucet Cartridge -28610-0070A	\N	6	1	27.12	\N	Stockroom A-324	\N	\N	2025-03-31 17:33:20.125267	\N	\N
226	160136A	Milwaukee Flashlight Bulb for 18V tool	\N	2	1	5.03	\N	Stockroom A-237	\N	\N	2025-03-31 17:33:12.608641	\N	\N
258	180007	B&G Impeller-118629	\N	2	1	130.00	\N	Stockroom A-269	\N	\N	2025-03-31 17:33:15.393761	\N	\N
350	200198	AM ST Activating Unit	\N	3	1	17.51	\N	Stockroom A-362	\N	\N	2025-03-31 17:33:23.322725	\N	\N
259	180014	Thumb Screws	\N	107	1	0.07	\N	Stockroom A-270	\N	\N	2025-03-31 17:33:15.48146	\N	\N
278	200040B	Delta Handle-H21	\N	2	1	13.85	\N	Stockroom A-289	\N	\N	2025-03-31 17:33:17.107634	\N	\N
246	167099	All Brass Unions	\N	26	1	9.06	\N	Stockroom A-257	\N	\N	2025-03-31 17:33:14.347334	\N	\N
280	200042	Twist and Set Closet Flange	\N	3	1	17.60	\N	Stockroom A-291	\N	\N	2025-03-31 17:33:17.279246	\N	\N
324	200129	AM ST Pressure Balance Valve - 077171-0070A-023529-M952100	\N	15	1	16.60	\N	Stockroom A-336	\N	\N	2025-03-31 17:33:21.080949	\N	\N
232	160151	Flashlight-2D cell	\N	4	1	2.76	\N	Stockroom A-243	\N	\N	2025-03-31 17:33:13.136491	\N	\N
286	200054A	Outdoor Faucet Repair kit-RK-17MH	\N	3	1	17.63	\N	Stockroom A-297	\N	\N	2025-03-31 17:33:17.792304	\N	\N
231	10039800016871	AAA Battery	Energizer Industrial Alkaline AAA Batteries	446	50	0.65	\N	Stockroom	\N	\N	2025-03-31 17:33:13.049187	1	\N
271	200018G	P-Trap-1 1/2'' Chrome	\N	4	1	13.52	\N	Stockroom A-282	\N	\N	2025-03-31 17:33:16.510069	\N	\N
276	200026	Bath Tub Spouts	\N	4	1	16.26	\N	Stockroom A-287	\N	\N	2025-03-31 17:33:16.936427	\N	\N
229	012800526413	9V Battery	Rayovac Ultra Pro 9V Battery	1	10	1.71	\N	Stockroom	\N	\N	2025-03-31 17:33:12.867258	1	\N
323	200129F	AM ST Faucet Handle- 051210-002	\N	5	1	14.55	\N	Stockroom A-335	\N	\N	2025-03-31 17:33:20.995626	\N	\N
233	160194	Mag-light or 2D bulbs	\N	6	1	3.16	\N	Stockroom A-244	\N	\N	2025-03-31 17:33:13.221514	\N	\N
301	200090	4 way water key -each	\N	6	1	3.40	\N	Stockroom A-312	\N	\N	2025-03-31 17:33:19.091316	\N	\N
269	200003A	All Sizes of Escutcheons	Beauty Rings	25	1	1.19	\N		\N	\N	2025-03-31 17:33:16.339452	\N	\N
249	167505	All Brass Plugs		49	1	3.27	\N		\N	\N	2025-03-31 17:33:14.604122	\N	\N
237	163551	1/2'' Brass Nipples	\N	219	1	3.62	\N	Stockroom A-248	\N	\N	2025-03-31 17:33:13.570386	\N	\N
319	200129A	AM ST Handle-078524-0020A -M962160	\N	8	1	18.30	\N	Stockroom A-331	\N	\N	2025-03-31 17:33:20.64511	\N	\N
285	200053D	Sink Pop-Up Plug	\N	1	1	13.90	\N	Stockroom A-296	\N	\N	2025-03-31 17:33:17.706835	\N	\N
273	200018	P-Trap-PVC 1 1/2x1 1/4	\N	14	1	3.02	\N	Stockroom A-284	\N	\N	2025-03-31 17:33:16.680426	\N	\N
284	200049C	3 in 1 Caulk tool	\N	1	1	4.99	\N	Stockroom A-295	\N	\N	2025-03-31 17:33:17.621879	\N	\N
281	200045	All Faucet Stems & Aquaseal	\N	14	1	14.79	\N	Stockroom A-292	\N	\N	2025-03-31 17:33:17.363927	\N	\N
241	167057	All PVC Plugs	\N	17	1	1.77	\N	Stockroom A-252	\N	\N	2025-03-31 17:33:13.916658	\N	\N
248	167337	All Brass Caps	\N	22	1	2.88	\N	Stockroom A-259	\N	\N	2025-03-31 17:33:14.519065	\N	\N
252	167738	All PVC Couplings and Tees	\N	0	1	0.92	\N	Stockroom A-263	\N	\N	2025-03-31 17:33:14.865578	\N	\N
221	159667	3/4 BI nipples	\N	112	1	1.11	\N	Stockroom A-232	\N	\N	2025-03-31 17:33:12.178656	\N	\N
295	200075	1 1/4'' Spud Escutcheon & Coupling	\N	19	1	15.76	\N	Stockroom A-306	\N	\N	2025-03-31 17:33:18.565176	\N	\N
274	DR5-150	Bathtub Toe Tap Replacement/Foot Stop Cartridge - 479330		5	10	9.24				\N	2025-03-31 17:33:16.765276	1	181
236	163542	3/8 Brass Nipples	\N	25	1	2.69	\N	Stockroom A-247	\N	\N	2025-03-31 17:33:13.483943	\N	\N
283	200049A	AM ST Shower Kit - Valve & Trim Kit	\N	2	1	112.28	\N	Stockroom A-294	\N	\N	2025-03-31 17:33:17.537093	\N	\N
217	159605	1/8'' BI nipples	\N	27	1	0.37	\N	Stockroom A-228	\N	\N	2025-03-31 17:33:11.837039	\N	\N
247	167327	All Brass Tee	\N	27	1	3.71	\N	Stockroom A-258	\N	\N	2025-03-31 17:33:14.432927	\N	\N
251	167736	All PVC 45 and ST	\N	28	1	1.05	\N	Stockroom A-262	\N	\N	2025-03-31 17:33:14.777988	\N	\N
318	200128	AM ST Chrome Buttons-12189-0020A	\N	18	1	3.50	\N	Stockroom A-330	\N	\N	2025-03-31 17:33:20.554265	\N	\N
216	159591	All BI Unions	\N	30	1	5.36	\N	Stockroom A-227	\N	\N	2025-03-31 17:33:11.750161	\N	\N
244	167084	Brass Barbed Couplings and Adapters	\N	34	1	6.02	\N	Stockroom A-255	\N	\N	2025-03-31 17:33:14.17279	\N	\N
255	167763	All PVC Bushings and Unions	\N	35	1	0.98	\N	Stockroom A-266	\N	\N	2025-03-31 17:33:15.124064	\N	\N
270	200018F	P-Trap-Chrome 1 1/4''	\N	4	1	15.59	\N	Stockroom A-281	\N	\N	2025-03-31 17:33:16.424729	\N	\N
225	159732	2'' BI nipples	\N	39	1	2.99	\N	Stockroom A-236	\N	\N	2025-03-31 17:33:12.521205	\N	\N
253	167744	All PVC Female Adapters	\N	43	1	0.98	\N	Stockroom A-264	\N	\N	2025-03-31 17:33:14.950697	\N	\N
309	200111A	1/2" Pipe Insulation Non Slit	\N	20	1	11.00	\N	Stockroom A-320	\N	\N	2025-03-31 17:33:19.780284	\N	\N
228	10039800019216	C Battery	Energizer Industrial Alkaline C Batteries	228	10	0.97	\N	Stockroom	\N	\N	2025-03-31 17:33:12.780413	1	\N
227	10039800019223	D Battery	Energizer Industrial Alkaline D Batteries	38	10	1.40	\N	Stockroom	\N	\N	2025-03-31 17:33:12.695094	1	\N
222	159684	1'' BI nipples	\N	57	1	1.38	\N	Stockroom A-233	\N	\N	2025-03-31 17:33:12.264141	\N	\N
234	163508	1/8'' Brass Nipples	\N	59	1	1.10	\N	Stockroom A-245	\N	\N	2025-03-31 17:33:13.30787	\N	\N
282	200046	Black Iron Flange	\N	62	1	4.57	\N	Stockroom A-293	\N	\N	2025-03-31 17:33:17.450355	\N	\N
220	159663	3/8 BI nipple	\N	72	1	1.15	\N	Stockroom A-231	\N	\N	2025-03-31 17:33:12.093806	\N	\N
235	163525	1/4'' Brass Nipples	\N	102	1	2.25	\N	Stockroom A-246	\N	\N	2025-03-31 17:33:13.398215	\N	\N
240	167014	All PVC Caps	\N	4	1	1.66	\N	Stockroom A-251	\N	\N	2025-03-31 17:33:13.830411	\N	\N
238	163567	3/4 Brass nipples	\N	191	1	4.28	\N	Stockroom A-249	\N	\N	2025-03-31 17:33:13.656044	\N	\N
219	159650	1/2 BI Nipples	\N	330	1	0.65	\N	Stockroom A-230	\N	\N	2025-03-31 17:33:12.008807	\N	\N
260	180026	Cotter Pins	\N	636	1	0.10	\N	Stockroom A-271	\N	\N	2025-03-31 17:33:15.569695	\N	\N
288	034449669351	Shower Head	52102-mb	11	4	11.13	\N		\N	\N	2025-03-31 17:33:17.962274	\N	\N
304	200099A	Bath Faucet with Pop-Up	\N	3	1	81.58	\N	Stockroom A-315	\N	\N	2025-03-31 17:33:19.346802	\N	\N
290	034449685306	AM ST/ Delta Kitchen Sink Faucet with or without spray	\N	2	1	88.36	\N	Stockroom - Shelf I4	\N	\N	2025-03-31 17:33:18.132766	\N	\N
305	200099B	All Bath Faucets -AM ST/ Delta		6	1	119.95	\N		\N	\N	2025-03-31 17:33:19.432877	\N	\N
327	200141	Wall Hung Wax Ring	\N	9	1	3.86	\N	Stockroom A-339	\N	\N	2025-03-31 17:33:21.342032	\N	\N
347	200183	Spray Aerator-Delta	\N	39	1	15.07	\N	Stockroom A-359	\N	\N	2025-03-31 17:33:23.067085	\N	\N
326	200140	Urinal Wax Ring	\N	3	1	4.02	\N	Stockroom A-338	\N	\N	2025-03-31 17:33:21.255693	\N	\N
316	200128A	RK7300 Pressure Cartridge	\N	6	1	35.14	\N	Stockroom A-328	\N	\N	2025-03-31 17:33:20.38414	\N	\N
334	200160A	Lock-Spin Basket Strainer -#17	\N	19	1	12.88	\N	Stockroom A-346	\N	\N	2025-03-31 17:33:21.946974	\N	\N
343	200164	Toilet Tank Lever	\N	27	1	14.08	\N	Stockroom A-355	\N	\N	2025-03-31 17:33:22.724191	\N	\N
328	039961061058	Tank to Bowl Bolts-per pack	\N	18	4	6.20	\N	Stockroom - Shelf J1	\N	\N	2025-03-31 17:33:21.431988	\N	\N
387	210015A	1'' Threaded or Sharkbite Ball Valve	\N	9	1	26.87	\N	Stockroom A-399	\N	\N	2025-03-31 17:33:26.507817	\N	\N
408	230172	1'' Copper pipe - per foot	\N	12	1	7.45	\N	Stockroom A-420	\N	\N	2025-03-31 17:33:28.341172	\N	\N
345	200165	Flapper Assembly-AMST 7381129-Fluidmaster 5403	\N	58	1	17.23	\N	Stockroom A-357	\N	\N	2025-03-31 17:33:22.896218	\N	\N
407	230171	3/4 Copper Pipe-per foot	\N	0	1	14.25	\N	Stockroom A-419	\N	\N	2025-03-31 17:33:28.255294	\N	\N
333	200149	Wax Ring-Toilet	\N	4	1	2.94	\N	Stockroom A-345	\N	\N	2025-03-31 17:33:21.860086	\N	\N
409	230173	1 1/4'' Copper Pipe-per foot	\N	15	1	8.10	\N	Stockroom A-421	\N	\N	2025-03-31 17:33:28.42887	\N	\N
348	200184	Faucet Aerator-each	\N	90	6	1.83	\N	\N	\N	\N	2025-03-31 17:33:23.152457	\N	\N
308	200111	Sure Vent-Air Valve	\N	20	1	16.10	\N	Stockroom - Shelf J1	\N	\N	2025-03-31 17:33:19.693678	\N	\N
311	200117B	Condensate Pump-Little Giant 115V	\N	1	1	45.29	\N	Stockroom	\N	\N	2025-03-31 17:33:19.954218	\N	\N
340	200162H	Replacement Clamp - 3/4''	\N	4	1	9.06	\N	Stockroom A-352	\N	\N	2025-03-31 17:33:22.462305	\N	\N
315	200127	AM ST Replacement Cartridge - 066269-0070A	\N	2	1	35.89	\N	Stockroom A-327	\N	\N	2025-03-31 17:33:20.298274	\N	\N
423	250010	1BL004LF-1BL002-PL45B booster pumps	\N	1	1	579.85	\N	Stockroom A-435	\N	\N	2025-03-31 17:33:29.626144	\N	\N
352	200220B	Sloan Outer Cap-Brass	\N	8	1	21.17	\N	Stockroom A-364	\N	\N	2025-03-31 17:33:23.494112	\N	\N
341	200162I	Replacement Clamp-1/2''	\N	3	1	8.06	\N	Stockroom A-353	\N	\N	2025-03-31 17:33:22.549246	\N	\N
335	200160	Sink Strainer	\N	2	1	8.99	\N	Stockroom A-347	\N	\N	2025-03-31 17:33:22.031911	\N	\N
306	200099C	Zurn Z6913-XL Faucet	\N	2	1	274.00	\N	Stockroom A-317	\N	\N	2025-03-31 17:33:19.52012	\N	\N
375	210002	1/8'' Automatic Air Vent\r\n\r\n\r\nB&G or Watts	\N	3	1	6.44	\N	Stockroom A-387	\N	\N	2025-03-31 17:33:25.473971	\N	\N
294	200075K	Spud-1 1/4	\N	5	1	7.38	\N	Stockroom A-305	\N	\N	2025-03-31 17:33:18.478093	\N	\N
330	200143A	Single Flush Battery Flush Valve Kit	\N	3	1	158.99	\N	Stockroom A-342	\N	\N	2025-03-31 17:33:21.602938	\N	\N
383	210011B	1/2'' Threaded Ball Valve-Gas	\N	4	1	3.64	\N	Stockroom	\N	\N	2025-03-31 17:33:26.167209	\N	\N
292	200075C	Spud Gasket	\N	36	1	0.73	\N	Stockroom A-303	\N	\N	2025-03-31 17:33:18.302558	\N	\N
406	230170	1/2'' Copper Pipe	\N	35	1	9.10	\N	Stockroom A-418	\N	\N	2025-03-31 17:33:28.170597	\N	\N
297	200076B	Solenoid Assembly	\N	4	1	58.69	\N	Stockroom A-308	\N	\N	2025-03-31 17:33:18.741907	\N	\N
287	200054	Outdoor Faucet	\N	4	1	29.72	\N	Stockroom A-298	\N	\N	2025-03-31 17:33:17.877091	\N	\N
322	200129D	AM ST Spout Seal-91209	\N	12	1	3.71	\N	Stockroom A-334	\N	\N	2025-03-31 17:33:20.903373	\N	\N
332	200146	Zurn Bath sink drain	\N	1	1	16.49	\N	Stockroom A-344	\N	\N	2025-03-31 17:33:21.774316	\N	\N
392	210066	3/4 Male Boiler Drain	\N	6	1	7.18	\N	Stockroom A-404	\N	\N	2025-03-31 17:33:26.943769	\N	\N
344	049057101797	AM ST Snap Flapper -1109F	Korky 2004	8	4	1.51	\N	Stockroom - Shelf J3	\N	\N	2025-03-31 17:33:22.810439	\N	\N
401	210118	1 1/2'' Threaded Ball Valve	\N	5	1	51.28	\N	Stockroom A-413	\N	\N	2025-03-31 17:33:27.745241	\N	\N
349	200192	Faucet Locknut	\N	7	1	0.78	\N	Stockroom A-361	\N	\N	2025-03-31 17:33:23.237406	\N	\N
382	210011A	1/4'' Threaded Ball Valve	\N	6	1	12.32	\N	Stockroom A-394	\N	\N	2025-03-31 17:33:26.082188	\N	\N
337	200162B	Replacement Clamp-1 1/4''	\N	7	1	8.03	\N	Stockroom A-349	\N	\N	2025-03-31 17:33:22.205358	\N	\N
379	210006	1/2 Male Boiler Drain	\N	7	1	6.03	\N	Stockroom A-391	\N	\N	2025-03-31 17:33:25.823229	\N	\N
353	200226	RP-70 Delta Ball Assembly	\N	7	1	12.01	\N	Stockroom A-365	\N	\N	2025-03-31 17:33:23.581641	\N	\N
293	200075J	Spud-1 1/2	\N	9	1	7.47	\N	Stockroom A-304	\N	\N	2025-03-31 17:33:18.391873	\N	\N
320	200129B	AM ST Stop Cartridge - 051122-0070A - 023529-0070A	\N	8	1	12.65	\N	Stockroom A-332	\N	\N	2025-03-31 17:33:20.732317	\N	\N
336	200162A	Replacement Clamp -1''	\N	8	1	11.50	\N	Stockroom A-348	\N	\N	2025-03-31 17:33:22.11959	\N	\N
354	200227A	Aqua Flush Diaphragm Kit -toilet or urinal	\N	9	1	12.24	\N	Stockroom - Shelf I3	\N	\N	2025-03-31 17:33:23.667115	\N	\N
411	230175	2'' Copper pipe-per foot	\N	10	1	6.52	\N	Stockroom A-423	\N	\N	2025-03-31 17:33:28.602172	\N	\N
389	210019	2'' Threaded Ball Valve	\N	11	1	68.70	\N	Stockroom A-401	\N	\N	2025-03-31 17:33:26.683502	\N	\N
390	210029	1/2-3/4 Female Boiler Drain	\N	12	1	4.79	\N	Stockroom A-402	\N	\N	2025-03-31 17:33:26.769403	\N	\N
342	200163	Nylon Pipe Fittings	\N	13	1	0.52	\N	Stockroom A-354	\N	\N	2025-03-31 17:33:22.637412	\N	\N
300	200079A	Zurn/Sloan Repair kit urinal 3/4''-1''	\N	13	1	9.44	\N	Stockroom A-311	\N	\N	2025-03-31 17:33:19.006193	\N	\N
388	210017	1 1/4'' Threaded Ball Valve	\N	1	1	40.51	\N	Stockroom A-400	\N	\N	2025-03-31 17:33:26.595029	\N	\N
310	200113	All Dielectric Pipe Fittings	\N	32	1	5.01	\N	Stockroom A-321	\N	\N	2025-03-31 17:33:19.868285	\N	\N
298	200077A	Vacuum Breaker Repair Kit	\N	34	1	2.58	\N	Stockroom A-309	\N	\N	2025-03-31 17:33:18.830085	\N	\N
307	200100	Wall Hung Toilet	\N	1	1	70.00	\N	Stockroom A-318	\N	\N	2025-03-31 17:33:19.607798	\N	\N
289	200062D	Shower Drain	\N	20	1	24.39	\N	Stockroom A-300	\N	\N	2025-03-31 17:33:18.047585	\N	\N
363	200291	All Toilet Seats	\N	18	1	17.87	\N	Stockroom A-375	\N	\N	2025-03-31 17:33:24.440716	\N	\N
364	200300	Shower Arm	\N	5	1	5.19	\N	Stockroom A-376	\N	\N	2025-03-31 17:33:24.528891	\N	\N
402	210122A	Zurn EZ Flush-Zerk-C-CPM	\N	0	1	160.08	\N	Stockroom A-414	\N	\N	2025-03-31 17:33:27.830048	\N	\N
357	200232A	RP50 Delta Cap with Ring	\N	4	1	20.80	\N	Stockroom A-369	\N	\N	2025-03-31 17:33:23.923752	\N	\N
358	200232B	RP61-Delta Cam/Packing	\N	2	1	5.96	\N	Stockroom A-370	\N	\N	2025-03-31 17:33:24.012077	\N	\N
399	210114B	Mansfield Flush Valve-210	\N	8	1	5.44	\N	Stockroom A-411	\N	\N	2025-03-31 17:33:27.572685	\N	\N
400	210114	Fill Valve-Ballcock 400A	\N	41	1	8.86	\N	Stockroom A-412	\N	\N	2025-03-31 17:33:27.659497	\N	\N
475	250074	B&G 110196 Reducing Valve	\N	3	1	79.95	\N	Stockroom A-487	\N	\N	2025-03-31 17:33:34.164083	\N	\N
385	210013A	3/4 Threaded Ball Valve - GAS	\N	4	1	10.40	\N	Stockroom A-397	\N	\N	2025-03-31 17:33:26.336923	\N	\N
488	290006	2'' Black Pipe-per foot	\N	0	1	3.14	\N	Stockroom A-500	\N	\N	2025-03-31 17:33:35.282471	\N	\N
377	210005B	Woods Coupler-5J	\N	1	1	15.54	\N	Stockroom A-389	\N	\N	2025-03-31 17:33:25.65203	\N	\N
369	209994	Bleeder vent	\N	15	1	7.00	\N	Stockroom A-381	\N	\N	2025-03-31 17:33:24.961622	\N	\N
413	240040B	Fernco Rubber Coupling-1 1/2'' & 1 1/2''-1 1/4''	\N	12	1	3.76	\N	Stockroom A-425	\N	\N	2025-03-31 17:33:28.773338	\N	\N
414	240040C	Fernco Rubber Coupling 2''	\N	3	1	4.06	\N	Stockroom A-426	\N	\N	2025-03-31 17:33:28.858469	\N	\N
485	290002	3/4 BI Pipe	\N	0	1	1.30	\N	Stockroom A-497	\N	\N	2025-03-31 17:33:35.024282	\N	\N
397	210113	Zurn Flush Valve	\N	1	1	82.23	\N	Stockroom A-409	\N	\N	2025-03-31 17:33:27.399849	\N	\N
419	250004B	B&G 185332 Bearing Assembly	\N	1	1	310.00	\N	Stockroom A-431	\N	\N	2025-03-31 17:33:29.285429	\N	\N
418	250004A	B&G 189162 Bearing Assembly	\N	1	1	110.70	\N	Stockroom A-430	\N	\N	2025-03-31 17:33:29.200372	\N	\N
464	250057	B&G 111040 Power Pack	\N	1	1	430.50	\N	Stockroom A-476	\N	\N	2025-03-31 17:33:33.168542	\N	\N
359	200232C	RP 19804 -Delta Cartridge	\N	1	1	55.36	\N	Stockroom A-371	\N	\N	2025-03-31 17:33:24.100255	\N	\N
422	250008	B&G 111061 Power Pack	\N	1	1	435.14	\N	Stockroom A-434	\N	\N	2025-03-31 17:33:29.540449	\N	\N
456	250049	B&G 111046 Power Pack	\N	1	1	616.00	\N	Stockroom A-468	\N	\N	2025-03-31 17:33:32.479279	\N	\N
393	210101D	Oasis Fountain Cap	\N	2	1	3.85	\N	Stockroom A-405	\N	\N	2025-03-31 17:33:27.031489	\N	\N
417	250002	B&G 185260 Bearing Assembly	\N	1	1	656.10	\N	Stockroom A-429	\N	\N	2025-03-31 17:33:29.114143	\N	\N
455	250048	B&G 111042 Power Pack	\N	1	1	483.30	\N	Stockroom A-467	\N	\N	2025-03-31 17:33:32.390666	\N	\N
459	250052	B&G 111044 Power Pack	\N	1	1	726.30	\N	Stockroom A-471	\N	\N	2025-03-31 17:33:32.737919	\N	\N
421	250005	B&G 111031 Power Pack	\N	1	1	312.34	\N	Stockroom A-433	\N	\N	2025-03-31 17:33:29.455626	\N	\N
465	250058	B&G 111034 Power Pack	\N	1	1	126.42	\N	Stockroom A-477	\N	\N	2025-03-31 17:33:33.253631	\N	\N
461	250054A	B&G 103251 NRF-22 Booster Pump	\N	1	1	78.20	\N	Stockroom A-473	\N	\N	2025-03-31 17:33:32.912728	\N	\N
473	250072	B&G 110127 Relief Valve	\N	1	1	87.60	\N	Stockroom A-485	\N	\N	2025-03-31 17:33:33.993302	\N	\N
415	240040D	Fernco Rubber Coupling 3''	\N	1	1	5.46	\N	Stockroom A-427	\N	\N	2025-03-31 17:33:28.94339	\N	\N
374	210002A	Spirovent -1/2 Spirotop	\N	1	1	86.65	\N	Stockroom A-386	\N	\N	2025-03-31 17:33:25.388229	\N	\N
446	250035	B&G 118223 Motor Mount	\N	2	1	11.00	\N	Stockroom A-458	\N	\N	2025-03-31 17:33:31.605971	\N	\N
451	250041	B&G 118227 Motor Mounts	\N	2	1	17.20	\N	Stockroom A-463	\N	\N	2025-03-31 17:33:32.036027	\N	\N
444	250032	B&G 118431 Impeller	\N	2	1	29.66	\N	Stockroom A-456	\N	\N	2025-03-31 17:33:31.432634	\N	\N
470	250063	B&G 118129 Gasket	\N	2	1	8.15	\N	Stockroom A-482	\N	\N	2025-03-31 17:33:33.711883	\N	\N
368	200334	Pre-Rinse Spray Valve-SS Flex Hose	\N	2	1	63.50	\N	Stockroom A-380	\N	\N	2025-03-31 17:33:24.87651	\N	\N
437	250030A	B&G 111047 Power Pack	\N	2	1	799.20	\N	Stockroom A-449	\N	\N	2025-03-31 17:33:30.832784	\N	\N
424	250011	B&G 118378 Gasket Kit	\N	2	1	4.32	\N	Stockroom A-436	\N	\N	2025-03-31 17:33:29.71214	\N	\N
439	250031	B&G 118436 Impeller	\N	2	1	66.50	\N	Stockroom A-451	\N	\N	2025-03-31 17:33:31.005074	\N	\N
360	200232D	RP 31033 or RP 46-0079 Delta Single Lever kit	\N	3	1	24.13	\N	Stockroom A-372	\N	\N	2025-03-31 17:33:24.185714	\N	\N
380	210007B	Urinal Gasket	\N	7	1	18.27	\N	Stockroom A-392	\N	\N	2025-03-31 17:33:25.90871	\N	\N
376	210005A	Spiralink-1/2-3/4 HP	\N	3	1	39.07	\N	Stockroom A-388	\N	\N	2025-03-31 17:33:25.565178	\N	\N
412	240040A	Fernco Rubber Coupling 4''	\N	4	1	7.30	\N	Stockroom A-424	\N	\N	2025-03-31 17:33:28.688616	\N	\N
371	209996B	Honeywell Transformer with breaker-AT175F-1023-1031	\N	4	1	41.98	\N	Stockroom A-383	\N	\N	2025-03-31 17:33:25.132912	\N	\N
378	210005	Spiralink-1/3 HP	\N	4	1	15.50	\N	Stockroom A-390	\N	\N	2025-03-31 17:33:25.737346	\N	\N
466	250059A	B&G 118368 Gasket	\N	5	1	3.48	\N	Stockroom A-478	\N	\N	2025-03-31 17:33:33.340048	\N	\N
395	210101	Bubbler Valve - Drinking Fountain	\N	4	1	32.97	\N	Stockroom A-407	\N	\N	2025-03-31 17:33:27.216587	\N	\N
462	250054B	B&G 103357 SSF-22 Pump	\N	0	1	298.41	\N	Stockroom A-474	\N	\N	2025-03-31 17:33:32.997537	\N	\N
365	200304A	Chrome Fittings	\N	5	1	6.57	\N	Stockroom A-377	\N	\N	2025-03-31 17:33:24.616965	\N	\N
367	012611408052	Sink Sprayer Assembly	Handspray & Hose, M953670-0170A	15	1	8.73	\N	Stockroom - Shelf J4	\N	\N	2025-03-31 17:33:24.791691	1	179
467	250059	B&G 118373 Gasket	\N	5	1	7.29	\N	Stockroom A-479	\N	\N	2025-03-31 17:33:33.429776	\N	\N
386	210013	3/4 Threaded Ball or Sharkbite Valve	\N	5	1	25.48	\N	Stockroom A-398	\N	\N	2025-03-31 17:33:26.422865	\N	\N
361	200232F	RP-19039 RP-17449- RP-17443 Delta Single Handle kits	\N	0	1	19.95	\N	Stockroom A-373	\N	\N	2025-03-31 17:33:24.270678	\N	\N
398	210114A	Replacement Seal-Fill Valve	\N	9	1	1.58	\N	Stockroom A-410	\N	\N	2025-03-31 17:33:27.487546	\N	\N
457	250050A	B&G 111035 Power Pack	\N	1	1	268.00	\N	Stockroom A-469	\N	\N	2025-03-31 17:33:32.565866	\N	\N
362	034449119375	RP 6463 Delta Pop-Up Assembly	\N	5	1	46.18	\N	\N	\N	\N	2025-03-31 17:33:24.355705	\N	\N
405	230169	3/8 Copper Pipe-per foot	\N	30	1	7.50	\N	Stockroom A-417	\N	\N	2025-03-31 17:33:28.085211	\N	\N
447	250036	B&G 118228 Motor Mounts	\N	4	1	20.00	\N	Stockroom A-459	\N	\N	2025-03-31 17:33:31.692663	\N	\N
366	200305A	Elkay Stems	\N	19	1	19.75	\N	Stockroom A-378	\N	\N	2025-03-31 17:33:24.705288	\N	\N
403	220002	Faucet O Rings and AMST Spout seals-M960994	\N	56	1	0.33	\N	Stockroom A-415	\N	\N	2025-03-31 17:33:27.915009	\N	\N
481	280002	All Slip Nut Washers	\N	180	1	0.64	\N	Stockroom A-493	\N	\N	2025-03-31 17:33:34.678272	\N	\N
921	711029	Caution Tape	\N	8	1	7.05	\N	Stockroom	\N	\N	2025-03-31 17:34:12.967161	\N	\N
505	300058B	5362I Ivory or White Receptacle	\N	11	1	3.15	\N	Stockroom A-517	\N	\N	2025-03-31 17:33:36.742277	\N	\N
540	300208	ATMR5 Amp Trap fuse	\N	4	1	9.15	\N	Stockroom A-552	\N	\N	2025-03-31 17:33:39.794639	\N	\N
525	300135	1/2''-3/8'' x 90 MC Tite Bite Connectors	\N	136	1	0.46	\N	Stockroom A-537	\N	\N	2025-03-31 17:33:38.508848	\N	\N
511	300080B	3/8-1/2 EMT Clamp/Straps	\N	352	1	0.22	\N	Stockroom A-523	\N	\N	2025-03-31 17:33:37.275233	\N	\N
520	300088	All Reducing/Insulated Washers/Bushings	\N	143	1	0.25	\N	Stockroom A-532	\N	\N	2025-03-31 17:33:38.050371	\N	\N
469	250061	B&G 185024 Brass Sleeve	\N	3	1	64.80	\N	Stockroom A-481	\N	\N	2025-03-31 17:33:33.617791	\N	\N
463	250055	B&G Coupler 186004 (P77271) Woods	\N	1	1	66.78	\N	Stockroom A-475	\N	\N	2025-03-31 17:33:33.082302	\N	\N
431	250020	B&G 186863 Bearing Assembly	\N	1	1	470.94	\N	Stockroom A-443	\N	\N	2025-03-31 17:33:30.31926	\N	\N
454	250047	B&G 185014 Bearing Assembly	\N	1	1	1148.00	\N	Stockroom A-466	\N	\N	2025-03-31 17:33:32.303457	\N	\N
445	250033	B&G 189132 Impeller	\N	2	1	11.61	\N	Stockroom A-457	\N	\N	2025-03-31 17:33:31.518499	\N	\N
472	250068	B&G 185011 Bearing Assembly	\N	1	1	1033.05	\N	Stockroom A-484	\N	\N	2025-03-31 17:33:33.899562	\N	\N
453	250046	B&G 186660 Bearing Assembly	\N	1	1	556.20	\N	Stockroom A-465	\N	\N	2025-03-31 17:33:32.205988	\N	\N
478	250077	Elkay 98531C Regulator Valve Kit	\N	1	1	80.50	\N	Stockroom A-490	\N	\N	2025-03-31 17:33:34.419823	\N	\N
471	250067	B&G 118844 Bearing Assembly	\N	1	1	62.10	\N	Stockroom A-483	\N	\N	2025-03-31 17:33:33.803746	\N	\N
428	250016	B&G 189034 Bearing Assembly	\N	1	1	71.69	\N	Stockroom A-440	\N	\N	2025-03-31 17:33:30.060912	\N	\N
458	250050	B&G 169035 Power Pack	\N	1	1	361.80	\N	Stockroom A-470	\N	\N	2025-03-31 17:33:32.651197	\N	\N
440	250032A	B&G 189128 Impeller	\N	1	1	55.62	\N	Stockroom A-452	\N	\N	2025-03-31 17:33:31.08965	\N	\N
435	250029A	B&G Impeller 118440	\N	1	1	137.70	\N	Stockroom A-447	\N	\N	2025-03-31 17:33:30.661725	\N	\N
433	250027	B&G 186410 Coupler	\N	3	1	37.50	\N	Stockroom A-445	\N	\N	2025-03-31 17:33:30.49146	\N	\N
442	250032C	B&G Impeller 118435	\N	2	1	89.10	\N	Stockroom A-454	\N	\N	2025-03-31 17:33:31.260266	\N	\N
429	250017	B&G 189163 Bearing Assembly	\N	2	1	147.30	\N	Stockroom A-441	\N	\N	2025-03-31 17:33:30.145636	\N	\N
490	300008A	Manual Controller 1250	\N	2	1	22.00	\N	Stockroom A-502	\N	\N	2025-03-31 17:33:35.453779	\N	\N
448	250037	B&G 118626 Impeller	\N	2	1	151.25	\N	Stockroom A-460	\N	\N	2025-03-31 17:33:31.777573	\N	\N
434	250028	B&G 186543 Seal Kit	\N	2	1	144.00	\N	Stockroom A-446	\N	\N	2025-03-31 17:33:30.576037	\N	\N
441	250032B	B&G 118630 Impeller	\N	2	1	29.66	\N	Stockroom A-453	\N	\N	2025-03-31 17:33:31.174913	\N	\N
512	300080	3/4 EMT Clamps/Straps	\N	120	1	0.10	\N	Stockroom A-524	\N	\N	2025-03-31 17:33:37.36025	\N	\N
427	250015	B&G 189165 Bearing Assembly	\N	3	1	159.30	\N	Stockroom A-439	\N	\N	2025-03-31 17:33:29.971753	\N	\N
537	300197	AJT 150 Fuse	\N	3	1	90.00	\N	Stockroom A-549	\N	\N	2025-03-31 17:33:39.534618	\N	\N
494	300030A	Combo Switch and Recept.-5225	\N	4	1	5.94	\N	Stockroom A-506	\N	\N	2025-03-31 17:33:35.798475	\N	\N
460	250053	B&G P77271 ITT 186004	\N	4	1	41.65	\N	Stockroom A-472	\N	\N	2025-03-31 17:33:32.825251	\N	\N
489	290016A	Swivel Connector for Hand Shower	\N	5	1	25.36	\N	Stockroom A-501	\N	\N	2025-03-31 17:33:35.367917	\N	\N
452	250043	B&G 186373 Impeller	\N	4	1	180.00	\N	Stockroom A-464	\N	\N	2025-03-31 17:33:32.120644	\N	\N
563	300287	30-071 Small Grey Wire Nuts -per box	\N	4	1	7.60	\N	Stockroom	\N	\N	2025-03-31 17:33:41.793357	\N	\N
443	250032D	B&G Impeller 118668	\N	1	1	41.80	\N	Stockroom A-455	\N	\N	2025-03-31 17:33:31.346492	\N	\N
436	250029	B&G 118439 Impeller	\N	5	1	118.80	\N	Stockroom A-448	\N	\N	2025-03-31 17:33:30.746487	\N	\N
479	250078	H-1012-A Stop Valve Cap	\N	6	1	15.29	\N	Stockroom A-491	\N	\N	2025-03-31 17:33:34.50668	\N	\N
476	250075	B&G Impeller -P4Z-1235	\N	6	1	109.60	\N	Stockroom A-488	\N	\N	2025-03-31 17:33:34.249326	\N	\N
533	300171C	5748-2 Wiremold Box	\N	7	1	10.44	\N	Stockroom A-545	\N	\N	2025-03-31 17:33:39.191197	\N	\N
426	250013	B&G 186862 Seal Kit	\N	6	1	81.00	\N	Stockroom A-438	\N	\N	2025-03-31 17:33:29.883701	\N	\N
450	250040	B&G 189110 Coupler-insert 3JE	\N	9	1	4.78	\N	Stockroom A-462	\N	\N	2025-03-31 17:33:31.950904	\N	\N
474	250073	B&G 118705 Coupler -PZ4291	\N	3	1	13.75	\N	Stockroom A-486	\N	\N	2025-03-31 17:33:34.078461	\N	\N
449	250039	B&G 118681 Seal Kit	\N	11	1	13.66	\N	Stockroom A-461	\N	\N	2025-03-31 17:33:31.862732	\N	\N
531	300169	518 Wiremold - External Elbow	\N	13	1	1.52	\N	Stockroom A-543	\N	\N	2025-03-31 17:33:39.019857	\N	\N
493	300028	Toggle Switch SP - rotary-canopy	\N	14	1	4.68	\N	Stockroom A-505	\N	\N	2025-03-31 17:33:35.712876	\N	\N
546	300220	5603I 3 way ivory switch -rocker	\N	15	1	2.20	\N	Stockroom A-558	\N	\N	2025-03-31 17:33:40.306443	\N	\N
516	300084B	1/2'' EMT Coupling	\N	19	1	0.32	\N	Stockroom A-528	\N	\N	2025-03-31 17:33:37.709033	\N	\N
527	300158	511 Wiremold - 90 flat elbow	\N	19	1	1.29	\N	Stockroom A-539	\N	\N	2025-03-31 17:33:38.679386	\N	\N
547	300226	All Brass Covers	\N	20	1	4.59	\N	Stockroom A-559	\N	\N	2025-03-31 17:33:40.392457	\N	\N
530	300169A	517 Wiremold - Internal Elbow	\N	25	1	1.75	\N	Stockroom A-542	\N	\N	2025-03-31 17:33:38.934515	\N	\N
492	300025	Photo Control Eye-INT 4536-4521C	\N	9	1	13.96	\N	Stockroom A-504	\N	\N	2025-03-31 17:33:35.627054	\N	\N
517	300084G	3/4 EMT Coupling	\N	26	1	0.41	\N	Stockroom A-529	\N	\N	2025-03-31 17:33:37.795241	\N	\N
529	300162	5703 Clip Wiremold -each	\N	26	1	0.45	\N	Stockroom A-541	\N	\N	2025-03-31 17:33:38.848939	\N	\N
513	300081	3/4- 1- 1 1/4 Romex Connectors	\N	28	1	0.79	\N	Stockroom A-525	\N	\N	2025-03-31 17:33:37.447032	\N	\N
539	300208C	ATMR10-KTKR10-ATDR10 Amp Trap fuses	\N	29	1	12.00	\N	Stockroom A-551	\N	\N	2025-03-31 17:33:39.709418	\N	\N
480	260211	Chrome Nipples	\N	30	1	1.87	\N	Stockroom A-492	\N	\N	2025-03-31 17:33:34.592246	\N	\N
518	300084H	3/4 EMT connectors	\N	48	1	0.35	\N	Stockroom A-530	\N	\N	2025-03-31 17:33:37.880545	\N	\N
542	300209B	3A Christmas Light Fuse	\N	60	1	0.28	\N	Stockroom A-554	\N	\N	2025-03-31 17:33:39.964232	\N	\N
538	300208A	ATM-R-20-ATM-R-15 fuse	\N	61	1	15.77	\N	Stockroom A-550	\N	\N	2025-03-31 17:33:39.622642	\N	\N
515	300084A	1/2 EMT Connector	\N	105	1	0.20	\N	Stockroom A-527	\N	\N	2025-03-31 17:33:37.623674	\N	\N
534	300171	5748 Wiremold Box	\N	1	1	5.88	\N	Stockroom A-546	\N	\N	2025-03-31 17:33:39.278849	\N	\N
552	300261A	All Thermal Units	\N	176	1	1.99	\N	Stockroom A-564	\N	\N	2025-03-31 17:33:40.853482	\N	\N
432	250021	B&G 118473 Coupler	\N	4	1	27.54	\N	Stockroom A-444	\N	\N	2025-03-31 17:33:30.406368	\N	\N
502	300045N	Switch-single pole-ivory, brown or white 1221	\N	0	1	7.00	\N	Stockroom A-514	\N	\N	2025-03-31 17:33:36.483214	\N	\N
606	310035Q	All Ivory Double Gang Covers	\N	21	1	0.95	\N	Stockroom A-618	\N	\N	2025-03-31 17:33:45.561768	\N	\N
500	300045H	HBL 5461	HBL 2620 Twist Lock Receptacle	15	1	25.27	\N	Stockroom - Shelf N2	\N	\N	2025-03-31 17:33:36.31261	1	281
600	310012	All Handy Boxes	\N	7	1	1.70	\N	Stockroom A-612	\N	\N	2025-03-31 17:33:44.995693	\N	\N
584	300365	1221-L Key Switch - single pole	\N	7	1	18.20	\N	Stockroom A-596	\N	\N	2025-03-31 17:33:43.615485	\N	\N
496	300030C	Switch Combo Single Pole and Pilot -HBL1221 PLC	\N	0	1	30.00	\N	Stockroom A-508	\N	\N	2025-03-31 17:33:35.972511	\N	\N
503	300045P	Twist Lock Plug-2711-30 amp 2311-20 amp	\N	6	1	28.60	\N	Stockroom A-515	\N	\N	2025-03-31 17:33:36.569071	\N	\N
565	300289	30-342 Large Grey Wire Nuts-box	\N	1	1	22.00	\N	Stockroom A-577	\N	\N	2025-03-31 17:33:41.963086	\N	\N
510	300080A	Carlon Conduit Clamps -all sizes/per bag	\N	15	1	1.54	\N	Stockroom A-522	\N	\N	2025-03-31 17:33:37.189855	\N	\N
535	300175	V5715 Wiremold Tee	\N	2	1	3.47	\N	Stockroom A-547	\N	\N	2025-03-31 17:33:39.363905	\N	\N
495	300030B	Switch Combo Two Single Pole-5224 ivory and white	\N	46	1	11.78	\N	Stockroom A-507	\N	\N	2025-03-31 17:33:35.886164	\N	\N
608	310035	All Ivory Single Gang Covers	\N	217	1	0.45	\N	Stockroom A-620	\N	\N	2025-03-31 17:33:45.731785	\N	\N
564	300288	30-073 Orange Wire Nuts - per box	\N	2	1	8.00	\N	Stockroom A-576	\N	\N	2025-03-31 17:33:41.878154	\N	\N
613	310055	All White Single/Double Gang Covers	\N	15	1	0.55	\N	Stockroom A-625	\N	\N	2025-03-31 17:33:46.162355	\N	\N
497	078477712771	GFCI Ivory receptacle Leviton 20A smartlockpro	GFR20I	7	2	15.82	\N	Stockroom - Shelf N2	\N	\N	2025-03-31 17:33:36.057727	1	281
567	300291	30-076 Red Wire Nuts -box	\N	3	1	14.00	\N	Stockroom A-579	\N	\N	2025-03-31 17:33:42.133013	\N	\N
548	300246	TRS30R fuse	\N	5	1	12.00	\N	Stockroom A-560	\N	\N	2025-03-31 17:33:40.502724	\N	\N
597	310005	Hold-Its-Box Supports	\N	100	1	0.23	\N	Stockroom A-609	\N	\N	2025-03-31 17:33:44.739402	\N	\N
499	300045A	HBL5266A-HBL4720C Male Plug End	\N	16	1	9.55	\N	Stockroom A-511	\N	\N	2025-03-31 17:33:36.227853	\N	\N
583	300364	1255-L Momentary Ivory Switch	\N	4	1	58.80	\N	Stockroom A-595	\N	\N	2025-03-31 17:33:43.52427	\N	\N
551	300252	TR90R-TR80R	\N	13	1	16.05	\N	Stockroom A-563	\N	\N	2025-03-31 17:33:40.767325	\N	\N
630	311017R	Advance RL-2SP20-TP	\N	5	1	45.00	\N	Stockroom A-642	\N	\N	2025-03-31 17:33:47.617544	\N	\N
611	310046	All Brown Single Gang Covers	\N	99	1	0.22	\N	Stockroom A-623	\N	\N	2025-03-31 17:33:45.986743	\N	\N
506	300058D	Occupancy Sensor Switch-OSSMT-GDG	\N	7	1	71.50	\N	Stockroom A-518	\N	\N	2025-03-31 17:33:36.827116	\N	\N
554	029054018496	Carbon Monoxide Alarm	First Alert carbon monoxide detector	9	1	25.00	\N		\N	\N	2025-03-31 17:33:41.023991	\N	\N
579	300333C	Line Volt Thermostat-T651A3018	\N	7	1	91.88	\N	Stockroom A-591	\N	\N	2025-03-31 17:33:43.161346	\N	\N
577	300332D	Cover Plate for T8775 Stat	\N	2	1	10.93	\N	Stockroom A-589	\N	\N	2025-03-31 17:33:42.989678	\N	\N
603	310025	All 4 Square Handy Boxes	\N	12	1	1.88	\N	Stockroom A-615	\N	\N	2025-03-31 17:33:45.306182	\N	\N
598	310008	All Handy Box Covers	\N	26	1	0.73	\N	Stockroom A-610	\N	\N	2025-03-31 17:33:44.825224	\N	\N
612	310049	Octagon Handy Box Cover	\N	14	1	0.66	\N	Stockroom A-624	\N	\N	2025-03-31 17:33:46.073379	\N	\N
590	300424	All Stainless Covers	\N	15	1	3.08	\N	Stockroom A-602	\N	\N	2025-03-31 17:33:44.136796	\N	\N
498	300044	HBL5269C-HBL4729C Female Plug End	\N	5	1	26.93	\N	Stockroom A-510	\N	\N	2025-03-31 17:33:36.143065	\N	\N
568	300292	30-341 Tan Wire Nuts -box	\N	3	1	11.00	\N	Stockroom A-580	\N	\N	2025-03-31 17:33:42.218291	\N	\N
607	310035S	Coax-Phone Cover Plate	\N	15	1	1.41	\N	Stockroom A-619	\N	\N	2025-03-31 17:33:45.64653	\N	\N
610	310036	Bling SG Bracket-MP1PERICO-each	\N	14	1	1.05	\N	Stockroom A-622	\N	\N	2025-03-31 17:33:45.901233	\N	\N
507	300071A	Offset Connector-nipple	\N	15	1	2.47	\N	Stockroom A-519	\N	\N	2025-03-31 17:33:36.914147	\N	\N
571	300302	5325 Decor Receptacle-ivory-white	\N	15	1	2.15	\N	Stockroom A-583	\N	\N	2025-03-31 17:33:42.475606	\N	\N
566	300290	Large Blue Wire Nuts-per box	\N	2	1	13.25	\N	Stockroom A-578	\N	\N	2025-03-31 17:33:42.047595	\N	\N
599	310011	All Switch Boxes-metal	\N	64	1	1.77	\N	Stockroom A-611	\N	\N	2025-03-31 17:33:44.910634	\N	\N
609	310036A	All Ivory Oversized 2 Gang Covers	\N	17	1	2.00	\N	Stockroom A-621	\N	\N	2025-03-31 17:33:45.816486	\N	\N
543	300210B	GG3 amp fuse	\N	18	1	0.42	\N	Stockroom A-555	\N	\N	2025-03-31 17:33:40.050455	\N	\N
589	300410	KTK-R-30-ATMR30 fuse	\N	19	1	9.76	\N	Stockroom A-601	\N	\N	2025-03-31 17:33:44.049682	\N	\N
509	300079	Ground Rod Clamp	\N	20	1	0.87	\N	Stockroom A-521	\N	\N	2025-03-31 17:33:37.100322	\N	\N
550	300251	KTK 1/2-TRM 1 1/4 fuse	\N	20	1	8.15	\N	Stockroom A-562	\N	\N	2025-03-31 17:33:40.677802	\N	\N
588	300399	Extension Lamp Socket	\N	28	1	6.45	\N	Stockroom A-600	\N	\N	2025-03-31 17:33:43.964649	\N	\N
544	300210C	GGC10 Fuse	\N	30	1	7.00	\N	Stockroom A-556	\N	\N	2025-03-31 17:33:40.136347	\N	\N
541	300209	TRS35R fuse	\N	8	1	5.38	\N	Stockroom A-553	\N	\N	2025-03-31 17:33:39.879409	\N	\N
501	300045L	HBL 5466 Twist Lock plug	\N	1	1	19.20	\N	Stockroom A-513	\N	\N	2025-03-31 17:33:36.39763	\N	\N
555	300282	Waterproof Wire Nuts-each	\N	73	1	0.34	\N	Stockroom A-567	\N	\N	2025-03-31 17:33:41.108861	\N	\N
523	300128	Fluorescent Tombstones-lampholders	\N	156	1	3.16	\N	Stockroom A-535	\N	\N	2025-03-31 17:33:38.338634	\N	\N
596	310001	All 4 square covers -metal	\N	183	1	1.02	\N	Stockroom A-608	\N	\N	2025-03-31 17:33:44.653803	\N	\N
558	300286C	Locking Ties 30''34''36''-each	\N	196	1	0.62	\N	Stockroom A-570	\N	\N	2025-03-31 17:33:41.365945	\N	\N
559	300286D	Locking Ties-24''-each	\N	249	1	0.67	\N	Stockroom A-571	\N	\N	2025-03-31 17:33:41.452713	\N	\N
561	300286G	Locking Ties-3''-4''-each	\N	400	1	0.16	\N	Stockroom A-573	\N	\N	2025-03-31 17:33:41.623949	\N	\N
508	300074	Romex Staples-Insulated	\N	409	1	0.03	\N	Stockroom A-520	\N	\N	2025-03-31 17:33:37.000693	\N	\N
562	300286I	Locking Ties-14''-15'' each	\N	750	1	0.08	\N	Stockroom A-574	\N	\N	2025-03-31 17:33:41.708639	\N	\N
557	300286A	Locking Ties-11''-each	\N	1338	1	0.10	\N	Stockroom A-569	\N	\N	2025-03-31 17:33:41.280431	\N	\N
592	300433	Outside-Recept,Blank or Switch Cover	\N	2	1	3.07	\N	Stockroom A-604	\N	\N	2025-03-31 17:33:44.308093	\N	\N
703	35004B	LS-ES007SR Exit Sign	\N	2	1	54.99	\N	Stockroom	\N	\N	2025-03-31 17:33:54.039604	\N	\N
652	320030A	QO120 Breaker	\N	14	1	10.58	\N	Stockroom A-664	\N	\N	2025-03-31 17:33:49.508359	\N	\N
655	320030D	QO 120 GFI - QO 130 GFI breaker	\N	11	1	62.88	\N	Stockroom A-667	\N	\N	2025-03-31 17:33:49.821346	\N	\N
649	320019A	QO2020 Breaker-Tandem	\N	11	1	46.00	\N	Stockroom A-661	\N	\N	2025-03-31 17:33:49.246083	\N	\N
576	300332C	T8775 Round Stat-C1005	\N	2	1	55.43	\N	Stockroom A-588	\N	\N	2025-03-31 17:33:42.90357	\N	\N
587	300374	Pulling Lube	\N	2	1	7.49	\N	Stockroom A-599	\N	\N	2025-03-31 17:33:43.879327	\N	\N
580	300333D	T6 Stat-Honeywell-TH6210U2001	\N	1	1	63.05	\N	Stockroom A-592	\N	\N	2025-03-31 17:33:43.250749	\N	\N
702	346013	Definite Purpose Contactor	\N	13	1	6.95	\N	Stockroom A-714	\N	\N	2025-03-31 17:33:53.955017	\N	\N
671	320046A	QOB 115 GFI breaker	\N	2	1	180.00	\N	Stockroom A-683	\N	\N	2025-03-31 17:33:51.190002	\N	\N
573	300303	Thermopile Pilot Generator	\N	2	1	36.75	\N	Stockroom A-585	\N	\N	2025-03-31 17:33:42.645455	\N	\N
675	320071	All HOM breakers	\N	22	1	7.88	\N	Stockroom A-687	\N	\N	2025-03-31 17:33:51.529897	\N	\N
677	330003	All Buss Fuses	\N	276	1	1.00	\N	Stockroom A-689	\N	\N	2025-03-31 17:33:51.704265	\N	\N
687	330012J	FRS-R 100 Fuse	\N	2	1	27.50	\N	Stockroom A-699	\N	\N	2025-03-31 17:33:52.658257	\N	\N
686	330012H	FRS-R 200 Fuse	\N	2	1	55.10	\N	Stockroom A-698	\N	\N	2025-03-31 17:33:52.572856	\N	\N
657	320031	QO 125 breaker	\N	3	1	7.99	\N	Stockroom A-669	\N	\N	2025-03-31 17:33:49.993542	\N	\N
674	320057A	QO 360 breaker	\N	2	1	45.00	\N	Stockroom A-686	\N	\N	2025-03-31 17:33:51.44516	\N	\N
663	320036A	QO 220 breaker	\N	3	1	18.00	\N	Stockroom A-675	\N	\N	2025-03-31 17:33:50.507422	\N	\N
688	330012	FRS-R-60 Fuse	\N	3	1	13.55	\N	Stockroom A-700	\N	\N	2025-03-31 17:33:52.743775	\N	\N
667	320039B	QOB 260 - QO 260 breaker	\N	3	1	21.86	\N	Stockroom A-679	\N	\N	2025-03-31 17:33:50.848646	\N	\N
669	320040	QOB 330 breaker	\N	3	1	199.24	\N	Stockroom A-681	\N	\N	2025-03-31 17:33:51.018492	\N	\N
653	320030B	QOB 120 GFI	\N	3	1	71.99	\N	Stockroom A-665	\N	\N	2025-03-31 17:33:49.593398	\N	\N
602	310025B	Octagon Handy Box Extension Ring	\N	4	1	1.14	\N	Stockroom A-614	\N	\N	2025-03-31 17:33:45.22002	\N	\N
662	320035B	QOB 215 breaker	\N	4	1	68.62	\N	Stockroom A-674	\N	\N	2025-03-31 17:33:50.422235	\N	\N
692	330040	KTK-5-ATM-5 fuse	\N	5	1	13.96	\N	Stockroom A-704	\N	\N	2025-03-31 17:33:53.087218	\N	\N
591	300432	Outside Recept. Enclosure	\N	4	1	7.00	\N	Stockroom A-603	\N	\N	2025-03-31 17:33:44.221877	\N	\N
570	300300	Thermostat Covers -Clear	\N	4	1	22.03	\N	Stockroom A-582	\N	\N	2025-03-31 17:33:42.390493	\N	\N
660	320033B	QOB 140 breaker	\N	5	1	18.58	\N	Stockroom A-672	\N	\N	2025-03-31 17:33:50.251943	\N	\N
594	300442B	Photo Control Recept-K122 or Tork 2421	\N	5	1	20.53	\N	Stockroom A-606	\N	\N	2025-03-31 17:33:44.482931	\N	\N
665	320038A	QO 250 breaker	\N	5	1	20.00	\N	Stockroom A-677	\N	\N	2025-03-31 17:33:50.678406	\N	\N
666	320038B	QOB 250 breaker	\N	5	1	60.52	\N	Stockroom A-678	\N	\N	2025-03-31 17:33:50.763261	\N	\N
683	330012D	FRS-R9 Fuse	\N	6	1	10.35	\N	Stockroom A-695	\N	\N	2025-03-31 17:33:52.316766	\N	\N
661	320034	QO140 breaker	\N	6	1	21.86	\N	Stockroom A-673	\N	\N	2025-03-31 17:33:50.337152	\N	\N
585	300366A	Outlet Strip-Surge Protector	\N	7	1	11.28	\N	Stockroom A-597	\N	\N	2025-03-31 17:33:43.705344	\N	\N
684	330012F	FRS-R 3 Fuse	\N	8	1	8.49	\N	Stockroom A-696	\N	\N	2025-03-31 17:33:52.402505	\N	\N
658	320032A	QO 130 breaker	\N	9	1	7.55	\N	Stockroom A-670	\N	\N	2025-03-31 17:33:50.079019	\N	\N
569	300299A	Splice Kit Underground	\N	9	1	17.42	\N	Stockroom A-581	\N	\N	2025-03-31 17:33:42.304013	\N	\N
676	320072	Breaker Lock-Outs-each	\N	12	1	5.58	\N	Stockroom A-688	\N	\N	2025-03-31 17:33:51.618387	\N	\N
689	330030A	QO120 breaker	\N	3	1	10.50	\N	Stockroom A-701	\N	\N	2025-03-31 17:33:52.828406	\N	\N
656	320031B	QOB 125 breaker	\N	4	1	18.58	\N	Stockroom A-668	\N	\N	2025-03-31 17:33:49.907401	\N	\N
581	300333F	Wired Zone Sensor-01449	\N	4	1	46.72	\N	Stockroom A-593	\N	\N	2025-03-31 17:33:43.337569	\N	\N
654	320030C	QOB 120 breaker	\N	6	1	27.06	\N	Stockroom A-666	\N	\N	2025-03-31 17:33:49.679216	\N	\N
601	310022	Octagon Handy Box-1 1/2'' deep	\N	13	1	0.62	\N	Stockroom A-613	\N	\N	2025-03-31 17:33:45.080352	\N	\N
659	320032B	QOB 130 breaker	\N	13	1	21.84	\N	Stockroom A-671	\N	\N	2025-03-31 17:33:50.165965	\N	\N
672	320047	QOB 250 GFI breaker	\N	1	1	51.72	\N	Stockroom A-684	\N	\N	2025-03-31 17:33:51.274909	\N	\N
668	320040A	QO 330-QO320- QO315 breakers	\N	13	1	62.00	\N	Stockroom A-680	\N	\N	2025-03-31 17:33:50.933305	\N	\N
701	330099	FRN-R25 Fuse	\N	16	1	2.45	\N	Stockroom A-713	\N	\N	2025-03-31 17:33:53.869062	\N	\N
572	300303A	Thermocouple - All Sizes	\N	18	1	6.26	\N	Stockroom A-584	\N	\N	2025-03-31 17:33:42.560534	\N	\N
685	330012G	FRS-R6 Fuse	\N	20	1	8.49	\N	Stockroom A-697	\N	\N	2025-03-31 17:33:52.487938	\N	\N
673	320050B	QOB 230 -QO 230 breaker	\N	22	1	15.90	\N	Stockroom A-685	\N	\N	2025-03-31 17:33:51.360187	\N	\N
648	320002	All ITE or Siemans Breakers	\N	27	1	10.46	\N	Stockroom A-660	\N	\N	2025-03-31 17:33:49.160985	\N	\N
664	320036B	QOB 220 breaker	\N	5	1	55.00	\N	Stockroom A-676	\N	\N	2025-03-31 17:33:50.593625	\N	\N
719	350025A	F032/841/ECO - T8	\N	335	1	3.25	\N	Stockroom	\N	\N	2025-03-31 17:33:55.411434	\N	\N
737	3500047C	F8T5/CW	\N	46	1	3.00	\N	Stockroom A-749	\N	\N	2025-03-31 17:33:56.956017	\N	\N
757	350077	F40/CWX-T12	\N	314	1	3.35	\N	Stockroom A-769	\N	\N	2025-03-31 17:33:58.675456	\N	\N
766	350090G	LED-60W equivalent	\N	84	1	1.45	\N	Stockroom A-778	\N	\N	2025-03-31 17:33:59.445227	\N	\N
706	350013	40 watt - replaced by 28 watt halogen	\N	21	1	0.77	\N	Stockroom A-718	\N	\N	2025-03-31 17:33:54.296121	\N	\N
765	X0036NDHJF	40A Appliance Bulbs		56	10	1.10	\N	Stockroom - Shelf A1	\N	\N	2025-03-31 17:33:59.360265	1	161
744	350051	18W SOX - Osram bulb	\N	3	1	77.95	\N	Stockroom A-756	\N	\N	2025-03-31 17:33:57.559702	\N	\N
699	330071	TR50R-TR60R fuse	\N	14	1	12.73	\N	Stockroom A-711	\N	\N	2025-03-31 17:33:53.699289	\N	\N
694	330050	TR40R fuse	\N	11	1	11.39	\N	Stockroom A-706	\N	\N	2025-03-31 17:33:53.263944	\N	\N
708	350014B	50 T4Q/CL Halogen Bipin	\N	9	1	4.54	\N	Stockroom A-720	\N	\N	2025-03-31 17:33:54.466419	\N	\N
711	350014G	DC75W/CL quartz	\N	15	1	11.00	\N	Stockroom A-723	\N	\N	2025-03-31 17:33:54.723575	\N	\N
774	350116	F18T8/CW	\N	23	1	6.13	\N	Stockroom A-786	\N	\N	2025-03-31 17:34:00.135587	\N	\N
715	350019D	75 Watt LED -12A	\N	12	1	5.00	\N	Stockroom A-727	\N	\N	2025-03-31 17:33:55.068924	\N	\N
732	350043	CF57DT/E/IN/ 841	\N	96	1	12.50	\N	Stockroom A-744	\N	\N	2025-03-31 17:33:56.526321	\N	\N
722	350027	300 Watt Frosted -Med or Mogul	\N	4	1	5.00	\N	Stockroom A-734	\N	\N	2025-03-31 17:33:55.666718	\N	\N
741	350050	F30T12-F30T8-F25T12	\N	12	1	3.50	\N	Stockroom A-753	\N	\N	2025-03-31 17:33:57.302352	\N	\N
739	350049	F15T8/CW	\N	10	1	3.25	\N	Stockroom A-751	\N	\N	2025-03-31 17:33:57.129233	\N	\N
738	350049A	F15T12/CW	\N	24	1	5.04	\N	Stockroom A-750	\N	\N	2025-03-31 17:33:57.044015	\N	\N
758	350079B	H39 KC 175DX Mercury Lamp	\N	8	1	11.20	\N	Stockroom A-770	\N	\N	2025-03-31 17:33:58.761503	\N	\N
721	350026	300 Watt Clear - standard	\N	15	1	6.00	\N	Stockroom A-733	\N	\N	2025-03-31 17:33:55.5815	\N	\N
709	350014C	500/T3Q/CL Halogen	\N	18	1	3.32	\N	Stockroom A-721	\N	\N	2025-03-31 17:33:54.552069	\N	\N
728	350042C	FT40DL/835/RS	\N	16	1	6.30	\N	Stockroom A-740	\N	\N	2025-03-31 17:33:56.185372	\N	\N
747	350052	20 T3Q - Halogen-Bipin	\N	8	1	4.38	\N	Stockroom A-759	\N	\N	2025-03-31 17:33:57.818386	\N	\N
710	350014F	250Q/CL Tungston Halogen Lamp	\N	9	1	7.00	\N	Stockroom A-722	\N	\N	2025-03-31 17:33:54.637547	\N	\N
759	350079C	H43 AV 75DX Mercury Lamp	\N	6	1	18.07	\N	Stockroom A-771	\N	\N	2025-03-31 17:33:58.847858	\N	\N
725	350039C	16'' circline bulb	\N	4	1	11.65	\N	Stockroom A-737	\N	\N	2025-03-31 17:33:55.923611	\N	\N
679	330005	TR100R/ TRS90R fuse	\N	23	1	19.43	\N	Stockroom A-691	\N	\N	2025-03-31 17:33:51.907559	\N	\N
761	350079	H33 GL 400DX Mercury Lamp	\N	4	1	25.00	\N	Stockroom A-773	\N	\N	2025-03-31 17:33:59.019232	\N	\N
639	311020C	REZ 3P32SC-REZ1T42 dimming -T8	\N	1	1	70.00	\N	Stockroom A-651	\N	\N	2025-03-31 17:33:48.38918	\N	\N
695	330052	W30 fuse	\N	2	1	27.25	\N	Stockroom A-707	\N	\N	2025-03-31 17:33:53.350488	\N	\N
651	320029D	QOU 115 breaker	\N	1	1	19.07	\N	Stockroom A-663	\N	\N	2025-03-31 17:33:49.423044	\N	\N
698	330056	TR200R fuse	\N	4	1	37.35	\N	Stockroom A-710	\N	\N	2025-03-31 17:33:53.613671	\N	\N
746	350052D	CF18/DT/E/IN/835	\N	40	1	4.00	\N	Stockroom A-758	\N	\N	2025-03-31 17:33:57.733359	\N	\N
753	350060	FB031/835 Slim U Tube	\N	7	1	16.00	\N	Stockroom A-765	\N	\N	2025-03-31 17:33:58.331061	\N	\N
712	350014	300T3Q/CL/U130V lamp	\N	6	1	4.79	\N	Stockroom A-724	\N	\N	2025-03-31 17:33:54.809041	\N	\N
743	350051B	15987 8w 12" T5 Fluorescent Bulb	\N	8	1	8.00	\N	Stockroom A-755	\N	\N	2025-03-31 17:33:57.474867	\N	\N
681	330007	TR45R fuse	\N	1	1	5.46	\N	Stockroom A-693	\N	\N	2025-03-31 17:33:52.081554	\N	\N
700	330096	TR150R-TRS150R fuse	\N	8	1	76.52	\N	Stockroom A-712	\N	\N	2025-03-31 17:33:53.784322	\N	\N
754	350067	LU-150 Medium Base	\N	6	1	24.15	\N	Stockroom A-766	\N	\N	2025-03-31 17:33:58.419211	\N	\N
760	350079D	H37 KC 250DX Mercury Lamp	\N	6	1	15.00	\N	Stockroom A-772	\N	\N	2025-03-31 17:33:58.93419	\N	\N
670	320041B	QOB 360- QOB320-QOB315 breakers	\N	11	1	199.24	\N	Stockroom A-682	\N	\N	2025-03-31 17:33:51.104097	\N	\N
680	330006	TR 1/2R fuse	\N	13	1	5.70	\N	Stockroom A-692	\N	\N	2025-03-31 17:33:51.995095	\N	\N
770	350109A	CF13DS/835	\N	15	1	2.05	\N	Stockroom A-782	\N	\N	2025-03-31 17:33:59.788614	\N	\N
714	350019B	150 watt replacement - LED A23-A21	\N	17	1	12.00	\N	Stockroom A-726	\N	\N	2025-03-31 17:33:54.982469	\N	\N
720	350025C	F025/841/ECO	\N	18	1	3.25	\N	Stockroom A-732	\N	\N	2025-03-31 17:33:55.49654	\N	\N
729	350042D	FT24/DL/835	\N	18	1	7.88	\N	Stockroom A-741	\N	\N	2025-03-31 17:33:56.270485	\N	\N
773	350116C	F017/841/ECO	\N	18	1	4.25	\N	Stockroom A-785	\N	\N	2025-03-31 17:34:00.049486	\N	\N
748	350053	CF26DD/E/835	\N	21	1	3.39	\N	Stockroom A-760	\N	\N	2025-03-31 17:33:57.903129	\N	\N
735	350047A	F6T5/CW	\N	24	1	1.99	\N	Stockroom A-747	\N	\N	2025-03-31 17:33:56.785133	\N	\N
705	350010	FT 18DL/841 Twin T5 Fluorescent	\N	24	1	9.91	\N	Stockroom A-717	\N	\N	2025-03-31 17:33:54.211111	\N	\N
697	330055	TR30R fuse	\N	27	1	6.45	\N	Stockroom A-709	\N	\N	2025-03-31 17:33:53.528066	\N	\N
726	350042A	FB34/FB40/CW/U6 Curvalume T12 U shape	\N	33	1	7.34	\N	Stockroom A-738	\N	\N	2025-03-31 17:33:56.012109	\N	\N
751	350056	F4T5/CW	\N	34	1	2.56	\N	Stockroom A-763	\N	\N	2025-03-31 17:33:58.160529	\N	\N
696	330055A	TR20R-TR15R-FRSR20 fuse	\N	35	1	4.05	\N	Stockroom A-708	\N	\N	2025-03-31 17:33:53.438118	\N	\N
724	350038A	15T6 Candelabra base -clear -exit	\N	39	1	0.83	\N	Stockroom A-736	\N	\N	2025-03-31 17:33:55.836957	\N	\N
752	350057	F48T12/CW/HO	\N	35	1	6.00	\N	Stockroom A-764	\N	\N	2025-03-31 17:33:58.24554	\N	\N
733	350044	F20T12/CW-F20T14/CW	\N	44	1	3.00	\N	Stockroom A-745	\N	\N	2025-03-31 17:33:56.615029	\N	\N
713	350015	20 T6.5/DC/IF 120 Exit	\N	47	1	2.50	\N	Stockroom A-725	\N	\N	2025-03-31 17:33:54.897365	\N	\N
749	350055A	F13T5/CW	\N	72	1	4.16	\N	Stockroom A-761	\N	\N	2025-03-31 17:33:57.988493	\N	\N
745	350052C	CF32DT/E/IN/835	\N	6	1	3.35	\N	Stockroom	\N	\N	2025-03-31 17:33:57.647627	\N	\N
740	350050A	F21T5/841-FP14T5/841	\N	188	1	6.03	\N	Stockroom A-752	\N	\N	2025-03-31 17:33:57.217295	\N	\N
769	350107C	25 watt standard-clear or frosted	\N	230	1	0.77	\N	Stockroom A-781	\N	\N	2025-03-31 17:33:59.703509	\N	\N
716	350021A	100W or 72W Halogen Bulb	\N	5	1	1.50	\N	Stockroom A-728	\N	\N	2025-03-31 17:33:55.154368	\N	\N
731	350043A	60B10C -60W 120V Decor-Clear	\N	47	1	1.25	\N	Stockroom A-743	\N	\N	2025-03-31 17:33:56.44073	\N	\N
816	352144A	Cord Connect	\N	5	1	7.71	\N	Stockroom A-828	\N	\N	2025-03-31 17:34:03.765308	\N	\N
806	352061A	12/2 MC Cable with Ground\r\n\r\n\r\nmetal - per foot	\N	364	1	0.55	\N	Stockroom A-818	\N	\N	2025-03-31 17:34:02.887512	\N	\N
831	355017A	FP28/835/ECO-T5	\N	107	1	8.00	\N	Stockroom A-843	\N	\N	2025-03-31 17:34:05.118342	\N	\N
812	352094C	8' or 9' Replacement Power Cord	\N	15	1	7.07	\N	Stockroom A-824	\N	\N	2025-03-31 17:34:03.408614	\N	\N
780	350119A	CF13DD/827 - emergency pole-bulbs	\N	98	1	3.25	\N	Stockroom A-792	\N	\N	2025-03-31 17:34:00.652516	\N	\N
822	353022	Motor Run Capacitor/Relays	\N	78	1	5.42	\N	Stockroom	\N	\N	2025-03-31 17:34:04.285903	\N	\N
783	350119G	CF26DD/E/827	\N	27	1	20.00	\N	Stockroom A-795	\N	\N	2025-03-31 17:34:00.909274	\N	\N
763	350085	Mercury EYE E-21-26 360	\N	3	1	31.34	\N	Stockroom A-775	\N	\N	2025-03-31 17:33:59.189876	\N	\N
789	350121	FB032/835/T8 - Bi-pin	\N	14	1	8.87	\N	Stockroom A-801	\N	\N	2025-03-31 17:34:01.422621	\N	\N
829	355014	MP100/U Medium base-clear and coated	\N	6	1	18.95	\N	Stockroom A-841	\N	\N	2025-03-31 17:34:04.939319	\N	\N
818	353004	Honeywell Fluid Power Actuator V4055A1064	\N	2	1	331.87	\N	Stockroom A-830	\N	\N	2025-03-31 17:34:03.941996	\N	\N
790	350125A	F96T12/CW/High Output	\N	3	1	5.68	\N	Stockroom A-802	\N	\N	2025-03-31 17:34:01.510304	\N	\N
791	350125	F96T12/CW/SS-single pin	\N	12	1	3.95	\N	Stockroom A-803	\N	\N	2025-03-31 17:34:01.59564	\N	\N
841	400047A	Black Utility Gloves / Pair	\N	8	1	2.75	\N	Stockroom A-853	\N	\N	2025-03-31 17:34:05.982753	\N	\N
819	353020A	Universal Surface Igniter-40-765	\N	1	1	21.66	\N	Stockroom A-831	\N	\N	2025-03-31 17:34:04.03056	\N	\N
756	350074A	LU-50 Sodium-Medium Base	\N	1	1	16.80	\N	Stockroom A-768	\N	\N	2025-03-31 17:33:58.589257	\N	\N
838	400029B	2 pk 5.5" x 8.5" Brochure Holder	\N	1	1	18.79	\N	Stockroom A-850	\N	\N	2025-03-31 17:34:05.726479	\N	\N
755	350069	Wafer Light	\N	1	1	83.33	\N	Stockroom A-767	\N	\N	2025-03-31 17:33:58.503975	\N	\N
795	350131B	39PAR30/Cap/Flood - Halogen	\N	2	1	10.00	\N	Stockroom A-807	\N	\N	2025-03-31 17:34:01.938875	\N	\N
762	350081A	LU-70 Medium Base Mercury	\N	2	1	20.13	\N	Stockroom A-774	\N	\N	2025-03-31 17:33:59.104202	\N	\N
801	352021	Flow Switch-McDonnel Miller	\N	2	1	124.00	\N	Stockroom A-813	\N	\N	2025-03-31 17:34:02.455305	\N	\N
821	353020	Hot Surface Furnace Igniter-41-402-67915 Mars	\N	3	1	16.33	\N	Stockroom A-833	\N	\N	2025-03-31 17:34:04.200319	\N	\N
730	350042	M400/ET/18	\N	3	1	28.00	\N	Stockroom A-742	\N	\N	2025-03-31 17:33:56.355301	\N	\N
834	37000F	All Flags	\N	34	1	50.00		Warehouse A-846		\N	2025-03-31 17:34:05.382455	\N	\N
835	400019	11''x 17''Paper - per ream	\N	5	1	11.83	\N	Stockroom A-847	\N	\N	2025-03-31 17:34:05.469422	\N	\N
827	355014F	F38/2D/835-F55/2D/830 Butterfly Lamp	\N	6	1	15.00	\N	Stockroom A-839	\N	\N	2025-03-31 17:34:04.718191	\N	\N
810	352091	25' Extension Cord	\N	6	1	12.94	\N	Stockroom A-822	\N	\N	2025-03-31 17:34:03.236377	\N	\N
826	355014D	MP 150/U/Medium Base	\N	7	1	21.00	\N	Stockroom A-838	\N	\N	2025-03-31 17:34:04.631647	\N	\N
833	355017	M1000/U Metalarc Mogul Base-Clear	\N	8	1	22.00	\N	Stockroom A-845	\N	\N	2025-03-31 17:34:05.294079	\N	\N
811	352093	50' Extension Cord	\N	7	1	22.36	\N	Stockroom A-823	\N	\N	2025-03-31 17:34:03.322202	\N	\N
734	350046	T10-40W tubular-exit	\N	6	1	2.36	\N	Stockroom A-746	\N	\N	2025-03-31 17:33:56.700468	\N	\N
764	350086	LU-35 Sodium Bulb	\N	8	1	25.70	\N	Stockroom A-776	\N	\N	2025-03-31 17:33:59.275357	\N	\N
799	350138	F14T12/CW	\N	18	1	5.31	\N	Stockroom A-811	\N	\N	2025-03-31 17:34:02.282529	\N	\N
792	350127A	200PAR46-3NSP/3MFL- side prong	\N	6	1	20.00	\N	Stockroom A-804	\N	\N	2025-03-31 17:34:01.681746	\N	\N
823	355014A	MP70/U/Medium Base	\N	12	1	18.95	\N	Stockroom A-835	\N	\N	2025-03-31 17:34:04.371464	\N	\N
775	350117A	M175/U Mogul Base	\N	15	1	14.50	\N	Stockroom A-787	\N	\N	2025-03-31 17:34:00.221893	\N	\N
778	350118C	65BR30FL Flood Light	\N	16	1	1.85	\N	Stockroom A-790	\N	\N	2025-03-31 17:34:00.477809	\N	\N
784	350119I	CF26DT/E/IN/835	\N	18	1	5.45	\N	Stockroom A-796	\N	\N	2025-03-31 17:34:00.994077	\N	\N
805	352057	All AC/Appliance -small extension cords	\N	17	1	6.99	\N	Stockroom A-817	\N	\N	2025-03-31 17:34:02.802736	\N	\N
830	355015	M400/U Mogul Base and Compact	\N	18	1	26.36	\N	Stockroom A-842	\N	\N	2025-03-31 17:34:05.02498	\N	\N
832	355017B	MP350/400 PS pulse bulb	\N	18	1	31.00	\N	Stockroom A-844	\N	\N	2025-03-31 17:34:05.208865	\N	\N
825	355014C	M250/U Mogul Base	\N	19	1	15.00	\N	Stockroom A-837	\N	\N	2025-03-31 17:34:04.546459	\N	\N
781	350119D	CF7/DS/827	\N	20	1	1.80	\N	Stockroom A-793	\N	\N	2025-03-31 17:34:00.7372	\N	\N
777	350117	M175/U Medium base	\N	20	1	14.50	\N	Stockroom A-789	\N	\N	2025-03-31 17:34:00.3924	\N	\N
798	350135G	75 or 60 PAR30 LN/CAP	\N	30	1	7.50	\N	Stockroom A-810	\N	\N	2025-03-31 17:34:02.196551	\N	\N
736	3500047B	T5 12" LED F8T5 4100k	\N	32	1	5.00	\N	Stockroom A-748	\N	\N	2025-03-31 17:33:56.870956	\N	\N
782	350119F	CF26DD/835-2 pin	\N	37	1	3.35	\N	Stockroom A-794	\N	\N	2025-03-31 17:34:00.822385	\N	\N
787	350120C	CF13DD/E/835	\N	46	1	8.30	\N	Stockroom A-799	\N	\N	2025-03-31 17:34:01.251383	\N	\N
793	350129	25B10 clear-candelabra base	\N	75	1	0.64	\N	Stockroom A-805	\N	\N	2025-03-31 17:34:01.768415	\N	\N
718	350021	LU-150 Mogul Base	\N	47	1	14.45	\N	Stockroom A-730	\N	\N	2025-03-31 17:33:55.326021	\N	\N
797	350135F	35 PAR16/CAP/GU10/FL40	\N	65	1	17.00	\N	Stockroom A-809	\N	\N	2025-03-31 17:34:02.110601	\N	\N
828	355014G	F39/T5/HO/841	\N	110	1	6.00	\N	Stockroom A-840	\N	\N	2025-03-31 17:34:04.802944	\N	\N
786	350120A	PLC 15MM/22W/27-2 pin	\N	80	1	11.75	\N	Stockroom A-798	\N	\N	2025-03-31 17:34:01.166272	\N	\N
796	350135C	35MR16/B/Flood-Halogen	\N	83	1	5.05	\N	Stockroom A-808	\N	\N	2025-03-31 17:34:02.023998	\N	\N
785	350119	CF18DD/835-CF18DD/E/835	\N	103	1	3.65	\N	Stockroom A-797	\N	\N	2025-03-31 17:34:01.079044	\N	\N
813	352098	1/2'' EMT Conduit-per foot	\N	117	1	0.38	\N	Stockroom A-825	\N	\N	2025-03-31 17:34:03.501471	\N	\N
809	352070	Thermostat Wire-per ft.	\N	131	1	0.28	\N	Stockroom A-821	\N	\N	2025-03-31 17:34:03.145202	\N	\N
814	352099	3/4 EMT Conduit - per foot	\N	120	1	0.52	\N	Stockroom A-826	\N	\N	2025-03-31 17:34:03.586841	\N	\N
842	400047	Kleenex Tissues-box	\N	17	1	1.92	\N	Stockroom A-854	\N	\N	2025-03-31 17:34:06.069209	\N	\N
843	400059	All Desk and Door Holders	\N	141	1	3.04	\N	Stockroom A-855	\N	\N	2025-03-31 17:34:06.155025	\N	\N
807	352061B	12/3 MC cable with ground -metal-per foot	\N	230	1	0.85	\N	Stockroom A-819	\N	\N	2025-03-31 17:34:02.974596	\N	\N
808	352061C	12/3 Romex cable with ground -yellow-per foot	\N	238	1	0.45	\N	Stockroom A-820	\N	\N	2025-03-31 17:34:03.059251	\N	\N
840	400047B	Disposable Nitrile Gloves	\N	1	1	12.59	\N	Stockroom A-852	\N	\N	2025-03-31 17:34:05.896649	\N	\N
849	420003	Putty Knives-each	\N	1	1	6.16	\N	Stockroom A-861	\N	\N	2025-03-31 17:34:06.674367	\N	\N
847	420001	Utility Knives - each		5	1	8.00	\N		\N	\N	2025-03-31 17:34:06.498528	\N	\N
891	630058	17/64-25/64 drill bits	\N	104	1	3.48	\N	Stockroom A-903	\N	\N	2025-03-31 17:34:10.368477	\N	\N
866	420020	Tape Measure 25'		1	1	14.05	\N		\N	\N	2025-03-31 17:34:08.139812	\N	\N
845	403540	Floor Door Guides-Stanley	\N	49	1	5.82	\N	Stockroom A-857	\N	\N	2025-03-31 17:34:06.327767	\N	\N
867	420021	Vise Grips	\N	0	1	17.84	\N	Stockroom A-879	\N	\N	2025-03-31 17:34:08.225064	\N	\N
857	420011	Key Bak-each	\N	1	1	14.41	\N	Stockroom A-869	\N	\N	2025-03-31 17:34:07.370247	\N	\N
899	630139A	Hole Saws 5/8'' thru 1 1/4''	\N	14	1	9.45	\N	Stockroom A-911	\N	\N	2025-03-31 17:34:11.059422	\N	\N
881	610300	Torch Kits-Mapp Gas or Propane	\N	0	1	89.47	\N	Stockroom A-893	\N	\N	2025-03-31 17:34:09.511008	\N	\N
915	700070	CO2-Carbon Dioxide-20LB tank	\N	4	1	30.00	\N	Stockroom A-927	\N	\N	2025-03-31 17:34:12.43124	\N	\N
852	420006	Wire Strippers-each	\N	2	1	19.61	\N	Stockroom A-864	\N	\N	2025-03-31 17:34:06.940729	\N	\N
873	600008A	Screwdriver Bits #2 - 6''	\N	6	1	3.11	\N	Stockroom A-885	\N	\N	2025-03-31 17:34:08.739185	\N	\N
855	420009	Hammer-each	\N	2	1	20.31	\N	Stockroom A-867	\N	\N	2025-03-31 17:34:07.198863	\N	\N
926	720043A	CPVC Pipe Cement/Cleaner -4 oz.	\N	26	1	3.57	\N	Stockroom A-938	\N	\N	2025-03-31 17:34:13.405976	\N	\N
860	420014	Channel Lock Pliers 16.5''	\N	1	1	32.23	\N	Stockroom A-872	\N	\N	2025-03-31 17:34:07.628663	\N	\N
941	730014	Aluminum Foil or Armaflex Insulating Tape	\N	4	1	20.17	\N	Stockroom A-953	\N	\N	2025-03-31 17:34:14.711232	\N	\N
858	420012	Diagonal Cutting Pliers-each		4	1	22.46	\N		\N	\N	2025-03-31 17:34:07.457867	\N	\N
912	670029A	3 to 2 adapter -plug	\N	2	1	0.33	\N	Stockroom A-924	\N	\N	2025-03-31 17:34:12.173235	\N	\N
884	610310	T50 Staple Gun	\N	1	1	15.30	\N	Stockroom A-896	\N	\N	2025-03-31 17:34:09.768547	\N	\N
904	640025	dripless caulk gun	\N	1	1	12.62	\N	Stockroom A-916	\N	\N	2025-03-31 17:34:11.488192	\N	\N
853	420007	Aviation Snips-each	\N	0	1	20.24	\N	Stockroom A-865	\N	\N	2025-03-31 17:34:07.025907	\N	\N
868	420022	Adjustable Wrench	\N	1	1	30.25	\N	Stockroom A-880	\N	\N	2025-03-31 17:34:08.311591	\N	\N
862	420016	Channel Lock Pliers 9 1/2''	\N	1	1	16.91	\N	Stockroom A-874	\N	\N	2025-03-31 17:34:07.800053	\N	\N
861	420015	Channel Lock Pliers 12''	\N	1	1	20.03	\N	Stockroom A-873	\N	\N	2025-03-31 17:34:07.714795	\N	\N
851	420005	Inspection Mirror-each	\N	1	1	13.60	\N	Stockroom A-863	\N	\N	2025-03-31 17:34:06.85565	\N	\N
965	900006	Ant Traps-per pack	ant bait hot shot max attrax	40	10	1.97	\N	Stockroom	\N	\N	2025-03-31 17:34:16.829688	1	\N
850	420004	Hex Key Sets-each	\N	1	1	10.40	\N	Stockroom A-862	\N	\N	2025-03-31 17:34:06.769646	\N	\N
876	600097	Sink Garbage Disposal	\N	1	1	110.17	\N	Stockroom - Shelf H1	\N	\N	2025-03-31 17:34:09.085013	\N	\N
864	420018	Hose Nozzle	\N	2	1	12.62	\N	Stockroom A-876	\N	\N	2025-03-31 17:34:07.97008	\N	\N
911	660055	Double End Screwdriver Bit	\N	3	1	0.58	\N	Stockroom A-923	\N	\N	2025-03-31 17:34:12.088636	\N	\N
913	670029	Ground Rod -copper 8'	\N	2	1	11.94	\N	Stockroom A-925	\N	\N	2025-03-31 17:34:12.258887	\N	\N
871	480020	ONU Mailing Labels-each	\N	115	1	0.10	\N	Stockroom A-883	\N	\N	2025-03-31 17:34:08.569253	\N	\N
887	610348	Wirebrush with Handle	\N	3	1	2.35	\N	Stockroom A-899	\N	\N	2025-03-31 17:34:10.027627	\N	\N
879	610276	Hack Saws-Grease Guns	\N	1	1	14.71	\N	Stockroom A-891	\N	\N	2025-03-31 17:34:09.341338	\N	\N
875	600097A	End Outlet Waste-1 1/2 PVC	\N	4	1	3.52	\N	Stockroom A-887	\N	\N	2025-03-31 17:34:08.999595	\N	\N
906	640027B	Nebo Rechargeable Flashlight	\N	4	1	37.00	\N	Stockroom A-918	\N	\N	2025-03-31 17:34:11.660215	\N	\N
883	610309	Mapp Gas Cylinder	\N	4	1	7.84	\N	Stockroom A-895	\N	\N	2025-03-31 17:34:09.682388	\N	\N
910	650103C	Sawzall Blades-all sizes-each	\N	57	1	3.75	\N	Stockroom A-922	\N	\N	2025-03-31 17:34:12.003914	\N	\N
878	610131	6 outlet adapter	\N	5	1	2.75	\N	Stockroom A-890	\N	\N	2025-03-31 17:34:09.256142	\N	\N
902	630139D	Hole Saws 2 7/8'' thru 4 1/2''	\N	5	1	18.60	\N	Stockroom A-914	\N	\N	2025-03-31 17:34:11.31565	\N	\N
886	610348B	Wirebrush for Drill	\N	5	1	3.50	\N	Stockroom A-898	\N	\N	2025-03-31 17:34:09.940867	\N	\N
943	730037B	Black Duct Tape	\N	79	1	4.78	\N	Stockroom A-955	\N	\N	2025-03-31 17:34:14.884178	\N	\N
877	610131A	3 outlet adapter - tri-tap	\N	5	1	4.12	\N	Stockroom A-889	\N	\N	2025-03-31 17:34:09.170597	\N	\N
882	610307	Propane Bottles	\N	6	1	8.61	\N	Stockroom A-894	\N	\N	2025-03-31 17:34:09.595532	\N	\N
907	640027	All Flashlights	\N	7	1	28.38	\N	Stockroom A-919	\N	\N	2025-03-31 17:34:11.745643	\N	\N
908	650057	Hack Saw Blades - each	\N	13	1	1.14	\N	Stockroom A-920	\N	\N	2025-03-31 17:34:11.831051	\N	\N
903	630170	Hole Saw Pilot Drill Bit	\N	6	1	4.17	\N	Stockroom A-915	\N	\N	2025-03-31 17:34:11.40141	\N	\N
900	630139B	Hole Saws 1 5/16 thru 2 1/16	\N	8	1	11.83	\N	Stockroom A-912	\N	\N	2025-03-31 17:34:11.14461	\N	\N
901	630139C	Hole Saws 2 1/8''thru 2 3/4''	\N	9	1	13.28	\N	Stockroom A-913	\N	\N	2025-03-31 17:34:11.229749	\N	\N
874	600008B	Screwdriver Bits-#2#1#3	\N	8	1	2.08	\N	Stockroom A-886	\N	\N	2025-03-31 17:34:08.889263	\N	\N
905	640026	demolition screwdriver set -Each	\N	1	1	14.60	\N	Stockroom A-917	\N	\N	2025-03-31 17:34:11.574879	\N	\N
854	045242508082	Screwdriver 11-1	Milwaukee 11 in 1 screwdriver set	7	2	18.37	\N	Stockroom - Shelf F1	\N	\N	2025-03-31 17:34:07.110697	1	168
859	420013	Needle Nose Pliers-each	\N	1	1	24.17	\N	Stockroom A-871	\N	\N	2025-03-31 17:34:07.543581	\N	\N
909	650084F	All Jig Saw Blades - per pack	\N	14	1	3.81	\N	Stockroom A-921	\N	\N	2025-03-31 17:34:11.917885	\N	\N
872	550012	Epoxy	\N	13	1	4.53	\N	Stockroom A-884	\N	\N	2025-03-31 17:34:08.654629	\N	\N
865	420019	Poncho - 1 size fits all	\N	18	1	3.77	\N	Stockroom A-877	\N	\N	2025-03-31 17:34:08.054887	\N	\N
885	610340A	Grinding Discs-Metal-Masonry-Cut-off wheels	\N	31	1	2.90	\N	Stockroom A-897	\N	\N	2025-03-31 17:34:09.853262	\N	\N
888	630016	All Wood Bores	\N	43	1	2.83	\N	Stockroom A-900	\N	\N	2025-03-31 17:34:10.112701	\N	\N
848	420002	Utility Blades-pack	\N	6	1	1.97	\N	Stockroom A-860	\N	\N	2025-03-31 17:34:06.584769	\N	\N
893	630064	Magnetic Nutsetter- all sizes-each	\N	27	1	4.26	\N	Stockroom A-905	\N	\N	2025-03-31 17:34:10.539043	\N	\N
870	450054	ONU Orange or White Folders-each	\N	867	1	1.00	\N	Stockroom A-882	\N	\N	2025-03-31 17:34:08.481566	\N	\N
982	950010B	Velcro Straps-100 per bag 38UV53	\N	0	1	19.76	\N	Stockroom A-994	\N	\N	2025-03-31 17:34:18.280279	\N	\N
924	720006	Loctite Threadlocker/Blue		3	1	21.83	\N		\N	\N	2025-03-31 17:34:13.230337	\N	\N
966	900061	Tension Rods-Shower	\N	3	1	8.18	\N	Stockroom A-978	\N	\N	2025-03-31 17:34:16.915458	\N	\N
979	940014	Shower Rods	\N	1	1	8.18	\N	Stockroom A-991	\N	\N	2025-03-31 17:34:18.024028	\N	\N
933	720077	Cove Base Adhesive-quart	\N	8	1	21.95	\N	Stockroom	\N	\N	2025-03-31 17:34:14.021976	\N	\N
940	730013	Teflon Tape	\N	17	1	0.80	\N	Stockroom A-952	\N	\N	2025-03-31 17:34:14.623567	\N	\N
929	720044P	PVC Pipe Cleaner-16 oz.	\N	3	1	5.41	\N	Stockroom A-941	\N	\N	2025-03-31 17:34:13.672834	\N	\N
984	980011B	Dremel Wheel Mandrel	\N	1	1	2.32	\N	Stockroom A-996	\N	\N	2025-03-31 17:34:18.449736	\N	\N
574	300328A	1''1 1/4'' 2'' steel locknuts	\N	11	1	0.45	\N	Stockroom A-586	\N	\N	2025-03-31 17:33:42.731647	\N	\N
707	350014A	100/Q/CL - Tungston Halogen Lamp	\N	21	1	9.85	\N	Stockroom A-719	\N	\N	2025-03-31 17:33:54.381147	\N	\N
974	911005	Flying Insect Spray	\N	3	1	6.09	\N	Stockroom A-986	\N	\N	2025-03-31 17:34:17.598938	\N	\N
487	290005	1 1/2'' BI Pipe	\N	0	1	2.50	\N	Stockroom A-499	\N	\N	2025-03-31 17:33:35.19751	\N	\N
519	300084J	1'' EMT connector	\N	14	1	0.49	\N	Stockroom A-531	\N	\N	2025-03-31 17:33:37.965326	\N	\N
949	760019	KI Middle Stringer	\N	3	1	24.07	\N	Stockroom A-961	\N	\N	2025-03-31 17:34:15.402948	\N	\N
930	720044Q	PVC Pipe Cleaner-32 oz.	\N	3	1	7.45	\N	Stockroom A-942	\N	\N	2025-03-31 17:34:13.757613	\N	\N
918	711007A	Poly Cover -20x100 -per box	\N	2	1	61.14	\N	Stockroom A-930	\N	\N	2025-03-31 17:34:12.705182	\N	\N
951	780012	Desk-Dorm/Apartment	\N	3	1	200.60	\N	Stockroom A-963	\N	\N	2025-03-31 17:34:15.576113	\N	\N
919	711007C	Poly Cover 10x100 -per box	\N	3	1	29.87	\N	Stockroom A-931	\N	\N	2025-03-31 17:34:12.796229	\N	\N
416	240042	1 1/2'' - 2'' No-Hub Coupling	\N	25	1	2.60	\N	Stockroom A-428	\N	\N	2025-03-31 17:33:29.02902	\N	\N
923	720005	Contact Cleaner/Spray Duster -electrical or precision	\N	4	1	5.65	\N	Stockroom A-935	\N	\N	2025-03-31 17:34:13.139376	\N	\N
980	940017	Closet Rods-Extension	\N	6	1	7.77	\N	Stockroom A-992	\N	\N	2025-03-31 17:34:18.108838	\N	\N
976	920020	Tampax Tampons	\N	140	1	0.19	\N	Stockroom A-988	\N	\N	2025-03-31 17:34:17.76914	\N	\N
950	760021	End Stringer	\N	2	1	24.07	\N	Stockroom A-962	\N	\N	2025-03-31 17:34:15.491336	\N	\N
947	760006	KI Bed End Set	\N	1	1	99.00	\N	Stockroom A-959	\N	\N	2025-03-31 17:34:15.230826	\N	\N
955	860013B	Hand Shower	\N	4	1	50.57	\N	Stockroom A-967	\N	\N	2025-03-31 17:34:15.926849	\N	\N
927	720043Q	PVC Pipe Glue-32 oz.	\N	3	1	15.91	\N	Stockroom A-939	\N	\N	2025-03-31 17:34:13.4918	\N	\N
975	911007	Insect Repellent	\N	1	1	4.27	\N	Stockroom A-987	\N	\N	2025-03-31 17:34:17.684642	\N	\N
985	980011	Dremel Cut-Off Wheels 426-each	\N	2	1	1.27	\N	Stockroom A-997	\N	\N	2025-03-31 17:34:18.535544	\N	\N
931	720055	Leak Lock Thread Sealer	\N	1	1	6.50	\N	Stockroom A-943	\N	\N	2025-03-31 17:34:13.84369	\N	\N
928	720043	PVC Pipe Glue-16 oz.	\N	6	1	13.33	\N	Stockroom A-940	\N	\N	2025-03-31 17:34:13.585065	\N	\N
1024	990030	Volt Meter	\N	1	1	30.00	\N	Stockroom A-1036	\N	\N	2025-03-31 17:34:21.91445	\N	\N
944	730037	Duct Tape-Silver	\N	9	1	3.65	\N	Stockroom A-956	\N	\N	2025-03-31 17:34:14.970524	\N	\N
932	720077A	Floor Adhesive, 7350 Series	\N	1	1	45.29	\N	Stockroom A-944	\N	\N	2025-03-31 17:34:13.935265	\N	\N
969	900179B	Tarp-8x10	\N	2	1	2.88	\N	Stockroom A-981	\N	\N	2025-03-31 17:34:17.172768	\N	\N
963	900002B	Sticky Trap	\N	3	1	3.00	\N	Stockroom A-975	\N	\N	2025-03-31 17:34:16.606665	\N	\N
916	700102A	Overhead Stain Sealer - spray	\N	2	1	16.90	\N	Stockroom A-928	\N	\N	2025-03-31 17:34:12.516718	\N	\N
938	730011A	Packaging Tape -clear	\N	4	1	2.39	\N	Stockroom A-950	\N	\N	2025-03-31 17:34:14.45104	\N	\N
972	911001	Wasp and Hornet Spray	\N	0	1	4.83	\N	Stockroom A-984	\N	\N	2025-03-31 17:34:17.428045	\N	\N
939	730012	Electrical Tape-all colors-each		73	1	4.71	\N		\N	\N	2025-03-31 17:34:14.537128	\N	\N
934	720090A	Spray Adhesive	\N	3	1	6.68	\N	Stockroom A-946	\N	\N	2025-03-31 17:34:14.106687	\N	\N
971	900179D	Tarp-12x16-12x20-16x20-10x20	\N	4	1	12.77	\N	Stockroom A-983	\N	\N	2025-03-31 17:34:17.341846	\N	\N
381	210009	#7 Air Vent - each	\N	6	1	10.41	\N	Stockroom A-393	\N	\N	2025-03-31 17:33:25.995263	\N	\N
956	860013C	Flex Hose for Hand Shower	\N	5	1	28.88	\N	Stockroom	\N	\N	2025-03-31 17:34:16.012464	\N	\N
957	860013D	Hand Shower Wall Mount	\N	5	1	13.16	\N	Stockroom A-969	\N	\N	2025-03-31 17:34:16.097349	\N	\N
958	860013F	Wall Rail Slide-Hand Shower	\N	6	1	10.15	\N	Stockroom A-970	\N	\N	2025-03-31 17:34:16.183036	\N	\N
964	900002	Mouse Trap (2pk)	\N	7	1	1.19	\N	Stockroom A-976	\N	\N	2025-03-31 17:34:16.742836	\N	\N
937	720115B	Super Glue	\N	9	1	0.93	\N	Stockroom A-949	\N	\N	2025-03-31 17:34:14.365574	\N	\N
967	900061A	H543 Screwdriver Stop 3/4"	\N	8	1	15.30	\N	Stockroom A-979	\N	\N	2025-03-31 17:34:17.001334	\N	\N
925	720012	Lock Ease or Graphite	\N	9	1	2.64	\N	Stockroom A-937	\N	\N	2025-03-31 17:34:13.318936	\N	\N
952	780013	1 door wardrobe	\N	0	1	0.00	\N	Stockroom A-964	\N	\N	2025-03-31 17:34:15.662735	\N	\N
983	980011A	Dremel Carbon Steel Brush	\N	9	1	2.24	\N	Stockroom A-995	\N	\N	2025-03-31 17:34:18.364973	\N	\N
935	720091A	Silicone-High Temp -cartridge	\N	3	1	12.70	\N	Stockroom A-947	\N	\N	2025-03-31 17:34:14.194356	\N	\N
981	950010A	Velcro Fasteners-per box	\N	13	1	7.46	\N	Stockroom A-993	\N	\N	2025-03-31 17:34:18.194747	\N	\N
946	730064A	Red Double Face Tape-small roll M 4910	\N	14	1	11.39	\N	Stockroom A-958	\N	\N	2025-03-31 17:34:15.142047	\N	\N
960	860016B	Sharkbite Couplings-1/2''3/4''1''	\N	17	1	9.99	\N	Stockroom A-972	\N	\N	2025-03-31 17:34:16.352455	\N	\N
970	900179C	Tarp-10x12	\N	4	1	5.22	\N	Stockroom A-982	\N	\N	2025-03-31 17:34:17.257151	\N	\N
961	860016C	Sharkbite 90's- Adaptors 1/2''-3/4''-1''	\N	26	1	11.40	\N	Stockroom A-973	\N	\N	2025-03-31 17:34:16.437082	\N	\N
959	860016A	Sharkbite Stops-Angle & Straight	\N	28	1	8.24	\N	Stockroom A-971	\N	\N	2025-03-31 17:34:16.26773	\N	\N
977	920024	Maxi Pads	\N	46	1	0.20	\N	Stockroom A-989	\N	\N	2025-03-31 17:34:17.854197	\N	\N
218	159619	1/4'' BI nipples	\N	63	1	1.16	\N	Stockroom A-229	\N	\N	2025-03-31 17:33:11.92355	\N	\N
586	300369	#500 Wiremold Conduit - per ft	\N	69	1	0.95	\N	Stockroom A-598	\N	\N	2025-03-31 17:33:43.792445	\N	\N
920	711009	Door Peepholes	\N	6	1	8.83	\N	Stockroom A-932	\N	\N	2025-03-31 17:34:12.88118	\N	\N
978	940002	Large Door Mirror	\N	8	1	12.55	\N	Stockroom A-990	\N	\N	2025-03-31 17:34:17.939092	\N	\N
953	780300	Compression Fittings-Flare Adapters	\N	227	1	1.65	\N	Stockroom A-965	\N	\N	2025-03-31 17:34:15.74995	\N	\N
954	780516	Compression Fittings-Unions-Nuts	\N	290	1	2.24	\N	Stockroom A-966	\N	\N	2025-03-31 17:34:15.836844	\N	\N
863	420017	Channel Lock Pliers 6''	\N	1	1	14.51	\N	Stockroom A-875	\N	\N	2025-03-31 17:34:07.884946	\N	\N
1005	990014	Stove Range	\N	2	1	0.00	\N	Stockroom A-1017	\N	\N	2025-03-31 17:34:20.26782	\N	\N
1013	1677726	2" PVC 90 Elbow	\N	4	1	3.00	\N	Stockroom A-1025	\N	\N	2025-03-31 17:34:20.958533	\N	\N
998	990007	Par38 3000k security bulb	\N	4	1	6.25	\N	Stockroom A-1010	\N	\N	2025-03-31 17:34:19.658173	\N	\N
844	400065	8 1/2 x 14 Legal Paper	\N	28	1	6.80	\N	Stockroom A-856	\N	\N	2025-03-31 17:34:06.24024	\N	\N
1019	990025	Flourescent lampholder	\N	24	1	5.20	\N	Stockroom A-1031	\N	\N	2025-03-31 17:34:21.486151	\N	\N
1007	990016	Garden Hose 90 Elbow	\N	1	1	11.48	\N	Stockroom A-1019	\N	\N	2025-03-31 17:34:20.439087	\N	\N
992	990001	Dishwasher Install Kit	\N	8	1	23.51	\N	Stockroom A-1004	\N	\N	2025-03-31 17:34:19.135115	1	263
438	250030	B&G 111049 Power Pack	\N	1	1	756.00	\N	Stockroom A-450	\N	\N	2025-03-31 17:33:30.920172	\N	\N
430	250018	B&G 189105 Bearing Assembly	\N	1	1	292.38	\N	Stockroom A-442	\N	\N	2025-03-31 17:33:30.233101	\N	\N
1010	990019	Gerber Multi Tool 6FZL8	\N	1	1	87.36	\N	Stockroom A-1022	\N	\N	2025-03-31 17:34:20.700063	\N	\N
986	160194B	6 Volt 4.5 Amp Rechargeable Battery BC645		8	5	5.25	\N	Stockroom - Shelf S2	\N	\N	2025-03-31 17:34:18.623371	1	303
1016	990022	Laundry Tub Utility Sink	\N	2	1	102.66	\N	Stockroom A-1028	\N	\N	2025-03-31 17:34:21.213232	\N	\N
1009	990018	1RLN8 Laundry Tub Sink	\N	2	1	102.66	\N	Stockroom A-1021	\N	\N	2025-03-31 17:34:20.61355	\N	\N
1011	990020	Dewalt 45j358 Multi Tool	\N	2	1	33.13	\N	Stockroom A-1023	\N	\N	2025-03-31 17:34:20.787647	\N	\N
1018	990024	Fire Extinguisher Mounting Bracket	\N	18	1	1.35	\N	Stockroom A-1030	\N	\N	2025-03-31 17:34:21.397061	\N	\N
997	990006	Padlock solid body aluminum	\N	2	1	15.00	\N	Stockroom A-1009	\N	\N	2025-03-31 17:34:19.572316	\N	\N
991	3500060A	Black Zip Ties		75	1	0.05	\N		\N	\N	2025-03-31 17:34:19.05032	\N	\N
994	990003	Microwave Comfee EM720CPL	\N	10	1	67.90	\N	Stockroom A-1006	\N	\N	2025-03-31 17:34:19.313131	1	263
391	210063D	Boiler Gauge - Back or Bottom Mount	\N	3	1	47.52	\N	Stockroom A-403	\N	\N	2025-03-31 17:33:26.856419	\N	\N
993	990002	Refrigerator 18tmf-w	\N	2	1	0.00	\N	Stockroom A-1005	\N	\N	2025-03-31 17:34:19.222039	\N	\N
1006	990015	Washing Machine Y Hose	\N	2	1	15.99	\N	Stockroom A-1018	\N	\N	2025-03-31 17:34:20.353409	\N	\N
1000	990009	Adhesive Remover	\N	2	1	19.00	\N	Stockroom A-1012	\N	\N	2025-03-31 17:34:19.835149	\N	\N
1014	1677736	2" PVC 45 Elbow	\N	4	1	3.00	\N	Stockroom A-1026	\N	\N	2025-03-31 17:34:21.04335	\N	\N
1002	990011	Yellow Flag Terminal	\N	8	1	1.00	\N	Stockroom A-1014	\N	\N	2025-03-31 17:34:20.006388	\N	\N
996	990005	Padlock weather resistant	\N	3	1	23.00	\N	Stockroom A-1008	\N	\N	2025-03-31 17:34:19.484732	\N	\N
1020	990026	Office Chair Wheels	\N	5	1	4.99	\N	Stockroom A-1032	\N	\N	2025-03-31 17:34:21.571727	\N	\N
1022	990028	EZ Heat Portable Heater	\N	4	1	35.95	\N	Stockroom A-1034	\N	\N	2025-03-31 17:34:21.744814	\N	\N
1021	990027	Table	\N	4	1	75.00	\N	Stockroom A-1033	\N	\N	2025-03-31 17:34:21.659853	\N	\N
1003	990012	Bi Fold Door	\N	4	1	45.00	\N	Stockroom A-1015	\N	\N	2025-03-31 17:34:20.091829	\N	\N
1023	990029	Southwire 40116N Non-Contact AC Voltage Detector	\N	4	1	14.00	\N	Stockroom A-1035	\N	\N	2025-03-31 17:34:21.829844	\N	\N
1008	990017	Photoelectric Smoke Head Sensor		2	1	30.00	\N	Stockroom - Shelf S1	\N	\N	2025-03-31 17:34:20.525002	1	302
1001	990010	7385004.002 Faucet Am St	\N	4	1	90.00	\N	Stockroom A-1013	\N	\N	2025-03-31 17:34:19.920133	\N	\N
250	167726	All PVC 90's and ST	\N	12	1	1.46	\N	Stockroom A-261	\N	\N	2025-03-31 17:33:14.689286	\N	\N
987	160194A	BG-1250F2 12V Rechargeable Battery	\N	5	1	13.00	\N	Stockroom A-999	\N	\N	2025-03-31 17:34:18.708196	\N	\N
1004	990013	Shower Curtain	\N	9	1	6.00	\N	Stockroom A-1016	\N	\N	2025-03-31 17:34:20.17663	\N	\N
303	200095	AM ST Balancing Spool -10532-0070A	\N	7	1	57.43	\N	Stockroom A-314	\N	\N	2025-03-31 17:33:19.261644	\N	\N
1026	60MM37	Dishwasher Machine Cleaner	12oz	1	3	4.73	\N	\N	\N	\N	2025-04-04 13:43:03.782226	\N	\N
650	320029B	QOB 115- QO 115 breaker	\N	29	1	7.55	\N	Stockroom A-662	\N	\N	2025-03-31 17:33:49.33323	\N	\N
1012	990021	2Y025 Jigsaw 5 pack	\N	1	1	8.19	\N	Stockroom A-1024	\N	\N	2025-03-31 17:34:20.873911	\N	\N
846	408175A	Nucalgon or Nubrite ice machine cleaner	\N	8	1	18.20	\N	Stockroom A-858	\N	\N	2025-03-31 17:34:06.413092	\N	\N
682	330012C	FRS-R 15 Fuse	\N	4	1	9.80	\N	Stockroom A-694	\N	\N	2025-03-31 17:33:52.168209	\N	\N
346	200168	Toilet Plunger	\N	3	1	7.03	\N	Stockroom A-358	\N	\N	2025-03-31 17:33:22.981955	\N	\N
605	310035H	HBL 1223I 3 way switch -ivory or white	\N	13	1	3.78	\N	Stockroom A-617	\N	\N	2025-03-31 17:33:45.476362	\N	\N
917	710010	Mesh Sandpaper-per roll	\N	13	1	5.35	\N	Stockroom A-929	\N	\N	2025-03-31 17:34:12.603153	\N	\N
279	200040C	Faucet Handles -Marked Hot or Cold and Elkay wrist blade	\N	13	1	4.29	\N	Stockroom A-290	\N	\N	2025-03-31 17:33:17.193706	\N	\N
526	300155	5781 and 5781A Wiremold	\N	16	1	3.30	\N	Stockroom A-538	\N	\N	2025-03-31 17:33:38.593993	\N	\N
111	110418F	Small Master Lock 130D	\N	1	1	4.02	\N	Stockroom A-122	\N	\N	2025-03-31 17:33:02.663937	\N	\N
989	350049D	Delta Faucet Bonnet Nut	\N	18	1	14.80	\N	Stockroom A-1001	\N	\N	2025-03-31 17:34:18.880306	1	177
40	2087068	Loctite 567 .20 fl oz	loctite 567 pipe sealer	11	5	9.93	\N	Stockroom	\N	\N	2025-03-31 17:32:56.399535	1	\N
767	845940014393	LED-100W equivalent-A19	energetic lighting 8.5 w led light bulb	262	10	24.59	\N	Stockroom - Shelf L2	\N	\N	2025-03-31 17:33:59.531009	1	275
69	100425A	All Nylon Rope - per bag	\N	18	1	10.76	\N	Stockroom A-80	\N	\N	2025-03-31 17:32:59.046052	\N	\N
560	300286F	Locking Ties-7 1/2''-8''-each	\N	300	1	0.18	\N	Stockroom A-572	\N	\N	2025-03-31 17:33:41.538781	\N	\N
338	200162C	Replacement Clamp 1 1/2''	\N	9	1	12.10	\N	Stockroom A-350	\N	\N	2025-03-31 17:33:22.291088	\N	\N
771	350110A	60 Watt Globe - clear-frosted-med -LED	\N	46	1	5.25	\N	Stockroom A-783	\N	\N	2025-03-31 17:33:59.876296	\N	\N
172	150236	Hex Nuts-5/8-7/16-9/16-1/2	\N	1246	1	0.08	\N	Stockroom A-183	\N	\N	2025-03-31 17:33:07.963367	\N	\N
988	350049C	t-8 48" Flourescent Bulb	\N	24	1	4.00	\N	Stockroom A-1000	\N	\N	2025-03-31 17:34:18.793255	\N	\N
1017	990023	16109 39PAR20/FL30	\N	12	1	4.50	\N	Stockroom A-1029	\N	\N	2025-03-31 17:34:21.298711	\N	\N
693	330050A	TR8R-TR5R-RF3-FNQR8 time delay fuses	\N	29	1	11.53	\N	Stockroom A-705	\N	\N	2025-03-31 17:33:53.178186	\N	\N
999	990008	Hand Warmers	\N	40	1	0.70	\N	Stockroom A-1011	\N	\N	2025-03-31 17:34:19.746971	\N	\N
144	150029	All #12 Machine Screw-Bins-each	\N	1874	1	0.08	\N	Stockroom A-155	\N	\N	2025-03-31 17:33:05.530508	\N	\N
317	670240652446	Zurn Shower Handle-RK7300-G67917		8	1	23.27	\N	Stockroom - Shelf J2	\N	\N	2025-03-31 17:33:20.469057	1	177
1041	1 2MDV6	7.5MFD 370VAC capacitor 2MDV6A	\N	7	1	4.00	\N	\N	\N	\N	2025-04-09 12:20:24.72559	\N	\N
1104	045242082629	Milwaukee Tool Reciprocating Saw Blade,TPI 6,Pk5 48-00-5015 - All	\N	0	1	14.99	\N	\N	\N	\N	2025-04-09 12:20:30.87815	\N	\N
1113	792363946049	Pittsburgh 1/4 X 4 Inch Slot Screwdriver and Philips Screw Driver Set	\N	1	1	3.25	\N	\N	\N	\N	2025-04-09 12:20:31.664727	\N	\N
1042	081838734022	73402 Screw Extractor Spiral Flute, No. 2	\N	3	1	5.10	\N	\N	\N	\N	2025-04-09 12:20:24.820538	\N	\N
1094	082472203295	Lenox 4-1/2 in. X 3/8 in. 6 TPI Jig Saw Blade	\N	3	1	3.97	\N	\N	\N	\N	2025-04-09 12:20:30.014466	\N	\N
1028	038091708857	12x1429 BLU Tef Tape	\N	6	1	3.96	\N	\N	\N	\N	2025-04-09 12:20:23.446957	\N	\N
1097	045325174579	Mas Whl 4.5x1/8x7/8	\N	4	1	9.99	\N	\N	\N	\N	2025-04-09 12:20:30.270874	\N	\N
1103	045242082810	Milwaukee Tool Reciprocating Saw Blade,TPI 18,Pk5 48-00-5163 - All	\N	1	1	9.99	\N	\N	\N	\N	2025-04-09 12:20:30.791865	1	168
1101	045242082742	Milwaukee SAWZALL Blade	 4 in. Bi-Metal Double Duty Upgrade Reciprocating Saw Blade 10 TPI 5 Pk	3	1	6.09	\N		\N	\N	2025-04-09 12:20:30.619279	\N	\N
1080	028877441900	Dewalt Meule Abrasive Pour Métaux En Zircon DW8808 - Rona	\N	2	1	7.25	\N	\N	\N	\N	2025-04-09 12:20:28.791274	\N	\N
1052	039961000026	Anti-Siphon Universal Toilet Tank Fill Valve, Fluid Master 400	\N	9	1	7.99	\N	\N	\N	\N	2025-04-09 12:20:26.194838	\N	\N
1073	885911266321	DeWalt 4-1/2 in. D X 7/8 in. Aluminum Oxide Cutting/Grinding Wheel 1 Pc	\N	2	1	3.25	\N	\N	\N	\N	2025-04-09 12:20:27.868532	\N	\N
1050	000.000.330	Acid Brush	\N	12	1	0.75	\N	\N	\N	\N	2025-04-09 12:20:25.573327	\N	\N
1106	045242082759	Milwaukee Wood / Metal / Plastic Universal Saw Blades 150mm Pack of 5	\N	3	1	8.33	\N	\N	\N	\N	2025-04-09 12:20:31.049837	\N	\N
1082	083771736118	Eazypower Flex-a-Bit 11 in. Flexible Bit Extension 73611 - All	\N	1	1	18.99	\N	\N	\N	\N	2025-04-09 12:20:28.967367	\N	\N
1102	045242082919	Milwaukee Tool Reciprocating Saw Blade,TPI 10/14,Pk5 48-00-5193 - All	\N	2	1	10.26	\N	\N	\N	\N	2025-04-09 12:20:30.70624	\N	\N
1091	673765172017	Irwin Impact Performance Series 3/8 in. Metric Lobular Power Nut Driver 1-7/8 in. L 1 Pc	\N	12	1	4.33	\N	\N	\N	\N	2025-04-09 12:20:29.753084	\N	\N
1044	070798086463	White Silicone 9.8 fl oz	Window Door & Siding, 100% Silicone	7	1	7.89	\N	Stockroom - Shelf T3	\N	\N	2025-04-09 12:20:25.006343	1	307
1037	024721391063	39106 0.38 X 18 in. No. 2 Installer Bit	\N	2	1	14.99	\N	\N	\N	\N	2025-04-09 12:20:24.3379	\N	\N
1111	4HCU6	P6000-C31 O ring	Zurn P6000--C31 O Ring	5	1	1.30	\N	Stockroom - Shelf I2	\N	\N	2025-04-09 12:20:31.491491	1	173
1060	PRBV150	Bluefin PRBV150 1 1/2" ProPress Ball Valve	\N	4	1	31.71	\N	\N	\N	\N	2025-04-09 12:20:26.837145	\N	\N
1068	045325167816	Coarse Brass Wire Cup Brush 1-3/4"	\N	4	1	7.78	\N	\N	\N	\N	2025-04-09 12:20:27.474638	\N	\N
1114	077089305005	Products 398230508 305 19 X 3 in. Wire Brush with Long Curved Handle	\N	2	1	6.95	\N	\N	\N	\N	2025-04-09 12:20:31.756647	\N	\N
1090	671262000284	Hose,Pre-Rinse,3/4-14,SS	\N	4	1	46.99	\N	\N	\N	\N	2025-04-09 12:20:29.660975	\N	\N
1039	045325174593	4-1/2"x 1/4"x 7/8" Masonry Dpr	\N	3	1	2.68	\N	\N	\N	\N	2025-04-09 12:20:24.543319	\N	\N
1088	049793045379	Heavy Duty Door Holder, Drop Down, Chrome Finish	\N	12	1	5.79	\N	\N	\N	\N	2025-04-09 12:20:29.487573	\N	\N
1089	083771884383	Hex Extensions,1/4 in	\N	4	1	7.89	\N	\N	\N	\N	2025-04-09 12:20:29.57424	\N	\N
372	209996	Weiss or ABS Pressure Gauges	\N	3	1	9.18	\N	Stockroom A-384	\N	\N	2025-03-31 17:33:25.217895	\N	\N
1074	028877321608	DeWalt 4-1/2 in. D X 7/8 in. Aluminum Oxide Metal Cut-Off Wheel 1 Pc	\N	2	1	4.10	\N	\N	\N	\N	2025-04-09 12:20:27.948595	\N	\N
1027	032886346521	12/3X250 Mc Cable 68583401 per Ft	\N	250	1	1.64	\N	\N	\N	\N	2025-04-09 12:20:23.353036	\N	\N
1029	032628151109	15110 0.75 X 1000 in. Hercules Mega Tape Thread Sealant, Grey	\N	6	1	3.67	\N	\N	\N	\N	2025-04-09 12:20:23.537603	\N	\N
1100	045242222810	Milwaukee Heavy Duty TORCH Demolition Reciprocating Sabre Saw Blades 300mm Pack of 5	\N	2	1	19.99	\N	\N	\N	\N	2025-04-09 12:20:30.532275	\N	\N
1071	662528432109	CutOff Wheel,Blue Fire,6"x.045"x7/8"	\N	3	1	5.99	\N	\N	\N	\N	2025-04-09 12:20:27.711927	\N	\N
1046	000.000.333	Abrasive Cloth	\N	5	1	8.00	\N	\N	\N	\N	2025-04-09 12:20:25.199507	\N	\N
1098	045242136353	Milwaukee 48-42-0120 2-3/4" 18TPI High Speed Steel Jig Saw Blade (5 Pack)	\N	3	1	4.99	\N	\N	\N	\N	2025-04-09 12:20:30.356376	\N	\N
1049	1 4PDJ2	Access valve tee	\N	6	1	4.05	\N	\N	\N	\N	2025-04-09 12:20:25.482751	\N	\N
1108	X002OHRMHR	Oatey galv plumbers strap	\N	3	1	5.33	\N	\N	\N	\N	2025-04-09 12:20:31.225184	\N	\N
1031	634052863803	3/4" ProPress Ball Valve	\N	9	1	9.70	\N	\N	\N	\N	2025-04-09 12:20:23.726514	\N	\N
1053	X001BJ3XLX	Aqua Elegante 60" shower hose	\N	4	1	20.00	\N	\N	\N	\N	2025-04-09 12:20:26.274057	\N	\N
1058	028874013445	Black and Decker Flug Cuttin Jig Saw Blade / 7 TPI / 3”	\N	2	1	6.43	\N	\N	\N	\N	2025-04-09 12:20:26.675721	\N	\N
1038	000.000.319	4" Fernco	\N	6	1	12.00	\N	\N	\N	\N	2025-04-09 12:20:24.453159	\N	\N
1048	000.000.337	Abrasive Mesh	\N	3	1	10.00	\N	\N	\N	\N	2025-04-09 12:20:25.390615	\N	\N
1105	045242313617	Milwaukee Tool Retractable Starter Bit with Large Arbor 49-56-7135 - All	\N	1	1	14.99	\N	\N	\N	\N	2025-04-09 12:20:30.964067	\N	\N
1047	000.000.336	Abrasive Cloth	\N	3	1	16.00	\N	\N	\N	\N	2025-04-09 12:20:25.297654	\N	\N
1070	051115665417	Cubitron Ii Cut-Off Wheel, 6 in Dia, 0.045 in Thick, 36 Grit, 10200 RPM - All	\N	2	1	8.59	\N	\N	\N	\N	2025-04-09 12:20:27.633463	\N	\N
1057	024721901026	Bit Holder,1/4",1/4",2"	\N	6	1	7.52	\N	\N	\N	\N	2025-04-09 12:20:26.593808	\N	\N
1109	X0049APIM3	Oatey plastic hanger strap	\N	4	1	7.03	\N	\N	\N	\N	2025-04-09 12:20:31.313775	\N	\N
1099	045242180950	Milwaukee 5 Pc. U-Shank Jig Saw Blade Assortment - 49-22-1168	\N	2	1	9.69	\N	\N	\N	\N	2025-04-09 12:20:30.444152	\N	\N
1055	W86863	Bearing Assembly W86863	\N	2	1	600.00	\N	\N	\N	\N	2025-04-09 12:20:26.437009	\N	\N
43	100152A	Tub Seal Trim Tape & Shower Door Bottom Seal	\N	39	1	3.50	\N	Stockroom A-54	\N	\N	2025-03-31 17:32:56.718621	\N	\N
1120	099461766730	TR120 Non Contact Voltage Detector	Superior Electric  / Tester with LED Flashlight 120V	1	1	10.79	\N		\N	\N	2025-04-09 12:20:32.28232	\N	\N
1145	4059625348239	Vernis shower head	Vernis Blend 2-Spray Patterns 1.5 GPM 3.93 in.  Handheld Shower Head in Chrome	4	1	20.35	\N		\N	\N	2025-04-09 12:20:34.78617	\N	\N
1117	039725020758	SKIL 94905 5-Piece High-Carbon Steel All-Purpose U-Shank Jigsaw Blade Set	\N	4	1	3.73	\N	\N	\N	\N	2025-04-09 12:20:32.023027	\N	\N
1118	X0020DPWE5	Self locking toilet seat screw	\N	8	1	5.39	\N	\N	\N	\N	2025-04-09 12:20:32.10987	\N	\N
1119	717510010305	Shower Arm,Chrome Plated,6"	\N	4	1	7.19	\N	\N	\N	\N	2025-04-09 12:20:32.196283	\N	\N
1123	081838985011	T-Handle Tap Wrench,0-1/4 in.,0.0-6.0 Mm	\N	7	1	7.89	\N	\N	\N	\N	2025-04-09 12:20:32.548003	\N	\N
1144	045325300183	Vermont American 30018 U Shank 3-1/8-Inch 12TPI High Carbon Steel Jigsaw Blade, 2-Pack	\N	2	1	10.62	\N	\N	\N	\N	2025-04-09 12:20:34.705889	\N	\N
1115	095691332004	Replacement Cutting Wheel	\N	4	1	15.78	\N	\N	\N	\N	2025-04-09 12:20:31.842916	\N	\N
1143	026427027307	United States Flag, Outdoor, Tough-Tex, 5 Ft H, 8 Ft W, Polyester, 30 Ft Min. Flagpole Height	\N	2	1	39.99	\N	\N	\N	\N	2025-04-09 12:20:34.625239	\N	\N
1122	046135417269	Sylvania LED9PBG24D0841AB1Y 26 WATT 4100K		32	1	18.00	\N	Stockroom - Shelf G2	\N	\N	2025-04-09 12:20:32.460871	1	267
1078	034449620154	Delta Classic:2522LF Two Handle Centerset Bathroom Faucet	\N	2	1	100.00	\N	\N	\N	\N	2025-04-09 12:20:28.266502	1	272
837	400029	8 1/2 x 11 paper		125	10	3.80	\N	Stockroom - Shelf B1	\N	\N	2025-03-31 17:34:05.641481	1	165
\.


--
-- Data for Name: parts_delivery; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.parts_delivery (id, part_id, quantity, staff_member_id, cost_center_id, delivered_at, delivered_by_id, notes, project_code, building_id, unit_cost, signature, status, confirmed_at) FROM stdin;
67	1133	1	590	22	2025-05-27 16:00:00	1		\N	\N	\N	data:image/png;base64,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	delivered	2025-05-27 19:29:19.571
39	837	10	124	180	2025-05-20 16:00:00	1		\N	12	3.80	\N	delivered	2025-05-27 19:56:06.632
30	837	50	528	169	2025-05-15 16:00:00	1		\N	47	3.80	\N	delivered	2025-05-16 17:34:00.134
31	837	20	528	202	2025-05-15 16:00:00	1		\N	47	3.80	\N	delivered	2025-05-16 17:34:09.167
36	837	40	61	172	2025-05-13 16:00:00	1		\N	11	3.80	\N	delivered	2025-05-16 17:34:12.113
35	1131	1	281	176	2025-05-06 16:00:00	1		\N	22	\N	\N	delivered	2025-05-16 17:34:24.817
33	1129	1	281	176	2025-05-06 16:00:00	1		\N	22	\N	\N	delivered	2025-05-16 17:34:28.328
34	1130	1	281	176	2025-05-06 16:00:00	1		\N	22	\N	\N	delivered	2025-05-16 17:34:30.806
38	230	32	334	203	2025-05-16 16:00:00	1		\N	46	0.60	\N	delivered	2025-05-16 17:43:12.275
64	1183	4	558	\N	2025-05-27 15:41:00	1	Complete toner cartridge set: TN328C Cyan, TN328AK Black, TN328M Magenta, TN328Y Yellow	\N	\N	\N	\N	delivered	2025-05-28 15:25:43.376
12	837	20	370	170	2025-03-27 16:00:00	1		\N	3	4.32	\N	pending	\N
11	837	100	528	169	2025-04-02 16:00:00	1		\N	47	4.32	\N	pending	\N
40	837	10	371	204	2025-05-21 16:00:00	1		\N	52	3.80	data:image/png;base64,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	delivered	2025-05-21 19:39:03.56
5	837	20	370	164	2025-04-16 16:00:00	1		\N	26	4.32	\N	pending	\N
6	837	80	489	165	2025-04-16 16:00:00	1		\N	34	4.32	\N	pending	\N
7	1133	1	489	165	2025-04-16 16:00:00	1		\N	34	\N	\N	pending	\N
8	837	30	195	166	2025-04-16 16:00:00	1		\N	18	4.32	\N	pending	\N
9	837	30	195	167	2025-04-16 16:00:00	1		\N	18	4.32	\N	pending	\N
10	837	30	195	168	2025-04-16 16:00:00	1		\N	18	4.32	\N	pending	\N
16	837	20	297	174	2025-03-31 16:00:00	1		\N	22	4.32	\N	pending	\N
17	837	10	95	175	2025-04-14 16:00:00	1		\N	12	4.32	\N	pending	\N
18	839	1	95	175	2025-04-14 16:00:00	1		\N	12	18.47	\N	pending	\N
20	1133	1	430	171	2025-04-21 16:00:00	1		\N	39	\N	\N	pending	\N
21	839	1	430	171	2025-04-21 16:00:00	1		\N	39	18.47	\N	pending	\N
19	837	30	430	177	2025-04-21 16:00:00	1		\N	39	4.32	\N	pending	\N
3	230	108	372	88	2025-04-07 16:00:00	1		\N	27	0.53	\N	pending	\N
13	230	48	387	171	2025-03-27 16:00:00	1		\N	28	0.53	\N	pending	\N
15	230	72	61	172	2025-03-27 16:00:00	1		\N	11	0.53	\N	pending	\N
4	231	144	372	88	2025-04-07 16:00:00	1		\N	27	0.56	\N	pending	\N
14	231	24	387	171	2025-03-27 16:00:00	1		\N	28	0.56	\N	pending	\N
22	837	60	61	172	2025-05-13 16:00:00	1		\N	11	3.80	\N	delivered	2025-05-15 14:36:44.498
23	837	80	162	178	2025-05-09 16:00:00	1		\N	16	3.80	\N	delivered	2025-05-15 14:36:49.522
24	837	10	576	179	2025-05-07 16:00:00	1		\N	51	3.80	\N	delivered	2025-05-15 14:37:00.337
25	837	10	140	180	2025-05-07 16:00:00	1		\N	12	3.80	\N	delivered	2025-05-15 14:37:07.435
27	837	20	576	179	2025-05-06 16:00:00	1		\N	3	3.80	\N	delivered	2025-05-15 14:37:11.505
28	837	30	528	181	2025-05-15 16:00:00	1		\N	47	3.80	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYwAAACWCAYAAADNA78DAAAAAXNSR0IArs4c6QAADJBJREFUeF7t3c/LVNUfB/BjllqZ2W8SNVIoBJFoJQhF0cKNoQsX6UJcum+n4B/QP9FChCKwVQhCSATRIje5KIigFtFPS0tNTZ8vn/l2Y3yeGefMmV935rwGhgd9zpm553U+c99z7p07z6qlpaWl5EaAAAECBAYIrBIYaoQAAQIEcgQERo6SNgQIECCQBIYiIECAAIEsAYGRxaQRAQIECAgMNUCAAAECWQICI4tJIwIECBAQGGqAAAECBLIEBEYWk0YECBAgIDDUAAECBAhkCQiMLCaNCBAgQEBgqAECBAgQyBIQGFlMGhEgQICAwFADBAgQIJAlIDCymDQiQIAAAYGhBggQIEAgS0BgZDFpRIAAAQICQw0QIECAQJaAwMhi0ogAAQIEBIYaIECAAIEsAYGRxaQRAQIECAgMNUCAAAECWQICI4tJIwIECBAQGGqAAAECBLIEBEYWk0YECBAgIDDUAAECBAhkCQiMLCaNCBAgQEBgqAECBAgQyBIQGFlMGhEgQICAwFADBAgQIJAlIDCymDQiQIAAAYGhBggQIEAgS0BgZDFpRIAAAQICQw0QIECAQJaAwMhi0ogAAQIEBIYaIECAAIEsAYGRxaQRAQIECAgMNUCAAAECWQICI4tJIwIECBAQGGqAAAECBLIEBEYWk0YECBAgIDDUAAECBAhkCQiMLCaNCBAgQEBgqAECBAgQyBIQGFlMGhEgQICAwFADBAgQIJAlIDCymDQiQIAAAYGhBggQIEAgS0BgZDFpRIAAAQICQw0QIECAQJaAwMhi0ogAAQIEBIYaIECAAIEsAYGRxaQRAQIECAgMNUCAAAECWQICI4tJIwIECBAQGD1q4OzZs53/3bt3rwohQIAAgX8FBMayUvjwww/TgQMHOv975syZtH//fsVCgAABAiklgdFVBrdu3Upr1qy5qzCWlpYUCgECBAgIjLtrYNWqVSuKQmB4nRAgQOD/AlYYzbG5HmERv2pjYDjH4uVLgMAsBATGnAWGcyyzeJl4TgIErDAGhEUbVxjLD5u1cQXkpUWAwGIKVL/C6HXeonuq27RDdo5lMV+ERkVgXgQERp9zF80EtiUw+gVbW7ZvXgredhIgUC5QdWAMWl204ZDUoG0UGOXFrycBAsMJVBsY/Q7vtOkcwaCwaEOgDVduWhMgMM8CVQbGvc4FtCUwcsJCYMzzS8+2E5g/geoCY9CJ4zYExr3OV7Rh++avzG0xAQLjEKgqMAaFRYDOcod8r1VFc65ilts3joLzGAQIzK9ANYEhLOa3SG05AQLtEKgiMHLCYpari9yPzFpdtONFYysI1Cqw8IGRGxazCozcsJjV9tX6wjBuAgRWCix0YAwTFtPeIeecr1g+XVYYXsIECMxSYCED4/bt2+n+++9f4Xqvi9ymuTMWFrMsec9NgECpwMIFxjCHeLrRphEYJUHRbGPp9o3ynKVFpR8BAospsDCB8c8//6QHHnig5yzlfH1G6Q45tyxG3XEPs30u+sudFe0IEBhGYCEC486dO2n16tXFYTHJ8xejBkXuCiM3JJYjLQ/TOJQXh/T63XLCd5gC1JYAgfkRWIjAKD0MlbszLp3OcYVFv0ArDYnS8UQ/gTGKnr4E5ltg7gOj104z3iHfd9992TMzzOGenAcdZ1D0C7Wc7Wja9LtKfJjH6G4rNErl9CMw3wJzHRjDfmy231SNMzAmERa9VhiDym6YT4QNeqxevxcaJWr6EJhvgYUKjNKd2DgCY+PGjeny5cs9q+GJJ55Iv/7660iVMujw0zBjP3jwYPrggw96bk98cODmzZv//e7atWvp4Ycf7tl2mOccafA6EyDQCoG5DYxxrS56vXsfdkc4qVVFd4WMep5m1Gqb9fOPuv36EyAwusDcBcb333+fnnvuuRUjH3Yn3zzAs88+m3788ce7Hm+Yx5pGWCwPta1bt6bvvvtu9NkveIRxBnXB0+tCgMAMBeYqMCbxLrf0cNS0gmKGtdH3qYVGG2fFNhGYvMDcBMYkwqLkcFQc+49zAP1uw6xOJj+9k3uGSYfGO++8k06cOHHX+ZR+ozl8+HA6derU5AbrkQkQ6AjMRWD0C4u4YG/QyeBB8zzMCqPmVUUvx3F57NixI33zzTcprtYf9XbkyJH07rvvjvow+hMg0EOg9YExqZVFr9XFM888s+J8RmM2rp3jolXhqIE9KY+HHnooXb16dVIP73EJVCnQ2sDo942zMUvjOuyTs7oQFINfF20NjdjyuIDzzTffTGfOnBk8EC0IELinQCsDY1o76XsFxqCd4LhCa1Hqc5DXMOOMa0FOnjyZjh8/ntVt9+7d6fPPPx/YNsLj9ddfT+fOnRvYVgMCBFYKtCowLl26lOIit363ce+kewXGoB3fuLdhEYtykGEz5tiBv/TSS+mLL74YG0NcZBgXGw66xTa+8sor6fz584Oa+j0BAv8KtCow+u1o/vrrr75XG48yk7k7tnEeBhtle/XNF3jrrbfSe++9l334cs+ePenTTz/NfwItCVQo0IrAiHft/b4scJLv6HMCY5LPX2G9zWTIb7zxRvr444+zwiPqMA5ZxaErNwIE7haYeWD022n/+eefaf369ROdr2mdK5noIDz4UAKvvvpq+uSTTwb2ib+v8vLLL6ejR4+mY8eODWyvAYEaBGYaGJP8yGzO5E364rOcbdBmdgL79u1LH330UYrreXJucTI+zrG99tpr6fTp0zldtCGwUAKtC4zr16+ndevWTQW5OzDiM/vx2X23OgWGDY9GKWro+eefT7t27VoBFyfg49qeTZs2pW3btqXt27f3bFenuFHPo8BMA+PLL7/87wUUn5B67LHHpmoYL/Y47BWHv9wIhMDXX3/d+eTW33//PVWQ5s1LnEOJexwSiz+XG6ETq5p4ExVvaOLfUbMbNmzovF7ia/Uff/zx9OSTT6annnoqPf3002nnzp1T3XZPVo/ATAOjHmYjnVeB+MqSt99+O3322Wcp3tSM4+tLZmURoRT3JpDiZ4RS3ONwW9wjmJp7E1CPPPJIinsTUBFgEVARTnGPFdSjjz46q2F53ikKCIwpYnuqxRF4//33U3xB4ldffZVu3brV2RHHtxPE+ZDmnEjtn7DrDqgmpJqVU4TTmjVrOqunCJwmpNauXZsefPDBzj0Cq3tlFaur7lVWhFj8X/yM4HKbvIDAmLyxZyBwl8CFCxfSt99+2/mbJj/88EP66aefOquXP/74I125cqVz4WGcy7tx40ZnNRD3CKVY3UQodQdThFLtwdSrvJqVVPyMkOoOrCa0uldWzQorAiuCbMuWLenFF18sqtz45oG9e/cW9W17J4HR9hmyfQQKBOLPBUcY/fzzz517/Ing3377Lf3++++dYIrzdnGPD3tEQMU5myakIpyagIqQihVTE1ICKm8y4rvL9u/fn9d4jloJjDmaLJtKoM0CFy9e7ITTL7/80gmoWDVFSMWqKe7xjQ3LAyoOOcVJ/FhNNUG1PLCaVVUTWvEzgiuCrK2rq/jYdXzbwKLdBMaizajxEKhYIAKrWTnFz+6QasKqOeTX/IzVVff95s2bnY9Dv/DCC0WSmzdvTocOHVrIj+kLjKKS0IkAAQL1CQiM+ubciAkQIFAkIDCK2HQiQIBAfQICo745N2ICBAgUCQiMIjadCBAgUJ+AwKhvzo2YAAECRQICo4hNJwIECNQnIDDqm3MjJkCAQJGAwChi04kAAQL1CQiM+ubciAkQIFAkIDCK2HQiQIBAfQICo745N2ICBAgUCQiMIjadCBAgUJ+AwKhvzo2YAAECRQICo4hNJwIECNQnIDDqm3MjJkCAQJGAwChi04kAAQL1CQiM+ubciAkQIFAkIDCK2HQiQIBAfQICo745N2ICBAgUCQiMIjadCBAgUJ+AwKhvzo2YAAECRQICo4hNJwIECNQnIDDqm3MjJkCAQJGAwChi04kAAQL1CQiM+ubciAkQIFAkIDCK2HQiQIBAfQICo745N2ICBAgUCQiMIjadCBAgUJ+AwKhvzo2YAAECRQICo4hNJwIECNQnIDDqm3MjJkCAQJGAwChi04kAAQL1CQiM+ubciAkQIFAkIDCK2HQiQIBAfQICo745N2ICBAgUCQiMIjadCBAgUJ+AwKhvzo2YAAECRQICo4hNJwIECNQnIDDqm3MjJkCAQJGAwChi04kAAQL1CQiM+ubciAkQIFAkIDCK2HQiQIBAfQICo745N2ICBAgUCQiMIjadCBAgUJ+AwKhvzo2YAAECRQICo4hNJwIECNQnIDDqm3MjJkCAQJHA/wC6sKeKuSmhbwAAAABJRU5ErkJggg==	delivered	2025-05-16 17:33:47.162
72	837	30	576	179	2025-05-28 16:00:00	1	#125 ATTN Shawn Stevens [Batch: BATCH_1748453430700_576]	\N	15	3.80	\N	delivered	2025-05-29 19:11:04.628
73	837	30	576	179	2025-05-28 16:00:00	1	Dukes #100 Savien Merkel [Batch: BATCH_1748458895125_576]	\N	12	3.80	data:image/png;base64,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	delivered	2025-05-29 19:26:33.047
74	837	10	576	179	2025-05-29 16:00:00	1	[Batch: BATCH_1748540109549_576]	\N	51	3.80	data:image/png;base64,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	delivered	2025-05-29 19:30:43.34
76	1190	15	387	\N	2025-05-29 16:00:00	1	[Batch: BATCH_1748542866237_387]	\N	28	0.00	\N	delivered	2025-05-29 19:42:33.352
75	837	20	576	179	2025-05-29 16:00:00	1	#201 [Batch: BATCH_1748540147200_576]	\N	3	3.80	\N	delivered	2025-05-29 19:49:02.095
77	837	10	576	179	2025-05-29 16:00:00	1	[Batch: BATCH_1749491085605_576]	\N	51	3.80	\N	delivered	2025-06-09 17:45:13.394
78	1190	15	387	\N	2025-05-29 16:00:00	46	[Batch: BATCH_1749491584674_387]	\N	28	0.00	\N	delivered	2025-06-09 17:53:21.459
86	837	30	413	205	2025-03-20 16:00:00	46	[Batch: BATCH_1749493101173_413]	\N	28	3.80	\N	pending	\N
87	837	30	430	\N	2025-04-21 16:00:00	46	[Batch: BATCH_1749493385074_430]	\N	\N	3.80	\N	pending	\N
88	1184	1	430	\N	2025-04-21 16:00:00	46	[Batch: BATCH_1749493385074_430]	\N	\N	0.00	\N	pending	\N
89	839	1	430	\N	2025-04-21 16:00:00	46	[Batch: BATCH_1749493385074_430]	\N	\N	21.21	\N	pending	\N
103	837	30	430	206	2025-05-16 16:00:00	46	[Batch: BATCH_1749647464708_430]	\N	39	3.80	\N	delivered	2025-06-11 14:13:17.763
99	1139	1	413	205	2025-05-27 16:00:00	46	[Batch: BATCH_1749495516769_413]	\N	28	\N	\N	delivered	2025-06-11 14:12:32.543
93	1184	1	558	\N	2025-05-27 16:00:00	46	[Batch: BATCH_1749494548353_558]	\N	\N	0.00	\N	delivered	2025-06-11 14:12:43.905
94	1186	1	558	\N	2025-05-27 16:00:00	46	[Batch: BATCH_1749494548353_558]	\N	\N	75.00	\N	delivered	2025-06-11 14:13:01.003
80	837	30	95	179	2025-05-29 16:00:00	46	[Batch: BATCH_1749492068019_95]	\N	12	3.80	\N	delivered	2025-06-11 14:11:30.472
79	837	30	430	179	2025-05-29 16:00:00	46	[Batch: BATCH_1749491716854_430]	\N	15	3.80	\N	delivered	2025-06-11 14:11:48.926
84	837	20	576	179	2025-05-29 16:00:00	46	[Batch: BATCH_1749492461426_576]	\N	3	3.80	\N	delivered	2025-06-11 14:11:53.426
91	1185	1	558	\N	2025-05-27 16:00:00	46	[Batch: BATCH_1749494548353_558]	\N	\N	0.00	\N	delivered	2025-06-11 14:11:59.574
96	839	2	413	205	2025-05-27 16:00:00	46	[Batch: BATCH_1749495516769_413]	\N	28	21.21	\N	delivered	2025-06-11 14:12:15.35
97	837	30	413	205	2025-05-27 16:00:00	46	[Batch: BATCH_1749495516769_413]	\N	28	3.80	\N	delivered	2025-06-11 14:12:07.502
92	1183	1	558	\N	2025-05-27 16:00:00	46	[Batch: BATCH_1749494548353_558]	\N	\N	0.00	\N	delivered	2025-06-11 14:12:19.893
98	1146	1	413	205	2025-05-27 16:00:00	46	[Batch: BATCH_1749495516769_413]	\N	28	\N	\N	delivered	2025-06-11 14:12:24.021
101	837	10	51	208	2025-05-27 16:00:00	46	[Batch: BATCH_1749495883461_51]	\N	40	3.80	\N	delivered	2025-06-11 14:12:36.262
95	837	10	124	207	2025-05-20 16:00:00	46	[Batch: BATCH_1749495047706_124]	\N	12	3.80	\N	delivered	2025-06-11 14:13:12.618
105	837	40	61	172	2025-05-13 16:00:00	46	[Batch: BATCH_1749647897758_61]	\N	11	3.80	\N	delivered	2025-06-11 14:13:21.666
106	837	20	61	172	2025-05-13 16:00:00	46	Deans suite [Batch: BATCH_1749648006391_61]	\N	11	3.80	\N	delivered	2025-06-11 14:13:25.755
108	837	80	162	178	2025-05-09 16:00:00	46	[Batch: BATCH_1749650730977_162]	\N	16	3.80	\N	delivered	2025-06-11 14:13:29.546
109	837	10	576	179	2025-05-07 16:00:00	46	[Batch: BATCH_1749650810448_576]	\N	51	3.80	\N	delivered	2025-06-11 14:13:34.073
110	837	10	140	180	2025-05-07 16:00:00	46	[Batch: BATCH_1749650883123_140]	\N	12	3.80	\N	delivered	2025-06-11 14:13:38.011
112	837	20	576	179	2025-05-06 16:00:00	46	[Batch: BATCH_1749651352598_576]	\N	3	3.80	\N	pending	\N
113	837	30	528	181	2025-05-15 16:00:00	46	[Batch: BATCH_1749652667543_528]	\N	47	3.80	\N	pending	\N
114	837	50	528	169	2025-05-15 16:00:00	46	[Batch: BATCH_1749652759993_528]	\N	47	3.80	\N	pending	\N
115	837	20	528	202	2025-05-15 16:00:00	46	[Batch: BATCH_1749652867441_528]	\N	47	3.80	\N	pending	\N
116	837	20	528	202	2025-05-15 16:00:00	46	[Batch: BATCH_1749652868332_528]	\N	47	3.80	\N	pending	\N
117	1186	1	7	\N	2025-05-06 16:00:00	46	[Batch: BATCH_1749652957694_7]	\N	6	75.00	\N	pending	\N
111	1169	3	195	\N	2025-05-07 16:00:00	46	[Batch: BATCH_1749651025430_195]	\N	18	0.00	\N	pending	\N
118	1203	1	281	\N	2025-05-06 16:00:00	46	[Batch: BATCH_1749653531634_281]	\N	22	0.00	\N	pending	\N
119	1129	1	281	\N	2025-05-06 16:00:00	46	[Batch: BATCH_1749653531634_281]	\N	22	\N	\N	pending	\N
120	1131	1	281	\N	2025-05-06 16:00:00	46	[Batch: BATCH_1749653531634_281]	\N	22	\N	\N	pending	\N
121	837	20	186	210	2025-04-29 16:00:00	46	[Batch: BATCH_1749653733709_186]	\N	18	3.80	\N	pending	\N
173	837	10	124	207	2025-08-19 16:00:00	1	207 [Batch: BATCH_1755609908361_124]	\N	12	3.80	data:image/png;base64,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	delivered	2025-08-19 13:40:01.727
134	837	40	587	213	2025-07-08 16:00:00	46	[Batch: BATCH_1751981772931_587]	\N	5	3.80	\N	delivered	2025-07-08 13:36:19.482
135	837	40	584	214	2025-07-08 16:00:00	46	[Batch: BATCH_1751981859799_584]	\N	22	3.80	data:image/png;base64,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	delivered	2025-07-08 13:45:31.47
129	837	20	585	157	2025-07-01 16:00:00	1	[Batch: BATCH_1751380899302_585]	\N	48	3.80	data:image/png;base64,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	delivered	2025-07-01 15:06:51.604
126	837	10	186	210	2025-06-30 00:00:00	46	[Batch: BATCH_1751287139546_186]	\N	18	3.80	\N	delivered	2025-06-30 12:50:32.034
127	837	20	584	176	2025-06-30 00:00:00	46	[Batch: BATCH_1751310519436_584]	\N	22	3.80	data:image/png;base64,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	delivered	2025-06-30 19:18:32.164
124	1186	1	307	176	2025-06-26 00:00:00	46	[Batch: BATCH_1750940814134_307]	\N	\N	75.00	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACWCAYAAABkW7XSAAAAAXNSR0IArs4c6QAAEG1JREFUeF7tXUnsb8sQrufdx5sMT4gxCIklC5FISBB7IbGwJEEiJAjeSsLLW1ggLEwhMazYkdhKkLAQOzY2xiDEPD7z8yv39P33Pfec01NVV3Wf75/c3Nz776H6q6rvVNXp7nMb4QcIAAEgMAgCtw0iJ8QEAkAACBAIC0YABIDAMAiAsIZRFQQFAkAAhAUbAAJAYBgEQFjDqAqCAgEgAMKCDQABIDAMAiCsYVQFQYEAEABhwQaAABAYBgEQ1jCqgqBAAAiAsGADQAAIDIMACGsYVUFQIAAEQFiwASAABIZBAIQ1jKogKBAAAiAs2AAQAALDIADCGkZVEBQIAAEQFmwACACBYRAAYQ2jKggqjMB/l/EeITwuhlNEAISlCC6Gdo3AQ0R05yIh/MC1qq6Eg6IGURTEVEEApKUCq96gICw9bDHyGAiAtMbQ0/+lBGENpCyIqoYASEsNWtmBQViyeGK0cREAaQ2gOxDWAEqCiN0QAGl1g7puIhBWHW7oNS8CIC3HugVhOVYORDNDAKRlBv3xxCAsp4qBWOYIgLTMVXCrACAsh0qBSG4QAGm5UcV1QUBYzhQCcdwhcHbS+veikWseNAPC8qAFyOAdgTOT1sOLclxwhQshvFsr5AMCRHRW0uII63Yv2RgIC74IBPIROCtpcZTFf8xvtgBh5RsrWgIBRuBvRHSXFwfupBI3aSEIq5PGMc1UCPBdWuw7Z/EfN2nhWQCfyluwGBcIuIk6OqHhIi0EYd2s7fDkxJaPTl4w8DRnSw1dEDQI68pjgkL474AL8BmYUTqIHkiLi/F3d5jPcgoXaSEc8roJrJ8eLpRjaZ2YOxuBM9WzzNNCENatZBUs1Vw52S6DhtYIuEiXOoBgTs5nJ6wjQwNhdfCASaY4Sz3LPPM4M2GlnoogrEnYpNMyzlLPimu8naC9muaMhBWeEqk3gSCs7uY4/ISph+DwC1zqvWa73s9GWPGbwNQxAxDWDO7Vfw2zk5apX5yFsOKo6j9ElHNVBismt21/t8CMXhGYvZ4FwlK2vNrNoKa5ujImGF4XgWBzM+7PMo0gZ46w4qiqNOc2f32r608YvQMCpo6tuD5T35iVsGqjqqBnU6UoGhuG7ofArKmhqW/MSFglhfU985316djPXTETI2Dq3EoqMN2LNRNh5W5XyNEjCu45KKFNCoG/LmcMS0sSqXGtf29W352FsCTJio3BTCHWloj5xRGYMcoye6DPQFjBIKSeYjMamLgXYsBsBEKUxTWte7J7+W5otrVhZMKq2VuVYwZmysgRDm2GRGC2mqiZj4xKWMEA2Hql12AW7g7pihA6B4EQZUnbas7cGm3MCHg0ALWiqlipqF9pmDjGNItKFKA3K5uMQlgtm0BL9GWmiBIh0XZIBGayLbOtDZ4JKyapYKHa8s70FBzSqycXeib7MlmLNgHk2h+TE//wF2a3fnocQp7pCZiLO9r1RWAmG3NPWFsRz1rdEsU4qe0JpaZoooBSIdF+aARm2kgq4evFyiyJsJiw4jukSvruEVv4/9TdVMULq+iAYnsFaOhSjMAsUZbJOlpIp1hTjjuYPC0c4wHR9BD4y7KB1CqTkFqZSeEdhHVdfdh7JWXGGCcHAZPoJEewwjbdsxIQ1pwn6gvtDs0NEBg9qjch3bMTVghrRw/PDfwNUzYiMHpqCMJqNICa7qM/5WrWjD5+EDBxeqHlm7xVP3OEBbISstyDYQLG7Jh7e+z0pfA7w8hRFgiro12FJ1uPDakdl+VqqviAOgt25ofjkWL+RESPHhAfkxdVZzUik6eDKzrRFSbcZ872NXLao4vS1eijRftmOj0jYY1mHL2cRnKe+IFgZtySC1IeK0RZo7z86f3AD/icLkyH8yh73jJ8vD8HmOdhPhJOvdLB+OtXjOLDZ4qwsIUhz3FaW3FdkI9aBdsayRFb197Sf5QoS1ufN6KpCMwbPHUWwgJZtbhSWd9/EdG1iLB6pw9l0vpqrU0GEqvV0OcWSf2ZiB6zFvgshKUBsoTyZxwDhNWmVc+2Kk2oa6JK1vDOQFgjFNnZEDzcWNHmatd7bxHWH4nocRKDn2AMaVKQhEyCTA9TvpSwsxOWd7KS/p5iSt89fv8LInrKKiWc3c6kcZUgBmmZWok0bJINcm2mfCmhZzakkciK9TSLLr5ARK9d1tNq5Cn7nfX3Hm23lkRFNxDP4iRrw/Wo8FjG+OOvrINk7j6YZ4ZtDSCsOsV5w61UnnU0JWbfMxJWLll9f7Gl5yx/81m3cLc8/+55dbaW7BXki+WcTQ+8toeI6K4JyTipYIEGvyOi+xxF3bk+tSYqvhL6XgE8bgwxo6Os06sfENEzhQ7f/oOI7qxUwNY3FXMNoXJKs26M+bOX2atqFWaS+5m4NgXTWEG8EXhrfNG072gBMxHWGrS9dZcceP7uMshziehRqwFLyGuvuO7JKCUN/VNE9MZlwJlsTBKj1FilaVhqvNrf7z1U1dK+mQnrJ0T0jJ0FlhBTiTK/Q0QvWIXrR04Zp4DrrQuzEhbjOWv0WGIrLW29pIWsR96q8shlMepp32yEtUdSFk/ybxLRiyOAYxlytizM6tTxGTALvbQQhae+1g+0OMrrlvbNQFhbJBXn1dZOEYgrXFR3FFXF+jD58kgHjwyOxnr5IRGFFxsdpp5qCuu0cE1SYm/7arVk7ehHcm+RVCkh1OJS0++rRPSKnWjraLzZoqzYyf5ARI919LarRq+WfazTwtwHbzeMvBFWOOkfA/DT5S0f/5/XVGP9VewSXGc7mL1OY/jfOJpT79KWaaG7I2MljlUP+XHPrbd7a7nC+bRQzPV07m5NorweJqE7CgCb5crmrRTmg0T0TkRZBdZwc1NLwqoWWqujFWH9nIieulrUniwjRFVxbv/PhaxKsZ2BtPaci9fGP54eNFo+JT3ubCWDJnxKnappssvenDVR8UHZp+0MGhzfW1SVSv/+vuzZqsE2GKfWloxW/R31j+9xX7cLUdaHiOhdmkJMOLZ14d0VpDVOVbOAXxLRk6KOqXnjNDHVtkaemj4pogpjsux8LOXumkmi/UujkVYqEuACPF/IhiirzDB+TURPQEp9HTRtMpiBqNb3Sh9hJhVJxIejR3FwJiyOLvn84NZPwOZ7iuc0y6hgnNaoYy260iSs3CiJj7iEXbQsFqeC62MwvU1rHU3lkrvkG7GRSCs3bfktET2eiPhBxndm4ScPARCWImHFEcmviOjJOzoZgahK0rJUSpRnmje3GqUQX7L291wOoj9IRCVnMWuwm6kPCEuBsOL072hHrDeiqo2mYococdhSRxqBtOJTBznrC6TVUuvLmWeWNiAsQcLKrVOFt2fBiCxTvy2Sqjl28GYi+tiyIM1akyYhtjp1rWxMWvcvn2n/MhG9ulWQifuDsIQIK6dOZU1UW+QU23ZtHS+QFV+qr/2BBa+74UO03JLefYmIXoXd8Id0C8JqJKycOlXJ2zXJh+MRQdVEUVuyfZSI3kJEfF/W8yWFPxgrt7DdIk4pMdZGV2sZmfzfv5w75MI8v8bHzxUCjPPRnsXTYFUaXaTqVFyTWN/IWTpHDfh7JKUxdyArTgXfWiNsQx+tJ21NiixFVjEcTFwfJyI++P6sBpxm6wrCqoiwjo7IrInqaD+OpDHFKWkYV4Okwthvv0QBH17qVr3JimWQvo5mbzNsKpoLv9eoQ77mcg8479nia62/TUQvkjSYQccqfakx6DLTYuc6dyCG31yc9YnLsOEohkQ9KC3pVQuJt3ol88Vk9QEievelZvWRmgGE+khFWUf1xxjjdRodjkxJpdd7sLzkQlqfjSKtb122yHySiL4ohOMow6QeHqOsQ0TOFGGFYwE8WWi7Jiptw40ji97k6I2sWJ5WAy45TL6uQwY8eug8zMXE9ToieulSbnj65d8/jv5840JqnxPxBp+DSD2gfK6uUKoUYYWnMH+u557V2Km+haJsNl+nfCUbOSXm5zE4DfQQWYX1lBbGYxwCniWEEz59xts2WOclfaV0EI8Talv8d/jzPo2JnIzJeMd3wjkRy0aMI9LZqg9xdLUmLmnJ1ymfpYN4I6uAdWmUlXO/vLQeMV47AqV6bp/R+Qh7hMVXs4a9RZobImN4rLZB7KmIP7fOn11/h3HNaku+kuJ7SQro3FxPJx4IyyCty7WykHpcy+2g2O5ll5rJ14jo5UT0dcV5WobOqW3UpIAtMqHvFQJsQ622w/qzKIO41WOPOpTbxe8IxnWRHzknKxb9aB8UUkB7q2vdioDoakOHIKxbQeHI6gGBp6O2y+wZNFJAbeTT44e3mq9PN91twYRX+m2AhunG6ArCGkNPW1JuERZSQB/65Ife5xu2W9R+F8DH6hWlAGEpgqs89LrwrnFURnkJ0w7fmg5y//jz8NMCVbowEFYpYr7ah8J70CP0aa+f1nQQtasDHcLA7Q28RYKj4zUt46JvPQKt6SDrtOW6nnrJB+gJwhpASTsiol7lU3ct6SCiq4ROQVg+jT4lFSKrFEI2v+fNxp8govsqp2e94tpopISV5uOv23p/VcvT3N/qxpeIj3K9t5Kw8NIkQ/+IsDJActJk67NfICwnylnEaCUsvkKHb6fAzw4CIKwxTGOvXgXC8qW/WsJCdJWpRxBWJlBGzY52raNAa6SUg2k5OuK3hHcUisaE9RUiemVhv9M1B2H5VPnRjZ9BYhCWP92VElbQIY7gZOoShJUJVMdmuWcBc25r6Cg2plrqT3xDw96NI3xX/Rsud9bfe/n69e0LYp++fBHnTUAvDwEQVh5OPVrlRFWxHLh6pIdWyufgIzWsG37whNRwfaccXxnzGRBVObggrHLMNHrU7KtCwV1DE+1j8qfK3rZc3/z7ZbifEdEL24fGCCAsWxuovbcK9StbvWF2IwRAWEbAR1+/YQlK9YD6lZ3eMLMhAqWOYijqVFO3ngNE/Woqc8BichEAYeUiJdOuNgWMZ0c6KKMLjDIgAiCsfkrbOlpTMzvSwRrU0GcKBEBYfdQYUsDWL6CUfN6rz8owCxDoiAAISxdsiRQwlhBnznT1hdGdIwDC0lOQVAoYJETtSk9XGHkQBEBYOoqSSgHX0RWP2+tL3DrIYFQg0IAACKsBvI2u0ilgmAKpoKyeMNqgCICw5BQnnQKCrOR0g5EmQQCEJaPI1o2ge1IgspLRD0aZBAEQVrsitUgFRfZ23WCEyRAAYdUrVKtexRJpkWD9atETCDhAAIRVp4TcS/ZqRgdZ1aCGPqdAAIRVrmat4joiq3JdoMfJEABhlSlcY38VS6CZXpatEK2BgGMEQFj5ytEqgmuml/mrQ0sgMAACIKw8JWmlgVrbIfJWhVZAYDAEQFhphYV0TfJYDFLANO5oAQRuQQCEdWwUGmSFFBCOCAQqEQBhHQMnucWg9DNelSpFNyAwLwIgrH3dShXZQVTz+g9W1hkBENY+4K1XEcdExbMA687GjenmQwBOtK3T2uhqTVIgqvl8BisyRACEtQ1+aXS1JirJN4qG5oGpgYAvBEBYdYS1FUkhmvJl25BmQgRAWMcpYUrliKRSCOH3QEAQARDW8VvCrd/iTnVBA8RQQKAEARBWCVpoCwSAgCkCICxT+DE5EAACJQj8D1iSGcFwYf9dAAAAAElFTkSuQmCC	delivered	2025-06-26 13:15:58.331
125	837	30	291	173	2025-06-26 00:00:00	46	[Batch: BATCH_1750946639791_291]	\N	22	3.80	data:image/png;base64,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	delivered	2025-06-26 14:12:46.081
107	837	20	265	209	2025-06-11 00:00:00	46	[Batch: BATCH_1749649120078_265]	\N	47	3.80	\N	delivered	2025-06-11 13:57:16.096
144	837	20	7	\N	2025-08-06 16:00:00	46	111340 (index) [Batch: BATCH_1754500633134_7]	\N	6	3.80	\N	delivered	2025-08-19 16:34:24.086
136	1186	1	584	178	2025-07-15 16:00:00	46	[Batch: BATCH_1752582820509_584]	\N	16	0.00	\N	pending	\N
137	1185	1	584	178	2025-07-15 16:00:00	46	[Batch: BATCH_1752582820509_584]	\N	16	0.00	\N	pending	\N
140	1092	1	584	178	2025-07-15 16:00:00	46	[Batch: BATCH_1752582820509_584]	\N	16	0.00	\N	pending	\N
168	230	72	387	171	2025-08-12 16:00:00	46	MY118 [Batch: BATCH_1755024023435_387]	\N	28	0.60	\N	delivered	2025-08-19 16:35:27.521
138	1183	1	584	178	2025-07-15 16:00:00	46	[Batch: BATCH_1752582820509_584]	\N	16	0.00	\N	delivered	2025-07-15 13:18:49.432
141	837	10	372	86	2025-07-17 16:00:00	46	[Batch: BATCH_1752756541368_372]	\N	27	3.80	data:image/png;base64,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	delivered	2025-07-17 12:54:32.948
132	1139	2	265	\N	2025-07-07 16:00:00	46	KH 242 [Batch: BATCH_1751899538216_265]	\N	50	0.00	\N	delivered	2025-07-08 11:44:24.121
133	837	30	238	209	2025-07-07 16:00:00	46	[Batch: BATCH_1751899645392_238]	\N	50	3.80	\N	delivered	2025-07-08 11:44:27.877
142	1133	1	123	207	2025-07-18 16:00:00	46	Dukes 207 [Batch: BATCH_1752851855421_123]	\N	12	0.00	data:image/png;base64,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	delivered	2025-07-18 15:30:31.533
167	837	10	172	215	2025-08-12 16:00:00	46	[Batch: BATCH_1755023310402_172]	\N	\N	3.80	\N	delivered	2025-08-19 16:35:33.491
143	837	60	587	15	2025-07-28 16:00:00	46	[Batch: BATCH_1753708796061_587]	\N	5	3.80	\N	delivered	2025-07-28 13:32:39.196
139	1184	1	584	178	2025-07-15 16:00:00	46	[Batch: BATCH_1752582820509_584]	\N	16	0.00	\N	delivered	2025-07-28 13:33:01.696
175	1565	12	188	216	2025-08-19 16:00:00	46	Deans Suite [Batch: BATCH_1755624000221_188]	\N	18	0.81	data:image/png;base64,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	delivered	2025-08-19 17:52:40.394
177	231	12	188	216	2025-08-19 16:00:00	46	Deans Suite	\N	18	0.65	\N	delivered	2025-08-19 17:52:50.104
181	837	20	195	167	2025-08-25 16:00:00	1	4 Boxes to JLK 214, 2 boxes to JLK 221	\N	\N	3.80	\N	delivered	2025-08-26 15:02:07.878
174	1615	4	150	\N	2025-08-19 16:00:00	1	257 [Batch: BATCH_1755621243419_150]	\N	34	0.00	\N	delivered	2025-08-19 17:43:34.761
180	837	20	195	166	2025-08-25 16:00:00	1		\N	\N	3.80	\N	delivered	2025-08-26 15:02:12.02
179	1133	1	16	\N	2025-08-25 16:00:00	1	SCEC RM112 - Affinity Commons	\N	53	0.00	\N	delivered	2025-08-26 15:02:18
182	837	20	195	168	2025-08-25 16:00:00	1		\N	\N	3.80	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACWCAYAAABkW7XSAAAN+0lEQVR4AeydSassSRmGS+3h4tRXRTfiCIKC7hRsd4qzDVdoh58goiC6VVfqVhEV/AuKjQO287CzBd0pKgiOuFHU7taW29rafs89GfdU3ao6p3KIzIjI5xBRkRWZEfHF80W8FZknK+uJG/8kIAEJVEJAwarEUZopAQlsNgqWo0ACEqiGgIJVjavGG2oNEqidgIJVuwe1XwIrIqBgrcjZdlUCtRNQsGr3oPZL4BCBRvMUrEYda7ck0CIBBatFr9onCTRKQMFq1LF2SwItElCwDnnVPAlIoEgCClaRbtEoCUjgEAEF6xAV8yQggSIJKFhFukWj5iNgSzURULBq8pa2SmDlBBSslQ8Auy+BmggoWDV5S1slsHICIwVr5fTsvgQkMCsBBWtW3DYmAQmMIaBgjaFnWQlIYFYCCtasuKtuTOMlsDgBBWtxF2iABCRwKgEF61RSHicBCSxOQMFa3AUaIIHyCJRqkYJVqme0SwIS2COgYO0hMUMCEiiVgIJVqme0SwIS2COgYO0hGZ9hDRKQQB4CClYertYqAQlkIKBgZYBqlRKQQB4CClYerjXV+r+ajC3OVg2alYCCNSvu4hpDrJ4QVj0e0SCB4gkoWMW7KJuBSayyNWDFEpiagII1NdE66ktiRVqHxVopgSCwrGCFAYbZCSBSnAaSPmn21m1QAiMIKFgj4FVYFJFCrB4L2xWrgGCoi4CCVZe/xljLhXXE6qGo5PaIBglUR0DBqs5lgwxGrCj443i5GnGBYJMSGE9AwRrPsPQakli9Lgy9O6JBAtUSULCqdd1Jhiex4lTwhyeV8CAJFExAwSrYOSNMe22U3RareGuQwGwEsjWkYGVDu1jFD0TLP4hIYGVFapRAEwQUrCbceLMTD8bWqyMSFCsoGJsioGC1487/RFfuisipoGIVIAztEVCwyvPpEIv+G4Vui4hY6dMAYWiTgIO7fr8iVvhRsarfl/bgEgIM9EsOcXfBBPiqDT5UrAp2kqZNR4DBPl1t1jQnAcSKa1VTiBV1zGm7bXUETPoRULD68SrlaE4DpxIr+qRgQcFYPAEFq3gX7Rn49cjBb4gMabwdHX4zugYrkMAMBKYa8DOYahMdgbd16RS+u97V9ZIuNZFA0QSmGPSLdXCFDbOqotucDpKOjXeMrcDyEpiTgII1J+1xbXGRnRq+xYtRAmskoGDV4XXEilUV6VsmNJk606ptwmqtSgJ5CChYebhOWev2fwRzPNa4DsGakqh1VUtAwSrbdd8I8/ARokIabycL93Y1vatLTSRQPIGpJ0HxHa7MwHT6l8NPX+xY3NelJhIonkCOiVB8pysxkFUVpnKdiXTqmKveqe20vtURON5hBes4myX3cHGd9r/JS6aIYCVRzNSE1UpgWgIK1rQ8p6gNsUJMSN86RYXWIYFWCChYZXky938Eb+3tv2/N8L0ESiagYJXjHU7/8AenaaQDLTup2K+7o650qYkEqiCQe2JUAaEQI9/c2TGHT17ctWUigaoIzDE5qgKykLGsqmiaa1ekueNc7eTuh/WvjICCtbzDubiOFdwkSjpHVLDOKf89NvEBMTarCqszVsFa1uVMEsSDND02ZlmL2m89CRSrWuLV6DI+IMamoWQCCtZy3uFBfEwSJk2O7wgu17PyWuYDAc7EJFBs8zuO+ICI1RxHaiyUgIK1nGPSikof5PEBv9OIKBERJNJtgYL7M7aaZj/HbWW5WRoBnFaaTXPZs2Q76ZP83Usa0WDb90efYIv4pN9p/FvkIUSM9W2BiuydwH4yKE9qLJBAclKBpjVr0m+jZ0wgJlX6AnJkGUYQQGTgyTcDEltSxvezetRLHZSjvh7FPHQuAjh0rrZs54zAC8+Sjew7EAOTv0Y5hCWJDCkrLARnKFvKUQ91RPWG0gjgoNJsatkeJhj9c0JAoX98fhSBIaLyzNiG42Ndyli+J7YPhh6Z1MPhtENqLIhAck5BJjVrysPRMyYYky02DT0I8B1LuP0+yiSGpMTbI2/qQFvUfW3qiq1vHAEFaxy/PqWf1h0s8w7EJcmfYz+rHMQDZqR/iTyEhPexmS2k+r+SrQUrHkQgOWZQYQudTICJx8FMNlLjYQLbp3zPjkPgBTtSxupzIm+u8PauIdrvNk2WJsAguNQGDxhFgEe4MOEc+McxHjrle0EcDrelbqr9arTPqg4bYtNQAgEFK78XuMbCwF9q4uXv4bAWLjvl+8OwaictleaHHzaTYh1eWXLI8BoseRGBNNDlfEappFO+M4suf+XDhlVW8uXlJTwiGwEnUja0m/Tv9roGeh4eJZ7yndpT5siv4mBEC/GKTcNSBHDGUm233i6ngAxw0tb7eqh/NZzyHbL7UN7LIjN9jQqf+luOAWSJoGDloZ5WVWvj+0jgpO9M6qX/yxemTBr4GhWrLCr9Qrz8MqJhZgJrm1Bz4OX0h4HNxJ2jvSXb2BYoROrJYQx9Z3vp//KFKVlC6t9Lo/bKfRw9qCwoWNM7DKZM2BZPBS8SqH8FSiYzEQYl/JcvTMoS6B8+pq+KVhbEhysF/OE95g4hkAZvLVyZdH3i9grqVoF6yhBgFZfBx/eF/YgWDN8T24bMBICeuYnVVJ9OBUlL7zSTrI+NTMi1C9QhXu+IzMTy87HNPxoiMeQioGANJrtXEJZMbB4ct7ezwAwm2qmRvq1tBdXHZXDkNhb+0VDDB1afvhV1LAOxKIMqNaa2U8FKMRdtNt9o+HlYyJzigys2DVMTAO7Uda6tPj5R+YTlGeJr67v93SXwinjLWIhkg2j9jA3jaAKfiRquR3xcwQoKIwMMGZx3jKzH4uUS6GsZosWq++VR0A+ygDAgvD7K8FRZ5tb7Y5v/un+NyRbbhoEEgElROULBuE2ACcbzu7immcbJ9n63DxP4RWQj9t+NlB8NSV+L4pT7mhMtqAwMQKXoP3gxSuAAAZ7f9d4uH9H6Urdtskvgy/GWlSiM+BoUP3b7pshDn3gfm2eBjLMtX/sSYNkP4Kf3LejxqyLA7Q5prNwbPeeD7sORrj18MADwYc8c4mGJXAv+XOTBil86+k5s74U5BGuv0QYygEw35AcF4ykEGCuIFRPy41GAMcQk5dQn3q4i3BW9/GNEOHwyUm5EfiBSmFyJlGtVkRwPQDy+1z2HCACbfH4QgdQogVMJcF2Lycm1mYeiEPOPi8uIF5HfrIzs5sKPokeI84ORPjfinyJejQiP10R6cgDYyQd74OadwYABx+BKvy8YWQYJ9CLAxGXCMpaIv+tKM6YYW8R0TLeruuSzYfGNWxEivTsi35T4UKRozvMiRbAj6Rco3K/Euo/mESMQkBsUDkSzBhF4UZRCuIjfj21W8Zw+cfEZ8Xo08j4SsfTwxjAw3YrwvthmBcWz8ekXvxr1qcgbFZx4p+NjEHH0/bwYJZCJAKeITHQm+UejDX7EhHv8PhbbiBenVqVd9+LZYMyPb4eNnO5u34rABfXIniYoWKdzZAAxYO45vYhHSmAUAS7O3xk1MPYQAk6jmLOIGmORuNR1L36zMd2KwLPBWA2+IWzFvp1bESJvskDlk1XWcEV8etA9eUHBuASBdE0L8SIucd1r+1aEa5vNhtXe9q0I38sNxgl4GmEGCJ9mpx3tURLIT2D7uhdCwYfq9nUvxiuCMjSyekqRuomDbkWYEoWCdTlNHMVRsoKCsUQCnIql615cnOe6Vxq3U9iL6HErAoJIO71uRZjCgFSHkzCROJ6yuprS+cdbco8ExhP4RFTBdS+EZUzku3vbkVsRHo66Fw0K1sX4k1Dh+IuP7LvX4yUggd4EFKzjyD4Qu1xdBQSDBEohoGAd90S6yc3V1XFG7pHArAQUrMO4uRHO1dVhNub2JmCBqQgoWIdJciMce1xdQcEogUIIKFj7jvhnl8W/crtNEwlIoAQCCta+F9LPWfFo2/295khAAosRqECwZmXDb8vR4CO8GCUggbIIKFi7/kjXrJ66m+07CUigBAIK1rkX0jUrHo1xnuuWBCRQDAEF69wVsOALo9kejXHelFtHCJgtgQsJMEkvPGAlO9PqisdnrKTLdlMC9RFQsM58BgdWV58+e+urBCRQIgEmaol2zWlT+oKzLOakblurJzAEgJN0s+ErOKyuNv5JQAJlE1i7YLm6Knt8ap0EdgisXbBcXe0MB99IoGwCaxasqldXZQ8rrZNAHgJrFixXV3nGlLVKIBuBtQqWq6tsQ8qKJZCPwFoFy9VVvjFlzVMTsL6bBNYoWK6ubrrfDQnURWCNguXqqq4xqrUSuElgbYLl6uqm692QQH0E2hesXZ+4utrl4TsJVEVgTYLl6qqqoamxEtgnsBbB+kl0ndVVEq14a5CABGojsBbBemXnmPQI5O6tSVsE7E3rBNYgWOmHJR5t3Zn2TwKtE1iDYLGq4vExV1p3pv2TQOsEWhesdM2q9X62Pk7tnwRuENiayDfet/bChXZWV631y/5IYJUEWhYsV1erHNJ2umUCLQuWq6uWR659WyWBVgXL1dXFw9m9EqiSQIuCdT08weoq/dZgvDVIQAItEGhRsO7sHHNbl5pIQAKNEGhNsNKq6qeN+MduSGA0gZYqaE2w6A+3MbyqJSfZFwlI4IwAE/xsq/5XL7TX70N7IIELCbQkWFxoZ3V1YYfdKQEJ1EugFcHKtrqq17VaLoH2CLQiWK6u2hub9kgCewRaECxXV3tuNUMCbRJoQbBcXbU5NufvlS0WT6B2wXJ1VfwQ00AJTEegdsFydTXdWLAmCRRPoGbBcnVV/PDSQAlMS+D/AAAA//9WlzdWAAAABklEQVQDAGRQqzl8bMigAAAAAElFTkSuQmCC	delivered	2025-08-25 15:25:06.124
178	837	20	370	164	2025-08-25 16:00:00	1	Room MT240	\N	26	3.80	\N	delivered	2025-08-26 15:02:23.596
169	231	72	387	171	2025-08-12 16:00:00	46	MY118 [Batch: BATCH_1755024023435_387]	\N	28	0.65	\N	delivered	2025-08-12 19:42:59.373
172	837	20	387	171	2025-08-12 16:00:00	46	MY165 (Bio conference room) [Batch: BATCH_1755024166779_387]	\N	28	3.80	\N	delivered	2025-08-12 19:43:07.225
170	837	30	387	171	2025-08-12 16:00:00	46	MY118 [Batch: BATCH_1755024023435_387]	\N	28	3.80	\N	delivered	2025-08-12 19:43:16.31
171	229	6	387	171	2025-08-12 16:00:00	46	MY118 [Batch: BATCH_1755024023435_387]	\N	28	1.71	\N	delivered	2025-08-12 19:43:44.923
102	837	10	590	21	2025-05-27 16:00:00	46	[Batch: BATCH_1749496048249_57]	\N	5	3.80	\N	delivered	2025-06-11 14:12:28.089
104	837	10	590	16	2025-05-27 16:00:00	46	[Batch: BATCH_1749647782220_57]	\N	5	3.80	\N	delivered	2025-06-11 14:13:06.692
100	837	10	590	21	2025-05-27 16:00:00	46	[Batch: BATCH_1749495690882_57]	\N	5	3.80	\N	delivered	2025-06-11 14:12:40.245
213	1133	1	370	170	2025-08-26 16:00:00	1	#109	\N	3	0.00	\N	pending	\N
214	1133	1	370	218	2025-08-26 16:00:00	1	#109	\N	3	0.00	\N	pending	\N
215	1133	1	375	\N	2025-08-27 16:00:00	1	Student Affairs	\N	27	0.00	\N	pending	\N
216	1184	1	375	\N	2025-08-27 16:00:00	1	Student Affairs	\N	27	0.00	\N	pending	\N
217	837	10	140	180	2025-08-28 16:00:00	1	#309	\N	12	3.80	\N	pending	\N
218	837	30	265	209	2025-08-29 16:00:00	1	#242	\N	50	3.80	\N	pending	\N
\.


--
-- Data for Name: parts_issuance; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.parts_issuance (id, part_id, quantity, issued_at, issued_to, issued_by, reason, project_code, notes, department, building_id, cost_center) FROM stdin;
1	346	1	2025-03-31 18:59:53.285	Garry Sammet	\N	other	Affinty Commons		\N	\N	\N
61	962	1	2025-04-10 00:00:00	Bill Szippl	\N	other	\N		\N	39	128910-75500
62	482	4	2025-04-10 00:00:00	Bill Szippl	\N	other	\N		\N	39	128910-75500
31	986	6	2025-04-10 04:00:00	Matt Rinehart	\N	other	Affinty Commons		\N	1	129235-75500
33	553	3	2025-04-16 04:00:00	Brian Emerick	\N	other	129210-75500		Lima	23	129210-75500
34	1159	1	2025-04-16 04:00:00	Brian Emerick	\N	other	129210-75500		Lima	\N	129235-75500
38	727	4	2025-04-15 04:00:00	Tom Dulle	\N	other	\N		\N	10	128910-75510
36	1158	20	2025-04-15 04:00:00	Tom Dulle	\N	other	\N		\N	10	128910-75510
63	986	11	2025-04-17 00:00:00	Marcus Jackson	\N	other	\N		\N	35	128910-71510
41	482	1	2025-04-09 04:00:00	David Rose	\N	other	\N		\N	23	129210-75500
40	345	1	2025-04-10 04:00:00	David Rose	\N	other	\N		\N	23	129210-75500
39	398	1	2025-04-10 04:00:00	David Rose	\N	other	\N		\N	23	129210-75500
42	420	1	2025-04-10 00:00:00	Shane Reed	\N	other	\N		\N	1	129235-75500
43	212	1	2025-04-10 00:00:00	Shane Reed	\N	other	\N		\N	1	129235-75500
44	311	1	2025-04-17 04:00:00	Robert Kipker	\N	other	\N		\N	14	129205-75500
45	939	1	2025-04-17 00:00:00	Robert Kipker	\N	other	\N		\N	14	129205-71510
46	1151	2	2025-04-14 00:00:00	David Rose	\N	other	\N		\N	24	129205-75510
47	400	1	2025-04-14 00:00:00	David Rose	\N	other	\N		\N	24	129205-75510
48	344	1	2025-04-14 00:00:00	David Rose	\N	other	\N		\N	24	129205-75510
49	719	2	2025-04-10 00:00:00	Brian Emerick	\N	other	\N		\N	30	129230-75500
50	316	2	2025-04-10 00:00:00	David Rose	\N	other	\N		\N	23	129210-75510
51	383	1	2025-04-10 00:00:00	David Rose	\N	other	\N		\N	23	129210-75510
52	119	4	2025-04-14 00:00:00	Marcus Jackson	\N	other	\N		\N	35	128910-75500
53	964	2	2025-04-09 00:00:00	Matt McMillen	\N	other	\N		\N	18	128910-71510
54	698	3	2025-04-09 00:00:00	Garry Sammet	\N	other	\N		\N	28	111210-76200
55	549	10	2025-04-09 00:00:00	Garry Sammet	\N	other	\N		\N	28	111210-76200
56	50	2	2025-04-07 00:00:00	Bill Szippl	\N	other	\N		\N	1	129235-75510
57	834	1	2025-04-09 00:00:00	Duane Roby	\N	other	\N		\N	35	128915-75520
58	864	1	2025-04-09 00:00:00	Duane Roby	\N	other	\N		\N	35	128915-75520
59	1007	1	2025-04-09 00:00:00	Duane Roby	\N	other	\N		\N	35	128915-75520
64	703	1	2025-04-08 00:00:00	Matt Rinehart	\N	other	\N		\N	1	129235-75500
65	936	1	2025-04-10 00:00:00	Michael Crouse	\N	other	\N		\N	10	128910-75500
66	345	1	2025-04-11 00:00:00	David Rose	\N	other	\N		\N	23	129210-75500
67	142	1	2025-04-10 00:00:00	Andrew Nichelson	\N	other	\N		\N	43	129230-75510
68	164	2	2025-04-10 00:00:00	Andrew Nichelson	\N	other	\N		\N	43	129230-75510
69	50	1	2025-04-03 00:00:00	David Rose	\N	other	\N		\N	18	128910-75510
70	745	2	2025-04-08 00:00:00	Marcus Jackson	\N	other	\N		\N	1	129235-75500
71	598	2	2025-04-08 00:00:00	Andrew Nichelson	\N	other	\N		\N	1	129235-75510
72	936	1	2025-04-08 00:00:00	Andrew Nichelson	\N	other	\N		\N	1	129235-75510
73	986	1	2025-04-07 00:00:00	Brian Emerick	\N	other	\N		\N	1	129235-75500
74	553	4	2025-04-07 00:00:00	Brian Emerick	\N	other	\N		\N	1	129235-75500
75	1008	1	2025-04-10 00:00:00	Brian Emerick	\N	other	\N		\N	14	129205-75500
76	354	1	2025-04-10 00:00:00	Michael Gierhart	\N	other	\N		\N	32	128910-75510
77	940	2	2025-04-10 00:00:00	Michael Gierhart	\N	other	\N		\N	32	128910-75510
78	237	2	2025-04-10 00:00:00	David Rose	\N	other	\N		\N	27	129100-75510
79	173	4	2025-04-10 00:00:00	David Rose	\N	other	\N		\N	27	129100-75510
80	50	2	2025-04-10 00:00:00	David Rose	\N	other	\N		\N	27	129100-75510
81	866	1	2025-04-02 00:00:00	Brian Emerick	\N	other	\N		\N	32	128910-75500
82	991	100	2025-04-02 00:00:00	Brian Emerick	\N	other	\N		\N	32	128910-75500
83	797	1	2025-04-02 00:00:00	Brian Emerick	\N	other	\N		\N	32	128910-75500
84	723	2	2025-04-07 00:00:00	Marcus Jackson	\N	other	\N		\N	23	129210-75500
85	712	4	2025-04-10 00:00:00	Roy Cheney	\N	other	\N		\N	32	128910-75500
86	93	144	2025-04-24 00:00:00	Matt McMillen	\N	other	\N		\N	50	128910-75510
87	50	2	2025-04-02 00:00:00	David Rose	\N	other	\N		\N	18	128910-75510
88	1083	5	2025-04-01 00:00:00	Matt McMillen	\N	other	\N		\N	1	129235-71610
89	986	6	2025-04-01 00:00:00	Matt McMillen	\N	other	\N		\N	1	129235-71610
90	831	20	2025-04-10 00:00:00	Tom Dulle	\N	other	\N		\N	26	128910-75510
91	35	1	2025-04-16 00:00:00	Andrew Nichelson	\N	other	\N		\N	35	128915-75510
92	50	2	2025-04-16 00:00:00	David Rose	\N	other	\N		\N	27	129100-75510
93	592	1	2025-04-16 00:00:00	Matt Rinehart	\N	other	\N		\N	12	128910-75510
94	584	1	2025-04-16 00:00:00	Matt Rinehart	\N	other	\N		\N	12	128910-75510
95	345	1	2025-04-10 00:00:00	Bill Szippl	\N	other	\N		\N	45	129130-75510
96	1148	1	2025-04-10 00:00:00	Bill Szippl	\N	other	\N		\N	14	129205-75510
97	921	21	2025-04-09 00:00:00	Marcus Jackson	\N	other	\N		\N	35	128910-75510
98	965	1	2025-04-16 00:00:00	Chris Garver	\N	other	\N		\N	35	128910-71510
99	938	1	2025-04-16 00:00:00	Chris Garver	\N	other	\N		\N	35	128910-71510
100	965	1	2025-04-14 00:00:00	Chris Garver	\N	other	\N		\N	39	128910-75500
101	281	2	2025-04-02 00:00:00	Bill Szippl	\N	other	\N		\N	15	128910-75510
102	1004	1	2025-03-12 00:00:00	Marcus Jackson	\N	other	\N		\N	43	129230-75500
103	359	1	2025-04-10 00:00:00	David Rose	\N	other	\N		\N	23	129210-75500
104	501	1	2025-04-10 00:00:00	David Rose	\N	other	\N		\N	23	129210-75500
105	278	1	2025-04-10 00:00:00	David Rose	\N	other	\N		\N	23	129210-75500
106	326	1	2025-04-10 00:00:00	David Rose	\N	other	\N		\N	23	129210-75500
107	316	1	2025-04-10 00:00:00	David Rose	\N	other	\N		\N	23	129210-75500
108	317	1	2025-04-10 00:00:00	David Rose	\N	other	\N		\N	23	129210-75500
109	404	6	2025-04-10 00:00:00	David Rose	\N	other	\N		\N	23	129210-75500
110	299	3	2025-04-10 00:00:00	David Rose	\N	other	\N		\N	23	129210-75500
111	925	1	2025-04-11 00:00:00	Andrew Nichelson	\N	other	\N		\N	35	128910-71510
112	1121	10	2025-04-17 00:00:00	Brian Emerick	\N	other	\N		\N	1	129235-75500
113	749	2	2025-04-17 00:00:00	Brian Emerick	\N	other	\N		\N	1	129235-75500
114	767	4	2025-04-17 00:00:00	Brian Emerick	\N	other	\N		\N	1	129235-75500
115	891	1	2025-04-10 00:00:00	Garry Sammet	\N	other	\N		\N	15	128910-71510
116	991	100	2025-04-09 00:00:00	Brian Emerick	\N	other	\N		\N	50	128910-71510
117	482	4	2025-04-08 00:00:00	Bill Szippl	\N	other	\N		\N	28	128910-75510
118	281	2	2025-04-08 00:00:00	Bill Szippl	\N	other	\N		\N	28	128910-75510
119	386	2	2025-04-08 00:00:00	Bill Szippl	\N	other	\N		\N	28	128910-75510
120	1041	1	2025-04-14 00:00:00	Shane Downing	\N	other	\N		\N	20	128910-75510
121	354	1	2025-04-16 00:00:00	David Rose	\N	other	\N		\N	22	128910-75510
122	298	1	2025-04-16 00:00:00	David Rose	\N	other	\N		\N	22	128910-75510
123	404	1	2025-04-16 00:00:00	David Rose	\N	other	\N		\N	22	128910-75510
124	331	1	2025-04-16 00:00:00	David Rose	\N	other	\N		\N	22	128910-75510
125	375	1	2025-04-02 00:00:00	Brian Emerick	\N	other	\N		\N	16	128910-75510
126	1008	1	2025-04-17 00:00:00	Brian Emerick	\N	other	\N		\N	23	129210-75510
127	822	1	2025-04-21 00:00:00	Shane Reed	\N	other	\N		\N	43	129230-75510
128	956	1	2025-04-14 00:00:00	David Rose	\N	other	\N		\N	27	129100-75510
129	394	1	2025-04-14 00:00:00	David Rose	\N	other	\N		\N	27	129100-75510
130	926	2	2025-04-03 00:00:00	Marcus Jackson	\N	other	\N		\N	27	129100-71510
131	482	2	2025-04-03 00:00:00	Bill Szippl	\N	other	\N		\N	1	129235-75500
132	237	4	2025-04-16 00:00:00	Bill Szippl	\N	other	\N		\N	43	129230-75500
133	254	1	2025-04-16 00:00:00	Bill Szippl	\N	other	\N		\N	43	129230-75500
134	329	2	2025-04-10 00:00:00	Bill Szippl	\N	other	\N		\N	23	129210-75500
135	1044	1	2025-04-10 00:00:00	Bill Szippl	\N	other	\N		\N	23	129210-75500
136	504	2	2025-04-03 00:00:00	Tom Dulle	\N	other	\N		\N	51	128910-75500
137	724	6	2025-04-07 00:00:00	Matt Rinehart	\N	other	\N		\N	30	129215-75510
138	765	3	2025-04-07 00:00:00	Matt Rinehart	\N	other	\N		\N	30	129215-75510
139	1083	2	2025-04-25 00:00:00	Brian Emerick	\N	other	\N		\N	30	129215-75500
140	719	2	2025-04-25 00:00:00	Brian Emerick	\N	other	\N		\N	30	129215-75500
142	703	1	2025-04-25 00:00:00	Brian Emerick	\N	other	\N		\N	30	129215-75500
143	933	1	2025-04-25 00:00:00	Brian Emerick	\N	other	\N		\N	30	129215-75500
146	603	3	2025-05-13 00:00:00	Matt Rinehart	\N	other	\N		\N	27	129100-75510
147	813	3	2025-05-13 00:00:00	Matt Rinehart	\N	other	\N		\N	27	129100-75510
148	553	19	2025-05-22 00:00:00	Matt Rinehart	\N	other	\N		\N	35	128910-75500
149	553	7	2025-05-29 00:00:00	Tom Dulle	\N	other	\N		\N	23	129210-75500
150	965	1	2025-05-29 00:00:00	Chris Garver	\N	other	\N		\N	49	128910-55075
151	1052	1	2025-05-27 00:00:00	Brian Emerick	\N	other	\N		\N	4	\N
152	553	7	2025-05-27 00:00:00	Brian Emerick	\N	other	\N		\N	4	\N
153	252	4	2025-05-27 00:00:00	Garry Sammet	\N	other	\N		\N	22	128910-75520
154	928	1	2025-05-27 00:00:00	Garry Sammet	\N	other	\N		\N	22	128910-75520
155	936	1	2025-05-27 00:00:00	Brian Emerick	\N	other	\N		\N	4	128910-75520
156	93	120	2025-05-27 00:00:00	Chris Garver	\N	other	\N	5 bags	\N	50	128910-75520
157	873	1	2025-05-27 00:00:00	Andrew Nichelson	\N	other	\N		\N	35	128910-75520
158	50	2	2025-05-27 00:00:00	David Rose	\N	other	\N		\N	41	128910-75520
159	564	1	2025-05-27 00:00:00	Garry Sammet	\N	other	\N		\N	27	128910-75520
160	939	1	2025-05-27 00:00:00	Garry Sammet	\N	other	\N		\N	27	128910-75520
161	858	1	2025-05-27 00:00:00	Garry Sammet	\N	other	\N		\N	27	128910-75520
162	497	5	2025-05-27 04:00:00	Brian Emerick	\N	other	\N		\N	9	128910-75500
163	553	6	2025-05-27 04:00:00	Marcus Jackson	\N	other	\N		\N	44	128910-75500
164	359	1	2025-05-27 00:00:00	David Rose	\N	other	\N		\N	49	128910-75500
165	274	1	2025-05-27 00:00:00	David Rose	\N	other	\N		\N	49	128910-75500
167	1177	4	2025-05-27 00:00:00	David Rose	\N	other	\N		\N	49	128910-75500
168	1176	4	2025-05-27 00:00:00	Bill Szippl	\N	other	\N		\N	28	128910-75500
169	803	1	2025-05-27 00:00:00	Marcus Jackson	\N	other	\N		\N	50	128910-75500
170	8	7	2025-05-20 00:00:00	Timothy Flowers	\N	other	\N		\N	35	128910-75520
171	716	2	2025-05-27 00:00:00	Marc Staley	\N	other	\N		\N	3	128910-75500
172	167	4	2025-05-21 00:00:00	Barry Musselman	\N	other	\N		\N	27	128910-75500
173	1078	1	2025-06-12 14:53:59.467	Bill Szippl	\N	other	\N		\N	4	128910-75500
175	936	1	2025-06-12 14:56:10.166	Bill Szippl	\N	other	\N		\N	4	128910-75500
174	1175	2	2025-06-12 14:53:59.467	Bill Szippl	\N	other	\N		\N	4	128910-75500
176	1205	1	2025-04-28 00:00:00	Shane Reed	\N	other	\N		\N	35	128910-75500
178	288	4	2025-05-22 00:00:00	Matt Rinehart	\N	other	\N		\N	30	128910-75500
177	553	3	2025-05-21 04:00:00	Brian Emerick	\N	other	\N		\N	23	128910-75500
179	229	6	2025-04-29 00:00:00	Gary Tenwalde	\N	other	\N		\N	40	128910-75500
180	943	1	2025-05-27 00:00:00	Student Worker	\N	other	\N		\N	23	128910-75520
181	38	3	2025-05-15 00:00:00	Matt Rinehart	\N	other	\N		\N	22	128910-75500
182	497	2	2025-05-22 00:00:00	Other	\N	other	\N		\N	9	128910-75500
183	204	2	2025-05-22 00:00:00	Robert Kipker	\N	other	\N		\N	50	128910-75500
184	846	2	2025-05-22 00:00:00	Robert Kipker	\N	other	\N		\N	50	128910-75500
185	363	1	2025-05-22 00:00:00	Marcus Jackson	\N	other	\N		\N	43	128910-75500
186	159	2	2025-05-01 00:00:00	Timothy Flowers	\N	other	\N	set screw	\N	35	128910-75500
187	1177	1	2025-05-01 00:00:00	Other	\N	other	\N		\N	11	128910-75500
188	991	100	2025-05-01 00:00:00	Other	\N	other	\N	Richard Tordiff	\N	50	128910-75500
189	890	1	2025-05-01 00:00:00	Other	\N	other	\N	3/16 Drill bit	\N	35	128910-75500
190	274	4	2025-05-15 00:00:00	David Rose	\N	other	\N		\N	9	128910-75500
191	553	10	2025-05-15 00:00:00	Matt Rinehart	\N	other	\N		\N	35	128910-75500
192	568	1	2025-05-16 00:00:00	Marc Staley	\N	other	\N		\N	35	128910-75500
193	124	1	2025-05-04 00:00:00	Matt Rinehart	\N	other	\N		\N	43	128910-75500
194	942	1	2025-05-28 00:00:00	Other	\N	other	\N	Josh C	\N	35	128910-75500
195	1004	13	2025-05-28 00:00:00	Other	\N	other	\N	Adam Jordan	\N	35	128910-75500
196	534	2	2025-05-16 00:00:00	Marc Staley	\N	other	\N		\N	28	128910-75500
197	504	2	2025-05-16 00:00:00	Marc Staley	\N	other	\N		\N	28	128910-75500
198	608	2	2025-05-16 00:00:00	Marc Staley	\N	other	\N		\N	28	128910-75500
199	586	1	2025-05-16 00:00:00	Marc Staley	\N	other	\N		\N	28	128910-75500
200	362	1	2025-05-16 00:00:00	Bill Szippl	\N	other	\N		\N	9	128910-75500
201	482	1	2025-05-16 00:00:00	Bill Szippl	\N	other	\N		\N	9	128910-75500
202	965	2	2025-05-06 00:00:00	Chris Garver	\N	other	\N		\N	22	128910-75500
203	965	2	2025-05-09 00:00:00	Other	\N	other	\N	Wendy	\N	23	128910-75500
204	968	1	2025-05-16 00:00:00	Bill Szippl	\N	other	\N		\N	20	128910-75500
205	991	300	2025-05-21 00:00:00	Marcus Jackson	\N	other	\N		\N	50	128910-75500
206	1192	1	2025-05-22 00:00:00	Matt Rinehart	\N	other	\N		\N	35	128910-75500
207	1041	1	2025-05-08 00:00:00	Shane Reed	\N	other	\N		\N	37	128910-75500
208	1173	1	2025-05-08 00:00:00	Bill Szippl	\N	other	\N		\N	27	128910-75500
209	288	2	2025-05-08 00:00:00	David Rose	\N	other	\N		\N	23	128910-75500
210	331	1	2025-05-15 00:00:00	David Rose	\N	other	\N		\N	16	128910-75500
211	1208	1	2025-05-16 00:00:00	Marcus Jackson	\N	other	\N		\N	1	128910-75500
212	608	2	2025-05-21 00:00:00	Matt Rinehart	\N	other	\N		\N	47	128910-75500
213	1209	1	2025-06-12 00:00:00	Bill Szippl	\N	other	\N		\N	4	128910-75500
214	993	1	2025-05-21 00:00:00	Matt Rinehart	\N	other	\N		\N	37	128910-75500
215	363	1	2025-05-15 04:00:00	David Rose	\N	other	\N	Round	\N	20	128910-75500
216	876	1	2025-05-13 04:00:00	Marcus Jackson	\N	other	\N		\N	43	128910-75500
217	288	2	2025-05-15 00:00:00	Marcus Jackson	\N	other	\N		\N	43	128910-75500
218	124	1	2025-05-22 00:00:00	Brian Emerick	\N	other	\N		\N	43	128910-75500
219	1005	1	2025-05-16 00:00:00	Matt Rinehart	\N	other	\N		\N	49	128910-75500
220	992	1	2025-05-16 00:00:00	Matt Rinehart	\N	other	\N		\N	49	128910-75500
221	333	1	2025-05-14 00:00:00	David Rose	\N	other	\N		\N	6	128910-75500
222	553	3	2025-05-16 00:00:00	Matt Rinehart	\N	other	\N		\N	43	128910-75500
223	229	4	2025-05-16 00:00:00	Matt Rinehart	\N	other	\N		\N	43	128910-75500
225	109	3	2025-05-07 04:00:00	Brian Emerick	\N	other	\N		\N	43	128910-75500
224	1008	1	2025-05-07 04:00:00	Brian Emerick	\N	other	\N		\N	43	128910-75500
226	603	3	2025-05-14 00:00:00	Marc Staley	\N	other	\N		\N	27	128910-75500
227	813	3	2025-05-14 00:00:00	Marc Staley	\N	other	\N		\N	27	128910-75500
230	515	2	2025-05-14 00:00:00	Marc Staley	\N	other	\N		\N	27	128910-75500
231	524	1	2025-05-14 00:00:00	Marc Staley	\N	other	\N		\N	27	128910-75500
229	613	3	2025-05-14 04:00:00	Other	\N	other	\N	Eric (IT)	\N	22	128910-75500
228	812	1	2025-05-14 04:00:00	Other	\N	other	\N	Eric (IT)	\N	22	128910-75500
232	235	1	2025-05-20 00:00:00	Garry Sammet	\N	other	\N		\N	34	128910-75500
233	243	1	2025-05-20 00:00:00	Garry Sammet	\N	other	\N		\N	34	128910-75500
234	553	4	2025-05-28 00:00:00	Marcus Jackson	\N	other	\N		\N	9	128910-75500
235	125	3	2025-05-15 00:00:00	Marcus Jackson	\N	other	\N		\N	49	128910-75520
236	105	2	2025-05-15 00:00:00	Marcus Jackson	\N	other	\N		\N	49	128910-75520
237	243	1	2025-05-21 00:00:00	Garry Sammet	\N	other	\N		\N	24	128910-75500
238	248	1	2025-05-21 00:00:00	Garry Sammet	\N	other	\N		\N	24	128910-75500
239	1200	2	2025-05-29 00:00:00	David Rose	\N	other	\N		\N	9	128910-75500
240	285	1	2025-05-29 00:00:00	David Rose	\N	other	\N		\N	9	128910-75500
241	973	1	2025-05-21 00:00:00	Chris Garver	\N	other	\N		\N	50	128910-75500
242	965	1	2025-05-21 00:00:00	Chris Garver	\N	other	\N		\N	50	128910-75500
243	248	2	2025-05-20 00:00:00	Bill Szippl	\N	other	\N		\N	50	128910-75500
244	940	1	2025-05-20 00:00:00	Bill Szippl	\N	other	\N		\N	50	128910-75500
246	834	5	2025-05-14 00:00:00	Matt Rinehart	\N	other	\N		\N	35	128910-75500
247	1148	1	2025-05-22 00:00:00	Bill Szippl	\N	other	\N		\N	18	128910-75500
248	402	1	2025-05-22 00:00:00	Bill Szippl	\N	other	\N		\N	18	128910-75500
249	968	1	2025-05-15 00:00:00	Bill Szippl	\N	other	\N		\N	49	128910-75500
250	703	2	2025-05-19 00:00:00	Brian Emerick	\N	other	\N		\N	23	128910-75500
251	1008	1	2025-05-19 00:00:00	Brian Emerick	\N	other	\N		\N	23	128910-75500
252	1008	1	2025-05-15 00:00:00	Brian Emerick	\N	other	\N		\N	14	128910-75500
253	1172	1	2025-05-15 00:00:00	David Rose	\N	other	\N		\N	27	128910-75500
254	1174	1	2025-05-15 00:00:00	David Rose	\N	other	\N		\N	27	128910-75500
255	1026	1	2025-05-14 00:00:00	David Rose	\N	other	\N		\N	9	128910-75500
256	992	1	2025-05-14 00:00:00	David Rose	\N	other	\N		\N	9	128910-75500
257	290	1	2025-05-14 00:00:00	David Rose	\N	other	\N		\N	9	128910-75500
258	1175	2	2025-05-14 00:00:00	David Rose	\N	other	\N		\N	9	128910-75500
259	348	1	2025-05-14 00:00:00	Bill Szippl	\N	other	\N		\N	35	128910-75500
260	1026	6	2025-05-14 00:00:00	Bill Szippl	\N	other	\N		\N	35	128910-75500
261	332	2	2025-05-14 00:00:00	Bill Szippl	\N	other	\N		\N	35	128910-75500
262	1179	20	2025-05-14 00:00:00	Bill Szippl	\N	other	\N		\N	35	128910-75500
263	345	2	2025-05-14 00:00:00	Bill Szippl	\N	other	\N		\N	35	128910-75500
264	979	1	2025-05-14 00:00:00	David Rose	\N	other	\N		\N	9	128910-75500
265	331	1	2025-05-14 00:00:00	David Rose	\N	other	\N		\N	9	128910-75500
266	327	1	2025-05-14 00:00:00	David Rose	\N	other	\N		\N	9	128910-75500
267	1188	1	2025-05-14 00:00:00	David Rose	\N	other	\N		\N	9	128910-75500
268	204	4	2025-05-14 00:00:00	Garry Sammet	\N	other	\N		\N	24	128910-75500
269	849	1	2025-06-03 00:00:00	Marcus Jackson	\N	other	\N		\N	35	128910-75500
270	1175	2	2025-06-18 00:00:00	David Rose	\N	other	\N		\N	24	128910-75500
271	305	1	2025-06-18 00:00:00	David Rose	\N	other	\N		\N	24	128910-75500
272	866	1	2025-06-18 11:34:51.241	Matt Rinehart	\N	other	\N		\N	35	128910-75500
273	1177	1	2025-06-18 11:34:51.241	Bill Szippl	\N	other	\N		\N	16	128910-75500
274	299	1	2025-06-18 11:34:51.241	Bill Szippl	\N	other	\N		\N	16	128910-75500
275	1111	1	2025-06-18 11:34:51.241	Bill Szippl	\N	other	\N		\N	16	128910-75500
276	288	6	2025-06-18 11:34:51.241	Matt Rinehart	\N	other	\N		\N	1	128910-75500
277	317	1	2025-06-18 11:34:51.241	David Rose	\N	other	\N		\N	4	128910-75500
278	316	1	2025-06-18 11:34:51.241	David Rose	\N	other	\N		\N	4	128910-75500
279	288	6	2025-06-18 11:34:51.241	David Rose	\N	other	\N		\N	4	128910-75500
280	1041	1	2025-06-18 11:34:51.241	Garry Sammet	\N	other	\N		\N	22	128910-75500
281	160	1	2025-06-18 11:34:51.241	Andrew Nichelson	\N	other	\N		\N	24	128910-75500
282	943	1	2025-06-18 11:34:51.241	David Rose	\N	other	\N		\N	43	128910-75500
283	910	2	2025-06-18 11:34:51.241	David Rose	\N	other	\N		\N	43	128910-75500
284	326	1	2025-06-18 11:34:51.241	David Rose	\N	other	\N		\N	3	128910-75500
285	1176	5	2025-06-18 11:34:51.241	David Rose	\N	other	\N		\N	28	128910-75500
339	1044	1	2025-06-20 11:36:35.619	Shane Downing	\N	other	\N		\N	4	128910-75500
291	400	1	2025-06-18 11:34:51.241	Brian Emerick	\N	other	\N		\N	41	128910-75500
292	344	2	2025-06-18 11:34:51.241	Brian Emerick	\N	other	\N		\N	41	128910-75500
293	863	1	2025-06-18 11:34:51.241	Brian Emerick	\N	other	\N		\N	41	128910-75500
294	1008	8	2025-06-18 11:34:51.241	Other	\N	other	\N		\N	41	128910-75500
295	90	1	2025-06-18 11:34:51.241	Marcus Jackson	\N	other	\N		\N	30	128910-75500
296	845	2	2025-06-18 11:34:51.241	Marcus Jackson	\N	other	\N		\N	30	128910-75500
297	858	1	2025-06-18 11:34:51.241	Marcus Jackson	\N	other	\N		\N	30	128910-75500
298	1044	1	2025-06-18 11:34:51.241	Shane Reed	\N	other	\N		\N	23	128910-75500
299	35	1	2025-06-18 11:34:51.241	Matt Rinehart	\N	other	\N		\N	27	128910-75500
300	553	1	2025-06-18 11:34:51.241	Michael Crouse	\N	other	\N		\N	41	128910-75500
301	159	1	2025-06-18 11:34:51.241	David Rose	\N	other	\N		\N	35	128910-75500
303	329	1	2025-06-18 11:34:51.241	David Rose	\N	other	\N		\N	35	128910-75500
304	160	4	2025-06-18 11:34:51.241	Matt Rinehart	\N	other	\N		\N	24	128910-75500
305	321	4	2025-06-18 11:34:51.241	David Rose	\N	other	\N		\N	10	128910-75500
306	936	1	2025-06-18 11:34:51.241	David Rose	\N	other	\N		\N	10	128910-75500
307	343	1	2025-06-18 11:34:51.241	Bill Szippl	\N	other	\N		\N	23	128910-75500
308	1213	1	2025-06-18 11:34:51.241	Bill Szippl	\N	other	\N		\N	23	128910-75500
309	1044	1	2025-06-18 11:34:51.241	Shane Downing	\N	other	\N		\N	4	128910-75500
310	36	4	2025-06-18 11:34:51.241	Timothy Flowers	\N	other	\N		\N	35	128910-75520
311	364	1	2025-06-18 11:34:51.241	Bill Szippl	\N	other	\N		\N	23	128910-75500
312	355	2	2025-06-18 11:34:51.241	Bill Szippl	\N	other	\N		\N	23	128910-75500
313	328	2	2025-06-18 11:34:51.241	Bill Szippl	\N	other	\N		\N	23	128910-75500
314	288	1	2025-06-18 11:34:51.241	Bill Szippl	\N	other	\N		\N	23	128910-75500
315	333	2	2025-06-18 11:34:51.241	Bill Szippl	\N	other	\N		\N	23	128910-75500
316	1188	1	2025-06-18 11:34:51.241	Bill Szippl	\N	other	\N		\N	23	128910-75500
317	329	1	2025-06-18 11:34:51.241	Bill Szippl	\N	other	\N		\N	23	128910-75500
318	876	1	2025-06-18 11:34:51.241	Bill Szippl	\N	other	\N		\N	23	128910-75500
319	553	3	2025-06-20 11:36:35.619	Brian Emerick	\N	other	\N		\N	4	128910-75500
320	363	1	2025-06-20 11:36:35.619	Brian Emerick	\N	other	\N		\N	4	128910-75500
321	1159	1	2025-06-20 11:36:35.619	Brian Emerick	\N	other	\N		\N	4	128910-75500
322	502	2	2025-06-20 11:36:35.619	Marc Staley	\N	other	\N		\N	34	128910-75500
323	1008	19	2025-06-20 11:36:35.619	Marcus Jackson	\N	other	\N		\N	35	128910-75500
324	553	11	2025-06-20 11:36:35.619	Marcus Jackson	\N	other	\N		\N	35	128910-75500
325	944	1	2025-06-20 11:36:35.619	Shane Downing	\N	other	\N	paint crew	\N	53	128910-75500
326	816	1	2025-06-20 11:36:35.619	David Rose	\N	other	\N		\N	9	128910-75500
327	592	2	2025-06-20 11:36:35.619	David Rose	\N	other	\N		\N	9	128910-75500
328	584	1	2025-06-20 11:36:35.619	David Rose	\N	other	\N		\N	9	128910-75500
329	944	1	2025-06-20 11:36:35.619	David Rose	\N	other	\N		\N	9	128910-75500
330	1191	1	2025-06-20 11:36:35.619	David Rose	\N	other	\N		\N	9	128910-75500
331	921	1	2025-06-20 11:36:35.619	David Rose	\N	other	\N		\N	9	128910-75500
332	113	1	2025-06-20 11:36:35.619	Michael Crouse	\N	other	\N		\N	35	128910-75500
333	242	1	2025-06-20 11:36:35.619	Garry Sammet	\N	other	\N		\N	34	128910-75500
334	719	1	2025-06-20 11:36:35.619	Other	\N	other	\N		\N	50	128910-75500
335	922	1	2025-06-20 11:36:35.619	Other	\N	other	\N		\N	50	128910-75500
336	597	2	2025-06-20 11:36:35.619	Marc Staley	\N	other	\N		\N	14	128910-75500
337	592	1	2025-06-20 11:36:35.619	Marc Staley	\N	other	\N		\N	14	128910-75500
338	121	3	2025-06-20 11:36:35.619	Marc Staley	\N	other	\N		\N	14	128910-75500
340	334	2	2025-06-20 11:36:35.619	Bill Szippl	\N	other	\N		\N	27	128910-75500
341	737	2	2025-06-20 11:36:35.619	Brian Emerick	\N	other	\N		\N	24	128910-75500
342	1202	1	2025-06-20 11:36:35.619	Marc Staley	\N	other	\N		\N	42	128910-75500
343	1196	4	2025-06-20 11:36:35.619	Michael Crouse	\N	other	\N		\N	23	128910-75500
344	348	5	2025-06-20 11:36:35.619	Bill Szippl	\N	other	\N		\N	16	128910-75500
345	504	1	2025-06-20 11:36:35.619	Marc Staley	\N	other	\N		\N	4	128910-75500
346	245	1	2025-06-20 11:36:35.619	Garry Sammet	\N	other	\N		\N	27	128910-75500
347	121	4	2025-06-20 11:36:35.619	Bill Szippl	\N	other	\N		\N	24	128910-75500
348	525	2	2025-06-20 12:20:59.067	Marc Staley	\N	other	\N		\N	42	128910-75500
349	504	1	2025-06-20 12:20:59.067	Marc Staley	\N	other	\N		\N	42	128910-75500
350	766	24	2025-06-20 12:20:59.067	Tom Dulle	\N	other	\N		\N	53	128910-75500
351	1179	10	2025-06-20 12:37:42.118	Bill Szippl	\N	other	\N		\N	23	128910-75500
352	357	1	2025-06-20 12:37:42.118	Bill Szippl	\N	other	\N		\N	23	128910-75500
353	358	1	2025-06-20 12:37:42.118	Bill Szippl	\N	other	\N		\N	23	128910-75500
354	288	2	2025-06-20 12:37:42.118	Bill Szippl	\N	other	\N		\N	23	128910-75500
355	277	1	2025-06-20 12:37:42.118	Bill Szippl	\N	other	\N		\N	23	128910-75500
356	1177	2	2025-06-20 12:37:42.118	Bill Szippl	\N	other	\N		\N	23	128910-75500
357	272	1	2025-06-20 12:37:42.118	Bill Szippl	\N	other	\N		\N	23	128910-75500
358	1078	1	2025-06-20 12:37:42.118	Bill Szippl	\N	other	\N		\N	23	128910-75500
359	482	2	2025-06-20 12:37:42.118	Bill Szippl	\N	other	\N		\N	23	128910-75500
360	1175	2	2025-06-20 12:37:42.118	David Rose	\N	other	\N		\N	24	128910-75500
361	387	2	2025-06-20 12:37:42.118	David Rose	\N	other	\N		\N	24	128910-75500
362	239	2	2025-06-20 12:37:42.118	David Rose	\N	other	\N		\N	24	128910-75500
363	248	1	2025-06-20 12:37:42.118	David Rose	\N	other	\N		\N	24	128910-75500
364	505	1	2025-06-20 12:37:42.118	Tom Dulle	\N	other	\N		\N	18	128910-75500
365	73	1	2025-06-20 12:37:42.118	Matt Rinehart	\N	other	\N		\N	2	128910-75500
366	1083	1	2025-06-20 12:37:42.118	Matt Rinehart	\N	other	\N		\N	2	128910-75500
367	553	4	2025-06-20 12:37:42.118	Brian Emerick	\N	other	\N		\N	2	122100-75500
368	553	10	2025-06-20 12:37:42.118	Matt McMillen	\N	other	\N		\N	2	122100-75500
369	936	1	2025-06-20 12:37:42.118	Student Worker	\N	other	\N		\N	35	128910-75500
371	1113	1	2025-06-20 12:37:42.118	Student Worker	\N	other	\N		\N	35	128910-75500
372	853	1	2025-06-20 12:37:42.118	Student Worker	\N	other	\N		\N	35	128910-75500
373	757	1	2025-06-20 12:37:42.118	Student Worker	\N	other	\N		\N	10	128910-75500
375	1206	1	2025-06-20 12:37:42.118	Bill Szippl	\N	other	\N		\N	3	128910-75500
378	159	1	2025-06-20 12:37:42.118	David Rose	\N	other	\N		\N	30	128910-75500
379	322	1	2025-06-20 12:37:42.118	David Rose	\N	other	\N		\N	30	128910-75500
380	600	7	2025-06-20 12:37:42.118	Marc Staley	\N	other	\N		\N	28	128910-75500
381	599	1	2025-06-20 12:37:42.118	Marc Staley	\N	other	\N		\N	10	128910-75500
382	613	1	2025-06-20 12:37:42.118	Marc Staley	\N	other	\N		\N	10	128910-75500
383	936	2	2025-06-20 12:37:42.118	Gary Tenwalde	\N	other	\N		\N	53	128910-75500
384	288	2	2025-06-20 12:37:42.118	Brian Emerick	\N	other	\N		\N	2	128910-75500
385	1008	12	2025-06-23 11:40:25.061	Other	\N	other	\N		\N	41	128910-75500
386	113	1	2025-06-23 11:47:24.976	Other	\N	other	\N		\N	40	122100-75500
387	288	6	2025-06-23 11:47:24.976	Matt Rinehart	\N	other	\N		\N	2	128910-75500
388	822	1	2025-06-23 11:47:24.976	Shane Reed	\N	other	\N		\N	30	128910-75500
389	482	1	2025-06-23 11:47:24.976	Bill Szippl	\N	other	\N		\N	27	128910-75500
390	313	1	2025-06-23 11:47:24.976	Bill Szippl	\N	other	\N		\N	27	128910-75500
391	323	1	2025-06-23 11:47:24.976	Bill Szippl	\N	other	\N		\N	27	128910-75500
392	804	250	2025-06-23 11:47:24.976	Marc Staley	\N	other	\N		\N	34	128910-75500
393	1202	2	2025-06-23 11:47:24.976	Marc Staley	\N	other	\N		\N	34	128910-75500
394	124	1	2025-06-23 11:47:24.976	Matt Rinehart	\N	other	\N		\N	30	128910-75500
395	1195	1	2025-06-23 11:47:24.976	Matt Rinehart	\N	other	\N		\N	30	128910-75500
396	334	2	2025-06-23 11:47:24.976	Matt Rinehart	\N	other	\N		\N	30	128910-75500
397	1159	2	2025-06-23 11:47:24.976	Brian Emerick	\N	other	\N		\N	1	128910-75500
398	924	1	2025-06-23 11:47:24.976	Other	\N	other	\N	Eric (IT)	\N	17	111420-76200
399	1005	1	2025-06-23 11:47:24.976	Brian Emerick	\N	other	\N		\N	43	128910-75500
400	1202	1	2025-06-25 00:00:00	Marc Staley	\N	other	\N		\N	12	128910-75500
401	504	1	2025-06-25 00:00:00	Marc Staley	\N	other	\N		\N	12	128910-75500
402	1161	1	2025-06-25 00:00:00	Marc Staley	\N	other	\N		\N	12	128910-75500
403	1159	1	2025-06-23 11:47:24.976	Brian Emerick	\N	other	\N		\N	2	128910-75500
405	504	1	2025-06-26 17:56:31.85	Matt Rinehart	\N	other	\N		\N	43	128910-75500
406	611	1	2025-06-26 17:56:31.85	Matt Rinehart	\N	other	\N		\N	43	128910-75500
407	597	1	2025-06-26 17:56:31.85	Matt Rinehart	\N	other	\N		\N	43	128910-75500
409	965	2	2025-06-26 17:56:31.85	Chris Garver	\N	other	\N		\N	17	128910-75500
410	890	2	2025-06-26 17:56:31.85	Garry Sammet	\N	other	\N		\N	18	122100-75500
411	17	1	2025-06-26 17:56:31.85	Garry Sammet	\N	other	\N		\N	18	122100-75500
412	553	6	2025-06-26 17:56:31.85	Michael Wilson	\N	other	\N		\N	41	128910-75500
413	269	3	2025-06-26 17:56:31.85	Michael Wilson	\N	other	\N		\N	41	128910-75500
414	831	1	2025-06-26 18:09:24.38	Tom Dulle	\N	other	\N		\N	26	128910-75500
416	979	1	2025-06-26 18:09:24.38	Marcus Jackson	\N	other	\N		\N	43	128910-75500
417	1004	2	2025-06-26 18:09:24.38	Marcus Jackson	\N	other	\N		\N	43	128910-75500
418	1159	1	2025-06-26 18:09:24.38	Brian Emerick	\N	other	\N		\N	2	128910-75500
419	332	1	2025-06-26 18:09:24.38	Bill Szippl	\N	other	\N		\N	53	128910-75520
420	17	1	2025-06-26 18:09:24.38	Bill Szippl	\N	other	\N		\N	53	128910-75520
421	553	5	2025-06-27 12:45:34.558	David Rose	\N	other	\N		\N	41	128910-75500
423	1078	1	2025-06-27 12:45:34.558	David Rose	\N	other	\N		\N	41	128910-75500
424	1175	2	2025-06-27 12:45:34.558	David Rose	\N	other	\N		\N	41	128910-75500
425	1044	1	2025-06-27 12:45:34.558	David Rose	\N	other	\N		\N	41	128910-75500
426	1209	1	2025-06-27 12:45:34.558	David Rose	\N	other	\N		\N	41	128910-75500
427	1175	2	2025-06-27 12:45:34.558	Bill Szippl	\N	other	\N		\N	2	121150-75500
428	1078	1	2025-06-27 12:45:34.558	Bill Szippl	\N	other	\N		\N	2	121150-75500
429	1209	1	2025-06-27 12:45:34.558	Bill Szippl	\N	other	\N		\N	2	121150-75500
430	39	1	2025-06-27 12:45:34.558	Bill Szippl	\N	other	\N		\N	2	121150-75500
431	1044	1	2025-06-27 12:45:34.558	Bill Szippl	\N	other	\N		\N	2	121150-75500
432	553	18	2025-06-27 12:55:27.532	Matt McMillen	\N	other	\N		\N	23	128910-75500
433	936	3	2025-06-27 12:55:27.532	Matt McMillen	\N	other	\N		\N	23	128910-75500
434	105	1	2025-06-27 14:26:18.175	Matt McMillen	\N	other	\N		\N	1	128910-75500
435	847	1	2025-06-27 14:26:18.175	Matt McMillen	\N	other	\N		\N	1	128910-75500
436	1218	1	2025-06-27 14:27:47.088	Gary Tenwalde	\N	other	\N		\N	53	128910-75500
437	854	1	2025-06-27 14:27:47.088	Garry Sammet	\N	other	\N		\N	34	128910-75500
438	822	1	2025-06-30 00:00:00	Garry Sammet	\N	other	\N		\N	34	122100-75500
440	497	2	2025-06-27 14:27:47.088	Brian Emerick	\N	other	\N		\N	23	128910-75500
441	822	1	2025-07-01 13:38:56.92	Garry Sammet	\N	other	\N		\N	39	128910-75500
442	553	11	2025-07-01 13:38:56.92	Marcus Jackson	\N	other	\N		\N	43	128910-75500
443	363	1	2025-07-01 13:38:56.92	Marcus Jackson	\N	other	\N		\N	43	128910-75500
444	928	1	2025-07-01 13:38:56.92	Other	\N	other	\N	Mike Paugh	\N	53	128915-75500
445	926	1	2025-07-01 13:38:56.92	Other	\N	other	\N	Mike Paugh	\N	53	128915-75500
446	577	1	2025-07-01 13:38:56.92	Other	\N	other	\N	Richard Tordiff	\N	42	128910-75500
447	766	4	2025-07-01 18:59:24.848	Chris Garver	\N	other	\N		\N	43	128910-75500
448	553	12	2025-07-01 18:59:24.848	Brian Emerick	\N	other	\N		\N	23	128910-75500
449	1008	6	2025-07-02 11:46:47.08	Matt McMillen	\N	other	\N		\N	43	128910-75500
450	943	1	2025-07-02 11:46:47.08	Matt McMillen	\N	other	\N		\N	43	128910-75500
451	525	2	2025-07-02 11:46:47.08	Matt Rinehart	\N	other	\N		\N	34	128910-75500
452	765	8	2025-07-02 11:46:47.08	Matt McMillen	\N	other	\N		\N	43	128910-75500
453	822	1	2025-07-02 11:46:47.08	Garry Sammet	\N	other	\N		\N	30	128910-75500
454	1215	3	2025-07-02 14:49:21.665	Brian Emerick	\N	other	\N		\N	23	128910-75500
455	876	1	2025-07-02 14:49:21.665	David Rose	\N	other	\N		\N	49	128910-75500
456	553	7	2025-07-02 14:49:21.665	Matt McMillen	\N	other	\N		\N	43	128910-75500
457	854	1	2025-07-03 17:34:27.732	Marcus Jackson	\N	other	\N		\N	27	128910-75500
458	402	1	2025-07-03 17:34:27.732	David Rose	\N	other	\N		\N	11	128910-75500
459	553	6	2025-07-03 17:34:27.732	Brian Emerick	\N	other	\N		\N	23	128910-75500
460	933	1	2025-07-03 17:37:31.533	Shane Reed	\N	other	\N		\N	23	128910-75520
461	965	1	2025-07-03 17:37:31.533	Marcus Jackson	\N	other	\N		\N	49	128910-75500
462	553	12	2025-07-03 17:37:31.533	Matt McMillen	\N	other	\N		\N	43	128910-75500
463	1198	1	2025-07-03 17:37:31.533	Matt McMillen	\N	other	\N		\N	43	128910-75500
464	597	2	2025-07-03 17:37:31.533	Matt Rinehart	\N	other	\N		\N	51	128910-75500
465	504	2	2025-07-03 17:37:31.533	Matt Rinehart	\N	other	\N		\N	51	128910-75500
466	606	2	2025-07-03 17:37:31.533	Matt Rinehart	\N	other	\N		\N	51	128910-75500
467	1202	2	2025-07-03 17:37:31.533	Matt Rinehart	\N	other	\N		\N	51	128910-75500
468	524	2	2025-07-03 17:37:31.533	Matt Rinehart	\N	other	\N		\N	51	128910-75500
469	1008	1	2025-07-03 17:37:31.533	Brian Emerick	\N	other	\N		\N	23	128910-75500
470	553	6	2025-07-03 17:37:31.533	Brian Emerick	\N	other	\N		\N	23	128910-75500
471	553	12	2025-07-08 14:25:34.466	Marcus Jackson	\N	other	\N		\N	43	128910-75500
472	765	8	2025-07-08 14:25:34.466	Marcus Jackson	\N	other	\N		\N	43	128910-75500
473	822	2	2025-07-08 14:25:34.466	Matt Rinehart	\N	other	\N		\N	39	128910-75500
474	121	2	2025-07-08 14:25:34.466	Marcus Jackson	\N	other	\N		\N	33	128910-75500
476	524	2	2025-07-08 14:49:20.722	Matt Rinehart	\N	other	\N		\N	51	128910-75500
477	504	1	2025-07-08 14:49:20.722	Matt Rinehart	\N	other	\N		\N	51	128910-75500
478	611	1	2025-07-08 14:49:20.722	Matt Rinehart	\N	other	\N		\N	51	128910-75500
479	124	1	2025-07-08 14:49:20.722	Matt McMillen	\N	other	\N		\N	43	128910-75500
480	1202	2	2025-07-08 14:49:20.722	Matt Rinehart	\N	other	\N		\N	34	128910-75500
481	613	2	2025-07-08 14:49:20.722	Matt Rinehart	\N	other	\N		\N	34	128910-75500
482	504	2	2025-07-08 14:49:20.722	Matt Rinehart	\N	other	\N		\N	34	128910-75500
483	524	4	2025-07-08 14:49:20.722	Matt Rinehart	\N	other	\N		\N	34	128910-75500
484	597	2	2025-07-08 14:49:20.722	Matt Rinehart	\N	other	\N		\N	34	128910-75500
485	939	1	2025-07-09 12:19:44.403	Shane Reed	\N	other	\N		\N	11	128910-75500
486	36	4	2025-07-09 12:19:44.403	Timothy Flowers	\N	other	\N		\N	35	128910-75520
487	553	6	2025-07-09 12:19:44.403	Brian Emerick	\N	other	\N		\N	41	128910-75500
488	592	1	2025-07-09 16:04:16.625	Other	\N	other	\N	Eric (IT)	\N	42	128910-75500
489	499	1	2025-07-09 16:04:16.625	Garry Sammet	\N	other	\N		\N	34	128910-75500
490	36	2	2025-07-09 16:04:16.625	Garry Sammet	\N	other	\N		\N	34	128910-75500
491	335	2	2025-07-09 16:04:16.625	Bill Szippl	\N	other	\N		\N	27	128910-75500
492	1158	20	2025-07-10 19:00:42.425	Tom Dulle	\N	other	\N		\N	53	128910-75500
493	939	4	2025-07-11 18:15:52.027	Other	\N	other	\N	Mark Gerdy	\N	3	111420-76200
494	944	4	2025-07-11 18:15:52.027	Other	\N	other	\N	Mark Gerdy	\N	3	111420-76200
495	334	1	2025-07-11 18:15:52.027	Bill Szippl	\N	other	\N		\N	49	128910-75500
496	553	12	2025-07-14 15:02:14.505	Matt McMillen	\N	other	\N		\N	43	128910-75520
497	1159	6	2025-07-14 15:02:14.505	Matt McMillen	\N	other	\N		\N	43	128910-75520
498	1078	1	2025-07-14 15:02:14.505	Bill Szippl	\N	other	\N		\N	41	128910-75500
499	482	4	2025-07-14 15:02:14.505	Bill Szippl	\N	other	\N		\N	41	128910-75500
500	590	1	2025-07-14 15:02:14.505	Other	\N	other	\N	Kody Horstman	\N	28	128910-75500
501	25	1	2025-07-14 15:13:12.913	Barry Musselman	\N	other	\N		\N	27	128910-75500
502	1036	1	2025-07-14 15:13:12.913	Barry Musselman	\N	other	\N		\N	27	128910-75500
503	1161	1	2025-07-14 15:13:12.913	Barry Musselman	\N	other	\N		\N	27	128910-75500
504	510	1	2025-07-14 15:13:12.913	Barry Musselman	\N	other	\N		\N	27	128910-75500
505	757	30	2025-07-14 15:13:12.913	Tom Dulle	\N	other	\N		\N	53	128910-75500
506	1175	24	2025-07-14 15:13:12.913	Bill Szippl	\N	other	\N		\N	28	128910-75500
507	854	2	2025-07-14 15:13:12.913	Bill Szippl	\N	other	\N		\N	28	128910-75500
508	613	1	2025-07-14 15:13:12.913	Other	\N	other	\N	Burgett Eric(IT)	\N	53	121150-75500
509	227	6	2025-07-14 15:13:12.913	Roy Cheney	\N	other	\N		\N	50	128910-75520
510	500	1	2025-07-14 15:13:12.913	Andrew Nichelson	\N	other	\N		\N	2	128910-75500
511	991	100	2025-07-14 15:13:12.913	Matt Rinehart	\N	other	\N		\N	16	128910-75500
512	611	1	2025-07-15 11:51:17.254	Other	\N	other	\N		\N	34	121150-75500
513	608	1	2025-07-15 11:51:17.254	Other	\N	other	\N		\N	34	121150-75500
514	553	4	2025-07-15 11:51:17.254	Marcus Jackson	\N	other	\N		\N	23	128910-75500
515	766	24	2025-07-15 11:51:17.254	Marcus Jackson	\N	other	\N		\N	23	128910-75500
516	285	1	2025-07-17 11:01:50.222	Bill Szippl	\N	other	\N		\N	28	128910-75500
518	876	1	2025-07-17 11:01:50.222	Matt McMillen	\N	other	\N		\N	43	128910-75500
519	924	1	2025-07-17 11:01:50.222	Other	\N	other	\N	Richard Tordiff	\N	34	128910-75500
520	891	1	2025-07-17 11:01:50.222	Other	\N	other	\N	Richard Tordiff	\N	34	128910-75500
521	553	18	2025-07-17 11:19:03.883	Matt McMillen	\N	other	\N		\N	43	128910-75500
522	765	20	2025-07-17 11:19:03.883	Matt McMillen	\N	other	\N		\N	43	128910-75500
523	966	2	2025-07-17 11:19:03.883	Matt McMillen	\N	other	\N		\N	43	128910-75500
524	972	1	2025-07-17 11:52:43.702	Matt Rinehart	\N	other	\N		\N	53	128910-75500
525	972	2	2025-07-17 11:52:43.702	Marcus Jackson	\N	other	\N		\N	53	128910-75500
526	1005	1	2025-07-18 12:14:33.778	Matt McMillen	\N	other	\N		\N	43	128910-75500
527	497	10	2025-07-18 12:23:04.005	Matt McMillen	\N	other	\N		\N	43	128910-75520
528	1217	1	2025-07-18 12:23:04.005	Marcus Jackson	\N	other	\N		\N	43	128910-75500
529	553	3	2025-07-18 12:23:04.005	Matt Rinehart	\N	other	\N		\N	43	128910-75500
530	590	3	2025-07-18 12:23:04.005	Other	\N	other	\N	Eric IT	\N	34	\N
531	994	1	2025-07-18 12:23:04.005	Matt McMillen	\N	other	\N		\N	43	128910-75500
532	1208	1	2025-07-18 12:23:04.005	Matt McMillen	\N	other	\N		\N	43	128910-75500
533	335	2	2025-07-18 12:23:04.005	Matt McMillen	\N	other	\N		\N	43	128910-75500
534	1008	2	2025-07-18 12:39:39.749	Other	\N	other	\N		\N	53	128910-75500
535	876	1	2025-07-18 12:39:39.749	Bill Szippl	\N	other	\N		\N	43	128910-75500
536	248	2	2025-07-18 12:39:39.749	David Rose	\N	other	\N		\N	53	128910-75520
537	288	11	2025-07-18 14:59:57.129	Marcus Jackson	\N	other	\N		\N	43	128910-75500
538	553	12	2025-07-18 14:59:57.129	Marcus Jackson	\N	other	\N		\N	43	128910-75500
539	35	1	2025-07-18 14:59:57.129	Marcus Jackson	\N	other	\N		\N	43	128910-75500
540	1216	2	2025-07-18 14:59:57.129	Marcus Jackson	\N	other	\N		\N	43	128910-75500
541	1229	1	2025-07-23 13:49:16.905	Shane Reed	\N	other	\N		\N	10	128910-75500
542	1005	1	2025-07-23 14:37:41.662	Matt McMillen	\N	other	\N		\N	9	128910-75500
543	822	1	2025-07-23 13:49:16.905	Garry Sammet	\N	other	\N		\N	9	128910-75500
544	1158	30	2025-07-23 14:53:51.52	Tom Dulle	\N	other	\N		\N	3	128910-75500
545	1480	15	2025-07-23 14:53:51.52	Tom Dulle	\N	other	\N		\N	3	128910-75500
546	1005	1	2025-07-23 14:53:51.52	Matt McMillen	\N	other	\N		\N	43	128910-75500
547	149	1	2025-07-23 14:53:51.52	Brian Emerick	\N	other	\N		\N	20	128910-75500
548	178	1	2025-07-23 14:53:51.52	Brian Emerick	\N	other	\N		\N	20	128910-75500
549	890	8	2025-07-23 15:59:27.285	Roy Cheney	\N	other	\N		\N	50	128910-75500
550	986	5	2025-07-23 17:08:18.934	Brian Emerick	\N	other	\N		\N	20	128910-75500
551	35	1	2025-07-23 17:08:18.934	Brian Emerick	\N	other	\N		\N	20	128910-75500
552	1159	3	2025-07-23 17:08:18.934	Brian Emerick	\N	other	\N		\N	20	128910-75500
553	767	8	2025-07-23 17:08:18.934	Brian Emerick	\N	other	\N		\N	20	128910-75500
554	553	5	2025-07-23 17:08:18.934	Brian Emerick	\N	other	\N		\N	20	128910-75500
555	936	1	2025-07-23 17:08:18.934	Brian Emerick	\N	other	\N		\N	20	128910-75500
556	806	125	2025-07-23 17:08:18.934	Matt Rinehart	\N	other	\N		\N	28	128910-75500
557	344	1	2025-07-23 17:08:18.934	David Rose	\N	other	\N		\N	9	128910-75500
558	367	1	2025-07-23 17:08:18.934	David Rose	\N	other	\N		\N	9	128910-75500
559	1179	2	2025-07-23 17:08:18.934	David Rose	\N	other	\N		\N	9	128910-75500
560	608	3	2025-07-23 17:08:18.934	Other	\N	other	\N	Charge to Richard Tordiff	\N	12	128910-75500
561	482	2	2025-07-23 17:08:18.934	Bill Szippl	\N	other	\N		\N	49	128910-75500
562	857	1	2025-07-23 17:08:18.934	Bill Szippl	\N	other	\N		\N	49	128910-75500
563	290	1	2025-07-23 17:08:18.934	Bill Szippl	\N	other	\N		\N	49	128910-75500
564	1479	1	2025-07-23 17:08:18.934	Marcus Jackson	\N	other	\N		\N	37	128910-75500
565	90	2	2025-07-23 17:08:18.934	Marcus Jackson	\N	other	\N		\N	37	128910-75500
566	1175	2	2025-07-23 17:57:40.411	David Rose	\N	other	\N		\N	2	128910-75500
568	1026	1	2025-07-23 17:57:40.411	Other	\N	other	\N	Charge to Adam Jordan	\N	30	128910-75500
569	1175	2	2025-07-23 18:19:47.4	David Rose	\N	other	\N		\N	1	128910-75500
570	305	1	2025-07-23 18:19:47.4	David Rose	\N	other	\N		\N	1	128910-75500
571	305	1	2025-07-23 18:19:47.4	David Rose	\N	other	\N		\N	2	128910-75500
572	1202	4	2025-07-23 18:19:47.4	Matt Rinehart	\N	other	\N		\N	28	128910-75500
573	1450	3	2025-07-23 18:19:47.4	Other	\N	other	\N		\N	2	128910-75500
574	553	18	2025-07-23 18:26:38.085	Matt McMillen	\N	other	\N		\N	43	128910-75500
575	178	1	2025-07-23 18:26:38.085	Matt McMillen	\N	other	\N		\N	43	128910-75500
576	1005	1	2025-07-23 18:26:38.085	Matt McMillen	\N	other	\N		\N	43	121150-75500
577	1362	2	2025-07-23 18:26:38.085	Tom Dulle	\N	other	\N		\N	3	128910-75500
578	986	2	2025-07-23 18:51:58.524	Brian Emerick	\N	other	\N		\N	20	128910-75500
579	703	1	2025-07-23 18:51:58.524	Brian Emerick	\N	other	\N		\N	20	128910-75500
580	35	2	2025-07-23 18:51:58.524	Brian Emerick	\N	other	\N		\N	20	128910-75500
581	606	2	2025-07-23 18:51:58.524	Brian Emerick	\N	other	\N		\N	20	128910-75500
582	155	2	2025-07-23 18:51:58.524	Duane Roby	\N	other	\N		\N	53	128910-75520
583	168	2	2025-07-23 18:51:58.524	Duane Roby	\N	other	\N		\N	53	128910-75520
584	178	1	2025-07-23 18:51:58.524	Brian Emerick	\N	other	\N		\N	20	128910-75500
585	1101	1	2025-07-23 19:05:07.348	Garry Sammet	\N	other	\N		\N	43	128910-75500
586	1202	1	2025-07-23 19:05:07.348	Garry Sammet	\N	other	\N		\N	43	128910-75500
587	1013	3	2025-07-23 19:05:07.348	Garry Sammet	\N	other	\N		\N	43	128910-75500
588	252	4	2025-07-23 19:05:07.348	Garry Sammet	\N	other	\N		\N	43	128910-75500
589	254	2	2025-07-23 19:05:07.348	Garry Sammet	\N	other	\N		\N	43	128910-75500
590	940	1	2025-07-23 19:05:07.348	Garry Sammet	\N	other	\N		\N	43	128910-75500
591	40	1	2025-07-23 19:05:07.348	Garry Sammet	\N	other	\N		\N	43	128910-75500
592	928	1	2025-07-23 19:05:07.348	Garry Sammet	\N	other	\N		\N	43	128910-75500
593	803	250	2025-07-23 19:15:29.559	Matt Rinehart	\N	other	\N		\N	28	128910-75500
594	504	2	2025-07-23 19:15:29.559	Matt Rinehart	\N	other	\N		\N	28	128910-75500
595	482	2	2025-07-23 19:15:29.559	David Rose	\N	other	\N		\N	43	128910-75500
596	1217	3	2025-07-23 19:15:29.559	David Rose	\N	other	\N		\N	43	128910-75500
597	1218	1	2025-07-23 19:15:29.559	David Rose	\N	other	\N		\N	43	128910-75500
598	304	1	2025-07-23 19:15:29.559	David Rose	\N	other	\N		\N	43	128910-75500
599	1026	3	2025-07-23 19:15:29.559	David Rose	\N	other	\N		\N	43	128910-75500
600	482	1	2025-07-23 19:15:29.559	Garry Sammet	\N	other	\N		\N	43	128910-75500
601	237	1	2025-07-23 19:15:29.559	Garry Sammet	\N	other	\N		\N	43	128910-75500
602	124	1	2025-07-23 19:15:29.559	Matt McMillen	\N	other	\N		\N	43	128910-75500
603	553	3	2025-07-23 19:15:29.559	Other	\N	other	\N		\N	30	128910-75500
604	767	24	2025-07-23 19:15:29.559	Other	\N	other	\N		\N	30	128910-75500
605	767	24	2025-07-23 19:15:29.559	Tom Dulle	\N	other	\N		\N	37	128910-75500
606	1479	1	2025-07-23 19:15:29.559	Tom Dulle	\N	other	\N		\N	37	128910-75500
607	599	1	2025-07-23 19:15:29.559	Marcus Jackson	\N	other	\N		\N	43	128910-75500
608	229	6	2025-07-23 14:57:11.753	Matt McMillen	\N	other	\N		\N	53	128910-75500
609	1506	1	2025-07-24 19:10:11.438	Matt McMillen	\N	other	\N		\N	53	128910-75500
610	608	1	2025-07-24 19:08:52.475	Other	\N	other	\N	Charge to Kody Horstman	\N	51	128910-75500
611	1202	1	2025-07-24 19:10:11.438	Matt Rinehart	\N	other	\N		\N	28	128910-75500
612	1202	2	2025-07-24 19:08:52.475	Matt Rinehart	\N	other	\N	WOW	\N	27	128910-75500
613	553	3	2025-07-24 19:10:11.438	Brian Emerick	\N	other	\N		\N	20	128910-75500
614	1479	1	2025-07-24 19:10:11.438	Brian Emerick	\N	other	\N		\N	20	128910-75500
615	767	24	2025-07-24 19:10:11.438	Brian Emerick	\N	other	\N		\N	20	128910-75500
616	765	4	2025-07-24 19:10:11.438	Brian Emerick	\N	other	\N		\N	20	128910-75500
617	363	1	2025-07-24 19:08:52.475	Tom Dulle	\N	other	\N		\N	37	128910-75500
618	124	1	2025-07-24 19:08:52.475	Matt McMillen	\N	other	\N		\N	43	128910-75500
619	613	10	2025-07-24 19:14:38.897	Matt McMillen	\N	other	\N		\N	53	128910-75500
620	553	12	2025-07-24 19:14:38.897	Matt McMillen	\N	other	\N		\N	53	128910-75500
621	767	72	2025-07-24 19:14:38.897	Matt McMillen	\N	other	\N		\N	53	128910-75500
622	771	1	2025-07-24 19:14:38.897	Matt McMillen	\N	other	\N		\N	53	128910-75500
623	772	1	2025-07-24 19:14:38.897	Matt McMillen	\N	other	\N		\N	53	128910-75500
624	1044	1	2025-07-24 19:14:38.897	Other	\N	other	\N	Mark Gerding	\N	3	111420-76200
625	230	24	2025-07-24 19:14:38.897	Other	\N	other	\N	Mark Gerding	\N	3	111420-76200
626	767	48	2025-07-24 19:52:34.774	Matt McMillen	\N	other	\N		\N	53	128910-75500
627	553	12	2025-07-24 19:52:34.774	Matt McMillen	\N	other	\N		\N	53	128910-75500
628	1191	1	2025-07-24 19:52:34.774	Matt McMillen	\N	other	\N		\N	53	128910-75500
630	90	7	2025-07-29 04:00:00	Matt McMillen	\N	other	\N	Building is Lakeview 	\N	53	128910-75500
631	334	3	2025-07-29 04:00:00	Matt McMillen	\N	other	\N	Building is Lakeview 	\N	53	128910-75500
629	597	1	2025-07-29 04:00:00	Matt Rinehart	\N	other	\N		\N	27	128910-75500
632	212	2	2025-07-29 13:32:18.333	Garry Sammet	\N	other	\N		\N	27	128910-75500
633	221	2	2025-07-29 13:32:18.333	Garry Sammet	\N	other	\N		\N	27	128910-75500
634	822	1	2025-07-29 15:49:16.769	Garry Sammet	\N	other	\N		\N	37	128910-75500
635	1008	18	2025-07-29 16:37:17.497	Matt McMillen	\N	other	\N		\N	49	128910-75500
636	125	2	2025-07-29 16:37:17.497	Matt McMillen	\N	other	\N		\N	49	128910-75500
637	1008	12	2025-07-29 16:42:37.139	Matt McMillen	\N	other	\N		\N	49	128910-75500
638	288	6	2025-07-29 16:42:37.139	Matt McMillen	\N	other	\N		\N	49	128910-75500
639	608	4	2025-07-29 16:48:31.25	Marcus Jackson	\N	other	\N		\N	30	128910-75500
640	124	1	2025-07-29 16:48:31.25	Marcus Jackson	\N	other	\N		\N	30	128910-75500
641	1507	1	2025-07-29 17:01:48.531	Brian Emerick	\N	other	\N		\N	20	128910-75500
642	345	1	2025-07-29 17:01:48.531	Brian Emerick	\N	other	\N		\N	20	128910-75500
643	399	1	2025-07-29 17:01:48.531	Brian Emerick	\N	other	\N		\N	20	128910-75500
644	274	2	2025-07-29 17:01:48.531	Brian Emerick	\N	other	\N		\N	20	128910-75500
645	936	1	2025-07-29 17:01:48.531	Brian Emerick	\N	other	\N		\N	20	128910-75500
646	553	17	2025-07-29 18:17:03.737	Matt Rinehart	\N	other	\N		\N	49	128910-75500
647	363	3	2025-07-29 18:17:03.737	Matt Rinehart	\N	other	\N		\N	49	128910-75500
648	363	1	2025-07-29 18:17:03.737	Matt McMillen	\N	other	\N		\N	43	128910-75500
649	822	1	2025-07-29 18:17:03.737	Shane Reed	\N	other	\N		\N	30	128910-75500
650	124	1	2025-07-29 18:17:03.737	Matt Rinehart	\N	other	\N		\N	49	128910-75500
651	767	48	2025-07-29 18:17:03.737	Matt Rinehart	\N	other	\N		\N	49	128910-75500
652	274	4	2025-07-30 12:15:22.899	Brian Emerick	\N	other	\N		\N	20	128910-75500
653	936	1	2025-07-30 12:15:22.899	Brian Emerick	\N	other	\N		\N	20	128910-75500
654	780	1	2025-07-30 12:15:22.899	Brian Emerick	\N	other	\N		\N	20	128910-75500
655	652	1	2025-07-30 12:15:22.899	Matt Rinehart	\N	other	\N		\N	28	128910-75500
656	655	1	2025-07-30 12:15:22.899	Garry Sammet	\N	other	\N		\N	50	128910-75500
657	171	18	2025-07-30 12:35:01.523	Garry Sammet	\N	other	\N		\N	28	128910-75500
658	890	1	2025-07-30 12:35:01.523	Garry Sammet	\N	other	\N		\N	28	128910-75500
659	345	1	2025-07-30 12:35:01.523	Marcus Jackson	\N	other	\N		\N	49	128910-75500
660	344	3	2025-07-30 12:35:01.523	Marcus Jackson	\N	other	\N		\N	49	128910-75500
661	553	6	2025-07-30 12:35:01.523	Brian Emerick	\N	other	\N		\N	20	128910-75500
662	345	1	2025-07-30 12:35:01.523	Brian Emerick	\N	other	\N		\N	20	128910-75500
663	344	1	2025-07-30 12:35:01.523	Brian Emerick	\N	other	\N		\N	20	128910-75500
664	767	24	2025-07-30 12:35:01.523	Brian Emerick	\N	other	\N		\N	20	128910-75500
665	890	2	2025-07-30 12:35:01.523	Shane Reed	\N	other	\N		\N	28	128910-75500
666	575	1	2025-07-30 12:35:01.523	Shane Reed	\N	other	\N		\N	28	128910-75500
667	1008	2	2025-07-30 12:35:01.523	Matt McMillen	\N	other	\N		\N	49	128910-75500
668	1223	5	2025-07-30 12:35:01.523	Matt McMillen	\N	other	\N		\N	49	128910-75500
669	1192	1	2025-07-30 12:35:01.523	Matt Rinehart	\N	other	\N		\N	28	128910-75500
670	496	1	2025-07-30 12:35:01.523	Matt Rinehart	\N	other	\N		\N	28	128910-75500
671	305	2	2025-07-30 19:39:10.98	David Rose	\N	other	\N		\N	24	128910-75500
672	274	1	2025-07-30 19:39:10.98	David Rose	\N	other	\N		\N	24	128910-75500
673	1175	2	2025-07-30 19:39:10.98	David Rose	\N	other	\N		\N	24	128910-75500
674	270	1	2025-07-30 19:39:10.98	David Rose	\N	other	\N		\N	24	128910-75500
675	584	1	2025-07-30 19:47:30.138	Tom Dulle	\N	other	\N		\N	12	128910-75500
676	702	1	2025-07-30 19:47:30.138	Shane Reed	\N	other	\N		\N	20	128910-75500
677	1188	1	2025-07-30 19:51:39.852	David Rose	\N	other	\N		\N	43	128910-75500
678	1175	1	2025-07-30 19:51:39.852	David Rose	\N	other	\N		\N	43	128910-75500
679	1450	1	2025-07-30 19:51:39.852	David Rose	\N	other	\N		\N	43	128910-75500
680	240	1	2025-07-30 19:51:39.852	David Rose	\N	other	\N		\N	43	128910-75500
681	274	2	2025-07-31 04:00:00	Brian Emerick	\N	other	\N		\N	20	128910-75500
682	854	1	2025-07-31 04:00:00	Shane Reed	\N	other	\N	Building Name: HVAC	\N	53	128910-75500
683	345	1	2025-07-31 19:28:23.337	David Rose	\N	other	\N		\N	20	128910-75500
684	367	2	2025-07-31 19:28:23.337	David Rose	\N	other	\N		\N	20	128910-75500
685	1192	1	2025-07-31 19:32:41.349	Brian Emerick	\N	other	\N		\N	20	128910-75500
686	553	3	2025-07-31 19:32:41.349	Brian Emerick	\N	other	\N		\N	20	128910-75500
687	1545	1	2025-07-31 19:38:56.472	Matt McMillen	\N	other	\N		\N	49	128910-75500
688	553	18	2025-07-31 19:38:56.472	Matt McMillen	\N	other	\N		\N	49	128910-75500
689	174	6	2025-07-31 19:38:56.472	Matt McMillen	\N	other	\N		\N	49	128910-75500
690	553	35	2025-07-31 19:44:26.521	Other	\N	other	\N	Non documented parts taken	\N	53	128910-75500
691	1103	3	2025-08-05 12:01:16.974	Marcus Jackson	\N	other	\N		\N	49	128910-75500
692	1104	1	2025-08-05 12:01:16.974	Marcus Jackson	\N	other	\N		\N	49	128910-75500
693	613	1	2025-08-05 12:04:07.005	Other	\N	other	\N	eric (it)	\N	26	128910-75500
694	274	1	2025-08-05 12:04:07.005	Brian Emerick	\N	other	\N		\N	20	128910-75500
695	1479	1	2025-08-05 12:04:07.005	Brian Emerick	\N	other	\N		\N	20	128910-75500
696	1545	1	2025-08-05 12:04:07.005	Matt McMillen	\N	other	\N		\N	37	128910-75500
697	504	1	2025-08-05 12:08:12.895	Matt Rinehart	\N	other	\N		\N	28	128910-75520
698	772	2	2025-08-05 12:09:24.752	Matt McMillen	\N	other	\N		\N	43	128910-75500
699	274	1	2025-08-05 12:18:40.007	Brian Emerick	\N	other	\N		\N	20	128910-75500
700	767	24	2025-08-05 12:18:40.007	Brian Emerick	\N	other	\N		\N	20	128910-75500
701	1519	1	2025-08-05 12:21:23.026	Marcus Jackson	\N	other	\N		\N	33	128910-75500
702	965	1	2025-08-05 12:21:23.026	Marcus Jackson	\N	other	\N		\N	33	128910-75500
703	1450	1	2025-08-05 12:21:23.026	Marcus Jackson	\N	other	\N		\N	33	128910-75500
704	505	1	2025-08-05 12:21:23.026	Garry Sammet	\N	other	\N		\N	50	128910-75500
705	608	1	2025-08-05 12:21:23.026	Garry Sammet	\N	other	\N		\N	50	128910-75500
706	1202	1	2025-08-05 12:21:23.026	Garry Sammet	\N	other	\N		\N	50	128910-75500
707	1073	1	2025-08-05 12:31:28.857	David Rose	\N	other	\N		\N	49	128910-75500
708	1179	8	2025-08-05 12:31:28.857	David Rose	\N	other	\N		\N	49	128910-75500
709	359	2	2025-08-05 12:31:28.857	David Rose	\N	other	\N		\N	49	128910-75500
710	360	1	2025-08-05 12:31:28.857	David Rose	\N	other	\N		\N	49	128910-75500
711	42	2	2025-08-05 12:31:28.857	David Rose	\N	other	\N		\N	49	128910-75500
712	332	1	2025-08-05 12:31:28.857	David Rose	\N	other	\N		\N	49	128910-75500
713	1510	1	2025-08-05 19:50:39.222	Matt Rinehart	\N	other	\N		\N	41	128910-75500
714	606	3	2025-08-05 19:50:39.222	Matt Rinehart	\N	other	\N		\N	41	128910-75500
715	1526	4	2025-08-05 19:50:39.222	Matt Rinehart	\N	other	\N		\N	41	128910-75500
716	706	2	2025-08-05 19:50:39.222	Tom Dulle	\N	other	\N		\N	12	128910-75500
717	982	1	2025-08-06 19:09:53.353	Other	\N	other	\N	Charge out to Richard Tordiff. Cost Center is the IT Department	\N	3	\N
718	608	1	2025-08-06 19:09:53.353	Barry Musselman	\N	other	\N	WoW Cafe	\N	27	128910-75500
719	1528	2	2025-08-06 19:09:53.353	Shane Reed	\N	other	\N		\N	11	128910-75500
720	1280	1	2025-08-06 19:09:53.353	Shane Reed	\N	other	\N		\N	11	128910-75500
721	988	6	2025-08-06 19:09:53.353	Shane Reed	\N	other	\N		\N	11	128910-75500
722	304	1	2025-08-06 19:33:33.164	David Rose	\N	other	\N		\N	49	128910-75500
723	1175	2	2025-08-06 19:33:33.164	David Rose	\N	other	\N		\N	49	128910-75500
724	274	3	2025-08-06 19:33:33.164	David Rose	\N	other	\N		\N	49	128910-75500
725	553	2	2025-08-06 19:33:33.164	Brian Emerick	\N	other	\N		\N	23	128910-75500
726	1191	1	2025-08-06 19:33:33.164	Garry Sammet	\N	other	\N		\N	34	128910-75500
727	499	1	2025-08-06 19:33:33.164	Matt Rinehart	\N	other	\N		\N	53	128910-75500
728	498	2	2025-08-06 19:33:33.164	Matt Rinehart	\N	other	\N		\N	53	128910-75500
729	274	4	2025-08-07 19:37:13.001	Brian Emerick	\N	other	\N		\N	37	128910-75500
730	822	1	2025-08-07 19:40:33.634	Shane Reed	\N	other	\N		\N	53	128910-75500
731	1189	1	2025-08-07 19:40:33.634	David Rose	\N	other	\N		\N	20	128910-75500
732	206	1	2025-08-07 19:40:33.634	David Rose	\N	other	\N		\N	20	128910-75500
733	1175	1	2025-08-07 19:40:33.634	David Rose	\N	other	\N		\N	20	128910-75500
734	677	5	2025-08-07 19:40:33.634	David Rose	\N	other	\N		\N	20	128910-75500
735	989	2	2025-08-07 19:40:33.634	David Rose	\N	other	\N		\N	20	128910-75500
736	274	1	2025-08-07 19:40:33.634	David Rose	\N	other	\N		\N	20	128910-75500
737	333	1	2025-08-07 19:48:26.484	Brian Emerick	\N	other	\N		\N	20	128910-75500
738	1179	8	2025-08-07 19:48:26.484	Brian Emerick	\N	other	\N		\N	20	128910-75500
739	608	2	2025-08-07 19:48:26.484	Matt Rinehart	\N	other	\N		\N	49	128910-75500
740	936	2	2025-08-07 19:48:26.484	Matt Rinehart	\N	other	\N		\N	49	128910-75500
741	675	1	2025-08-07 19:48:26.484	Matt Rinehart	\N	other	\N		\N	49	128910-75500
742	1192	2	2025-08-12 16:51:34.168	Matt Rinehart	\N	other	\N		\N	28	128910-75500
743	1525	1	2025-08-12 16:51:34.168	Brian Emerick	\N	other	\N		\N	24	128910-75500
744	363	1	2025-08-12 16:58:39.722	Brian Emerick	\N	other	\N		\N	43	128910-75500
745	274	1	2025-08-12 16:58:39.722	Brian Emerick	\N	other	\N		\N	30	128910-75500
746	37	4	2025-08-12 16:58:39.722	Garry Sammet	\N	other	\N		\N	34	128910-75500
747	597	1	2025-08-12 16:58:39.722	Matt Rinehart	\N	other	\N		\N	16	128910-75500
748	1202	1	2025-08-12 16:58:39.722	Matt Rinehart	\N	other	\N		\N	16	128910-75500
749	504	1	2025-08-12 16:58:39.722	Matt Rinehart	\N	other	\N		\N	16	128910-75500
750	598	1	2025-08-12 16:58:39.722	Matt Rinehart	\N	other	\N		\N	16	128910-75500
751	1192	1	2025-08-12 17:12:35.914	Matt Rinehart	\N	other	\N		\N	9	128910-75500
752	613	1	2025-08-12 17:12:35.914	Matt Rinehart	\N	other	\N		\N	9	128910-75500
753	553	18	2025-08-12 17:12:35.914	Matt McMillen	\N	other	\N		\N	49	128910-75500
754	347	1	2025-08-12 17:12:35.914	Matt McMillen	\N	other	\N		\N	49	128910-75500
755	105	3	2025-08-12 17:12:35.914	Matt McMillen	\N	other	\N		\N	49	128910-75500
756	1018	2	2025-08-12 17:12:35.914	Other	\N	other	\N		\N	40	128910-75500
757	1192	2	2025-08-12 17:12:35.914	Matt Rinehart	\N	other	\N		\N	28	128910-75500
758	553	6	2025-08-12 17:12:35.914	Brian Emerick	\N	other	\N		\N	23	128910-75500
759	400	1	2025-08-12 17:12:35.914	David Rose	\N	other	\N		\N	2	128910-75500
760	345	1	2025-08-12 17:12:35.914	David Rose	\N	other	\N		\N	2	128910-75500
761	1564	1	2025-08-12 17:38:46.146	David Rose	\N	other	\N		\N	2	128910-75500
762	363	3	2025-08-12 17:38:46.146	Matt McMillen	\N	other	\N		\N	14	128910-75500
763	928	1	2025-08-12 17:38:46.146	Garry Sammet	\N	other	\N		\N	2	128910-75500
764	254	2	2025-08-12 17:38:46.146	Garry Sammet	\N	other	\N		\N	2	128910-75500
765	333	1	2025-08-12 17:49:48.727	David Rose	\N	other	\N		\N	9	128910-75500
766	1175	1	2025-08-12 17:49:48.727	David Rose	\N	other	\N		\N	9	128910-75500
767	1189	1	2025-08-12 17:49:48.727	David Rose	\N	other	\N		\N	9	128910-75500
768	206	1	2025-08-12 17:49:48.727	David Rose	\N	other	\N		\N	9	128910-75500
769	333	2	2025-08-12 17:49:48.727	David Rose	\N	other	\N		\N	9	128910-75500
770	1189	2	2025-08-12 17:49:48.727	David Rose	\N	other	\N		\N	9	128910-75500
771	206	2	2025-08-12 17:49:48.727	David Rose	\N	other	\N		\N	9	128910-75500
772	1175	2	2025-08-12 17:49:48.727	David Rose	\N	other	\N		\N	9	128910-75500
773	767	2	2025-08-12 17:49:48.727	Brian Emerick	\N	other	\N		\N	24	128910-75500
774	768	1	2025-08-12 17:49:48.727	Brian Emerick	\N	other	\N		\N	24	128910-75500
775	333	1	2025-08-12 19:43:48.255	Student Worker	\N	other	\N		\N	1	128910-75500
776	1188	1	2025-08-12 19:43:48.255	Student Worker	\N	other	\N		\N	1	128910-75500
777	206	1	2025-08-12 19:43:48.255	Student Worker	\N	other	\N		\N	1	128910-75500
778	1175	1	2025-08-12 19:43:48.255	Student Worker	\N	other	\N		\N	1	128910-75500
779	61	1	2025-08-12 19:43:48.255	Other	\N	other	\N	No name given	\N	23	128910-75500
780	59	1	2025-08-12 19:43:48.255	Other	\N	other	\N	No name given	\N	23	128910-75500
781	1198	1	2025-08-12 19:43:48.255	Other	\N	other	\N	No name given	\N	23	128910-75500
782	329	1	2025-08-12 19:43:48.255	Other	\N	other	\N	No name given	\N	23	128910-75500
783	333	1	2025-08-12 19:43:48.255	Other	\N	other	\N	No name given	\N	23	128910-75500
784	553	3	2025-08-12 19:48:39.567	Brian Emerick	\N	other	\N		\N	30	128910-75500
785	553	5	2025-08-12 19:48:39.567	Brian Emerick	\N	other	\N		\N	23	128910-75500
786	1044	1	2025-08-12 19:48:39.567	Matt McMillen	\N	other	\N		\N	9	128910-75500
787	812	1	2025-08-12 19:48:39.567	Other	\N	other	\N	Eric from IT	\N	50	\N
788	677	2	2025-08-12 19:48:39.567	Garry Sammet	\N	other	\N		\N	43	128910-75500
789	318	1	2025-08-13 17:09:15.539	Matt Rinehart	\N	other	\N	Outside Lights	\N	53	128910-75500
790	973	1	2025-08-13 17:09:15.539	Chris Garver	\N	other	\N		\N	43	128910-75500
791	965	1	2025-08-13 17:09:15.539	Chris Garver	\N	other	\N		\N	43	128910-75500
792	1216	1	2025-08-13 17:09:15.539	Michael Crouse	\N	other	\N		\N	18	128910-75500
793	965	2	2025-08-13 17:49:23.243	Other	\N	other	\N	Adam Jordan to Stadium Concessions	\N	53	128910-75500
794	1519	1	2025-08-13 17:49:23.243	Other	\N	other	\N	Adam Jordan to Stadium Concessions	\N	53	128910-75500
795	744	1	2025-08-13 17:49:23.243	Other	\N	other	\N	Adam Jordan to Stadium Concessions	\N	53	128910-75500
796	1375	1	2025-08-13 17:49:23.243	Other	\N	other	\N	Adam Jordan to Stadium Concessions	\N	53	128910-75500
797	1556	4	2025-08-13 17:49:23.243	Brian Emerick	\N	other	\N		\N	14	128910-75500
798	1557	1	2025-08-13 17:49:23.243	Brian Emerick	\N	other	\N		\N	14	128910-75500
799	1565	48	2025-08-13 17:49:23.243	Shane Reed	\N	other	\N		\N	18	128910-75500
800	231	48	2025-08-13 17:49:23.243	Shane Reed	\N	other	\N		\N	18	128910-75500
801	1574	2	2025-08-13 18:57:00.344	Brian Emerick	\N	other	\N		\N	14	128910-75500
802	540	2	2025-08-13 19:04:58.982	Other	\N	other	\N		\N	53	\N
803	1216	2	2025-08-13 19:04:58.982	Other	\N	other	\N		\N	53	\N
804	1528	2	2025-08-13 19:04:58.982	Other	\N	other	\N		\N	53	\N
805	965	1	2025-08-14 12:09:50.564	Other	\N	other	\N	Wendy Bechtol	\N	49	\N
806	462	1	2025-08-14 12:09:50.564	David Rose	\N	other	\N	Building is RX	\N	53	128910-75500
807	511	5	2025-08-14 12:09:50.564	David Rose	\N	other	\N	Building is RX	\N	53	128910-75500
808	7	5	2025-08-14 12:09:50.564	David Rose	\N	other	\N	Building is RX	\N	53	128910-75500
809	910	1	2025-08-14 12:09:50.564	Shane Reed	\N	other	\N	Building just says "Paint" and the name just says "Shane"	\N	53	128910-75500
810	866	1	2025-08-14 12:09:50.564	Michael Crouse	\N	other	\N		\N	35	128910-75500
811	1507	1	2025-08-18 12:02:17.886	Brian Emerick	\N	other	\N		\N	20	128910-75500
812	568	1	2025-08-18 12:02:17.886	Matt Rinehart	\N	other	\N		\N	53	128910-75500
813	1601	2	2025-08-18 12:17:02.507	Michael Crouse	\N	other	\N		\N	33	128910-75500
814	1602	2	2025-08-18 12:17:02.507	Michael Crouse	\N	other	\N		\N	33	128910-75500
815	50	3	2025-08-18 12:20:08.326	Other	\N	other	\N	Charge out to Adam Jordan	\N	35	\N
816	1026	6	2025-08-18 12:20:08.326	Other	\N	other	\N	Charge out to Adam Jordan	\N	35	\N
817	1510	1	2025-08-18 12:20:08.326	Garry Sammet	\N	other	\N		\N	22	128910-75500
818	208	2	2025-08-18 12:28:37.778	Garry Sammet	\N	other	\N		\N	50	128910-75500
819	204	2	2025-08-18 12:28:37.778	Garry Sammet	\N	other	\N		\N	50	128910-75500
820	254	2	2025-08-18 12:28:37.778	Garry Sammet	\N	other	\N		\N	50	128910-75500
821	252	5	2025-08-18 12:28:37.778	Garry Sammet	\N	other	\N		\N	50	128910-75500
822	514	2	2025-08-18 12:28:37.778	Garry Sammet	\N	other	\N		\N	50	128910-75500
823	520	4	2025-08-18 12:28:37.778	Garry Sammet	\N	other	\N		\N	50	128910-75500
824	250	5	2025-08-18 12:41:14.717	Garry Sammet	\N	other	\N		\N	50	128910-75500
825	939	1	2025-08-18 12:41:14.717	Matt Rinehart	\N	other	\N		\N	28	128910-75500
826	1603	1	2025-08-18 12:52:28.826	Brian Emerick	\N	other	\N		\N	41	128910-75500
827	159	4	2025-08-18 13:05:03.839	Barry Musselman	\N	other	\N		\N	27	128910-75500
828	261	4	2025-08-18 13:05:03.839	Barry Musselman	\N	other	\N		\N	27	128910-75500
829	1195	1	2025-08-18 13:06:38.806	David Rose	\N	other	\N		\N	9	128910-75500
830	62	1	2025-08-18 13:06:38.806	David Rose	\N	other	\N		\N	9	128910-75500
831	1564	2	2025-08-18 13:06:38.806	David Rose	\N	other	\N		\N	26	128910-75500
832	1179	10	2025-08-19 13:01:42.093	David Rose	\N	other	\N		\N	9	128910-75500
833	288	4	2025-08-19 13:01:42.093	David Rose	\N	other	\N		\N	9	128910-75500
834	333	1	2025-08-19 13:01:42.093	David Rose	\N	other	\N		\N	43	128910-75500
835	1188	1	2025-08-19 13:01:42.093	David Rose	\N	other	\N		\N	43	128910-75500
836	240	1	2025-08-19 13:01:42.093	David Rose	\N	other	\N		\N	43	128910-75500
837	1175	1	2025-08-19 13:01:42.093	David Rose	\N	other	\N		\N	43	128910-75500
838	1516	1	2025-08-19 13:01:42.093	Garry Sammet	\N	other	\N		\N	41	128910-75500
839	936	1	2025-08-19 13:01:42.093	Garry Sammet	\N	other	\N		\N	41	128910-75500
840	1202	1	2025-08-19 13:11:26.134	Other	\N	other	\N	No name given	\N	34	128910-75500
841	1554	1	2025-08-19 13:11:26.134	Other	\N	other	\N	No name given	\N	34	128910-75500
842	939	1	2025-08-19 13:11:26.134	Other	\N	other	\N	No name given	\N	34	128910-75500
843	991	75	2025-08-19 13:16:24.161	Other	\N	other	\N	No name and building just says "Campus"	\N	53	\N
844	1507	1	2025-08-19 13:18:48.682	Brian Emerick	\N	other	\N		\N	14	128910-75500
845	1510	1	2025-08-19 13:18:48.682	Other	\N	other	\N	Wendy Bechtol	\N	11	128910-75500
846	1565	4	2025-08-19 13:18:48.682	Other	\N	other	\N	Craig	\N	40	128910-75500
847	867	1	2025-08-19 13:18:48.682	Timothy Flowers	\N	other	\N		\N	53	128910-75520
848	45	1	2025-08-19 13:18:48.682	Timothy Flowers	\N	other	\N		\N	53	128910-75520
849	834	1	2025-08-19 13:18:48.682	Roy Cheney	\N	other	\N		\N	53	128910-75520
850	1216	1	2025-08-27 17:23:16.358	David Rose	\N	other	\N		\N	43	128910-75500
851	147	1	2025-08-27 17:24:27.753	Brian Emerick	\N	other	\N		\N	23	128910-75500
852	359	3	2025-08-27 17:29:08.385	Bill Szippl	\N	other	\N		\N	9	128910-75500
853	361	4	2025-08-27 17:29:08.385	Bill Szippl	\N	other	\N		\N	9	128910-75500
854	1476	4	2025-08-27 17:29:08.385	Bill Szippl	\N	other	\N		\N	9	128910-75500
\.


--
-- Data for Name: parts_pickup; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.parts_pickup (id, part_name, part_number, quantity, supplier, building_id, added_by_id, added_at, picked_up_by_id, picked_up_at, status, notes, tracking_number, po_number, pickup_code) FROM stdin;
10	Textured Vinyl Corner Guard	\N	12	The corner guard store	35	1	2025-04-16 13:32:55.395454	\N	\N	pending	\N	\N	\N	9238
11	Justrite Handle	\N	1	\N	27	1	2025-04-16 14:31:21.476509	22	2025-04-16 14:56:32.937	completed	\N	\N	Andy Nicholson	1360
24	Pillow Block Bearing	3fcp6	4	Grainger	35	1	2025-04-22 18:31:40.211654	28	2025-04-22 18:38:46.317	completed	Central Chiller	\N	\N	2910
23	BX96 belt	459R26	3	Grainger	34	1	2025-04-22 18:28:41.316876	28	2025-04-22 18:38:50.211	completed	Pharmacy	\N	\N	4170
22	Century motor	02434980201	1	SupplyHouse	\N	1	2025-04-22 18:23:22.970626	28	2025-04-22 18:38:53.434	completed	Central Plant Chiller	\N	\N	4349
21	BALDOR General Purpose Motor	\N	1	Grainger	34	1	2025-04-22 16:08:15.35582	28	2025-04-22 18:38:55.972	completed	Pharmacy Chiller	\N	\N	2286
33	Drainage Grate	\N	4	\N	23	1	2025-04-29 11:44:19.873017	2	2025-04-29 11:53:09.886	completed	\N	\N	\N	3150
32	Adams Rite Backset	\N	1	\N	7	1	2025-04-29 11:31:31.10012	22	2025-04-29 11:53:38.65	completed	Andy N.	\N	\N	8167
15	Titanium 225 Welder	\N	1	Harbor freight 	35	1	2025-04-21 11:13:08.479385	7	2025-04-29 11:54:22.345	completed	\N	\N	\N	9882
9	Cabinet Hinges	\N	2	Amazon	38	1	2025-04-15 18:16:03.529556	7	2025-04-29 11:54:34.213	completed	\N	\N	\N	5971
25	RotoZip Cutoff wheel	\N	1	\N	35	1	2025-04-22 18:33:54.872394	7	2025-04-29 11:54:41.972	completed	Andy Nichelson	\N	\N	5927
14	Fast Response Temp Sensor 	\N	2	Supply House	27	1	2025-04-16 17:37:24.728307	28	2025-04-29 11:55:20.936	completed	\N	\N	Chiller	3010
16	Hi Temp Sensor	Seno1960	3	Trane	27	1	2025-04-21 11:16:41.144446	28	2025-04-29 11:55:23.679	completed	\N	\N	\N	1136
26	Filters	\N	12	Koch	38	1	2025-04-23 18:17:34.246524	28	2025-04-29 11:55:29.755	completed	Garry S.	\N	\N	2241
27	Garage door drum	\N	2	\N	35	1	2025-04-24 18:15:47.051844	28	2025-04-29 11:55:34.882	completed	Paint shop garage door	\N	\N	8895
29	Contactor	\N	1	\N	35	1	2025-04-24 19:39:47.609555	28	2025-04-29 11:55:37.577	completed	Stadium Lights	\N	\N	1003
17	Power Cord	CRE081002906	1	\N	27	1	2025-04-21 11:36:57.576795	25	2025-04-29 11:56:24.031	completed	\N	\N	\N	8375
12	Led single remote head	\N	1	All Phase	47	1	2025-04-16 14:32:50.618763	25	2025-04-29 11:56:26.042	completed	\N	\N	\N	4697
13	2x4 LED Fixture	\N	1	\N	4	1	2025-04-16 14:34:11.750635	25	2025-04-29 11:56:30.325	completed	\N	\N	\N	7788
28	Gallon Jug Pumps	\N	32	\N	35	1	2025-04-24 18:17:36.766694	14	2025-04-29 11:57:21.781	completed	Adam Jordan	\N	\N	1693
30	Drain gun cartridge and orings	\N	2	\N	35	1	2025-04-29 11:18:43.021584	27	2025-04-29 11:57:44.807	completed	Barry Musselman	\N	\N	4377
18	U-Joint and snap ring kit	\N	20	Motion Industries	18	1	2025-04-21 11:40:49.923569	27	2025-04-29 11:57:53.187	completed	Jodi Kennedy 	\N	\N	7617
35	Refrigerant recover tank	\N	1	\N	35	1	2025-04-29 11:51:14.47577	7	2025-05-01 11:51:46.327	completed	\N	\N	\N	9974
34	Compressor Oil	\N	1	Grainger	35	1	2025-04-29 11:47:58.908147	7	2025-05-01 11:51:57.819	completed	\N	\N	\N	5966
31	End Bearing plates	\N	2	\N	35	1	2025-04-29 11:21:46.450395	7	2025-05-01 11:52:02.485	completed	Barry Paint Shop	\N	\N	4090
20	Light pole covers	\N	9	\N	35	1	2025-04-21 19:07:47.085022	7	2025-05-01 11:52:07.763	completed	3x5 and 5x7	\N	\N	5682
46	Heater	\N	2	\N	19	1	2025-05-06 19:54:15.38433	\N	\N	pending	Stadium bathroom heater	\N	\N	7774
65	Crete urinal descaler	\N	1	\N	35	1	2025-05-27 11:00:21.0685	\N	\N	pending	\N	\N	\N	5742
66	Hose Barb	GHBM025-018	10	\N	14	1	2025-05-27 11:41:04.812564	\N	\N	pending	\N	\N	\N	2104
67	Towel rack	\N	1	\N	\N	1	2025-05-28 17:09:12.590332	\N	\N	pending	\N	\N	\N	4605
68	Toilet covers	\N	1	\N	18	1	2025-05-28 17:15:34.658369	\N	\N	pending	\N	\N	\N	1687
69	CVA Blinds	\N	25	\N	\N	1	2025-05-29 17:05:34.684599	\N	\N	pending	\N	\N	\N	5519
70	Temperature Control Carel	\N	1	\N	35	1	2025-06-02 11:08:18.114876	\N	\N	pending	Barry M. Wow cooler	\N	\N	2803
71	6x6 wall ceiling register	61617	4	\N	23	1	2025-06-02 18:25:29.874961	\N	\N	pending	\N	\N	\N	7327
72	Access panel	\N	1	\N	22	1	2025-06-02 18:27:17.254533	\N	\N	pending	\N	\N	\N	5930
73	Fan motors	\N	15	\N	23	1	2025-06-02 18:28:50.801363	\N	\N	pending	\N	\N	\N	5667
74	Enclosed pilot relay	\N	5	\N	\N	1	2025-06-03 18:43:59.680844	\N	\N	pending	\N	\N	\N	5905
75	Stove filters	\N	4	\N	27	1	2025-06-04 17:28:57.111805	\N	\N	pending	\N	\N	\N	1203
76	Blinds	\N	2	\N	28	1	2025-06-04 17:30:04.311666	\N	\N	pending	\N	\N	\N	5876
77	Condensate pump	\N	1	\N	22	46	2025-06-10 15:02:47.620751	\N	\N	pending	\N	\N	\N	1724
56	Safety Bollard	\N	1	\N	35	1	2025-05-14 11:25:39.074367	46	2025-06-11 15:24:44.418	completed	Tom Gannon	\N	\N	6830
78	Black wall hooks	\N	220	\N	10	46	2025-06-18 17:41:25.096409	\N	\N	pending	\N	\N	\N	3471
79	Lithonia light trap 2 foot	\N	25	\N	\N	46	2025-06-26 14:26:49.57825	\N	\N	pending	\N	\N	\N	3825
\.


--
-- Data for Name: parts_to_count; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.parts_to_count (id, part_id, assigned_by_id, status, assigned_at, completed_at, notes) FROM stdin;
238	4	1	pending	2025-04-15 18:19:45.397593	\N	\N
239	41	1	pending	2025-04-15 18:19:45.618408	\N	\N
240	70	1	pending	2025-04-15 18:19:45.816986	\N	\N
241	71	1	pending	2025-04-15 18:19:46.019988	\N	\N
242	72	1	pending	2025-04-15 18:19:46.223623	\N	\N
243	86	1	pending	2025-04-15 18:19:46.437713	\N	\N
244	97	1	pending	2025-04-15 18:19:46.642006	\N	\N
245	134	1	pending	2025-04-15 18:19:46.854064	\N	\N
246	135	1	pending	2025-04-15 18:19:47.071492	\N	\N
247	137	1	pending	2025-04-15 18:19:47.281152	\N	\N
248	138	1	pending	2025-04-15 18:19:47.486887	\N	\N
249	139	1	pending	2025-04-15 18:19:47.701115	\N	\N
250	145	1	pending	2025-04-15 18:19:47.905973	\N	\N
251	147	1	pending	2025-04-15 18:19:48.107637	\N	\N
252	178	1	pending	2025-04-15 18:19:48.323395	\N	\N
253	179	1	pending	2025-04-15 18:19:48.53307	\N	\N
254	180	1	pending	2025-04-15 18:19:48.737491	\N	\N
255	181	1	pending	2025-04-15 18:19:48.942965	\N	\N
256	182	1	pending	2025-04-15 18:19:49.143716	\N	\N
257	183	1	pending	2025-04-15 18:19:49.343944	\N	\N
258	185	1	pending	2025-04-15 18:19:49.561014	\N	\N
259	186	1	pending	2025-04-15 18:19:49.767405	\N	\N
260	187	1	pending	2025-04-15 18:19:49.971782	\N	\N
261	188	1	pending	2025-04-15 18:19:50.170394	\N	\N
262	189	1	pending	2025-04-15 18:19:50.377108	\N	\N
263	190	1	pending	2025-04-15 18:19:50.590383	\N	\N
264	215	1	pending	2025-04-15 18:19:50.799379	\N	\N
265	264	1	pending	2025-04-15 18:19:51.00624	\N	\N
266	344	1	pending	2025-04-15 18:19:51.213841	\N	\N
267	347	1	pending	2025-04-15 18:19:51.418987	\N	\N
268	369	1	pending	2025-04-15 18:19:51.637445	\N	\N
269	372	1	pending	2025-04-15 18:19:51.842305	\N	\N
270	377	1	pending	2025-04-15 18:19:52.048168	\N	\N
271	385	1	pending	2025-04-15 18:19:52.25817	\N	\N
272	391	1	pending	2025-04-15 18:19:52.460264	\N	\N
273	396	1	pending	2025-04-15 18:19:52.675116	\N	\N
274	405	1	pending	2025-04-15 18:19:52.874088	\N	\N
275	406	1	pending	2025-04-15 18:19:53.079464	\N	\N
276	407	1	pending	2025-04-15 18:19:53.286123	\N	\N
277	408	1	pending	2025-04-15 18:19:53.549172	\N	\N
278	409	1	pending	2025-04-15 18:19:53.754755	\N	\N
279	410	1	pending	2025-04-15 18:19:53.954378	\N	\N
280	411	1	pending	2025-04-15 18:19:54.155843	\N	\N
281	437	1	pending	2025-04-15 18:19:54.356239	\N	\N
282	468	1	pending	2025-04-15 18:19:54.558571	\N	\N
283	474	1	pending	2025-04-15 18:19:54.768447	\N	\N
284	475	1	pending	2025-04-15 18:19:54.969915	\N	\N
285	477	1	pending	2025-04-15 18:19:55.173861	\N	\N
286	484	1	pending	2025-04-15 18:19:55.387871	\N	\N
287	485	1	pending	2025-04-15 18:19:55.623265	\N	\N
288	486	1	pending	2025-04-15 18:19:55.835014	\N	\N
289	487	1	pending	2025-04-15 18:19:56.040008	\N	\N
290	488	1	pending	2025-04-15 18:19:56.242456	\N	\N
291	504	1	pending	2025-04-15 18:19:56.463404	\N	\N
292	528	1	pending	2025-04-15 18:19:56.672892	\N	\N
293	532	1	pending	2025-04-15 18:19:56.880015	\N	\N
294	545	1	pending	2025-04-15 18:19:57.078066	\N	\N
295	576	1	pending	2025-04-15 18:19:57.274667	\N	\N
296	578	1	pending	2025-04-15 18:19:57.475539	\N	\N
297	581	1	pending	2025-04-15 18:19:57.677739	\N	\N
298	582	1	pending	2025-04-15 18:19:57.884929	\N	\N
299	584	1	pending	2025-04-15 18:19:58.088523	\N	\N
301	628	1	pending	2025-04-15 18:19:58.488514	\N	\N
303	637	1	pending	2025-04-15 18:19:58.899255	\N	\N
304	678	1	pending	2025-04-15 18:19:59.097088	\N	\N
305	690	1	pending	2025-04-15 18:19:59.300728	\N	\N
306	707	1	pending	2025-04-15 18:19:59.504182	\N	\N
307	708	1	pending	2025-04-15 18:19:59.708004	\N	\N
308	709	1	pending	2025-04-15 18:19:59.915548	\N	\N
309	710	1	pending	2025-04-15 18:20:00.12115	\N	\N
310	711	1	pending	2025-04-15 18:20:00.332751	\N	\N
311	712	1	pending	2025-04-15 18:20:00.535762	\N	\N
312	715	1	pending	2025-04-15 18:20:00.750149	\N	\N
313	721	1	pending	2025-04-15 18:20:00.950367	\N	\N
314	722	1	pending	2025-04-15 18:20:01.157876	\N	\N
315	725	1	pending	2025-04-15 18:20:01.359943	\N	\N
316	728	1	pending	2025-04-15 18:20:01.56067	\N	\N
317	731	1	pending	2025-04-15 18:20:01.763239	\N	\N
318	734	1	pending	2025-04-15 18:20:01.962047	\N	\N
319	738	1	pending	2025-04-15 18:20:02.17083	\N	\N
320	739	1	pending	2025-04-15 18:20:02.373736	\N	\N
321	741	1	pending	2025-04-15 18:20:02.57639	\N	\N
322	742	1	pending	2025-04-15 18:20:02.786041	\N	\N
323	744	1	pending	2025-04-15 18:20:03.001697	\N	\N
324	747	1	pending	2025-04-15 18:20:03.204059	\N	\N
325	750	1	pending	2025-04-15 18:20:03.399758	\N	\N
326	754	1	pending	2025-04-15 18:20:03.606742	\N	\N
327	758	1	pending	2025-04-15 18:20:03.823847	\N	\N
328	759	1	pending	2025-04-15 18:20:04.026945	\N	\N
329	760	1	pending	2025-04-15 18:20:04.239584	\N	\N
330	761	1	pending	2025-04-15 18:20:04.445743	\N	\N
331	763	1	pending	2025-04-15 18:20:04.658491	\N	\N
332	768	1	pending	2025-04-15 18:20:04.861986	\N	\N
333	774	1	pending	2025-04-15 18:20:05.069785	\N	\N
334	783	1	pending	2025-04-15 18:20:05.303438	\N	\N
335	788	1	pending	2025-04-15 18:20:05.506465	\N	\N
336	789	1	pending	2025-04-15 18:20:05.719376	\N	\N
337	792	1	pending	2025-04-15 18:20:05.923311	\N	\N
338	799	1	pending	2025-04-15 18:20:06.123985	\N	\N
339	801	1	pending	2025-04-15 18:20:06.328313	\N	\N
340	818	1	pending	2025-04-15 18:20:06.572319	\N	\N
341	824	1	pending	2025-04-15 18:20:06.773789	\N	\N
342	852	1	pending	2025-04-15 18:20:06.971771	\N	\N
343	854	1	pending	2025-04-15 18:20:07.181639	\N	\N
344	855	1	pending	2025-04-15 18:20:07.38616	\N	\N
345	880	1	pending	2025-04-15 18:20:07.587017	\N	\N
346	881	1	pending	2025-04-15 18:20:07.799074	\N	\N
350	905	1	pending	2025-04-15 18:20:08.625453	\N	\N
351	915	1	pending	2025-04-15 18:20:08.833134	\N	\N
352	918	1	pending	2025-04-15 18:20:09.044534	\N	\N
353	919	1	pending	2025-04-15 18:20:09.253276	\N	\N
354	923	1	pending	2025-04-15 18:20:09.456505	\N	\N
355	925	1	pending	2025-04-15 18:20:09.66241	\N	\N
356	927	1	pending	2025-04-15 18:20:09.859669	\N	\N
357	928	1	pending	2025-04-15 18:20:10.064254	\N	\N
358	929	1	pending	2025-04-15 18:20:10.275047	\N	\N
359	930	1	pending	2025-04-15 18:20:10.492391	\N	\N
360	933	1	pending	2025-04-15 18:20:10.701928	\N	\N
361	935	1	pending	2025-04-15 18:20:10.914649	\N	\N
362	945	1	pending	2025-04-15 18:20:11.112887	\N	\N
363	947	1	pending	2025-04-15 18:20:11.330094	\N	\N
364	948	1	pending	2025-04-15 18:20:11.536523	\N	\N
365	949	1	pending	2025-04-15 18:20:11.736318	\N	\N
366	950	1	pending	2025-04-15 18:20:11.939508	\N	\N
367	951	1	pending	2025-04-15 18:20:12.152194	\N	\N
368	952	1	pending	2025-04-15 18:20:12.352647	\N	\N
369	955	1	pending	2025-04-15 18:20:12.552593	\N	\N
370	974	1	pending	2025-04-15 18:20:12.759367	\N	\N
371	980	1	pending	2025-04-15 18:20:12.959637	\N	\N
372	1027	1	pending	2025-04-15 18:20:13.166004	\N	\N
373	1028	1	pending	2025-04-15 18:20:13.36936	\N	\N
374	1029	1	pending	2025-04-15 18:20:13.567424	\N	\N
375	1030	1	pending	2025-04-15 18:20:13.771143	\N	\N
376	1031	1	pending	2025-04-15 18:20:13.986098	\N	\N
377	1032	1	pending	2025-04-15 18:20:14.186277	\N	\N
378	1033	1	pending	2025-04-15 18:20:14.383742	\N	\N
379	1034	1	pending	2025-04-15 18:20:14.586453	\N	\N
380	1035	1	pending	2025-04-15 18:20:14.789633	\N	\N
381	1036	1	pending	2025-04-15 18:20:15.025068	\N	\N
382	1037	1	pending	2025-04-15 18:20:15.225783	\N	\N
383	1038	1	pending	2025-04-15 18:20:15.43448	\N	\N
384	1039	1	pending	2025-04-15 18:20:15.638013	\N	\N
385	1040	1	pending	2025-04-15 18:20:15.839081	\N	\N
386	1041	1	pending	2025-04-15 18:20:16.051866	\N	\N
387	1042	1	pending	2025-04-15 18:20:16.260842	\N	\N
389	1044	1	pending	2025-04-15 18:20:16.668009	\N	\N
390	1045	1	pending	2025-04-15 18:20:16.87586	\N	\N
391	1046	1	pending	2025-04-15 18:20:17.077251	\N	\N
392	1047	1	pending	2025-04-15 18:20:17.282216	\N	\N
393	1048	1	pending	2025-04-15 18:20:17.492918	\N	\N
394	1049	1	pending	2025-04-15 18:20:17.69519	\N	\N
395	1050	1	pending	2025-04-15 18:20:17.900383	\N	\N
397	1052	1	pending	2025-04-15 18:20:18.321481	\N	\N
398	1053	1	pending	2025-04-15 18:20:18.520363	\N	\N
400	1055	1	pending	2025-04-15 18:20:18.918201	\N	\N
402	1057	1	pending	2025-04-15 18:20:19.33652	\N	\N
403	1058	1	pending	2025-04-15 18:20:19.541981	\N	\N
404	1059	1	pending	2025-04-15 18:20:19.758501	\N	\N
405	1060	1	pending	2025-04-15 18:20:19.96111	\N	\N
408	1063	1	pending	2025-04-15 18:20:20.592132	\N	\N
409	1064	1	pending	2025-04-15 18:20:20.812631	\N	\N
410	1065	1	pending	2025-04-15 18:20:21.023503	\N	\N
411	1066	1	pending	2025-04-15 18:20:21.225608	\N	\N
412	1067	1	pending	2025-04-15 18:20:21.438459	\N	\N
413	1068	1	pending	2025-04-15 18:20:21.689237	\N	\N
415	1070	1	pending	2025-04-15 18:20:22.104376	\N	\N
416	1071	1	pending	2025-04-15 18:20:22.323004	\N	\N
418	1073	1	pending	2025-04-15 18:20:22.743344	\N	\N
419	1074	1	pending	2025-04-15 18:20:22.941397	\N	\N
422	1077	1	pending	2025-04-15 18:20:23.55572	\N	\N
423	1078	1	pending	2025-04-15 18:20:23.764835	\N	\N
424	1079	1	pending	2025-04-15 18:20:23.968627	\N	\N
425	1080	1	pending	2025-04-15 18:20:24.169915	\N	\N
427	1082	1	pending	2025-04-15 18:20:24.670577	\N	\N
428	1083	1	pending	2025-04-15 18:20:24.904453	\N	\N
429	1084	1	pending	2025-04-15 18:20:25.108448	\N	\N
430	1085	1	pending	2025-04-15 18:20:25.33391	\N	\N
431	1086	1	pending	2025-04-15 18:20:25.540096	\N	\N
432	1087	1	pending	2025-04-15 18:20:25.745965	\N	\N
433	1088	1	pending	2025-04-15 18:20:25.948628	\N	\N
434	1089	1	pending	2025-04-15 18:20:26.153428	\N	\N
435	1090	1	pending	2025-04-15 18:20:26.3575	\N	\N
436	1091	1	pending	2025-04-15 18:20:26.56316	\N	\N
437	1092	1	pending	2025-04-15 18:20:26.773539	\N	\N
439	1094	1	pending	2025-04-15 18:20:27.175132	\N	\N
440	1095	1	pending	2025-04-15 18:20:27.38122	\N	\N
441	1096	1	pending	2025-04-15 18:20:27.585185	\N	\N
442	1097	1	pending	2025-04-15 18:20:27.781491	\N	\N
443	1098	1	pending	2025-04-15 18:20:27.987801	\N	\N
444	1099	1	pending	2025-04-15 18:20:28.194144	\N	\N
445	1100	1	pending	2025-04-15 18:20:28.403641	\N	\N
446	1101	1	pending	2025-04-15 18:20:28.606119	\N	\N
447	1102	1	pending	2025-04-15 18:20:28.810527	\N	\N
448	1103	1	pending	2025-04-15 18:20:29.01906	\N	\N
449	1104	1	pending	2025-04-15 18:20:29.2158	\N	\N
450	1105	1	pending	2025-04-15 18:20:29.417062	\N	\N
451	1106	1	pending	2025-04-15 18:20:29.614831	\N	\N
452	1107	1	pending	2025-04-15 18:20:29.815249	\N	\N
453	1108	1	pending	2025-04-15 18:20:30.022056	\N	\N
454	1109	1	pending	2025-04-15 18:20:30.220942	\N	\N
455	1110	1	pending	2025-04-15 18:20:30.423519	\N	\N
456	1111	1	pending	2025-04-15 18:20:30.642145	\N	\N
458	1113	1	pending	2025-04-15 18:20:31.053441	\N	\N
459	1114	1	pending	2025-04-15 18:20:31.258223	\N	\N
460	1115	1	pending	2025-04-15 18:20:31.456445	\N	\N
462	1117	1	pending	2025-04-15 18:20:31.869669	\N	\N
463	1118	1	pending	2025-04-15 18:20:32.077779	\N	\N
464	1119	1	pending	2025-04-15 18:20:32.279806	\N	\N
465	1120	1	pending	2025-04-15 18:20:32.479982	\N	\N
466	1121	1	pending	2025-04-15 18:20:32.680527	\N	\N
483	965	1	completed	2025-05-16 11:36:52.987457	2025-05-16 13:22:30.242	\N
482	956	1	completed	2025-05-16 11:36:52.780007	2025-06-17 11:58:58.311	\N
481	837	1	completed	2025-05-16 11:36:52.545067	2025-06-17 11:59:00.782	\N
480	745	1	completed	2025-05-16 11:36:52.321488	2025-06-17 11:59:04.798	\N
479	703	1	completed	2025-05-16 11:36:52.105178	2025-06-17 11:59:07.316	\N
478	331	1	completed	2025-05-16 11:36:51.900465	2025-06-17 11:59:33.47	\N
477	311	1	completed	2025-05-16 11:36:51.685688	2025-06-17 11:59:40.233	\N
476	299	1	completed	2025-05-16 11:36:51.427846	2025-06-17 12:02:28.851	\N
475	1148	1	completed	2025-04-15 18:20:34.50967	2025-06-17 12:03:49.258	\N
474	1147	1	completed	2025-04-15 18:20:34.30012	2025-06-17 12:04:25.18	\N
472	1145	1	completed	2025-04-15 18:20:33.891683	2025-06-17 12:05:46.664	\N
471	1144	1	completed	2025-04-15 18:20:33.687036	2025-06-17 12:06:50.803	\N
473	1146	1	completed	2025-04-15 18:20:34.104186	2025-06-17 12:08:14.08	\N
470	1143	1	completed	2025-04-15 18:20:33.4886	2025-06-17 12:10:09.544	\N
468	1123	1	completed	2025-04-15 18:20:33.090702	2025-06-17 12:10:30.192	\N
467	1122	1	completed	2025-04-15 18:20:32.891086	2025-06-17 12:21:05.721	\N
\.


--
-- Data for Name: reset_flags; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.reset_flags (key, value, reset_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sessions (sid, sess, expire) FROM stdin;
uJs8T-R7ti-Ravm-rtj_B9WbN7_l4wOC	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-09-11T15:17:45.404Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":1,"username":"admin","name":"Michael Gierhart","role":"admin"}}	2025-09-11 15:18:02
wBCzC5gGK57HiGQ4DjI12Wj_8XheVO4J	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-09-05T12:42:07.128Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":1,"username":"admin","name":"Michael Gierhart","role":"admin"}}	2025-09-06 01:57:37
f9wNeRBIW-9dltUk4i7VVbMXrhDB0UuF	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-09-25T13:54:58.060Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":1,"username":"admin","name":"Michael Gierhart","role":"admin"}}	2025-10-02 12:11:14
vs0nFn3kW9zFS7RXzPIO4k7cMv2p5gaA	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-08-07T14:32:48.288Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":46,"username":"Student","name":"Student Worker","role":"student"}}	2025-09-18 19:26:28
rnKTDYSxU5aipepNid4Os4hNqP1-Gw3z	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-09-18T13:28:25.475Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":46,"username":"Student","name":"Student Worker","role":"student"}}	2025-09-19 01:58:12
RimSWam51QEUzs70gjqBLtQIsmbfvth4	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-08-20T19:28:25.063Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":46,"username":"Student","name":"Student Worker","role":"student"}}	2025-09-28 19:37:59
7o4FYxDG2KEZMj2kBUh_N2_zZQJV226f	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-09-20T17:37:03.265Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":1,"username":"admin","name":"Michael Gierhart","role":"admin"}}	2025-09-29 19:23:36
ISwwchl5JGRF9zwQWOPg_GBwz4ETg5ww	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-09-25T13:23:48.285Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":1,"username":"admin","name":"Michael Gierhart","role":"admin"}}	2025-09-28 10:30:11
USrYj2XY3CD__1qK7_ucYfqL2eQCYeLo	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-09-18T11:32:15.327Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":1,"username":"admin","name":"Michael Gierhart","role":"admin"}}	2025-09-24 17:22:38
ceDkGVXmKWeKPBrzQhc2KkL7DxjDkdLz	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-07-11T13:39:30.395Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":46,"username":"Student","name":"Student Worker","role":"student"}}	2025-09-23 04:33:13
piMHw02PLoHHbMMvg3XL4xMW2kkxMSOY	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-08-06T12:58:08.442Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":46,"username":"Student","name":"Student Worker","role":"student"}}	2025-09-03 12:45:27
TZdYbreTDlr8ntjhY8t_KmB355w7G3Rf	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-07-17T16:41:43.099Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":1,"username":"admin","name":"Michael Gierhart","role":"admin"}}	2025-09-03 14:52:17
\.


--
-- Data for Name: shelves; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.shelves (id, location_id, name, description, active, created_at) FROM stdin;
219	2	Shelf AA7F	Shelf AA7F	t	2025-04-10 17:04:49.44119
220	2	Shelf AA6A	Shelf AA6A	t	2025-04-10 17:04:49.44119
221	2	Shelf AA6B	Shelf AA6B	t	2025-04-10 17:04:49.44119
222	2	Shelf AA6C	Shelf AA6C	t	2025-04-10 17:04:49.44119
223	2	Shelf AA6D	Shelf AA6D	t	2025-04-10 17:04:49.44119
224	2	Shelf AA6E	Shelf AA6E	t	2025-04-10 17:04:49.44119
200	2	Shelf AA10E	Shelf AA10E	t	2025-04-10 17:04:49.44119
201	2	Shelf AA10F	Shelf AA10F	t	2025-04-10 17:04:49.44119
202	2	Shelf AA9A	Shelf AA9A	t	2025-04-10 17:04:49.44119
203	2	Shelf AA9B	Shelf AA9B	t	2025-04-10 17:04:49.44119
204	2	Shelf AA9C	Shelf AA9C	t	2025-04-10 17:04:49.44119
205	2	Shelf AA9D	Shelf AA9D	t	2025-04-10 17:04:49.44119
206	2	Shelf AA9E	Shelf AA9E	t	2025-04-10 17:04:49.44119
207	2	Shelf AA9F	Shelf AA9F	t	2025-04-10 17:04:49.44119
208	2	Shelf AA8A	Shelf AA8A	t	2025-04-10 17:04:49.44119
209	2	Shelf AA8B	Shelf AA8B	t	2025-04-10 17:04:49.44119
210	2	Shelf AA8C	Shelf AA8C	t	2025-04-10 17:04:49.44119
256	1	Shelf Q1	\N	t	2025-04-21 14:11:47.068222
257	1	Shelf Q2	\N	t	2025-04-21 14:12:03.742468
258	1	Shelf Q3	\N	t	2025-04-21 14:12:18.517433
259	1	Shelf Q4	\n	t	2025-04-21 14:12:36.14929
260	1	Shelf Q5	\N	t	2025-04-21 14:12:49.601552
261	1	Shelf Q6	\N	t	2025-04-21 14:13:07.332961
262	1	Shelf  Q7	\N	t	2025-04-21 14:13:19.244692
263	1	Shelf W3	\N	t	2025-04-29 11:37:16.722243
265	1	Shelf M1	\N	t	2025-05-01 18:41:00.05209
266	1	Shelf H3	\N	t	2025-05-12 13:36:28.354724
267	1	Shelf G2	\N	t	2025-05-14 11:56:41.189268
268	1	Shelf G3	\N	t	2025-05-14 11:56:52.459182
269	1	Shelf G4	\N	t	2025-05-14 11:57:01.892276
270	1	Shelf H4	\N	t	2025-05-14 11:57:32.529027
271	1	Shelf I5	\N	t	2025-05-14 11:58:10.815472
272	1	Shelf J5	\N	t	2025-05-14 11:58:46.694992
273	1	Shelf J6	\N	t	2025-05-14 11:58:58.598857
274	1	Shelf L1	\N	t	2025-05-14 11:59:39.11775
275	1	Shelf L2	\N	t	2025-05-14 11:59:49.775193
276	1	Shelf L3	\N	t	2025-05-14 12:00:01.220217
277	1	Shelf L5	\N	t	2025-05-14 12:00:12.64902
278	1	Shelf M2	\N	t	2025-05-14 12:00:31.656099
279	1	Shelf M3	\N	t	2025-05-14 12:00:39.454236
161	1	Shelf A1	Shelf A1	t	2025-04-10 17:04:49.44119
162	1	Shelf A2	Shelf A2	t	2025-04-10 17:04:49.44119
163	1	Shelf A3	Shelf A3	t	2025-04-10 17:04:49.44119
164	1	Shelf A4	Shelf A4	t	2025-04-10 17:04:49.44119
165	1	Shelf B1	Shelf B1	t	2025-04-10 17:04:49.44119
166	1	Shelf D1	Shelf D1	t	2025-04-10 17:04:49.44119
167	1	Shelf E1	Shelf E1	t	2025-04-10 17:04:49.44119
168	1	Shelf F1	Shelf F1	t	2025-04-10 17:04:49.44119
169	1	Shelf G1	Shelf G1	t	2025-04-10 17:04:49.44119
170	1	Shelf H1	Shelf H1	t	2025-04-10 17:04:49.44119
171	1	Shelf H2	Shelf H2	t	2025-04-10 17:04:49.44119
172	1	Shelf I1	Shelf I1	t	2025-04-10 17:04:49.44119
173	1	Shelf I2	Shelf I2	t	2025-04-10 17:04:49.44119
174	1	Shelf I3	Shelf I3	t	2025-04-10 17:04:49.44119
175	1	Shelf I4	Shelf I4	t	2025-04-10 17:04:49.44119
176	1	Shelf J1	Shelf J1	t	2025-04-10 17:04:49.44119
177	1	Shelf J2	Shelf J2	t	2025-04-10 17:04:49.44119
178	1	Shelf J3	Shelf J3	t	2025-04-10 17:04:49.44119
179	1	Shelf J4	Shelf J4	t	2025-04-10 17:04:49.44119
180	1	Shelf K1	Shelf K1	t	2025-04-10 17:04:49.44119
181	1	Shelf K2	Shelf K2	t	2025-04-10 17:04:49.44119
182	1	Shelf K3	Shelf K3	t	2025-04-10 17:04:49.44119
183	1	Shelf K4	Shelf K4	t	2025-04-10 17:04:49.44119
184	1	Shelf AA12A	Shelf AA12A	t	2025-04-10 17:04:49.44119
185	1	Shelf AA12B	Shelf AA12B	t	2025-04-10 17:04:49.44119
186	1	Shelf AA12C	Shelf AA12C	t	2025-04-10 17:04:49.44119
187	1	Shelf AA12D	Shelf AA12D	t	2025-04-10 17:04:49.44119
188	1	Shelf AA12E	Shelf AA12E	t	2025-04-10 17:04:49.44119
189	1	Shelf AA12F	Shelf AA12F	t	2025-04-10 17:04:49.44119
190	1	Shelf AA11A	Shelf AA11A	t	2025-04-10 17:04:49.44119
191	1	Shelf AA11B	Shelf AA11B	t	2025-04-10 17:04:49.44119
192	1	Shelf AA11C	Shelf AA11C	t	2025-04-10 17:04:49.44119
193	1	Shelf AA11D	Shelf AA11D	t	2025-04-10 17:04:49.44119
194	1	Shelf AA11E	Shelf AA11E	t	2025-04-10 17:04:49.44119
195	1	Shelf AA11F	Shelf AA11F	t	2025-04-10 17:04:49.44119
196	1	Shelf AA10A	Shelf AA10A	t	2025-04-10 17:04:49.44119
197	1	Shelf AA10B	Shelf AA10B	t	2025-04-10 17:04:49.44119
198	1	Shelf AA10C	Shelf AA10C	t	2025-04-10 17:04:49.44119
199	1	Shelf AA10D	Shelf AA10D	t	2025-04-10 17:04:49.44119
211	1	Shelf AA8D	Shelf AA8D	t	2025-04-10 17:04:49.44119
212	1	Shelf AA8E	Shelf AA8E	t	2025-04-10 17:04:49.44119
213	1	Shelf AA8F	Shelf AA8F	t	2025-04-10 17:04:49.44119
214	1	Shelf AA7A	Shelf AA7A	t	2025-04-10 17:04:49.44119
215	1	Shelf AA7B	Shelf AA7B	t	2025-04-10 17:04:49.44119
216	1	Shelf AA7C	Shelf AA7C	t	2025-04-10 17:04:49.44119
217	1	Shelf AA7D	Shelf AA7D	t	2025-04-10 17:04:49.44119
218	1	Shelf AA7E	Shelf AA7E	t	2025-04-10 17:04:49.44119
225	1	Shelf AA6F	Shelf AA6F	t	2025-04-10 17:04:49.44119
226	1	Shelf AA5A	Shelf AA5A	t	2025-04-10 17:04:49.44119
227	1	Shelf AA5B	Shelf AA5B	t	2025-04-10 17:04:49.44119
228	1	Shelf AA5C	Shelf AA5C	t	2025-04-10 17:04:49.44119
229	1	Shelf AA5D	Shelf AA5D	t	2025-04-10 17:04:49.44119
230	1	Shelf AA5E	Shelf AA5E	t	2025-04-10 17:04:49.44119
231	1	Shelf AA5F	Shelf AA5F	t	2025-04-10 17:04:49.44119
232	1	Shelf AA4A	Shelf AA4A	t	2025-04-10 17:04:49.44119
233	1	Shelf AA4B	Shelf AA4B	t	2025-04-10 17:04:49.44119
234	1	Shelf AA4C	Shelf AA4C	t	2025-04-10 17:04:49.44119
235	1	Shelf AA4D	Shelf AA4D	t	2025-04-10 17:04:49.44119
236	1	Shelf AA4E	Shelf AA4E	t	2025-04-10 17:04:49.44119
237	1	Shelf AA4F	Shelf AA4F	t	2025-04-10 17:04:49.44119
238	1	Shelf AA3A	Shelf AA3A	t	2025-04-10 17:04:49.44119
239	1	Shelf AA3B	Shelf AA3B	t	2025-04-10 17:04:49.44119
240	1	Shelf AA3C	Shelf AA3C	t	2025-04-10 17:04:49.44119
241	1	Shelf AA3D	Shelf AA3D	t	2025-04-10 17:04:49.44119
242	1	Shelf AA3E	Shelf AA3E	t	2025-04-10 17:04:49.44119
243	1	Shelf AA3F	Shelf AA3F	t	2025-04-10 17:04:49.44119
244	1	Shelf AA2A	Shelf AA2A	t	2025-04-10 17:04:49.44119
245	1	Shelf AA2B	Shelf AA2B	t	2025-04-10 17:04:49.44119
246	1	Shelf AA2C	Shelf AA2C	t	2025-04-10 17:04:49.44119
247	1	Shelf AA2D	Shelf AA2D	t	2025-04-10 17:04:49.44119
248	1	Shelf AA2E	Shelf AA2E	t	2025-04-10 17:04:49.44119
249	1	Shelf AA2F	Shelf AA2F	t	2025-04-10 17:04:49.44119
250	1	Shelf AA1A	Shelf AA1A	t	2025-04-10 17:04:49.44119
251	1	Shelf AA1B	Shelf AA1B	t	2025-04-10 17:04:49.44119
252	1	Shelf AA1C	Shelf AA1C	t	2025-04-10 17:04:49.44119
253	1	Shelf AA1D	Shelf AA1D	t	2025-04-10 17:04:49.44119
254	1	Shelf AA1E	Shelf AA1E	t	2025-04-10 17:04:49.44119
255	1	Shelf AA1F	Shelf AA1F	t	2025-04-10 17:04:49.44119
280	1	Shelf N1	\N	t	2025-05-14 12:00:52.823678
281	1	Shelf N2	\N	t	2025-05-14 12:01:00.890738
282	1	Shelf N3	\N	t	2025-05-14 12:01:09.523935
283	1	Shelf N4	\N	t	2025-05-14 12:01:18.632789
284	1	Shelf O1	\N	t	2025-05-14 12:01:29.32358
285	1	Shelf O2	\N	t	2025-05-14 12:01:36.7538
286	1	Shelf O3	\N	t	2025-05-14 12:01:43.905941
287	1	Shelf O4	\N	t	2025-05-14 12:01:53.118517
288	1	Shelf O5	\N	t	2025-05-14 12:02:01.682231
289	1	Shelf P1	\N	t	2025-05-14 12:02:28.285562
290	1	Shelf P2	\N	t	2025-05-14 12:02:36.260726
291	1	Shelf P3	\N	t	2025-05-14 12:02:47.556595
292	1	Shelf P4	\N	t	2025-05-14 12:03:01.460575
293	1	Shelf P5	\N	t	2025-05-14 12:03:08.202057
294	1	Shelf P6	\N	t	2025-05-14 12:03:17.938613
295	1	Shelf P7	\N	t	2025-05-14 12:03:26.972031
296	1	Shelf Q7	\N	t	2025-05-14 12:04:08.006694
297	1	Shelf R1	\N	t	2025-05-14 12:04:29.533375
298	1	Shelf R2	\N	t	2025-05-14 12:04:37.599978
299	1	Shelf R3	\N	t	2025-05-14 12:04:50.480774
300	1	Shelf R4	\N	t	2025-05-14 12:04:58.664785
301	1	Shelf 1	Caulk, Tape, Sprays	t	2025-07-02 17:03:37.31698
302	1	Shelf S1	\N	t	2025-07-10 13:51:51.637888
303	1	Shelf S2	\N	t	2025-07-10 13:52:00.557466
304	1	Shelf S3	\N	t	2025-07-10 13:52:07.508809
305	1	Shelf T1	\N	t	2025-07-10 13:52:14.162439
306	1	Shelf T2	\N	t	2025-07-10 13:52:19.557093
307	1	Shelf T3	\N	t	2025-07-10 13:52:25.618956
308	1	Shelf T4	\N	t	2025-07-10 13:52:31.324802
309	1	Shelf E2	\N	t	2025-08-19 11:12:16.57713
\.


--
-- Data for Name: staff_members; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.staff_members (id, name, building_id, cost_center_id, email, phone, active, created_at) FROM stdin;
1	Shelby Higgins	22	176	s-higgins.1@onu.edu	419-772-2034	t	2025-04-24 12:47:47.025
2	April Spence	\N	\N	a-spence@onu.edu	\N	t	2025-04-25 12:43:49.881
3	Emily Baumgartner	\N	170	e-baumgartner.2@onu.edu	\N	t	2025-04-25 12:43:49.943
4	Todd McAlpine	\N	\N	t-mcalpine@onu.edu	\N	t	2025-04-25 12:43:49.989
5	Liannie Parahoo	\N	\N	l-parahoo@onu.edu\r\n	419-772-1861	t	2025-04-25 12:43:50.035
6	Amy Cover	\N	\N	a-cover.1@onu.edu\r\n	419-772-2861	t	2025-04-25 12:43:50.08
7	Heather Graham	\N	\N	h-graham.2@onu.edu\r\n	419-772-2141	t	2025-04-25 12:43:50.128
8	Vi Huff	\N	\N	v-huff@onu.edu\r\n	419-772-2862	t	2025-04-25 12:43:50.175
9	Gianna Mallaro	\N	\N	g-mallaro@onu.edu\r\n	419-772-2141	t	2025-04-25 12:43:50.22
10	Gail Schoonover	\N	\N	g-schoonover@onu.edu\r\n	419-772-2141	t	2025-04-25 12:43:50.266
11	Tonia Twining	\N	\N	t-twining@onu.edu\r\n	419-772-2861	t	2025-04-25 12:43:50.313
12	Preema D'Souza	\N	\N	p-dsouza@onu.edu\r\n	419-772-2181	t	2025-04-25 12:43:50.359
13	Taylor Dumbaugh	\N	\N	t-willeke@onu.edu\r\n	419-772-3784	t	2025-04-25 12:43:50.406
14	Jay Helser	\N	\N	j-helser@onu.edu	\N	t	2025-04-25 12:43:50.457
15	Misti Howell	\N	\N	m-howell.3@onu.edu\r\n	419-772-3784	t	2025-04-25 12:43:50.502
16	Holton Watson	1	\N	h-watson.1@onu.edu\r\n	419-772-2697	t	2025-04-25 12:43:50.547
17	Mark Gerding	\N	\N	m-gerding@onu.edu\r\n	419-772-2815	t	2025-04-25 12:43:50.594
18	Ian Chongson	\N	\N	i-chongson@onu.edu	\N	t	2025-04-25 12:43:50.641
19	Dean Silva	\N	\N	d-silva@onu.edu	\N	t	2025-04-25 12:43:50.688
20	Marwan Alkhweldi	\N	\N	m-alkhweldi@onu.edu\r\n	419-772-2425	t	2025-04-25 12:43:50.734
21	Feng Jao	\N	\N	f-jao@onu.edu\r\n	419-772-2172	t	2025-04-25 12:43:50.786
22	Douglass Degen	\N	\N	d-degen@onu.edu\r\n	419-772-2171	t	2025-04-25 12:43:50.832
23	Jeremy Agozzino	\N	\N	j-agozzino@onu.edu\r\n	419-772-3053	t	2025-04-25 12:43:50.877
24	Richard Miller	\N	\N	r-miller.4@onu.edu\r\n	419-772-2463	t	2025-04-25 12:43:50.924
25	Ronald Deardorff	\N	\N	r-deardorff@onu.edu	\N	t	2025-04-25 12:43:50.969
26	Keith Durkin	\N	\N	k-durkin@onu.edu	\r\n419-772-1037	t	2025-04-25 12:43:51.013
27	Jessica Swanson	\N	\N	j-swanson@onu.edu	\r\n419-772-2136	t	2025-04-25 12:43:51.057
28	Andy Kremyar	\N	\N	a-kremyar.1@onu.edu\r\n	419-772-2001	t	2025-04-25 12:43:51.102
29	Phil Zoladz	\N	\N	p-zoladz@onu.edu\r\n	419-772-2142	t	2025-04-25 12:43:51.146
30	Ann Johnson	\N	\N	a-johnson.17@onu.edu\r\n	419-772-2680	t	2025-04-25 12:43:51.19
31	Robert Carrothers	\N	\N	r-carrothers@onu.edu	\r\n419-772-2139	t	2025-04-25 12:43:51.235
32	Joseph DeLeeuw	\N	\N	j-deleeuw@onu.edu	\r\n419-772-2899	t	2025-04-25 12:43:51.28
33	Megan Kraynok	\N	\N	m-kraynok@onu.edu\r\n	419-772-3126	t	2025-04-25 12:43:51.324
34	Robert Hartman	\N	\N	r-hartman.3@onu.edu	\r\n419-772-2194	t	2025-04-25 12:43:51.368
35	Darrin Belousek	\N	\N	d-belousek@onu.edu	\r\n419-772-2199	t	2025-04-25 12:43:51.412
36	Errol Katayama	\N	\N	e-katayama@onu.edu	\r\n419-772-2204	t	2025-04-25 12:43:51.459
37	Jonathan Spelman	\N	\N	j-spelman@onu.edu	\r\n419-772-3091	t	2025-04-25 12:43:51.505
38	Ray Person	\N	\N	r-person@onu.edu	\r\n419-772-2196	t	2025-04-25 12:43:51.55
39	Hongyu Wu	\N	\N	h-wu@onu.edu	\r\n419-772-2198	t	2025-04-25 12:43:51.595
40	Rory Stauber	\N	\N	r-stauber@onu.edu	\r\n419-772-2197	t	2025-04-25 12:43:51.64
41	Timothy Walsh	\N	\N	t-walsh.1@onu.edu	\r\n419-772-2197	t	2025-04-25 12:43:51.685
42	RobertKemp RobertKemp	\N	\N	r-kemp@onu.edu	\N	t	2025-04-25 12:43:51.729
43	Thomas Williams	5	21	t-williams.3@onu.edu	419-772-2222	t	2025-04-25 12:43:51.775
44	Mike Fannon	5	21	m-fannon.1@onu.edu\r\n	419-772-2222	t	2025-04-25 12:43:51.826
45	Dakota Frazier	5	21	d-frazier.1@onu.edu\r\n	419-772-2222	t	2025-04-25 12:43:51.871
46	Austin Housh	5	21	a-housh@onu.edu\r\n	419-772-2222	t	2025-04-25 12:43:51.918
47	Bill Joseph	5	21	r-joseph.3@onu.edu\r\n	419-772-2521	t	2025-04-25 12:43:51.964
48	Branden Mckibbin	5	21	b-mckibbin@onu.edu\r\n	419-772-2222	t	2025-04-25 12:43:52.013
49	Garrett Molands	5	21	g-molands@onu.edu\r\n	419-777-2061	t	2025-04-25 12:43:52.058
50	Teresa Roberts	5	21	t-roberts@onu.edu\r\n	419-772-3078	t	2025-04-25 12:43:52.102
51	Craig Scott	5	21	c-scott@onu.edu\r\n	419-772-3064	t	2025-04-25 12:43:52.146
52	Gary Seeley	5	21	g-seeley@onu.edu\r\n	419-772-2222	t	2025-04-25 12:43:52.194
53	Jacob Simmons	5	21	j-simmons.4@onu.edu\r\n	419-772-2222	t	2025-04-25 12:43:52.24
54	Joe Williams	5	21	j-williams.15@onu.edu	\N	t	2025-04-25 12:43:52.285
55	Vicki Niese	\N	21	v-niese@onu.edu	\r\n419-772-2057	t	2025-04-25 12:43:52.329
56	Harli Broge	\N	21	h-broge@onu.edu	\r\n419-772-2059	t	2025-04-25 12:43:52.373
58	Mark Ingham	11	\N	m-ingham@onu.edu	\r\n	t	2025-04-25 12:43:52.468
59	Beau Slater	\N	\N	b-slater.1@onu.edu	\r\n419-772-4022	t	2025-04-25 12:43:52.517
60	Aaron Hatem	\N	\N	a-hatem@onu.edu	\r\n419-772-4210	t	2025-04-25 12:43:52.562
61	Sharon Rausch	\N	\N	s-rausch@onu.edu	\r\n419-772-2070	t	2025-04-25 12:43:52.606
62	Christy Beaschler	\N	\N	c-beaschler@onu.edu	\r\n419-772-2084	t	2025-04-25 12:43:52.662
63	John Navin	\N	\N	j-navin@onu.edu	\r\n419-772-2707	t	2025-04-25 12:43:52.712
64	Brian Hofman	\N	\N	b-hofman@onu.edu	\r\n419-772-1878	t	2025-04-25 12:43:52.756
65	Maneesh Shukla	\N	\N	m-shukla@onu.edu	\r\n419-772-2074	t	2025-04-25 12:43:52.801
66	Matt Kutch	\N	\N	m-kutch@onu.edu	\r\n419-772-3929	t	2025-04-25 12:43:52.846
67	Dong Kim	\N	\N	d-kim@onu.edu	\r\n419-772-3539	t	2025-04-25 12:43:52.89
68	Jimmy Wilson	\N	\N	h-wilson.1@onu.edu	\r\n419-772-2608	t	2025-04-25 12:43:52.942
69	Matt Lambdin	\N	\N	m-lambdin@onu.edu	\r\n419-772-2609	t	2025-04-25 12:43:52.988
70	Chao Wen	\N	\N	c-wen@onu.edu	\r\n419-772-3124	t	2025-04-25 12:43:53.032
71	Jin Jung	\N	\N	j-jung@onu.edu	\r\n419-772-2069	t	2025-04-25 12:43:53.085
72	Yan Zhou	\N	\N	y-zhou@onu.edu	\r\n419-772-2075	t	2025-04-25 12:43:53.135
73	Nicole Neely	\N	\N	n-neely@onu.edu	\r\n	t	2025-04-25 12:43:53.179
74	Deann Newman	\N	\N	d-newman.1@onu.edu	\r\n419-772-2749	t	2025-04-25 12:43:53.224
75	Eric Wiechart	\N	\N	e-wiechart.1@onu.edu	\r\n	t	2025-04-25 12:43:53.27
76	Alisa Agozzino	\N	\N	a-agozzino@onu.edu	\r\n419-772-2054	t	2025-04-25 12:43:53.322
77	Jill Cadotte	\N	\N	j-cadotte@onu.edu	\r\n419-772-2083	t	2025-04-25 12:43:53.368
78	Tessa McVey	\N	\N	t-mcvey@onu.edu	\r\n419-772-2753	t	2025-04-25 12:43:53.414
79	Mary Fox	\N	\N	m-fox@onu.edu	\r\n419-772-4213	t	2025-04-25 12:43:53.458
80	Joanne Schieltz	\N	\N	j-schieltz.2@onu.edu	\r\n419-772-4213	t	2025-04-25 12:43:53.502
81	Abe Ambroza	\N	\N	a-ambroza@onu.edu	\r\n419-772-2082	t	2025-04-25 12:43:53.547
82	Shonda Walsh	\N	\N	s-walsh.1@onu.edu	\r\n419-772-2082	t	2025-04-25 12:43:53.597
83	Kristie McHugh	\N	\N	k-mchugh@onu.edu	\r\n419-772-2824	t	2025-04-25 12:43:53.642
84	Jaume Franquesa	\N	\N	j-franquesa@onu.edu	\r\n419-772-2235	t	2025-04-25 12:43:53.689
85	Kevin Ernst	\N	\N	k-ernst@onu.edu	\r\n419-772-4211	t	2025-04-25 12:43:53.734
86	Nadia Shuayto	\N	\N	n-shuayto@onu.edu	\r\n419-772-2079	t	2025-04-25 12:43:53.781
87	David McClough	\N	\N	d-mcclough@onu.edu	\r\n419-772-2080	t	2025-04-25 12:43:53.826
88	David Savino	\N	\N	d-savino@onu.edu	\r\n419-772-2077	t	2025-04-25 12:43:53.872
89	Paul Reffner	\N	\N	p-reffner@onu.edu	\r\n419-772-4212	t	2025-04-25 12:43:53.923
90	Dan Reid	\N	\N	d-reid@onu.edu	\r\n419-772-4212	t	2025-04-25 12:43:53.968
91	Jill Christopher	\N	\N	j-christopher@onu.edu	\r\n419-772-2071	t	2025-04-25 12:43:54.016
92	Jacob Crowley	\N	\N	j-crowley.1@onu.edu	\r\n419-772-2072	t	2025-04-25 12:43:54.062
93	Danielle Foster	\N	\N	d-foster.5@onu.edu	\r\n419-772-2076	t	2025-04-25 12:43:54.106
94	Roy Couch	12	\N	r-couch@onu.edu	\N	t	2025-04-25 12:43:54.15
95	Savien Merkel	\N	\N	s-merkel@onu.edu	\r\n419-772-2100	t	2025-04-25 12:43:54.195
96	Douglas Dowland	\N	\N	d-dowland@onu.edu	\r\n419-772-2422	t	2025-04-25 12:43:54.242
97	Darlene Johnston	\N	\N	d-johnston.1@onu.edu	\r\n419-772-1087	t	2025-04-25 12:43:54.286
98	Jennifer Moore	\N	\N	j-moore.18@onu.edu	\r\n419-772-2105	t	2025-04-25 12:43:54.335
99	Jonathan Pitts	\N	\N	j-pitts@onu.edu	\r\n419-772-2108	t	2025-04-25 12:43:54.38
100	Jennifer Pullen	\N	\N	j-pullen@onu.edu	\r\n419-772-2104	t	2025-04-25 12:43:54.425
101	Bryan Lutz	\N	\N	b-lutz.1@onu.edu	\r\n419-772-2106	t	2025-04-25 12:43:54.469
102	Margaret Cullen	\N	\N	m-cullen@onu.edu	\r\n419-772-2107	t	2025-04-25 12:43:54.514
103	Robert Scott	\N	\N	r-scott@onu.edu	\r\n419-772-2109	t	2025-04-25 12:43:54.559
104	Jodi Boulton	\N	\N	j-boulton.1@onu.edu	\N	t	2025-04-25 12:43:54.606
105	Katie Croft	\N	\N	k-kuchefski@onu.edu	\N	t	2025-04-25 12:43:54.65
106	Joey Ferraro	\N	\N	a-ferraro@onu.edu	\N	t	2025-04-25 12:43:54.694
107	Tyler Jacobs	\N	\N	t-jacobs.1@onu.edu\r\n	419-772-3145	t	2025-04-25 12:43:54.739
108	Michelle Bellman	\N	\N	m-bellman@onu.edu	\r\n419-772-3145	t	2025-04-25 12:43:54.785
109	Randy Meyer	\N	\N	r-meyer.5@onu.edu	\r\n419-772-3142	t	2025-04-25 12:43:54.829
110	Michaelle Bellman	\N	\N	m-bellman@onu.edu\r\n	419-772-3145	t	2025-04-25 12:43:54.877
111	Elaine Garber	\N	\N	e-garber@onu.edu\r\n	419-772-2134	t	2025-04-25 12:43:54.921
112	Christopher McCormick	\N	\N	c-mccormick.4@onu.edu\r\n	419-772-3145	t	2025-04-25 12:43:54.971
113	Kanishka Sen	\N	\N	k-sen@onu.edu	\r\n419-772-2114	t	2025-04-25 12:43:55.018
114	Thomas Finn	\N	\N	t-finn@onu.edu	\r\n419-772-2113	t	2025-04-25 12:43:55.066
115	Robert Waters	\N	\N	r-waters@onu.edu	\r\n419-772-3966	t	2025-04-25 12:43:55.11
116	Russ Crawford	\N	\N	r-crawford.2@onu.edu	\r\n419-772-2081	t	2025-04-25 12:43:55.154
117	Kofi Pepra	\N	\N	k-nsia-pepra@onu.edu	\r\n419-772-2672	t	2025-04-25 12:43:55.201
118	Greg Stone	\N	\N	g-stone@onu.edu	\r\n419-772-2002	t	2025-04-25 12:43:55.246
119	Heather Collins	\N	\N	h-sommer@onu.edu\r\n	419-772-2091	t	2025-04-25 12:43:55.29
120	David Strittmatter	\N	\N	d-strittmatter@onu.edu	\r\n419-772-3562	t	2025-04-25 12:43:55.334
121	Stacey Bretz	\N	\N	s-bretz@onu.edu	\r\n419-772-2130	t	2025-04-25 12:43:55.378
122	Brenda Brackman	\N	\N	b-hoyt@onu.edu	\r\n419-772-3570	t	2025-04-25 12:43:55.423
123	Heidi Leek	\N	\N	h-leek@onu.edu	\r\n419-772-2130	t	2025-04-25 12:43:55.468
124	Allison Martien	\N	\N	a-martien@onu.edu	\r\n419-772-3566	t	2025-04-25 12:43:55.516
125	Melissa Verb	\N	\N	m-verb@onu.edu	\r\n419-772-2534	t	2025-04-25 12:43:55.567
126	Brad Wile	\N	\N	b-wile@onu.edu	\r\n419-772-2131	t	2025-04-25 12:43:55.612
127	Adam Vermillion	\N	\N	a-vermillion.3@onu.edu	\N	t	2025-04-25 12:43:55.656
128	Theresa Hageman	\N	\N	t-hageman@onu.edu	\r\n419-772-2088	t	2025-04-25 12:43:55.701
129	Barbara Meek	\N	\N	b-meek@onu.edu	\r\n419-772-1943	t	2025-04-25 12:43:55.746
130	Paulina Rodgers	\N	\N	p-rodgers.1@onu.edu\r\n	419-772-2101	t	2025-04-25 12:43:55.791
131	Meghan Kosier	\N	\N	m-kosier.1@onu.edu\r\n	419-772-2129	t	2025-04-25 12:43:55.835
132	Ann Schumacher	\N	\N	a-schumacher.2@onu.edu\r\n	419-772-2129	t	2025-04-25 12:43:55.879
133	Cherie Hocanson	\N	\N	c-hocanson@onu.edu\r\n	419-772-2129	t	2025-04-25 12:43:55.93
134	Mark Albert	\N	\N	m-albert@onu.edu\r\n	419-772-2118	t	2025-04-25 12:43:55.975
135	Chuck Schierloh	\N	\N	c-schierloh@onu.edu\r\n	419-772-2118	t	2025-04-25 12:43:56.02
136	Alice Basinger	\N	\N	a-basinger.2@onu.edu\r\n	419-772-2118	t	2025-04-25 12:43:56.066
137	Cathy Dinovo	\N	\N	c-dinovo.1@onu.edu\r\n	419-772-2118	t	2025-04-25 12:43:56.111
138	Michael Hassel	\N	\N	m-hassel@onu.edu\r\n	419-772-2118	t	2025-04-25 12:43:56.156
139	Jessica Cano	\N	\N	j-cano@onu.edu\r\n	419-772-2118	t	2025-04-25 12:43:56.201
140	Lisa Collert	\N	\N	l-collert@onu.edu\r\n	419-772-2118	t	2025-04-25 12:43:56.245
141	Norma Penn	\N	\N	n-penn@onu.edu\r\n	419-772-2118	t	2025-04-25 12:43:56.29
142	Anita Cook	\N	\N	a-cook.2@onu.edu\r\n	419-772-2118	t	2025-04-25 12:43:56.336
143	Jennifer Fredritz	\N	\N	j-fredritz@onu.edu\r\n	419-772-2120	t	2025-04-25 12:43:56.38
144	Janet Engle	\N	\N	j-engle.2@onu.edu\r\n	419-772-2832	t	2025-04-25 12:43:56.425
145	Mike Eicher	\N	\N	m-eicher.3@onu.edu\r\n	419-772-2127	t	2025-04-25 12:43:56.47
146	Mark Olah	\N	\N	m-olah@onu.edu\r\n	419-772-2287	t	2025-04-25 12:43:56.514
147	Shubha Rao	\N	\N	s-gururajarao@onu.edu\r\n	419-772-1695	t	2025-04-25 12:43:56.569
148	Savanna Spitnale	\N	\N	s-spitnale.1@onu.edu\r\n	419-772-1695	t	2025-04-25 12:43:56.612
149	Steve Leonard	\N	\N	s-leonard.1@onu.edu\r\n	419-772-2294	t	2025-04-25 12:43:56.663
150	Sarah Seeley	\N	\N	s-seeley.1@onu.edu\r\n	419-772-1488	t	2025-04-25 12:43:56.708
151	Manoranjan D'Souza	\N	\N	m-dsouza@onu.edu\r\n	419-772-3950	t	2025-04-25 12:43:56.752
152	David Koh	\N	\N	d-koh@onu.edu\r\n	419-772-3956	t	2025-04-25 12:43:56.797
153	Jeffrey Christoff	\N	\N	j-christoff.1@onu.edu\r\n	419-772-2658	t	2025-04-25 12:43:56.842
154	Soph Chrissobolis	\N	\N	s-chrissobolis@onu.edu\r\n	419-772-3954	t	2025-04-25 12:43:56.887
155	Amy Stockert	\N	\N	a-stockert@onu.edu\r\n	419-772-3953	t	2025-04-25 12:43:56.934
156	Edward Ofori	\N	\N	e-ofori@onu.edu\r\n	419-772-3957	t	2025-04-25 12:43:56.979
157	Dalia Abdelhamid	\N	\N	d-abdelhamid@onu.edu\r\n	419-772-2304	t	2025-04-25 12:43:57.024
158	Jenny Donley	\N	\N	j-donley.1@onu.edu\r\n	419-772-2193	t	2025-04-25 12:43:57.069
159	Matthew Francis	\N	\N	m-francis.1@onu.edu\r\n	419-772-1925	t	2025-04-25 12:43:57.12
160	Heather Crozier	\N	\N	h-crozier@onu.edu\r\n	419-772-2182	t	2025-04-25 12:43:57.165
161	Bethany Spieth	\N	\N	b-spieth@onu.edu\r\n	419-772-2473	t	2025-04-25 12:43:57.21
162	Angie Woodruff	\N	\N	a-woodruff.1@onu.edu\r\n	419-772-1895	t	2025-04-25 12:43:57.255
163	Kathleen Baril	\N	\N	k-baril@onu.edu\r\n	419-772-2188	t	2025-04-25 12:43:57.305
164	Mary Finn	\N	\N	m-drzycimski-fin@onu.edu\r\n	419-772-2987	t	2025-04-25 12:43:57.352
165	Olivia Zolciak	\N	\N	o-zolciak@onu.edu\r\n	419-772-2513	t	2025-04-25 12:43:57.398
166	Anita Neupane	\N	\N	a-neupane@onu.edu	419-772-2147	t	2025-04-25 12:43:57.443
167	Heather Nash	\N	\N	h-nash@onu.edu\r\n	419-772-1055	t	2025-04-25 12:43:57.489
168	Jeff Smith	\N	\N	j-smith.4@onu.edu	\r\n419-772-1047	t	2025-04-25 12:43:57.532
169	Katerina Hinkle	\N	\N	k-hinkle.1@onu.edu\r\n	419-772-1966	t	2025-04-25 12:43:57.576
170	Caitlin Kegley	\N	\N	c-kegley@onu.edu	\N	t	2025-04-25 12:43:57.62
171	Russell Decker	\N	\N	r-decker@onu.edu	\r\n	t	2025-04-25 12:43:57.664
172	Elisha Schick	\N	\N	e-schick@onu.edu\r\n	419-772-2363	t	2025-04-25 12:43:57.708
173	Jeff Rieman	\N	\N	j-rieman@onu.edu\r\n	419-772-3100	t	2025-04-25 12:43:57.752
174	Nicholas Kimmel	\N	\N	n-kimmel@onu.edu\r\n	419-772-3970	t	2025-04-25 12:43:57.796
175	Josh Steiner	\N	\N	j-steiner@onu.edu\r\n	419-772-1009	t	2025-04-25 12:43:57.84
176	Nate Conn	\N	\N	n-conn@onu.edu\r\n	419-772-2628	t	2025-04-25 12:43:57.884
177	Jeremiah Garmatter	\N	\N	j-garmatter@onu.edu\r\n	419-772-1074	t	2025-04-25 12:43:57.933
178	Jeffrey Sellick	\N	\N	j-sellick@onu.edu\r\n	419-772-2848	t	2025-04-25 12:43:57.977
179	Chris Anderson	\N	\N	c-anderson.6@onu.edu\r\n	419-772-3512	t	2025-04-25 12:43:58.021
180	Noah Burnett	\N	\N	n-burnett.1@onu.edu\r\n	419-772-1010	t	2025-04-25 12:43:58.068
181	Richard Tordiff	\N	\N	r-tordiff@onu.edu\r\n	419-772-2478	t	2025-04-25 12:43:58.114
182	Jennifer VanWagner	\N	\N	j-vanwagner@onu.edu\r\n	419-772-2494	t	2025-04-25 12:43:58.163
183	Eric Hoffman	\N	\N	e-hoffman.1@onu.edu\r\n	419-772-1033	t	2025-04-25 12:43:58.208
184	Emilee Shaheen	\N	\N	e-shaheen@onu.edu\r\n	419-772-1006	t	2025-04-25 12:43:58.252
185	Andrew McNeal	\N	\N	a-mcneal.1@onu.edu\r\n	419-772-1008	t	2025-04-25 12:43:58.297
186	Lori Goldsmith	\N	\N	l-goldsmith@onu.edu\r\n	419-772-2371	t	2025-04-25 12:43:58.346
187	J. D. Yoder	\N	\N	j-yoder@onu.edu\r\n	419-772-2385	t	2025-04-25 12:43:58.391
188	Jodi Kennedy	\N	\N	j-kennedy@onu.edu\r\n	419-772-1024	t	2025-04-25 12:43:58.436
189	Ben McPheron	\N	\N	b-mcpheron.3@onu.edu\r\n	419-772-2372	t	2025-04-25 12:43:58.48
190	Tricia Profit	\N	\N	t-profit@onu.edu	\r\n419-772-2390	t	2025-04-25 12:43:58.524
191	Laurie Laird	\N	\N	l-laird@onu.edu\r\n	419-772-2421	t	2025-04-25 12:43:58.569
192	Jeff Martz	\N	\N	j-martz.1@onu.edu\r\n	419-772-1113	t	2025-04-25 12:43:58.614
193	Scott Cottle	\N	\N	s-cottle@onu.edu\r\n	419-772-2397	t	2025-04-25 12:43:58.66
194	Ethan Williams	\N	\N	e-williams.13@onu.edu\r\n	419-772-2395	t	2025-04-25 12:43:58.706
195	Lisa Shadle	\N	\N	l-shadle@onu.edu\r\n	419-772-2379	t	2025-04-25 12:43:58.757
196	Blake Hylton	\N	\N	j-hylton@onu.edu\r\n	419-772-2538	t	2025-04-25 12:43:58.801
197	David Sawyers	\N	\N	d-sawyers@onu.edu\r\n	419-772-2382	t	2025-04-25 12:43:58.849
198	Heath LeBlanc	\N	\N	h-leblanc@onu.edu\r\n	419-772-2389	t	2025-04-25 12:43:58.894
199	Jill Dotson	\N	\N	j-dotson.1@onu.edu\r\n	419-772-2370	t	2025-04-25 12:43:58.938
200	Bryan Boulanger	\N	\N	b-boulanger@onu.edu\r\n	419-772-2375	t	2025-04-25 12:43:58.983
201	Louis DiBerardino	\N	\N	l-diberardino@onu.edu\r\n	419-772-4206	t	2025-04-25 12:43:59.029
202	David Johnstone	\N	\N	d-johnstone@onu.edu\r\n	419-772-2373	t	2025-04-25 12:43:59.073
203	Larry Funke	\N	\N	l-funke@onu.edu\r\n	419-772-1862	t	2025-04-25 12:43:59.118
204	Ajmal Khan	\N	\N	m-khan.2@onu.edu\r\n	419-772-3061	t	2025-04-25 12:43:59.163
205	Lauren Logan	\N	\N	l-logan@onu.edu\r\n	419-772-1059	t	2025-04-25 12:43:59.209
206	Farha Jahan	\N	\N	f-jahan@onu.edu\r\n	419-772-2357	t	2025-04-25 12:43:59.254
207	Ian Kropp	\N	\N	i-kropp@onu.edu\r\n	419-772-1016	t	2025-04-25 12:43:59.302
208	Josh Gargac	\N	\N	j-gargac@onu.edu\r\n	419-772-2040	t	2025-04-25 12:43:59.346
209	Saeed Azad	\N	\N	s-azad@onu.edu\r\n	419-772-2348	t	2025-04-25 12:43:59.392
210	Khalid Olimat	\N	\N	k-al-olimat@onu.edu\r\n	419-772-1849	t	2025-04-25 12:43:59.496
211	Abby Clark	\N	\N	a-clark.5@onu.edu\r\n	419-772-1020	t	2025-04-25 12:43:59.541
212	Enass Hriba	\N	\N	e-hriba@onu.edu\r\n	419-772-2388	t	2025-04-25 12:43:59.585
213	Ahmed Ammar	\N	\N	a-ammar@onu.edu\r\n	419-772-1060	t	2025-04-25 12:43:59.631
214	Ramin Rabiee	\N	\N	r-rabiee@onu.edu\r\n	419-772-1071	t	2025-04-25 12:43:59.675
215	Stephany Wolph	\N	\N	s-coffman-wolph@onu.edu\r\n	419-772-1065	t	2025-04-25 12:43:59.72
216	Fan Ye	\N	\N	f-ye@onu.edu\r\n	419-772-2376	t	2025-04-25 12:43:59.764
217	Firas Hassan	\N	\N	f-hassan@onu.edu\r\n	419-772-2393	t	2025-04-25 12:43:59.809
218	Craig Murray	\N	\N	c-murray.3@onu.edu\r\n	419-772-2501	t	2025-04-25 12:43:59.853
219	John Estell	\N	\N	j-estell@onu.edu\r\n	419-772-2317	t	2025-04-25 12:43:59.9
220	Todd France	\N	\N	t-france.1@onu.edu\r\n	419-772-2383	t	2025-04-25 12:43:59.944
221	Mike Hurtig	\N	\N	m-hurtig.1@onu.edu\r\n	419-772-2392	t	2025-04-25 12:43:59.988
222	David Mikesell	\N	\N	d-mikesell@onu.edu\r\n	419-772-2386	t	2025-04-25 12:44:00.034
223	Hui Shen	\N	\N	h-shen@onu.edu\r\n	419-772-2380	t	2025-04-25 12:44:00.079
224	Seyed Ardakani	\N	\N	s-seyedardakani@onu.edu\r\n	419-772-2374	t	2025-04-25 12:44:00.124
225	VaShawn Walker	\N	\N	v-walker@onu.edu	\r\n	t	2025-04-25 12:44:00.169
226	Schuyler Caprella	\N	\N	s-caprella@onu.edu	\r\n	t	2025-04-25 12:44:00.213
227	Derek May	\N	\N	d-may.1@onu.edu	\r\n	t	2025-04-25 12:44:00.257
228	Guy Neal	\N	\N	g-neal@onu.edu	\r\n	t	2025-04-25 12:44:00.301
229	Adam Subasic	\N	\N	a-subasic@onu.edu	\r\n	t	2025-04-25 12:44:00.347
230	Chase Sumner	\N	\N	j-sumner.1@onu.edu	\r\n	t	2025-04-25 12:44:00.398
231	Lynsey Trusty	\N	\N	l-trusty@onu.edu	\r\n419-772-2638	t	2025-04-25 12:44:00.442
232	Michael Kantor	\N	\N	m-kantor@onu.edu\r\n	419-772-2603	t	2025-04-25 12:44:00.489
233	Michelle Wilson	\N	\N	m-wilson.6@onu.edu\r\n	419-772-2443	t	2025-04-25 12:44:00.562
234	Kurt Wilson	\N	\N	k-wilson.1@onu.edu\r\n	419-772-2559	t	2025-04-25 12:44:00.606
235	Chanda West	\N	\N	c-west@onu.edu	\r\n419-772-2439	t	2025-04-25 12:44:00.652
236	Scott Swanson	\N	\N	s-swanson@onu.edu\r\n	419-772-3134	t	2025-04-25 12:44:00.699
237	Krisi Hatem	\N	\N	k-hatem@onu.edu	\r\n419-772-4215	t	2025-04-25 12:44:00.744
238	Kourtney Wilson	\N	\N	k-wilson.6@onu.edu	\r\n419-772-2725	t	2025-04-25 12:44:00.788
239	Jeff Coleman	\N	\N	j-coleman@onu.edu	\r\n419-772-2693	t	2025-04-25 12:44:00.834
240	Ron Beaschler	\N	\N	r-beaschler@onu.edu	\r\n419-772-2453	t	2025-04-25 12:44:00.879
241	Jon Tropf	\N	\N	j-tropf.1@onu.edu	\r\n419-772-1497	t	2025-04-25 12:44:00.925
242	Neal Young	\N	\N	n-young.3@onu.edu	\r\n419-772-2454	t	2025-04-25 12:44:00.97
243	Benjamin Tierney	\N	\N	b-tierney.1@onu.edu	\r\n419-772-2558	t	2025-04-25 12:44:01.015
244	Jason Maus	\N	\N	j-maus@onu.edu	\r\n419-772-2451	t	2025-04-25 12:44:01.06
245	Erik Richards	\N	\N	e-richards.4@onu.edu	\r\n419-772-3132	t	2025-04-25 12:44:01.104
246	Austin Veltman	\N	\N	a-veltman@onu.edu	\r\n419-772-3132	t	2025-04-25 12:44:01.15
247	Chad Bucci	\N	\N	c-bucci@onu.edu	\r\n419-772-2761	t	2025-04-25 12:44:01.194
248	Gene Stechschulte	\N	\N	e-stechschulte@onu.edu	\r\n419-772-2442	t	2025-04-25 12:44:01.24
249	Sophie Windover	\N	\N	s-windover@onu.edu	\r\n419-772-3118	t	2025-04-25 12:44:01.287
250	Will Buelsing	\N	\N	w-buelsing@onu.edu	\r\n419-772-2481	t	2025-04-25 12:44:01.334
251	Erin Chrissobolis	\N	\N	e-chrissobolis@onu.edu	\r\n419-772-2726	t	2025-04-25 12:44:01.38
252	Ryan Cronin	\N	\N	r-cronin@onu.edu	\r\n419-772-1092	t	2025-04-25 12:44:01.424
253	Kadie Hempfling	\N	\N	k-hempfling.1@onu.edu	\r\n419-772-2446	t	2025-04-25 12:44:01.468
254	Hunter Noteware	\N	\N	h-noteware@onu.edu	\r\n419-772-2442	t	2025-04-25 12:44:01.514
255	Mallory Weininger	\N	\N	m-weininger@onu.edu	\r\n419-772-2451	t	2025-04-25 12:44:01.558
256	Taylor Specht	\N	\N	t-biggs-specht@onu.edu	\r\n419-772-1070	t	2025-04-25 12:44:01.604
257	Nate Kaffenbarger	\N	\N	n-kaffenbarger@onu.edu	\r\n419-772-3923	t	2025-04-25 12:44:01.648
258	Seth Owings	\N	\N	s-owings@onu.edu	\r\n419-772-1192	t	2025-04-25 12:44:01.692
259	Damon Spaeth	\N	\N	d-spaeth@onu.edu	\r\n419-772-1192	t	2025-04-25 12:44:01.738
260	Margo Vandeveld	\N	\N	m-vandeveld@onu.edu	\r\n419-772-3076	t	2025-04-25 12:44:01.782
261	Chris Matejka	\N	\N	c-matejka@onu.edu	\r\n419-772-4274	t	2025-04-25 12:44:01.827
262	Nat Laurent	\N	\N	n-stlaurent@onu.edu	\r\n419-772-1025	t	2025-04-25 12:44:01.875
263	Mark Huelsman	\N	\N	m-huelsman.1@onu.edu	\r\n419-772-3508	t	2025-04-25 12:44:01.922
264	Tom Simmons	\N	\N	t-simmons@onu.edu	\r\n419-772-2450	t	2025-04-25 12:44:01.967
265	Karen Beery	\N	\N	k-beery@onu.edu	\r\n419-772-2444	t	2025-04-25 12:44:02.013
266	Summer Collins	\N	\N	s-collins.5@onu.edu	\r\n419-772-2459	t	2025-04-25 12:44:02.059
267	Tim Glon	\N	\N	t-glon@onu.edu	\r\n419-772-2046	t	2025-04-25 12:44:02.104
268	Toma Hainline	\N	\N	t-hainline@onu.edu	\r\n419-772-2449	t	2025-04-25 12:44:02.149
269	Sean Swisher	\N	\N	s-swisher@onu.edu	\r\n419-772-2449	t	2025-04-25 12:44:02.195
270	Molly Amidon	\N	\N	m-amidon@onu.edu	\r\n419-772-3509	t	2025-04-25 12:44:02.253
271	Jason Fisher	\N	\N	j-fisher.13@onu.edu	\r\n419-772-3509	t	2025-04-25 12:44:02.3
272	Hunter Bedell	\N	\N	h-bedell@onu.edu	\r\n419-772-2775	t	2025-04-25 12:44:02.344
273	Nick Silvis	\N	\N	n-silvis@onu.edu	\r\n419-772-2775	t	2025-04-25 12:44:02.389
274	Samantha Harshbarger	\N	\N	s-harshbarger@onu.edu	\r\n419-772-3135	t	2025-04-25 12:44:02.434
275	Jeffrey Robinson	\N	\N	j-robinson.9@onu.edu	\r\n419-772-2019	t	2025-04-25 12:44:02.479
276	Faith Engle	\N	\N	f-engle@onu.edu	\r\n419-772-1015	t	2025-04-25 12:44:02.529
277	Adrian Thompson	\N	\N	a-thompson.9@onu.edu	\r\n416-772-3569	t	2025-04-25 12:44:02.578
278	Kyle Kwiat	\N	\N	k-kwiat@onu.edu	\r\n419-772-1877	t	2025-04-25 12:44:02.622
279	Cameron Hunter	\N	\N	c-hunter.3@onu.edu	\r\n419-772-1699	t	2025-04-25 12:44:02.667
280	Erica Cross	\N	\N	e-bryan@onu.edu	\r\n419-772-2771	t	2025-04-25 12:44:02.714
281	Tammy Everhart	22	176	t-everhart@onu.edu\r\n	419-772-2020	t	2025-04-25 12:44:02.758
282	Kailee Weiker	22	176	k-weiker@onu.edu\r\n	419-772-2841	t	2025-04-25 12:44:02.805
283	Maritza Wright	22	176	m-wright.7@onu.edu\r\n	419-772-2737	t	2025-04-25 12:44:02.849
284	Pam Clum	22	176	p-clum@onu.edu\r\n	419-772-2780	t	2025-04-25 12:44:02.899
285	Ashley King	22	176	a-king.1@onu.edu\r\n	419-772-2026	t	2025-04-25 12:44:02.945
286	Wilson Turner	22	176	w-turner.2@onu.edu\r\n	419-772-2027	t	2025-04-25 12:44:02.99
287	Lisa Conley	\N	176	l-conley.1@onu.edu\r\n	419-772-2016	t	2025-04-25 12:44:03.034
288	Dave Mueller	\N	176	d-mueller@onu.edu\r\n	419-772-2524	t	2025-04-25 12:44:03.078
289	Mark Russell	\N	176	m-russell.7@onu.edu\r\n	419-772-2011	t	2025-04-25 12:44:03.122
290	Wendy Snow	\N	176	w-snow@onu.edu\r\n	419-772-2014	t	2025-04-25 12:44:03.167
291	Krista Thomas	\N	176	k-thomas.6@onu.edu\r\n	419-772-2839	t	2025-04-25 12:44:03.212
292	Shannon Hadding	\N	176	s-hadding@onu.edu\r\n	419-772-2012	t	2025-04-25 12:44:03.258
293	Craig Durliat	\N	176	c-durliat@onu.edu\r\n	419-772-2015	t	2025-04-25 12:44:03.303
294	KellyBates KellyBates	\N	176	k-bates.2@onu.edu\r\n	419-772-2017	t	2025-04-25 12:44:03.35
295	Aly McMaster	\N	176	a-mcmaster.1@onu.edu\r\n	419-772-2028	t	2025-04-25 12:44:03.399
296	Sarah Pratt	\N	176	s-pratt.1@onu.edu\r\n	419-772-2025	t	2025-04-25 12:44:03.443
297	Angela Kurzinger	\N	176	a-kurzinger@onu.edu\r\n	419-772-2013	t	2025-04-25 12:44:03.491
298	Cristal Lovejoy	\N	176	c-lovejoy.3@onu.edu\r\n	419-772-3563	t	2025-04-25 12:44:03.536
299	Emily Rosebeck	\N	176	e-rosebeck@onu.edu\r\n	419-772-2747	t	2025-04-25 12:44:03.581
300	Trista Rude	\N	176	t-rude@onu.edu\r\n	419-772-2021	t	2025-04-25 12:44:03.628
301	Melissa Baumann	\N	176	m-baumann@onu.edu\r\n	419-772-2031	t	2025-04-25 12:44:03.682
302	Jenny Roby	\N	176	j-roby@onu.edu\r\n	419-772-2030	t	2025-04-25 12:44:03.736
303	Lisa Lang	\N	176	l-lang@onu.edu\r\n	419-772-1022	t	2025-04-25 12:44:03.782
304	Katie Klamut	\N	176	k-klamut@onu.edu\r\n	419-772-2529	t	2025-04-25 12:44:03.826
305	Josh Deans	\N	176	j-deans@onu.edu\r\n	419-772-2125	t	2025-04-25 12:44:03.87
306	Julie Hurtig	\N	176	j-hurtig@onu.edu	\r\n419-772-2032	t	2025-04-25 12:44:03.926
307	Nicolle Merkel	\N	176	n-merkel@onu.edu	\r\n419-772-2033	t	2025-04-25 12:44:03.97
308	Lynda Nyce	\N	176	l-nyce@onu.edu	\r\n419-772-2542	t	2025-04-25 12:44:04.014
309	Ye Solar Hong	\N	176	y-hong@onu.edu\r\n	419-772-1202	t	2025-04-25 12:44:04.06
310	Raymond Closson	\N	176	r-closson.1@onu.edu\r\n	419-772-1011	t	2025-04-25 12:44:04.108
311	Jason Broge	\N	176	j-broge@onu.edu\r\n	419-772-2022	t	2025-04-25 12:44:04.152
312	Elizabeth Rockwell	\N	176	e-rockwell@onu.edu	\r\n419-772-2684	t	2025-04-25 12:44:04.201
313	Rebecca Hibbard	\N	176	r-hibbard@onu.edu	\r\n419-772-2685	t	2025-04-25 12:44:04.252
314	Isabella Worden	\N	176	i-worden@onu.edu	\r\n419-772-2035	t	2025-04-25 12:44:04.298
315	Kelly Lawrie	\N	176	k-lawrie@onu.edu	\r\n419-772-1853	t	2025-04-25 12:44:04.342
316	Shannon Spencer	\N	176	s-spencer@onu.edu	\r\n419-772-2036	t	2025-04-25 12:44:04.389
317	Ellie McManus	\N	176	e-mcmanus.1@onu.edu	\r\n419-772-2073	t	2025-04-25 12:44:04.437
318	Max Lambdin	\N	176	m-lambdin.1@onu.edu	\r\n419-772-2511	t	2025-04-25 12:44:04.486
319	Rae Staton	\N	176	p-staton@onu.edu	\r\n419-772-3976	t	2025-04-25 12:44:04.531
320	Sheila Baumgartner	\N	176	s-baumgartner.1@onu.edu\r\n	419-772-2047	t	2025-04-25 12:44:04.576
321	Molly Stanley	\N	176	m-stanley@onu.edu\r\n	419-772-2759	t	2025-04-25 12:44:04.62
322	Rebecca Legge	\N	176	r-legge@onu.edu\r\n	419-772-2065	t	2025-04-25 12:44:04.672
323	Dave Kielmeyer	\N	176	d-kielmeyer@onu.edu\r\n	419-772-3961	t	2025-04-25 12:44:04.718
324	James Massara	\N	176	j-massara@onu.edu\r\n	419-772-4029	t	2025-04-25 12:44:04.763
325	Laurie Wurth-Pressel	\N	176	l-wurth-pressel@onu.edu\r\n	419-772-2048	t	2025-04-25 12:44:04.808
326	Heather Deans	\N	176	h-deans@onu.edu	\r\n419-772-2398	t	2025-04-25 12:44:04.858
327	Kelsey Jones	\N	176	k-jones.14@onu.edu	\r\n419-772-2037	t	2025-04-25 12:44:04.902
328	Kim Opp	\N	176	k-opp@onu.edu	\r\n419-772-1983	t	2025-04-25 12:44:04.946
329	Debra Roberts	\N	\N	d-hattery-robert@onu.edu\r\n	419-772-3944	t	2025-04-25 12:44:04.993
330	Marge Hoying	\N	\N	m-hoying.1@onu.edu\r\n	419-772-3944	t	2025-04-25 12:44:05.042
331	Brandy Sterling	\N	\N	b-sterling.2@onu.edu\r\n	419-772-3944	t	2025-04-25 12:44:05.087
332	Jamie Hunsicker	\N	\N	j-hunsicker@onu.edu\r\n	419-772-3947	t	2025-04-25 12:44:05.148
333	Tina Liebrecht	\N	\N	c-liebrecht@onu.edu\r\n	419-772-3943	t	2025-04-25 12:44:05.192
334	Kami Fox	\N	\N	k-fox.2@onu.edu\r\n	419-772-3013	t	2025-04-25 12:44:05.236
335	Angela Spallinger	\N	\N	a-spallinger@onu.edu\r\n	419-772-3946	t	2025-04-25 12:44:05.281
336	Sarah Bassitt	\N	\N	s-bassitt.1@onu.edu\r\n	419-772-3948	t	2025-04-25 12:44:05.326
337	Megan Lieb	\N	\N	m-lieb.2@onu.edu\r\n	419-772-3963	t	2025-04-25 12:44:05.373
338	Zach Shumaker	\N	\N	z-shumaker@onu.edu\r\n	419-772-1054	t	2025-04-25 12:44:05.417
339	Christy Basinger	\N	\N	c-basinger.2@onu.edu	\N	t	2025-04-25 12:44:05.464
340	Angela Baxter	\N	\N	a-baxter.1@onu.edu\r\n	419-772-3944	t	2025-04-25 12:44:05.508
341	Nicole Beougher	\N	\N	n-beougher@onu.edu\r\n	419-772-3944	t	2025-04-25 12:44:05.553
342	Erica Bowling	\N	\N	e-heckman@onu.edu	\N	t	2025-04-25 12:44:05.598
343	Laurie Camper	\N	\N	l-camper@onu.edu\r\n	419-772-3944	t	2025-04-25 12:44:05.646
344	Ashley Conrad	\N	\N	a-conrad.1@onu.edu\r\n	419-772-3944	t	2025-04-25 12:44:05.694
345	Payton Delafuente	\N	\N	p-delafuente@onu.edu\r\n	419-772-3944	t	2025-04-25 12:44:05.739
346	Ciarra Evans	\N	\N	c-evans.9@onu.edu\r\n	419-772-3944	t	2025-04-25 12:44:05.784
347	Katy Franks	\N	\N	k-miller.28@onu.edu\r\n	419-772-3944	t	2025-04-25 12:44:05.832
348	Tonya Kerber	\N	\N	t-kerber@onu.edu\r\n	419-772-3944	t	2025-04-25 12:44:05.877
349	Jessica Oard	\N	\N	j-oard@onu.edu\r\n	419-772-3944	t	2025-04-25 12:44:05.926
350	Nichole Reynolds	\N	\N	n-reynolds.1@onu.edu\r\n	419-772-3944	t	2025-04-25 12:44:05.972
351	Teresa Richard	\N	\N	t-richard@onu.edu\r\n	419-772-3944	t	2025-04-25 12:44:06.019
352	Abbey Rieman	\N	\N	a-rieman@onu.edu\r\n	419-772-3944	t	2025-04-25 12:44:06.063
353	Katie Schroeder	\N	\N	k-schroeder.8@onu.edu	\N	t	2025-04-25 12:44:06.108
354	Cheryl Sickels	\N	\N	c-sickels@onu.edu\r\n	419-772-3944	t	2025-04-25 12:44:06.155
355	Tiara Striff	\N	\N	t-striff@onu.edu\r\n	419-772-3944	t	2025-04-25 12:44:06.201
356	Hannah Szippl	\N	\N	h-szippl@onu.edu\r\n	419-772-3944	t	2025-04-25 12:44:06.245
357	Kat Krynak	\N	\N	k-krynak@onu.edu	\r\n419-772-2335	t	2025-04-25 12:44:06.295
358	Jamie Siders	\N	\N	j-siders@onu.edu	\r\n419-772-3016	t	2025-04-25 12:44:06.341
359	Dennis Luca	\N	\N	d-deluca@onu.edu	\r\n419-772-2331	t	2025-04-25 12:44:06.386
360	Larry Robinson	\N	\N	l-robinson.1@onu.edu\r\n	419-772-2358	t	2025-04-25 12:44:06.43
361	Byungjae Son	\N	\N	b-son@onu.edu\r\n	419-772-2351	t	2025-04-25 12:44:06.475
362	Anup Lamichhane	\N	\N	a-lamichhane@onu.edu\r\n	419-772-2355	t	2025-04-25 12:44:06.52
363	Mihai Caragiu	\N	\N	m-caragiu.1@onu.edu\r\n	419-772-2352	t	2025-04-25 12:44:06.566
364	Yong Wang	\N	\N	y-wang.4@onu.edu\r\n	419-772-2316	t	2025-04-25 12:44:06.611
365	Marc Schilder	\N	\N	m-schilder@onu.edu\r\n	419-772-2078	t	2025-04-25 12:44:06.658
366	Jaki Chowdhury	\N	\N	j-chowdhury@onu.edu\r\n	419-772-2808	t	2025-04-25 12:44:06.704
367	Ryan Rahrig	\N	\N	r-rahrig@onu.edu\r\n	419-772-3005	t	2025-04-25 12:44:06.749
368	Janet Roll	\N	\N	j-roll.1@onu.edu\r\n	419-772-3560	t	2025-04-25 12:44:06.798
369	Thomas Tuberson	\N	\N	t-tuberson@onu.edu\r\n	419-772-2349	t	2025-04-25 12:44:06.853
370	Grace Newland	\N	\N	g-newland@onu.edu\r\n	419-772-2168	t	2025-04-25 12:44:06.897
371	Cindy Cochran	\N	88	c-cochran@onu.edu	419-772-2062	t	2025-04-25 12:44:06.943
372	Dave Dellifield	\N	88	d-dellifield@onu.edu	419-772-2402	t	2025-04-25 12:44:06.989
373	Jedda Decker	\N	88	j-decker.4@onu.edu\r\n	419-772-2403	t	2025-04-25 12:44:07.034
374	Thomas Frost	\N	88	t-frost.1@onu.edu\r\n	419-772-2431	t	2025-04-25 12:44:07.078
375	Anissa Jenkins	\N	88	a-jenkins.1@onu.edu\r\n	419-772-2669	t	2025-04-25 12:44:07.125
376	Jennifer Lambdin	\N	88	j-lambdin@onu.edu\r\n	419-772-3968	t	2025-04-25 12:44:07.17
377	Noah Oettinger	\N	88	m-oettinger@onu.edu\r\n	419-772-1300	t	2025-04-25 12:44:07.215
378	Greg Phlegar	\N	88	g-phlegar@onu.edu\r\n	419-772-2434	t	2025-04-25 12:44:07.259
379	Reece Pratt	\N	88	a-pratt.1@onu.edu\r\n	419-772-2401	t	2025-04-25 12:44:07.303
380	Shaena Tabler	\N	88	s-tabler@onu.edu\r\n	419-772-3557	t	2025-04-25 12:44:07.347
381	Adriane Bradshaw	\N	88	a-thompson@onu.edu\r\n	419-772-2433	t	2025-04-25 12:44:07.393
382	Shelby Turner	\N	88	s-turner.1@onu.edu\r\n	419-772-2432	t	2025-04-25 12:44:07.438
383	Clay Casey	\N	\N	c-casey.1@onu.edu	\r\n	t	2025-04-25 12:44:07.484
384	David Lusk	\N	\N	d-lusk@onu.edu\r\n	419-772-2258	t	2025-04-25 12:44:07.528
385	Jessica Spiese	\N	\N	j-spiese@onu.edu\r\n	419-772-4030	t	2025-04-25 12:44:07.576
386	Burlin Sherrick	\N	\N	b-sherrick@onu.edu	\N	t	2025-04-25 12:44:07.621
387	Krista Frimel	\N	\N	k-frimel@onu.edu	\r\n419-772-2996	t	2025-04-25 12:44:07.665
388	Tena Roepke	\N	\N	t-roepke@onu.edu\r\n	419-772-2353	t	2025-04-25 12:44:07.71
389	Amy Aulthouse	\N	\N	a-aulthouse@onu.edu	\r\n419-772-2660	t	2025-04-25 12:44:07.755
390	Carla Patton	\N	\N	c-patton.2@onu.edu	\r\n419-772-2329	t	2025-04-25 12:44:07.8
391	Liz Tristano	\N	\N	e-tristano@onu.edu	\r\n419-772-2327	t	2025-04-25 12:44:07.844
392	Jay Mager	\N	\N	j-mager@onu.edu	\r\n419-772-2333	t	2025-04-25 12:44:07.897
393	Jill Toomey	\N	\N	j-bennett-toomey@onu.edu	\r\n419-772-2324	t	2025-04-25 12:44:07.941
394	Jackie Connour	\N	\N	j-connour@onu.edu	\r\n419-772-2332	t	2025-04-25 12:44:07.985
395	David Macar	\N	\N	d-macar@onu.edu	\r\n419-772-2063	t	2025-04-25 12:44:08.029
396	Gregory Adkins	\N	\N	g-adkins.1@onu.edu\r\n	419-772-1203	t	2025-04-25 12:44:08.078
397	Rema Suniga	\N	\N	r-suniga@onu.edu	\r\n419-772-2323	t	2025-04-25 12:44:08.125
398	Rodney Anderson	\N	\N	r-anderson@onu.edu	\r\n419-772-2328	t	2025-04-25 12:44:08.17
399	Tim Koneval	\N	\N	t-koneval@onu.edu	\r\n419-772-2762	t	2025-04-25 12:44:08.215
400	Lisa Walden	\N	\N	l-walden@onu.edu\r\n	419-772-3084	t	2025-04-25 12:44:08.26
401	Robert Verb	\N	\N	r-verb@onu.edu	\r\n419-772-2322	t	2025-04-25 12:44:08.304
402	Leslie Riley	\N	\N	l-riley.1@onu.edu	\r\n419-772-3143	t	2025-04-25 12:44:08.35
403	Harold Schueler	\N	\N	h-schueler@onu.edu	\r\n419-772-3507	t	2025-04-25 12:44:08.395
404	Andrea Graytock	\N	\N	a-graytock@onu.edu	\r\n419-772-2490	t	2025-04-25 12:44:08.441
405	Linda Young	\N	\N	l-young@onu.edu	\r\n419-772-2438	t	2025-04-25 12:44:08.487
406	Hannah Sturtevant	\N	\N	h-sturtevant@onu.edu\r\n	419-772-3555	t	2025-04-25 12:44:08.531
407	Amelia Wile	\N	\N	a-anderson.4@onu.edu\r\n	419-772-4207	t	2025-04-25 12:44:08.577
408	Chris Bowers	\N	\N	c-bowers@onu.edu\r\n	419-772-2435	t	2025-04-25 12:44:08.621
409	Brian Myers	\N	\N	b-myers@onu.edu\r\n	419-772-2350	t	2025-04-25 12:44:08.672
410	Christopher Spiese	\N	\N	c-spiese.1@onu.edu\r\n	419-772-2365	t	2025-04-25 12:44:08.716
411	Trilisa Perrine	\N	\N	t-perrine@onu.edu\r\n	419-772-2340	t	2025-04-25 12:44:08.76
412	Kristin Daws	\N	\N	k-daws@onu.edu\r\n	419-772-2345	t	2025-04-25 12:44:08.805
413	Kristan Payne	\N	\N	k-payne.2@onu.edu\r\n	419-772-2336	t	2025-04-25 12:44:08.85
414	Kelly Hall	\N	\N	k-hall.6@onu.edu\r\n	419-772-2586	t	2025-04-25 12:44:08.896
415	Sonya Joy	\N	\N	s-adas.1@onu.edu	\N	t	2025-04-25 12:44:08.94
416	Susan Bates	\N	\N	s-bates@onu.edu\r\n	419-772-2341	t	2025-04-25 12:44:08.992
417	Tevye Celius	\N	\N	t-celius@onu.edu\r\n	419-772-3020	t	2025-04-25 12:44:09.039
418	Ron Peterson	\N	\N	r-peterson@onu.edu\r\n	419-772-2338	t	2025-04-25 12:44:09.086
419	Jake Zimmerman	\N	\N	j-zimmerman.3@onu.edu\r\n	419-772-2342	t	2025-04-25 12:44:09.133
420	Kathe DeVault	\N	\N	k-devault@onu.edu	\r\n419-772-2686	t	2025-04-25 12:44:09.178
421	Tyson Miller	\N	\N	t-miller.2@onu.edu\r\n	419-772-2686	t	2025-04-25 12:44:09.224
422	Ameera Ansari	\N	\N	a-ansari@onu.edu	\r\n419-772-2018	t	2025-04-25 12:44:09.268
423	John Sebestyen	\N	\N	j-sebestyen@onu.edu	\r\n419-772-2050	t	2025-04-25 12:44:09.312
424	Shane Tilton	\N	\N	s-tilton@onu.edu	\r\n419-772-1027	t	2025-04-25 12:44:09.364
425	Jeff Onge	\N	\N	j-stonge@onu.edu	\r\n419-772-2469	t	2025-04-25 12:44:09.414
426	Mark Cruea	\N	\N	m-cruea@onu.edu	\r\n419-772-2099	t	2025-04-25 12:44:09.463
427	Elizabeth Howard	\N	\N	e-cozad@onu.edu	\r\n419-772-1693	t	2025-04-25 12:44:09.509
428	Scott Susong	\N	\N	s-susong@onu.edu	\r\n419-772-2051	t	2025-04-25 12:44:09.555
429	Joan Robbins	\N	\N	j-robbins@onu.edu	\r\n419-772-2487	t	2025-04-25 12:44:09.599
430	Shawn Stevens	\N	\N	s-stevens.3@onu.edu	\r\n419-772-2049	t	2025-04-25 12:44:09.645
431	Megan Wood	\N	\N	m-wood@onu.edu	\r\n419-772-2056	t	2025-04-25 12:44:09.69
432	James Savage	\N	\N	j-savage.2@onu.edu	\r\n419-772-2591	t	2025-04-25 12:44:09.735
433	Sydney Smith	\N	\N	s-smith.35@onu.edu\r\n	419-772-3551	t	2025-04-25 12:44:09.78
434	Ashley Reed	\N	\N	a-reed.6@onu.edu	\r\n419-772-2540	t	2025-04-25 12:44:09.824
435	Amanda Wischmeyer	\N	\N	a-fannon@onu.edu	\r\n419-772-2540	t	2025-04-25 12:44:09.873
436	Brian Phillips	\N	\N	b-phillips.5@onu.edu	\r\n419-772-2052	t	2025-04-25 12:44:09.917
437	Bobby Porter	\N	\N	r-porter@onu.edu\r\n	419-772-2674	t	2025-04-25 12:44:09.961
438	Tricia Calver	\N	\N	t-calver@onu.edu\r\n	419-772-3150	t	2025-04-25 12:44:10.006
439	Vicki Mills	\N	\N	v-mills@onu.edu	\r\n419-772-2150	t	2025-04-25 12:44:10.055
440	Brandon Magid	\N	\N	b-magid@onu.edu	\r\n419-772-2191	t	2025-04-25 12:44:10.099
441	Denise D'Arca	\N	\N	d-darca@onu.edu	\r\n419-772-2150	t	2025-04-25 12:44:10.148
442	Adam Fahncke	\N	\N	a-fahncke@onu.edu	\r\n419-772-2150	t	2025-04-25 12:44:10.194
443	Joe Gozdowski	\N	\N	j-gozdowski@onu.edu	\r\n	t	2025-04-25 12:44:10.241
444	Troy Reineke	\N	\N	t-reineke@onu.edu	\r\n419-772-2150	t	2025-04-25 12:44:10.285
445	Emily Hanson	\N	\N	e-hanson.3@onu.edu\r\n	419-772-2050	t	2025-04-25 12:44:10.337
446	James Green	\N	\N	j-green.11@onu.edu	\r\n419-772-2150	t	2025-04-25 12:44:10.383
447	Andrew Liebermann	\N	\N	a-liebermann@onu.edu	\r\n419-772-2151	t	2025-04-25 12:44:10.427
448	Sarah Waters	\N	\N	s-waters@onu.edu	\r\n419-772-2704	t	2025-04-25 12:44:10.474
449	Stephanie Titus	\N	\N	s-titus.2@onu.edu\r\n	419-772-2157	t	2025-04-25 12:44:10.518
450	Pamela Ashmore	\N	\N	p-ashmore.1@onu.edu	\r\n419-772-2689	t	2025-04-25 12:44:10.566
451	Mary Eichelberger	\N	\N	m-eichelberger@onu.edu	\r\n419-772-2150	t	2025-04-25 12:44:10.611
452	Rebecca Casey	\N	\N	r-casey@onu.edu	\r\n419-772-2156	t	2025-04-25 12:44:10.656
453	Peter Ashmore	\N	\N	p-ashmore@onu.edu	\r\n419-772-1876	t	2025-04-25 12:44:10.701
454	Florin Simioanca	\N	\N	f-simioanca@onu.edu	\r\n419-772-1876	t	2025-04-25 12:44:10.746
455	Ray Yu	\N	\N	l-yu@onu.edu\r\n	419-772-2150	t	2025-04-25 12:44:10.791
456	David Kosmyna	\N	\N	d-kosmyna@onu.edu	\r\n419-772-2152	t	2025-04-25 12:44:10.835
457	Dale Laukhuf	\N	\N	d-laukhuf@onu.edu	\r\n419-772-2154	t	2025-04-25 12:44:10.881
458	Omar Lozano	\N	\N	o-lozano@onu.edu	\r\n419-772-2150	t	2025-04-25 12:44:10.928
459	Brandon Guillen	\N	\N	b-guillen@onu.edu\r\n	419-772-2154	t	2025-04-25 12:44:10.974
460	Micah Graber	\N	\N	m-graber@onu.edu	\r\n419-772-2691	t	2025-04-25 12:44:11.018
461	Charles Bates	\N	\N	c-bates@onu.edu	\r\n419-772-2155	t	2025-04-25 12:44:11.062
462	Kirsten Manley	\N	\N	k-osbun@onu.edu	\r\n419-772-1998	t	2025-04-25 12:44:11.11
463	Erin Torres	\N	\N	e-torres@onu.edu	\r\n419-772-2690	t	2025-04-25 12:44:11.154
464	Summer Aebker	\N	\N	s-aebker@onu.edu	\r\n419-772-2158	t	2025-04-25 12:44:11.209
465	Kaylee Adams	\N	\N	k-adams.7@onu.edu\r\n	419-772-3784	t	2025-04-25 12:44:11.257
466	Dave Burkhart	\N	\N	d-burkhart@onu.edu\r\n	419-772-3784	t	2025-04-25 12:44:11.307
467	Brittany Crouch	\N	\N	b-crouch.1@onu.edu\r\n	419-772-3784	t	2025-04-25 12:44:11.352
468	Amanda Fordyce	\N	\N	a-fordyce@onu.edu\r\n	419-772-2659	t	2025-04-25 12:44:11.396
469	Jim Straub	\N	\N	j-straub@onu.edu	419-772-3784\t	t	2025-04-25 12:44:11.441
470	David Nau	\N	\N	d-nau@onu.edu\r\n	419-772-1934	t	2025-04-25 12:44:11.486
471	Alaina Kortokrax	\N	\N	a-kortokrax@onu.edu	\N	t	2025-04-25 12:44:11.53
472	Lena Salameh	\N	\N	l-salameh@onu.edu\r\n	419-772-2299	t	2025-04-25 12:44:11.574
473	Kathryn Baker	\N	\N	k-baker.9@onu.edu\r\n	419-772-2275	t	2025-04-25 12:44:11.618
474	Kelly Shields	\N	\N	k-shields@onu.edu\r\n	419-772-2752	t	2025-04-25 12:44:11.662
475	Sheila Coressel	\N	\N	s-coressel@onu.edu\r\n	419-772-2282	t	2025-04-25 12:44:11.707
476	Stuart Beatty	\N	\N	s-beatty@onu.edu\r\n	419-772-2277	t	2025-04-25 12:44:11.751
477	Mary Parker	\N	\N	m-parker@onu.edu\r\n	419-772-1051	t	2025-04-25 12:44:11.799
478	Tarek Mahfouz	\N	\N	t-mahfouz@onu.edu\r\n	419-772-3951	t	2025-04-25 12:44:11.848
479	Jennifer Grundey	\N	\N	j-kline.3@onu.edu\r\n	419-772-2290	t	2025-04-25 12:44:11.892
480	Pat Parteleno	\N	\N	p-parteleno@onu.edu\r\n	419-772-1866	t	2025-04-25 12:44:11.938
481	Kimberley Houser	\N	\N	k-houser.2@onu.edu\r\n	419-772-2418	t	2025-04-25 12:44:11.982
482	T'Bony Jewell	\N	\N	t-jewell@onu.edu\r\n	419-772-2301	t	2025-04-25 12:44:12.026
483	Emily Eddy	\N	\N	e-eddy.1@onu.edu\r\n	419-772-2305	t	2025-04-25 12:44:12.074
484	Kyle Miles	\N	\N	k-miles.3@onu.edu\r\n	419-772-2280	t	2025-04-25 12:44:12.119
485	Kyle Parker	\N	\N	k-parker.4@onu.edu\r\n	419-772-2319	t	2025-04-25 12:44:12.168
486	Kristen Sobota	\N	\N	k-finley.1@onu.edu\r\n	419-772-2569	t	2025-04-25 12:44:12.214
487	Kelly Kroustos	\N	\N	k-reilly@onu.edu\r\n	419-772-3955	t	2025-04-25 12:44:12.258
488	Jessica Hinson	\N	\N	j-hinson@onu.edu\r\n	419-772-2284	t	2025-04-25 12:44:12.304
489	Harry Roberts	\N	\N	h-roberts@onu.edu\r\n	419-772-2292	t	2025-04-25 12:44:12.349
490	Brittany Long	\N	\N	b-brock@onu.edu\r\n	419-772-3952	t	2025-04-25 12:44:12.395
491	Brittany Bates	\N	\N	b-bates.1@onu.edu\r\n	419-772-2295	t	2025-04-25 12:44:12.439
492	Lisa Vick	\N	\N	l-vick@onu.edu\r\n	419-772-2281	t	2025-04-25 12:44:12.485
493	Natalie Mager	\N	\N	n-dipietro@onu.edu\r\n	419-772-3971	t	2025-04-25 12:44:12.531
494	Karen Kier	\N	\N	k-kier@onu.edu\r\n	419-772-2285	t	2025-04-25 12:44:12.576
495	Donald Hart	\N	\N	d-hart@onu.edu\r\n	740-622-9310	t	2025-04-25 12:44:12.621
496	Kasie Landin	\N	\N	k-landin@onu.edu\r\n	419-772-2275	t	2025-04-25 12:44:12.667
497	Andy Roecker	\N	\N	a-roecker@onu.edu\r\n	419-772-2283	t	2025-04-25 12:44:12.713
498	Kathy Fruchey	\N	\N	k-fruchey@onu.edu\r\n	419-772-2539	t	2025-04-25 12:44:12.759
499	Eyob Adane	\N	\N	e-adane@onu.edu\r\n	419-772-3162	t	2025-04-25 12:44:12.804
500	Lindsey Ferraro	\N	\N	l-peters@onu.edu\r\n	419-772-2297	t	2025-04-25 12:44:12.852
501	Michael Rush	\N	\N	m-rush@onu.edu\r\n	419-772-3933	t	2025-04-25 12:44:12.897
502	Michelle Musser	\N	\N	m-musser@onu.edu\r\n	419-772-2302	t	2025-04-25 12:44:12.945
503	William Theisen	\N	\N	w-theisen@onu.edu\r\n	419-772-2741	t	2025-04-25 12:44:13.009
504	Tim Opp	\N	\N	t-opp@onu.edu\r\n	419-772-3096	t	2025-04-25 12:44:13.054
505	Jason Pinkney	\N	\N	j-pinkney@onu.edu\r\n	419-772-2740	t	2025-04-25 12:44:13.098
506	Mellita Caragiu	\N	\N	m-caragiu@onu.edu\r\n	419-772-2851	t	2025-04-25 12:44:13.145
507	Kristie Payment	\N	\N	k-payment@onu.edu\r\n	419-772-2143	t	2025-04-25 12:44:13.198
508	Eunhee Kim	\N	\N	e-kim@onu.edu	\r\n419-772-3014	t	2025-04-25 12:44:13.243
509	Troy Chiefari	\N	\N	t-chiefari@onu.edu	\r\n419-772-3137	t	2025-04-25 12:44:13.289
510	Robbie Brown	\N	\N	r-brown.19@onu.edu	\r\n419-772-2455	t	2025-04-25 12:44:13.334
511	Andy Fries	\N	\N	a-fries.1@onu.edu	\r\n419-772-2448	t	2025-04-25 12:44:13.444
512	Jack Gammon	\N	\N	j-gammon@onu.edu	\r\n419-772-2810	t	2025-04-25 12:44:13.488
513	Shaq JZ	\N	\N	s-jz@onu.edu	\r\n	t	2025-04-25 12:44:13.536
514	Lou Sepe	\N	\N	l-sepe@onu.edu	\r\n	t	2025-04-25 12:44:13.58
515	Matt Simon	\N	\N	m-simon.1@onu.edu	\r\n419-772-2588	t	2025-04-25 12:44:13.63
516	Glenn Scheutzow	\N	\N	g-scheutzow@onu.edu	\r\n419-772-2770	t	2025-04-25 12:44:13.68
517	Von Thomas	\N	\N	v-thomas@onu.edu	\r\n419-772-2455	t	2025-04-25 12:44:13.725
518	Ethan Diberardino	\N	\N	e-diberardino@onu.edu	\r\n419-772-2452	t	2025-04-25 12:44:13.773
519	Maya Buening	\N	\N	m-buening@onu.edu	\N	t	2025-04-25 12:44:13.817
520	Bridget Buckley	\N	\N	b-buckley.1@onu.edu\r\n	419-772-2252	t	2025-04-25 12:44:13.861
521	Dustin Green	\N	\N	d-green.4@onu.edu\r\n	419-772-2255	t	2025-04-25 12:44:13.914
522	Maggie Davis	\N	\N	m-davis.21@onu.edu\r\n	419-772-3057	t	2025-04-25 12:44:13.958
523	Chrys Goldy	\N	\N	c-goldy@onu.edu\r\n	419-772-3057	t	2025-04-25 12:44:14.003
524	Matt Fisher	\N	\N	j-fisher.6@onu.edu	\N	t	2025-04-25 12:44:14.048
525	Terri Kelley	\N	\N	t-kelley.3@onu.edu\r\n	419-772-2249	t	2025-04-25 12:44:14.092
526	Alex Sinatra	\N	\N	a-sinatra@onu.edu	\N	t	2025-04-25 12:44:14.136
527	Kelly Stevens	\N	\N	k-stevens.1@onu.edu\r\n	419-772-1928	t	2025-04-25 12:44:14.181
528	Erin Turgon	\N	\N	e-turgon@onu.edu\r\n	419-772-2205	t	2025-04-25 12:44:14.225
529	Shelby Willamowski	\N	\N	s-core@onu.edu\r\n	419-772-2214	t	2025-04-25 12:44:14.272
530	Bryan Ward	\N	\N	b-ward.1@onu.edu\r\n	419-772-2212	t	2025-04-25 12:44:14.321
531	Charlie Rose	\N	\N	c-rose.5@onu.edu\r\n	419-772-2209	t	2025-04-25 12:44:14.367
532	Tina Hunt	\N	\N	c-hunt.3@onu.edu\r\n	419-772-2758	t	2025-04-25 12:44:14.411
533	Amber Schumacher	\N	\N	a-schumacher@onu.edu\r\n	419-772-2220	t	2025-04-25 12:44:14.455
534	Grace Allison	\N	\N	g-allison@onu.edu\r\n	419-772-2754	t	2025-04-25 12:44:14.5
535	Brenda Burgy	\N	\N	b-burgy@onu.edu\r\n	419-772-2242	t	2025-04-25 12:44:14.547
536	Alex Oliverio	\N	\N	a-oliverio@onu.edu\r\n	419-772-2210	t	2025-04-25 12:44:14.591
537	Jean Kamatali	\N	\N	j-kamatali@onu.edu\r\n	419-772-3920	t	2025-04-25 12:44:14.636
538	Jennifer Gregg	\N	\N	j-gregg@onu.edu\r\n	419-772-2694	t	2025-04-25 12:44:14.687
539	Darrel Davison	\N	\N	d-davison@onu.edu\r\n	419-772-3920	t	2025-04-25 12:44:14.732
540	Rick Bales	\N	\N	r-bales@onu.edu\r\n	419-772-2223	t	2025-04-25 12:44:14.776
541	Liam O'Melinn	\N	\N	l-omelinn@onu.edu\r\n	419-772-2207	t	2025-04-25 12:44:14.821
542	David Raack	\N	\N	d-raack@onu.edu\r\n	419-772-2232	t	2025-04-25 12:44:14.866
543	Melissa LaRocco	\N	\N	m-larocco@onu.edu\r\n	419-772-2233	t	2025-04-25 12:44:14.911
544	Steve Veltri	\N	\N	s-veltri@onu.edu\r\n	419-772-2215	t	2025-04-25 12:44:14.957
545	Allison Mittendorf	\N	\N	a-mittendorf@onu.edu\r\n	419-772-1933	t	2025-04-25 12:44:15.007
546	Bruce Frohnen	\N	\N	b-frohnen@onu.edu\r\n	419-772-1950	t	2025-04-25 12:44:15.055
547	Stephen Shaw	\N	\N	s-shaw@onu.edu\r\n	419-772-2227	t	2025-04-25 12:44:15.105
548	Melissa Kidder	\N	\N	m-kidder@onu.edu\r\n	419-772-1870	t	2025-04-25 12:44:15.15
549	Lisa Light	\N	\N	l-light@onu.edu\r\n	419-772-2238	t	2025-04-25 12:44:15.194
550	Dan Maurer	\N	\N	d-maurer.2@onu.edu\r\n	419-772-1997	t	2025-04-25 12:44:15.238
551	Donnie Anderson	\N	\N	d-anderson.7@onu.edu\r\n	419-772-2216	t	2025-04-25 12:44:15.282
552	Garrett Halydier	\N	\N	g-halydier@onu.edu\r\n	419-772-1996	t	2025-04-25 12:44:15.327
553	Kim Breedon	\N	\N	k-breedon@onu.edu\r\n	419-772-2218	t	2025-04-25 12:44:15.371
554	Beau Baez	\N	\N	h-baez@onu.edu\r\n	419-772-2221	t	2025-04-25 12:44:15.421
555	Deanna Haan	\N	\N	d-haan@onu.edu	\r\n419-772-2260	t	2025-04-25 12:44:15.466
556	Cherie Castle	\N	\N	c-castle.1@onu.edu\r\n	419-772-2272	t	2025-04-25 12:44:15.52
557	Linda Mason	\N	\N	l-mason@onu.edu\r\n	419-772-2670	t	2025-04-25 12:44:15.565
558	Sherry Agin	\N	\N	s-agin@onu.edu	\r\n419-772-2701	t	2025-04-25 12:44:15.61
559	Brenda Hamlin	\N	\N	b-hamlin@onu.edu	\r\n419-772-2269	t	2025-04-25 12:44:15.654
560	Deb Miller	\N	\N	d-miller@onu.edu	\r\n419-772-2464	t	2025-04-25 12:44:15.703
561	Rich Bensman	\N	\N	r-bensman@onu.edu	\r\n419-772-2428	t	2025-04-25 12:44:15.749
562	Chris Jebsen	\N	\N	c-jebsen@onu.edu	\r\n419-772-2264	t	2025-04-25 12:44:15.795
563	Bill Eilola	\N	\N	w-eilola@onu.edu	\r\n419-772-2261	t	2025-04-25 12:44:15.839
564	Juliana Kelly	\N	\N	j-kelly.7@onu.edu	\r\n419-772-1965	t	2025-04-25 12:44:15.885
565	Brenda Averesch	\N	\N	b-averesch@onu.edu	\r\n419-772-2793	t	2025-04-25 12:44:15.93
566	Jason Sumner	\N	\N	r-sumner@onu.edu	\r\n419-772-2265	t	2025-04-25 12:44:15.977
567	Dean Altstaetter	\N	\N	d-altstaetter@onu.edu	\r\n419-772-2274	t	2025-04-25 12:44:16.022
568	Camryn Jeffers	\N	\N	c-jeffers.1@onu.edu\r\n	419-772-2612	t	2025-04-25 12:44:16.068
569	Melanie Weaver	\N	\N	m-weaver.2@onu.edu\r\n	419-772-2271	t	2025-04-25 12:44:16.113
570	Carissa Burke	\N	\N	c-burke.1@onu.edu\r\n	419-772-3504	t	2025-04-25 12:44:16.158
571	Lori Sloan	\N	\N	l-sloan@onu.edu\r\n	419-772-2700	t	2025-04-25 12:44:16.204
572	Josie Garmon	\N	\N	j-garmon@onu.edu\r\n	419-772-2273	t	2025-04-25 12:44:16.252
573	Shannon Phlegar	\N	\N	s-phlegar@onu.edu\r\n	419-772-2241	t	2025-04-25 12:44:16.296
574	Brandon Fauber	\N	\N	b-fauber@onu.edu	\r\n419-772-2483	t	2025-04-25 12:44:16.341
575	Tom Siferd	\N	\N	s-siferd@onu.edu	\r\n419-772-3518	t	2025-04-25 12:44:16.385
576	Pam Tenwalde	\N	\N	p-tenwalde@onu.edu	\r\n419-772-2135	t	2025-04-25 12:44:16.434
577	Andrew Steingass	\N	\N	a-steingass.1@onu.edu	\r\n419-772-2160	t	2025-04-25 12:44:16.478
578	Ian Breidenbach	\N	\N	i-breidenbach@onu.edu	\r\n419-772-2059	t	2025-04-25 12:44:16.522
579	William Mancuso	\N	\N	w-mancuso@onu.edu	\r\n419-772-2509	t	2025-04-25 12:44:16.566
580	Brit Rowe	\N	\N	w-rowe@onu.edu	\r\n419-772-2496	t	2025-04-25 12:44:16.611
581	Emily Jay	\N	\N	e-jay@onu.edu	\r\n419-772-2163	t	2025-04-25 12:44:16.655
582	Luke Sheets	\N	\N	h-sheets@onu.edu	\r\n419-772-2162	t	2025-04-25 12:44:16.703
583	Melissa Mancuso	\N	\N	m-eddings@onu.edu	\r\n419-772-2751	t	2025-04-25 12:44:16.748
584	Riley Bortner	22	176	r-bortner@onu.edu		t	2025-06-30 19:05:37.167
585	Dustin Shook	48	157	d-shook@onu.edu		t	2025-07-01 14:40:29.977
586	Josh Crawford	5	213	j-crawford@onu.edu		t	2025-07-08 13:34:26.576
587	Shannon Steinke	5	213	s-steinke@onu.edu		t	2025-07-08 13:34:53.084
589	Test	5	18	\N	\N	t	2025-08-12 15:19:04.509893
592	Debbie Roehrle	7	217	d-roehrle@onu.edu		t	2025-08-25 18:32:36.396
590	Michael Gierhart	5	22	m-gierhart@onu.edu		t	2025-08-12 15:51:58.893379
\.


--
-- Data for Name: storage_locations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.storage_locations (id, name, description, active, created_at) FROM stdin;
1	Stockroom	Main stockroom for smaller parts	t	2025-04-10 13:28:11.200092
2	Warehouse	Large warehouse for bulk storage	t	2025-04-10 13:28:11.200092
\.


--
-- Data for Name: tool_signouts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tool_signouts (id, tool_id, technician_id, signed_out_at, returned_at, status, condition, notes) FROM stdin;
2	17	46	2025-07-07 11:53:28.25	2025-07-07 11:53:36.834	returned	good	Testing student return functionality
3	83	20	2025-08-25 12:00:31.975	\N	checked_out	\N	\N
4	84	20	2025-08-25 12:00:50.539	\N	checked_out	\N	\N
5	85	20	2025-08-25 12:01:00.046	\N	checked_out	\N	\N
\.


--
-- Data for Name: tools; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tools (id, tool_number, tool_name, notes, created_at, active) FROM stdin;
5	3	Ridgid Pro Press RP 351	\N	2025-04-22 17:34:11.226	t
6	4	Greenlee Fish Tape Blower	\N	2025-04-22 17:36:15.847	t
17	1	Milwaukee Circular Saw	\N	2025-04-22 17:40:55.955	t
18	2	Milwaukee Heavy Duty Hammer Drill	\N	2025-04-22 17:41:31.914	t
19	5	Milwaukee Band Saw	\N	2025-04-22 17:42:03.433	t
20	6	Ridgid Pro Press - Small	\N	2025-04-22 17:42:25.82	t
21	7	Stihl Concrete Saw	\N	2025-04-22 17:42:35.59	t
26	8	Electric Staple Gun	\N	2025-04-23 14:50:18.538	t
27	9	Dewalt Screw Gun	\N	2025-04-23 14:50:37.588	t
28	10	Milwaukee Cordless Rotary Hammer Drill	\N	2025-04-23 14:50:59.354	t
29	11	Skil 90 Degree Angle Drill	\N	2025-04-23 14:51:18.734	t
30	12	Milwaukee Heavy Duty Right Angle Drill	\N	2025-04-23 14:51:38.045	t
31	13	Kreg Mini Jig	\N	2025-04-23 14:51:53.176	t
32	14	Blue Hawk Tile Cutter	\N	2025-04-23 14:52:01.859	t
33	15	Milwaukee Corded Sawzall	\N	2025-04-23 14:52:15.447	t
34	16	Ramset Cobra Tool	\N	2025-04-23 14:52:25.948	t
35	17	Milwaukee Small Hammer Drill	\N	2025-04-23 14:52:38.293	t
36	18	Moisture Meter	\N	2025-04-23 14:52:46.089	t
37	19	RotoZip	\N	2025-04-23 14:52:52.623	t
38	20	Soldering Iron	\N	2025-04-23 14:52:59.945	t
39	21	Milwaukee 4 1/2" Grinder	\N	2025-04-23 14:53:16.331	t
40	22	Senco Roof 450	\N	2025-04-23 14:53:24.94	t
41	23	Socket Set	\N	2025-04-23 14:53:31.432	t
42	24	Oscillating Tool	\N	2025-04-23 14:53:40.458	t
43	25	Dewalt 12V Impact Driver	\N	2025-04-23 14:53:52.522	t
44	26	Milwaukee Cordless Sawzall	\N	2025-04-23 14:54:07.452	t
45	27	Heat Gun	\N	2025-04-23 14:54:15.375	t
46	28	Staple Gun	\N	2025-04-23 14:54:26.141	t
47	29	Pipe Camera	\N	2025-04-23 14:54:31.722	t
48	30	Grinder	\N	2025-04-23 14:54:37.604	t
49	31	Spc Forstner Bit Set	\N	2025-04-23 14:54:55.271	t
50	32	Jigsaw	\N	2025-04-23 14:55:00.521	t
51	33	Plait Joyner Kit	\N	2025-04-23 14:55:09.486	t
52	34	Small Sander	\N	2025-04-23 14:55:19.355	t
53	35	Large Sander	\N	2025-04-23 14:55:25.723	t
54	36	Circular Saw	\N	2025-04-23 15:03:50.031	t
55	37	Jig-Saw	\N	2025-04-23 15:03:55.466	t
56	38	Orbital Sander	\N	2025-04-23 15:04:10.065	t
57	39	Small Sander	\N	2025-04-23 15:04:16.47	t
58	40	Rivet Kit	\N	2025-04-23 15:04:27.098	t
59	41	Metal Cut-Off Saw	\N	2025-04-23 15:04:34.49	t
60	42	3HP Plunge Router	\N	2025-04-23 15:04:48.344	t
61	43	Compact Router	\N	2025-04-23 15:04:55.893	t
62	44	Dremel	\N	2025-04-23 15:04:59.686	t
63	45	Air Nailer	\N	2025-04-23 15:05:05.484	t
64	46	Dewalt Palm Sander	\N	2025-04-23 15:05:14.605	t
65	47	Bosch ROuter	\N	2025-04-23 15:05:22.015	t
66	48	Skil Orbital Sander	\N	2025-04-23 15:05:30.644	t
67	49	Eyelet Rivet Gun	\N	2025-04-23 15:05:40.734	t
68	50	Material Mover Carts	\N	2025-04-23 15:05:56.001	t
69	51	Cord Reels	\N	2025-05-06 14:43:05.308	t
70	52	Cord Reels	\N	2025-05-06 15:33:25.97	t
71	53	Cord Reels	\N	2025-05-06 15:33:34.478	t
72	54	Cord Reels	\N	2025-05-06 15:33:40.842	t
73	55	Large Ratchet Strap	55ET66A 1600 LBS. 27'	2025-05-12 13:02:58.442	t
74	56	Large Ratchet Strap	55ET66A 1600 LBS. 27'	2025-05-12 13:03:06.617	t
75	57	Large Ratchet Strap	55ET66A 1600 LBS. 27'	2025-05-12 13:03:16.113	t
76	58	Large Ratchet Strap	55ET66A 1600 LBS. 27'	2025-05-12 13:03:23.163	t
77	59	Small Ratchet Strap	2" x 27' 10,000lbs	2025-05-12 19:08:50.155	t
78	60	Small Ratchet Strap	2" x 27' 10,000lbs	2025-05-12 19:08:58.261	t
79	61	Student Added Tool	Testing student tool creation	2025-07-07 12:28:35.648	t
80	62	Lexivon Torx bit master set	\N	2025-07-07 13:10:54.689	t
81	63	Milwaukee Hackzall reciprocating saw	milwaukee fuel brushless recip saw	2025-07-08 19:36:46.627	t
82	64	Cable Crimper	Stainless Cable & Railing	2025-08-22 14:09:53.766	t
83	65	Dehumidifier	\N	2025-08-22 16:36:16.146	t
84	66	Dehumidifier	\N	2025-08-22 16:36:35.994	t
85	67	Dehumidifier	\N	2025-08-22 16:36:44.941	t
86	68	Dehumidifier	\N	2025-08-22 16:36:49.079	t
87	69	Dehumidifier	\N	2025-08-22 16:36:52.347	t
88	70	Dehumidifier	\N	2025-08-22 16:36:55.353	t
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, username, password, name, email, role, department, phone, created_at) FROM stdin;
2	Bszippl	password	Bill Szippl	\N	technician	Physical Plant	\N	2025-03-31 17:40:22.989986
3	Gtenwalde	password	Gary Tenwalde	\N	technician	Physical Plant	\N	2025-03-31 17:40:23.079509
4	Dtomasi	password	Donald Tomasi	\N	technician	Physical Plant	\N	2025-03-31 17:40:23.165185
5	Jwilkerson	password	Jonathan Wilkerson	\N	technician	Physical Plant	\N	2025-03-31 17:40:23.250316
6	Rcheney	password	Roy Cheney	\N	technician	Physical Plant	\N	2025-03-31 17:40:23.334643
7	Mcrouse	password	Michael Crouse	\N	technician	Physical Plant	\N	2025-03-31 17:40:23.4187
8	Sdowning	password	Shane Downing	\N	technician	Physical Plant	\N	2025-03-31 17:40:23.504524
9	Tdulle	password	Tom Dulle	\N	technician	Physical Plant	\N	2025-03-31 17:40:23.589157
10	Ceitel	password	Christopher Eitel	\N	technician	Physical Plant	\N	2025-03-31 17:40:23.674144
11	Nemerick	password	Brian Emerick	\N	technician	Physical Plant	\N	2025-03-31 17:40:23.75801
12	Tflowers	password	Timothy Flowers	\N	technician	Physical Plant	\N	2025-03-31 17:40:23.84464
13	Tgannon	password	Thomas Gannon	\N	technician	Physical Plant	\N	2025-03-31 17:40:23.92939
14	Cgarver	password	Chris Garver	\N	technician	Physical Plant	\N	2025-03-31 17:40:24.014136
15	Ggood	password	Greg Good	\N	technician	Physical Plant	\N	2025-03-31 17:40:24.100651
16	Mjackson	password	Marcus Jackson	\N	technician	Physical Plant	\N	2025-03-31 17:40:24.184842
17	Rkipker	password	Robert Kipker	\N	technician	Physical Plant	\N	2025-03-31 17:40:24.269751
18	NBLooser	password	Bradley Looser	\N	technician	Physical Plant	\N	2025-03-31 17:40:24.353685
19	JMcClain	password	Jason McClain	\N	technician	Physical Plant	\N	2025-03-31 17:40:24.439567
20	MMcMillen	password	Matt McMillen	\N	technician	Physical Plant	\N	2025-03-31 17:40:24.523737
21	Bmusselman	password	Barry Musselman	\N	technician	Physical Plant	\N	2025-03-31 17:40:24.608353
22	Anichelson	password	Andrew Nichelson	\N	technician	Physical Plant	\N	2025-03-31 17:40:24.693704
23	Gpark	password	Gary Park	\N	technician	Physical Plant	\N	2025-03-31 17:40:24.778667
24	Sreed	password	Shane Reed	\N	technician	Physical Plant	\N	2025-03-31 17:40:24.86328
25	Mrinehart	password	Matt Rinehart	\N	technician	Physical Plant	\N	2025-03-31 17:40:24.950516
26	Droby	password	Duane Roby	\N	technician	Physical Plant	\N	2025-03-31 17:40:25.034961
27	Drose	password	David Rose	\N	technician	Physical Plant	\N	2025-03-31 17:40:25.121165
28	Gsammet	password	Garry Sammet	\N	technician	Physical Plant	\N	2025-03-31 17:40:25.20545
29	Mstaley	password	Marc Staley	\N	technician	Physical Plant	\N	2025-03-31 17:40:25.29133
30	tech1	password	John Smith	jsmith@example.com	technician	Maintenance	\N	2025-03-31 19:54:58.76238
31	tech2	password	Sarah Johnson	sjohnson@example.com	technician	Facilities	\N	2025-03-31 19:54:58.76238
32	tech3	password	Michael Wilson	mwilson@example.com	technician	HVAC	\N	2025-03-31 19:54:58.76238
46	Student	Onu	Student Worker	\N	student	Physics	\N	2025-04-03 19:48:29.522721
1	admin	admin	Michael Gierhart	m-gierhart@onu.edu	admin	\N	\N	2025-03-31 17:31:05.250098
49	controller	3be08f341bdac4703037c5d164400203f1d94a806e2dbd824fa675b5128a429dc741b0ab33744b106791762c967c2ce5f992ab9fcd56e031b7c76453300305d1.39cbd17c02a5301178baa52477b02ca0	Controller User	\N	controller	Administration	\N	2025-06-12 12:46:22.598803
51	other	other	Other	\N	technician	Other	\N	2025-06-16 18:25:34.201828
48	teststudent	$2b$10$rGVZvQr5nTJvP4MZo3jO4OQzDgUYXEKs8PJ9Rf6bZ7Hl9KxCdE2B.	Test Student User	\N	student	Testing Department	\N	2025-06-10 18:18:23.604552
\.


--
-- Name: buildings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.buildings_id_seq', 53, true);


--
-- Name: cost_centers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.cost_centers_id_seq', 218, true);


--
-- Name: delivery_request_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.delivery_request_items_id_seq', 9, true);


--
-- Name: delivery_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.delivery_requests_id_seq', 4, true);


--
-- Name: manual_parts_review_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.manual_parts_review_id_seq', 4, true);


--
-- Name: notification_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.notification_settings_id_seq', 1, true);


--
-- Name: part_barcodes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.part_barcodes_id_seq', 19, true);


--
-- Name: parts_delivery_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.parts_delivery_id_seq', 218, true);


--
-- Name: parts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.parts_id_seq', 1619, true);


--
-- Name: parts_issuance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.parts_issuance_id_seq', 854, true);


--
-- Name: parts_pickup_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.parts_pickup_id_seq', 79, true);


--
-- Name: parts_to_count_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.parts_to_count_id_seq', 483, true);


--
-- Name: shelves_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.shelves_id_seq', 309, true);


--
-- Name: staff_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.staff_members_id_seq', 592, true);


--
-- Name: storage_locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.storage_locations_id_seq', 3, true);


--
-- Name: tool_signouts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tool_signouts_id_seq', 5, true);


--
-- Name: tools_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tools_id_seq', 88, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 52, true);


--
-- Name: buildings buildings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.buildings
    ADD CONSTRAINT buildings_pkey PRIMARY KEY (id);


--
-- Name: cost_centers cost_centers_code_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cost_centers
    ADD CONSTRAINT cost_centers_code_key UNIQUE (code);


--
-- Name: cost_centers cost_centers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cost_centers
    ADD CONSTRAINT cost_centers_pkey PRIMARY KEY (id);


--
-- Name: delivery_request_items delivery_request_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.delivery_request_items
    ADD CONSTRAINT delivery_request_items_pkey PRIMARY KEY (id);


--
-- Name: delivery_requests delivery_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.delivery_requests
    ADD CONSTRAINT delivery_requests_pkey PRIMARY KEY (id);


--
-- Name: manual_parts_review manual_parts_review_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.manual_parts_review
    ADD CONSTRAINT manual_parts_review_pkey PRIMARY KEY (id);


--
-- Name: notification_settings notification_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_pkey PRIMARY KEY (id);


--
-- Name: part_barcodes part_barcodes_barcode_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.part_barcodes
    ADD CONSTRAINT part_barcodes_barcode_key UNIQUE (barcode);


--
-- Name: part_barcodes part_barcodes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.part_barcodes
    ADD CONSTRAINT part_barcodes_pkey PRIMARY KEY (id);


--
-- Name: parts_delivery parts_delivery_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.parts_delivery
    ADD CONSTRAINT parts_delivery_pkey PRIMARY KEY (id);


--
-- Name: parts_issuance parts_issuance_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.parts_issuance
    ADD CONSTRAINT parts_issuance_pkey PRIMARY KEY (id);


--
-- Name: parts parts_part_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.parts
    ADD CONSTRAINT parts_part_id_key UNIQUE (part_id);


--
-- Name: parts_pickup parts_pickup_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.parts_pickup
    ADD CONSTRAINT parts_pickup_pkey PRIMARY KEY (id);


--
-- Name: parts parts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.parts
    ADD CONSTRAINT parts_pkey PRIMARY KEY (id);


--
-- Name: parts_to_count parts_to_count_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.parts_to_count
    ADD CONSTRAINT parts_to_count_pkey PRIMARY KEY (id);


--
-- Name: reset_flags reset_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reset_flags
    ADD CONSTRAINT reset_flags_pkey PRIMARY KEY (key);


--
-- Name: sessions session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: shelves shelves_location_id_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shelves
    ADD CONSTRAINT shelves_location_id_name_key UNIQUE (location_id, name);


--
-- Name: shelves shelves_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shelves
    ADD CONSTRAINT shelves_pkey PRIMARY KEY (id);


--
-- Name: staff_members staff_members_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staff_members
    ADD CONSTRAINT staff_members_pkey PRIMARY KEY (id);


--
-- Name: storage_locations storage_locations_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.storage_locations
    ADD CONSTRAINT storage_locations_name_key UNIQUE (name);


--
-- Name: storage_locations storage_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.storage_locations
    ADD CONSTRAINT storage_locations_pkey PRIMARY KEY (id);


--
-- Name: tool_signouts tool_signouts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tool_signouts
    ADD CONSTRAINT tool_signouts_pkey PRIMARY KEY (id);


--
-- Name: tools tools_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tools
    ADD CONSTRAINT tools_pkey PRIMARY KEY (id);


--
-- Name: tools tools_tool_number_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tools
    ADD CONSTRAINT tools_tool_number_key UNIQUE (tool_number);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: delivery_request_items delivery_request_items_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.delivery_request_items
    ADD CONSTRAINT delivery_request_items_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.delivery_requests(id) ON DELETE CASCADE;


--
-- Name: delivery_requests delivery_requests_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.delivery_requests
    ADD CONSTRAINT delivery_requests_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id);


--
-- Name: delivery_requests delivery_requests_cost_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.delivery_requests
    ADD CONSTRAINT delivery_requests_cost_center_id_fkey FOREIGN KEY (cost_center_id) REFERENCES public.cost_centers(id);


--
-- Name: delivery_requests delivery_requests_fulfilled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.delivery_requests
    ADD CONSTRAINT delivery_requests_fulfilled_by_fkey FOREIGN KEY (fulfilled_by) REFERENCES public.users(id);


--
-- Name: manual_parts_review manual_parts_review_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.manual_parts_review
    ADD CONSTRAINT manual_parts_review_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: part_barcodes part_barcodes_part_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.part_barcodes
    ADD CONSTRAINT part_barcodes_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts(id);


--
-- Name: parts_delivery parts_delivery_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.parts_delivery
    ADD CONSTRAINT parts_delivery_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id);


--
-- Name: parts_delivery parts_delivery_cost_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.parts_delivery
    ADD CONSTRAINT parts_delivery_cost_center_id_fkey FOREIGN KEY (cost_center_id) REFERENCES public.cost_centers(id);


--
-- Name: parts_delivery parts_delivery_delivered_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.parts_delivery
    ADD CONSTRAINT parts_delivery_delivered_by_id_fkey FOREIGN KEY (delivered_by_id) REFERENCES public.users(id);


--
-- Name: parts_delivery parts_delivery_part_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.parts_delivery
    ADD CONSTRAINT parts_delivery_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts(id);


--
-- Name: parts_delivery parts_delivery_staff_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.parts_delivery
    ADD CONSTRAINT parts_delivery_staff_member_id_fkey FOREIGN KEY (staff_member_id) REFERENCES public.staff_members(id);


--
-- Name: parts_issuance parts_issuance_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.parts_issuance
    ADD CONSTRAINT parts_issuance_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id);


--
-- Name: parts_issuance parts_issuance_issued_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.parts_issuance
    ADD CONSTRAINT parts_issuance_issued_by_fkey FOREIGN KEY (issued_by) REFERENCES public.users(id);


--
-- Name: parts_issuance parts_issuance_part_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.parts_issuance
    ADD CONSTRAINT parts_issuance_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts(id) ON DELETE CASCADE;


--
-- Name: parts_pickup parts_pickup_added_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.parts_pickup
    ADD CONSTRAINT parts_pickup_added_by_id_fkey FOREIGN KEY (added_by_id) REFERENCES public.users(id);


--
-- Name: parts_pickup parts_pickup_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.parts_pickup
    ADD CONSTRAINT parts_pickup_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id);


--
-- Name: parts_pickup parts_pickup_picked_up_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.parts_pickup
    ADD CONSTRAINT parts_pickup_picked_up_by_id_fkey FOREIGN KEY (picked_up_by_id) REFERENCES public.users(id);


--
-- Name: parts_to_count parts_to_count_assigned_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.parts_to_count
    ADD CONSTRAINT parts_to_count_assigned_by_id_fkey FOREIGN KEY (assigned_by_id) REFERENCES public.users(id);


--
-- Name: parts_to_count parts_to_count_part_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.parts_to_count
    ADD CONSTRAINT parts_to_count_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts(id) ON DELETE CASCADE;


--
-- Name: shelves shelves_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shelves
    ADD CONSTRAINT shelves_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.storage_locations(id);


--
-- Name: staff_members staff_members_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staff_members
    ADD CONSTRAINT staff_members_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id);


--
-- Name: staff_members staff_members_cost_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staff_members
    ADD CONSTRAINT staff_members_cost_center_id_fkey FOREIGN KEY (cost_center_id) REFERENCES public.cost_centers(id);


--
-- Name: tool_signouts tool_signouts_technician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tool_signouts
    ADD CONSTRAINT tool_signouts_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES public.users(id);


--
-- Name: tool_signouts tool_signouts_tool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tool_signouts
    ADD CONSTRAINT tool_signouts_tool_id_fkey FOREIGN KEY (tool_id) REFERENCES public.tools(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

