import { useEffect, useRef } from "react";

interface WaveformProps {
  isListening: boolean;
  isSpeaking?: boolean;
  className?: string;
}

export function Waveform({ isListening, isSpeaking, className = "" }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const barsRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const barCount = 20;
    const barWidth = canvas.width / barCount;

    // Initialize bars
    if (barsRef.current.length === 0) {
      barsRef.current = Array(barCount).fill(0);
    }

    const animate = () => {
      // Clear canvas
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (isListening || isSpeaking) {
        // Update bars with random heights
        for (let i = 0; i < barCount; i++) {
          const targetHeight = Math.random() * (canvas.height * 0.8);
          barsRef.current[i] = barsRef.current[i] * 0.7 + targetHeight * 0.3;
        }
      } else {
        // Decay bars
        for (let i = 0; i < barCount; i++) {
          barsRef.current[i] = barsRef.current[i] * 0.9;
        }
      }

      // Draw bars
      ctx.fillStyle = isListening
        ? "rgb(59, 130, 246)" // blue
        : isSpeaking
        ? "rgb(34, 197, 94)" // green
        : "rgb(156, 163, 175)"; // gray

      for (let i = 0; i < barCount; i++) {
        const x = i * barWidth + 2;
        const height = barsRef.current[i];
        const y = (canvas.height - height) / 2;

        ctx.fillRect(x, y, barWidth - 4, height);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isListening, isSpeaking]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={60}
      className={`rounded-lg bg-muted/50 border border-border ${className}`}
    />
  );
}
