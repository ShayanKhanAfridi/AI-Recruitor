import { useState, useRef, useCallback } from "react";

interface UseVoiceRecorderOptions {
  onTranscript?: (text: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Initialize Web Speech API
  const initializeSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) return;

    // Use browser's Web Speech API (works with Chrome, Edge, Safari)
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      options.onError?.("Speech Recognition not supported in this browser");
      return false;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          setTranscript((prev) => prev + transcript + " ");
          options.onTranscript?.(transcript);
        } else {
          interimTranscript += transcript;
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      options.onError?.(event.error || "Speech recognition error");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    return true;
  }, [options]);

  // Start listening
  const startListening = useCallback(() => {
    if (!initializeSpeechRecognition()) return;

    setTranscript("");
    recognitionRef.current?.start();
  }, [initializeSpeechRecognition]);

  // Stop listening
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  // Speak text using Web Speech API (Text-to-Speech)
  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) {
      options.onError?.("Text-to-Speech not supported in this browser");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event.error);
      options.onError?.(event.error || "Speech synthesis error");
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [options]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // Get current transcript
  const getTranscript = useCallback(() => {
    return transcript;
  }, [transcript]);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    isListening,
    isSpeaking,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    getTranscript,
    clearTranscript,
  };
}
