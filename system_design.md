# Smart Campus Super-App - System Design Document

## 1. Core Vision & UX Philosophy

**Vision**: A privacy-first, verified-only social super-app for students globally.  
**Design Philosophy**: "Apple-esque" Minimalism.
*   **Visuals**: Clean lines, generous whitespace, premium glassy textures (glassmorphism), San Francisco/Inter typography.
*   **Motion**: Fluid, physics-based animations (springs, non-linear transitions) for every interaction. The app should feel "alive".
*   **Themes**:
    *   **Day Mode**: High contrast, crisp white/light gray backgrounds.
    *   **Night Mode**: OLED black and deep slate grays for battery saving and comfort.
    *   **Reading Mode**: Sepia/Warm tone adjustments for long-form consumption (Articles/Notes).

---

## 2. Technical Architecture

### High-Level Architecture
The system follows a **Microservices Architecture** to ensure scalability, isolation, and independent deployment of features (e.g., handling a spike in "Event" traffic without affecting "Chat").

#### Client Layer (Mobile & Web)
*   **Framework**: **Flutter** (Primary for Mobile) & **React (Next.js)** (Web).
    *   *Why Flutter?* Best-in-class performance for 120Hz animations ("Apple feel"), single codebase for iOS/Android, excellent custom UI control.
*   **State Management**: Riverpod (Flutter) / Zustand (React).
*   **Local Storage**: WatermelonDB or Hive for offline-first capabilities (caching feed, notes).

#### API Gateway / Edge Layer
*   **Technology**: **Nginx** or **Traefik** + **Cloudflare** (DDoS protection & CDN).
*   **Function**: Rate limiting, localized caching, SSL termination, request routing to microservices.

#### Backend Microservices (Containerized)
1.  **Auth Service**: Handles Login, JWT issuance, MFA.
2.  **Verification Service**: The "Fortress". Handles OCR, ID processing, Issuer verification. *Isolated environment*.
3.  **Social Graph Service**: Manages Connections, Followers, Privacy (Ghost Mode logic).
4.  **Content Service**: Feed generation, Posts, Media upload management.
5.  **Event & Activities Service**: Events, Ticketing, RSVP.
6.  **Marketplace Service**: Listings, Inventory, Transaction intent.
7.  **Gamification Service**: Leaderboards, XP, Mini-game logic.
8.  **AI & Support Service**: Interface for the AI Agent (LLM routing).

#### Data Layer
*   **Primary DB**: **PostgreSQL** (User data, Relations, Structured content).
*   **Social Graph**: **Neo4j** or **Amazon Neptune** (Highly efficient for "Friends of Friends" & shortest path queries).
*   **Cache**: **Redis** (Hot feed cache, session store, leaderboard counters).
*   **Vector Store**: **Pinecone** or **pgvector** (For AI context & recommendations).
*   **Object Storage**: **AWS S3 / Cloudflare R2** (Images, Videos, Documents).

#### Realtime Layer
*   **Technology**: **WebSocket** (Socket.io or Go based raw WS).
*   **Usage**: DM Chat, Live Location (Ghost mode), Notification push, Live Game status.

---

## 3. Multi-Tenancy Strategy (The "Campus Bubble")
To enforce "Institution = Tenant" without separate DBs for every college:
*   **Logical Isolation**: Every database record has `institution_id`.
*   **Row-Level Security (RLS)**: Postgres RLS rules automatically filter queries to valid `institution_id` of the requesting user.
*   **Geofencing**: Service logic checks `user.campus_id` against `target.campus_id` for interaction permission (except for specific "Inter-campus" features if planned).

---

## 4. Student Verification Flow (Detailed)

**Constraint**: No IT Integration.
**Solution**: "Trust but Verify" with Multi-factor Proof.

### Step 1: Document Ingestion (Client Side)
*   User selects Institution from global list.
*   User photographs **Student ID Card** (Front + Back) AND **Time-Bound Proof** (Fee Receipt/Admission Letter).
*   *Privacy Action*: App generates a **client-side hash** of the PII for later conflict check, then encrypted upload.

### Step 2: Processing (Verification Service)
*   **Preprocessing**: Image quality check, blur detection.
*   **OCR Extraction**: Extract `Name`, `ID Number`, `Institution`, `Valid From/To`.
    *   *Tech*: Google Cloud Vision API or Tesseract (Custom trained model).
*   **Heuristic Check**: 
    *   Does extracted text match user input?
    *   Is dates valid?
    *   Does ID format match known patterns for that college (e.g., "BITS ID usually contains 'PS'")?

### Step 3: Anti-Fraud & Human Loop
*   **AI Scan**: Check for Photoshop artifacts / pixel discontinuity.
*   **Confidence Score**: If > 90% -> Auto-Approve. If 50-90% -> Send to 'Human Moderation Queue' (Community Mods or Paid Verifiers).

### Step 4: Credential Issuance
*   On success, issue a **Verifiable Credential (VC)** or a long-lived **Signed JWT**.
*   **Claims**: `institution_id`, `student_hash`, `expiry_date`.
*   **Storage**: Save *minimal* meta-data. *Delete raw ID images after 30 days* (Data Minimization).

---

## 5. Privacy & Data Protection

*   **Ghost Mode**: Location data is *ephemeral*. Only shared via WebSocket when active. History is NOT stored.
*   **Identity Obfuscation**: Users can pick a `display_name` different from `legal_name` (Legal name only used for recovery/verification).
*   **Data Minimization**:
    *   We don't need: Home Address, GPA, Parents' names.
    *   We verify & discard: Raw ID documents.
*   **Compliance**:
    *   **Right to Forget**: Automated nuking of all user data upon request.
    *   **Consent Granularity**: "Allow Event suggestions based on Location? [Yes/No]"

---

## 6. Feature Roadmap

### Phase 1: MVP (The "Clubhouse" Feel)
*   **Core Auth & Verification** (Manual + Basic OCR).
*   **Feed**: Image/Text posts, Upvotes.
*   **Directory**: List of verified students in your campus.
*   **Chat**: 1:1 DMs.
*   **Profile**: Basic stats.

### Phase 2: Engagement (The "Social" Layer)
*   **Reels/Video**: High bandwidth infrastructure.
*   **Events**: Calendar, RSVP.
*   **Marketplace**: Simple listings.
*   **Ghost Mode**: Live map.

### Phase 3: The "Super-App"
*   **Mini-Games**: Real-time multiplayer.
*   **AI Agent**: Full integration using RAG (Retrieval Augmented Generation).
*   **Wallet**: In-app currency & Gamification store.

---

## 7. Data Models (Schema Design)

### Users Collection (PostgreSQL / Document)
Critical strictness: `institution_id` partition key.

```json
{
  "user_id": "uuid_v4",
  "institution_id": "uuid_ref_institution",
  "username": "cool_kid_99", // Editable once every 30 days
  "display_name": "Karan S.",
  "roles": ["student", "moderator", "verified"],
  "verification_status": {
    "is_verified": true,
    "verified_at": "timestamp",
    "expires_at": "timestamp", // End of academic year
    "verification_level": "gold" // gold=ID+Location, silver=ID only
  },
  "privacy_settings": {
    "ghost_mode": true,
    "show_last_seen": false,
    "allow_dm_from": "friends_only" // or "campus_only"
  },
  "stats": {
    "reputation_points": 120,
    "friends_count": 45
  },
  "created_at": "timestamp"
}
```

### Institutions Collection
Publicly readable global list.

```json
{
  "institution_id": "uuid_v4",
  "name": "Indian Institute of Technology, Delhi",
  "domains": ["iitd.ac.in"], // Just for heuristic grouping, not auth
  "geo_fence": {
    "center": {"lat": 28.545, "lng": 77.192},
    "radius_meters": 2000
  },
  "visuals": {
    "primary_color": "#B30000",
    "logo_url": "s3://..."
  },
  "features_enabled": ["marketplace", "anonymous_confessions"]
}
```

### Posts / Reels Collection
Heavily indexed by `institution_id` + `tags` + `created_at`.

```json
{
  "post_id": "snowflake_id",
  "institution_id": "uuid_ref",
  "author_id": "uuid_ref",
  "type": "reel", // or "text", "event", "poll"
  "content": {
    "text": "Check out the sunset!",
    "media_urls": ["s3://video_manifest.m3u8"],
    "music_track_id": "spotify_id"
  },
  "metrics": {
    "likes": 1024,
    "shares": 50,
    "views": 50000
  },
  "location_tag": "Main Building Roof",
  "is_nsfw": false,
  "created_at": "timestamp"
}
```

---

## 8. API Design Outline (REST + Socket)

### Auth & Verification
*   `POST /auth/login` -> Request OTP (Phone/Email).
*   `POST /auth/verify-otp` -> Returns temp JWT.
*   `POST /verification/upload-id` -> Upload encrypted ID images.
    *   *Body*: `instruction_id`, `files[]`
*   `GET /verification/status` -> Poll for "approved/rejected".

### Feed & Content
*   `GET /feed/for-you?cursor=xyz` -> Personalized algorithm feed.
    *   *Headers*: `X-Institution-ID`
*   `GET /feed/trending` -> Top posts in campus.
*   `POST /posts/create` -> Create new content.

### Maps & Realtime (WebSocket Events)
*   `Event: location_update`
    *   *Payload*: `{ lat: 28.5, lng: 77.2, status: "online" }`
    *   *Server Action*: Broadcast to friends within radius.
*   `Event: throw_pokeball`
    *   *Payload*: `{ target_user_id: "uuid" }`
    *   *Server Action*: Send push notif "Karan threw a ball at you!".

### Marketplace
*   `GET /marketplace/listings?category=books` -> Filtered items.
*   `POST /marketplace/create` -> New listing.
*   `POST /marketplace/chat/start` -> Init negotiation.
 

---

## 9. AI Agent Architecture ("Campus Genius")

The AI Agent acts as a first-responder for support and a community moderator.

### Architecture: RAG (Retrieval Augmented Generation)
*   **Vector Database**: **Pinecone** storing embeddings of:
    *   *System Rules*: "How to verify", "Ghost mode privacy policy".
    *   *Campus Context*: "Exam dates for IITD", "Fest schedule".
    *   *Past Support Tickets*: Solved cases (sanitized).
*   **LLM Model**: Finetuned **Llama 3 (8B)** or **Gemini Flash** (Low latency, high reasoning).
*   **Flow**:
    1.  User query: "Where do I submit the bonafide certificate?"
    2.  Embed query -> Search Vector DB.
    3.  Retrieve context -> Construct Prompt.
    4.  LLM generates answer -> Return to User.

### Capabilities
1.  **Troubleshooting**: "My ID scan failed" -> AI explains lighting/blur requirements.
2.  **Moderation Assistant**:
    *   *Pre-Filter*: Analyze text/image before posting.
    *   *Tone Check*: "This comment looks aggressive. Are you sure?" (Nudge theory).
3.  **Local Discovery**: "Find me a guitarist in 2nd year" -> Queries Social Graph (with privacy checks).

---

## 10. Safety, Compliance & DPDP 2025 Strategy

### Data Principal Rights (India DPDP 2025)
*   **Consent Manager**:
    *   Explicit granular consent screens: "Allow specific location access for Map?"
    *   **Withdrawal**: One-tap "Revoke All Data" button in Settings.
*   **Data Minimization**:
    *   *Auto-Expiry*: Verification docs are strictly deleted after 30 days of processing.
    *   *Silos*: PII (Name, ID) is stored in a separate, encrypted vault (Vault Service) linked only by a `hash_id` to the public profile.

### Content Safety
*   **NSFW Filter**:
    *   **Rekognition / Cloud Vision**: Scan all media uploads.
    *   *Adult Content*: Hard block on public feed. Allowed in hidden "NSFW" enabled feeds ONLY if user is verified > 18+.
    *   *Hate Speech*: Real-time NLP classification.
*   **Reporting Flow**:
    *   User Report -> AI Triage -> High Priority to Human Mod.

---


