--
-- PostgreSQL database dump
--

\restrict A93QqmEqBnJbXPW4GEYXjA5SrzQukKAIgug6dQVTYZCKwCOf7hSC2fysL6HiTdS

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

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
-- Name: Condition; Type: TYPE; Schema: public; Owner: desire
--

CREATE TYPE public."Condition" AS ENUM (
    'new_with_tags',
    'new_without_tags',
    'very_good',
    'good',
    'satisfactory'
);


ALTER TYPE public."Condition" OWNER TO desire;

--
-- Name: ListingStatus; Type: TYPE; Schema: public; Owner: desire
--

CREATE TYPE public."ListingStatus" AS ENUM (
    'active',
    'sold',
    'reserved',
    'deactivated'
);


ALTER TYPE public."ListingStatus" OWNER TO desire;

--
-- Name: OfferStatus; Type: TYPE; Schema: public; Owner: desire
--

CREATE TYPE public."OfferStatus" AS ENUM (
    'pending',
    'accepted',
    'declined',
    'countered',
    'expired'
);


ALTER TYPE public."OfferStatus" OWNER TO desire;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: desire
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING_PAYMENT',
    'PAID_ESCROW',
    'SHIPPED',
    'DELIVERED_CONFIRMED',
    'DISPUTED',
    'RELEASED_TO_SELLER',
    'REFUNDED',
    'CANCELLED'
);


ALTER TYPE public."OrderStatus" OWNER TO desire;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: desire
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'pending',
    'captured',
    'failed',
    'refunded'
);


ALTER TYPE public."PaymentStatus" OWNER TO desire;

--
-- Name: ReportReason; Type: TYPE; Schema: public; Owner: desire
--

CREATE TYPE public."ReportReason" AS ENUM (
    'counterfeit',
    'not_as_described',
    'damaged',
    'inappropriate',
    'other'
);


ALTER TYPE public."ReportReason" OWNER TO desire;

--
-- Name: UserBadge; Type: TYPE; Schema: public; Owner: desire
--

CREATE TYPE public."UserBadge" AS ENUM (
    'frequent_uploads',
    'speedy_shipping',
    'top_seller',
    'trusted'
);


ALTER TYPE public."UserBadge" OWNER TO desire;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: desire
--

CREATE TYPE public."UserRole" AS ENUM (
    'user',
    'admin'
);


ALTER TYPE public."UserRole" OWNER TO desire;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Banner; Type: TABLE; Schema: public; Owner: desire
--

CREATE TABLE public."Banner" (
    id text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    "imageUrl" text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Banner" OWNER TO desire;

--
-- Name: Brand; Type: TABLE; Schema: public; Owner: desire
--

CREATE TABLE public."Brand" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    "logoLetter" text NOT NULL,
    "productCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Brand" OWNER TO desire;

--
-- Name: Category; Type: TABLE; Schema: public; Owner: desire
--

CREATE TABLE public."Category" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    icon text,
    "parentId" text
);


ALTER TABLE public."Category" OWNER TO desire;

--
-- Name: Conversation; Type: TABLE; Schema: public; Owner: desire
--

CREATE TABLE public."Conversation" (
    id text NOT NULL,
    "listingId" text NOT NULL,
    "participantIds" text[],
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Conversation" OWNER TO desire;

--
-- Name: Favorite; Type: TABLE; Schema: public; Owner: desire
--

CREATE TABLE public."Favorite" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "listingId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Favorite" OWNER TO desire;

--
-- Name: Follow; Type: TABLE; Schema: public; Owner: desire
--

CREATE TABLE public."Follow" (
    id text NOT NULL,
    "followerId" text NOT NULL,
    "followingId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Follow" OWNER TO desire;

--
-- Name: Listing; Type: TABLE; Schema: public; Owner: desire
--

CREATE TABLE public."Listing" (
    id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    price double precision NOT NULL,
    brand text NOT NULL,
    size text NOT NULL,
    condition public."Condition" NOT NULL,
    material text,
    color text,
    pattern text,
    images text[],
    "sellerId" text NOT NULL,
    "categoryId" text NOT NULL,
    "categoryPath" text[],
    "likesCount" integer DEFAULT 0 NOT NULL,
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status public."ListingStatus" DEFAULT 'active'::public."ListingStatus" NOT NULL,
    "isPromoted" boolean DEFAULT false NOT NULL,
    "shippingFree" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Listing" OWNER TO desire;

--
-- Name: Message; Type: TABLE; Schema: public; Owner: desire
--

CREATE TABLE public."Message" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "senderId" text NOT NULL,
    text text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    read boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Message" OWNER TO desire;

--
-- Name: Offer; Type: TABLE; Schema: public; Owner: desire
--

CREATE TABLE public."Offer" (
    id text NOT NULL,
    "listingId" text NOT NULL,
    "buyerId" text NOT NULL,
    "sellerId" text NOT NULL,
    amount double precision NOT NULL,
    status public."OfferStatus" DEFAULT 'pending'::public."OfferStatus" NOT NULL,
    message text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Offer" OWNER TO desire;

--
-- Name: Order; Type: TABLE; Schema: public; Owner: desire
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    "listingId" text NOT NULL,
    "buyerId" text NOT NULL,
    "sellerId" text NOT NULL,
    price double precision NOT NULL,
    "shippingCost" double precision DEFAULT 0 NOT NULL,
    total double precision NOT NULL,
    status public."OrderStatus" DEFAULT 'PENDING_PAYMENT'::public."OrderStatus" NOT NULL,
    "shippingAddress" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "shippedAt" timestamp(3) without time zone
);


ALTER TABLE public."Order" OWNER TO desire;

--
-- Name: Payment; Type: TABLE; Schema: public; Owner: desire
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "stripePaymentIntentId" text NOT NULL,
    amount integer NOT NULL,
    currency text DEFAULT 'usd'::text NOT NULL,
    "platformFeeAmount" integer DEFAULT 0 NOT NULL,
    "platformFeePercent" double precision DEFAULT 0.08 NOT NULL,
    "sellerPayoutAmount" integer DEFAULT 0 NOT NULL,
    "stripeTransferId" text,
    "capturedAt" timestamp(3) without time zone,
    "releasedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    status public."PaymentStatus" DEFAULT 'pending'::public."PaymentStatus" NOT NULL
);


ALTER TABLE public."Payment" OWNER TO desire;

--
-- Name: PlatformSetting; Type: TABLE; Schema: public; Owner: desire
--

CREATE TABLE public."PlatformSetting" (
    key text NOT NULL,
    value text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PlatformSetting" OWNER TO desire;

--
-- Name: Report; Type: TABLE; Schema: public; Owner: desire
--

CREATE TABLE public."Report" (
    id text NOT NULL,
    "reporterId" text NOT NULL,
    "targetType" text NOT NULL,
    "targetId" text NOT NULL,
    reason public."ReportReason" NOT NULL,
    description text,
    status text DEFAULT 'open'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Report" OWNER TO desire;

--
-- Name: Review; Type: TABLE; Schema: public; Owner: desire
--

CREATE TABLE public."Review" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "reviewerId" text NOT NULL,
    "revieweeId" text NOT NULL,
    rating integer NOT NULL,
    comment text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Review" OWNER TO desire;

--
-- Name: Transaction; Type: TABLE; Schema: public; Owner: desire
--

CREATE TABLE public."Transaction" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productName" text NOT NULL,
    buyer text NOT NULL,
    gross double precision NOT NULL,
    fee double precision NOT NULL,
    net double precision NOT NULL,
    status text DEFAULT 'completed'::text NOT NULL,
    payout text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Transaction" OWNER TO desire;

--
-- Name: User; Type: TABLE; Schema: public; Owner: desire
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public."UserRole" DEFAULT 'user'::public."UserRole" NOT NULL,
    "avatarUrl" text,
    bio text,
    "isSuspended" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastSeen" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "ratingsCount" integer DEFAULT 0 NOT NULL,
    "avgRating" double precision DEFAULT 0 NOT NULL,
    "followersCount" integer DEFAULT 0 NOT NULL,
    "followingCount" integer DEFAULT 0 NOT NULL,
    location text,
    "verifiedMethods" text[],
    badges public."UserBadge"[],
    "stripeAccountId" text,
    "stripeOnboardingComplete" boolean DEFAULT false NOT NULL,
    "stripePayoutsEnabled" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."User" OWNER TO desire;

--
-- Name: _ConversationToUser; Type: TABLE; Schema: public; Owner: desire
--

CREATE TABLE public."_ConversationToUser" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_ConversationToUser" OWNER TO desire;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: desire
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO desire;

--
-- Data for Name: Banner; Type: TABLE DATA; Schema: public; Owner: desire
--

COPY public."Banner" (id, title, body, "imageUrl", status, "order", "createdAt") FROM stdin;
\.


--
-- Data for Name: Brand; Type: TABLE DATA; Schema: public; Owner: desire
--

COPY public."Brand" (id, name, slug, "logoLetter", "productCount", "createdAt") FROM stdin;
cmsbluqee000d35tvltfwktg9	& Other Stories	other-stories	&	0	2026-08-02 09:35:49.287
cmsbluqej000e35tvvxs3d16z	Acne Studios	acne-studios	A	0	2026-08-02 09:35:49.292
cmsbluqel000f35tvgttkelw0	Adidas	adidas	A	0	2026-08-02 09:35:49.293
cmsbluqem000g35tvgyzmhq4l	Adidas Kids	adidas-kids	A	0	2026-08-02 09:35:49.295
cmsbluqep000h35tvvb8mlws7	AGOLDE	agolde	A	0	2026-08-02 09:35:49.297
cmsbluqeq000i35tv5uyo84wn	AirPods	airpods	A	0	2026-08-02 09:35:49.299
cmsbluqes000j35tv6pao7rdj	Alexander McQueen	alexander-mcqueen	A	0	2026-08-02 09:35:49.3
cmsbluqet000k35tvnhyxckg4	Alo Yoga	alo-yoga	A	0	2026-08-02 09:35:49.302
cmsbluqev000l35tvzi5gresz	Amazon	amazon	A	0	2026-08-02 09:35:49.303
cmsbluqew000m35tvp62uneow	Anastasia Beverly Hills	anastasia-beverly-hills	A	0	2026-08-02 09:35:49.305
cmsbluqex000n35tv2zts5y5l	Ancient Greek	ancient-greek	A	0	2026-08-02 09:35:49.306
cmsbluqez000o35tvh9fti1qn	Anthropologie	anthropologie	A	0	2026-08-02 09:35:49.307
cmsbluqf0000p35tvuhs96fq1	Apple	apple	A	0	2026-08-02 09:35:49.309
cmsbluqf1000q35tvw6wkyk9s	Arc'teryx	arc-teryx	A	0	2026-08-02 09:35:49.31
cmsbluqf3000r35tvwj94gskj	Arcteryx	arcteryx	A	0	2026-08-02 09:35:49.311
cmsbluqf5000s35tvydw5tvzx	Arket	arket	A	0	2026-08-02 09:35:49.313
cmsbluqf6000t35tv143iufcl	Artek	artek	A	0	2026-08-02 09:35:49.315
cmsbluqf7000u35tvmk0phf7u	ASICS	asics	A	0	2026-08-02 09:35:49.316
cmsbluqf9000v35tvz6ivgkm2	Astrid & Miyu	astrid-miyu	A	0	2026-08-02 09:35:49.317
cmsbluqfa000w35tvpqkz3xo9	ASUS	asus	A	0	2026-08-02 09:35:49.319
cmsbluqfc000x35tv3nvkrslh	Away	away	A	0	2026-08-02 09:35:49.32
cmsbluqfd000y35tvbyixv4uk	Baggu	baggu	B	0	2026-08-02 09:35:49.322
cmsbluqff000z35tvnlgm109a	Balenciaga	balenciaga	B	0	2026-08-02 09:35:49.323
cmsbluqfh001035tvooons4af	Bandai	bandai	B	0	2026-08-02 09:35:49.325
cmsbluqfj001135tvw7yv7n2s	Bang & Olufsen	bang-olufsen	B	0	2026-08-02 09:35:49.327
cmsbluqfl001235tv0p02wjrf	Barbour	barbour	B	0	2026-08-02 09:35:49.329
cmsbluqfm001335tvxz69sjvq	Barker	barker	B	0	2026-08-02 09:35:49.331
cmsbluqfo001435tv1urof86b	Bellroy	bellroy	B	0	2026-08-02 09:35:49.332
cmsbluqfp001535tvbzparv1o	Birkenstock	birkenstock	B	0	2026-08-02 09:35:49.333
cmsbluqfq001635tvbbgrzcu1	Black Diamond	black-diamond	B	0	2026-08-02 09:35:49.335
cmsbluqfr001735tvgebco1d0	Blundstone	blundstone	B	0	2026-08-02 09:35:49.336
cmsbluqft001835tvh3pmfjbn	Boll & Branch	boll-branch	B	0	2026-08-02 09:35:49.338
cmsbluqfv001935tveevcz8zd	Bose	bose	B	0	2026-08-02 09:35:49.339
cmsbluqfx001a35tvuzx5mj7g	Bottega Veneta	bottega-veneta	B	0	2026-08-02 09:35:49.341
cmsbluqfy001b35tvsn3m23o7	Brompton	brompton	B	0	2026-08-02 09:35:49.343
cmsbluqg0001c35tv1zza38cb	Brooklinen	brooklinen	B	0	2026-08-02 09:35:49.344
cmsbluqg1001d35tv7tivoml0	Burberry	burberry	B	0	2026-08-02 09:35:49.346
cmsbluqg3001e35tvtagj9ryk	Byredo	byredo	B	0	2026-08-02 09:35:49.347
cmsbluqg4001f35tvofo8zriy	Canon	canon	C	0	2026-08-02 09:35:49.349
cmsbluqg6001g35tvaom9ym88	Canyon	canyon	C	0	2026-08-02 09:35:49.351
cmsbluqg9001h35tv5t1too7d	Car Shoe	car-shoe	C	0	2026-08-02 09:35:49.354
cmsbluqgb001i35tvri88od39	Carhartt	carhartt	C	0	2026-08-02 09:35:49.356
cmsbluqgd001j35tvcuk2dbdb	Carter's	carter-s	C	0	2026-08-02 09:35:49.357
cmsbluqgf001k35tv3ynm7y6c	Cartier	cartier	C	0	2026-08-02 09:35:49.359
cmsbluqgg001l35tv72mmq0gd	Casio	casio	C	0	2026-08-02 09:35:49.361
cmsbluqgi001m35tvjdqqikoj	Celine	celine	C	0	2026-08-02 09:35:49.362
cmsbluqgj001n35tvuw3a6w7w	CeraVe	cerave	C	0	2026-08-02 09:35:49.364
cmsbluqgl001o35tv61r1uwey	Chanel	chanel	C	0	2026-08-02 09:35:49.365
cmsbluqgm001p35tvjp0gyekg	Charles Tyrwhitt	charles-tyrwhitt	C	0	2026-08-02 09:35:49.367
cmsbluqgo001q35tvldm6mvzm	Charlotte Tilbury	charlotte-tilbury	C	0	2026-08-02 09:35:49.368
cmsbluqgp001r35tvs8xu5685	Christian Louboutin	christian-louboutin	C	0	2026-08-02 09:35:49.369
cmsbluqgs001s35tvsua25q2i	Church's	church-s	C	0	2026-08-02 09:35:49.372
cmsbluqgt001t35tv1yzpxwex	Clarks	clarks	C	0	2026-08-02 09:35:49.374
cmsbluqgw001u35tvprcrtp85	Clarks Kids	clarks-kids	C	0	2026-08-02 09:35:49.376
cmsbluqgy001v35tv8t5m2jrj	Coach	coach	C	0	2026-08-02 09:35:49.378
cmsbluqgz001w35tvstpd3ftd	Columbia	columbia	C	0	2026-08-02 09:35:49.38
cmsbluqh1001x35tvgbkwnrbb	Converse	converse	C	0	2026-08-02 09:35:49.381
cmsbluqh2001y35tv3u7q19f2	COS	cos	C	0	2026-08-02 09:35:49.383
cmsbluqh3001z35tvaj64304s	Crocs	crocs	C	0	2026-08-02 09:35:49.384
cmsbluqh5002035tv49a0ijya	Cult Furniture	cult-furniture	C	0	2026-08-02 09:35:49.385
cmsbluqh8002135tvouer996o	Dell	dell	D	0	2026-08-02 09:35:49.388
cmsbluqhb002235tvu1gmi5q5	DeMellier	demellier	D	0	2026-08-02 09:35:49.392
cmsbluqhe002335tv860zyf0g	Dickies	dickies	D	0	2026-08-02 09:35:49.394
cmsbluqhh002435tv6ztvtmsx	Diesel	diesel	D	0	2026-08-02 09:35:49.397
cmsbluqhj002535tvswfqdebi	Dior	dior	D	0	2026-08-02 09:35:49.4
cmsbluqhn002635tvpsjc9fg8	Diptyque	diptyque	D	0	2026-08-02 09:35:49.403
cmsbluqhr002735tvu1gp7l3b	Disney	disney	D	0	2026-08-02 09:35:49.407
cmsbluqhy002835tve8yhyw3f	Disney Lorcana	disney-lorcana	D	0	2026-08-02 09:35:49.414
cmsbluqi0002935tv3e5t8iwf	DJI	dji	D	0	2026-08-02 09:35:49.417
cmsbluqi2002a35tv25ju06wg	Dr. Martens	dr-martens	D	0	2026-08-02 09:35:49.419
cmsbluqi4002b35tvstekvk0w	Dragon Ball	dragon-ball	D	0	2026-08-02 09:35:49.42
cmsbluqi5002c35tvb0jr9jje	Drunk Elephant	drunk-elephant	D	0	2026-08-02 09:35:49.422
cmsbluqi7002d35tv1hwt9lnp	Duralex	duralex	D	0	2026-08-02 09:35:49.423
cmsbluqi8002e35tvmx8lcn3g	Eastpak	eastpak	E	0	2026-08-02 09:35:49.425
cmsbluqia002f35tvbpzalir1	Ermenegildo Zegna	ermenegildo-zegna	E	0	2026-08-02 09:35:49.426
cmsbluqib002g35tvo5thq59x	Estee Lauder	estee-lauder	E	0	2026-08-02 09:35:49.428
cmsbluqid002h35tv3902l1hu	Everlane	everlane	E	0	2026-08-02 09:35:49.429
cmsbluqig002i35tv5ge1p4fg	Fear of God	fear-of-god	F	0	2026-08-02 09:35:49.432
cmsbluqij002j35tvmqv5jiik	Fenty Beauty	fenty-beauty	F	0	2026-08-02 09:35:49.435
cmsbluqim002k35tvf6ezcudi	Fisher-Price	fisher-price	F	0	2026-08-02 09:35:49.439
cmsbluqio002l35tv1f6zq15a	Fjallraven	fjallraven	F	0	2026-08-02 09:35:49.441
cmsbluqir002m35tvq3qlje6u	Frame Denim	frame-denim	F	0	2026-08-02 09:35:49.443
cmsbluqis002n35tvowb9m0rv	Framework	framework	F	0	2026-08-02 09:35:49.445
cmsbluqiu002o35tvxbtjvj43	Free People	free-people	F	0	2026-08-02 09:35:49.446
cmsbluqiv002p35tv4h89vsqb	Fujifilm	fujifilm	F	0	2026-08-02 09:35:49.448
cmsbluqix002q35tvgvvqko0u	Funko	funko	F	0	2026-08-02 09:35:49.45
cmsbluqiz002r35tvdwkk74oq	Furla	furla	F	0	2026-08-02 09:35:49.451
cmsbluqj0002s35tv1o0sb1gh	G-Star RAW	g-star-raw	G	0	2026-08-02 09:35:49.452
cmsbluqj2002t35tvsyhjd1ly	Ganni	ganni	G	0	2026-08-02 09:35:49.454
cmsbluqj3002u35tvh1wbbc3c	Garmin	garmin	G	0	2026-08-02 09:35:49.455
cmsbluqj5002v35tvxuh8zzjr	Geox	geox	G	0	2026-08-02 09:35:49.457
cmsbluqj6002w35tvvmsji75h	Giant	giant	G	0	2026-08-02 09:35:49.459
cmsbluqj7002x35tvv8lno88k	Good Smile Company	good-smile-company	G	0	2026-08-02 09:35:49.46
cmsbluqj9002y35tv4su675v3	Google	google	G	0	2026-08-02 09:35:49.462
cmsbluqjc002z35tvplw2klfk	GoPro	gopro	G	0	2026-08-02 09:35:49.465
cmsbluqje003035tvl3b91ve1	Grenson	grenson	G	0	2026-08-02 09:35:49.467
cmsbluqjg003135tvhbfvw79a	Gucci	gucci	G	0	2026-08-02 09:35:49.469
cmsbluqji003235tvf0yp4oze	Gymshark	gymshark	G	0	2026-08-02 09:35:49.47
cmsbluqjj003335tv0tqldfaq	H&M	h-m	H	0	2026-08-02 09:35:49.472
cmsbluqjl003435tve4b3f9st	H&M Home	h-m-home	H	0	2026-08-02 09:35:49.473
cmsbluqjm003535tvfnnvlxzn	H&M Kids	h-m-kids	H	0	2026-08-02 09:35:49.474
cmsbluqjn003635tvw4d1nml1	Hamilton	hamilton	H	0	2026-08-02 09:35:49.476
cmsbluqjp003735tvngvq7ty7	Hasbro	hasbro	H	0	2026-08-02 09:35:49.477
cmsbluqjr003835tvp1n0vfl7	Havaianas	havaianas	H	0	2026-08-02 09:35:49.479
cmsbluqjt003935tvzl4myvao	HAY	hay	H	0	2026-08-02 09:35:49.481
cmsbluqju003a35tv1wnf8z3z	Helly Hansen	helly-hansen	H	0	2026-08-02 09:35:49.483
cmsbluqjw003b35tvqdadq0td	Herman Miller	herman-miller	H	0	2026-08-02 09:35:49.484
cmsbluqjx003c35tvhec7x84q	Hermès	herm-s	H	0	2026-08-02 09:35:49.486
cmsbluqjz003d35tvht03j0xf	Herschel	herschel	H	0	2026-08-02 09:35:49.487
cmsbluqk1003e35tvsgojjaru	Hoka	hoka	H	0	2026-08-02 09:35:49.489
cmsbluqk2003f35tvq2pjwy03	Hot Toys	hot-toys	H	0	2026-08-02 09:35:49.491
cmsbluqk4003g35tvl90tebfs	Hot Wheels	hot-wheels	H	0	2026-08-02 09:35:49.492
cmsbluqk5003h35tvubt58edl	HP	hp	H	0	2026-08-02 09:35:49.494
cmsbluqk7003i35tvgdfppu4n	Huda Beauty	huda-beauty	H	0	2026-08-02 09:35:49.496
cmsbluqk9003j35tvx6xnlt9l	Hugo Boss	hugo-boss	H	0	2026-08-02 09:35:49.498
cmsbluqkb003k35tvvnd3luxi	Hunter	hunter	H	0	2026-08-02 09:35:49.499
cmsbluqkc003l35tvlkqtzzdf	IKEA	ikea	I	0	2026-08-02 09:35:49.501
cmsbluqkf003m35tv0u2qb50q	Jeffrey Campbell	jeffrey-campbell	J	0	2026-08-02 09:35:49.504
cmsbluqkh003n35tv76p0xxkz	Jimmy Choo	jimmy-choo	J	0	2026-08-02 09:35:49.506
cmsbluqkl003o35tvm9wxygjt	Jo Malone	jo-malone	J	0	2026-08-02 09:35:49.509
cmsbluqkm003p35tvmjhenww8	John Smedley	john-smedley	J	0	2026-08-02 09:35:49.511
cmsbluqko003q35tvjrw4t05n	Joseph Joseph	joseph-joseph	J	0	2026-08-02 09:35:49.512
cmsbluqkp003r35tvnjovivhp	JW Pei	jw-pei	J	0	2026-08-02 09:35:49.514
cmsbluqkr003s35tv12a5jxw4	Kenzo	kenzo	K	0	2026-08-02 09:35:49.515
cmsbluqks003t35tvasd6yqto	Kiehl's	kiehl-s	K	0	2026-08-02 09:35:49.516
cmsbluqkt003u35tvh7iecc7h	Kipling	kipling	K	0	2026-08-02 09:35:49.518
cmsbluqkv003v35tva2h834ls	KitchenAid	kitchenaid	K	0	2026-08-02 09:35:49.52
cmsbluqkx003w35tvwrk2y53o	Kotobukiya	kotobukiya	K	0	2026-08-02 09:35:49.521
cmsbluqky003x35tv2dhz3llu	L.K.Bennett	l-k-bennett	L	0	2026-08-02 09:35:49.523
cmsbluql0003y35tv0mcxti3m	L.L.Bean	l-l-bean	L	0	2026-08-02 09:35:49.524
cmsbluql1003z35tvs41puzhl	La Roche-Posay	la-roche-posay	L	0	2026-08-02 09:35:49.526
cmsbluql3004035tv7bz98j4k	Le Creuset	le-creuset	L	0	2026-08-02 09:35:49.528
cmsbluql5004135tv13jh1wbw	Le Labo	le-labo	L	0	2026-08-02 09:35:49.529
cmsbluql6004235tv3gvraqvp	Le Specs	le-specs	L	0	2026-08-02 09:35:49.531
cmsbluql8004335tvpixse6nr	LEGO	lego	L	0	2026-08-02 09:35:49.532
cmsbluql9004435tviz7ous8h	Leica	leica	L	0	2026-08-02 09:35:49.534
cmsbluqlc004535tvggvw8xms	Lenovo	lenovo	L	0	2026-08-02 09:35:49.536
cmsbluqld004635tv0ot81rgr	Levi's	levi-s	L	0	2026-08-02 09:35:49.538
cmsbluqlf004735tvs1fbx3bk	Loake	loake	L	0	2026-08-02 09:35:49.539
cmsbluqlh004835tvld0w8l7n	Lodge	lodge	L	0	2026-08-02 09:35:49.542
cmsbluqlj004935tv8a0cg0d2	Loewe	loewe	L	0	2026-08-02 09:35:49.543
cmsbluqlk004a35tvq72cu4zf	Logitech	logitech	L	0	2026-08-02 09:35:49.545
cmsbluqlm004b35tv15lwi8vu	Longchamp	longchamp	L	0	2026-08-02 09:35:49.546
cmsbluqln004c35tv7v1rddu8	Louis Vuitton	louis-vuitton	L	0	2026-08-02 09:35:49.548
cmsbluqlp004d35tvohusu0ix	Lululemon	lululemon	L	0	2026-08-02 09:35:49.549
cmsbluqlq004e35tv77vtfvdp	MAC	mac	M	0	2026-08-02 09:35:49.551
cmsbluqls004f35tvrh9ev6c6	Madewell	madewell	M	0	2026-08-02 09:35:49.552
cmsbluqlt004g35tvylc80kvb	Magic: The Gathering	magic-the-gathering	M	0	2026-08-02 09:35:49.554
cmsbluqlw004h35tv8weq10pv	Maison Margiela	maison-margiela	M	0	2026-08-02 09:35:49.557
cmsbluqlz004i35tvqu5m0npn	Mango	mango	M	0	2026-08-02 09:35:49.56
cmsbluqm1004j35tvw54x44t0	Mango Kids	mango-kids	M	0	2026-08-02 09:35:49.561
cmsbluqm2004k35tvhz58rrda	Mango Man	mango-man	M	0	2026-08-02 09:35:49.563
cmsbluqm4004l35tva0f2vqpv	Manolo Blahnik	manolo-blahnik	M	0	2026-08-02 09:35:49.564
cmsbluqm5004m35tvpoxyjks7	Marshall	marshall	M	0	2026-08-02 09:35:49.566
cmsbluqm7004n35tv59bi4qrp	Marvel	marvel	M	0	2026-08-02 09:35:49.567
cmsbluqm8004o35tv7h45m3oa	Mattel	mattel	M	0	2026-08-02 09:35:49.569
cmsbluqma004p35tv1wi8szj5	McFarlane	mcfarlane	M	0	2026-08-02 09:35:49.57
cmsbluqmb004q35tva1g36o8z	Mejuri	mejuri	M	0	2026-08-02 09:35:49.572
cmsbluqmd004r35tv6ngynvjw	Melissa & Doug	melissa-doug	M	0	2026-08-02 09:35:49.573
cmsbluqmg004s35tvgt0z61bv	Microsoft	microsoft	M	0	2026-08-02 09:35:49.576
cmsbluqmh004t35tv3ucd2fzd	Miracle	miracle	M	0	2026-08-02 09:35:49.578
cmsbluqmk004u35tvjpaqqmjc	Missoma	missoma	M	0	2026-08-02 09:35:49.58
cmsbluqml004v35tv8zwnpws4	Monica Vinader	monica-vinader	M	0	2026-08-02 09:35:49.582
cmsbluqmn004w35tvs9uxdoyr	Montblanc	montblanc	M	0	2026-08-02 09:35:49.584
cmsbluqmp004x35tvi7zq3mxe	Mother Denim	mother-denim	M	0	2026-08-02 09:35:49.585
cmsbluqmq004y35tvewye0698	Mountain Hardwear	mountain-hardwear	M	0	2026-08-02 09:35:49.587
cmsbluqms004z35tva7mykpsd	MUJI	muji	M	0	2026-08-02 09:35:49.589
cmsbluqmu005035tv07xtfaux	Muuto	muuto	M	0	2026-08-02 09:35:49.59
cmsbluqmv005135tvcjzj52rt	NARS	nars	N	0	2026-08-02 09:35:49.592
cmsbluqmw005235tv78tqx8j2	NECA	neca	N	0	2026-08-02 09:35:49.593
cmsbluqmy005335tvyvalru12	New Balance	new-balance	N	0	2026-08-02 09:35:49.595
cmsbluqn0005435tv78le77nu	New Era	new-era	N	0	2026-08-02 09:35:49.596
cmsbluqn1005535tvjepjnvpe	Next	next	N	0	2026-08-02 09:35:49.598
cmsbluqn3005635tv2mj2zzrz	Nike	nike	N	0	2026-08-02 09:35:49.599
cmsbluqn5005735tvs5dt3p8c	Nike Kids	nike-kids	N	0	2026-08-02 09:35:49.601
cmsbluqn6005835tvx3vys0h4	Nikon	nikon	N	0	2026-08-02 09:35:49.603
cmsbluqn8005935tv9t5ud2fv	Nintendo	nintendo	N	0	2026-08-02 09:35:49.604
cmsbluqn9005a35tv5vxyapbs	Nothing	nothing	N	0	2026-08-02 09:35:49.605
cmsbluqna005b35tvrvf14p4w	Nudie Jeans	nudie-jeans	N	0	2026-08-02 09:35:49.607
cmsbluqnc005c35tvhfvhruxw	Oakley	oakley	O	0	2026-08-02 09:35:49.608
cmsbluqnd005d35tvwc7fmmuk	Off-White	off-white	O	0	2026-08-02 09:35:49.609
cmsbluqnf005e35tv0ckcgl6s	Oliver Bonas	oliver-bonas	O	0	2026-08-02 09:35:49.611
cmsbluqng005f35tv569w0ywf	Olivia Burton	olivia-burton	O	0	2026-08-02 09:35:49.613
cmsbluqni005g35tv32o6nmbz	Omega	omega	O	0	2026-08-02 09:35:49.615
cmsbluqnk005h35tvjs1e7dlo	On Running	on-running	O	0	2026-08-02 09:35:49.616
cmsbluqnl005i35tvm27hipyy	One Piece	one-piece	O	0	2026-08-02 09:35:49.618
cmsbluqnn005j35tvth0fhiih	OnePlus	oneplus	O	0	2026-08-02 09:35:49.62
cmsbluqnp005k35tv35caro49	Pandora	pandora	P	0	2026-08-02 09:35:49.622
cmsbluqns005l35tvxxszcbzr	Patagonia	patagonia	P	0	2026-08-02 09:35:49.624
cmsbluqnu005m35tvjowmv9zh	Peloton	peloton	P	0	2026-08-02 09:35:49.626
cmsbluqnv005n35tvbcebrx1q	Playmobil	playmobil	P	0	2026-08-02 09:35:49.628
cmsbluqnx005o35tvz4p87xxf	Pokemon	pokemon	P	0	2026-08-02 09:35:49.629
cmsbluqny005p35tvw7aspspe	Polo Ralph Lauren	polo-ralph-lauren	P	0	2026-08-02 09:35:49.631
cmsbluqo0005q35tv7s5pkwox	Prada	prada	P	0	2026-08-02 09:35:49.632
cmsbluqo1005r35tvjyk2828v	Puma	puma	P	0	2026-08-02 09:35:49.634
cmsbluqo3005s35tv15vx2agj	Quay Australia	quay-australia	Q	0	2026-08-02 09:35:49.635
cmsbluqo4005t35tvuthtm5mj	Radley	radley	R	0	2026-08-02 09:35:49.637
cmsbluqo6005u35tv78d4l17v	Rains	rains	R	0	2026-08-02 09:35:49.638
cmsbluqo7005v35tv38tplo95	Rapha	rapha	R	0	2026-08-02 09:35:49.64
cmsbluqo9005w35tvmsam4xf0	Rare Beauty	rare-beauty	R	0	2026-08-02 09:35:49.641
cmsbluqoa005x35tv9dz9rmci	Ray-Ban	ray-ban	R	0	2026-08-02 09:35:49.643
cmsbluqoc005y35tvk8igdkdy	Razer	razer	R	0	2026-08-02 09:35:49.644
cmsbluqod005z35tvvuvs90s0	Red Wing	red-wing	R	0	2026-08-02 09:35:49.646
cmsbluqof006035tvxlfikjd1	Reformation	reformation	R	0	2026-08-02 09:35:49.648
cmsbluqoh006135tvje0hv2ek	RM Williams	rm-williams	R	0	2026-08-02 09:35:49.649
cmsbluqoi006235tvtuarww6d	Rogue	rogue	R	0	2026-08-02 09:35:49.65
cmsbluqok006335tv4mgx25gj	Rolex	rolex	R	0	2026-08-02 09:35:49.653
cmsbluqol006435tvi3l6oglg	Rothy's	rothy-s	R	0	2026-08-02 09:35:49.654
cmsbluqoo006535tv6f17u649	Saint Laurent	saint-laurent	S	0	2026-08-02 09:35:49.656
cmsbluqoq006635tvpaxhnpgq	Salomon	salomon	S	0	2026-08-02 09:35:49.658
cmsbluqos006735tvn964omvj	Sam Edelman	sam-edelman	S	0	2026-08-02 09:35:49.661
cmsbluqou006835tvc1v3dmrf	Samsung	samsung	S	0	2026-08-02 09:35:49.663
cmsbluqow006935tvz4fi677b	Secrid	secrid	S	0	2026-08-02 09:35:49.664
cmsbluqox006a35tv1tbcz4ma	Seiko	seiko	S	0	2026-08-02 09:35:49.666
cmsbluqoz006b35tv3w0u24jt	Sennheiser	sennheiser	S	0	2026-08-02 09:35:49.667
cmsbluqp0006c35tvcn69mdm8	Shimano	shimano	S	0	2026-08-02 09:35:49.669
cmsbluqp1006d35tv1g5eq1fo	Sideshow	sideshow	S	0	2026-08-02 09:35:49.67
cmsbluqp4006e35tvkuswc619	Smeg	smeg	S	0	2026-08-02 09:35:49.672
cmsbluqp7006f35tvfudcjphi	Solovair	solovair	S	0	2026-08-02 09:35:49.675
cmsbluqp9006g35tvvlwn5pyp	Sonos	sonos	S	0	2026-08-02 09:35:49.677
cmsbluqpa006h35tvlsrdx8yv	Sony	sony	S	0	2026-08-02 09:35:49.679
cmsbluqpc006i35tv13d20xip	Specialized	specialized	S	0	2026-08-02 09:35:49.68
cmsbluqpd006j35tvamrsm7p3	Sports Cards	sports-cards	S	0	2026-08-02 09:35:49.682
cmsbluqpf006k35tvnvzj81py	Star Wars	star-wars	S	0	2026-08-02 09:35:49.683
cmsbluqph006l35tvbun31wpv	Start-Rite	start-rite	S	0	2026-08-02 09:35:49.686
cmsbluqpj006m35tv9nolwx62	Staud	staud	S	0	2026-08-02 09:35:49.688
cmsbluqpm006n35tv0vdys02h	SteelSeries	steelseries	S	0	2026-08-02 09:35:49.691
cmsbluqpp006o35tvt85z63hv	Stutterheim	stutterheim	S	0	2026-08-02 09:35:49.693
cmsbluqpr006p35tv10gj51ry	Sunspel	sunspel	S	0	2026-08-02 09:35:49.695
cmsbluqpt006q35tvj5ja4fx6	Supreme	supreme	S	0	2026-08-02 09:35:49.697
cmsbluqpu006r35tviw0zp71c	Swarovski	swarovski	S	0	2026-08-02 09:35:49.699
cmsbluqpw006s35tvq63tlvqu	Sweaty Betty	sweaty-betty	S	0	2026-08-02 09:35:49.701
cmsbluqpx006t35tvbcrgk11d	Tag Heuer	tag-heuer	T	0	2026-08-02 09:35:49.702
cmsbluqpz006u35tvhbirndvw	Tamara Mellon	tamara-mellon	T	0	2026-08-02 09:35:49.703
cmsbluqq0006v35tvox1qzm4i	Teva	teva	T	0	2026-08-02 09:35:49.705
cmsbluqq2006w35tvhxwnmcvv	The Children's Place	the-children-s-place	T	0	2026-08-02 09:35:49.707
cmsbluqq4006x35tv0015w68s	The North Face	the-north-face	T	0	2026-08-02 09:35:49.708
cmsbluqq7006y35tv4st7gzlz	The Ordinary	the-ordinary	T	0	2026-08-02 09:35:49.712
cmsbluqq9006z35tvnuexgy9l	The White Company	the-white-company	T	0	2026-08-02 09:35:49.714
cmsbluqqb007035tvnekh4m3w	Theory	theory	T	0	2026-08-02 09:35:49.716
cmsbluqqd007135tvx4zaic72	Theragun	theragun	T	0	2026-08-02 09:35:49.718
cmsbluqqf007235tvl8k8epgk	Tiffany & Co.	tiffany-co	T	0	2026-08-02 09:35:49.72
cmsbluqqh007335tv899577ud	Timberland	timberland	T	0	2026-08-02 09:35:49.721
cmsbluqqj007435tvdd87t3br	Timex	timex	T	0	2026-08-02 09:35:49.724
cmsbluqqm007535tvq0gnrg83	Tissot	tissot	T	0	2026-08-02 09:35:49.726
cmsbluqqp007635tvcxdql7c7	Tod's	tod-s	T	0	2026-08-02 09:35:49.729
cmsbluqqs007735tviyvq4mp1	Tom Ford	tom-ford	T	0	2026-08-02 09:35:49.732
cmsbluqqu007835tvgo9zut0i	Toms	toms	T	0	2026-08-02 09:35:49.734
cmsbluqqy007935tvygeyj9wv	Trek	trek	T	0	2026-08-02 09:35:49.739
cmsbluqr0007a35tvqfye7rvb	TRX	trx	T	0	2026-08-02 09:35:49.741
cmsbluqr4007b35tv79k3w217	Tumi	tumi	T	0	2026-08-02 09:35:49.744
cmsbluqr6007c35tvxizf028o	Ugg	ugg	U	0	2026-08-02 09:35:49.747
cmsbluqr8007d35tvtes856gg	Under Armour	under-armour	U	0	2026-08-02 09:35:49.749
cmsbluqra007e35tv5c2sbovh	Uniqlo	uniqlo	U	0	2026-08-02 09:35:49.75
cmsbluqrb007f35tv10gecjo1	Uniqlo Kids	uniqlo-kids	U	0	2026-08-02 09:35:49.752
cmsbluqrc007g35tv0nbx0cxl	Vagabond	vagabond	V	0	2026-08-02 09:35:49.753
cmsbluqre007h35tvt4ik3yjw	Valve	valve	V	0	2026-08-02 09:35:49.754
cmsbluqrf007i35tv728ynhaw	Vans	vans	V	0	2026-08-02 09:35:49.756
cmsbluqrh007j35tvmdjpbhz7	Vans Kids	vans-kids	V	0	2026-08-02 09:35:49.757
cmsbluqrj007k35tvcgzyudje	Veja	veja	V	0	2026-08-02 09:35:49.759
cmsbluqrk007l35tv63omjz70	Vitamix	vitamix	V	0	2026-08-02 09:35:49.761
cmsbluqrm007m35tv88pzfk08	VTech	vtech	V	0	2026-08-02 09:35:49.762
cmsbluqrn007n35tvcsme8cjf	West Elm	west-elm	W	0	2026-08-02 09:35:49.763
cmsbluqrp007o35tvho1v5jv2	Xiaomi	xiaomi	X	0	2026-08-02 09:35:49.766
cmsbluqrr007p35tv4828m7iy	Yu-Gi-Oh!	yu-gi-oh	Y	0	2026-08-02 09:35:49.767
cmsbluqrs007q35tvwj9hfvm1	Zara	zara	Z	0	2026-08-02 09:35:49.769
cmsbluqru007r35tvrfcp54is	Zara Home	zara-home	Z	0	2026-08-02 09:35:49.771
cmsbluqrw007s35tvd0htzcs0	Zara Kids	zara-kids	Z	0	2026-08-02 09:35:49.773
cmsbluqry007t35tvovv1oewm	Zwilling	zwilling	Z	0	2026-08-02 09:35:49.774
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: desire
--

COPY public."Category" (id, name, slug, icon, "parentId") FROM stdin;
women	Women	women	\N	\N
women-clothing	Clothing	clothing	\N	women
women-clothing-dresses	Dresses	dresses	\N	women-clothing
women-clothing-tops	Tops & T-Shirts	tops-tshirts	\N	women-clothing
women-clothing-jeans	Jeans	jeans	\N	women-clothing
women-clothing-jackets	Jackets & Coats	jackets-coats	\N	women-clothing
women-clothing-skirts	Skirts	skirts	\N	women-clothing
women-clothing-trousers	Trousers	trousers	\N	women-clothing
women-clothing-activewear	Activewear	activewear	\N	women-clothing
women-clothing-jumpers	Jumpers & Sweaters	jumpers-sweaters	\N	women-clothing
women-clothing-shorts	Shorts	shorts	\N	women-clothing
women-shoes	Shoes	shoes	\N	women
women-shoes-sneakers	Sneakers	sneakers	\N	women-shoes
women-shoes-heels	Heels	heels	\N	women-shoes
women-shoes-boots	Boots	boots	\N	women-shoes
women-shoes-flats	Flats	flats	\N	women-shoes
women-shoes-sandals	Sandals	sandals	\N	women-shoes
women-bags	Bags	bags	\N	women
women-bags-handbags	Handbags	handbags	\N	women-bags
women-bags-backpacks	Backpacks	backpacks	\N	women-bags
women-bags-crossbody	Crossbody Bags	crossbody	\N	women-bags
women-bags-totes	Totes	totes	\N	women-bags
women-accessories	Accessories	accessories	\N	women
women-acc-jewellery	Jewellery	jewellery	\N	women-accessories
women-acc-scarves	Scarves	scarves	\N	women-accessories
women-acc-hats	Hats	hats	\N	women-accessories
women-acc-belts	Belts	belts	\N	women-accessories
women-acc-sunglasses	Sunglasses	sunglasses	\N	women-accessories
women-beauty	Beauty	beauty	\N	women
women-beauty-skincare	Skincare	skincare	\N	women-beauty
women-beauty-makeup	Makeup	makeup	\N	women-beauty
women-beauty-fragrance	Fragrance	fragrance	\N	women-beauty
men	Men	men	\N	\N
men-clothing	Clothing	clothing	\N	men
men-clothing-tshirts	T-Shirts	tshirts	\N	men-clothing
men-clothing-shirts	Shirts	shirts	\N	men-clothing
men-clothing-jeans	Jeans	jeans	\N	men-clothing
men-clothing-jackets	Jackets & Coats	jackets-coats	\N	men-clothing
men-clothing-trousers	Trousers	trousers	\N	men-clothing
men-clothing-hoodies	Hoodies & Sweatshirts	hoodies-sweatshirts	\N	men-clothing
men-shoes	Shoes	shoes	\N	men
men-shoes-sneakers	Sneakers	sneakers	\N	men-shoes
men-shoes-boots	Boots	boots	\N	men-shoes
men-shoes-loafers	Loafers	loafers	\N	men-shoes
men-accessories	Accessories	accessories	\N	men
men-acc-watches	Watches	watches	\N	men-accessories
men-acc-wallets	Wallets	wallets	\N	men-accessories
men-acc-belts	Belts	belts	\N	men-accessories
men-acc-hats	Hats	hats	\N	men-accessories
designer	Designer	designer	\N	\N
designer-bags	Designer Bags	bags	\N	designer
designer-shoes	Designer Shoes	shoes	\N	designer
designer-clothing	Designer Clothing	clothing	\N	designer
designer-accessories	Designer Accessories	accessories	\N	designer
kids	Kids	kids	\N	\N
kids-clothing	Kids Clothing	clothing	\N	kids
kids-shoes	Kids Shoes	shoes	\N	kids
kids-toys	Toys & Games	toys-games	\N	kids
home	Home	home	\N	\N
home-furniture	Furniture	furniture	\N	home
home-decor	Home Decor	decor	\N	home
home-kitchen	Kitchen	kitchen	\N	home
home-bedding	Bedding	bedding	\N	home
electronics	Electronics	electronics	\N	\N
electronics-phones	Phones	phones	\N	electronics
electronics-tablets	Tablets	tablets	\N	electronics
electronics-laptops	Laptops & Computers	laptops	\N	electronics
electronics-audio	Audio	audio	\N	electronics
electronics-cameras	Cameras	cameras	\N	electronics
electronics-gaming	Gaming	gaming	\N	electronics
hobbies	Hobbies & Collectibles	hobbies-collectibles	\N	\N
hobbies-collectibles	Collectibles	collectibles	\N	hobbies
hobbies-figurines	Figurines	figurines	\N	hobbies
hobbies-trading-cards	Trading Cards	trading-cards	\N	hobbies
sports	Sports	sports	\N	\N
sports-fitness	Fitness Equipment	fitness-equipment	\N	sports
sports-outdoor	Outdoor Gear	outdoor-gear	\N	sports
sports-cycling	Cycling	cycling	\N	sports
\.


--
-- Data for Name: Conversation; Type: TABLE DATA; Schema: public; Owner: desire
--

COPY public."Conversation" (id, "listingId", "participantIds", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Favorite; Type: TABLE DATA; Schema: public; Owner: desire
--

COPY public."Favorite" (id, "userId", "listingId", "createdAt") FROM stdin;
\.


--
-- Data for Name: Follow; Type: TABLE DATA; Schema: public; Owner: desire
--

COPY public."Follow" (id, "followerId", "followingId", "createdAt") FROM stdin;
cmscpd3q80001353hhiprw477	cmsbluq9w000835tvh233rkvy	cmsbluq9i000435tv0nbox5t0	2026-08-03 04:01:51.392
cmscpd3qc0003353hcjeayqjc	cmsbluq9w000835tvh233rkvy	cmsco7b27000035sj7fkgfnl0	2026-08-03 04:01:51.396
cmscpd3qe0005353hkxwknkto	cmsbluq9w000835tvh233rkvy	cmsbluqa4000c35tv539ub95q	2026-08-03 04:01:51.398
cmscpd3qi0007353hhdnfnic6	cmsbluq9w000835tvh233rkvy	cmsbp0b5t0000352tk2711tm1	2026-08-03 04:01:51.402
cmscpd3qn0009353hmp6qybfn	cmsbluq9w000835tvh233rkvy	cmsbluq9y000935tvspusb61q	2026-08-03 04:01:51.407
cmscpd3qq000b353hk2g79oqm	cmsbluq9w000835tvh233rkvy	cmsbluq9z000a35tvscfnuv6v	2026-08-03 04:01:51.41
cmscpd3qt000d353h9ggwk1si	cmsbluq9y000935tvspusb61q	cmsbluq9l000535tvizeide9b	2026-08-03 04:01:51.414
cmscpd3qw000f353hybyb5jb8	cmsbluq9y000935tvspusb61q	cmsbluq9u000735tvw9nt9lq0	2026-08-03 04:01:51.416
cmscpd3qy000h353hh1i56wp2	cmsbluq9y000935tvspusb61q	cmsbluqa4000c35tv539ub95q	2026-08-03 04:01:51.419
cmscpd3s3000n353h92tno2tx	cmsbluq9z000a35tvscfnuv6v	cmsco7b27000035sj7fkgfnl0	2026-08-03 04:01:51.46
cmscpd3s5000p353hx799wleu	cmsbluq9z000a35tvscfnuv6v	cmsbluq9u000735tvw9nt9lq0	2026-08-03 04:01:51.461
cmscpd3s7000r353hpfwgbhmf	cmsbluq9z000a35tvscfnuv6v	cmsbluq99000235tv18ck93kn	2026-08-03 04:01:51.463
cmscpd3sb000t353h5lg8ucvx	cmsbluq9z000a35tvscfnuv6v	cmsbluq9l000535tvizeide9b	2026-08-03 04:01:51.468
cmscpd3si000x353ha0ia4zeq	cmsbluqa2000b35tvm6f1r5f1	cmsbluq99000235tv18ck93kn	2026-08-03 04:01:51.474
cmscpd3sk000z353hj6ysl41q	cmsbluqa2000b35tvm6f1r5f1	cmsbluq9l000535tvizeide9b	2026-08-03 04:01:51.476
cmscpd3sm0011353h0umvwb2o	cmsbluqa4000c35tv539ub95q	cmsbluq9e000335tvj2ukaywp	2026-08-03 04:01:51.478
cmscpd3so0013353hpvjygcyx	cmsbluqa4000c35tv539ub95q	cmsco7b27000035sj7fkgfnl0	2026-08-03 04:01:51.48
cmscpd3sp0015353htiscggp4	cmsbluqa4000c35tv539ub95q	cmsbluqa2000b35tvm6f1r5f1	2026-08-03 04:01:51.482
cmscpd3sr0017353h3056cr0e	cmsbluqa4000c35tv539ub95q	cmsbluq9r000635tvcr4sfb94	2026-08-03 04:01:51.484
cmscpd3st0019353hxqj3gzdc	cmsbluq95000135tvl0awkx44	cmsco7b27000035sj7fkgfnl0	2026-08-03 04:01:51.485
cmscpd3su001b353hkx4yz9j5	cmsbluq95000135tvl0awkx44	cmsbluqa4000c35tv539ub95q	2026-08-03 04:01:51.487
cmscpd3sw001d353hy7lgpjmk	cmsbluq95000135tvl0awkx44	cmsbluq9y000935tvspusb61q	2026-08-03 04:01:51.488
cmscpd3sz001h353hnvm4jan2	cmsbluq99000235tv18ck93kn	cmsbluqa4000c35tv539ub95q	2026-08-03 04:01:51.492
cmscpd3t1001j353hq1igfqjw	cmsbluq99000235tv18ck93kn	cmsbluq9l000535tvizeide9b	2026-08-03 04:01:51.493
cmscpd3t3001l353hu7yth1rw	cmsbluq99000235tv18ck93kn	cmsbluqa2000b35tvm6f1r5f1	2026-08-03 04:01:51.496
cmscpd3t5001n353h8znbq229	cmsbluq9e000335tvj2ukaywp	cmsbluq9l000535tvizeide9b	2026-08-03 04:01:51.497
cmscpd3t8001p353hys3f6byl	cmsbluq9e000335tvj2ukaywp	cmsbluq9r000635tvcr4sfb94	2026-08-03 04:01:51.5
cmscpd3t9001r353hiv20bqzj	cmsbluq9e000335tvj2ukaywp	cmsbluq9i000435tv0nbox5t0	2026-08-03 04:01:51.502
cmscpd3tb001t353hi83uarpj	cmsbluq9e000335tvj2ukaywp	cmsbluqa4000c35tv539ub95q	2026-08-03 04:01:51.503
cmscpd3tc001v353holucr4s1	cmsbluq9e000335tvj2ukaywp	cmsbluq9z000a35tvscfnuv6v	2026-08-03 04:01:51.505
cmscpd3te001x353hgnuwftkk	cmsbluq9i000435tv0nbox5t0	cmsbluq9e000335tvj2ukaywp	2026-08-03 04:01:51.506
cmscpd3tf001z353hlwd978yt	cmsbluq9i000435tv0nbox5t0	cmsbluq9l000535tvizeide9b	2026-08-03 04:01:51.508
cmscpd3th0021353h6vad0427	cmsbluq9l000535tvizeide9b	cmsbluq99000235tv18ck93kn	2026-08-03 04:01:51.509
cmscpd3ti0023353hcoyo51s8	cmsbluq9l000535tvizeide9b	cmsbluq9r000635tvcr4sfb94	2026-08-03 04:01:51.51
cmscpd3tn0027353h5q63bf8f	cmsbluq9l000535tvizeide9b	cmsbluq9e000335tvj2ukaywp	2026-08-03 04:01:51.516
cmscpd3tr0029353hj5klr36t	cmsbluq9l000535tvizeide9b	cmsbluq9z000a35tvscfnuv6v	2026-08-03 04:01:51.519
cmscpd3tt002b353h90gzdoj2	cmsbluq9r000635tvcr4sfb94	cmsbluqa2000b35tvm6f1r5f1	2026-08-03 04:01:51.521
cmscpd3tv002d353h9v5jxomn	cmsbluq9r000635tvcr4sfb94	cmsbluq9l000535tvizeide9b	2026-08-03 04:01:51.523
cmscpd3tw002f353hgfrymxs3	cmsbluq9r000635tvcr4sfb94	cmsco7b27000035sj7fkgfnl0	2026-08-03 04:01:51.525
cmscpd3u0002j353h8vr8c8fv	cmsbluq9u000735tvw9nt9lq0	cmsbluq99000235tv18ck93kn	2026-08-03 04:01:51.528
cmscpd3u2002l353hu9ssyeir	cmsbluq9u000735tvw9nt9lq0	cmsco7b27000035sj7fkgfnl0	2026-08-03 04:01:51.53
cmscpd3u3002n353hgjip8idi	cmsbluq9u000735tvw9nt9lq0	cmsbluq9i000435tv0nbox5t0	2026-08-03 04:01:51.532
cmscpd3u7002p353h1m07dxab	cmsbluq9u000735tvw9nt9lq0	cmsbp0b5t0000352tk2711tm1	2026-08-03 04:01:51.535
cmscpd3ub002v353hdhkit412	cmsbp0b5t0000352tk2711tm1	cmsbluq9u000735tvw9nt9lq0	2026-08-03 04:01:51.54
cmscpd3ud002x353hpj56llbf	cmsbp0b5t0000352tk2711tm1	cmsbluq9i000435tv0nbox5t0	2026-08-03 04:01:51.541
cmscpd3uf002z353h854q1pkn	cmsbp0b5t0000352tk2711tm1	cmsbluq9l000535tvizeide9b	2026-08-03 04:01:51.543
cmscpd3ug0031353hyp13if1k	cmsbp0b5t0000352tk2711tm1	cmsbluqa4000c35tv539ub95q	2026-08-03 04:01:51.545
cmscpd3um0037353hu1w6pqis	cmsco7b27000035sj7fkgfnl0	cmsbluqa2000b35tvm6f1r5f1	2026-08-03 04:01:51.551
cmscpd3uo0039353hne3rvmep	cmsco7b27000035sj7fkgfnl0	cmsbluq99000235tv18ck93kn	2026-08-03 04:01:51.553
\.


--
-- Data for Name: Listing; Type: TABLE DATA; Schema: public; Owner: desire
--

COPY public."Listing" (id, title, description, price, brand, size, condition, material, color, pattern, images, "sellerId", "categoryId", "categoryPath", "likesCount", "uploadedAt", status, "isPromoted", "shippingFree") FROM stdin;
cmsbluqxi00ch35tvn6fmzuxd	H&M Home Plant Pot - White	H&M Home Plant Pot — White. Brand new without tags. Never worn or used.	12	H&M Home	Small	new_without_tags	Wax	Cream	\N	{https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&q=80}	cmsbluqa4000c35tv539ub95q	home-decor	{Home,"Home Decor"}	3	2026-02-15 17:15:54.78	active	f	f
cmsbluqxk00cj35tvtrhiz6rs	Cult Furniture Throw Pillow - Cream	Cult Furniture Throw Pillow — Cream. In excellent condition. Worn once or twice, like new.	17	Cult Furniture	Small	very_good	Cotton	Cream	\N	{https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&q=80}	cmsbluq95000135tvl0awkx44	home-decor	{Home,"Home Decor"}	18	2026-05-01 12:42:07.431	active	f	f
cmsbluqxm00cl35tvh4pmv32z	MUJI Throw Pillow - Gold	MUJI Throw Pillow — Gold. In excellent condition. Worn once or twice, like new.	43	MUJI	Medium	very_good	Ceramic	Gold	\N	{https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&q=80,https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&q=80}	cmsbluq99000235tv18ck93kn	home-decor	{Home,"Home Decor"}	14	2026-07-20 20:27:29.112	active	f	t
cmsbluqxo00cn35tv3gv56zsb	Zara Home Vase - Terracotta	Zara Home Vase — Terracotta. In excellent condition. Worn once or twice, like new.	62	Zara Home	Medium	very_good	Glass	Cream	\N	{https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&q=80}	cmsbluq9e000335tvj2ukaywp	home-decor	{Home,"Home Decor"}	16	2026-04-22 19:37:52.892	active	t	f
cmsbluqxr00cp35tvidu3gba7	H&M Home Vase - Pink	H&M Home Vase — Pink. In excellent condition. Worn once or twice, like new.	35	H&M Home	Large	very_good	Glass	Gold	\N	{https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&q=80,https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&q=80}	cmsbluq9i000435tv0nbox5t0	home-decor	{Home,"Home Decor"}	8	2026-06-07 11:37:06.186	deactivated	f	t
cmsbluqxt00cr35tvj4cdp7kn	Bang & Olufsen QC45 - Anthracite	Bang & Olufsen QC45 — Anthracite. In excellent condition. Worn once or twice, like new.	163	Bang & Olufsen	Standard	very_good	\N	\N	\N	{https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80}	cmsbluq9l000535tvizeide9b	electronics-audio	{Electronics,Audio}	18	2026-05-03 16:27:59.954	active	f	f
cmsbluqxw00ct35tvc6u1qx3g	Bang & Olufsen QC45 - White	Bang & Olufsen QC45 — White. In excellent condition. Worn once or twice, like new.	194	Bang & Olufsen	Standard	very_good	\N	\N	\N	{https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80,https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&q=80}	cmsbluq9r000635tvcr4sfb94	electronics-audio	{Electronics,Audio}	56	2026-07-04 10:32:12.544	active	f	t
cmsbluqxy00cv35tvg430ep1h	Sonos QC45 - Silver	Sonos QC45 — Silver. In good condition with normal signs of wear.	115	Sonos	One Size	good	\N	\N	\N	{https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&q=80,https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80}	cmsbluq9u000735tvw9nt9lq0	electronics-audio	{Electronics,Audio}	51	2026-07-22 00:47:08.996	active	f	t
cmsbluqy000cx35tv8f4h6n8d	AirPods AirPods Pro 2 - White	AirPods AirPods Pro 2 — White. In excellent condition. Worn once or twice, like new.	376	AirPods	One Size	very_good	\N	\N	\N	{https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&q=80}	cmsbluq9w000835tvh233rkvy	electronics-audio	{Electronics,Audio}	145	2026-02-03 07:27:34.347	reserved	f	t
cmsbluqy200cz35tvbtimb58c	Sonos Era 100 - Cream	Sonos Era 100 — Cream. In good condition with normal signs of wear.	29	Sonos	Standard	good	\N	\N	\N	{https://images.unsplash.com/photo-1526045431048-f857369baa09?w=600&q=80,https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80}	cmsbluq9y000935tvspusb61q	electronics-audio	{Electronics,Audio}	18	2026-07-25 04:15:11.463	deactivated	f	t
cmsbluqy400d135tv8afh4y2g	AirPods AirPods 4 - Black	AirPods AirPods 4 — Black. In excellent condition. Worn once or twice, like new.	248	AirPods	Standard	very_good	\N	\N	\N	{https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&q=80,https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&q=80}	cmsbluq9z000a35tvscfnuv6v	electronics-audio	{Electronics,Audio}	16	2026-07-25 21:44:46.078	active	t	t
cmsbluqy600d335tvhfj8dey0	Bose Stanmore II - Silver	Bose Stanmore II — Silver. In excellent condition. Worn once or twice, like new.	111	Bose	Standard	very_good	\N	\N	\N	{https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&q=80,https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&q=80}	cmsbluqa2000b35tvm6f1r5f1	electronics-audio	{Electronics,Audio}	13	2026-07-19 07:25:49.787	active	f	f
cmsbluqy800d535tvi595srfs	Sony Era 100 - Midnight	Sony Era 100 — Midnight. In good condition with normal signs of wear.	157	Sony	One Size	good	\N	\N	\N	{https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80}	cmsbluqa4000c35tv539ub95q	electronics-audio	{Electronics,Audio}	7	2026-04-16 12:49:34.509	active	f	f
cmsbluqya00d735tvtl3dprnf	OnePlus Phone 2a - White 256GB	OnePlus Phone 2a — White 256GB. Brand new with original tags attached.	766	OnePlus	128GB	new_with_tags	\N	\N	\N	{https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=600&q=80}	cmsbluq95000135tvl0awkx44	electronics-phones	{Electronics,Phones}	4	2026-04-24 23:09:11.406	active	f	t
cmsbluqyd00d935tv0whqaoky	Sony OnePlus 12 - Black 128GB	Sony OnePlus 12 — Black 128GB. Shows visible signs of wear but still plenty of life left.	660	Sony	128GB	satisfactory	\N	\N	\N	{https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80}	cmsbluq99000235tv18ck93kn	electronics-phones	{Electronics,Phones}	387	2026-06-26 12:46:46.856	active	f	t
cmsbluqyf00db35tvrvqsv34z	Apple Galaxy S24 Ultra - Navy 256GB	Apple Galaxy S24 Ultra — Navy 256GB. In good condition with normal signs of wear.	711	Apple	1TB	good	\N	\N	\N	{https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80}	cmsbluq9e000335tvj2ukaywp	electronics-phones	{Electronics,Phones}	19	2026-07-24 08:00:50.449	active	f	f
cmsbluqyi00dd35tvpa5xzqh6	Sony OnePlus 12 - Navy 256GB	Sony OnePlus 12 — Navy 256GB. In excellent condition. Worn once or twice, like new.	816	Sony	128GB	very_good	\N	\N	\N	{https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80}	cmsbluq9i000435tv0nbox5t0	electronics-phones	{Electronics,Phones}	308	2026-05-06 16:46:44.254	sold	t	t
cmsbluqs5007v35tvf5ivtwv7	Reformation Shirt Dress - Navy Floral	Reformation Shirt Dress — Navy Floral. Brand new without tags. Never worn or used.	40	Reformation	10	new_without_tags	Cotton	Yellow	\N	{https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600&q=80}	cmsbluq95000135tvl0awkx44	women-clothing-dresses	{Women,Clothing,Dresses}	8	2026-04-18 10:25:10.584	active	f	t
cmsbluqsb007x35tvsot93cc0	COS Linen Shift Dress - Beige Linen	COS Linen Shift Dress — Beige Linen. Brand new without tags. Never worn or used.	28	COS	12	new_without_tags	Satin	Cream	\N	{https://images.unsplash.com/photo-1526045431048-f857369baa09?w=600&q=80}	cmsbluq99000235tv18ck93kn	women-clothing-dresses	{Women,Clothing,Dresses}	8	2026-02-23 01:03:26.523	active	f	t
cmsbluqsd007z35tvv6a6xqve	H&M Floral Wrap Dress - Navy Floral	H&M Floral Wrap Dress — Navy Floral. Brand new without tags. Never worn or used.	122	H&M	14	new_without_tags	Cotton	Red	\N	{https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80}	cmsbluq9e000335tvj2ukaywp	women-clothing-dresses	{Women,Clothing,Dresses}	27	2026-02-01 02:36:03.277	reserved	f	f
cmsbluqsg008135tvavzgvsu2	Ganni Slip Dress - Navy Floral	Ganni Slip Dress — Navy Floral. Brand new without tags. Never worn or used.	51	Ganni	10	new_without_tags	Satin	Beige	\N	{https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&q=80,https://images.unsplash.com/photo-1611078489935-0cb964de46d6?w=600&q=80}	cmsbluq9i000435tv0nbox5t0	women-clothing-dresses	{Women,Clothing,Dresses}	6	2026-02-17 04:42:02.248	active	f	f
cmsbluqsi008335tv708f7kg9	Reformation Linen Shift Dress - Black	Reformation Linen Shift Dress — Black. In excellent condition. Worn once or twice, like new.	108	Reformation	10	very_good	Linen	Beige	\N	{https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&q=80,https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80}	cmsbluq9l000535tvizeide9b	women-clothing-dresses	{Women,Clothing,Dresses}	6	2026-05-01 18:59:03.372	deactivated	f	t
cmsbluqsk008535tv6kfhildd	COS Floral Wrap Dress - Black	COS Floral Wrap Dress — Black. Brand new without tags. Never worn or used.	82	COS	6	new_without_tags	Cotton	Blue	\N	{https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=80}	cmsbluq9r000635tvcr4sfb94	women-clothing-dresses	{Women,Clothing,Dresses}	15	2026-04-22 07:58:25.138	active	f	t
cmsbluqsm008735tvaus9iwwd	Mango Maxi Sundress - Cream	Mango Maxi Sundress — Cream. In good condition with normal signs of wear.	41	Mango	16	good	Viscose	Green	\N	{https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=80}	cmsbluq9u000735tvw9nt9lq0	women-clothing-dresses	{Women,Clothing,Dresses}	99	2026-03-19 17:46:20.294	active	f	f
cmsbluqsp008935tvo6fi1bfl	Free People Slip Dress - Cream	Free People Slip Dress — Cream. In excellent condition. Worn once or twice, like new.	64	Free People	16	very_good	Viscose	Cream	\N	{https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&q=80,https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600&q=80}	cmsbluq9w000835tvh233rkvy	women-clothing-dresses	{Women,Clothing,Dresses}	6	2026-06-04 03:35:06.443	active	f	f
cmsbluqsr008b35tv7cdviie5	Free People Silk Camisole - Red	Free People Silk Camisole — Red. Brand new without tags. Never worn or used.	11	Free People	L	new_without_tags	Silk	White	\N	{https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&q=80}	cmsbluq9y000935tvspusb61q	women-clothing-tops	{Women,Clothing,"Tops & T-Shirts"}	6	2026-04-12 12:08:56.067	active	f	t
cmsbluqsu008d35tv2vcgl0cy	COS Linen Blouse - Cream	COS Linen Blouse — Cream. In excellent condition. Worn once or twice, like new.	87	COS	XL	very_good	Cotton	Navy	\N	{https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600&q=80,https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80}	cmsbluq9z000a35tvscfnuv6v	women-clothing-tops	{Women,Clothing,"Tops & T-Shirts"}	14	2026-02-20 13:59:23.369	active	f	f
cmsbluqsx008f35tvbyn6t8vr	Mango Wrap Blouse - Pink	Mango Wrap Blouse — Pink. In excellent condition. Worn once or twice, like new.	23	Mango	S	very_good	Modal	White	\N	{https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&q=80}	cmsbluqa2000b35tvm6f1r5f1	women-clothing-tops	{Women,Clothing,"Tops & T-Shirts"}	18	2026-05-07 09:07:12.493	active	f	f
cmsbluqsz008h35tvaps5ghh6	COS Silk Camisole - Navy	COS Silk Camisole — Navy. In good condition with normal signs of wear.	71	COS	M	good	Silk	Navy	\N	{https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80}	cmsbluqa4000c35tv539ub95q	women-clothing-tops	{Women,Clothing,"Tops & T-Shirts"}	14	2026-06-11 20:33:55.23	active	f	f
cmsbluqt1008j35tvt0ie68tj	Uniqlo Cotton T-Shirt - Cream	Uniqlo Cotton T-Shirt — Cream. In good condition with normal signs of wear.	61	Uniqlo	M	good	Silk	Cream	\N	{https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&q=80}	cmsbluq95000135tvl0awkx44	women-clothing-tops	{Women,Clothing,"Tops & T-Shirts"}	1	2026-01-25 09:31:11.832	active	f	t
cmsbluqt3008l35tvuq208lfs	Ganni Puff Sleeve Top - Pink	Ganni Puff Sleeve Top — Pink. In good condition with normal signs of wear.	49	Ganni	M	good	Modal	Red	\N	{https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&q=80}	cmsbluq99000235tv18ck93kn	women-clothing-tops	{Women,Clothing,"Tops & T-Shirts"}	19	2026-03-23 13:31:16.351	active	f	t
cmsbluqt6008n35tvbpaumfqw	Ganni Wrap Blouse - White	Ganni Wrap Blouse — White. Brand new with original tags attached.	69	Ganni	XL	new_with_tags	Cotton	Navy	\N	{https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80}	cmsbluq9e000335tvj2ukaywp	women-clothing-tops	{Women,Clothing,"Tops & T-Shirts"}	1	2026-04-03 14:47:39.71	reserved	f	f
cmsbluqt8008p35tvn3jraeun	Ganni Turtleneck Sweater - White	Ganni Turtleneck Sweater — White. In excellent condition. Worn once or twice, like new.	92	Ganni	XS	very_good	Linen	Green	\N	{https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&q=80,https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&q=80}	cmsbluq9i000435tv0nbox5t0	women-clothing-tops	{Women,Clothing,"Tops & T-Shirts"}	92	2026-02-26 21:19:55.223	sold	f	f
cmsbluqtc008r35tv4zsj23y5	Patagonia Denim Jacket - Navy	Patagonia Denim Jacket — Navy. In excellent condition. Worn once or twice, like new.	331	Patagonia	S	very_good	Wool	Brown	\N	{https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&q=80,https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80}	cmsbluq9l000535tvizeide9b	women-clothing-jackets	{Women,Clothing,"Jackets & Coats"}	20	2026-03-13 20:56:03.879	active	f	t
cmsbluqtg008t35tv8zb1u8qu	Zara Oversized Wool Coat - Camel	Zara Oversized Wool Coat — Camel. In good condition with normal signs of wear.	304	Zara	XS	good	Polyester	Black	\N	{https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&q=80,https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80}	cmsbluq9r000635tvcr4sfb94	women-clothing-jackets	{Women,Clothing,"Jackets & Coats"}	10	2026-01-17 03:51:51.098	active	t	f
cmsbluqtj008v35tvkuu4arab	Mango Blazer - Brown	Mango Blazer — Brown. Brand new without tags. Never worn or used.	143	Mango	M	new_without_tags	Cotton	Beige	\N	{https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=600&q=80}	cmsbluq9u000735tvw9nt9lq0	women-clothing-jackets	{Women,Clothing,"Jackets & Coats"}	17	2026-03-24 23:21:58.54	active	f	f
cmsbluqtl008x35tv1hwusx3z	Rains Leather Biker Jacket - Camel	Rains Leather Biker Jacket — Camel. In excellent condition. Worn once or twice, like new.	155	Rains	XL	very_good	Leather	Grey	\N	{https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&q=80}	cmsbluq9w000835tvh233rkvy	women-clothing-jackets	{Women,Clothing,"Jackets & Coats"}	134	2026-01-28 14:22:02.514	active	f	f
cmsbluqtm008z35tv3hqbohqr	Zara Leather Biker Jacket - Camel	Zara Leather Biker Jacket — Camel. Brand new with original tags attached.	241	Zara	S	new_with_tags	Polyester	Green	\N	{https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80}	cmsbluq9y000935tvspusb61q	women-clothing-jackets	{Women,Clothing,"Jackets & Coats"}	19	2026-05-24 00:03:25.682	reserved	t	f
cmsbluqtp009135tvn3co3vel	Arket Trench Coat - Black	Arket Trench Coat — Black. Brand new without tags. Never worn or used.	187	Arket	M	new_without_tags	Polyester	Grey	\N	{https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=600&q=80}	cmsbluq9z000a35tvscfnuv6v	women-clothing-jackets	{Women,Clothing,"Jackets & Coats"}	10	2026-04-05 05:46:16.826	active	f	t
cmsbluqts009335tvj5nj6e7n	Arket Puffer Jacket - Brown	Arket Puffer Jacket — Brown. In excellent condition. Worn once or twice, like new.	101	Arket	M	very_good	Wool	Green	\N	{https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80}	cmsbluqa2000b35tvm6f1r5f1	women-clothing-jackets	{Women,Clothing,"Jackets & Coats"}	95	2026-02-18 21:45:45.701	active	f	t
cmsbluqtu009535tvjd71prft	Arket Blazer - Beige	Arket Blazer — Beige. Shows visible signs of wear but still plenty of life left.	73	Arket	S	satisfactory	Leather	Beige	\N	{https://images.unsplash.com/photo-1521369909029-2afed882baee?w=600&q=80}	cmsbluqa4000c35tv539ub95q	women-clothing-jackets	{Women,Clothing,"Jackets & Coats"}	7	2026-05-26 16:56:04.489	active	f	t
cmsbluqtw009735tvr5e2kk6o	Vans Stan Smith - Cream	Vans Stan Smith — Cream. In excellent condition. Worn once or twice, like new.	128	Vans	5.5	very_good	Canvas	Beige	\N	{https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&q=80}	cmsbluq95000135tvl0awkx44	women-shoes-sneakers	{Women,Shoes,Sneakers}	0	2026-04-26 20:18:08.666	active	f	t
cmsbluqty009935tvy10hqoxp	On Running Cloud - Navy	On Running Cloud — Navy. Brand new without tags. Never worn or used.	116	On Running	6.5	new_without_tags	Leather	Beige	\N	{https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80,https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80}	cmsbluq99000235tv18ck93kn	women-shoes-sneakers	{Women,Shoes,Sneakers}	9	2026-04-23 09:13:03.147	active	f	f
cmsbluqu0009b35tv8tw6m6ru	New Balance Cloud - White	New Balance Cloud — White. Brand new without tags. Never worn or used.	70	New Balance	8	new_without_tags	Suede	Pink	\N	{https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&q=80,https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&q=80}	cmsbluq9e000335tvj2ukaywp	women-shoes-sneakers	{Women,Shoes,Sneakers}	107	2026-03-23 03:47:49.608	active	f	t
cmsbluqu2009d35tv2nmowmyw	Veja Esplar - Pink	Veja Esplar — Pink. Brand new with original tags attached.	39	Veja	6.5	new_with_tags	Mesh	Navy	\N	{https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=600&q=80}	cmsbluq9i000435tv0nbox5t0	women-shoes-sneakers	{Women,Shoes,Sneakers}	3	2026-05-22 09:29:55.823	active	f	t
cmsbluqu4009f35tvwwaov6wy	On Running Stan Smith - Cream	On Running Stan Smith — Cream. In excellent condition. Worn once or twice, like new.	174	On Running	6	very_good	Canvas	White	\N	{https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80,https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&q=80}	cmsbluq9l000535tvizeide9b	women-shoes-sneakers	{Women,Shoes,Sneakers}	392	2026-03-09 04:39:41.055	active	f	f
cmsbluqu6009h35tv5zyrbhvt	New Balance Cloud - White	New Balance Cloud — White. In excellent condition. Worn once or twice, like new.	134	New Balance	7.5	very_good	Mesh	Cream	\N	{https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80,https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=80}	cmsbluq9r000635tvcr4sfb94	women-shoes-sneakers	{Women,Shoes,Sneakers}	6	2026-04-27 18:58:18.377	deactivated	f	t
cmsbluqu9009j35tvovq91eq6	Adidas Stan Smith - Triple Black	Adidas Stan Smith — Triple Black. In excellent condition. Worn once or twice, like new.	119	Adidas	9.5	very_good	Mesh	Black	\N	{https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=600&q=80,https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80}	cmsbluq9u000735tvw9nt9lq0	women-shoes-sneakers	{Women,Shoes,Sneakers}	10	2026-05-28 02:08:54.045	active	f	t
cmsbluqub009l35tv3fgsbzzc	New Balance Cloud - White	New Balance Cloud — White. In excellent condition. Worn once or twice, like new.	57	New Balance	6.5	very_good	Canvas	Navy	\N	{https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&q=80}	cmsbluq9w000835tvh233rkvy	women-shoes-sneakers	{Women,Shoes,Sneakers}	96	2026-07-02 07:28:29.705	reserved	t	t
cmsbluqud009n35tv4p8slk5x	Car Shoe Flap Bag - Red	Car Shoe Flap Bag — Red. Brand new without tags. Never worn or used.	20	Car Shoe	One Size	new_without_tags	Leather	Black	\N	{https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80,https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&q=80}	cmsbluq9y000935tvspusb61q	women-bags-crossbody	{Women,Bags,"Crossbody Bags"}	9	2026-03-03 09:47:41.227	active	f	f
cmsbluquf009p35tv8pcwe07n	Car Shoe Saddle Bag - Cream	Car Shoe Saddle Bag — Cream. In excellent condition. Worn once or twice, like new.	55	Car Shoe	Small	very_good	Leather	Brown	\N	{https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80}	cmsbluq9z000a35tvscfnuv6v	women-bags-crossbody	{Women,Bags,"Crossbody Bags"}	63	2026-04-10 22:38:12.236	active	f	f
cmsbluqui009r35tvdkj51dgt	Mango Crossbody Bag - Red	Mango Crossbody Bag — Red. In excellent condition. Worn once or twice, like new.	28	Mango	One Size	very_good	Canvas	Black	\N	{https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&q=80}	cmsbluqa2000b35tvm6f1r5f1	women-bags-crossbody	{Women,Bags,"Crossbody Bags"}	51	2026-02-03 02:18:35.16	active	f	t
cmsbluquk009t35tvcnq89xow	H&M Saddle Bag - Navy	H&M Saddle Bag — Navy. Brand new without tags. Never worn or used.	39	H&M	Small	new_without_tags	Faux Leather	Cream	\N	{https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=600&q=80}	cmsbluqa4000c35tv539ub95q	women-bags-crossbody	{Women,Bags,"Crossbody Bags"}	12	2026-01-21 10:33:22.774	active	f	t
cmsbluqum009v35tv8jdtajdw	Radley Phone Bag - Red	Radley Phone Bag — Red. In excellent condition. Worn once or twice, like new.	34	Radley	Medium	very_good	Faux Leather	Cream	\N	{https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=80,https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=80}	cmsbluq95000135tvl0awkx44	women-bags-crossbody	{Women,Bags,"Crossbody Bags"}	4	2026-01-25 21:46:06.501	sold	f	f
cmsbluqup009x35tv5r02y7ui	Radley Crossbody Bag - Tan	Radley Crossbody Bag — Tan. Brand new without tags. Never worn or used.	11	Radley	One Size	new_without_tags	Leather	Black	\N	{https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=600&q=80,https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80}	cmsbluq99000235tv18ck93kn	women-bags-crossbody	{Women,Bags,"Crossbody Bags"}	7	2026-05-24 11:52:41.643	active	f	t
cmsbluqur009z35tvt1o9apxy	Mango Phone Bag - Red	Mango Phone Bag — Red. In excellent condition. Worn once or twice, like new.	39	Mango	Medium	very_good	Nylon	Black	\N	{https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80,https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&q=80}	cmsbluq9e000335tvj2ukaywp	women-bags-crossbody	{Women,Bags,"Crossbody Bags"}	17	2026-05-13 09:39:44.313	active	f	t
cmsbluqut00a135tvjrgvms6y	Fjallraven Crossbody Bag - Navy	Fjallraven Crossbody Bag — Navy. In excellent condition. Worn once or twice, like new.	28	Fjallraven	One Size	very_good	Leather	Green	\N	{https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&q=80}	cmsbluq9i000435tv0nbox5t0	women-bags-crossbody	{Women,Bags,"Crossbody Bags"}	149	2026-04-03 07:14:29.266	sold	f	t
cmsbluquv00a335tvjqezsog2	Sunspel Graphic Tee - Grey	Sunspel Graphic Tee — Grey. In good condition with normal signs of wear.	77	Sunspel	3XL	good	Jersey	Grey	\N	{https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80}	cmsbluq9l000535tvizeide9b	men-clothing-tshirts	{Men,Clothing,T-Shirts}	20	2026-06-18 08:32:03.11	active	f	t
cmsbluquy00a535tv3s8d1h9x	Supreme Heavyweight Tee - Grey	Supreme Heavyweight Tee — Grey. In excellent condition. Worn once or twice, like new.	72	Supreme	XS	very_good	Pima Cotton	Burgundy	\N	{https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80}	cmsbluq9r000635tvcr4sfb94	men-clothing-tshirts	{Men,Clothing,T-Shirts}	17	2026-03-04 08:05:41.71	active	f	t
cmsbluqv000a735tvz3ksw00h	Uniqlo Polo Shirt - Olive	Uniqlo Polo Shirt — Olive. Brand new with original tags attached.	26	Uniqlo	S	new_with_tags	Jersey	Black	\N	{https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=600&q=80}	cmsbluq9u000735tvw9nt9lq0	men-clothing-tshirts	{Men,Clothing,T-Shirts}	14	2026-03-16 00:19:27.123	sold	f	f
cmsbluqv200a935tvl0hvh57g	Adidas Polo Shirt - White	Adidas Polo Shirt — White. Brand new with original tags attached.	71	Adidas	L	new_with_tags	Organic Cotton	Black	\N	{https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80}	cmsbluq9w000835tvh233rkvy	men-clothing-tshirts	{Men,Clothing,T-Shirts}	2	2026-03-22 03:42:03.611	reserved	t	t
cmsbluqv400ab35tvkvaenat8	Uniqlo Henley Shirt - Sage	Uniqlo Henley Shirt — Sage. In excellent condition. Worn once or twice, like new.	44	Uniqlo	3XL	very_good	Cotton	Green	\N	{https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=600&q=80,https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80}	cmsbluq9y000935tvspusb61q	men-clothing-tshirts	{Men,Clothing,T-Shirts}	78	2026-02-24 12:32:07.935	active	f	f
cmsbluqv600ad35tvk3uvfo37	Sunspel Supima Cotton T-Shirt - Olive	Sunspel Supima Cotton T-Shirt — Olive. In good condition with normal signs of wear.	33	Sunspel	XXL	good	Cotton	White	\N	{https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600&q=80}	cmsbluq9z000a35tvscfnuv6v	men-clothing-tshirts	{Men,Clothing,T-Shirts}	6	2026-07-26 18:18:11.622	active	f	t
cmsbluqv900af35tvi1rgqugs	Carhartt Long Sleeve Tee - Grey	Carhartt Long Sleeve Tee — Grey. Brand new with original tags attached.	48	Carhartt	L	new_with_tags	Pima Cotton	Navy	\N	{https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=600&q=80}	cmsbluqa2000b35tvm6f1r5f1	men-clothing-tshirts	{Men,Clothing,T-Shirts}	2	2026-04-13 00:37:05.778	active	f	t
cmsbluqvb00ah35tvnfks8c9z	Carhartt V-Neck Tee - White	Carhartt V-Neck Tee — White. In good condition with normal signs of wear.	76	Carhartt	XXL	good	Jersey	Navy	\N	{https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80,https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&q=80}	cmsbluqa4000c35tv539ub95q	men-clothing-tshirts	{Men,Clothing,T-Shirts}	0	2026-05-10 00:41:34.816	active	f	t
cmsbluqve00aj35tvz0bjxp6p	Carhartt Club Hoodie - Black	Carhartt Club Hoodie — Black. Shows visible signs of wear but still plenty of life left.	32	Carhartt	XXL	satisfactory	Cotton	Green	\N	{https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&q=80,https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&q=80}	cmsbluq95000135tvl0awkx44	men-clothing-hoodies	{Men,Clothing,"Hoodies & Sweatshirts"}	80	2026-01-26 18:27:18.339	active	f	t
cmsbluqvg00al35tvx07e7hpo	Adidas Essential Fleece - Navy	Adidas Essential Fleece — Navy. Brand new without tags. Never worn or used.	82	Adidas	XS	new_without_tags	Fleece	Burgundy	\N	{https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&q=80}	cmsbluq99000235tv18ck93kn	men-clothing-hoodies	{Men,Clothing,"Hoodies & Sweatshirts"}	183	2026-05-07 08:15:56.901	active	t	t
cmsbluqvj00an35tvjthkrcpt	Uniqlo Pullover Hoodie - Navy	Uniqlo Pullover Hoodie — Navy. In good condition with normal signs of wear.	43	Uniqlo	XXL	good	Polyester Blend	Black	\N	{https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&q=80}	cmsbluq9e000335tvj2ukaywp	men-clothing-hoodies	{Men,Clothing,"Hoodies & Sweatshirts"}	98	2026-05-29 03:52:33.605	active	f	t
cmsbluqvl00ap35tvp2zlon08	Uniqlo Crewneck Sweatshirt - Navy	Uniqlo Crewneck Sweatshirt — Navy. Brand new without tags. Never worn or used.	49	Uniqlo	XXL	new_without_tags	Fleece	Cream	\N	{https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&q=80}	cmsbluq9i000435tv0nbox5t0	men-clothing-hoodies	{Men,Clothing,"Hoodies & Sweatshirts"}	18	2026-04-02 06:00:35.941	active	t	t
cmsbluqvn00ar35tvzuxyxa5v	Patagonia Full Zip Hoodie - Forest Green	Patagonia Full Zip Hoodie — Forest Green. In good condition with normal signs of wear.	121	Patagonia	S	good	French Terry	Green	\N	{https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&q=80}	cmsbluq9l000535tvizeide9b	men-clothing-hoodies	{Men,Clothing,"Hoodies & Sweatshirts"}	8	2026-06-18 16:35:23.66	sold	f	t
cmsbluqvp00at35tv6wdjf732	Patagonia Quarter Zip Sweatshirt - Black	Patagonia Quarter Zip Sweatshirt — Black. Brand new with original tags attached.	40	Patagonia	XS	new_with_tags	Fleece	Cream	\N	{https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&q=80}	cmsbluq9r000635tvcr4sfb94	men-clothing-hoodies	{Men,Clothing,"Hoodies & Sweatshirts"}	69	2026-06-20 04:52:09.823	active	f	f
cmsbluqvr00av35tvxh7oz3p6	Fear of God Quarter Zip Sweatshirt - Navy	Fear of God Quarter Zip Sweatshirt — Navy. In good condition with normal signs of wear.	130	Fear of God	L	good	French Terry	Cream	\N	{https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80}	cmsbluq9u000735tvw9nt9lq0	men-clothing-hoodies	{Men,Clothing,"Hoodies & Sweatshirts"}	0	2026-03-07 10:30:12.081	active	t	f
cmsbluqvt00ax35tvjs7ggglh	Nike Pullover Hoodie - Olive	Nike Pullover Hoodie — Olive. Brand new without tags. Never worn or used.	71	Nike	L	new_without_tags	Polyester Blend	Green	\N	{https://images.unsplash.com/photo-1526045431048-f857369baa09?w=600&q=80}	cmsbluq9w000835tvh233rkvy	men-clothing-hoodies	{Men,Clothing,"Hoodies & Sweatshirts"}	10	2026-02-08 21:27:02.689	deactivated	f	f
cmsbluqvv00az35tvt4vbskhb	Adidas 550 - Grey/Green	Adidas 550 — Grey/Green. Brand new without tags. Never worn or used.	37	Adidas	11.5	new_without_tags	Leather	Grey	\N	{https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600&q=80}	cmsbluq9y000935tvspusb61q	men-shoes-sneakers	{Men,Shoes,Sneakers}	139	2026-06-06 10:45:49.146	active	f	f
cmsbluqvx00b135tvzxxf1lse	ASICS Gel-Kayano 14 - Navy	ASICS Gel-Kayano 14 — Navy. In good condition with normal signs of wear.	106	ASICS	10	good	Canvas	Green	\N	{https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80,https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=80}	cmsbluq9z000a35tvscfnuv6v	men-shoes-sneakers	{Men,Shoes,Sneakers}	15	2026-06-25 05:27:22.156	active	f	t
cmsbluqw000b335tvs2py5c4f	ASICS Old Skool - Black/White	ASICS Old Skool — Black/White. In good condition with normal signs of wear.	130	ASICS	7	good	Mesh	Navy	\N	{https://images.unsplash.com/photo-1475178626620-a4d074967452?w=600&q=80,https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80}	cmsbluqa2000b35tvm6f1r5f1	men-shoes-sneakers	{Men,Shoes,Sneakers}	124	2026-01-23 03:20:10.733	active	f	f
cmsbluqw200b535tvbe8rx94b	New Balance Speedgoat 5 - All Black	New Balance Speedgoat 5 — All Black. Brand new without tags. Never worn or used.	47	New Balance	7.5	new_without_tags	Canvas	Grey	\N	{https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=80}	cmsbluqa4000c35tv539ub95q	men-shoes-sneakers	{Men,Shoes,Sneakers}	9	2026-05-29 20:57:40.49	active	t	t
cmsbluqw500b735tvc1gr19pa	Converse Old Skool - All Black	Converse Old Skool — All Black. Brand new without tags. Never worn or used.	88	Converse	11	new_without_tags	Mesh	Black	\N	{https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&q=80}	cmsbluq95000135tvl0awkx44	men-shoes-sneakers	{Men,Shoes,Sneakers}	13	2026-02-03 19:50:58.995	active	t	t
cmsbluqw600b935tvmn1qs2pu	Converse 550 - Beige	Converse 550 — Beige. In excellent condition. Worn once or twice, like new.	160	Converse	8	very_good	Mesh	Beige	\N	{https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=600&q=80}	cmsbluq99000235tv18ck93kn	men-shoes-sneakers	{Men,Shoes,Sneakers}	16	2026-05-21 06:18:22.983	deactivated	f	t
cmsbluqw800bb35tvev1hecev	New Balance Gel-Kayano 14 - Grey/Green	New Balance Gel-Kayano 14 — Grey/Green. In excellent condition. Worn once or twice, like new.	138	New Balance	12	very_good	Suede	White	\N	{https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600&q=80}	cmsbluq9e000335tvj2ukaywp	men-shoes-sneakers	{Men,Shoes,Sneakers}	25	2026-07-12 00:07:41.492	active	f	t
cmsbluqwb00bd35tvhpiv31m9	Adidas Cloudmonster - All Black	Adidas Cloudmonster — All Black. In excellent condition. Worn once or twice, like new.	75	Adidas	7.5	very_good	Suede	Beige	\N	{https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600&q=80}	cmsbluq9i000435tv0nbox5t0	men-shoes-sneakers	{Men,Shoes,Sneakers}	14	2026-02-28 01:04:51.93	active	f	t
cmsbluqwd00bf35tvzq7d2udy	Seiko Le Locle - Stainless Steel	Seiko Le Locle — Stainless Steel. Brand new without tags. Never worn or used.	4551	Seiko	36mm	new_without_tags	Gold	Green	\N	{https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=600&q=80,https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80}	cmsbluq9l000535tvizeide9b	men-acc-watches	{Men}	27	2026-04-27 11:35:00.409	active	f	f
cmsbluqwf00bh35tvhspjqogj	Rolex Khaki Field - Black Dial	Rolex Khaki Field — Black Dial. In excellent condition. Worn once or twice, like new.	1503	Rolex	46mm	very_good	Stainless Steel	Silver	\N	{https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&q=80,https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&q=80}	cmsbluq9r000635tvcr4sfb94	men-acc-watches	{Men}	20	2026-02-08 13:14:25.688	active	f	f
cmsbluqwh00bj35tvx2d5xs8d	Hamilton SKX007 Diver - Leather Strap	Hamilton SKX007 Diver — Leather Strap. In good condition with normal signs of wear.	626	Hamilton	46mm	good	Stainless Steel	Silver	\N	{https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=80,https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80}	cmsbluq9u000735tvw9nt9lq0	men-acc-watches	{Men}	6	2026-04-29 23:02:35.258	sold	f	f
cmsbluqwj00bl35tvhnfn6ipg	Timex Carrera - Green Dial	Timex Carrera — Green Dial. In good condition with normal signs of wear.	2558	Timex	36mm	good	Stainless Steel	Grey	\N	{https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&q=80}	cmsbluq9w000835tvh233rkvy	men-acc-watches	{Men}	25	2026-01-18 03:22:25.373	active	f	f
cmsbluqwl00bn35tvdawzfcz0	Seiko SKX007 Diver - Leather Strap	Seiko SKX007 Diver — Leather Strap. Brand new with original tags attached.	4888	Seiko	42mm	new_with_tags	Titanium	Grey	\N	{https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=600&q=80,https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&q=80}	cmsbluq9y000935tvspusb61q	men-acc-watches	{Men}	1	2026-05-17 19:14:39.34	active	f	f
cmsbluqwm00bp35tvl9uc0nld	Tissot Le Locle - Black Dial	Tissot Le Locle — Black Dial. In good condition with normal signs of wear.	1592	Tissot	36mm	good	Titanium	Black	\N	{https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80}	cmsbluq9z000a35tvscfnuv6v	men-acc-watches	{Men}	0	2026-05-08 18:46:59.579	active	f	f
cmsbluqwo00br35tvaom27v4x	Omega Datejust 36mm - Stainless Steel	Omega Datejust 36mm — Stainless Steel. In excellent condition. Worn once or twice, like new.	401	Omega	38mm	very_good	Ceramic	Silver	\N	{https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&q=80,https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80}	cmsbluqa2000b35tvm6f1r5f1	men-acc-watches	{Men}	15	2026-02-25 05:38:53.285	active	f	f
cmsbluqwq00bt35tvdqb5v03j	Timex Speedmaster Professional - NATO Strap	Timex Speedmaster Professional — NATO Strap. Brand new without tags. Never worn or used.	3712	Timex	36mm	new_without_tags	Stainless Steel	Green	\N	{https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&q=80,https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80}	cmsbluqa4000c35tv539ub95q	men-acc-watches	{Men}	12	2026-03-28 13:49:25.536	active	f	t
cmsbluqws00bv35tvjgwiqv2s	Louis Vuitton Lady Dior - Brown	Louis Vuitton Lady Dior — Brown. Brand new without tags. Never worn or used.	2667	Louis Vuitton	Large	new_without_tags	Leather	Camel	\N	{https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80,https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=600&q=80}	cmsbluq95000135tvl0awkx44	designer-bags	{Designer,"Designer Bags"}	0	2026-02-22 01:34:17.865	sold	f	t
cmsbluqwu00bx35tv3pwv8qy9	Louis Vuitton GG Marmont Bag - Camel	Louis Vuitton GG Marmont Bag — Camel. In good condition with normal signs of wear.	3592	Louis Vuitton	MM	good	Saffiano Leather	Beige	\N	{https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=600&q=80,https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80}	cmsbluq99000235tv18ck93kn	designer-bags	{Designer,"Designer Bags"}	12	2026-03-04 20:35:42.313	reserved	f	f
cmsbluqww00bz35tvtasj78p9	Prada GG Marmont Bag - Camel	Prada GG Marmont Bag — Camel. Shows visible signs of wear but still plenty of life left.	708	Prada	Small	satisfactory	Leather	Black	\N	{https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=600&q=80,https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=600&q=80}	cmsbluq9e000335tvj2ukaywp	designer-bags	{Designer,"Designer Bags"}	6	2026-02-24 07:53:22.24	active	t	f
cmsbluqwy00c135tvz8507e2f	Dior Sac de Jour - Beige	Dior Sac de Jour — Beige. In good condition with normal signs of wear.	2239	Dior	Large	good	Saffiano Leather	Black	\N	{https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&q=80}	cmsbluq9i000435tv0nbox5t0	designer-bags	{Designer,"Designer Bags"}	10	2026-03-26 08:45:32.127	active	f	t
cmsbluqx000c335tve4qma6gm	Louis Vuitton Belt Bag - Black	Louis Vuitton Belt Bag — Black. Brand new with original tags attached.	2217	Louis Vuitton	GM	new_with_tags	Leather	Beige	\N	{https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=600&q=80}	cmsbluq9l000535tvizeide9b	designer-bags	{Designer,"Designer Bags"}	15	2026-03-26 08:50:58.938	sold	f	t
cmsbluqx400c535tvmw143tfi	Saint Laurent GG Marmont Bag - Monogram	Saint Laurent GG Marmont Bag — Monogram. In excellent condition. Worn once or twice, like new.	1136	Saint Laurent	Mini	very_good	Leather	Beige	\N	{https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&q=80}	cmsbluq9r000635tvcr4sfb94	designer-bags	{Designer,"Designer Bags"}	96	2026-04-26 20:10:31.474	active	t	f
cmsbluqx600c735tve9is93h0	Saint Laurent Galleria Bag - Camel	Saint Laurent Galleria Bag — Camel. Brand new without tags. Never worn or used.	1302	Saint Laurent	Medium	new_without_tags	Saffiano Leather	Navy	\N	{https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80,https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&q=80}	cmsbluq9u000735tvw9nt9lq0	designer-bags	{Designer,"Designer Bags"}	62	2026-05-12 00:30:10.526	sold	f	t
cmsbluqx800c935tvm147fb7i	Gucci Cassette Bag - Navy	Gucci Cassette Bag — Navy. In excellent condition. Worn once or twice, like new.	1669	Gucci	Small	very_good	Canvas	Brown	\N	{https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&q=80}	cmsbluq9w000835tvh233rkvy	designer-bags	{Designer,"Designer Bags"}	0	2026-05-04 05:56:08.157	active	f	f
cmsbluqxa00cb35tvsusqz68l	Cult Furniture Table Runner - Navy	Cult Furniture Table Runner — Navy. Shows visible signs of wear but still plenty of life left.	61	Cult Furniture	Large	satisfactory	Cotton	Orange	\N	{https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=600&q=80,https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&q=80}	cmsbluq9y000935tvspusb61q	home-decor	{Home,"Home Decor"}	1	2026-01-17 01:37:13.553	active	t	f
cmsbluqxc00cd35tv5gwxblaj	Cult Furniture Plant Pot - White	Cult Furniture Plant Pot — White. Shows visible signs of wear but still plenty of life left.	34	Cult Furniture	Large	satisfactory	Wax	Orange	\N	{https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&q=80}	cmsbluq9z000a35tvscfnuv6v	home-decor	{Home,"Home Decor"}	1	2026-05-23 17:20:59.597	sold	f	f
cmsbluqxg00cf35tv7600d6pm	Oliver Bonas Table Runner - Terracotta	Oliver Bonas Table Runner — Terracotta. In excellent condition. Worn once or twice, like new.	22	Oliver Bonas	Small	very_good	Wood	Cream	\N	{https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&q=80}	cmsbluqa2000b35tvm6f1r5f1	home-decor	{Home,"Home Decor"}	19	2026-06-14 18:55:31.674	active	f	t
cmsbluqyk00df35tvks2e5r1v	Sony OnePlus 12 - Black 256GB	Sony OnePlus 12 — Black 256GB. In excellent condition. Worn once or twice, like new.	983	Sony	512GB	very_good	\N	\N	\N	{https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80,https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&q=80}	cmsbluq9l000535tvizeide9b	electronics-phones	{Electronics,Phones}	12	2026-05-29 02:50:48.081	active	f	t
cmsbluqym00dh35tvp3a56tql	Samsung Xiaomi 14 Pro - Sapphire 128GB	Samsung Xiaomi 14 Pro — Sapphire 128GB. Brand new without tags. Never worn or used.	736	Samsung	512GB	new_without_tags	\N	\N	\N	{https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=80,https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=80}	cmsbluq9r000635tvcr4sfb94	electronics-phones	{Electronics,Phones}	2	2026-06-25 11:37:48.407	active	t	t
cmsbluqyo00dj35tvjlx19cov	Apple Xiaomi 14 Pro - White 256GB	Apple Xiaomi 14 Pro — White 256GB. In excellent condition. Worn once or twice, like new.	592	Apple	512GB	very_good	\N	\N	\N	{https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80,https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=80}	cmsbluq9u000735tvw9nt9lq0	electronics-phones	{Electronics,Phones}	6	2026-02-19 15:29:43.246	sold	f	f
cmsbluqyr00dl35tvn2aiuwaq	Xiaomi Xperia 1 V - Silver 512GB	Xiaomi Xperia 1 V — Silver 512GB. Shows visible signs of wear but still plenty of life left.	938	Xiaomi	512GB	satisfactory	\N	\N	\N	{https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&q=80,https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80}	cmsbluq9w000835tvh233rkvy	electronics-phones	{Electronics,Phones}	5	2026-07-13 08:46:52.406	reserved	f	f
cmsbluqyt00dn35tvgqkdx21t	Razer PS5 Slim - Limited Edition	Razer PS5 Slim — Limited Edition. In excellent condition. Worn once or twice, like new.	360	Razer	512GB	very_good	\N	\N	\N	{https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80}	cmsbluq9y000935tvspusb61q	electronics-gaming	{Electronics,Gaming}	8	2026-05-31 09:57:10.435	active	f	f
cmsbluqyw00dp35tvt5hioa8o	Razer Xbox Series X - Neon Blue/Red	Razer Xbox Series X — Neon Blue/Red. In excellent condition. Worn once or twice, like new.	381	Razer	64GB	very_good	\N	\N	\N	{https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80}	cmsbluq9z000a35tvscfnuv6v	electronics-gaming	{Electronics,Gaming}	17	2026-03-15 07:42:37.333	active	f	t
cmsbluqyy00dr35tvzik05ta4	Logitech G Pro X Headset - Limited Edition	Logitech G Pro X Headset — Limited Edition. In excellent condition. Worn once or twice, like new.	62	Logitech	Standard	very_good	\N	\N	\N	{https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80}	cmsbluqa2000b35tvm6f1r5f1	electronics-gaming	{Electronics,Gaming}	0	2026-06-19 18:01:56.342	sold	f	t
cmsbluqz000dt35tvhouemck1	Microsoft Switch OLED - Limited Edition	Microsoft Switch OLED — Limited Edition. Shows visible signs of wear but still plenty of life left.	315	Microsoft	256GB	satisfactory	\N	\N	\N	{https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=80}	cmsbluqa4000c35tv539ub95q	electronics-gaming	{Electronics,Gaming}	3	2026-03-31 03:27:28.372	active	f	t
cmsbluqz200dv35tv8aqa02x4	Valve PS5 Slim - Neon Blue/Red	Valve PS5 Slim — Neon Blue/Red. Brand new with original tags attached.	331	Valve	512GB	new_with_tags	\N	\N	\N	{https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80}	cmsbluq95000135tvl0awkx44	electronics-gaming	{Electronics,Gaming}	9	2026-05-18 13:04:20.387	active	f	t
cmsbluqz400dx35tvetw1ech8	Nintendo Steam Deck OLED - Limited Edition	Nintendo Steam Deck OLED — Limited Edition. In excellent condition. Worn once or twice, like new.	311	Nintendo	64GB	very_good	\N	\N	\N	{https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=600&q=80,https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&q=80}	cmsbluq99000235tv18ck93kn	electronics-gaming	{Electronics,Gaming}	11	2026-03-25 06:18:44.129	active	f	t
cmsbluqz700dz35tv6cpkecdh	SteelSeries Apex 3 Keyboard - Neon Blue/Red	SteelSeries Apex 3 Keyboard — Neon Blue/Red. In good condition with normal signs of wear.	401	SteelSeries	256GB	good	\N	\N	\N	{https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&q=80,https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=600&q=80}	cmsbluq9e000335tvj2ukaywp	electronics-gaming	{Electronics,Gaming}	16	2026-04-01 20:25:38.917	active	f	t
cmsbluqza00e135tv9z22a8hm	Valve Xbox Series X - Black	Valve Xbox Series X — Black. In good condition with normal signs of wear.	344	Valve	Standard	good	\N	\N	\N	{https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80,https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=600&q=80}	cmsbluq9i000435tv0nbox5t0	electronics-gaming	{Electronics,Gaming}	12	2026-04-14 14:46:00.98	active	f	t
cmsbluqzc00e335tvt8avbdwz	The North Face Hiking Backpack - Grey	The North Face Hiking Backpack — Grey. In good condition with normal signs of wear.	241	The North Face	S	good	Down	Green	\N	{https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80,https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&q=80}	cmsbluq9l000535tvizeide9b	sports-outdoor	{Sports,"Outdoor Gear"}	7	2026-06-11 02:53:52.619	sold	f	f
cmsbluqze00e535tvedyomjag	Mountain Hardwear Trekking Poles - Orange	Mountain Hardwear Trekking Poles — Orange. In good condition with normal signs of wear.	141	Mountain Hardwear	XXL	good	Nylon	Orange	\N	{https://images.unsplash.com/photo-1521369909029-2afed882baee?w=600&q=80,https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&q=80}	cmsbluq9r000635tvcr4sfb94	sports-outdoor	{Sports,"Outdoor Gear"}	12	2026-03-04 12:02:58.27	reserved	f	f
cmsbluqzh00e735tvf67qm7ad	Patagonia Trekking Poles - Black	Patagonia Trekking Poles — Black. In good condition with normal signs of wear.	195	Patagonia	XL	good	Gore-Tex	Green	\N	{https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80}	cmsbluq9u000735tvw9nt9lq0	sports-outdoor	{Sports,"Outdoor Gear"}	150	2026-03-11 17:28:09.453	active	f	t
cmsbluqzj00e935tvoo69dyvf	Columbia Sleeping Bag - Blue	Columbia Sleeping Bag — Blue. Brand new without tags. Never worn or used.	232	Columbia	XXL	new_without_tags	Nylon	Navy	\N	{https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&q=80,https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&q=80}	cmsbluq9w000835tvh233rkvy	sports-outdoor	{Sports,"Outdoor Gear"}	129	2026-06-29 23:34:04.739	reserved	f	t
cmsbluqzl00eb35tv8v7ztcmj	Helly Hansen Camping Stove - Black	Helly Hansen Camping Stove — Black. In good condition with normal signs of wear.	54	Helly Hansen	One Size	good	Nylon	Black	\N	{https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&q=80,https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&q=80}	cmsbluq9y000935tvspusb61q	sports-outdoor	{Sports,"Outdoor Gear"}	2	2026-04-20 23:52:21.943	active	f	t
cmsbluqzo00ed35tv47tc4nr4	Patagonia Headlamp - Orange	Patagonia Headlamp — Orange. In excellent condition. Worn once or twice, like new.	234	Patagonia	XXL	very_good	Polyester	Red	\N	{https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&q=80}	cmsbluq9z000a35tvscfnuv6v	sports-outdoor	{Sports,"Outdoor Gear"}	5	2026-03-17 00:25:29.169	active	f	t
cmsbluqzr00ef35tva9bill4l	The North Face Waterproof Shell - Black	The North Face Waterproof Shell — Black. In good condition with normal signs of wear.	185	The North Face	One Size	good	Polyester	Navy	\N	{https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80}	cmsbluqa2000b35tvm6f1r5f1	sports-outdoor	{Sports,"Outdoor Gear"}	71	2026-07-07 15:57:17.255	deactivated	f	t
cmsbluqzt00eh35tvqfeztikp	Columbia Hiking Backpack - Orange	Columbia Hiking Backpack — Orange. In good condition with normal signs of wear.	122	Columbia	One Size	good	Polyester	Blue	\N	{https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=80}	cmsbluqa4000c35tv539ub95q	sports-outdoor	{Sports,"Outdoor Gear"}	120	2026-05-16 22:03:25.826	sold	t	t
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: desire
--

COPY public."Message" (id, "conversationId", "senderId", text, "createdAt", read) FROM stdin;
\.


--
-- Data for Name: Offer; Type: TABLE DATA; Schema: public; Owner: desire
--

COPY public."Offer" (id, "listingId", "buyerId", "sellerId", amount, status, message, "createdAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: desire
--

COPY public."Order" (id, "listingId", "buyerId", "sellerId", price, "shippingCost", total, status, "shippingAddress", "createdAt", "updatedAt", quantity, "shippedAt") FROM stdin;
cmsbp0fop0002352te06j1rx3	cmsbluqxi00ch35tvn6fmzuxd	cmsbp0b5t0000352tk2711tm1	cmsbluqa4000c35tv539ub95q	12	5.99	17.99	SHIPPED	{"city": "London", "street": "1 Main St", "country": "United Kingdom", "fullName": "Test Buyer"}	2026-08-02 11:04:14.186	2026-08-02 13:02:46.404	1	\N
cmsbrn63j0004352t84p6yonx	cmsbluqy600d335tvhfj8dey0	cmsbluq95000135tvl0awkx44	cmsbluqa2000b35tvm6f1r5f1	111	5.99	116.99	DELIVERED_CONFIRMED	{"apt": "", "city": "", "phone": "+8801719118068", "street": "House # 32/2,Block # B,Road # Hazi Din Mohammad Avenue, Main Road,Dhaka Uddan, Mohammadpur, Dhaka-1207.", "country": "", "fullName": "Global It"}	2026-08-02 12:17:54.079	2026-08-02 13:03:23.318	1	\N
cmsbtf7fz000135bjym7ai2ks	cmsbluqxi00ch35tvn6fmzuxd	cmsbp0b5t0000352tk2711tm1	cmsbluqa4000c35tv539ub95q	12	5.99	41.99	PENDING_PAYMENT	{"city": "London", "street": "1 Main St", "country": "United Kingdom", "fullName": "Test Buyer"}	2026-08-02 13:07:41.808	2026-08-02 13:07:41.808	3	\N
cmscoeyv0000235sj0253yv1g	cmsbluqxi00ch35tvn6fmzuxd	cmsco7b27000035sj7fkgfnl0	cmsbluqa4000c35tv539ub95q	12	0	12	SHIPPED	{"city": "London", "street": "1 Main St", "country": "United Kingdom", "fullName": "Verify User"}	2026-08-03 03:35:18.78	2026-08-03 03:37:01.177	1	\N
cmsctt04r000135q4ueyi1vef	cmsbluqt1008j35tvt0ie68tj	cmscschsm000035z53beff6iv	cmsbluq95000135tvl0awkx44	61	0	61	RELEASED_TO_SELLER	{"apt": "", "city": "Melbourne", "phone": "+8801719118068", "street": "House # 32/2,Block # B,Road # Hazi Din Mohammad Avenue, Main Road,Dhaka Uddan, Mohammadpur, Dhaka-1207.", "country": "Australia", "fullName": "Tausif Islam Sheik"}	2026-08-03 06:06:11.687	2026-08-03 08:30:19.995	1	2026-08-03 06:22:18.618
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: desire
--

COPY public."Payment" (id, "orderId", "stripePaymentIntentId", amount, currency, "platformFeeAmount", "platformFeePercent", "sellerPayoutAmount", "stripeTransferId", "capturedAt", "releasedAt", "createdAt", "updatedAt", status) FROM stdin;
cmsctt0qt000335q4xo7vjecq	cmsctt04r000135q4ueyi1vef	pi_3U0F0qBckiuCcnBd0W8F0UfL	6100	usd	488	8	5612	tr_1U0HEJBckiuCcnBdy0SK9eF3	2026-08-03 06:16:02.154	2026-08-03 08:30:36.28	2026-08-03 06:06:12.484	2026-08-03 08:30:36.28	captured
\.


--
-- Data for Name: PlatformSetting; Type: TABLE DATA; Schema: public; Owner: desire
--

COPY public."PlatformSetting" (key, value, "updatedAt") FROM stdin;
platform_fee_percent	8	2026-08-03 04:39:36.912
\.


--
-- Data for Name: Report; Type: TABLE DATA; Schema: public; Owner: desire
--

COPY public."Report" (id, "reporterId", "targetType", "targetId", reason, description, status, "createdAt") FROM stdin;
\.


--
-- Data for Name: Review; Type: TABLE DATA; Schema: public; Owner: desire
--

COPY public."Review" (id, "orderId", "reviewerId", "revieweeId", rating, comment, "createdAt") FROM stdin;
\.


--
-- Data for Name: Transaction; Type: TABLE DATA; Schema: public; Owner: desire
--

COPY public."Transaction" (id, "orderId", "productName", buyer, gross, fee, net, status, payout, date) FROM stdin;
ctrmscyyd5dmvyjx6	cmsctt04r000135q4ueyi1vef	Uniqlo Cotton T-Shirt - Cream	Tausif Islam Sheik	61	4.88	56.12	completed	tr_1U0HEJBckiuCcnBdy0SK9eF3	2026-08-03 08:30:20
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: desire
--

COPY public."User" (id, name, email, password, role, "avatarUrl", bio, "isSuspended", "createdAt", "lastSeen", "ratingsCount", "avgRating", "followersCount", "followingCount", location, "verifiedMethods", badges, "stripeAccountId", "stripeOnboardingComplete", "stripePayoutsEnabled") FROM stdin;
cmsbp0b5t0000352tk2711tm1	Test Buyer	buyer@test.com	$2b$12$h3mhgofE5kV6gXgaeYRY2emMzXdaa4tRj1UFminVzhwt2AaQNr3Ha	user	\N	\N	f	2026-08-02 11:04:08.321	2026-08-02 11:04:08.321	0	0	2	4	\N	\N	\N	\N	f	f
cmsbluq8v000035tv1zusyln9	Admin	admin@desirewardrobe.com	$2b$12$PeyGI0HXDa2ngi8XsyJaqe5BwSSaGt6bmOFf0eFL5L/sXfOT/h0lG	admin	\N	\N	f	2026-08-02 09:35:49.086	2026-08-02 09:35:49.086	0	0	0	0	\N	\N	\N	\N	f	f
cmsbluq9y000935tvspusb61q	Liam O'Brien	liam@example.com	$2b$12$ugerhHqJ63tT/D7RyIQnUOSiJpLX5tP8E1UDrtYEZaBOClvUMpNJa	user	\N	\N	f	2026-08-02 09:35:49.126	2026-08-02 09:35:49.126	0	0	2	3	Dublin, Ireland	{Email}	{}	\N	f	f
cmsbluq9z000a35tvscfnuv6v	Noah Kim	noah@example.com	$2b$12$ugerhHqJ63tT/D7RyIQnUOSiJpLX5tP8E1UDrtYEZaBOClvUMpNJa	user	\N	\N	f	2026-08-02 09:35:49.128	2026-08-02 09:35:49.128	0	0	3	4	Seoul, South Korea	{Email}	{}	\N	f	f
cmsbluqa2000b35tvm6f1r5f1	Aria Dupont	aria@example.com	$2b$12$ugerhHqJ63tT/D7RyIQnUOSiJpLX5tP8E1UDrtYEZaBOClvUMpNJa	user	\N	\N	f	2026-08-02 09:35:49.13	2026-08-02 09:35:49.13	0	0	4	2	Paris, France	{Email}	{}	\N	f	f
cmsbluqa4000c35tv539ub95q	Ethan Müller	ethan@example.com	$2b$12$ugerhHqJ63tT/D7RyIQnUOSiJpLX5tP8E1UDrtYEZaBOClvUMpNJa	user	\N	\N	f	2026-08-02 09:35:49.133	2026-08-02 09:35:49.133	0	0	6	4	Berlin, Germany	{Email}	{}	\N	f	f
cmsbluq95000135tvl0awkx44	Sophia Chen	sophia@example.com	$2b$12$ugerhHqJ63tT/D7RyIQnUOSiJpLX5tP8E1UDrtYEZaBOClvUMpNJa	user	\N	\N	f	2026-08-02 09:35:49.097	2026-08-02 09:35:49.097	0	0	0	3	San Francisco, CA	{Email}	{}	acct_1U0Et5BnpMPLK6yz	t	t
cmsbluq99000235tv18ck93kn	Marcus Rivera	marcus@example.com	$2b$12$ugerhHqJ63tT/D7RyIQnUOSiJpLX5tP8E1UDrtYEZaBOClvUMpNJa	user	\N	\N	f	2026-08-02 09:35:49.101	2026-08-02 09:35:49.101	0	0	5	3	New York, NY	{Email}	{}	\N	f	f
cmsbluq9e000335tvj2ukaywp	Emma Larsson	emma@example.com	$2b$12$ugerhHqJ63tT/D7RyIQnUOSiJpLX5tP8E1UDrtYEZaBOClvUMpNJa	user	\N	\N	f	2026-08-02 09:35:49.106	2026-08-02 09:35:49.106	0	0	3	5	Stockholm, Sweden	{Email}	{}	\N	f	f
cmsbluq9i000435tv0nbox5t0	James Okafor	james@example.com	$2b$12$ugerhHqJ63tT/D7RyIQnUOSiJpLX5tP8E1UDrtYEZaBOClvUMpNJa	user	\N	\N	f	2026-08-02 09:35:49.11	2026-08-02 09:35:49.11	0	0	4	2	London, UK	{Email}	{}	\N	f	f
cmsbluq9l000535tvizeide9b	Isabella Moretti	isabella@example.com	$2b$12$ugerhHqJ63tT/D7RyIQnUOSiJpLX5tP8E1UDrtYEZaBOClvUMpNJa	user	\N	\N	f	2026-08-02 09:35:49.113	2026-08-02 09:35:49.113	0	0	8	4	Milan, Italy	{Email}	{}	\N	f	f
cmsbluq9r000635tvcr4sfb94	Alex Thompson	alex@example.com	$2b$12$ugerhHqJ63tT/D7RyIQnUOSiJpLX5tP8E1UDrtYEZaBOClvUMpNJa	user	\N	\N	f	2026-08-02 09:35:49.119	2026-08-02 09:35:49.119	0	0	3	3	Austin, TX	{Email}	{}	\N	f	f
cmsbluq9u000735tvw9nt9lq0	Yuki Tanaka	yuki@example.com	$2b$12$ugerhHqJ63tT/D7RyIQnUOSiJpLX5tP8E1UDrtYEZaBOClvUMpNJa	user	\N	\N	f	2026-08-02 09:35:49.122	2026-08-02 09:35:49.122	0	0	3	4	Tokyo, Japan	{Email}	{}	\N	f	f
cmsbluq9w000835tvh233rkvy	Olivia Patel	olivia@example.com	$2b$12$ugerhHqJ63tT/D7RyIQnUOSiJpLX5tP8E1UDrtYEZaBOClvUMpNJa	user	\N	\N	f	2026-08-02 09:35:49.124	2026-08-02 09:35:49.124	0	0	0	6	Mumbai, India	{Email}	{}	\N	f	f
cmsco7b27000035sj7fkgfnl0	Verify User	verify-check@test.com	$2b$12$w.FrWBApjAcFr.K/1ANRtudtmRyOqpUAQ0w1HRtP/.uAj4sQwH33e	user	\N	\N	f	2026-08-03 03:29:21.343	2026-08-03 03:29:21.343	0	0	6	2	\N	\N	\N	\N	f	f
cmscschsm000035z53beff6iv	Tausif Islam Sheik	tausifislamsheik1@gmail.com	$2b$12$U6njlI6mL.PtGx3Pdt8ZJOYHy7xlZuGQO2Lm0QW8I4bg9baV0F3W.	user	\N	\N	f	2026-08-03 05:25:21.815	2026-08-03 05:25:21.815	0	0	0	0	\N	\N	\N	\N	f	f
\.


--
-- Data for Name: _ConversationToUser; Type: TABLE DATA; Schema: public; Owner: desire
--

COPY public."_ConversationToUser" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: desire
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
1f5f41aa-1462-4ddd-bf5e-149d6bc5f020	7cad9a13893473d727608be084c5f0fd5964a9f9c8a1fdc1380b1c98a0540ef9	2026-07-28 04:49:31.098915+00	20260728044930_init	\N	\N	2026-07-28 04:49:31.000106+00	1
d624851a-420c-4a4d-9539-159dd70f2f68	0ffb7ecef01f3ef60b7e62d8d8385abc0e3b7b31d532bdc30e6bed563005c9b6	2026-08-02 13:04:57.326819+00	20260802130457_add_order_quantity	\N	\N	2026-08-02 13:04:57.313599+00	1
8ad21249-47b2-437a-99cb-a1656ab1a4fe	19af3326cb2411d312bd3d310e26ed99e4f9d0dacdcc49d5c9c5cd2f77e5eb5f	2026-08-03 03:51:19.750092+00	20260803035119_add_follow_model	\N	\N	2026-08-03 03:51:19.726864+00	1
9aa6190f-6798-4de1-ae0f-5c6d1ca37272	ec2c0442070cdec61ab9eaef8ce260589d427ec086ef30a22d8d964dd3ff33ff	2026-08-03 04:28:18.398766+00	20260803050300_add_stripe_escrow_payments	\N	\N	2026-08-03 04:28:18.342628+00	1
89f4c52c-dcfb-4fd7-8cec-1afcbe1fee76	34f6ecb763e6ae74e3a1a6ac85e0494bc9d9826370cd0f7777bf89b94bbd405c	2026-08-03 05:51:50.201984+00	20260803055149_payment_method_added	\N	\N	2026-08-03 05:51:49.979575+00	1
\.


--
-- Name: Banner Banner_pkey; Type: CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Banner"
    ADD CONSTRAINT "Banner_pkey" PRIMARY KEY (id);


--
-- Name: Brand Brand_pkey; Type: CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Brand"
    ADD CONSTRAINT "Brand_pkey" PRIMARY KEY (id);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: Conversation Conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_pkey" PRIMARY KEY (id);


--
-- Name: Favorite Favorite_pkey; Type: CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Favorite"
    ADD CONSTRAINT "Favorite_pkey" PRIMARY KEY (id);


--
-- Name: Follow Follow_pkey; Type: CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Follow"
    ADD CONSTRAINT "Follow_pkey" PRIMARY KEY (id);


--
-- Name: Listing Listing_pkey; Type: CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Listing"
    ADD CONSTRAINT "Listing_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: Offer Offer_pkey; Type: CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Offer"
    ADD CONSTRAINT "Offer_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: PlatformSetting PlatformSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."PlatformSetting"
    ADD CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY (key);


--
-- Name: Report Report_pkey; Type: CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_pkey" PRIMARY KEY (id);


--
-- Name: Review Review_pkey; Type: CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_pkey" PRIMARY KEY (id);


--
-- Name: Transaction Transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _ConversationToUser _ConversationToUser_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."_ConversationToUser"
    ADD CONSTRAINT "_ConversationToUser_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Brand_name_key; Type: INDEX; Schema: public; Owner: desire
--

CREATE UNIQUE INDEX "Brand_name_key" ON public."Brand" USING btree (name);


--
-- Name: Brand_slug_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Brand_slug_idx" ON public."Brand" USING btree (slug);


--
-- Name: Brand_slug_key; Type: INDEX; Schema: public; Owner: desire
--

CREATE UNIQUE INDEX "Brand_slug_key" ON public."Brand" USING btree (slug);


--
-- Name: Category_parentId_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Category_parentId_idx" ON public."Category" USING btree ("parentId");


--
-- Name: Category_slug_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Category_slug_idx" ON public."Category" USING btree (slug);


--
-- Name: Conversation_listingId_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Conversation_listingId_idx" ON public."Conversation" USING btree ("listingId");


--
-- Name: Favorite_listingId_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Favorite_listingId_idx" ON public."Favorite" USING btree ("listingId");


--
-- Name: Favorite_userId_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Favorite_userId_idx" ON public."Favorite" USING btree ("userId");


--
-- Name: Favorite_userId_listingId_key; Type: INDEX; Schema: public; Owner: desire
--

CREATE UNIQUE INDEX "Favorite_userId_listingId_key" ON public."Favorite" USING btree ("userId", "listingId");


--
-- Name: Follow_followerId_followingId_key; Type: INDEX; Schema: public; Owner: desire
--

CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON public."Follow" USING btree ("followerId", "followingId");


--
-- Name: Follow_followerId_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Follow_followerId_idx" ON public."Follow" USING btree ("followerId");


--
-- Name: Follow_followingId_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Follow_followingId_idx" ON public."Follow" USING btree ("followingId");


--
-- Name: Listing_brand_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Listing_brand_idx" ON public."Listing" USING btree (brand);


--
-- Name: Listing_categoryId_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Listing_categoryId_idx" ON public."Listing" USING btree ("categoryId");


--
-- Name: Listing_price_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Listing_price_idx" ON public."Listing" USING btree (price);


--
-- Name: Listing_sellerId_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Listing_sellerId_idx" ON public."Listing" USING btree ("sellerId");


--
-- Name: Listing_status_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Listing_status_idx" ON public."Listing" USING btree (status);


--
-- Name: Listing_uploadedAt_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Listing_uploadedAt_idx" ON public."Listing" USING btree ("uploadedAt");


--
-- Name: Message_conversationId_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Message_conversationId_idx" ON public."Message" USING btree ("conversationId");


--
-- Name: Message_senderId_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Message_senderId_idx" ON public."Message" USING btree ("senderId");


--
-- Name: Offer_buyerId_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Offer_buyerId_idx" ON public."Offer" USING btree ("buyerId");


--
-- Name: Offer_listingId_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Offer_listingId_idx" ON public."Offer" USING btree ("listingId");


--
-- Name: Offer_sellerId_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Offer_sellerId_idx" ON public."Offer" USING btree ("sellerId");


--
-- Name: Order_buyerId_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Order_buyerId_idx" ON public."Order" USING btree ("buyerId");


--
-- Name: Order_listingId_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Order_listingId_idx" ON public."Order" USING btree ("listingId");


--
-- Name: Order_sellerId_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Order_sellerId_idx" ON public."Order" USING btree ("sellerId");


--
-- Name: Order_status_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Order_status_idx" ON public."Order" USING btree (status);


--
-- Name: Payment_orderId_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Payment_orderId_idx" ON public."Payment" USING btree ("orderId");


--
-- Name: Payment_orderId_key; Type: INDEX; Schema: public; Owner: desire
--

CREATE UNIQUE INDEX "Payment_orderId_key" ON public."Payment" USING btree ("orderId");


--
-- Name: Payment_stripePaymentIntentId_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Payment_stripePaymentIntentId_idx" ON public."Payment" USING btree ("stripePaymentIntentId");


--
-- Name: Payment_stripePaymentIntentId_key; Type: INDEX; Schema: public; Owner: desire
--

CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON public."Payment" USING btree ("stripePaymentIntentId");


--
-- Name: Report_reporterId_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Report_reporterId_idx" ON public."Report" USING btree ("reporterId");


--
-- Name: Report_status_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Report_status_idx" ON public."Report" USING btree (status);


--
-- Name: Report_targetId_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Report_targetId_idx" ON public."Report" USING btree ("targetId");


--
-- Name: Review_orderId_key; Type: INDEX; Schema: public; Owner: desire
--

CREATE UNIQUE INDEX "Review_orderId_key" ON public."Review" USING btree ("orderId");


--
-- Name: Review_revieweeId_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Review_revieweeId_idx" ON public."Review" USING btree ("revieweeId");


--
-- Name: Review_reviewerId_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Review_reviewerId_idx" ON public."Review" USING btree ("reviewerId");


--
-- Name: Transaction_orderId_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "Transaction_orderId_idx" ON public."Transaction" USING btree ("orderId");


--
-- Name: Transaction_orderId_key; Type: INDEX; Schema: public; Owner: desire
--

CREATE UNIQUE INDEX "Transaction_orderId_key" ON public."Transaction" USING btree ("orderId");


--
-- Name: User_email_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "User_email_idx" ON public."User" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: desire
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_role_idx; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "User_role_idx" ON public."User" USING btree (role);


--
-- Name: _ConversationToUser_B_index; Type: INDEX; Schema: public; Owner: desire
--

CREATE INDEX "_ConversationToUser_B_index" ON public."_ConversationToUser" USING btree ("B");


--
-- Name: Category Category_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Conversation Conversation_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listing"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Favorite Favorite_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Favorite"
    ADD CONSTRAINT "Favorite_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listing"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Favorite Favorite_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Favorite"
    ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Follow Follow_followerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Follow"
    ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Follow Follow_followingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Follow"
    ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Listing Listing_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Listing"
    ADD CONSTRAINT "Listing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Listing Listing_sellerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Listing"
    ADD CONSTRAINT "Listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Message Message_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Message Message_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Offer Offer_buyerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Offer"
    ADD CONSTRAINT "Offer_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Offer Offer_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Offer"
    ADD CONSTRAINT "Offer_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listing"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Offer Offer_sellerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Offer"
    ADD CONSTRAINT "Offer_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_buyerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listing"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_sellerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payment Payment_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Report Report_reporterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Review Review_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Review Review_revieweeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Review Review_reviewerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Transaction Transaction_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: _ConversationToUser _ConversationToUser_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."_ConversationToUser"
    ADD CONSTRAINT "_ConversationToUser_A_fkey" FOREIGN KEY ("A") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ConversationToUser _ConversationToUser_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: desire
--

ALTER TABLE ONLY public."_ConversationToUser"
    ADD CONSTRAINT "_ConversationToUser_B_fkey" FOREIGN KEY ("B") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict A93QqmEqBnJbXPW4GEYXjA5SrzQukKAIgug6dQVTYZCKwCOf7hSC2fysL6HiTdS

