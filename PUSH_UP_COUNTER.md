# Push-Up Counter Feature

## Overview
A production-ready AI-powered push-up counter that uses TensorFlow.js and MoveNet pose detection to automatically count push-up repetitions from uploaded video files.

## Features

### 1. Video Upload & Preview
- Drag-and-drop or browse to upload video files (MP4, WebM, MOV)
- File validation (type and size up to 100MB)
- Video playback controls (play, pause, seek, playback rate)
- Clean, responsive video player interface

### 2. AI-Powered Pose Detection
- Uses TensorFlow.js MoveNet Lightning model for fast pose estimation
- Runs entirely client-side (no server required)
- Processes video frames at ~15 FPS for optimal performance
- Automatic model loading with loading indicators

### 3. Intelligent Rep Counting
- **State Machine Logic**: Tracks push-up states (TOP, DOWN, TRANSITION_DOWN, TRANSITION_UP)
- **Robust Detection**: Uses elbow angle and shoulder depth analysis
- **Debouncing**: Prevents false positives and double-counting
- **Quality Filtering**: Requires minimum time at bottom position before counting
- **Smoothing**: Rolling average filter to reduce jitter

### 4. Real-Time Metrics
- **Total Reps**: Live counter with smooth animations
- **Pace**: Reps per minute calculation
- **Elapsed Time**: Total session duration
- **Quality Score**: Form analysis (0-100 scale)
- **Current State**: Visual indicator of push-up position

### 5. Accessibility
- Keyboard-accessible controls
- ARIA live regions for screen reader announcements
- Clear visual feedback for all states
- Error messages with helpful guidance

## Project Structure

```
src/
├── pages/
│   └── PushUpCounter.tsx          # Main page component
├── hooks/
│   └── usePushUpCounter.ts        # Custom hook for pose detection & counting
├── components/
│   ├── video/
│   │   └── VideoPlayer.tsx        # Reusable video upload & player
│   ├── metrics/
│   │   └── MetricCard.tsx         # Stat display card
│   └── canvas/
│       └── PoseOverlay.tsx        # Pose skeleton overlay (optional)
└── router/
    └── index.tsx                  # Router configuration (updated)
```

## Route

**URL**: `/counter/push-up`

**Access**: Protected route (requires authentication)

## Technologies

- **React 18** with TypeScript
- **TensorFlow.js** for pose estimation
- **@tensorflow-models/pose-detection** with MoveNet Lightning
- **Framer Motion** for animations
- **Tailwind CSS** for styling
- **Lucide React** for icons

## Usage

1. **Navigate to the page**: Visit `/counter/push-up` in the app
2. **Upload a video**: Drag-and-drop or browse for a video file
3. **Play the video**: Click play and ensure your full body is visible
4. **Start counting**: Click "Start Counting" to begin pose detection
5. **View metrics**: Watch the live counter and metrics update in real-time
6. **Reset**: Use "Reset Counter" to start a new session

## Algorithm Details

### Push-Up Detection Logic

The counter uses a state machine with the following states:

1. **TOP**: Arms extended, elbows > 160°, minimal shoulder depth
2. **TRANSITION_DOWN**: Moving from top to bottom position
3. **DOWN**: Elbows flexed < 90°, maximum shoulder depth
4. **TRANSITION_UP**: Pushing back up from bottom
5. **UNKNOWN**: No pose detected or unclear position

**Rep Counting**: A complete rep is counted when transitioning from TOP → DOWN → TOP with:
- Minimum time at bottom position (200ms)
- Debounce time between reps (300ms)
- Confidence threshold for all keypoints (30%)

### Smoothing & Filtering

- **Rolling Average**: Smooths angle and depth values over 5 frames
- **Confidence Filtering**: Ignores low-confidence keypoints
- **State Debouncing**: Prevents rapid state changes from noise

## Performance Optimizations

1. **Code Splitting**: TensorFlow.js models loaded on-demand
2. **Ref-based Processing**: Avoids re-renders during frame processing
3. **RequestAnimationFrame**: Efficient processing loop synchronized with video
4. **WebGL Backend**: GPU acceleration for pose estimation
5. **Cleanup**: Proper resource disposal on unmount

## Browser Compatibility

- Chrome/Edge 90+ (recommended)
- Firefox 88+
- Safari 14+

**Note**: WebGL support required for optimal performance

## Future Enhancements

- [ ] Export workout session data
- [ ] Compare multiple videos side-by-side
- [ ] Live camera support for real-time counting
- [ ] Additional exercises (squats, lunges, etc.)
- [ ] Historical tracking and progress charts
- [ ] Form feedback with specific recommendations

## Testing

The feature includes:
- TypeScript type safety throughout
- Error handling for file upload, model loading, and processing
- Responsive design tested on mobile and desktop
- Keyboard navigation support

## Dependencies Added

```json
{
  "@tensorflow/tfjs": "^4.x.x",
  "@tensorflow-models/pose-detection": "^2.x.x"
}
```

## Notes

- Video processing is CPU/GPU intensive; performance may vary by device
- Large video files may take time to load; 100MB limit enforced
- Best results with videos where the full body is clearly visible
- Good lighting and contrast improve pose detection accuracy

---

Built with ❤️ for the Fit AI Challenge Web App
