# LEVEL Flex Space — Interactive Design Brief

## What is this?

An interactive design brief where the prototype IS the brief. Team members click annotated hotspots on the live prototype to review specs, vote on design questions, and leave comments. Answers update the prototype in real-time.

## Team Members

- **Joe** (Founder)
- **Designer** (Design Lead)  
- **Segev** (Co-Founder)
- **Toni** (Developer)
- **Marcin** (Product)

## Features

- **Dynamic Preview** — voting on a design question instantly updates the prototype (hover styles, button colours, layout ratios, etc.)
- **Multi-User Voting** — each team member sees who voted for what (coloured avatar dots on options)
- **Comments** — threaded comments per section with timestamps
- **Persistence** — answers save to localStorage immediately + Netlify Blobs for shared state
- **Export** — download all team votes and comments as a text file

## Deploy to Netlify

### Option 1: Drag & Drop (quickest)
This won't include the API function, but the app works fully with localStorage.

1. Zip the project folder
2. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
3. Drag the zip file
4. Done — share the URL with your team

### Option 2: Git Deploy (recommended — includes shared storage)

```bash
# 1. Initialise git
cd level-brief
git init
git add .
git commit -m "initial"

# 2. Push to GitHub
# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/level-brief.git
git branch -M main
git push -u origin main

# 3. Connect to Netlify
# Go to app.netlify.com → Add new site → Import from Git
# Select your repo → Deploy
```

Netlify will automatically:
- Install dependencies (`@netlify/blobs`)
- Deploy the function at `/api/answers`
- Serve `index.html` as the site

### Option 3: Netlify CLI

```bash
npm install -g netlify-cli
cd level-brief
npm install
netlify deploy --prod
```

## How It Works

### Storage

| Layer | Purpose | Scope |
|-------|---------|-------|
| `localStorage` | Instant persistence | Per user, per browser |
| `Netlify Blobs` | Shared team data | All users, survives deploys |

When a user votes or comments:
1. Saved to `localStorage` immediately (no latency)
2. POST to `/api/answers` in background (syncs to Netlify Blobs)
3. On login, GET `/api/answers` loads everyone's data

If the API isn't available (e.g., drag-drop deploy), everything still works via localStorage — users just won't see each other's votes until export.

## Customising Team Members

Edit the `TEAM` array at the top of `index.html`:

```js
const TEAM = [
  { name: "Joe", role: "Founder", color: "#FFD643" },
  { name: "Designer", role: "Design Lead", color: "#7EC8E3" },
  // Add or change names here
];
```

## File Structure

```
level-brief/
├── index.html              ← The full app (prototype + brief + voting)
├── package.json            ← Dependencies for Netlify Functions
├── netlify.toml            ← Build & redirect config
├── README.md               ← This file
└── netlify/
    └── functions/
        └── answers.mjs     ← API: read/write team answers via Netlify Blobs
```
