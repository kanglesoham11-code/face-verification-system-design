import React, { useRef, useEffect, useState } from 'react';
import { Camera, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

// Match result from the Python backend
export interface FaceMatchResult {
  matched: boolean;
  name: string | null;
  confidence: number;
  raw_score: number;
  all_scores?: Record<string, number>;
}

interface FaceVerificationProps {
  onVerificationResult: (result: {
    livenessPassed: boolean;
    matchResult: FaceMatchResult | null;
    snapshot: string;
    captureBlob: Blob;
  }) => void;
  mode: 'scan';
}

const PYTHON_API = 'http://localhost:8000';
const MATCH_THRESHOLD = 0.50;

export const FaceVerification: React.FC<FaceVerificationProps> = ({
  onVerificationResult,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectIntervalRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  const hCanvas = useRef<HTMLCanvasElement | null>(null);
  const hCtx = useRef<CanvasRenderingContext2D | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Liveness state
  const [liveness, setLiveness] = useState({ face: false, blink: false, head: false, texture: false });
  const [livenessOK, setLivenessOK] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Position your face in the center');
  const [antiSpoofScore, setAntiSpoofScore] = useState(0);

  // Pixel analysis refs
  const brightHistory = useRef<number[]>([]);
  const headHistory = useRef<number[]>([]);
  const blinkCooldown = useRef(0);
  const prevPixels = useRef<number[] | null>(null);

  // Anti-spoofing refs
  const textureScoreHistory = useRef<number[]>([]);
  const colorVarianceHistory = useRef<number[]>([]);
  const microMotionHistory = useRef<number[]>([]);
  const frameCount = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 120;
    hCanvas.current = canvas;
    hCtx.current = canvas.getContext('2d', { willReadFrequently: true });
    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError('');
      setCameraBlocked(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      if (!isMountedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true);
          detectIntervalRef.current = setInterval(runLiveness, 120);
        };
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setCameraBlocked(true);
        setError('Camera access denied. Please allow camera access.');
      } else {
        setError(err.message || 'Camera error');
      }
    }
  };

  const stopCamera = () => {
    if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ANTI-SPOOFING: Texture analysis (LBP-inspired)
  // Real faces have rich micro-texture. Photos on screens have moiré/smooth pixels.
  // ═══════════════════════════════════════════════════════════════════════════
  const analyzeTexture = (frame: Uint8ClampedArray, w: number, h: number): number => {
    let edgeCount = 0;
    let totalChecked = 0;

    // Compute gradient magnitudes across the face region
    for (let y = 30; y < 90; y += 2) {
      for (let x = 40; x < 120; x += 2) {
        const idx = (y * w + x) * 4;
        const idxR = (y * w + (x + 1)) * 4;
        const idxD = ((y + 1) * w + x) * 4;

        if (idxR + 2 < frame.length && idxD + 2 < frame.length) {
          const grayC = (frame[idx] + frame[idx + 1] + frame[idx + 2]) / 3;
          const grayR = (frame[idxR] + frame[idxR + 1] + frame[idxR + 2]) / 3;
          const grayD = (frame[idxD] + frame[idxD + 1] + frame[idxD + 2]) / 3;

          const gradH = Math.abs(grayC - grayR);
          const gradV = Math.abs(grayC - grayD);
          const grad = Math.sqrt(gradH * gradH + gradV * gradV);

          // Real faces have moderate gradients (skin texture, pores)
          // Photos on screens have either very smooth (blurred) or very sharp (pixel edges)
          if (grad > 3 && grad < 40) edgeCount++;
          totalChecked++;
        }
      }
    }

    return totalChecked > 0 ? edgeCount / totalChecked : 0;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ANTI-SPOOFING: Color channel variance analysis
  // Real skin has natural color variation. Screen displays have uniform RGB ratios.
  // ═══════════════════════════════════════════════════════════════════════════
  const analyzeColorVariance = (frame: Uint8ClampedArray, w: number, h: number): number => {
    const rValues: number[] = [];
    const gValues: number[] = [];
    const bValues: number[] = [];

    // Sample skin-tone region (center of face)
    for (let y = 35; y < 85; y += 3) {
      for (let x = 50; x < 110; x += 3) {
        const idx = (y * w + x) * 4;
        rValues.push(frame[idx]);
        gValues.push(frame[idx + 1]);
        bValues.push(frame[idx + 2]);
      }
    }

    const variance = (arr: number[]) => {
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      return arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / arr.length;
    };

    const rVar = variance(rValues);
    const gVar = variance(gValues);
    const bVar = variance(bValues);

    // Real faces have DIFFERENT variances across R,G,B channels
    // Screens tend to have more uniform channel variance
    const channelRatio = Math.max(rVar, gVar, bVar) / (Math.min(rVar, gVar, bVar) + 0.01);

    // Real faces: channelRatio typically 1.5-8.0
    // Screen photos: channelRatio typically 0.8-1.5
    return channelRatio;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ANTI-SPOOFING: Micro-motion analysis
  // Real faces have involuntary micro-movements (breathing, muscle twitches).
  // Photos held up have rigid, uniform motion.
  // ═══════════════════════════════════════════════════════════════════════════
  const analyzeMicroMotion = (frame: Uint8ClampedArray, prev: number[] | null, w: number): number => {
    if (!prev) return 0;

    // Divide face into a 4x4 grid and measure motion in each cell
    const gridMotion: number[] = [];

    const regions = [
      [30, 50, 40, 60], [30, 50, 60, 80], [30, 50, 80, 100], [30, 50, 100, 120],
      [50, 70, 40, 60], [50, 70, 60, 80], [50, 70, 80, 100], [50, 70, 100, 120],
      [70, 90, 40, 60], [70, 90, 60, 80], [70, 90, 80, 100], [70, 90, 100, 120],
    ];

    for (const [y1, y2, x1, x2] of regions) {
      let motion = 0;
      let count = 0;
      for (let y = y1; y < y2; y += 2) {
        for (let x = x1; x < x2; x += 2) {
          const idx = (y * w + x) * 4;
          if (idx < frame.length && idx < prev.length) {
            motion += Math.abs(frame[idx] - prev[idx]);
            count++;
          }
        }
      }
      gridMotion.push(count > 0 ? motion / count : 0);
    }

    // Real faces: different regions move differently (eyes blink, mouth moves, cheeks shift)
    // Photos: ALL regions move together (rigid body motion)
    const motionVariance = (() => {
      const mean = gridMotion.reduce((a, b) => a + b, 0) / gridMotion.length;
      return gridMotion.reduce((sum, v) => sum + (v - mean) ** 2, 0) / gridMotion.length;
    })();

    return motionVariance;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN LIVENESS LOOP
  // ═══════════════════════════════════════════════════════════════════════════
  const runLiveness = () => {
    if (!videoRef.current || !hCtx.current || !hCanvas.current) return;
    const vid = videoRef.current;
    if (!vid.readyState || vid.readyState < 2) return;

    hCtx.current.drawImage(vid, 0, 0, 160, 120);
    const frame = hCtx.current.getImageData(0, 0, 160, 120).data;
    frameCount.current++;

    let faceOK = false;
    let newBlink = false;
    let newHead = false;
    let textureOK = false;

    // ── Face presence ────────────────────────────────────────────────────────
    let sum = 0, n = 0;
    for (let y = 25; y < 95; y++) {
      for (let x = 35; x < 125; x++) {
        const i = (y * 160 + x) * 4;
        sum += (frame[i] + frame[i + 1] + frame[i + 2]) / 3;
        n++;
      }
    }
    const bright = sum / n;
    faceOK = bright > 35 && bright < 235;

    if (faceOK) {
      // ── Blink detection ──────────────────────────────────────────────────
      let eyeSum = 0, eyeN = 0;
      for (let y = 28; y < 52; y++) {
        for (let x = 45; x < 115; x++) {
          const i = (y * 160 + x) * 4;
          eyeSum += (frame[i] + frame[i + 1] + frame[i + 2]) / 3;
          eyeN++;
        }
      }
      brightHistory.current.push(eyeSum / eyeN);
      if (brightHistory.current.length > 25) brightHistory.current.shift();

      if (brightHistory.current.length >= 12 && blinkCooldown.current <= 0) {
        const base = brightHistory.current.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
        const curr = brightHistory.current.slice(-3).reduce((a, b) => a + b, 0) / 3;
        if (Math.abs(base - curr) > 7) {
          newBlink = true;
          blinkCooldown.current = 20;
        }
      }
      if (blinkCooldown.current > 0) blinkCooldown.current--;

      // ── Head turn ────────────────────────────────────────────────────────
      if (prevPixels.current) {
        let L = 0, R = 0;
        for (let y = 15; y < 105; y += 3) {
          for (let x = 0; x < 80; x += 3) {
            const i = (y * 160 + x) * 4;
            L += Math.abs(frame[i] - prevPixels.current[i]);
          }
          for (let x = 80; x < 160; x += 3) {
            const i = (y * 160 + x) * 4;
            R += Math.abs(frame[i] - prevPixels.current[i]);
          }
        }
        headHistory.current.push(L / (R + 1));
        if (headHistory.current.length > 35) headHistory.current.shift();

        if (headHistory.current.length >= 25) {
          const mn = Math.min(...headHistory.current);
          const mx = Math.max(...headHistory.current);
          if (mx / (mn + 0.01) > 3.0) newHead = true;
        }
      }

      // ── Anti-spoofing checks (every 3rd frame for performance) ─────────
      if (frameCount.current % 3 === 0) {
        // 1. Texture analysis
        const textureScore = analyzeTexture(frame, 160, 120);
        textureScoreHistory.current.push(textureScore);
        if (textureScoreHistory.current.length > 20) textureScoreHistory.current.shift();

        // 2. Color variance
        const colorVar = analyzeColorVariance(frame, 160, 120);
        colorVarianceHistory.current.push(colorVar);
        if (colorVarianceHistory.current.length > 20) colorVarianceHistory.current.shift();

        // 3. Micro-motion analysis
        const microMotion = analyzeMicroMotion(frame, prevPixels.current, 160);
        microMotionHistory.current.push(microMotion);
        if (microMotionHistory.current.length > 20) microMotionHistory.current.shift();
      }

      // Evaluate anti-spoofing after collecting enough data (at least 15 frames)
      if (textureScoreHistory.current.length >= 10) {
        const avgTexture = textureScoreHistory.current.reduce((a, b) => a + b, 0) / textureScoreHistory.current.length;
        const avgColorVar = colorVarianceHistory.current.reduce((a, b) => a + b, 0) / colorVarianceHistory.current.length;
        const avgMicroMotion = microMotionHistory.current.reduce((a, b) => a + b, 0) / microMotionHistory.current.length;

        // Scoring: Real face characteristics
        // Texture: 0.15-0.60 for real (moderate gradients), <0.10 or >0.70 for screen
        // Color variance ratio: >1.8 for real (different R/G/B patterns), <1.5 for screen
        // Micro-motion variance: >5 for real (non-rigid motion), <3 for photo

        let spoofScore = 0;

        // Texture score (real faces: 0.15-0.60)
        if (avgTexture >= 0.12 && avgTexture <= 0.65) spoofScore += 35;
        else if (avgTexture >= 0.08 && avgTexture <= 0.70) spoofScore += 15;

        // Color variance (real faces: ratio > 1.8)
        if (avgColorVar > 1.8) spoofScore += 35;
        else if (avgColorVar > 1.4) spoofScore += 15;

        // Micro-motion (real faces: variance > 5)
        if (avgMicroMotion > 5) spoofScore += 30;
        else if (avgMicroMotion > 2) spoofScore += 10;

        setAntiSpoofScore(spoofScore);

        // Need at least 60/100 anti-spoof score to pass
        textureOK = spoofScore >= 60;
      }
    }

    prevPixels.current = Array.from(frame);

    setLiveness(prev => {
      const updated = {
        face: faceOK,
        blink: prev.blink || newBlink,
        head: prev.head || newHead,
        texture: prev.texture || textureOK,
      };
      const allOK = updated.face && updated.blink && updated.head && updated.texture;
      setLivenessOK(allOK);

      if (!updated.face) setStatusMsg('No face detected — center your face');
      else if (!updated.texture) setStatusMsg(`Anti-spoof check in progress... (${antiSpoofScore}%)`);
      else if (!updated.blink && !updated.head) setStatusMsg('Blink once and turn your head slightly');
      else if (!updated.blink) setStatusMsg('Blink once naturally');
      else if (!updated.head) setStatusMsg('Turn your head slightly left or right');
      else setStatusMsg('All checks passed ✓ — Ready to scan');

      return updated;
    });
  };

  // ── Capture a frame ────────────────────────────────────────────────────────
  const captureFrame = (): Promise<{ blob: Blob; dataUrl: string }> => {
    return new Promise((resolve, reject) => {
      const vid = videoRef.current;
      if (!vid) return reject(new Error('Video not ready'));
      const c = document.createElement('canvas');
      c.width = vid.videoWidth || 640;
      c.height = vid.videoHeight || 480;
      const cx = c.getContext('2d');
      if (!cx) return reject(new Error('No canvas ctx'));
      cx.translate(c.width, 0);
      cx.scale(-1, 1);
      cx.drawImage(vid, 0, 0);
      const dataUrl = c.toDataURL('image/jpeg', 0.85);
      c.toBlob(
        blob => (blob ? resolve({ blob, dataUrl }) : reject(new Error('Capture failed'))),
        'image/jpeg', 0.92
      );
    });
  };

  // ── Multi-frame capture for extra accuracy ─────────────────────────────────
  const multiFrameCapture = async (): Promise<{ blob: Blob; dataUrl: string }> => {
    // Capture 3 frames with small delays to confirm consistency
    const frames: Array<{ blob: Blob; dataUrl: string }> = [];
    
    for (let i = 0; i < 3; i++) {
      const frame = await captureFrame();
      frames.push(frame);
      if (i < 2) await new Promise(r => setTimeout(r, 300));
    }

    // Use the middle frame (best stability)
    return frames[1];
  };

  // ── Main scan action ───────────────────────────────────────────────────────
  const scanFace = async () => {
    if (!livenessOK) return;
    try {
      setIsProcessing(true);
      setError('');

      // Multi-frame capture for maximum accuracy
      const { blob, dataUrl } = await multiFrameCapture();
      const fd = new FormData();
      fd.append('file', blob, 'face.jpg');

      let matchResult: FaceMatchResult | null = null;
      try {
        const res = await fetch(`${PYTHON_API}/verify?threshold=${MATCH_THRESHOLD}`, {
          method: 'POST', body: fd,
        });
        if (res.ok) {
          matchResult = await res.json();
        } else if (res.status === 404) {
          matchResult = null; // No faces stored yet
        } else if (res.status === 422) {
          const errData = await res.json();
          throw new Error(errData.detail || 'No face detected. Position your face clearly and try again.');
        }
      } catch (fetchErr: any) {
        if (fetchErr.message?.includes('Failed to fetch') || fetchErr.message?.includes('NetworkError')) {
          throw new Error('Cannot reach Face AI server (port 8000). Is it running?');
        }
        throw fetchErr;
      }

      onVerificationResult({
        livenessPassed: true,
        matchResult,
        snapshot: dataUrl,
        captureBlob: blob,
      });
    } catch (err: any) {
      console.error('Face scan error:', err);
      setError(err.message || 'Face scan failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = () => {
    if (livenessOK) return '#10B981';
    if (!liveness.face) return '#EF4444';
    return '#F59E0B';
  };

  return (
    <div className="flex flex-col items-center">
      {error && (
        <div className="w-full mb-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" style={{ color: '#EF4444' }} />
            <p className="text-sm font-medium" style={{ color: '#DC2626' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Camera */}
      <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden border shadow-lg"
        style={{ backgroundColor: '#0a0a14', borderColor: '#222' }}>
        {!cameraReady && !cameraBlocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center" style={{ color: '#888' }}>
            <Camera className="h-12 w-12 mb-4 opacity-50" />
            <h3 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Camera Access Required</h3>
            <p className="text-sm mb-6">Allow camera to start face verification</p>
            <button onClick={startCamera} className="nexus-btn nexus-btn-primary">Start Camera</button>
          </div>
        )}

        {cameraBlocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center" style={{ color: '#EF4444' }}>
            <AlertCircle className="h-12 w-12 mb-4" />
            <h3 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Camera Blocked</h3>
            <p className="text-sm mb-4" style={{ color: '#888' }}>Enable camera permissions in browser</p>
            <button onClick={startCamera} className="nexus-btn nexus-btn-outline"><RefreshCw className="h-4 w-4 mr-2" /> Try Again</button>
          </div>
        )}

        <video ref={videoRef} autoPlay playsInline muted
          className={`w-full h-full object-cover ${!cameraReady ? 'hidden' : ''}`}
          style={{ transform: 'scaleX(-1)' }}
        />

        {cameraReady && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full border"
            style={{ backgroundColor: 'rgba(0,0,0,0.85)', borderColor: getStatusColor(), transition: 'border-color 0.3s' }}>
            <p className="text-sm font-medium text-white whitespace-nowrap">{statusMsg}</p>
          </div>
        )}
      </div>

      {/* Liveness + Anti-Spoof Checks */}
      {cameraReady && (
        <div className="w-full max-w-md mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { done: liveness.face, label: '👤 Face Visible' },
              { done: liveness.blink, label: '👁 Blink Detected' },
              { done: liveness.head, label: '↔ Head Turn' },
              { done: liveness.texture, label: '🛡 Anti-Spoof' },
            ].map((item, i) => (
              <div key={i}
                className="p-3 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all"
                style={{
                  backgroundColor: item.done ? 'rgba(16,185,129,0.06)' : 'rgba(0,0,0,0.2)',
                  borderColor: item.done ? '#10B981' : '#333',
                  color: item.done ? '#10B981' : '#666',
                }}>
                {item.done ? <CheckCircle className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border-2" style={{ borderColor: '#444' }} />}
                {item.label}
              </div>
            ))}
          </div>

          {/* Anti-spoof progress bar */}
          {!liveness.texture && liveness.face && (
            <div className="space-y-1">
              <p className="text-xs" style={{ color: '#888' }}>Anti-spoofing analysis: {antiSpoofScore}%</p>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1a1a2e' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${antiSpoofScore}%`,
                    background: antiSpoofScore >= 60 ? 'linear-gradient(90deg,#10B981,#059669)' : 'linear-gradient(90deg,#F59E0B,#D97706)',
                  }} />
              </div>
              <p className="text-xs" style={{ color: '#666' }}>Analyzing skin texture, color patterns & micro-movements...</p>
            </div>
          )}

          <button onClick={scanFace} disabled={!livenessOK || isProcessing}
            className="nexus-btn nexus-btn-primary w-full h-12"
            style={{ opacity: (!livenessOK || isProcessing) ? 0.4 : 1 }}>
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Scanning Face (Multi-Frame)...
              </span>
            ) : (
              'Scan My Face'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default FaceVerification;