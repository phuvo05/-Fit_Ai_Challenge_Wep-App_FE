import { useState, useRef, useCallback, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';

// Types
export interface Keypoint {
  x: number;
  y: number;
  score?: number;
  name?: string;
}

export interface Pose {
  keypoints: Keypoint[];
  score?: number;
}

export type PushUpState = 'TOP' | 'DOWN' | 'TRANSITION_DOWN' | 'TRANSITION_UP' | 'UNKNOWN';

export interface PushUpMetrics {
  reps: number;
  state: PushUpState;
  pace: number; // reps per minute
  elapsed: number; // seconds
  qualityScore: number; // 0-100
  lastRepDuration: number; // ms
}

interface UsePushUpCounterReturn {
  metrics: PushUpMetrics;
  isModelReady: boolean;
  isProcessing: boolean;
  error: string | null;
  startProcessing: () => void;
  stopProcessing: () => void;
  resetCounter: () => void;
  processFrame: (video: HTMLVideoElement) => Promise<void>;
}

// Configuration
const ELBOW_ANGLE_TOP_THRESHOLD = 160; // degrees
const ELBOW_ANGLE_DOWN_THRESHOLD = 90; // degrees
const DEPTH_THRESHOLD = 0.15; // normalized vertical displacement
const MIN_CONFIDENCE = 0.3;
const MIN_TIME_AT_BOTTOM = 200; // ms
const DEBOUNCE_TIME = 300; // ms between reps
const SMOOTHING_WINDOW = 5;

export const usePushUpCounter = (): UsePushUpCounterReturn => {
  const [metrics, setMetrics] = useState<PushUpMetrics>({
    reps: 0,
    state: 'UNKNOWN',
    pace: 0,
    elapsed: 0,
    qualityScore: 0,
    lastRepDuration: 0,
  });

  const [isModelReady, setIsModelReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to avoid re-renders in processing loop
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const stateRef = useRef<PushUpState>('UNKNOWN');
  const repsRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const lastRepTimeRef = useRef<number | null>(null);
  const timeAtBottomRef = useRef<number | null>(null);
  const lastTransitionTimeRef = useRef<number>(0);
  const repTimesRef = useRef<number[]>([]);
  const elbowAnglesRef = useRef<number[]>([]);
  const depthValuesRef = useRef<number[]>([]);
  const qualityScoresRef = useRef<number[]>([]);

  // Initialize model
  useEffect(() => {
    let mounted = true;

    const loadModel = async () => {
      try {
        setError(null);
        
        // Set TensorFlow.js backend
        await tf.ready();
        await tf.setBackend('webgl');

        // Load MoveNet model
        const detectorConfig: poseDetection.MoveNetModelConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
        };

        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          detectorConfig
        );

        if (mounted) {
          detectorRef.current = detector;
          setIsModelReady(true);
        }
      } catch (err) {
        if (mounted) {
          setError(`Failed to load pose detection model: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
    };

    loadModel();

    return () => {
      mounted = false;
      if (detectorRef.current) {
        detectorRef.current.dispose?.();
        detectorRef.current = null;
      }
    };
  }, []);

  // Helper: Calculate angle between three points
  const calculateAngle = (a: Keypoint, b: Keypoint, c: Keypoint): number => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) {
      angle = 360.0 - angle;
    }
    return angle;
  };

  // Helper: Get keypoint by name
  const getKeypoint = (keypoints: Keypoint[], name: string): Keypoint | null => {
    const point = keypoints.find((kp) => kp.name === name);
    if (!point || (point.score && point.score < MIN_CONFIDENCE)) {
      return null;
    }
    return point;
  };

  // Helper: Calculate normalized depth (shoulder displacement relative to frame height)
  const calculateDepth = (shoulder: Keypoint, reference: Keypoint): number => {
    return Math.abs(shoulder.y - reference.y);
  };

  // Helper: Smooth values using rolling average
  const smooth = (values: number[], newValue: number): number => {
    values.push(newValue);
    if (values.length > SMOOTHING_WINDOW) {
      values.shift();
    }
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  };

  // Process a single frame
  const processFrame = useCallback(
    async (video: HTMLVideoElement) => {
      if (!detectorRef.current || !isProcessing) return;

      try {
        const poses = await detectorRef.current.estimatePoses(video);
        
        if (poses.length === 0) {
          stateRef.current = 'UNKNOWN';
          return;
        }

        const pose = poses[0];
        const keypoints = pose.keypoints;

        // Get required keypoints
        const leftShoulder = getKeypoint(keypoints, 'left_shoulder');
        const rightShoulder = getKeypoint(keypoints, 'right_shoulder');
        const leftElbow = getKeypoint(keypoints, 'left_elbow');
        const rightElbow = getKeypoint(keypoints, 'right_elbow');
        const leftWrist = getKeypoint(keypoints, 'left_wrist');
        const rightWrist = getKeypoint(keypoints, 'right_wrist');
        const leftHip = getKeypoint(keypoints, 'left_hip');
        const rightHip = getKeypoint(keypoints, 'right_hip');

        if (
          !leftShoulder ||
          !rightShoulder ||
          !leftElbow ||
          !rightElbow ||
          !leftWrist ||
          !rightWrist ||
          !leftHip ||
          !rightHip
        ) {
          stateRef.current = 'UNKNOWN';
          return;
        }

        // Calculate elbow angles (average of both arms)
        const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
        const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
        const avgElbowAngle = smooth(elbowAnglesRef.current, (leftElbowAngle + rightElbowAngle) / 2);

        // Calculate depth (shoulder vertical displacement)
        const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
        const avgHipY = (leftHip.y + rightHip.y) / 2;
        const depth = smooth(depthValuesRef.current, calculateDepth({ y: avgShoulderY } as Keypoint, { y: avgHipY } as Keypoint));

        const now = Date.now();
        const currentState = stateRef.current;

        // State machine logic
        if (avgElbowAngle > ELBOW_ANGLE_TOP_THRESHOLD && depth < DEPTH_THRESHOLD) {
          // At TOP position
          if (currentState === 'TRANSITION_UP' && now - lastTransitionTimeRef.current > DEBOUNCE_TIME) {
            // Complete a rep
            if (timeAtBottomRef.current && now - timeAtBottomRef.current > MIN_TIME_AT_BOTTOM) {
              repsRef.current += 1;
              const repDuration = lastRepTimeRef.current ? now - lastRepTimeRef.current : 0;
              repTimesRef.current.push(repDuration);
              lastRepTimeRef.current = now;

              // Calculate quality score based on form
              const formScore = Math.min(100, ((leftElbowAngle + rightElbowAngle) / 2) * 0.5);
              qualityScoresRef.current.push(formScore);

              // Update metrics
              updateMetrics();
            }
            timeAtBottomRef.current = null;
          }
          stateRef.current = 'TOP';
          lastTransitionTimeRef.current = now;
        } else if (avgElbowAngle < ELBOW_ANGLE_DOWN_THRESHOLD && depth > DEPTH_THRESHOLD) {
          // At DOWN position
          if (currentState === 'TOP' || currentState === 'TRANSITION_DOWN') {
            if (!timeAtBottomRef.current) {
              timeAtBottomRef.current = now;
            }
            stateRef.current = 'TRANSITION_UP';
          } else {
            stateRef.current = 'DOWN';
          }
          lastTransitionTimeRef.current = now;
        } else if (currentState === 'TOP' && avgElbowAngle < ELBOW_ANGLE_TOP_THRESHOLD) {
          // Transitioning from TOP to DOWN
          stateRef.current = 'TRANSITION_DOWN';
        }

        // Periodic metrics update (not every frame to avoid re-renders)
        if (now - (startTimeRef.current || 0) > 500) {
          updateMetrics();
        }
      } catch (err) {
        console.error('Error processing frame:', err);
      }
    },
    [isProcessing]
  );

  // Update metrics state
  const updateMetrics = () => {
    const now = Date.now();
    const elapsed = startTimeRef.current ? (now - startTimeRef.current) / 1000 : 0;
    const pace = elapsed > 0 ? (repsRef.current / elapsed) * 60 : 0;
    const avgQuality =
      qualityScoresRef.current.length > 0
        ? qualityScoresRef.current.reduce((sum, val) => sum + val, 0) / qualityScoresRef.current.length
        : 0;
    const lastRepDuration =
      repTimesRef.current.length > 0 ? repTimesRef.current[repTimesRef.current.length - 1] : 0;

    setMetrics({
      reps: repsRef.current,
      state: stateRef.current,
      pace: Math.round(pace * 10) / 10,
      elapsed: Math.round(elapsed),
      qualityScore: Math.round(avgQuality),
      lastRepDuration,
    });
  };

  const startProcessing = useCallback(() => {
    if (!isModelReady) {
      setError('Model is not ready yet');
      return;
    }

    setIsProcessing(true);
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
      lastRepTimeRef.current = Date.now();
    }
  }, [isModelReady]);

  const stopProcessing = useCallback(() => {
    setIsProcessing(false);
  }, []);

  const resetCounter = useCallback(() => {
    repsRef.current = 0;
    stateRef.current = 'UNKNOWN';
    startTimeRef.current = null;
    lastRepTimeRef.current = null;
    timeAtBottomRef.current = null;
    lastTransitionTimeRef.current = 0;
    repTimesRef.current = [];
    elbowAnglesRef.current = [];
    depthValuesRef.current = [];
    qualityScoresRef.current = [];

    setMetrics({
      reps: 0,
      state: 'UNKNOWN',
      pace: 0,
      elapsed: 0,
      qualityScore: 0,
      lastRepDuration: 0,
    });
  }, []);

  return {
    metrics,
    isModelReady,
    isProcessing,
    error,
    startProcessing,
    stopProcessing,
    resetCounter,
    processFrame,
  };
};
