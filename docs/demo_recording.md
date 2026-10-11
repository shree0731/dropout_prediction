# Demo Recording Guide & Video Assets

This guide specifies the target walkthrough video for the AI Student Dropout Prediction system. The video showcases the complete proactive intervention workflow across all core modules.

---

## 1. 35-Second Shot List

| Timestamp | Screen / Route | Action & Visual Focus |
|---|---|---|
| **00:00 – 00:06** | **Hero & Overview** (`/`) | Slow cursor sweep over the editorial hero demonstrating dynamic photo parallax and alignment. Brief pause on the headline and dual-layer architecture highlights. |
| **00:06 – 00:14** | **Model Benchmarks** (`/metrics`) | Navigate to Model Dashboard. Highlight the 96.58% accuracy, 99.35% High-Risk Recall, 5-fold cross-validation metrics, ROC curves, and confusion matrix. |
| **00:14 – 00:25** | **Interactive Prediction** (`/predict`) | Navigate to Prediction Engine. Load an at-risk student preset (e.g., Year 2 mechanical engineering student with arrears and declining attendance). Click **Run Model Prediction**. Highlight the instant risk badge, risk probability gauges, and SHAP explainability waterfall breakdown showing primary drivers. |
| **00:25 – 00:35** | **Intervention Chatbot** (`/chat`) | Switch to Academic Support Counselor. Type an attendance policy inquiry ("What happens if attendance drops below 75%?"). Observe the grounded response with Anna University regulation citations and automated faculty mentor scheduling offer. |

---

## 2. Recording Specifications

- **Resolution:** 1920×1080 (1080p, 16:9) or 1280×720 (720p, 16:9)
- **Frame Rate:** 30 fps (or 60 fps for ultra-smooth parallax rendering)
- **Cursor:** Visible, smooth pointer movement (avoid jerky clicks)
- **Audio:** Optional ambient background or muted (browser video tag autoplays muted)
- **Output Target:** `frontend/public/demo/demo.webm` and `frontend/public/demo/demo.mp4`
- **Poster Image:** `frontend/public/demo/poster.jpg`

---

## 3. Encoding Commands (FFmpeg)

Place your raw recording (e.g., `recording_raw.mp4`) in the project root or scratch folder, then run:

### A. WebM (VP9 codec - optimized for modern web browsers)
```bash
ffmpeg -i recording_raw.mp4 \
  -c:v libvpx-vp9 -b:v 1200k -crf 30 -quality good -speed 2 \
  -an \
  frontend/public/demo/demo.webm
```

### B. MP4 (H.264 codec - universal mobile and legacy fallback)
```bash
ffmpeg -i recording_raw.mp4 \
  -c:v libx264 -preset slow -crf 22 -profile:v high -level 4.0 \
  -pix_fmt yuv420p -movflags +faststart \
  -an \
  frontend/public/demo/demo.mp4
```

### C. Poster Thumbnail (High-resolution frame capture at 2s mark)
```bash
ffmpeg -ss 00:00:02 -i recording_raw.mp4 \
  -frames:v 1 -q:v 2 \
  frontend/public/demo/poster.jpg
```

---

## 4. Graceful Fallback Behavior

The `DemoVideo.jsx` component includes automatic error recovery:
- If `demo.webm`, `demo.mp4`, or `poster.jpg` are missing or unreadable, the video section cleanly unmounts itself.
- No broken video controls, empty frames, or layout disruptions will ever be displayed to end users.
