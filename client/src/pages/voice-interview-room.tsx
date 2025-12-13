import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { Waveform } from "@/components/voice/waveform";
import { CaptionsPanel, type CaptionMessage } from "@/components/voice/captions-panel";
import { type InterviewSession } from "@shared/schema";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  LogOut,
  Play,
  Square,
  Clock,
  User,
  AlertCircle,
  Send,
  Download,
  Volume2,
  VolumeX,
} from "lucide-react";

interface VoiceSession {
  sessionId: string;
  greeting: string;
  questions: string[];
  currentQuestion: string;
}

export default function VoiceInterviewRoomPage() {
  const { interviewId } = useParams<{ interviewId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Session state
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [voiceSession, setVoiceSession] = useState<VoiceSession | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // Media state
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // Voice state
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeakingAI, setIsSpeakingAI] = useState(false);
  const [captions, setCaptions] = useState<CaptionMessage[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceRecorder = useVoiceRecorder({
    onTranscript: (text) => {
      console.log("Transcribed:", text);
    },
    onError: (error) => {
      toast({
        title: "Voice Error",
        description: error,
        variant: "destructive",
      });
    },
  });

  // Load session from storage
  useEffect(() => {
    const stored = sessionStorage.getItem("interviewSession");
    if (stored) {
      const parsed = JSON.parse(stored) as InterviewSession;
      setSession(parsed);

      const endTime = new Date(parsed.endTime);
      const now = new Date();
      const calculatedRemaining = Math.max(
        0,
        Math.floor((endTime.getTime() - now.getTime()) / 1000)
      );
      setRemainingSeconds(calculatedRemaining);

      if (calculatedRemaining <= 0) {
        sessionStorage.removeItem("interviewSession");
        setLocation("/interview/expired");
      }
    } else {
      setLocation(`/interview/${interviewId}`);
    }
  }, [interviewId, setLocation]);

  // Countdown timer
  useEffect(() => {
    if (!session || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  // Initialize media
  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setMediaStream(stream);
      setMediaError(null);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Media error:", error);
      setMediaError("Unable to access camera or microphone. Please check permissions.");
      toast({
        title: "Media Access Error",
        description: "Please allow camera and microphone access to continue.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Cleanup media
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [mediaStream]);

  // Start interview
  const handleStartInterview = async () => {
    if (!session) return;

    try {
      await initializeMedia();

      // Initialize voice interview session
      const response = await fetch("/api/interview/start-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId: session.id,
          candidateName: session.candidateName,
          role: session.role,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start voice interview");
      }

      const voiceData = await response.json();
      setVoiceSession(voiceData);

      // Add greeting to captions
      setCaptions([
        {
          id: "greeting",
          role: "ai",
          text: voiceData.greeting,
          timestamp: new Date().toISOString(),
        },
      ]);

      setIsStarted(true);
      setCurrentQuestionIndex(0);

      // Speak the greeting
      voiceRecorder.speak(voiceData.greeting);

      toast({
        title: "Interview Started",
        description: "Listen to the AI interviewer and respond when ready.",
      });
    } catch (error) {
      console.error("Error starting interview:", error);
      toast({
        title: "Error",
        description: "Failed to start voice interview",
        variant: "destructive",
      });
    }
  };

  // Handle time expired
  const handleTimeExpired = async () => {
    if (session) {
      try {
        await fetch(`/api/interviews/${session.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isUsed: true, currentQuestionIndex }),
        });
      } catch (error) {
        console.error("Failed to update interview status:", error);
      }
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }

    sessionStorage.removeItem("interviewSession");
    toast({
      title: "Time Expired",
      description: "Your interview time has ended.",
      variant: "destructive",
    });
    setLocation("/interview/completed");
  };

  // Handle end interview
  const handleEndInterview = async () => {
    if (voiceSession) {
      try {
        await fetch("/api/interview/end-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: voiceSession.sessionId }),
        });
      } catch (error) {
        console.error("Failed to end session:", error);
      }
    }

    if (session) {
      try {
        await fetch(`/api/interviews/${session.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isUsed: true, currentQuestionIndex }),
        });
      } catch (error) {
        console.error("Failed to update interview status:", error);
      }
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }

    sessionStorage.removeItem("interviewSession");
    toast({
      title: "Interview Ended",
      description: "Thank you for completing the interview!",
    });
    setLocation("/interview/completed");
  };

  // Submit response
  const handleSubmitResponse = async () => {
    if (!voiceSession || !voiceRecorder.transcript.trim()) {
      toast({
        title: "No Response",
        description: "Please provide an answer before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch("/api/interview/send-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: voiceSession.sessionId,
          candidateText: voiceRecorder.transcript,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process response");
      }

      const result = await response.json();

      // Add candidate response to captions
      setCaptions((prev) => [
        ...prev,
        {
          id: `candidate-${Date.now()}`,
          role: "candidate",
          text: voiceRecorder.transcript,
          timestamp: new Date().toISOString(),
        },
      ]);

      // Add AI response to captions
      setCaptions((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          text: result.aiResponse,
          timestamp: new Date().toISOString(),
        },
      ]);

      // Clear transcript
      voiceRecorder.clearTranscript();

      if (result.sessionEnded) {
        // Interview complete
        toast({
          title: "Interview Complete",
          description: "Thank you for your responses!",
        });
        handleEndInterview();
      } else {
        // Speak next question
        if (result.nextQuestion) {
          setCaptions((prev) => [
            ...prev,
            {
              id: `next-question-${Date.now()}`,
              role: "ai",
              text: result.nextQuestion,
              timestamp: new Date().toISOString(),
            },
          ]);
          setCurrentQuestionIndex((prev) => prev + 1);
          voiceRecorder.speak(result.nextQuestion);
        }
      }
    } catch (error) {
      console.error("Error submitting response:", error);
      toast({
        title: "Error",
        description: "Failed to process your response",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Download transcript
  const handleDownloadTranscript = async () => {
    if (!voiceSession || !session) return;

    try {
      const response = await fetch(
        `/api/interview/${session.id}/transcript/${voiceSession.sessionId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch transcript");
      }

      const transcript = await response.json();

      // Create JSON file
      const dataStr = JSON.stringify(transcript, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `interview-transcript-${session.id}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Downloaded",
        description: "Transcript has been downloaded.",
      });
    } catch (error) {
      console.error("Error downloading transcript:", error);
      toast({
        title: "Error",
        description: "Failed to download transcript",
        variant: "destructive",
      });
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (mediaStream) {
      mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle camera
  const toggleCamera = () => {
    if (mediaStream) {
      mediaStream.getVideoTracks().forEach((track) => {
        track.enabled = isCameraOff;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isTimeWarning = remainingSeconds <= 300 && remainingSeconds > 0;
  const isTimeCritical = remainingSeconds <= 120 && remainingSeconds > 0;

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading interview session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="h-14 sm:h-16 border-b border-border bg-card px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm sm:text-base truncate">
              {session.candidateName}
            </p>
            <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
              {session.role}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <div
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-mono text-sm sm:text-lg font-semibold ${
              isTimeCritical
                ? "bg-destructive/10 text-destructive animate-pulse"
                : isTimeWarning
                ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                : "bg-muted"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTime(remainingSeconds)}</span>
          </div>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEndInterview}
              className="text-muted-foreground"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Exit</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Exit Interview</TooltipContent>
        </Tooltip>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-3 sm:p-6 overflow-auto">
        <div className="max-w-7xl mx-auto h-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 h-full">
            {/* Video & Controls - Left Side (2/3) */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {/* Video Card */}
              <Card className="flex-1 border-card-border overflow-hidden">
                <CardContent className="p-0 h-full relative">
                  <div className="relative aspect-video lg:aspect-auto lg:h-full bg-muted rounded-lg overflow-hidden">
                    {mediaError ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                          <AlertCircle className="w-8 h-8 text-destructive" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground mb-1">
                            Camera Access Required
                          </p>
                          <p className="text-sm text-muted-foreground">{mediaError}</p>
                        </div>
                        <Button
                          onClick={initializeMedia}
                          variant="outline"
                          size="sm"
                        >
                          Try Again
                        </Button>
                      </div>
                    ) : !isStarted ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center bg-gradient-to-b from-muted/50 to-muted">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/10 flex items-center justify-center">
                          <Video className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg sm:text-xl mb-2">
                            Ready to Begin?
                          </p>
                          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                            Click the button below to start your AI voice interview.
                            Make sure your camera and microphone are ready.
                          </p>
                          <p className="text-sm font-medium text-primary mt-2">
                            Time remaining: {formatTime(remainingSeconds)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className={`w-full h-full object-cover ${
                            isCameraOff ? "opacity-0" : "opacity-100"
                          }`}
                        />
                        {isCameraOff && (
                          <div className="absolute inset-0 flex items-center justify-center bg-muted">
                            <div className="w-20 h-20 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                              <VideoOff className="w-10 h-10 text-muted-foreground" />
                            </div>
                          </div>
                        )}

                        {/* Status Indicators */}
                        <div className="absolute top-4 left-4 flex items-center gap-2">
                          {isStarted && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/90 text-destructive-foreground text-xs font-medium">
                              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                              Recording
                            </div>
                          )}
                          {voiceRecorder.isListening && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/90 text-white text-xs font-medium">
                              <Mic className="w-3 h-3" />
                              Listening
                            </div>
                          )}
                        </div>

                        {/* Media Status */}
                        <div className="absolute bottom-4 left-4 flex items-center gap-2">
                          <div
                            className={`p-2 rounded-full ${
                              isMuted ? "bg-destructive/90" : "bg-black/50"
                            }`}
                          >
                            {isMuted ? (
                              <MicOff className="w-4 h-4 text-white" />
                            ) : (
                              <Mic className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div
                            className={`p-2 rounded-full ${
                              isCameraOff ? "bg-destructive/90" : "bg-black/50"
                            }`}
                          >
                            {isCameraOff ? (
                              <VideoOff className="w-4 h-4 text-white" />
                            ) : (
                              <Video className="w-4 h-4 text-white" />
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Waveform */}
              {isStarted && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-muted-foreground font-medium">
                    Microphone Activity
                  </p>
                  <Waveform
                    isListening={voiceRecorder.isListening}
                    isSpeaking={isSpeakingAI}
                    className="w-full"
                  />
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 bg-card border border-border rounded-lg flex-wrap">
                {!isStarted ? (
                  <Button
                    onClick={handleStartInterview}
                    size="lg"
                    className="gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Start Interview
                  </Button>
                ) : (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isMuted ? "destructive" : "secondary"}
                          size="icon"
                          onClick={toggleMute}
                          className="w-12 h-12"
                        >
                          {isMuted ? (
                            <MicOff className="w-5 h-5" />
                          ) : (
                            <Mic className="w-5 h-5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isMuted ? "Unmute" : "Mute"}
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isCameraOff ? "destructive" : "secondary"}
                          size="icon"
                          onClick={toggleCamera}
                          className="w-12 h-12"
                        >
                          {isCameraOff ? (
                            <VideoOff className="w-5 h-5" />
                          ) : (
                            <Video className="w-5 h-5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
                      </TooltipContent>
                    </Tooltip>

                    <div className="w-px h-8 bg-border mx-2" />

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="destructive"
                          onClick={handleEndInterview}
                          className="gap-2"
                        >
                          <Square className="w-4 h-4" />
                          <span className="hidden sm:inline">End Interview</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>End Interview</TooltipContent>
                    </Tooltip>
                  </>
                )}
              </div>
            </div>

            {/* Captions & Response - Right Side (1/3) */}
            <div className="lg:col-span-1 flex flex-col gap-4 h-full">
              {/* Captions Panel */}
              <CaptionsPanel
                messages={captions}
                isListening={voiceRecorder.isListening}
                isSpeaking={isSpeakingAI}
                onDownload={isStarted ? handleDownloadTranscript : undefined}
                className="flex-1"
              />

              {/* Response Input */}
              {isStarted && (
                <Card className="border-card-border">
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">
                        Your Response
                      </p>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border min-h-20 max-h-32 overflow-y-auto">
                        <p className="text-sm text-foreground break-words">
                          {voiceRecorder.transcript || (
                            <span className="text-muted-foreground italic">
                              Click "Start Listening" to record your answer...
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant={
                          voiceRecorder.isListening ? "destructive" : "secondary"
                        }
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={
                          voiceRecorder.isListening
                            ? voiceRecorder.stopListening
                            : voiceRecorder.startListening
                        }
                      >
                        <Mic className="w-4 h-4" />
                        {voiceRecorder.isListening ? "Stop" : "Listen"}
                      </Button>

                      <Button
                        onClick={handleSubmitResponse}
                        disabled={
                          isProcessing ||
                          !voiceRecorder.transcript.trim() ||
                          voiceRecorder.isListening
                        }
                        size="sm"
                        className="flex-1 gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Submit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
