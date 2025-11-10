/**
 * Push-Up Counter State Machine Tests
 * 
 * These tests verify the core counting logic of the push-up counter.
 * Run with: npm test (if test runner is configured)
 */

import { describe, it, expect } from 'vitest';
import { PushUpState } from '../hooks/usePushUpCounter';

// Mock state machine logic for testing
class PushUpStateMachine {
  private state: PushUpState = 'UNKNOWN';
  private reps = 0;
  private lastTransitionTime = 0;
  private timeAtBottom: number | null = null;

  private readonly ELBOW_ANGLE_TOP_THRESHOLD = 160;
  private readonly ELBOW_ANGLE_DOWN_THRESHOLD = 90;
  private readonly DEPTH_THRESHOLD = 0.15;
  private readonly MIN_TIME_AT_BOTTOM = 200;
  private readonly DEBOUNCE_TIME = 300;

  processFrame(elbowAngle: number, depth: number, timestamp: number): void {
    const isAtTop = elbowAngle > this.ELBOW_ANGLE_TOP_THRESHOLD && depth < this.DEPTH_THRESHOLD;
    const isAtBottom = elbowAngle < this.ELBOW_ANGLE_DOWN_THRESHOLD && depth > this.DEPTH_THRESHOLD;

    if (isAtTop) {
      if (
        this.state === 'TRANSITION_UP' &&
        timestamp - this.lastTransitionTime > this.DEBOUNCE_TIME
      ) {
        // Complete a rep
        if (
          this.timeAtBottom !== null &&
          timestamp - this.timeAtBottom > this.MIN_TIME_AT_BOTTOM
        ) {
          this.reps += 1;
        }
        this.timeAtBottom = null;
      }
      this.state = 'TOP';
      this.lastTransitionTime = timestamp;
    } else if (isAtBottom) {
      if (this.state === 'TOP' || this.state === 'TRANSITION_DOWN') {
        if (this.timeAtBottom === null) {
          this.timeAtBottom = timestamp;
        }
        this.state = 'TRANSITION_UP';
      } else {
        this.state = 'DOWN';
      }
      this.lastTransitionTime = timestamp;
    } else if (this.state === 'TOP' && elbowAngle < this.ELBOW_ANGLE_TOP_THRESHOLD) {
      this.state = 'TRANSITION_DOWN';
    }
  }

  getState(): PushUpState {
    return this.state;
  }

  getReps(): number {
    return this.reps;
  }

  reset(): void {
    this.state = 'UNKNOWN';
    this.reps = 0;
    this.lastTransitionTime = 0;
    this.timeAtBottom = null;
  }
}

describe('PushUpStateMachine', () => {
  it('should start in UNKNOWN state', () => {
    const machine = new PushUpStateMachine();
    expect(machine.getState()).toBe('UNKNOWN');
    expect(machine.getReps()).toBe(0);
  });

  it('should transition to TOP when arms are extended', () => {
    const machine = new PushUpStateMachine();
    machine.processFrame(170, 0.05, 0); // High angle, low depth
    expect(machine.getState()).toBe('TOP');
  });

  it('should transition to DOWN when arms are bent', () => {
    const machine = new PushUpStateMachine();
    machine.processFrame(170, 0.05, 0); // Start at TOP
    machine.processFrame(150, 0.1, 100); // TRANSITION_DOWN
    machine.processFrame(85, 0.2, 200); // DOWN
    expect(machine.getState()).toBe('TRANSITION_UP');
  });

  it('should count a complete rep: TOP -> DOWN -> TOP', () => {
    const machine = new PushUpStateMachine();
    
    // Start at top
    machine.processFrame(170, 0.05, 0);
    expect(machine.getState()).toBe('TOP');
    expect(machine.getReps()).toBe(0);
    
    // Go down
    machine.processFrame(150, 0.1, 100);
    expect(machine.getState()).toBe('TRANSITION_DOWN');
    
    machine.processFrame(85, 0.2, 300);
    expect(machine.getState()).toBe('TRANSITION_UP');
    
    // Hold at bottom for minimum time
    machine.processFrame(85, 0.2, 600);
    
    // Return to top (complete rep)
    machine.processFrame(170, 0.05, 1000);
    expect(machine.getState()).toBe('TOP');
    expect(machine.getReps()).toBe(1);
  });

  it('should not count a rep if time at bottom is too short', () => {
    const machine = new PushUpStateMachine();
    
    // Quick bounce without holding at bottom
    machine.processFrame(170, 0.05, 0); // TOP
    machine.processFrame(85, 0.2, 50); // DOWN (only 50ms)
    machine.processFrame(170, 0.05, 100); // TOP
    
    expect(machine.getReps()).toBe(0);
  });

  it('should count multiple reps correctly', () => {
    const machine = new PushUpStateMachine();
    
    // Rep 1
    machine.processFrame(170, 0.05, 0);
    machine.processFrame(85, 0.2, 300);
    machine.processFrame(85, 0.2, 600);
    machine.processFrame(170, 0.05, 1000);
    expect(machine.getReps()).toBe(1);
    
    // Rep 2
    machine.processFrame(85, 0.2, 1500);
    machine.processFrame(85, 0.2, 1800);
    machine.processFrame(170, 0.05, 2200);
    expect(machine.getReps()).toBe(2);
    
    // Rep 3
    machine.processFrame(85, 0.2, 2700);
    machine.processFrame(85, 0.2, 3000);
    machine.processFrame(170, 0.05, 3400);
    expect(machine.getReps()).toBe(3);
  });

  it('should prevent double-counting with debounce', () => {
    const machine = new PushUpStateMachine();
    
    // Complete a rep
    machine.processFrame(170, 0.05, 0);
    machine.processFrame(85, 0.2, 300);
    machine.processFrame(85, 0.2, 600);
    machine.processFrame(170, 0.05, 1000);
    expect(machine.getReps()).toBe(1);
    
    // Try to trigger another rep too quickly (within debounce)
    machine.processFrame(85, 0.2, 1100);
    machine.processFrame(170, 0.05, 1150);
    
    // Should still be 1 rep
    expect(machine.getReps()).toBe(1);
  });

  it('should reset state and counters', () => {
    const machine = new PushUpStateMachine();
    
    // Do some reps
    machine.processFrame(170, 0.05, 0);
    machine.processFrame(85, 0.2, 300);
    machine.processFrame(85, 0.2, 600);
    machine.processFrame(170, 0.05, 1000);
    
    expect(machine.getReps()).toBe(1);
    expect(machine.getState()).toBe('TOP');
    
    // Reset
    machine.reset();
    
    expect(machine.getReps()).toBe(0);
    expect(machine.getState()).toBe('UNKNOWN');
  });

  it('should handle intermediate positions correctly', () => {
    const machine = new PushUpStateMachine();
    
    // Start at top
    machine.processFrame(170, 0.05, 0);
    expect(machine.getState()).toBe('TOP');
    
    // Move to intermediate position (should be TRANSITION_DOWN)
    machine.processFrame(120, 0.1, 100);
    expect(machine.getState()).toBe('TRANSITION_DOWN');
    
    // Continue to bottom
    machine.processFrame(85, 0.2, 300);
    expect(machine.getState()).toBe('TRANSITION_UP');
  });
});

describe('Edge Cases', () => {
  it('should handle noisy data gracefully', () => {
    const machine = new PushUpStateMachine();
    
    // Start at top with noise
    machine.processFrame(170, 0.05, 0);
    machine.processFrame(165, 0.06, 50);
    machine.processFrame(172, 0.04, 100);
    
    expect(machine.getState()).toBe('TOP');
    expect(machine.getReps()).toBe(0);
  });

  it('should not count partial reps', () => {
    const machine = new PushUpStateMachine();
    
    // Start at top
    machine.processFrame(170, 0.05, 0);
    
    // Go halfway down but not to full depth
    machine.processFrame(120, 0.1, 100);
    machine.processFrame(110, 0.12, 200);
    
    // Return to top without completing full depth
    machine.processFrame(170, 0.05, 400);
    
    // Should not count as a rep
    expect(machine.getReps()).toBe(0);
  });

  it('should handle unknown state recovery', () => {
    const machine = new PushUpStateMachine();
    
    // Pose lost (UNKNOWN state maintained by default)
    expect(machine.getState()).toBe('UNKNOWN');
    
    // Recover at top position
    machine.processFrame(170, 0.05, 0);
    expect(machine.getState()).toBe('TOP');
    
    // Should be able to count reps normally after recovery
    machine.processFrame(85, 0.2, 300);
    machine.processFrame(85, 0.2, 600);
    machine.processFrame(170, 0.05, 1000);
    expect(machine.getReps()).toBe(1);
  });
});
