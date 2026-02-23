# Ironhand — Product Requirements Document

## 1. Product Overview

| | |
|---|---|
| **Product Name** | Ironhand |
| **Tagline** | Your AI Electrician |
| **Platform** | Mobile-first web app (PWA-ready) |
| **Deployment** | Vercel (static SPA + serverless function) |

Ironhand is a real-time AI electrician assistant. It streams live camera video and two-way voice to Google Gemini for hands-free electrical guidance on the job site.

## 2. Problem Statement

Electricians working on-site — especially less experienced ones — need expert guidance while their hands are busy. Traditional options (calling a colleague, looking up code books, watching videos) all require stopping work.

Ironhand lets a worker point their phone camera at electrical equipment and have a real-time, voice-based conversation with an AI master electrician who can see what they see and talk them through the work — completely hands-free.

## 3. Core Capabilities

### 3.1 Real-Time Video Streaming

The app captures the device camera feed and streams it to the AI in real time.

- 1 frame per second capture rate
- Frames resized to max 768px width, JPEG quality 0.7
- Supports front and rear cameras with live toggling
- Camera requests 1280×720 ideal resolution
- Pauses frame capture automatically when the app is backgrounded

### 3.2 Two-Way Voice Communication

Users speak naturally and hear the AI respond through their device speakers. No button presses required.

- Continuous microphone capture at 16kHz mono PCM
- AI audio responses played back at 24kHz through device speakers
- Browser-native echo cancellation, noise suppression, and auto gain control
- Mute/unmute toggle for the microphone
- Fully hands-free — conversation flows naturally without push-to-talk

### 3.3 AI Electrician Persona

The AI operates as "Ironhand" — a seasoned master electrician with a distinct personality and deep expertise.

- Licensed master electrician persona (E-1 license, State of Connecticut)
- 30 years of residential and commercial electrical experience
- Speaks like a veteran tradesman mentoring an apprentice — direct, no-nonsense, but patient
- Uses natural trade lingo ("Kill that breaker," "Land that wire," "Torque it down")
- Safety-first: interrupts immediately on any safety concern without waiting to be asked
- References specific NEC 2023 (NFPA 70-2023) articles for code compliance
- Adapts language to the worker's experience level — tight and technical for veterans, step-by-step for greener workers
- Uses camera-relative directional language ("top-left breaker," "the red wire coming in from the right")

### 3.4 Real-Time Visual Analysis

The AI analyzes incoming camera frames and proactively identifies what it sees.

- **Component identification**: Names panel brands, breaker models, wire types, conduit types, and other equipment by specific model (e.g., "Square D Homeline 200A main breaker panel")
- **Proactive problem spotting**: Calls out code violations, double-tapped breakers, improper wire gauge, missing knockouts, scorching, corrosion, and aluminum wiring on copper-rated devices without being asked
- **Problematic panel flagging**: Identifies known dangerous panels — Federal Pacific Stab-Lok, Zinsco/Sylvania, Pushmatic, certain Challenger panels
- **Part identification and replacement suggestions**: Identifies parts by catalog number and recommends exact replacements
- **Camera guidance**: Asks the user to reposition the camera or adjust lighting when the view is unclear

### 3.5 Electrical Panel Inspection (Primary Use Case)

When inspecting an electrical panel, the AI runs a systematic 12-point checklist:

1. **Panel identification** — brand, model, amperage rating; flag problematic panels
2. **Circuit labeling** — clear and accurate labels (NEC 408.4)
3. **Breaker conditions** — overheating, tripping, physical damage, improper sizing
4. **Double-tapped breakers** — multiple wires on terminals not rated for it
5. **Wire sizing** — matches breaker amperage (14 AWG/15A, 12 AWG/20A, 10 AWG/30A)
6. **Grounding and bonding** — electrode conductor, bonding screw/strap, neutral-ground separation in sub-panels (NEC 250)
7. **AFCI/GFCI protection** — compliance with NEC 210.8 and 210.12
8. **Working clearance** — 30" wide, 36" deep, 78" high (NEC 110.26)
9. **Unused openings** — properly covered (NEC 408.7)
10. **Environmental damage** — water intrusion, corrosion, pest damage, overheating signs
11. **Cable/conduit entry** — proper connectors in place
12. **Panel cover** — fits properly with no gaps

### 3.6 Connecticut-Specific Knowledge

The AI has deep knowledge of Connecticut electrical requirements:

- Connecticut currently adopts the 2023 NEC (NFPA 70-2023)
- State licensing tiers: Apprentice (E-2), Journeyman (E-1), Contractor (E-1C)
- Permits required for most electrical work beyond basic maintenance
- Inspections conducted by local building officials or third-party inspectors depending on municipality
- Regional concerns: pre-1970s housing stock, knob-and-tube wiring in older homes, aluminum branch circuit wiring (1965–1975 era), coastal corrosion in shoreline towns

### 3.7 Live Chat Transcript

All spoken conversation is transcribed in real time and displayed as a visual chat overlay.

- Real-time transcription of both user speech and AI speech
- Displayed as a collapsible overlay on top of the camera feed (max 40% of viewport height)
- **User messages**: right-aligned, amber background
- **AI messages**: left-aligned, dark translucent background with backdrop blur
- **System messages**: centered, subtle styling
- Auto-scrolls to the latest message
- Capped at 100 messages per session
- Collapses to a floating badge showing unread message count

### 3.8 Session Management

- Single "Start Session" button on the start screen
- Automatic camera and microphone permission requests on session start
- Connection status indicator: Ready → Connecting → Live → Error
- Screen wake lock keeps the display on during active sessions
- Clean teardown on session end: disconnects WebSocket, stops camera, stops audio capture and playback, releases wake lock

## 4. User Interface

### 4.1 Start Screen

- Ironhand logo and app name
- "Your AI Electrician" tagline
- Full-width "Start Session" button (amber)
- Privacy disclaimer explaining camera and microphone usage

### 4.2 Session Screen

The session screen is a fullscreen camera view with overlaid controls:

- **Background**: Live camera feed fills the entire screen
- **Status Indicator** (top-left): Colored pill badge with pulsing dot showing connection state
- **Chat Overlay** (bottom, above controls): Scrollable transcript of the conversation, collapsible
- **Control Bar** (fixed bottom): Three circular buttons:
  - **Camera flip** — toggles between front and rear cameras
  - **Microphone** — mute toggle (amber = active, red = muted, blue = AI is speaking)
  - **End session** — red stop button, returns to start screen

### 4.3 Design System

| Token | Value | Usage |
|---|---|---|
| `charcoal` | `#1a1a2e` | Primary background |
| `amber-500` | `#ff9500` | Primary accent, active mic, start button |
| `amber-600` | `#e68600` | Hover states |
| `electric-blue` | `#0066ff` | AI speaking indicator |
| `danger` | `#ff3b30` | Errors, muted state, end session |
| `green-500` | (Tailwind) | Live connection status |

- Glassmorphism effects: backdrop blur with semi-transparent backgrounds
- Safe area inset support for notched mobile devices (iPhone, etc.)
- Custom thin scrollbar for chat messages

## 5. Technical Architecture

### 5.1 Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS |
| AI Model | Google Gemini 2.5 Flash (native audio preview) |
| AI API | Gemini Multimodal Live API (WebSocket) |
| AI Voice | Enceladus (Gemini prebuilt voice) |
| Deployment | Vercel (static SPA + serverless function) |

### 5.2 API Key Security

The Gemini API key is never exposed to the client:

1. Key stored as a server-side environment variable (`GEMINI_KEY`)
2. Client requests key from `/api/session` (Vercel serverless function)
3. Key validated with a preflight REST call to Google's API before opening the WebSocket
4. WebSocket connection established with the validated key

### 5.3 Data Flow

```
User speaks → Mic (16kHz PCM) → base64 encode → WebSocket → Gemini
Camera frame → JPEG (1fps, 768px) → base64 encode → WebSocket → Gemini
Gemini → Audio response (24kHz PCM) → Web Audio API → Device speakers
Gemini → Speech transcriptions → Chat overlay UI
```

### 5.4 PWA Support

- Web app manifest (`manifest.json`) with standalone display mode
- App icons at 192px and 512px
- Theme color matches app dark background (`#1a1a2e`)

## 6. Guardrails and Safety

The AI enforces the following boundaries:

- **Will not guide unlicensed users** through work that requires a licensed electrician — advises hiring a professional instead
- **Will not assume what's not visible** — anything behind walls, in conduit, or otherwise out of view must be verified by the user
- **Will not diagnose energized equipment from video alone** — always recommends proper testing with meters and testers
- **Will not override local authority** — defers to the Authority Having Jurisdiction (AHJ) on local amendments
- **Confirms de-energization** before guiding any work on electrical equipment
- **Never guesses** on wire sizing, breaker ratings, or load calculations — asks the user to verify if it can't determine from the camera feed
