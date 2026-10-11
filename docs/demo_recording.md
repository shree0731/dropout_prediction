# Demo Recording Guide & Video Asset Specifications

This guide provides instructions and recording guidelines for the project owner to produce the official "See it working" demonstration video for the landing page.

---

## 1. Recording Overview

- **Target Duration:** Approximately 35 seconds
- **Resolution:** 1280×720 (720p, 16:9)
- **Audio:** None (strictly no audio track, browser video tag is muted)
- **Target File Size:** At most 8 MB per output file
- **Reference Recording on Local System:**
  `"C:\Users\shree\Videos\Screen Recordings\Screen Recording 2026-10-11 222107.mp4"`

---

## 2. 35-Second Shot List

| Section | Target Screen | Actions & Visual Focus |
|---|---|---|
| **Shot 1** (~12s) | **Predict Page** (`/predict`) | 1. Select a pre-configured demo student profile from the selector.<br>2. Submit the form.<br>3. Show the instant risk classification (e.g. High Risk badge), calibrated probability distribution, and top feature drivers (e.g. attendance decay, backlog count). |
| **Shot 2** (~15s) | **Chatbot Counselor** (`/chat`) | 1. Show the bot's proactive friendly check-in.<br>2. Ask a normal academic question (e.g. attendance criteria / credit requirements).<br>3. Request a mentor meeting appointment.<br><br>*Pacing requirement:* Messages must appear one at a time as in the live application: student's message → typing indicator → bot's reply. Do not speed up or cut between messages; wait ~1 second after each reply. |
| **Shot 3** (~8s) | **ERP Mentor Inbox** (`/mentor-inbox`) | Switch to the ERP mentor portal view showing the newly logged `MeetingRequest` arriving in real time. |

---

## 3. Privacy, Safety & Recording Guidelines

- **No Crisis Messages:** Do not trigger crisis or helpline flows during the recorded demo.
- **No Real Names or PII:** Use only synthetic or anonymised student profiles.
- **No Secrets:** Never reveal `.env`, API keys, MongoDB connection strings, or system paths.
- **Clean Browser Frame:** Hide browser bookmarks bar, debug consoles, and unnecessary desktop notifications.

---

## 4. Video Encoding Commands

After capturing your screen recording (e.g., `in.mp4`), use the following commands to encode the production video assets:

### A. MP4 (Universal H.264 Fallback)
```bash
ffmpeg -i in.mp4 -vf scale=1280:-2 -an -c:v libx264 -crf 28 -preset slow -movflags +faststart frontend/public/demo/demo.mp4
```

### B. WebM (Modern VP9)
```bash
ffmpeg -i in.mp4 -vf scale=1280:-2 -an -c:v libvpx-vp9 -b:v 1000k -crf 32 -quality good -speed 2 frontend/public/demo/demo.webm
```

### C. Poster Image (Static Frame)
```bash
ffmpeg -ss 00:00:02 -i in.mp4 -vframes 1 -q:v 2 frontend/public/demo/poster.jpg
```

---

## 5. Deployment & Git Policy

- Do not commit large binary videos to the git repository.
- A placeholder `.gitkeep` is placed in `frontend/public/demo/.gitkeep`.
- The `DemoVideo.jsx` component includes automatic error recovery: if the video files are missing on a deployment environment, the entire demo section gracefully unmounts so no broken players or empty frames are shown.
