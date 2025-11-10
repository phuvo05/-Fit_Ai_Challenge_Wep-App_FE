# Push-Up Counter - Quick Start Guide

## Accessing the Feature

1. **Login to your account** (the feature is protected and requires authentication)
2. **Navigate to the Push-Up Counter**:
   - Click "Push-Up Counter" in the navigation menu, OR
   - Visit `/#/counter/push-up` directly

## Step-by-Step Usage

### 1. Upload Your Video

**Option A: Drag and Drop**
- Drag a video file from your computer
- Drop it onto the upload area

**Option B: Browse Files**
- Click the "Browse Files" button
- Select a video file from your computer

**Supported Formats:**
- MP4 (.mp4)
- WebM (.webm)
- QuickTime (.mov)

**Requirements:**
- Maximum file size: 100MB
- Full body must be visible in the frame
- Good lighting for best results

### 2. Wait for Model Loading

- The AI model loads automatically (takes a few seconds)
- You'll see "Model Ready" when it's loaded
- A green indicator shows the model is ready

### 3. Play Your Video

- Click the **Play** button on the video player
- Use the seek bar to jump to specific timestamps
- Adjust playback speed (0.5x, 1x, 1.5x, 2x) if needed

### 4. Start Counting

- While the video is playing, click **"Start Counting"**
- The AI will begin analyzing your push-ups
- Watch the metrics update in real-time

### 5. View Your Results

**Metrics Displayed:**
- **Push-Ups**: Total repetitions counted
- **Pace**: Reps per minute
- **Time**: Elapsed time in seconds
- **Quality**: Form score (0-100)
- **Current State**: Your position (At Top, Going Down, At Bottom, Pushing Up)

### 6. Control Your Session

**Stop Counting**: Click "Stop Counting" to pause the analysis

**Reset Counter**: Click "Reset Counter" to start fresh (keeps the video loaded)

**Clear Video**: Click the X button to remove the video and upload a new one

## Tips for Best Results

### Video Recording Tips

1. **Camera Position**: Place camera at waist height, 6-8 feet away
2. **Framing**: Include full body from head to feet
3. **Angle**: Film from the side for best elbow angle detection
4. **Lighting**: Ensure good, even lighting
5. **Background**: Use a plain background for better detection
6. **Clothing**: Wear form-fitting clothing for better keypoint detection

### What Counts as a Rep?

A push-up is counted when you:
1. Start with arms fully extended (TOP position)
2. Lower your body with elbows flexed below 90° (DOWN position)
3. Hold at the bottom for at least 200ms
4. Push back up to fully extended arms (return to TOP)

### Common Issues

**"No pose detected"**
- Ensure your full body is visible in the frame
- Check that lighting is adequate
- Move closer to the camera if too far away

**"Reps not counting"**
- Make sure you're going deep enough (elbows < 90°)
- Hold at the bottom position briefly (200ms minimum)
- Fully extend arms at the top position
- Don't rush between reps (300ms minimum between reps)

**"Low quality score"**
- Keep your body straight (plank position)
- Lower your chest closer to the ground
- Fully extend arms at the top
- Maintain consistent form throughout

**"Video playback issues"**
- Try a smaller video file (under 100MB)
- Use a supported format (MP4, WebM, MOV)
- Check browser compatibility (Chrome/Edge recommended)

## Keyboard Shortcuts

- **Space**: Play/Pause video (when video has focus)
- **Tab**: Navigate between controls
- **Enter**: Activate focused button

## Performance Notes

- The AI runs in your browser (no data sent to servers)
- Processing requires a modern GPU for best performance
- Expect ~15 FPS processing rate
- Slower devices may experience lag with large videos

## Example Workflow

```
1. Record a video of yourself doing push-ups
2. Login to Fit AI Challenge
3. Go to Push-Up Counter page
4. Upload your video
5. Wait for "Model Ready"
6. Press Play on the video
7. Click "Start Counting"
8. Watch the metrics update
9. Review your results
10. Try again to improve your form and pace!
```

## Privacy & Data

- All processing happens locally in your browser
- Videos are never uploaded to any server
- No data is stored or transmitted
- Video is cleared from memory when you close/refresh the page

## Technical Requirements

**Browser:**
- Chrome 90+ (recommended)
- Edge 90+
- Firefox 88+
- Safari 14+

**Device:**
- WebGL-capable GPU
- 4GB+ RAM recommended
- Modern processor (2015 or newer)

**Connection:**
- First load requires internet (to download AI model)
- Offline after model is cached

## Need Help?

If you encounter issues:
1. Check browser console for error messages
2. Try a different video
3. Reload the page
4. Clear browser cache
5. Try a different browser

## Future Features (Coming Soon)

- Live camera support
- Export workout data
- Historical progress tracking
- Form feedback and tips
- Additional exercises (squats, lunges)
- Side-by-side video comparison

---

**Happy Training! 💪**

*Built with AI-powered pose detection using TensorFlow.js*
