# Open Journal

A digital safe space for journaling and peer support with AI-guided prompts and inclusive collaborative communities.

## Digital Safe Spaces & Mental Health Support

Open Journal creates **inclusive platforms for anonymous peer support** and **guided journaling experiences** that align with digital mental health initiatives:

- **Safe Journaling Spaces** - Private entries with optional AI-powered supportive prompts
- **Anonymous Peer Communities** - Collaborative spaces for shared experiences and mutual support
- **Free-form & Guided Journaling** - Write freely or use AI-generated prompts for reflection and wellness
- **Moderated Community Spaces** - Creator-controlled environments for focused peer support
- **Supportive Social Features** - Encouraging interactions through comments and positive reinforcement

## Features

### Personal Journaling
- Private & public entries
- AI-powered writing prompts (Gemini AI)
- Rich text editor with image uploads
- Smart tagging system

### Collaborative Spaces
- Create communities around shared interests
- Space-specific posts and discussions
- Member management with invite codes
- Creator controls

### Social Features
- Activity feed for public posts
- Comments and stars on entries
- User profiles and achievements

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Firebase (Firestore, Auth)
- **AI**: Google Gemini API
- **Build**: Vite

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment setup:**
   Get Gemini API key from [Google AI Studio](https://ai.google.dev/)
   
   Create `.env.local`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Run locally:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173)

## Project Structure

```
src/
├── components/     # React components
├── services/      # Firebase and AI services
├── types.ts      # TypeScript definitions
└── constants.ts  # App constants
```