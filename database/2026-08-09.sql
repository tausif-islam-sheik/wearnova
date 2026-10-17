--
-- PostgreSQL database dump
--

\restrict ecTG5dn1iIrydvIWJnVyQ7tXBiTe4Q1FAV5FYwW9uICVux7jK7BfbXH3o9UHv26

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
-- Name: Condition; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Condition" AS ENUM (
    'new_with_tags',
    'new_without_tags',
    'very_good',
    'good',
    'satisfactory'
);


--
-- Name: ListingStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ListingStatus" AS ENUM (
    'active',
    'sold',
    'reserved',
    'deactivated'
);


--
-- Name: OfferStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OfferStatus" AS ENUM (
    'pending',
    'accepted',
    'declined',
    'countered',
    'expired'
);


--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: -
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


--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'pending',
    'captured',
    'failed',
    'refunded'
);


--
-- Name: ReportReason; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReportReason" AS ENUM (
    'counterfeit',
    'not_as_described',
    'damaged',
    'inappropriate',
    'other'
);


--
-- Name: UserBadge; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserBadge" AS ENUM (
    'frequent_uploads',
    'speedy_shipping',
    'top_seller',
    'trusted'
);


--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserRole" AS ENUM (
    'user',
    'admin'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Banner; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: Brand; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Brand" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    "logoLetter" text NOT NULL,
    "productCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Category; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Category" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    icon text,
    "parentId" text
);


--
-- Name: Conversation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Conversation" (
    id text NOT NULL,
    "listingId" text NOT NULL,
    "participantIds" text[],
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Favorite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Favorite" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "listingId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Follow; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Follow" (
    id text NOT NULL,
    "followerId" text NOT NULL,
    "followingId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Listing; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: Message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Message" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "senderId" text NOT NULL,
    text text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    read boolean DEFAULT false NOT NULL
);


--
-- Name: Offer; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: Order; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: Payment; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: PlatformSetting; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PlatformSetting" (
    key text NOT NULL,
    value text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ProductQuestion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProductQuestion" (
    id text NOT NULL,
    "listingId" text NOT NULL,
    "authorId" text NOT NULL,
    text text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: QuestionReply; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."QuestionReply" (
    id text NOT NULL,
    "questionId" text NOT NULL,
    "authorId" text NOT NULL,
    text text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Report; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: Review; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: Transaction; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: _ConversationToUser; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."_ConversationToUser" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
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


--
-- Data for Name: Banner; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Banner" (id, title, body, "imageUrl", status, "order", "createdAt") FROM stdin;
cmslc52id000035t5vc4b1a5l	"IT WAS AN INVESTMENT."	Emotionally. We’re where it goes next. Join our growing community of members buying and selling pre-loved fashion.	http://localhost:4000/uploads/banners/3e35d10e-5dd5-43b4-a772-0102ce328e51.mp4	active	1	2026-08-09 05:01:37.142
cmslc5lp8000135t50lz18wqa	"EVERY PIECE HAS A STORY."	Give your wardrobe a second life. Buy and sell quality fashion with ease.	http://localhost:4000/uploads/banners/17ae77fb-e8be-4d7b-a0a2-f4cac7ae69c1.mp4	active	2	2026-08-09 05:02:02.012
cmslc680b000235t5zrhx4rg6	"SUSTAINABLE STYLE STARTS HERE."	Discover unique finds from real people. Fashion that’s kind to your closet and the planet.	http://localhost:4000/uploads/banners/419bc031-47aa-4e97-b250-e55985d6c4ae.mp4	active	3	2026-08-09 05:02:30.924
\.


--
-- Data for Name: Brand; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Brand" (id, name, slug, "logoLetter", "productCount", "createdAt") FROM stdin;
cmslbqizj000d35ejbojngbrl	& Other Stories	other-stories	&	0	2026-08-09 04:50:18.655
cmslbqizn000e35ejuw9zavry	Acne Studios	acne-studios	A	0	2026-08-09 04:50:18.659
cmslbqizp000f35ejl54rp46m	Adidas	adidas	A	0	2026-08-09 04:50:18.661
cmslbqizr000g35ejy1zro30y	Adidas Kids	adidas-kids	A	0	2026-08-09 04:50:18.663
cmslbqizs000h35ej80jetpvh	AGOLDE	agolde	A	0	2026-08-09 04:50:18.664
cmslbqizu000i35ejw7gaqot3	AirPods	airpods	A	0	2026-08-09 04:50:18.666
cmslbqizw000j35ejg6jl1h9e	Alexander McQueen	alexander-mcqueen	A	0	2026-08-09 04:50:18.669
cmslbqizy000k35ejyk52ww0g	Alo Yoga	alo-yoga	A	0	2026-08-09 04:50:18.67
cmslbqj00000l35ejm47yq96j	Amazon	amazon	A	0	2026-08-09 04:50:18.673
cmslbqj02000m35ejltylgcjb	Anastasia Beverly Hills	anastasia-beverly-hills	A	0	2026-08-09 04:50:18.674
cmslbqj03000n35ejkak1rx1v	Ancient Greek	ancient-greek	A	0	2026-08-09 04:50:18.676
cmslbqj05000o35ej2v7chi3t	Anthropologie	anthropologie	A	0	2026-08-09 04:50:18.677
cmslbqj06000p35ej8s9o1sri	Apple	apple	A	0	2026-08-09 04:50:18.679
cmslbqj08000q35ejb7y6ci08	Arc'teryx	arc-teryx	A	0	2026-08-09 04:50:18.68
cmslbqj09000r35ejmd9vkmtd	Arcteryx	arcteryx	A	0	2026-08-09 04:50:18.682
cmslbqj0b000s35ejghrepg59	Arket	arket	A	0	2026-08-09 04:50:18.684
cmslbqj0d000t35ejzq3bzjbl	Artek	artek	A	0	2026-08-09 04:50:18.685
cmslbqj0e000u35ejm4u5ky3g	ASICS	asics	A	0	2026-08-09 04:50:18.687
cmslbqj0g000v35ejg4g0sx4e	Astrid & Miyu	astrid-miyu	A	0	2026-08-09 04:50:18.688
cmslbqj0h000w35ejxp0i76l7	ASUS	asus	A	0	2026-08-09 04:50:18.689
cmslbqj0j000x35ejgxh7ceas	Away	away	A	0	2026-08-09 04:50:18.691
cmslbqj0k000y35ejfx0anxmk	Baggu	baggu	B	0	2026-08-09 04:50:18.693
cmslbqj0m000z35ejq8knnulf	Balenciaga	balenciaga	B	0	2026-08-09 04:50:18.694
cmslbqj0n001035ejveq33f2r	Bandai	bandai	B	0	2026-08-09 04:50:18.696
cmslbqj0p001135ejjg5cd2xd	Bang & Olufsen	bang-olufsen	B	0	2026-08-09 04:50:18.697
cmslbqj0q001235ejirngjoqd	Barbour	barbour	B	0	2026-08-09 04:50:18.699
cmslbqj0s001335ej131gdde5	Barker	barker	B	0	2026-08-09 04:50:18.701
cmslbqj0u001435ej9wpt49nm	Bellroy	bellroy	B	0	2026-08-09 04:50:18.703
cmslbqj0w001535ejm5cz8ng6	Birkenstock	birkenstock	B	0	2026-08-09 04:50:18.704
cmslbqj0x001635ej3fyd3g99	Black Diamond	black-diamond	B	0	2026-08-09 04:50:18.706
cmslbqj0z001735ejah90m3md	Blundstone	blundstone	B	0	2026-08-09 04:50:18.707
cmslbqj10001835ejiqu6dw91	Boll & Branch	boll-branch	B	0	2026-08-09 04:50:18.709
cmslbqj12001935ejwytjxpx8	Bose	bose	B	0	2026-08-09 04:50:18.71
cmslbqj14001a35ejrnmvyiru	Bottega Veneta	bottega-veneta	B	0	2026-08-09 04:50:18.712
cmslbqj16001b35ejtdx5sfmp	Brompton	brompton	B	0	2026-08-09 04:50:18.714
cmslbqj17001c35ejmylj5q77	Brooklinen	brooklinen	B	0	2026-08-09 04:50:18.716
cmslbqj19001d35ejradmyoan	Burberry	burberry	B	0	2026-08-09 04:50:18.717
cmslbqj1a001e35ejd5yqz2jc	Byredo	byredo	B	0	2026-08-09 04:50:18.719
cmslbqj1c001f35ejw8udyixd	Canon	canon	C	0	2026-08-09 04:50:18.72
cmslbqj1d001g35ejus7cg2p1	Canyon	canyon	C	0	2026-08-09 04:50:18.722
cmslbqj1f001h35ejd2ymdvj9	Car Shoe	car-shoe	C	0	2026-08-09 04:50:18.723
cmslbqj1h001i35ejn5ymdkqi	Carhartt	carhartt	C	0	2026-08-09 04:50:18.725
cmslbqj1i001j35eji10noca6	Carter's	carter-s	C	0	2026-08-09 04:50:18.727
cmslbqj1k001k35ejiooa9os4	Cartier	cartier	C	0	2026-08-09 04:50:18.728
cmslbqj1l001l35ej7k8bhe5k	Casio	casio	C	0	2026-08-09 04:50:18.73
cmslbqj1n001m35ejtmiixdad	Celine	celine	C	0	2026-08-09 04:50:18.731
cmslbqj1p001n35ej8tanxjo1	CeraVe	cerave	C	0	2026-08-09 04:50:18.733
cmslbqj1q001o35ejrylo9ag7	Chanel	chanel	C	0	2026-08-09 04:50:18.735
cmslbqj1s001p35ej7m6fdp55	Charles Tyrwhitt	charles-tyrwhitt	C	0	2026-08-09 04:50:18.736
cmslbqj1u001q35ej4ehszo4t	Charlotte Tilbury	charlotte-tilbury	C	0	2026-08-09 04:50:18.738
cmslbqj1w001r35ejs6tk0flb	Christian Louboutin	christian-louboutin	C	0	2026-08-09 04:50:18.74
cmslbqj1y001s35ej8kqiu9jn	Church's	church-s	C	0	2026-08-09 04:50:18.742
cmslbqj1z001t35ejpoomrv4i	Clarks	clarks	C	0	2026-08-09 04:50:18.744
cmslbqj21001u35ej94b6cqn5	Clarks Kids	clarks-kids	C	0	2026-08-09 04:50:18.745
cmslbqj22001v35ejwmdm2aqz	Coach	coach	C	0	2026-08-09 04:50:18.747
cmslbqj24001w35ejzcty4b5d	Columbia	columbia	C	0	2026-08-09 04:50:18.748
cmslbqj25001x35ej4f0dbf1y	Converse	converse	C	0	2026-08-09 04:50:18.749
cmslbqj26001y35ejzddkjl1r	COS	cos	C	0	2026-08-09 04:50:18.751
cmslbqj28001z35ej5327lh4k	Crocs	crocs	C	0	2026-08-09 04:50:18.752
cmslbqj29002035ejgm9esz7j	Cult Furniture	cult-furniture	C	0	2026-08-09 04:50:18.754
cmslbqj2d002135ejow7o9593	Dell	dell	D	0	2026-08-09 04:50:18.758
cmslbqj2f002235ejdo71b2r3	DeMellier	demellier	D	0	2026-08-09 04:50:18.76
cmslbqj2i002335ejok3z0oxi	Dickies	dickies	D	0	2026-08-09 04:50:18.762
cmslbqj2k002435ej4ypmndig	Diesel	diesel	D	0	2026-08-09 04:50:18.764
cmslbqj2l002535ejj7zbcv0z	Dior	dior	D	0	2026-08-09 04:50:18.765
cmslbqj2m002635ej19tgwywq	Diptyque	diptyque	D	0	2026-08-09 04:50:18.767
cmslbqj2o002735ejhglamozi	Disney	disney	D	0	2026-08-09 04:50:18.768
cmslbqj2p002835ejh637ferh	Disney Lorcana	disney-lorcana	D	0	2026-08-09 04:50:18.77
cmslbqj2r002935ejenqdeh5s	DJI	dji	D	0	2026-08-09 04:50:18.771
cmslbqj2t002a35ej3h7hdbz3	Dr. Martens	dr-martens	D	0	2026-08-09 04:50:18.773
cmslbqj2u002b35ejxl9latvy	Dragon Ball	dragon-ball	D	0	2026-08-09 04:50:18.775
cmslbqj2w002c35ejsz9812jm	Drunk Elephant	drunk-elephant	D	0	2026-08-09 04:50:18.776
cmslbqj2y002d35ejtt9e8vdb	Duralex	duralex	D	0	2026-08-09 04:50:18.778
cmslbqj2z002e35ejypjtqsyx	Eastpak	eastpak	E	0	2026-08-09 04:50:18.779
cmslbqj30002f35ejxfkpciq5	Ermenegildo Zegna	ermenegildo-zegna	E	0	2026-08-09 04:50:18.781
cmslbqj32002g35ejuu4he4ln	Estee Lauder	estee-lauder	E	0	2026-08-09 04:50:18.782
cmslbqj33002h35eja6dunmwo	Everlane	everlane	E	0	2026-08-09 04:50:18.784
cmslbqj34002i35ejomzbxjit	Fear of God	fear-of-god	F	0	2026-08-09 04:50:18.785
cmslbqj36002j35ej3md49kus	Fenty Beauty	fenty-beauty	F	0	2026-08-09 04:50:18.786
cmslbqj37002k35ejn0thkgp7	Fisher-Price	fisher-price	F	0	2026-08-09 04:50:18.788
cmslbqj39002l35ejusp7flft	Fjallraven	fjallraven	F	0	2026-08-09 04:50:18.789
cmslbqj3a002m35ejeczbprid	Frame Denim	frame-denim	F	0	2026-08-09 04:50:18.791
cmslbqj3c002n35ejxjsk8l57	Framework	framework	F	0	2026-08-09 04:50:18.792
cmslbqj3d002o35ejs7w26zfh	Free People	free-people	F	0	2026-08-09 04:50:18.794
cmslbqj3f002p35ej3xwiylma	Fujifilm	fujifilm	F	0	2026-08-09 04:50:18.795
cmslbqj3g002q35ej49x3z2dm	Funko	funko	F	0	2026-08-09 04:50:18.797
cmslbqj3i002r35ej13wlddzb	Furla	furla	F	0	2026-08-09 04:50:18.798
cmslbqj3j002s35ej3pdsqx56	G-Star RAW	g-star-raw	G	0	2026-08-09 04:50:18.799
cmslbqj3k002t35ejw63mcf6g	Ganni	ganni	G	0	2026-08-09 04:50:18.801
cmslbqj3m002u35ej8ryesqns	Garmin	garmin	G	0	2026-08-09 04:50:18.803
cmslbqj3o002v35ejzni1utkt	Geox	geox	G	0	2026-08-09 04:50:18.804
cmslbqj3q002w35ejpfxjcwpk	Giant	giant	G	0	2026-08-09 04:50:18.806
cmslbqj3r002x35ejqucqmpqx	Good Smile Company	good-smile-company	G	0	2026-08-09 04:50:18.808
cmslbqj3s002y35ej0ta3vsvy	Google	google	G	0	2026-08-09 04:50:18.809
cmslbqj3u002z35ejjdqxgd2e	GoPro	gopro	G	0	2026-08-09 04:50:18.81
cmslbqj3v003035ejhx9fizxj	Grenson	grenson	G	0	2026-08-09 04:50:18.812
cmslbqj3x003135eji68d5uau	Gucci	gucci	G	0	2026-08-09 04:50:18.813
cmslbqj3y003235ej8x707985	Gymshark	gymshark	G	0	2026-08-09 04:50:18.815
cmslbqj41003335ej89h8vx1s	H&M	h-m	H	0	2026-08-09 04:50:18.817
cmslbqj42003435ejhf9v369n	H&M Home	h-m-home	H	0	2026-08-09 04:50:18.819
cmslbqj44003535ejcvwbrr09	H&M Kids	h-m-kids	H	0	2026-08-09 04:50:18.82
cmslbqj45003635ej3kyppqz7	Hamilton	hamilton	H	0	2026-08-09 04:50:18.822
cmslbqj47003735ej0y9li2qr	Hasbro	hasbro	H	0	2026-08-09 04:50:18.823
cmslbqj49003835ej0cap1uvk	Havaianas	havaianas	H	0	2026-08-09 04:50:18.825
cmslbqj4b003935ejiqjb4tah	HAY	hay	H	0	2026-08-09 04:50:18.827
cmslbqj4d003a35ejjdonsw1b	Helly Hansen	helly-hansen	H	0	2026-08-09 04:50:18.829
cmslbqj4e003b35ejyg6tnp8m	Herman Miller	herman-miller	H	0	2026-08-09 04:50:18.831
cmslbqj4h003c35ejkf4lagdw	Hermès	herm-s	H	0	2026-08-09 04:50:18.833
cmslbqj4i003d35ejfksl9vf5	Herschel	herschel	H	0	2026-08-09 04:50:18.835
cmslbqj4k003e35ejkmp2vzpu	Hoka	hoka	H	0	2026-08-09 04:50:18.836
cmslbqj4l003f35ejr986zkuj	Hot Toys	hot-toys	H	0	2026-08-09 04:50:18.838
cmslbqj4n003g35ejtvpdk1mk	Hot Wheels	hot-wheels	H	0	2026-08-09 04:50:18.839
cmslbqj4o003h35ej72r4tm3p	HP	hp	H	0	2026-08-09 04:50:18.84
cmslbqj4p003i35ejjfcfh97x	Huda Beauty	huda-beauty	H	0	2026-08-09 04:50:18.842
cmslbqj4r003j35ej54q3y3ea	Hugo Boss	hugo-boss	H	0	2026-08-09 04:50:18.843
cmslbqj4t003k35ej4ni9zebv	Hunter	hunter	H	0	2026-08-09 04:50:18.845
cmslbqj4u003l35ejcdntfbta	IKEA	ikea	I	0	2026-08-09 04:50:18.847
cmslbqj4x003m35ej092dgcbo	Jeffrey Campbell	jeffrey-campbell	J	0	2026-08-09 04:50:18.85
cmslbqj4z003n35ej7i5vgbiv	Jimmy Choo	jimmy-choo	J	0	2026-08-09 04:50:18.852
cmslbqj51003o35ejo71xw6rg	Jo Malone	jo-malone	J	0	2026-08-09 04:50:18.854
cmslbqj53003p35ejv0tpduf0	John Smedley	john-smedley	J	0	2026-08-09 04:50:18.855
cmslbqj55003q35ejrglee7js	Joseph Joseph	joseph-joseph	J	0	2026-08-09 04:50:18.857
cmslbqj56003r35ejtj8yugq6	JW Pei	jw-pei	J	0	2026-08-09 04:50:18.859
cmslbqj58003s35ejealnitos	Kenzo	kenzo	K	0	2026-08-09 04:50:18.86
cmslbqj59003t35ejpgrpsq6s	Kiehl's	kiehl-s	K	0	2026-08-09 04:50:18.861
cmslbqj5b003u35ejh9ud647u	Kipling	kipling	K	0	2026-08-09 04:50:18.863
cmslbqj5c003v35ejulny5ot3	KitchenAid	kitchenaid	K	0	2026-08-09 04:50:18.865
cmslbqj5e003w35ejn2gup4z3	Kotobukiya	kotobukiya	K	0	2026-08-09 04:50:18.866
cmslbqj5f003x35ejtkzumdvo	L.K.Bennett	l-k-bennett	L	0	2026-08-09 04:50:18.868
cmslbqj5h003y35ejnd9qq9j0	L.L.Bean	l-l-bean	L	0	2026-08-09 04:50:18.869
cmslbqj5i003z35ejket94dyh	La Roche-Posay	la-roche-posay	L	0	2026-08-09 04:50:18.871
cmslbqj5k004035ejdye0xkke	Le Creuset	le-creuset	L	0	2026-08-09 04:50:18.872
cmslbqj5l004135ej2yduqxxo	Le Labo	le-labo	L	0	2026-08-09 04:50:18.874
cmslbqj5n004235ejdglib3v6	Le Specs	le-specs	L	0	2026-08-09 04:50:18.875
cmslbqj5o004335ejhbrjj8k5	LEGO	lego	L	0	2026-08-09 04:50:18.876
cmslbqj5p004435ej5gwk3w5k	Leica	leica	L	0	2026-08-09 04:50:18.878
cmslbqj5r004535ejzn5l5r1u	Lenovo	lenovo	L	0	2026-08-09 04:50:18.879
cmslbqj5s004635ej9t7r7pnk	Levi's	levi-s	L	0	2026-08-09 04:50:18.881
cmslbqj5u004735ejq6449u9z	Loake	loake	L	0	2026-08-09 04:50:18.882
cmslbqj5v004835ejk0g2na86	Lodge	lodge	L	0	2026-08-09 04:50:18.884
cmslbqj5x004935ejaiwtkz4o	Loewe	loewe	L	0	2026-08-09 04:50:18.885
cmslbqj5y004a35ejxut8qso8	Logitech	logitech	L	0	2026-08-09 04:50:18.886
cmslbqj5z004b35ejp0vznzg8	Longchamp	longchamp	L	0	2026-08-09 04:50:18.888
cmslbqj61004c35ej9tczzop7	Louis Vuitton	louis-vuitton	L	0	2026-08-09 04:50:18.889
cmslbqj62004d35ej5ehhpokv	Lululemon	lululemon	L	0	2026-08-09 04:50:18.891
cmslbqj64004e35ejygewbgan	MAC	mac	M	0	2026-08-09 04:50:18.892
cmslbqj65004f35ej5u5isenh	Madewell	madewell	M	0	2026-08-09 04:50:18.893
cmslbqj66004g35eje2f1fglk	Magic: The Gathering	magic-the-gathering	M	0	2026-08-09 04:50:18.895
cmslbqj67004h35ejs1l3avzp	Maison Margiela	maison-margiela	M	0	2026-08-09 04:50:18.896
cmslbqj69004i35ejkz2wmu36	Mango	mango	M	0	2026-08-09 04:50:18.897
cmslbqj6a004j35ej8gd4qhlv	Mango Kids	mango-kids	M	0	2026-08-09 04:50:18.898
cmslbqj6b004k35ejxj3or8kk	Mango Man	mango-man	M	0	2026-08-09 04:50:18.899
cmslbqj6c004l35ejg1qy4zpe	Manolo Blahnik	manolo-blahnik	M	0	2026-08-09 04:50:18.901
cmslbqj6d004m35ejhwg54tuq	Marshall	marshall	M	0	2026-08-09 04:50:18.902
cmslbqj6f004n35ej0lkduuw3	Marvel	marvel	M	0	2026-08-09 04:50:18.903
cmslbqj6g004o35ejcyi92zli	Mattel	mattel	M	0	2026-08-09 04:50:18.905
cmslbqj6h004p35ej42a47lrr	McFarlane	mcfarlane	M	0	2026-08-09 04:50:18.906
cmslbqj6k004q35ej9oxefmb1	Mejuri	mejuri	M	0	2026-08-09 04:50:18.908
cmslbqj6m004r35ej3n3l63tv	Melissa & Doug	melissa-doug	M	0	2026-08-09 04:50:18.911
cmslbqj6o004s35ejy2g0md52	Microsoft	microsoft	M	0	2026-08-09 04:50:18.912
cmslbqj6q004t35ejfv00ul8u	Miracle	miracle	M	0	2026-08-09 04:50:18.915
cmslbqj6s004u35eji9z8wwfj	Missoma	missoma	M	0	2026-08-09 04:50:18.916
cmslbqj6t004v35ejtgtwe1fd	Monica Vinader	monica-vinader	M	0	2026-08-09 04:50:18.918
cmslbqj6v004w35ejvpw9fzdw	Montblanc	montblanc	M	0	2026-08-09 04:50:18.919
cmslbqj6w004x35ejjmovjtgl	Mother Denim	mother-denim	M	0	2026-08-09 04:50:18.92
cmslbqj6x004y35ejaq833qxs	Mountain Hardwear	mountain-hardwear	M	0	2026-08-09 04:50:18.922
cmslbqj6z004z35ejbthpnztv	MUJI	muji	M	0	2026-08-09 04:50:18.923
cmslbqj71005035ejpphkbokg	Muuto	muuto	M	0	2026-08-09 04:50:18.925
cmslbqj72005135ej5hsmxvw8	NARS	nars	N	0	2026-08-09 04:50:18.927
cmslbqj74005235ej7wxybr29	NECA	neca	N	0	2026-08-09 04:50:18.928
cmslbqj75005335ejef8yuaud	New Balance	new-balance	N	0	2026-08-09 04:50:18.93
cmslbqj77005435ej0znr5p2p	New Era	new-era	N	0	2026-08-09 04:50:18.931
cmslbqj78005535ejbhcwaqlb	Next	next	N	0	2026-08-09 04:50:18.932
cmslbqj79005635ejgo6o4yq8	Nike	nike	N	0	2026-08-09 04:50:18.934
cmslbqj7b005735ejvtmqx6qz	Nike Kids	nike-kids	N	0	2026-08-09 04:50:18.935
cmslbqj7c005835ejg244k4wt	Nikon	nikon	N	0	2026-08-09 04:50:18.937
cmslbqj7e005935ej0dwunce7	Nintendo	nintendo	N	0	2026-08-09 04:50:18.939
cmslbqj7g005a35ej8xgyq2tv	Nothing	nothing	N	0	2026-08-09 04:50:18.94
cmslbqj7i005b35ejlhlumqb0	Nudie Jeans	nudie-jeans	N	0	2026-08-09 04:50:18.942
cmslbqj7k005c35ej0ce4vff1	Oakley	oakley	O	0	2026-08-09 04:50:18.945
cmslbqj7m005d35ejzutalmsd	Off-White	off-white	O	0	2026-08-09 04:50:18.946
cmslbqj7n005e35eji1t5ey2q	Oliver Bonas	oliver-bonas	O	0	2026-08-09 04:50:18.948
cmslbqj7p005f35ej3guy6e65	Olivia Burton	olivia-burton	O	0	2026-08-09 04:50:18.949
cmslbqj7r005g35ejm9t7t7cb	Omega	omega	O	0	2026-08-09 04:50:18.951
cmslbqj7t005h35ejn5v6gn23	On Running	on-running	O	0	2026-08-09 04:50:18.953
cmslbqj7u005i35ejk1yf62pv	One Piece	one-piece	O	0	2026-08-09 04:50:18.955
cmslbqj7x005j35ej5wl91q69	OnePlus	oneplus	O	0	2026-08-09 04:50:18.957
cmslbqj7y005k35ej5894pfj2	Pandora	pandora	P	0	2026-08-09 04:50:18.959
cmslbqj80005l35ejllzp0g0e	Patagonia	patagonia	P	0	2026-08-09 04:50:18.96
cmslbqj81005m35ejzdrzl2zf	Peloton	peloton	P	0	2026-08-09 04:50:18.962
cmslbqj83005n35ej5ah1t5hc	Playmobil	playmobil	P	0	2026-08-09 04:50:18.963
cmslbqj84005o35ejvjpzpuhy	Pokemon	pokemon	P	0	2026-08-09 04:50:18.965
cmslbqj85005p35ejynchahne	Polo Ralph Lauren	polo-ralph-lauren	P	0	2026-08-09 04:50:18.966
cmslbqj87005q35ejhwb05g7g	Prada	prada	P	0	2026-08-09 04:50:18.967
cmslbqj88005r35ej4546go0b	Puma	puma	P	0	2026-08-09 04:50:18.968
cmslbqj89005s35ejyilbm8ik	Quay Australia	quay-australia	Q	0	2026-08-09 04:50:18.97
cmslbqj8c005t35ejigxnck47	Radley	radley	R	0	2026-08-09 04:50:18.972
cmslbqj8d005u35ejtt5fo0ys	Rains	rains	R	0	2026-08-09 04:50:18.974
cmslbqj8f005v35ejl9vd90za	Rapha	rapha	R	0	2026-08-09 04:50:18.975
cmslbqj8g005w35ejpa0hj3za	Rare Beauty	rare-beauty	R	0	2026-08-09 04:50:18.977
cmslbqj8i005x35ejnmrnfjhm	Ray-Ban	ray-ban	R	0	2026-08-09 04:50:18.978
cmslbqj8j005y35ej7lna4c0i	Razer	razer	R	0	2026-08-09 04:50:18.979
cmslbqj8k005z35ejr0sah700	Red Wing	red-wing	R	0	2026-08-09 04:50:18.981
cmslbqj8m006035ej5yobcdqv	Reformation	reformation	R	0	2026-08-09 04:50:18.982
cmslbqj8n006135ejqpgttg88	RM Williams	rm-williams	R	0	2026-08-09 04:50:18.984
cmslbqj8p006235ejymghyujo	Rogue	rogue	R	0	2026-08-09 04:50:18.985
cmslbqj8r006335ejgw9znizy	Rolex	rolex	R	0	2026-08-09 04:50:18.987
cmslbqj8s006435ejtcqijaay	Rothy's	rothy-s	R	0	2026-08-09 04:50:18.989
cmslbqj8u006535ejpsrwe4k4	Saint Laurent	saint-laurent	S	0	2026-08-09 04:50:18.99
cmslbqj8v006635ej801mwnfj	Salomon	salomon	S	0	2026-08-09 04:50:18.992
cmslbqj8x006735ejv6wj4hxs	Sam Edelman	sam-edelman	S	0	2026-08-09 04:50:18.993
cmslbqj8y006835ejrhvxmu1u	Samsung	samsung	S	0	2026-08-09 04:50:18.994
cmslbqj8z006935ejy3bow7oe	Secrid	secrid	S	0	2026-08-09 04:50:18.996
cmslbqj91006a35ejs04wv32d	Seiko	seiko	S	0	2026-08-09 04:50:18.997
cmslbqj93006b35ejjod2nitb	Sennheiser	sennheiser	S	0	2026-08-09 04:50:18.999
cmslbqj95006c35ejhwsgmsp7	Shimano	shimano	S	0	2026-08-09 04:50:19.002
cmslbqj97006d35ej5w5mkemf	Sideshow	sideshow	S	0	2026-08-09 04:50:19.003
cmslbqj99006e35ejxmwzddoi	Smeg	smeg	S	0	2026-08-09 04:50:19.005
cmslbqj9a006f35ej8iomo7jl	Solovair	solovair	S	0	2026-08-09 04:50:19.007
cmslbqj9c006g35ejgr2vj3ng	Sonos	sonos	S	0	2026-08-09 04:50:19.008
cmslbqj9e006h35ejlrwc5fxf	Sony	sony	S	0	2026-08-09 04:50:19.01
cmslbqj9g006i35ejy9s29k10	Specialized	specialized	S	0	2026-08-09 04:50:19.012
cmslbqj9i006j35ejfm3mxsnd	Sports Cards	sports-cards	S	0	2026-08-09 04:50:19.014
cmslbqj9k006k35ejpcli945f	Star Wars	star-wars	S	0	2026-08-09 04:50:19.016
cmslbqj9l006l35ejkad93l10	Start-Rite	start-rite	S	0	2026-08-09 04:50:19.018
cmslbqj9n006m35ejgm87p0x0	Staud	staud	S	0	2026-08-09 04:50:19.019
cmslbqj9p006n35ej76iibz8z	SteelSeries	steelseries	S	0	2026-08-09 04:50:19.021
cmslbqj9q006o35ejj7fq1ubs	Stutterheim	stutterheim	S	0	2026-08-09 04:50:19.023
cmslbqj9s006p35ejxbdt4m50	Sunspel	sunspel	S	0	2026-08-09 04:50:19.024
cmslbqj9t006q35ejmta6ycvc	Supreme	supreme	S	0	2026-08-09 04:50:19.025
cmslbqj9u006r35ejeqdg053k	Swarovski	swarovski	S	0	2026-08-09 04:50:19.027
cmslbqj9w006s35ejqo758dq6	Sweaty Betty	sweaty-betty	S	0	2026-08-09 04:50:19.028
cmslbqj9x006t35ejv600hpbe	Tag Heuer	tag-heuer	T	0	2026-08-09 04:50:19.029
cmslbqj9y006u35ejweewk9lu	Tamara Mellon	tamara-mellon	T	0	2026-08-09 04:50:19.031
cmslbqja1006v35ejosc754tb	Teva	teva	T	0	2026-08-09 04:50:19.033
cmslbqja3006w35ejnmn9eclq	The Children's Place	the-children-s-place	T	0	2026-08-09 04:50:19.036
cmslbqja5006x35ejpnym4ev3	The North Face	the-north-face	T	0	2026-08-09 04:50:19.038
cmslbqja7006y35ejs86982r5	The Ordinary	the-ordinary	T	0	2026-08-09 04:50:19.039
cmslbqja8006z35ej5z7kpj0n	The White Company	the-white-company	T	0	2026-08-09 04:50:19.041
cmslbqjaa007035ejwa3j5ybf	Theory	theory	T	0	2026-08-09 04:50:19.042
cmslbqjab007135ejze8pf5ye	Theragun	theragun	T	0	2026-08-09 04:50:19.044
cmslbqjad007235ejjgqi0tte	Tiffany & Co.	tiffany-co	T	0	2026-08-09 04:50:19.045
cmslbqjaf007335ej92bcr377	Timberland	timberland	T	0	2026-08-09 04:50:19.047
cmslbqjag007435ejnaucdkib	Timex	timex	T	0	2026-08-09 04:50:19.049
cmslbqjai007535ej5isgjgkc	Tissot	tissot	T	0	2026-08-09 04:50:19.05
cmslbqjaj007635ejc6wqhk73	Tod's	tod-s	T	0	2026-08-09 04:50:19.052
cmslbqjal007735ej1jlyoajn	Tom Ford	tom-ford	T	0	2026-08-09 04:50:19.053
cmslbqjam007835ejtdths5q4	Toms	toms	T	0	2026-08-09 04:50:19.055
cmslbqjao007935ejac6s85u7	Trek	trek	T	0	2026-08-09 04:50:19.056
cmslbqjap007a35ej6oxf1gw3	TRX	trx	T	0	2026-08-09 04:50:19.057
cmslbqjaq007b35ej2x6nkifo	Tumi	tumi	T	0	2026-08-09 04:50:19.059
cmslbqjas007c35ejc5r650sh	Ugg	ugg	U	0	2026-08-09 04:50:19.06
cmslbqjat007d35ej8sht7up4	Under Armour	under-armour	U	0	2026-08-09 04:50:19.061
cmslbqjau007e35ejgagaz76y	Uniqlo	uniqlo	U	0	2026-08-09 04:50:19.063
cmslbqjaw007f35ejz18a6fmb	Uniqlo Kids	uniqlo-kids	U	0	2026-08-09 04:50:19.064
cmslbqjay007g35ejwlm0gpjm	Vagabond	vagabond	V	0	2026-08-09 04:50:19.067
cmslbqjb0007h35ejgpu9v8rg	Valve	valve	V	0	2026-08-09 04:50:19.069
cmslbqjb2007i35ejescq6qu1	Vans	vans	V	0	2026-08-09 04:50:19.07
cmslbqjb4007j35ejdpbrpjvx	Vans Kids	vans-kids	V	0	2026-08-09 04:50:19.073
cmslbqjb6007k35ej3t8jphsr	Veja	veja	V	0	2026-08-09 04:50:19.074
cmslbqjb7007l35ejhm0ojf30	Vitamix	vitamix	V	0	2026-08-09 04:50:19.076
cmslbqjb9007m35ejoyv9mamx	VTech	vtech	V	0	2026-08-09 04:50:19.077
cmslbqjba007n35ejzfqy7eeb	West Elm	west-elm	W	0	2026-08-09 04:50:19.079
cmslbqjbc007o35ejugk0qdfp	Xiaomi	xiaomi	X	0	2026-08-09 04:50:19.08
cmslbqjbd007p35ejs2yo4u6q	Yu-Gi-Oh!	yu-gi-oh	Y	0	2026-08-09 04:50:19.082
cmslbqjbg007q35ej7aizqf8r	Zara	zara	Z	0	2026-08-09 04:50:19.084
cmslbqjbh007r35ejs6w3aax5	Zara Home	zara-home	Z	0	2026-08-09 04:50:19.086
cmslbqjbj007s35ej6n1o03jx	Zara Kids	zara-kids	Z	0	2026-08-09 04:50:19.087
cmslbqjbk007t35ejrg9pqz1p	Zwilling	zwilling	Z	0	2026-08-09 04:50:19.089
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: -
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
-- Data for Name: Conversation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Conversation" (id, "listingId", "participantIds", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Favorite; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Favorite" (id, "userId", "listingId", "createdAt") FROM stdin;
\.


--
-- Data for Name: Follow; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Follow" (id, "followerId", "followingId", "createdAt") FROM stdin;
cmslbqjkg00ej35ejlf24mxet	cmslbqivb000935ej2kfvj06z	cmslbqiur000135ejaddnc0e3	2026-08-09 04:50:19.408
cmslbqjkj00el35ejg1rqqz0o	cmslbqivb000935ej2kfvj06z	cmslbqivg000c35ej61yhiozk	2026-08-09 04:50:19.411
cmslbqjkk00en35ejpwudvcrd	cmslbqivd000a35ej43xc3023	cmslbqive000b35ej4w4zr1se	2026-08-09 04:50:19.413
cmslbqjkm00ep35ej95s533es	cmslbqivd000a35ej43xc3023	cmslbqiv3000635ej8az5pm2t	2026-08-09 04:50:19.415
cmslbqjko00er35ejcq0vvg46	cmslbqive000b35ej4w4zr1se	cmslbqiv6000735ejyp92tcat	2026-08-09 04:50:19.417
cmslbqjkq00et35ej0rybiuua	cmslbqive000b35ej4w4zr1se	cmslbqiv3000635ej8az5pm2t	2026-08-09 04:50:19.419
cmslbqjm400ez35ejb70y75jq	cmslbqivg000c35ej61yhiozk	cmslbqivb000935ej2kfvj06z	2026-08-09 04:50:19.468
cmslbqjm500f135ejthshdocd	cmslbqivg000c35ej61yhiozk	cmslbqiv3000635ej8az5pm2t	2026-08-09 04:50:19.47
cmslbqjm700f335ej86zvtmfj	cmslbqivg000c35ej61yhiozk	cmslbqivd000a35ej43xc3023	2026-08-09 04:50:19.471
cmslbqjm900f535ejtxoq3gla	cmslbqivg000c35ej61yhiozk	cmslbqiur000135ejaddnc0e3	2026-08-09 04:50:19.474
cmslbqjmc00f735ejo76japy2	cmslbqivg000c35ej61yhiozk	cmslbqiuz000435ej25bzx608	2026-08-09 04:50:19.476
cmslbqjmh00fb35ejogy8sgyo	cmslbqiur000135ejaddnc0e3	cmslbqivd000a35ej43xc3023	2026-08-09 04:50:19.482
cmslbqjmj00fd35ejqzk0ne2b	cmslbqiur000135ejaddnc0e3	cmslbqiuz000435ej25bzx608	2026-08-09 04:50:19.484
cmslbqjml00ff35ejqm1cw7bo	cmslbqiuu000235ejeuh39xiw	cmslbqiur000135ejaddnc0e3	2026-08-09 04:50:19.486
cmslbqjmo00fh35ej9rg3g4mb	cmslbqiuu000235ejeuh39xiw	cmslbqive000b35ej4w4zr1se	2026-08-09 04:50:19.488
cmslbqjms00fj35ejkyp8e3qf	cmslbqiuu000235ejeuh39xiw	cmslbqiux000335ej0cp54dss	2026-08-09 04:50:19.492
cmslbqjmu00fl35ej98p9hjhu	cmslbqiuu000235ejeuh39xiw	cmslbqiv9000835ejipaundju	2026-08-09 04:50:19.494
cmslbqjmw00fn35ejp2qsy8md	cmslbqiuu000235ejeuh39xiw	cmslbqivb000935ej2kfvj06z	2026-08-09 04:50:19.496
cmslbqjmy00fp35ej0i5d1yso	cmslbqiux000335ej0cp54dss	cmslbqiv6000735ejyp92tcat	2026-08-09 04:50:19.498
cmslbqjn000fr35ejlpmiewh3	cmslbqiux000335ej0cp54dss	cmslbqivb000935ej2kfvj06z	2026-08-09 04:50:19.5
cmslbqjn400fv35ejk9yoty83	cmslbqiux000335ej0cp54dss	cmslbqiv9000835ejipaundju	2026-08-09 04:50:19.505
cmslbqjn600fx35ejofvxn5xg	cmslbqiuz000435ej25bzx608	cmslbqivd000a35ej43xc3023	2026-08-09 04:50:19.507
cmslbqjn800fz35ejuuuad1xa	cmslbqiuz000435ej25bzx608	cmslbqiv3000635ej8az5pm2t	2026-08-09 04:50:19.508
cmslbqjna00g135ej3q2x4u2d	cmslbqiuz000435ej25bzx608	cmslbqiv6000735ejyp92tcat	2026-08-09 04:50:19.51
cmslbqjnb00g335ejtfixkv6r	cmslbqiuz000435ej25bzx608	cmslbqiuu000235ejeuh39xiw	2026-08-09 04:50:19.512
cmslbqjng00g935ejpgw7s023	cmslbqiv1000535ej5nylp0ae	cmslbqiuz000435ej25bzx608	2026-08-09 04:50:19.517
cmslbqjni00gb35ej0ltfyfji	cmslbqiv1000535ej5nylp0ae	cmslbqivb000935ej2kfvj06z	2026-08-09 04:50:19.518
cmslbqjnk00gd35ej7eobtsc0	cmslbqiv1000535ej5nylp0ae	cmslbqive000b35ej4w4zr1se	2026-08-09 04:50:19.52
cmslbqjnl00gf35ejg6p9cf3y	cmslbqiv1000535ej5nylp0ae	cmslbqivg000c35ej61yhiozk	2026-08-09 04:50:19.522
cmslbqjnn00gh35eja7toke0f	cmslbqiv3000635ej8az5pm2t	cmslbqiv6000735ejyp92tcat	2026-08-09 04:50:19.523
cmslbqjnq00gj35ejrq0f1r44	cmslbqiv3000635ej8az5pm2t	cmslbqiur000135ejaddnc0e3	2026-08-09 04:50:19.527
cmslbqjnt00gl35ej83ux3sm4	cmslbqiv3000635ej8az5pm2t	cmslbqiv1000535ej5nylp0ae	2026-08-09 04:50:19.529
cmslbqjnv00gn35ej1160ud50	cmslbqiv3000635ej8az5pm2t	cmslbqiux000335ej0cp54dss	2026-08-09 04:50:19.531
cmslbqjnw00gp35ejtk9da9bw	cmslbqiv6000735ejyp92tcat	cmslbqiv3000635ej8az5pm2t	2026-08-09 04:50:19.533
cmslbqjny00gr35ejmozp2svq	cmslbqiv6000735ejyp92tcat	cmslbqivb000935ej2kfvj06z	2026-08-09 04:50:19.534
cmslbqjnz00gt35ejvmm5b9mp	cmslbqiv6000735ejyp92tcat	cmslbqive000b35ej4w4zr1se	2026-08-09 04:50:19.536
cmslbqjo100gv35ejru0knm6p	cmslbqiv6000735ejyp92tcat	cmslbqiur000135ejaddnc0e3	2026-08-09 04:50:19.537
cmslbqjoi00gx35ejw1f7f5fp	cmslbqiv9000835ejipaundju	cmslbqivd000a35ej43xc3023	2026-08-09 04:50:19.554
cmslbqjok00gz35ejw3fg806e	cmslbqiv9000835ejipaundju	cmslbqiux000335ej0cp54dss	2026-08-09 04:50:19.556
cmslbqjom00h135ejebtd8u51	cmslbqiv9000835ejipaundju	cmslbqiv3000635ej8az5pm2t	2026-08-09 04:50:19.558
cmslbqjoo00h335ej1up7jy4h	cmslbqiv9000835ejipaundju	cmslbqiv1000535ej5nylp0ae	2026-08-09 04:50:19.56
\.


--
-- Data for Name: Listing; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Listing" (id, title, description, price, brand, size, condition, material, color, pattern, images, "sellerId", "categoryId", "categoryPath", "likesCount", "uploadedAt", status, "isPromoted", "shippingFree") FROM stdin;
cmslbqjbr007v35ejdwqp6qsq	COS Linen Shift Dress - Striped Blue	COS Linen Shift Dress — Striped Blue. Brand new with original tags attached.	27	COS	6	new_with_tags	Cotton	Beige	\N	{https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=600&q=80}	cmslbqiur000135ejaddnc0e3	women-clothing-dresses	{Women,Clothing,Dresses}	13	2026-06-03 11:57:59.243	deactivated	f	f
cmslbqjbw007x35ejomskuy5w	Zara Satin Midi Dress - Beige Linen	Zara Satin Midi Dress — Beige Linen. In good condition with normal signs of wear.	127	Zara	10	good	Cotton	Beige	\N	{https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&q=80}	cmslbqiuu000235ejeuh39xiw	women-clothing-dresses	{Women,Clothing,Dresses}	19	2026-07-11 01:56:25.657	active	f	f
cmslbqjby007z35ejl9xwz406	Zara Mini A-Line Dress - Black	Zara Mini A-Line Dress — Black. Brand new without tags. Never worn or used.	147	Zara	4	new_without_tags	Viscose	Cream	\N	{https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80,https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=600&q=80}	cmslbqiux000335ej0cp54dss	women-clothing-dresses	{Women,Clothing,Dresses}	8	2026-06-01 22:42:10.22	active	t	t
cmslbqjc1008135ejgkhy6fe9	Free People Slip Dress - Striped Blue	Free People Slip Dress — Striped Blue. In excellent condition. Worn once or twice, like new.	142	Free People	16	very_good	Linen	Black	\N	{https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80,https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=80}	cmslbqiuz000435ej25bzx608	women-clothing-dresses	{Women,Clothing,Dresses}	9	2026-01-17 02:31:53.391	sold	f	f
cmslbqjc3008335ejsrwelmb2	& Other Stories Linen Shift Dress - Navy Floral	& Other Stories Linen Shift Dress — Navy Floral. Brand new without tags. Never worn or used.	63	& Other Stories	16	new_without_tags	Tencel	Beige	\N	{https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=600&q=80}	cmslbqiv1000535ej5nylp0ae	women-clothing-dresses	{Women,Clothing,Dresses}	32	2026-03-25 17:13:15.35	active	f	f
cmslbqjc6008535ejh7occ7j0	Reformation Shirt Dress - Navy Floral	Reformation Shirt Dress — Navy Floral. In excellent condition. Worn once or twice, like new.	40	Reformation	6	very_good	Tencel	Blue	\N	{https://images.unsplash.com/photo-1475178626620-a4d074967452?w=600&q=80}	cmslbqiv3000635ej8az5pm2t	women-clothing-dresses	{Women,Clothing,Dresses}	3	2026-03-13 01:33:36.609	reserved	t	t
cmslbqjc8008735ejm4vz5eee	Ganni Shirt Dress - Cream	Ganni Shirt Dress — Cream. Brand new without tags. Never worn or used.	77	Ganni	6	new_without_tags	Polyester	Beige	\N	{https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80,https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80}	cmslbqiv6000735ejyp92tcat	women-clothing-dresses	{Women,Clothing,Dresses}	112	2026-03-26 22:57:51.842	reserved	f	f
cmslbqjca008935ejsotvzpgj	COS Satin Midi Dress - Striped Blue	COS Satin Midi Dress — Striped Blue. Brand new without tags. Never worn or used.	35	COS	4	new_without_tags	Cotton	Cream	\N	{https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80,https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&q=80}	cmslbqiv9000835ejipaundju	women-clothing-dresses	{Women,Clothing,Dresses}	320	2026-07-09 10:31:42.734	active	f	t
cmslbqjcd008b35ejqrsadf7v	Zara Crop Top - Pink	Zara Crop Top — Pink. In excellent condition. Worn once or twice, like new.	69	Zara	XL	very_good	Cotton	Cream	\N	{https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&q=80}	cmslbqivb000935ej2kfvj06z	women-clothing-tops	{Women,Clothing,"Tops & T-Shirts"}	149	2026-03-13 08:42:38.632	active	f	f
cmslbqjcf008d35ej1wt45gzc	COS Crop Top - Navy	COS Crop Top — Navy. In excellent condition. Worn once or twice, like new.	72	COS	L	very_good	Silk	Navy	\N	{https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80}	cmslbqivd000a35ej43xc3023	women-clothing-tops	{Women,Clothing,"Tops & T-Shirts"}	86	2026-06-04 02:13:16.133	active	f	t
cmslbqjci008f35ej3a32ruei	Free People Puff Sleeve Top - Sage Green	Free People Puff Sleeve Top — Sage Green. Brand new without tags. Never worn or used.	18	Free People	XL	new_without_tags	Cashmere	Pink	\N	{https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600&q=80}	cmslbqive000b35ej4w4zr1se	women-clothing-tops	{Women,Clothing,"Tops & T-Shirts"}	62	2026-05-28 00:48:29.336	active	f	f
cmslbqjck008h35ej3eujqp8b	Mango Linen Blouse - Black	Mango Linen Blouse — Black. In excellent condition. Worn once or twice, like new.	26	Mango	XL	very_good	Cotton	Pink	\N	{https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&q=80}	cmslbqivg000c35ej61yhiozk	women-clothing-tops	{Women,Clothing,"Tops & T-Shirts"}	20	2026-06-06 18:33:17.525	sold	f	t
cmslbqjcn008j35ej9exud18n	Acne Studios Wrap Blouse - Navy	Acne Studios Wrap Blouse — Navy. Brand new without tags. Never worn or used.	58	Acne Studios	XL	new_without_tags	Modal	Navy	\N	{https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600&q=80}	cmslbqiur000135ejaddnc0e3	women-clothing-tops	{Women,Clothing,"Tops & T-Shirts"}	14	2026-07-17 06:57:49.467	active	f	t
cmslbqjcp008l35ejrekaz5uh	Acne Studios Ribbed Tank - White	Acne Studios Ribbed Tank — White. In excellent condition. Worn once or twice, like new.	83	Acne Studios	M	very_good	Modal	Cream	\N	{https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&q=80}	cmslbqiuu000235ejeuh39xiw	women-clothing-tops	{Women,Clothing,"Tops & T-Shirts"}	334	2026-03-24 11:28:13.563	active	f	f
cmslbqjcr008n35ejag4wbhm2	Free People Linen Blouse - Sage Green	Free People Linen Blouse — Sage Green. In good condition with normal signs of wear.	24	Free People	XL	good	Modal	Cream	\N	{https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=80}	cmslbqiux000335ej0cp54dss	women-clothing-tops	{Women,Clothing,"Tops & T-Shirts"}	1	2026-01-27 02:40:39.461	active	t	t
cmslbqjcv008p35ej1s6pl11g	Mango Wrap Blouse - Striped	Mango Wrap Blouse — Striped. In excellent condition. Worn once or twice, like new.	39	Mango	XL	very_good	Cotton	Navy	\N	{https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&q=80}	cmslbqiuz000435ej25bzx608	women-clothing-tops	{Women,Clothing,"Tops & T-Shirts"}	2	2026-04-24 12:59:54.221	active	f	t
cmslbqjcx008r35ejb067h0yd	Patagonia Denim Jacket - Black	Patagonia Denim Jacket — Black. In excellent condition. Worn once or twice, like new.	221	Patagonia	S	very_good	Nylon	Navy	\N	{https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80,https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&q=80}	cmslbqiv1000535ej5nylp0ae	women-clothing-jackets	{Women,Clothing,"Jackets & Coats"}	10	2026-03-21 05:21:16.437	active	f	t
cmslbqjcz008t35ejebzilwmp	Arket Leather Biker Jacket - Black	Arket Leather Biker Jacket — Black. In good condition with normal signs of wear.	95	Arket	XS	good	Nylon	Brown	\N	{https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&q=80,https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80}	cmslbqiv3000635ej8az5pm2t	women-clothing-jackets	{Women,Clothing,"Jackets & Coats"}	18	2026-05-16 05:49:49.191	active	f	f
cmslbqjd1008v35ej3b6y0smx	Mango Utility Jacket - Olive Green	Mango Utility Jacket — Olive Green. Brand new with original tags attached.	316	Mango	M	new_with_tags	Polyester	Beige	\N	{https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&q=80}	cmslbqiv6000735ejyp92tcat	women-clothing-jackets	{Women,Clothing,"Jackets & Coats"}	10	2026-06-01 11:45:03.525	deactivated	t	f
cmslbqjd3008x35ej6i6oovhf	The North Face Leather Biker Jacket - Black	The North Face Leather Biker Jacket — Black. Brand new without tags. Never worn or used.	126	The North Face	XL	new_without_tags	Leather	Grey	\N	{https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=80}	cmslbqiv9000835ejipaundju	women-clothing-jackets	{Women,Clothing,"Jackets & Coats"}	6	2026-04-29 04:31:56.55	active	f	t
cmslbqjd7008z35ej80q1ldb8	Stutterheim Blazer - Beige	Stutterheim Blazer — Beige. Brand new without tags. Never worn or used.	90	Stutterheim	XS	new_without_tags	Cotton	Black	\N	{https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&q=80}	cmslbqivb000935ej2kfvj06z	women-clothing-jackets	{Women,Clothing,"Jackets & Coats"}	76	2026-07-13 06:07:50.627	active	f	t
cmslbqjda009135ejlzh0f6m0	Zara Puffer Jacket - Olive Green	Zara Puffer Jacket — Olive Green. Brand new without tags. Never worn or used.	233	Zara	L	new_without_tags	Leather	Brown	\N	{https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&q=80}	cmslbqivd000a35ej43xc3023	women-clothing-jackets	{Women,Clothing,"Jackets & Coats"}	3	2026-06-03 20:48:11.835	active	f	f
cmslbqjdd009335ejwdzzdyqc	Arket Trench Coat - Beige	Arket Trench Coat — Beige. In excellent condition. Worn once or twice, like new.	296	Arket	M	very_good	Polyester	Brown	\N	{https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=600&q=80,https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80}	cmslbqive000b35ej4w4zr1se	women-clothing-jackets	{Women,Clothing,"Jackets & Coats"}	11	2026-06-27 07:09:31.674	active	f	t
cmslbqjdf009535ejcpop3f2d	Zara Leather Biker Jacket - Charcoal	Zara Leather Biker Jacket — Charcoal. In excellent condition. Worn once or twice, like new.	162	Zara	XXL	very_good	Leather	Navy	\N	{https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=600&q=80}	cmslbqivg000c35ej61yhiozk	women-clothing-jackets	{Women,Clothing,"Jackets & Coats"}	6	2026-02-09 01:17:18.084	active	f	t
cmslbqjdh009735ejfi2lmj7h	Converse Air Force 1 - Cream	Converse Air Force 1 — Cream. In excellent condition. Worn once or twice, like new.	71	Converse	10	very_good	Mesh	White	\N	{https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&q=80,https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80}	cmslbqiur000135ejaddnc0e3	women-shoes-sneakers	{Women,Shoes,Sneakers}	82	2026-01-21 22:36:13.909	sold	f	t
cmslbqjdj009935ejc2k0uhy1	Adidas 550 - Beige	Adidas 550 — Beige. In good condition with normal signs of wear.	100	Adidas	9	good	Mesh	White	\N	{https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&q=80}	cmslbqiuu000235ejeuh39xiw	women-shoes-sneakers	{Women,Shoes,Sneakers}	59	2026-05-17 18:22:30.843	active	f	t
cmslbqjdm009b35ejlls2wgq1	Nike Cloud - Beige	Nike Cloud — Beige. In good condition with normal signs of wear.	92	Nike	7.5	good	Canvas	Black	\N	{https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=80,https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=80}	cmslbqiux000335ej0cp54dss	women-shoes-sneakers	{Women,Shoes,Sneakers}	159	2026-04-12 08:44:28.255	active	f	f
cmslbqjdo009d35ejukw18ag2	Veja Esplar - White	Veja Esplar — White. In excellent condition. Worn once or twice, like new.	62	Veja	5.5	very_good	Leather	Cream	\N	{https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=600&q=80,https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&q=80}	cmslbqiuz000435ej25bzx608	women-shoes-sneakers	{Women,Shoes,Sneakers}	43	2026-03-13 07:32:43.87	active	f	t
cmslbqjdq009f35ejzqbfx8uy	Puma Old Skool - Cream	Puma Old Skool — Cream. In good condition with normal signs of wear.	59	Puma	7	good	Canvas	Navy	\N	{https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80,https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600&q=80}	cmslbqiv1000535ej5nylp0ae	women-shoes-sneakers	{Women,Shoes,Sneakers}	3	2026-02-28 03:59:57.429	active	f	f
cmslbqjds009h35ejx1w9tmd6	Veja Suede Classic - Cream	Veja Suede Classic — Cream. Brand new without tags. Never worn or used.	177	Veja	5.5	new_without_tags	Suede	Cream	\N	{https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80}	cmslbqiv3000635ej8az5pm2t	women-shoes-sneakers	{Women,Shoes,Sneakers}	94	2026-04-06 03:46:19.652	active	f	f
cmslbqjdu009j35ejlneoipps	Puma Stan Smith - Navy	Puma Stan Smith — Navy. In good condition with normal signs of wear.	35	Puma	6	good	Canvas	White	\N	{https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=80,https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=600&q=80}	cmslbqiv6000735ejyp92tcat	women-shoes-sneakers	{Women,Shoes,Sneakers}	150	2026-07-07 15:23:57.727	active	f	f
cmslbqjdw009l35ej055jddxp	Adidas 550 - Pink	Adidas 550 — Pink. Brand new with original tags attached.	61	Adidas	9.5	new_with_tags	Leather	Cream	\N	{https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=600&q=80}	cmslbqiv9000835ejipaundju	women-shoes-sneakers	{Women,Shoes,Sneakers}	18	2026-05-14 22:42:52.776	sold	t	f
cmslbqjdy009n35ejxy7fhn27	Fjallraven Belt Bag - Red	Fjallraven Belt Bag — Red. Brand new with original tags attached.	20	Fjallraven	Medium	new_with_tags	Leather	Black	\N	{https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=600&q=80}	cmslbqivb000935ej2kfvj06z	women-bags-crossbody	{Women,Bags,"Crossbody Bags"}	5	2026-02-05 21:39:52.825	active	f	t
cmslbqje2009p35ejny2t9o4t	Mango Camera Bag - Dusty Pink	Mango Camera Bag — Dusty Pink. In good condition with normal signs of wear.	46	Mango	One Size	good	Faux Leather	Cream	\N	{https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=600&q=80,https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80}	cmslbqivd000a35ej43xc3023	women-bags-crossbody	{Women,Bags,"Crossbody Bags"}	14	2026-04-10 04:02:21.914	active	t	t
cmslbqje4009r35ej9jcqfy5q	H&M Saddle Bag - Khaki	H&M Saddle Bag — Khaki. In excellent condition. Worn once or twice, like new.	48	H&M	Medium	very_good	Faux Leather	Red	\N	{https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=600&q=80}	cmslbqive000b35ej4w4zr1se	women-bags-crossbody	{Women,Bags,"Crossbody Bags"}	133	2026-03-28 16:35:02.371	active	f	t
cmslbqje7009t35ejx4m8mh8r	H&M Crossbody Bag - Navy	H&M Crossbody Bag — Navy. In excellent condition. Worn once or twice, like new.	35	H&M	Medium	very_good	Leather	Green	\N	{https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&q=80,https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=600&q=80}	cmslbqivg000c35ej61yhiozk	women-bags-crossbody	{Women,Bags,"Crossbody Bags"}	13	2026-07-23 19:32:13.137	active	f	f
cmslbqje9009v35ejp5re5dks	Zara Camera Bag - Dusty Pink	Zara Camera Bag — Dusty Pink. In excellent condition. Worn once or twice, like new.	47	Zara	Small	very_good	Nylon	Brown	\N	{https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&q=80}	cmslbqiur000135ejaddnc0e3	women-bags-crossbody	{Women,Bags,"Crossbody Bags"}	8	2026-07-26 13:30:48.88	active	f	f
cmslbqjeb009x35ejnd8mkrr7	Car Shoe Camera Bag - Red	Car Shoe Camera Bag — Red. In excellent condition. Worn once or twice, like new.	73	Car Shoe	Medium	very_good	Faux Leather	Black	\N	{https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=600&q=80}	cmslbqiuu000235ejeuh39xiw	women-bags-crossbody	{Women,Bags,"Crossbody Bags"}	13	2026-07-23 12:58:37.235	active	t	t
cmslbqjee009z35ej30mlv0o5	Mango Crossbody Bag - Red	Mango Crossbody Bag — Red. In excellent condition. Worn once or twice, like new.	52	Mango	One Size	very_good	Canvas	Pink	\N	{https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&q=80}	cmslbqiux000335ej0cp54dss	women-bags-crossbody	{Women,Bags,"Crossbody Bags"}	7	2026-04-16 23:48:42.96	active	t	f
cmslbqjei00a135ej4ehxj45x	Kipling Phone Bag - Navy	Kipling Phone Bag — Navy. Shows visible signs of wear but still plenty of life left.	50	Kipling	Small	satisfactory	Nylon	Green	\N	{https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80,https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&q=80}	cmslbqiuz000435ej25bzx608	women-bags-crossbody	{Women,Bags,"Crossbody Bags"}	15	2026-06-21 20:04:22.82	active	f	f
cmslbqjek00a335ej19ihy1vz	Polo Ralph Lauren Graphic Tee - Sage	Polo Ralph Lauren Graphic Tee — Sage. Brand new without tags. Never worn or used.	45	Polo Ralph Lauren	L	new_without_tags	Cotton	Navy	\N	{https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80,https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&q=80}	cmslbqiv1000535ej5nylp0ae	men-clothing-tshirts	{Men,Clothing,T-Shirts}	17	2026-07-02 18:42:08.876	active	f	f
cmslbqjem00a535ejk52e7psf	Adidas Graphic Tee - Burgundy	Adidas Graphic Tee — Burgundy. Brand new without tags. Never worn or used.	25	Adidas	XS	new_without_tags	Organic Cotton	White	\N	{https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80}	cmslbqiv3000635ej8az5pm2t	men-clothing-tshirts	{Men,Clothing,T-Shirts}	6	2026-01-15 17:25:31.377	active	t	f
cmslbqjeo00a735ej4mvem8wk	Polo Ralph Lauren Long Sleeve Tee - Burgundy	Polo Ralph Lauren Long Sleeve Tee — Burgundy. In good condition with normal signs of wear.	70	Polo Ralph Lauren	L	good	Cotton	White	\N	{https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&q=80,https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&q=80}	cmslbqiv6000735ejyp92tcat	men-clothing-tshirts	{Men,Clothing,T-Shirts}	5	2026-02-10 20:34:42.171	active	f	t
cmslbqjeq00a935ejwq3wzvtd	Supreme Supima Cotton T-Shirt - Grey	Supreme Supima Cotton T-Shirt — Grey. In good condition with normal signs of wear.	24	Supreme	XXL	good	Cotton	Black	\N	{https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=600&q=80,https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80}	cmslbqiv9000835ejipaundju	men-clothing-tshirts	{Men,Clothing,T-Shirts}	8	2026-05-15 19:14:01.069	active	t	t
cmslbqjes00ab35ejblbal3z3	Carhartt Heavyweight Tee - Sage	Carhartt Heavyweight Tee — Sage. In excellent condition. Worn once or twice, like new.	74	Carhartt	S	very_good	Jersey	White	\N	{https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&q=80,https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&q=80}	cmslbqivb000935ej2kfvj06z	men-clothing-tshirts	{Men,Clothing,T-Shirts}	114	2026-06-12 15:42:07.235	deactivated	f	f
cmslbqjex00ad35ej5fukfkuq	Adidas Polo Shirt - White	Adidas Polo Shirt — White. Brand new with original tags attached.	8	Adidas	S	new_with_tags	Organic Cotton	Black	\N	{https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80,https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600&q=80}	cmslbqivd000a35ej43xc3023	men-clothing-tshirts	{Men,Clothing,T-Shirts}	449	2026-04-08 12:25:49.645	sold	f	f
cmslbqjez00af35ejguvt2pdv	Nike Heavyweight Tee - Black	Nike Heavyweight Tee — Black. In excellent condition. Worn once or twice, like new.	69	Nike	XS	very_good	Pima Cotton	Green	\N	{https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&q=80,https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&q=80}	cmslbqive000b35ej4w4zr1se	men-clothing-tshirts	{Men,Clothing,T-Shirts}	12	2026-01-22 12:45:45.984	active	f	t
cmslbqjf200ah35ejb3u6royn	H&M Polo Shirt - Grey	H&M Polo Shirt — Grey. Brand new without tags. Never worn or used.	63	H&M	XS	new_without_tags	Cotton	Navy	\N	{https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80,https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&q=80}	cmslbqivg000c35ej61yhiozk	men-clothing-tshirts	{Men,Clothing,T-Shirts}	9	2026-05-12 17:02:32.761	active	f	t
cmslbqjf400aj35ejk6mzi1b1	Patagonia Full Zip Hoodie - Olive	Patagonia Full Zip Hoodie — Olive. Brand new with original tags attached.	42	Patagonia	S	new_with_tags	Cotton	Green	\N	{https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80,https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=80}	cmslbqiur000135ejaddnc0e3	men-clothing-hoodies	{Men,Clothing,"Hoodies & Sweatshirts"}	2	2026-02-01 21:37:37.625	deactivated	f	f
cmslbqjf600al35ej19ih7g7s	Patagonia Full Zip Hoodie - Cream	Patagonia Full Zip Hoodie — Cream. In excellent condition. Worn once or twice, like new.	34	Patagonia	M	very_good	Cotton	Burgundy	\N	{https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80,https://images.unsplash.com/photo-1475178626620-a4d074967452?w=600&q=80}	cmslbqiuu000235ejeuh39xiw	men-clothing-hoodies	{Men,Clothing,"Hoodies & Sweatshirts"}	20	2026-07-25 06:20:02.855	sold	f	f
cmslbqjf800an35ejaelyfan7	Uniqlo Full Zip Hoodie - Burgundy	Uniqlo Full Zip Hoodie — Burgundy. Brand new without tags. Never worn or used.	130	Uniqlo	L	new_without_tags	Cotton	Black	\N	{https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=600&q=80}	cmslbqiux000335ej0cp54dss	men-clothing-hoodies	{Men,Clothing,"Hoodies & Sweatshirts"}	17	2026-05-19 04:57:16.378	active	f	f
cmslbqjfa00ap35ejaq5naeph	Nike Retro Hoodie - Black	Nike Retro Hoodie — Black. In excellent condition. Worn once or twice, like new.	97	Nike	XL	very_good	Polyester Blend	Green	\N	{https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=600&q=80,https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80}	cmslbqiuz000435ej25bzx608	men-clothing-hoodies	{Men,Clothing,"Hoodies & Sweatshirts"}	13	2026-06-17 11:51:30.466	active	f	t
cmslbqjfd00ar35ejvdtvtgqe	Patagonia Retro Hoodie - Burgundy	Patagonia Retro Hoodie — Burgundy. Brand new without tags. Never worn or used.	37	Patagonia	XXL	new_without_tags	French Terry	Burgundy	\N	{https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&q=80}	cmslbqiv1000535ej5nylp0ae	men-clothing-hoodies	{Men,Clothing,"Hoodies & Sweatshirts"}	414	2026-04-16 23:40:27.067	active	f	t
cmslbqjff00at35ej1c55jclf	Supreme Full Zip Hoodie - Grey	Supreme Full Zip Hoodie — Grey. In excellent condition. Worn once or twice, like new.	94	Supreme	L	very_good	French Terry	Green	\N	{https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80,https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&q=80}	cmslbqiv3000635ej8az5pm2t	men-clothing-hoodies	{Men,Clothing,"Hoodies & Sweatshirts"}	0	2026-03-20 12:26:16.536	active	f	f
cmslbqjfh00av35ejwtlm76hd	Carhartt Crewneck Sweatshirt - Grey	Carhartt Crewneck Sweatshirt — Grey. In excellent condition. Worn once or twice, like new.	60	Carhartt	M	very_good	Fleece	Cream	\N	{https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&q=80,https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&q=80}	cmslbqiv6000735ejyp92tcat	men-clothing-hoodies	{Men,Clothing,"Hoodies & Sweatshirts"}	15	2026-04-16 16:40:52.149	active	f	f
cmslbqjfj00ax35ejl2cxldob	Nike Crewneck Sweatshirt - Navy	Nike Crewneck Sweatshirt — Navy. Shows visible signs of wear but still plenty of life left.	46	Nike	XL	satisfactory	Fleece	Burgundy	\N	{https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80,https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=600&q=80}	cmslbqiv9000835ejipaundju	men-clothing-hoodies	{Men,Clothing,"Hoodies & Sweatshirts"}	149	2026-06-02 12:38:21.256	active	f	t
cmslbqjfl00az35ej3fcbxcws	Nike Chuck Taylor - Beige	Nike Chuck Taylor — Beige. Brand new without tags. Never worn or used.	104	Nike	10	new_without_tags	Canvas	Black	\N	{https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&q=80}	cmslbqivb000935ej2kfvj06z	men-shoes-sneakers	{Men,Shoes,Sneakers}	16	2026-05-31 01:49:26.515	active	f	t
cmslbqjfp00b135ejh0ycj285	Adidas 550 - All Black	Adidas 550 — All Black. In excellent condition. Worn once or twice, like new.	40	Adidas	8.5	very_good	Canvas	Black	\N	{https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&q=80,https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&q=80}	cmslbqivd000a35ej43xc3023	men-shoes-sneakers	{Men,Shoes,Sneakers}	81	2026-03-15 13:25:16.498	reserved	f	f
cmslbqjfs00b335eje1c4z0si	Hoka Air Max 90 - Beige	Hoka Air Max 90 — Beige. In good condition with normal signs of wear.	185	Hoka	8.5	good	Leather	Grey	\N	{https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80,https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=600&q=80}	cmslbqive000b35ej4w4zr1se	men-shoes-sneakers	{Men,Shoes,Sneakers}	19	2026-02-20 13:23:57.814	reserved	f	t
cmslbqjfu00b535ejtbj4bmuz	Hoka 550 - Black/White	Hoka 550 — Black/White. Shows visible signs of wear but still plenty of life left.	162	Hoka	10.5	satisfactory	Leather	Green	\N	{https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80}	cmslbqivg000c35ej61yhiozk	men-shoes-sneakers	{Men,Shoes,Sneakers}	20	2026-04-26 07:07:43.195	active	f	t
cmslbqjfw00b735ejkrh4o8f1	Hoka Air Max 90 - Cream	Hoka Air Max 90 — Cream. In good condition with normal signs of wear.	200	Hoka	7	good	Leather	Black	\N	{https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=600&q=80}	cmslbqiur000135ejaddnc0e3	men-shoes-sneakers	{Men,Shoes,Sneakers}	1	2026-06-09 22:44:03.072	active	f	f
cmslbqjfy00b935ejswq1soe1	New Balance Speedgoat 5 - Grey/Green	New Balance Speedgoat 5 — Grey/Green. Brand new without tags. Never worn or used.	82	New Balance	11	new_without_tags	Suede	Navy	\N	{https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600&q=80}	cmslbqiuu000235ejeuh39xiw	men-shoes-sneakers	{Men,Shoes,Sneakers}	4	2026-05-22 07:09:04.909	active	f	f
cmslbqjg000bb35ej4jobly92	ASICS Air Max 90 - All Black	ASICS Air Max 90 — All Black. In good condition with normal signs of wear.	35	ASICS	11.5	good	Canvas	Black	\N	{https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&q=80}	cmslbqiux000335ej0cp54dss	men-shoes-sneakers	{Men,Shoes,Sneakers}	5	2026-05-02 12:08:28.084	active	f	t
cmslbqjg200bd35ej2r7u2c78	Hoka Cloudmonster - Navy	Hoka Cloudmonster — Navy. Brand new with original tags attached.	157	Hoka	8.5	new_with_tags	Canvas	Cream	\N	{https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80}	cmslbqiuz000435ej25bzx608	men-shoes-sneakers	{Men,Shoes,Sneakers}	4	2026-04-09 23:48:30.443	active	f	t
cmslbqjg400bf35ejlf5ogmp0	Casio Khaki Field - Blue Dial	Casio Khaki Field — Blue Dial. Brand new without tags. Never worn or used.	5248	Casio	36mm	new_without_tags	Ceramic	Green	\N	{https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=600&q=80}	cmslbqiv1000535ej5nylp0ae	men-acc-watches	{Men}	11	2026-07-12 09:16:31.195	sold	t	f
cmslbqjg600bh35ejzc1ou8xo	Hamilton Khaki Field - Blue Dial	Hamilton Khaki Field — Blue Dial. Brand new with original tags attached.	2839	Hamilton	44mm	new_with_tags	Ceramic	Black	\N	{https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&q=80,https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=600&q=80}	cmslbqiv3000635ej8az5pm2t	men-acc-watches	{Men}	2	2026-02-15 13:15:29.77	active	f	t
cmslbqjg900bj35eji1m0jegd	Seiko SKX007 Diver - Silver Dial	Seiko SKX007 Diver — Silver Dial. In good condition with normal signs of wear.	2184	Seiko	38mm	good	Titanium	Blue	\N	{https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&q=80,https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&q=80}	cmslbqiv6000735ejyp92tcat	men-acc-watches	{Men}	159	2026-04-15 17:18:19.513	active	f	t
cmslbqjgc00bl35ej0796hq7r	Tissot G-Shock DW5600 - Stainless Steel	Tissot G-Shock DW5600 — Stainless Steel. Brand new with original tags attached.	8092	Tissot	36mm	new_with_tags	Ceramic	Silver	\N	{https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=600&q=80}	cmslbqiv9000835ejipaundju	men-acc-watches	{Men}	78	2026-03-30 08:41:37.137	active	f	f
cmslbqjge00bn35ej8kjh4vhg	Seiko Speedmaster Professional - NATO Strap	Seiko Speedmaster Professional — NATO Strap. Brand new without tags. Never worn or used.	744	Seiko	36mm	new_without_tags	Stainless Steel	Silver	\N	{https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&q=80}	cmslbqivb000935ej2kfvj06z	men-acc-watches	{Men}	13	2026-01-31 10:03:43.149	active	f	t
cmslbqjgh00bp35ejdoo965fj	Hamilton Weekender - Green Dial	Hamilton Weekender — Green Dial. Shows visible signs of wear but still plenty of life left.	174	Hamilton	38mm	satisfactory	Ceramic	Grey	\N	{https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&q=80}	cmslbqivd000a35ej43xc3023	men-acc-watches	{Men}	9	2026-07-12 19:32:44.971	active	f	f
cmslbqjgl00br35eji9pywn3e	Omega Khaki Field - Black Dial	Omega Khaki Field — Black Dial. Brand new without tags. Never worn or used.	1527	Omega	38mm	new_without_tags	Titanium	Silver	\N	{https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&q=80}	cmslbqive000b35ej4w4zr1se	men-acc-watches	{Men}	14	2026-04-23 17:17:55.76	active	f	f
cmslbqjgn00bt35ejs09x3587	Omega G-Shock DW5600 - Blue Dial	Omega G-Shock DW5600 — Blue Dial. Shows visible signs of wear but still plenty of life left.	3905	Omega	36mm	satisfactory	Stainless Steel	Green	\N	{https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=600&q=80,https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80}	cmslbqivg000c35ej61yhiozk	men-acc-watches	{Men}	8	2026-04-07 00:03:37.32	active	f	f
cmslbqjgp00bv35ej9wa4pn7d	Gucci GG Marmont Bag - Beige	Gucci GG Marmont Bag — Beige. In good condition with normal signs of wear.	3224	Gucci	GM	good	Saffiano Leather	Brown	\N	{https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&q=80,https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&q=80}	cmslbqiur000135ejaddnc0e3	designer-bags	{Designer,"Designer Bags"}	93	2026-04-12 18:32:10.449	active	f	t
cmslbqjgr00bx35ejzp6qklcx	Prada Galleria Bag - Beige	Prada Galleria Bag — Beige. In good condition with normal signs of wear.	1860	Prada	Large	good	Leather	Beige	\N	{https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=600&q=80}	cmslbqiuu000235ejeuh39xiw	designer-bags	{Designer,"Designer Bags"}	19	2026-03-21 13:46:21.065	active	f	f
cmslbqjgt00bz35ejmwjs15ax	Louis Vuitton Classic Flap Bag - Black	Louis Vuitton Classic Flap Bag — Black. Brand new with original tags attached.	2731	Louis Vuitton	Small	new_with_tags	Lambskin	Beige	\N	{https://images.unsplash.com/photo-1521369909029-2afed882baee?w=600&q=80,https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&q=80}	cmslbqiux000335ej0cp54dss	designer-bags	{Designer,"Designer Bags"}	3	2026-04-06 09:30:23.596	active	f	t
cmslbqjgv00c135ejosa5c7m5	Bottega Veneta Galleria Bag - Monogram	Bottega Veneta Galleria Bag — Monogram. In excellent condition. Worn once or twice, like new.	1641	Bottega Veneta	GM	very_good	Canvas	Black	\N	{https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&q=80,https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=600&q=80}	cmslbqiuz000435ej25bzx608	designer-bags	{Designer,"Designer Bags"}	60	2026-03-26 10:31:35.243	active	t	f
cmslbqjgy00c335ejk9x0yxp5	Louis Vuitton GG Marmont Bag - Brown	Louis Vuitton GG Marmont Bag — Brown. In good condition with normal signs of wear.	2162	Louis Vuitton	GM	good	Canvas	Black	\N	{https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=600&q=80,https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&q=80}	cmslbqiv1000535ej5nylp0ae	designer-bags	{Designer,"Designer Bags"}	17	2026-06-03 08:09:30.543	deactivated	f	f
cmslbqjh100c535ejwm9rhve7	Gucci Lady Dior - Camel	Gucci Lady Dior — Camel. Brand new with original tags attached.	4018	Gucci	Large	new_with_tags	Lambskin	Black	\N	{https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&q=80,https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80}	cmslbqiv3000635ej8az5pm2t	designer-bags	{Designer,"Designer Bags"}	305	2026-04-19 21:57:04.884	active	f	t
cmslbqjh300c735ejy9ob8lgn	Dior Sac de Jour - Brown	Dior Sac de Jour — Brown. In excellent condition. Worn once or twice, like new.	1872	Dior	Small	very_good	Lambskin	Beige	\N	{https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=600&q=80,https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80}	cmslbqiv6000735ejyp92tcat	designer-bags	{Designer,"Designer Bags"}	13	2026-04-20 00:04:56.028	active	f	t
cmslbqjh700c935ej1h8a4vun	Saint Laurent Neverfull MM - Beige	Saint Laurent Neverfull MM — Beige. Shows visible signs of wear but still plenty of life left.	2881	Saint Laurent	Small	satisfactory	Canvas	Black	\N	{https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&q=80,https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&q=80}	cmslbqiv9000835ejipaundju	designer-bags	{Designer,"Designer Bags"}	2	2026-04-23 03:44:39.148	active	f	t
cmslbqjh900cb35eje3zbfar0	Anthropologie Plant Pot - Pink	Anthropologie Plant Pot — Pink. Brand new with original tags attached.	7	Anthropologie	Set of 3	new_with_tags	Wood	Green	\N	{https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80,https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&q=80}	cmslbqivb000935ej2kfvj06z	home-decor	{Home,"Home Decor"}	1	2026-04-07 14:20:12.386	sold	f	f
cmslbqjhb00cd35ejqrrwgn6b	Cult Furniture Photo Frame - Pink	Cult Furniture Photo Frame — Pink. Brand new without tags. Never worn or used.	38	Cult Furniture	Small	new_without_tags	Wood	Cream	\N	{https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=600&q=80}	cmslbqivd000a35ej43xc3023	home-decor	{Home,"Home Decor"}	8	2026-06-17 00:51:21.811	active	f	t
cmslbqjhg00cf35ejvzyvzznn	Oliver Bonas Scented Candle - Sage	Oliver Bonas Scented Candle — Sage. In excellent condition. Worn once or twice, like new.	34	Oliver Bonas	Large	very_good	Wax	White	\N	{https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&q=80}	cmslbqive000b35ej4w4zr1se	home-decor	{Home,"Home Decor"}	446	2026-01-28 01:43:48.463	active	f	t
cmslbqjhj00ch35ejy1vkiq8c	MUJI Scented Candle - Terracotta	MUJI Scented Candle — Terracotta. Brand new without tags. Never worn or used.	52	MUJI	Large	new_without_tags	Wax	Pink	\N	{https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=80,https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=80}	cmslbqivg000c35ej61yhiozk	home-decor	{Home,"Home Decor"}	20	2026-03-26 12:34:28.796	reserved	f	t
cmslbqjhm00cj35ej0zopjlb7	MUJI Table Runner - Gold	MUJI Table Runner — Gold. Brand new without tags. Never worn or used.	36	MUJI	Large	new_without_tags	Ceramic	Navy	\N	{https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80,https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&q=80}	cmslbqiur000135ejaddnc0e3	home-decor	{Home,"Home Decor"}	36	2026-06-04 22:59:45.616	reserved	f	t
cmslbqjho00cl35ejwjpbvngq	IKEA Plant Pot - Pink	IKEA Plant Pot — Pink. In excellent condition. Worn once or twice, like new.	25	IKEA	Large	very_good	Ceramic	Green	\N	{https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&q=80}	cmslbqiuu000235ejeuh39xiw	home-decor	{Home,"Home Decor"}	5	2026-06-23 08:19:22.916	active	t	t
cmslbqjhs00cn35ejl04dhq52	MUJI Plant Pot - Cream	MUJI Plant Pot — Cream. Brand new without tags. Never worn or used.	36	MUJI	Small	new_without_tags	Ceramic	White	\N	{https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=80}	cmslbqiux000335ej0cp54dss	home-decor	{Home,"Home Decor"}	9	2026-05-28 03:06:04.458	active	f	f
cmslbqjhu00cp35ej19a2hyjj	IKEA Table Runner - White	IKEA Table Runner — White. In excellent condition. Worn once or twice, like new.	38	IKEA	Medium	very_good	Wood	Orange	\N	{https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&q=80}	cmslbqiuz000435ej25bzx608	home-decor	{Home,"Home Decor"}	12	2026-06-23 17:10:54.037	active	f	t
cmslbqjhy00cr35ej4ifm90ak	Sony AirPods Pro 2 - Anthracite	Sony AirPods Pro 2 — Anthracite. Shows visible signs of wear but still plenty of life left.	215	Sony	Standard	satisfactory	\N	\N	\N	{https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&q=80}	cmslbqiv1000535ej5nylp0ae	electronics-audio	{Electronics,Audio}	1	2026-04-09 15:13:34.762	active	t	f
cmslbqji000ct35ej9px2s7cl	Sennheiser AirPods Pro 2 - Brown	Sennheiser AirPods Pro 2 — Brown. In excellent condition. Worn once or twice, like new.	328	Sennheiser	One Size	very_good	\N	\N	\N	{https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80,https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&q=80}	cmslbqiv3000635ej8az5pm2t	electronics-audio	{Electronics,Audio}	146	2026-06-11 20:09:07.161	active	f	f
cmslbqji200cv35ejwjvazv4c	Sonos Momentum 4 - Black	Sonos Momentum 4 — Black. Brand new without tags. Never worn or used.	362	Sonos	One Size	new_without_tags	\N	\N	\N	{https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80}	cmslbqiv6000735ejyp92tcat	electronics-audio	{Electronics,Audio}	15	2026-05-31 20:38:19.486	active	f	f
cmslbqji500cx35ej9f4akyp7	Sennheiser Era 100 - Midnight	Sennheiser Era 100 — Midnight. Brand new without tags. Never worn or used.	175	Sennheiser	One Size	new_without_tags	\N	\N	\N	{https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80,https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=80}	cmslbqiv9000835ejipaundju	electronics-audio	{Electronics,Audio}	16	2026-06-02 16:54:52.469	sold	f	t
cmslbqji800cz35ejm522llr2	Apple AirPods 4 - White	Apple AirPods 4 — White. Brand new with original tags attached.	67	Apple	Standard	new_with_tags	\N	\N	\N	{https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=600&q=80,https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80}	cmslbqivb000935ej2kfvj06z	electronics-audio	{Electronics,Audio}	13	2026-07-03 14:48:49.24	active	f	t
cmslbqjif00d135ejd7tel88g	Sennheiser QC45 - Silver	Sennheiser QC45 — Silver. Shows visible signs of wear but still plenty of life left.	160	Sennheiser	One Size	satisfactory	\N	\N	\N	{https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&q=80}	cmslbqivd000a35ej43xc3023	electronics-audio	{Electronics,Audio}	6	2026-04-17 19:21:34.266	active	f	t
cmslbqjil00d335ejqt63pcvp	Apple Era 100 - White	Apple Era 100 — White. Brand new without tags. Never worn or used.	239	Apple	One Size	new_without_tags	\N	\N	\N	{https://images.unsplash.com/photo-1611078489935-0cb964de46d6?w=600&q=80}	cmslbqive000b35ej4w4zr1se	electronics-audio	{Electronics,Audio}	16	2026-03-08 12:36:35.936	active	f	t
cmslbqjip00d535ejri14j5qt	Sonos Beosound A1 Gen 2 - Black	Sonos Beosound A1 Gen 2 — Black. In excellent condition. Worn once or twice, like new.	317	Sonos	One Size	very_good	\N	\N	\N	{https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&q=80}	cmslbqivg000c35ej61yhiozk	electronics-audio	{Electronics,Audio}	4	2026-06-26 09:25:08.384	active	f	t
cmslbqjiu00d735ejseax1dc1	Xiaomi Xperia 1 V - Black 128GB	Xiaomi Xperia 1 V — Black 128GB. In excellent condition. Worn once or twice, like new.	516	Xiaomi	1TB	very_good	\N	\N	\N	{https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80}	cmslbqiur000135ejaddnc0e3	electronics-phones	{Electronics,Phones}	366	2026-06-23 08:05:07.908	active	f	f
cmslbqjiw00d935ej12td1l88	Samsung OnePlus 12 - Black 128GB	Samsung OnePlus 12 — Black 128GB. Brand new without tags. Never worn or used.	740	Samsung	128GB	new_without_tags	\N	\N	\N	{https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80}	cmslbqiuu000235ejeuh39xiw	electronics-phones	{Electronics,Phones}	89	2026-03-20 20:06:10.806	active	f	t
cmslbqjiy00db35ej3zrq154p	Apple Xiaomi 14 Pro - Black 128GB	Apple Xiaomi 14 Pro — Black 128GB. Brand new without tags. Never worn or used.	1032	Apple	256GB	new_without_tags	\N	\N	\N	{https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80,https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80}	cmslbqiux000335ej0cp54dss	electronics-phones	{Electronics,Phones}	76	2026-01-20 21:57:33.059	sold	t	t
cmslbqjj000dd35ejsya98eex	Nothing Xperia 1 V - Sapphire 128GB	Nothing Xperia 1 V — Sapphire 128GB. In excellent condition. Worn once or twice, like new.	689	Nothing	1TB	very_good	\N	\N	\N	{https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&q=80,https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=600&q=80}	cmslbqiuz000435ej25bzx608	electronics-phones	{Electronics,Phones}	15	2026-03-10 02:53:24.25	reserved	t	t
cmslbqjj300df35ejpviffssh	Sony Xperia 1 V - White 256GB	Sony Xperia 1 V — White 256GB. Brand new without tags. Never worn or used.	220	Sony	512GB	new_without_tags	\N	\N	\N	{https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80}	cmslbqiv1000535ej5nylp0ae	electronics-phones	{Electronics,Phones}	8	2026-02-19 16:55:51.006	active	f	t
cmslbqjj600dh35ej5hkqu2jh	Samsung OnePlus 12 - Navy 256GB	Samsung OnePlus 12 — Navy 256GB. Shows visible signs of wear but still plenty of life left.	373	Samsung	128GB	satisfactory	\N	\N	\N	{https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80,https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&q=80}	cmslbqiv3000635ej8az5pm2t	electronics-phones	{Electronics,Phones}	8	2026-01-25 03:07:01.501	active	f	t
cmslbqjj800dj35ejzhrshms5	Apple Galaxy S24 Ultra - Navy 256GB	Apple Galaxy S24 Ultra — Navy 256GB. In good condition with normal signs of wear.	667	Apple	128GB	good	\N	\N	\N	{https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80,https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80}	cmslbqiv6000735ejyp92tcat	electronics-phones	{Electronics,Phones}	0	2026-05-15 14:41:59.435	active	f	f
cmslbqjja00dl35ej8h34512n	OnePlus Pixel 8 Pro - Black 128GB	OnePlus Pixel 8 Pro — Black 128GB. In good condition with normal signs of wear.	678	OnePlus	256GB	good	\N	\N	\N	{https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80}	cmslbqiv9000835ejipaundju	electronics-phones	{Electronics,Phones}	18	2026-04-01 18:29:57.874	active	f	t
cmslbqjjc00dn35ej6xe1gg5v	Valve Pro Controller - Standard	Valve Pro Controller — Standard. In good condition with normal signs of wear.	350	Valve	1TB	good	\N	\N	\N	{https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80}	cmslbqivb000935ej2kfvj06z	electronics-gaming	{Electronics,Gaming}	17	2026-03-10 13:54:40.043	active	f	t
cmslbqjje00dp35ej3g2ew21r	Logitech Pro Controller - Standard	Logitech Pro Controller — Standard. In good condition with normal signs of wear.	164	Logitech	256GB	good	\N	\N	\N	{https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80,https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&q=80}	cmslbqivd000a35ej43xc3023	electronics-gaming	{Electronics,Gaming}	15	2026-04-11 02:53:12.78	active	f	t
cmslbqjjg00dr35ejeuufpddb	Microsoft G Pro X Headset - Limited Edition	Microsoft G Pro X Headset — Limited Edition. Brand new without tags. Never worn or used.	79	Microsoft	1TB	new_without_tags	\N	\N	\N	{https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80}	cmslbqive000b35ej4w4zr1se	electronics-gaming	{Electronics,Gaming}	56	2026-06-10 13:14:13.351	active	t	f
cmslbqjjj00dt35ej9l7zv7mk	Sony Apex 3 Keyboard - White	Sony Apex 3 Keyboard — White. In good condition with normal signs of wear.	55	Sony	256GB	good	\N	\N	\N	{https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=600&q=80}	cmslbqivg000c35ej61yhiozk	electronics-gaming	{Electronics,Gaming}	276	2026-07-16 02:39:13.145	active	f	f
cmslbqjjl00dv35ej50ikbu4c	SteelSeries Pro Controller - Black	SteelSeries Pro Controller — Black. In good condition with normal signs of wear.	152	SteelSeries	1TB	good	\N	\N	\N	{https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=600&q=80}	cmslbqiur000135ejaddnc0e3	electronics-gaming	{Electronics,Gaming}	0	2026-07-04 06:56:53.239	active	t	f
cmslbqjjn00dx35ejuszhnuvt	Sony Apex 3 Keyboard - Neon Blue/Red	Sony Apex 3 Keyboard — Neon Blue/Red. In good condition with normal signs of wear.	250	Sony	512GB	good	\N	\N	\N	{https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=80}	cmslbqiuu000235ejeuh39xiw	electronics-gaming	{Electronics,Gaming}	105	2026-05-24 23:24:29.614	active	f	f
cmslbqjjp00dz35ej46ftfs6b	SteelSeries Xbox Series X - Limited Edition	SteelSeries Xbox Series X — Limited Edition. In good condition with normal signs of wear.	180	SteelSeries	64GB	good	\N	\N	\N	{https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&q=80,https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&q=80}	cmslbqiux000335ej0cp54dss	electronics-gaming	{Electronics,Gaming}	10	2026-05-27 18:50:17.041	active	f	t
cmslbqjjs00e135ej3pbyabxm	Sony PS5 Slim - Black	Sony PS5 Slim — Black. In good condition with normal signs of wear.	195	Sony	64GB	good	\N	\N	\N	{https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=80}	cmslbqiuz000435ej25bzx608	electronics-gaming	{Electronics,Gaming}	5	2026-02-12 02:25:16.334	active	f	t
cmslbqjjv00e335ejfrdabbs4	Helly Hansen Fleece Jacket - Blue	Helly Hansen Fleece Jacket — Blue. Brand new without tags. Never worn or used.	143	Helly Hansen	M	new_without_tags	Gore-Tex	Blue	\N	{https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=600&q=80}	cmslbqiv1000535ej5nylp0ae	sports-outdoor	{Sports,"Outdoor Gear"}	0	2026-03-02 17:27:11.054	deactivated	f	f
cmslbqjjx00e535ej9v18l8fh	Helly Hansen Hiking Backpack - Red	Helly Hansen Hiking Backpack — Red. In excellent condition. Worn once or twice, like new.	204	Helly Hansen	XXL	very_good	Nylon	Red	\N	{https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80}	cmslbqiv3000635ej8az5pm2t	sports-outdoor	{Sports,"Outdoor Gear"}	52	2026-04-15 10:50:47.559	sold	f	t
cmslbqjk000e735ejnld3r2s0	The North Face Headlamp - Navy	The North Face Headlamp — Navy. In good condition with normal signs of wear.	259	The North Face	L	good	Down	Green	\N	{https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&q=80,https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80}	cmslbqiv6000735ejyp92tcat	sports-outdoor	{Sports,"Outdoor Gear"}	7	2026-04-03 05:36:20.187	sold	f	f
cmslbqjk300e935ej91hfmnr3	Salomon Insulated Vest - Black	Salomon Insulated Vest — Black. Brand new without tags. Never worn or used.	178	Salomon	L	new_without_tags	Aluminum	Green	\N	{https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&q=80}	cmslbqiv9000835ejipaundju	sports-outdoor	{Sports,"Outdoor Gear"}	16	2026-04-16 07:40:02.102	active	f	f
cmslbqjk500eb35ej2uam70ht	Black Diamond Trekking Poles - Navy	Black Diamond Trekking Poles — Navy. Shows visible signs of wear but still plenty of life left.	148	Black Diamond	XL	satisfactory	Gore-Tex	Blue	\N	{https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600&q=80}	cmslbqivb000935ej2kfvj06z	sports-outdoor	{Sports,"Outdoor Gear"}	9	2026-06-19 16:16:45.56	reserved	t	t
cmslbqjk700ed35ej1hnzv9j2	Columbia Camping Stove - Grey	Columbia Camping Stove — Grey. Brand new without tags. Never worn or used.	62	Columbia	S	new_without_tags	Nylon	Blue	\N	{https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80,https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&q=80}	cmslbqivd000a35ej43xc3023	sports-outdoor	{Sports,"Outdoor Gear"}	10	2026-03-08 04:34:33.923	reserved	f	f
cmslbqjk800ef35ejyq49fjlc	Mountain Hardwear Fleece Jacket - Red	Mountain Hardwear Fleece Jacket — Red. Brand new with original tags attached.	70	Mountain Hardwear	M	new_with_tags	Nylon	Orange	\N	{https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80}	cmslbqive000b35ej4w4zr1se	sports-outdoor	{Sports,"Outdoor Gear"}	1	2026-02-19 05:37:31.368	reserved	f	t
cmslbqjka00eh35ej3slawkx9	Columbia Insulated Vest - Green	Columbia Insulated Vest — Green. Brand new with original tags attached.	130	Columbia	One Size	new_with_tags	Down	Black	\N	{https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=600&q=80}	cmslbqivg000c35ej61yhiozk	sports-outdoor	{Sports,"Outdoor Gear"}	11	2026-07-16 18:24:37.853	active	f	t
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Message" (id, "conversationId", "senderId", text, "createdAt", read) FROM stdin;
\.


--
-- Data for Name: Offer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Offer" (id, "listingId", "buyerId", "sellerId", amount, status, message, "createdAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Order" (id, "listingId", "buyerId", "sellerId", price, "shippingCost", total, status, "shippingAddress", "createdAt", "updatedAt", quantity, "shippedAt") FROM stdin;
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Payment" (id, "orderId", "stripePaymentIntentId", amount, currency, "platformFeeAmount", "platformFeePercent", "sellerPayoutAmount", "stripeTransferId", "capturedAt", "releasedAt", "createdAt", "updatedAt", status) FROM stdin;
\.


--
-- Data for Name: PlatformSetting; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PlatformSetting" (key, value, "updatedAt") FROM stdin;
platform_fee_percent	8	2026-08-03 04:39:36.912
\.


--
-- Data for Name: ProductQuestion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProductQuestion" (id, "listingId", "authorId", text, "createdAt") FROM stdin;
seed-question-cmslbqjbw007x35ejomskuy5w	cmslbqjbw007x35ejomskuy5w	cmslbqiv1000535ej5nylp0ae	Hi! Is this item still available?	2026-07-15 01:57:33.409
seed-question-cmslbqjby007z35ejl9xwz406	cmslbqjby007z35ejl9xwz406	cmslbqivg000c35ej61yhiozk	How does the fit run? True to size?	2026-06-03 05:52:52.139
seed-question-cmslbqjc3008335ejsrwelmb2	cmslbqjc3008335ejsrwelmb2	cmslbqiuu000235ejeuh39xiw	Would you consider shipping internationally?	2026-07-21 17:37:00.293
seed-question-cmslbqjca008935ejsotvzpgj	cmslbqjca008935ejsotvzpgj	cmslbqivg000c35ej61yhiozk	Are there any flaws or signs of wear?	2026-05-27 19:09:56.794
seed-question-cmslbqjcd008b35ejqrsadf7v	cmslbqjcd008b35ejqrsadf7v	cmslbqiur000135ejaddnc0e3	What material is it made from?	2026-07-25 21:17:27.166
seed-question-cmslbqjcf008d35ej1wt45gzc	cmslbqjcf008d35ej1wt45gzc	cmslbqivg000c35ej61yhiozk	Do you have this in a different size?	2026-06-26 10:02:06.145
seed-question-cmslbqjci008f35ej3a32ruei	cmslbqjci008f35ej3a32ruei	cmslbqiv3000635ej8az5pm2t	Hi! Is this item still available?	2026-05-28 01:51:23.649
seed-question-cmslbqjcn008j35ej9exud18n	cmslbqjcn008j35ej9exud18n	cmslbqiv3000635ej8az5pm2t	How does the fit run? True to size?	2026-06-14 01:04:44.696
seed-question-cmslbqjcp008l35ejrekaz5uh	cmslbqjcp008l35ejrekaz5uh	cmslbqiux000335ej0cp54dss	Would you consider shipping internationally?	2026-07-19 01:10:30.267
seed-question-cmslbqjcr008n35ejag4wbhm2	cmslbqjcr008n35ejag4wbhm2	cmslbqiuz000435ej25bzx608	Are there any flaws or signs of wear?	2026-05-02 21:14:33.301
seed-question-cmslbqjcv008p35ej1s6pl11g	cmslbqjcv008p35ej1s6pl11g	cmslbqiuu000235ejeuh39xiw	What material is it made from?	2026-05-04 06:17:47.389
seed-question-cmslbqjcx008r35ejb067h0yd	cmslbqjcx008r35ejb067h0yd	cmslbqiv3000635ej8az5pm2t	Do you have this in a different size?	2026-07-15 08:08:30.361
seed-question-cmslbqjcz008t35ejebzilwmp	cmslbqjcz008t35ejebzilwmp	cmslbqivg000c35ej61yhiozk	Hi! Is this item still available?	2026-05-05 15:26:46.667
seed-question-cmslbqjd3008x35ej6i6oovhf	cmslbqjd3008x35ej6i6oovhf	cmslbqiuu000235ejeuh39xiw	How does the fit run? True to size?	2026-05-21 21:33:32.623
seed-question-cmslbqjd7008z35ej80q1ldb8	cmslbqjd7008z35ej80q1ldb8	cmslbqiv6000735ejyp92tcat	Would you consider shipping internationally?	2026-06-04 13:07:05.722
seed-question-cmslbqjda009135ejlzh0f6m0	cmslbqjda009135ejlzh0f6m0	cmslbqiv3000635ej8az5pm2t	Are there any flaws or signs of wear?	2026-05-20 11:55:42.076
seed-question-cmslbqjdd009335ejwdzzdyqc	cmslbqjdd009335ejwdzzdyqc	cmslbqiuu000235ejeuh39xiw	What material is it made from?	2026-07-16 11:29:38.385
seed-question-cmslbqjdf009535ejcpop3f2d	cmslbqjdf009535ejcpop3f2d	cmslbqiuu000235ejeuh39xiw	Do you have this in a different size?	2026-05-11 21:52:39.405
seed-question-cmslbqjdj009935ejc2k0uhy1	cmslbqjdj009935ejc2k0uhy1	cmslbqiv6000735ejyp92tcat	Hi! Is this item still available?	2026-05-04 06:20:11.176
seed-question-cmslbqjdm009b35ejlls2wgq1	cmslbqjdm009b35ejlls2wgq1	cmslbqiv1000535ej5nylp0ae	How does the fit run? True to size?	2026-07-24 19:19:03.052
seed-question-cmslbqjdo009d35ejukw18ag2	cmslbqjdo009d35ejukw18ag2	cmslbqivb000935ej2kfvj06z	Would you consider shipping internationally?	2026-06-17 09:05:28.621
seed-question-cmslbqjdq009f35ejzqbfx8uy	cmslbqjdq009f35ejzqbfx8uy	cmslbqiv6000735ejyp92tcat	Are there any flaws or signs of wear?	2026-06-08 00:28:41.462
seed-question-cmslbqjds009h35ejx1w9tmd6	cmslbqjds009h35ejx1w9tmd6	cmslbqiur000135ejaddnc0e3	What material is it made from?	2026-06-26 05:40:15.042
seed-question-cmslbqjdu009j35ejlneoipps	cmslbqjdu009j35ejlneoipps	cmslbqivd000a35ej43xc3023	Do you have this in a different size?	2026-05-26 21:01:52.568
seed-question-cmslbqjdy009n35ejxy7fhn27	cmslbqjdy009n35ejxy7fhn27	cmslbqiuu000235ejeuh39xiw	Hi! Is this item still available?	2026-06-28 16:47:59.287
seed-question-cmslbqje2009p35ejny2t9o4t	cmslbqje2009p35ejny2t9o4t	cmslbqiv3000635ej8az5pm2t	How does the fit run? True to size?	2026-05-20 02:59:07.657
seed-question-cmslbqje4009r35ej9jcqfy5q	cmslbqje4009r35ej9jcqfy5q	cmslbqivb000935ej2kfvj06z	Would you consider shipping internationally?	2026-06-24 01:55:28.553
seed-question-cmslbqje7009t35ejx4m8mh8r	cmslbqje7009t35ejx4m8mh8r	cmslbqive000b35ej4w4zr1se	Are there any flaws or signs of wear?	2026-05-13 21:21:17.905
seed-question-cmslbqje9009v35ejp5re5dks	cmslbqje9009v35ejp5re5dks	cmslbqivd000a35ej43xc3023	What material is it made from?	2026-07-04 16:50:43.463
seed-question-cmslbqjeb009x35ejnd8mkrr7	cmslbqjeb009x35ejnd8mkrr7	cmslbqiur000135ejaddnc0e3	Do you have this in a different size?	2026-07-03 03:45:50.079
seed-question-cmslbqjee009z35ej30mlv0o5	cmslbqjee009z35ej30mlv0o5	cmslbqive000b35ej4w4zr1se	Hi! Is this item still available?	2026-07-19 19:54:55.491
seed-question-cmslbqjei00a135ej4ehxj45x	cmslbqjei00a135ej4ehxj45x	cmslbqivg000c35ej61yhiozk	How does the fit run? True to size?	2026-07-04 04:40:05.196
seed-question-cmslbqjek00a335ej19ihy1vz	cmslbqjek00a335ej19ihy1vz	cmslbqive000b35ej4w4zr1se	Would you consider shipping internationally?	2026-05-09 03:20:43.979
seed-question-cmslbqjem00a535ejk52e7psf	cmslbqjem00a535ejk52e7psf	cmslbqivb000935ej2kfvj06z	Are there any flaws or signs of wear?	2026-07-02 18:48:47.84
seed-question-cmslbqjeo00a735ej4mvem8wk	cmslbqjeo00a735ej4mvem8wk	cmslbqiv1000535ej5nylp0ae	What material is it made from?	2026-06-01 15:01:35.175
seed-question-cmslbqjeq00a935ejwq3wzvtd	cmslbqjeq00a935ejwq3wzvtd	cmslbqiur000135ejaddnc0e3	Do you have this in a different size?	2026-05-04 04:20:28.5
cmslbs8pe000135s2y0oyktvc	cmslbqje7009t35ejx4m8mh8r	cmslbqiur000135ejaddnc0e3	E2E test question from API	2026-08-09 04:51:38.642
\.


--
-- Data for Name: QuestionReply; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."QuestionReply" (id, "questionId", "authorId", text, "createdAt") FROM stdin;
seed-reply-cmslbqjby007z35ejl9xwz406	seed-question-cmslbqjby007z35ejl9xwz406	cmslbqiux000335ej0cp54dss	It fits true to size in my experience.	2026-05-14 22:27:24.337
seed-reply-cmslbqjc3008335ejsrwelmb2	seed-question-cmslbqjc3008335ejsrwelmb2	cmslbqiv1000535ej5nylp0ae	Happy to ship internationally at cost.	2026-07-01 07:20:04.797
seed-reply-cmslbqjcd008b35ejqrsadf7v	seed-question-cmslbqjcd008b35ejqrsadf7v	cmslbqivb000935ej2kfvj06z	It's a high-quality fabric, very comfortable.	2026-07-02 06:15:33.767
seed-reply-cmslbqjci008f35ej3a32ruei	seed-question-cmslbqjci008f35ej3a32ruei	cmslbqive000b35ej4w4zr1se	Yes, it is! Feel free to make an offer.	2026-06-17 12:59:03.337
seed-reply-cmslbqjcn008j35ej9exud18n	seed-question-cmslbqjcn008j35ej9exud18n	cmslbqiur000135ejaddnc0e3	It fits true to size in my experience.	2026-05-28 16:52:46.875
seed-reply-cmslbqjcr008n35ejag4wbhm2	seed-question-cmslbqjcr008n35ejag4wbhm2	cmslbqiux000335ej0cp54dss	It's in great condition — no flaws.	2026-07-28 22:26:46.304
seed-reply-cmslbqjcv008p35ej1s6pl11g	seed-question-cmslbqjcv008p35ej1s6pl11g	cmslbqiuz000435ej25bzx608	It's a high-quality fabric, very comfortable.	2026-05-20 23:20:01.319
seed-reply-cmslbqjcx008r35ejb067h0yd	seed-question-cmslbqjcx008r35ejb067h0yd	cmslbqiv1000535ej5nylp0ae	I only have this size, sorry!	2026-07-10 00:10:40.211
seed-reply-cmslbqjcz008t35ejebzilwmp	seed-question-cmslbqjcz008t35ejebzilwmp	cmslbqiv3000635ej8az5pm2t	Yes, it is! Feel free to make an offer.	2026-05-26 04:12:29.278
seed-reply-cmslbqjd3008x35ej6i6oovhf	seed-question-cmslbqjd3008x35ej6i6oovhf	cmslbqiv9000835ejipaundju	It fits true to size in my experience.	2026-07-02 23:59:18.769
seed-reply-cmslbqjda009135ejlzh0f6m0	seed-question-cmslbqjda009135ejlzh0f6m0	cmslbqivd000a35ej43xc3023	It's in great condition — no flaws.	2026-05-08 06:05:28.235
seed-reply-cmslbqjdd009335ejwdzzdyqc	seed-question-cmslbqjdd009335ejwdzzdyqc	cmslbqive000b35ej4w4zr1se	It's a high-quality fabric, very comfortable.	2026-06-20 03:52:03.475
seed-reply-cmslbqjdj009935ejc2k0uhy1	seed-question-cmslbqjdj009935ejc2k0uhy1	cmslbqiuu000235ejeuh39xiw	Yes, it is! Feel free to make an offer.	2026-05-27 23:27:25.432
seed-reply-cmslbqjdm009b35ejlls2wgq1	seed-question-cmslbqjdm009b35ejlls2wgq1	cmslbqiux000335ej0cp54dss	It fits true to size in my experience.	2026-05-26 01:54:53.504
seed-reply-cmslbqjdo009d35ejukw18ag2	seed-question-cmslbqjdo009d35ejukw18ag2	cmslbqiuz000435ej25bzx608	Happy to ship internationally at cost.	2026-06-07 14:16:02.501
seed-reply-cmslbqjdq009f35ejzqbfx8uy	seed-question-cmslbqjdq009f35ejzqbfx8uy	cmslbqiv1000535ej5nylp0ae	It's in great condition — no flaws.	2026-07-11 05:23:20.72
seed-reply-cmslbqjds009h35ejx1w9tmd6	seed-question-cmslbqjds009h35ejx1w9tmd6	cmslbqiv3000635ej8az5pm2t	It's a high-quality fabric, very comfortable.	2026-07-08 02:11:25.552
seed-reply-cmslbqjdu009j35ejlneoipps	seed-question-cmslbqjdu009j35ejlneoipps	cmslbqiv6000735ejyp92tcat	I only have this size, sorry!	2026-06-23 23:41:49.671
seed-reply-cmslbqje2009p35ejny2t9o4t	seed-question-cmslbqje2009p35ejny2t9o4t	cmslbqivd000a35ej43xc3023	It fits true to size in my experience.	2026-05-11 00:31:10.341
seed-reply-cmslbqjeb009x35ejnd8mkrr7	seed-question-cmslbqjeb009x35ejnd8mkrr7	cmslbqiuu000235ejeuh39xiw	I only have this size, sorry!	2026-05-22 11:25:36.34
seed-reply-cmslbqjee009z35ej30mlv0o5	seed-question-cmslbqjee009z35ej30mlv0o5	cmslbqiux000335ej0cp54dss	Yes, it is! Feel free to make an offer.	2026-06-10 16:27:08.997
seed-reply-cmslbqjek00a335ej19ihy1vz	seed-question-cmslbqjek00a335ej19ihy1vz	cmslbqiv1000535ej5nylp0ae	Happy to ship internationally at cost.	2026-05-15 20:59:28.714
seed-reply-cmslbqjem00a535ejk52e7psf	seed-question-cmslbqjem00a535ejk52e7psf	cmslbqiv3000635ej8az5pm2t	It's in great condition — no flaws.	2026-07-05 03:46:16.452
seed-reply-cmslbqjeq00a935ejwq3wzvtd	seed-question-cmslbqjeq00a935ejwq3wzvtd	cmslbqiv9000835ejipaundju	I only have this size, sorry!	2026-06-30 07:05:59.499
cmslbsd38000335s2me2mhvud	cmslbs8pe000135s2y0oyktvc	cmslbqiuu000235ejeuh39xiw	E2E test reply from API	2026-08-09 04:51:44.324
\.


--
-- Data for Name: Report; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Report" (id, "reporterId", "targetType", "targetId", reason, description, status, "createdAt") FROM stdin;
\.


--
-- Data for Name: Review; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Review" (id, "orderId", "reviewerId", "revieweeId", rating, comment, "createdAt") FROM stdin;
\.


--
-- Data for Name: Transaction; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Transaction" (id, "orderId", "productName", buyer, gross, fee, net, status, payout, date) FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, name, email, password, role, "avatarUrl", bio, "isSuspended", "createdAt", "lastSeen", "ratingsCount", "avgRating", "followersCount", "followingCount", location, "verifiedMethods", badges, "stripeAccountId", "stripeOnboardingComplete", "stripePayoutsEnabled") FROM stdin;
cmslbqivb000935ej2kfvj06z	Liam O'Brien	liam@example.com	$2b$12$BRhbNl1C8QJH70RdlMIuUe8PNPKADZdNi5eEi5wTgL5xBjze9Kd8i	user	\N	\N	f	2026-08-09 04:50:18.503	2026-08-09 04:50:18.503	0	0	5	2	Dublin, Ireland	{Email}	{}	\N	f	f
cmslbqivd000a35ej43xc3023	Noah Kim	noah@example.com	$2b$12$BRhbNl1C8QJH70RdlMIuUe8PNPKADZdNi5eEi5wTgL5xBjze9Kd8i	user	\N	\N	f	2026-08-09 04:50:18.505	2026-08-09 04:50:18.505	0	0	4	2	Seoul, South Korea	{Email}	{}	\N	f	f
cmslbqive000b35ej4w4zr1se	Aria Dupont	aria@example.com	$2b$12$BRhbNl1C8QJH70RdlMIuUe8PNPKADZdNi5eEi5wTgL5xBjze9Kd8i	user	\N	\N	f	2026-08-09 04:50:18.507	2026-08-09 04:50:18.507	0	0	4	2	Paris, France	{Email}	{}	\N	f	f
cmslbqivg000c35ej61yhiozk	Ethan Müller	ethan@example.com	$2b$12$BRhbNl1C8QJH70RdlMIuUe8PNPKADZdNi5eEi5wTgL5xBjze9Kd8i	user	\N	\N	f	2026-08-09 04:50:18.509	2026-08-09 04:50:18.509	0	0	2	5	Berlin, Germany	{Email}	{}	\N	f	f
cmslbqiur000135ejaddnc0e3	Sophia Chen	sophia@example.com	$2b$12$BRhbNl1C8QJH70RdlMIuUe8PNPKADZdNi5eEi5wTgL5xBjze9Kd8i	user	\N	\N	f	2026-08-09 04:50:18.483	2026-08-09 04:50:18.483	0	0	5	2	San Francisco, CA	{Email}	{}	\N	f	f
cmslbqiuu000235ejeuh39xiw	Marcus Rivera	marcus@example.com	$2b$12$BRhbNl1C8QJH70RdlMIuUe8PNPKADZdNi5eEi5wTgL5xBjze9Kd8i	user	\N	\N	f	2026-08-09 04:50:18.486	2026-08-09 04:50:18.486	0	0	1	5	New York, NY	{Email}	{}	\N	f	f
cmslbqiux000335ej0cp54dss	Emma Larsson	emma@example.com	$2b$12$BRhbNl1C8QJH70RdlMIuUe8PNPKADZdNi5eEi5wTgL5xBjze9Kd8i	user	\N	\N	f	2026-08-09 04:50:18.489	2026-08-09 04:50:18.489	0	0	3	3	Stockholm, Sweden	{Email}	{}	\N	f	f
cmslbqiuz000435ej25bzx608	James Okafor	james@example.com	$2b$12$BRhbNl1C8QJH70RdlMIuUe8PNPKADZdNi5eEi5wTgL5xBjze9Kd8i	user	\N	\N	f	2026-08-09 04:50:18.492	2026-08-09 04:50:18.492	0	0	3	4	London, UK	{Email}	{}	\N	f	f
cmslbqiv1000535ej5nylp0ae	Isabella Moretti	isabella@example.com	$2b$12$BRhbNl1C8QJH70RdlMIuUe8PNPKADZdNi5eEi5wTgL5xBjze9Kd8i	user	\N	\N	f	2026-08-09 04:50:18.494	2026-08-09 04:50:18.494	0	0	2	4	Milan, Italy	{Email}	{}	\N	f	f
cmslbqiv3000635ej8az5pm2t	Alex Thompson	alex@example.com	$2b$12$BRhbNl1C8QJH70RdlMIuUe8PNPKADZdNi5eEi5wTgL5xBjze9Kd8i	user	\N	\N	f	2026-08-09 04:50:18.496	2026-08-09 04:50:18.496	0	0	6	4	Austin, TX	{Email}	{}	\N	f	f
cmslbqiv6000735ejyp92tcat	Yuki Tanaka	yuki@example.com	$2b$12$BRhbNl1C8QJH70RdlMIuUe8PNPKADZdNi5eEi5wTgL5xBjze9Kd8i	user	\N	\N	f	2026-08-09 04:50:18.499	2026-08-09 04:50:18.499	0	0	4	4	Tokyo, Japan	{Email}	{}	\N	f	f
cmslbqiuh000035ej6gwapjbx	Admin	admin@desirewardrobe.com	$2b$12$gr0hOeGHYpbn8IZkZmV6ke6K3xrHgfl0kFYB5VAat2OVIpGX6obaC	admin	\N	\N	f	2026-08-09 04:50:18.473	2026-08-09 04:50:18.473	0	0	0	0	\N	\N	\N	\N	f	f
cmslbqiv9000835ejipaundju	Olivia Patel	olivia@example.com	$2b$12$BRhbNl1C8QJH70RdlMIuUe8PNPKADZdNi5eEi5wTgL5xBjze9Kd8i	user	\N	\N	f	2026-08-09 04:50:18.501	2026-08-09 04:50:18.501	0	0	2	4	Mumbai, India	{Email}	{}	\N	f	f
\.


--
-- Data for Name: _ConversationToUser; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."_ConversationToUser" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
1f5f41aa-1462-4ddd-bf5e-149d6bc5f020	7cad9a13893473d727608be084c5f0fd5964a9f9c8a1fdc1380b1c98a0540ef9	2026-07-28 04:49:31.098915+00	20260728044930_init	\N	\N	2026-07-28 04:49:31.000106+00	1
d624851a-420c-4a4d-9539-159dd70f2f68	0ffb7ecef01f3ef60b7e62d8d8385abc0e3b7b31d532bdc30e6bed563005c9b6	2026-08-02 13:04:57.326819+00	20260802130457_add_order_quantity	\N	\N	2026-08-02 13:04:57.313599+00	1
8ad21249-47b2-437a-99cb-a1656ab1a4fe	19af3326cb2411d312bd3d310e26ed99e4f9d0dacdcc49d5c9c5cd2f77e5eb5f	2026-08-03 03:51:19.750092+00	20260803035119_add_follow_model	\N	\N	2026-08-03 03:51:19.726864+00	1
9aa6190f-6798-4de1-ae0f-5c6d1ca37272	ec2c0442070cdec61ab9eaef8ce260589d427ec086ef30a22d8d964dd3ff33ff	2026-08-03 04:28:18.398766+00	20260803050300_add_stripe_escrow_payments	\N	\N	2026-08-03 04:28:18.342628+00	1
89f4c52c-dcfb-4fd7-8cec-1afcbe1fee76	34f6ecb763e6ae74e3a1a6ac85e0494bc9d9826370cd0f7777bf89b94bbd405c	2026-08-03 05:51:50.201984+00	20260803055149_payment_method_added	\N	\N	2026-08-03 05:51:49.979575+00	1
05a817ea-bafe-4206-9669-273581910be4	be0fd22fb054049f8e4267d9d61d8b8cf247b12542a83b2c4c78e565e8b57383	2026-08-09 04:47:31.158366+00	20260809044731_add_product_questions	\N	\N	2026-08-09 04:47:31.126371+00	1
\.


--
-- Name: Banner Banner_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Banner"
    ADD CONSTRAINT "Banner_pkey" PRIMARY KEY (id);


--
-- Name: Brand Brand_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Brand"
    ADD CONSTRAINT "Brand_pkey" PRIMARY KEY (id);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: Conversation Conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_pkey" PRIMARY KEY (id);


--
-- Name: Favorite Favorite_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Favorite"
    ADD CONSTRAINT "Favorite_pkey" PRIMARY KEY (id);


--
-- Name: Follow Follow_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Follow"
    ADD CONSTRAINT "Follow_pkey" PRIMARY KEY (id);


--
-- Name: Listing Listing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Listing"
    ADD CONSTRAINT "Listing_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: Offer Offer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Offer"
    ADD CONSTRAINT "Offer_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: PlatformSetting PlatformSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PlatformSetting"
    ADD CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY (key);


--
-- Name: ProductQuestion ProductQuestion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductQuestion"
    ADD CONSTRAINT "ProductQuestion_pkey" PRIMARY KEY (id);


--
-- Name: QuestionReply QuestionReply_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuestionReply"
    ADD CONSTRAINT "QuestionReply_pkey" PRIMARY KEY (id);


--
-- Name: Report Report_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_pkey" PRIMARY KEY (id);


--
-- Name: Review Review_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_pkey" PRIMARY KEY (id);


--
-- Name: Transaction Transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _ConversationToUser _ConversationToUser_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_ConversationToUser"
    ADD CONSTRAINT "_ConversationToUser_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Brand_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Brand_name_key" ON public."Brand" USING btree (name);


--
-- Name: Brand_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Brand_slug_idx" ON public."Brand" USING btree (slug);


--
-- Name: Brand_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Brand_slug_key" ON public."Brand" USING btree (slug);


--
-- Name: Category_parentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Category_parentId_idx" ON public."Category" USING btree ("parentId");


--
-- Name: Category_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Category_slug_idx" ON public."Category" USING btree (slug);


--
-- Name: Conversation_listingId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Conversation_listingId_idx" ON public."Conversation" USING btree ("listingId");


--
-- Name: Favorite_listingId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Favorite_listingId_idx" ON public."Favorite" USING btree ("listingId");


--
-- Name: Favorite_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Favorite_userId_idx" ON public."Favorite" USING btree ("userId");


--
-- Name: Favorite_userId_listingId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Favorite_userId_listingId_key" ON public."Favorite" USING btree ("userId", "listingId");


--
-- Name: Follow_followerId_followingId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON public."Follow" USING btree ("followerId", "followingId");


--
-- Name: Follow_followerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Follow_followerId_idx" ON public."Follow" USING btree ("followerId");


--
-- Name: Follow_followingId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Follow_followingId_idx" ON public."Follow" USING btree ("followingId");


--
-- Name: Listing_brand_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Listing_brand_idx" ON public."Listing" USING btree (brand);


--
-- Name: Listing_categoryId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Listing_categoryId_idx" ON public."Listing" USING btree ("categoryId");


--
-- Name: Listing_price_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Listing_price_idx" ON public."Listing" USING btree (price);


--
-- Name: Listing_sellerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Listing_sellerId_idx" ON public."Listing" USING btree ("sellerId");


--
-- Name: Listing_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Listing_status_idx" ON public."Listing" USING btree (status);


--
-- Name: Listing_uploadedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Listing_uploadedAt_idx" ON public."Listing" USING btree ("uploadedAt");


--
-- Name: Message_conversationId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Message_conversationId_idx" ON public."Message" USING btree ("conversationId");


--
-- Name: Message_senderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Message_senderId_idx" ON public."Message" USING btree ("senderId");


--
-- Name: Offer_buyerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Offer_buyerId_idx" ON public."Offer" USING btree ("buyerId");


--
-- Name: Offer_listingId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Offer_listingId_idx" ON public."Offer" USING btree ("listingId");


--
-- Name: Offer_sellerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Offer_sellerId_idx" ON public."Offer" USING btree ("sellerId");


--
-- Name: Order_buyerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Order_buyerId_idx" ON public."Order" USING btree ("buyerId");


--
-- Name: Order_listingId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Order_listingId_idx" ON public."Order" USING btree ("listingId");


--
-- Name: Order_sellerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Order_sellerId_idx" ON public."Order" USING btree ("sellerId");


--
-- Name: Order_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Order_status_idx" ON public."Order" USING btree (status);


--
-- Name: Payment_orderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Payment_orderId_idx" ON public."Payment" USING btree ("orderId");


--
-- Name: Payment_orderId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Payment_orderId_key" ON public."Payment" USING btree ("orderId");


--
-- Name: Payment_stripePaymentIntentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Payment_stripePaymentIntentId_idx" ON public."Payment" USING btree ("stripePaymentIntentId");


--
-- Name: Payment_stripePaymentIntentId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON public."Payment" USING btree ("stripePaymentIntentId");


--
-- Name: ProductQuestion_authorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProductQuestion_authorId_idx" ON public."ProductQuestion" USING btree ("authorId");


--
-- Name: ProductQuestion_listingId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProductQuestion_listingId_idx" ON public."ProductQuestion" USING btree ("listingId");


--
-- Name: QuestionReply_authorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "QuestionReply_authorId_idx" ON public."QuestionReply" USING btree ("authorId");


--
-- Name: QuestionReply_questionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "QuestionReply_questionId_idx" ON public."QuestionReply" USING btree ("questionId");


--
-- Name: Report_reporterId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Report_reporterId_idx" ON public."Report" USING btree ("reporterId");


--
-- Name: Report_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Report_status_idx" ON public."Report" USING btree (status);


--
-- Name: Report_targetId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Report_targetId_idx" ON public."Report" USING btree ("targetId");


--
-- Name: Review_orderId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Review_orderId_key" ON public."Review" USING btree ("orderId");


--
-- Name: Review_revieweeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Review_revieweeId_idx" ON public."Review" USING btree ("revieweeId");


--
-- Name: Review_reviewerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Review_reviewerId_idx" ON public."Review" USING btree ("reviewerId");


--
-- Name: Transaction_orderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Transaction_orderId_idx" ON public."Transaction" USING btree ("orderId");


--
-- Name: Transaction_orderId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Transaction_orderId_key" ON public."Transaction" USING btree ("orderId");


--
-- Name: User_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "User_email_idx" ON public."User" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_role_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "User_role_idx" ON public."User" USING btree (role);


--
-- Name: _ConversationToUser_B_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "_ConversationToUser_B_index" ON public."_ConversationToUser" USING btree ("B");


--
-- Name: Category Category_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Conversation Conversation_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listing"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Favorite Favorite_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Favorite"
    ADD CONSTRAINT "Favorite_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listing"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Favorite Favorite_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Favorite"
    ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Follow Follow_followerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Follow"
    ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Follow Follow_followingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Follow"
    ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Listing Listing_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Listing"
    ADD CONSTRAINT "Listing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Listing Listing_sellerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Listing"
    ADD CONSTRAINT "Listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Message Message_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Message Message_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Offer Offer_buyerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Offer"
    ADD CONSTRAINT "Offer_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Offer Offer_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Offer"
    ADD CONSTRAINT "Offer_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listing"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Offer Offer_sellerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Offer"
    ADD CONSTRAINT "Offer_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_buyerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listing"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_sellerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payment Payment_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProductQuestion ProductQuestion_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductQuestion"
    ADD CONSTRAINT "ProductQuestion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProductQuestion ProductQuestion_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductQuestion"
    ADD CONSTRAINT "ProductQuestion_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listing"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: QuestionReply QuestionReply_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuestionReply"
    ADD CONSTRAINT "QuestionReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QuestionReply QuestionReply_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuestionReply"
    ADD CONSTRAINT "QuestionReply_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public."ProductQuestion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Report Report_reporterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Review Review_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Review Review_revieweeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Review Review_reviewerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Transaction Transaction_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: _ConversationToUser _ConversationToUser_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_ConversationToUser"
    ADD CONSTRAINT "_ConversationToUser_A_fkey" FOREIGN KEY ("A") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ConversationToUser _ConversationToUser_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_ConversationToUser"
    ADD CONSTRAINT "_ConversationToUser_B_fkey" FOREIGN KEY ("B") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict ecTG5dn1iIrydvIWJnVyQ7tXBiTe4Q1FAV5FYwW9uICVux7jK7BfbXH3o9UHv26

