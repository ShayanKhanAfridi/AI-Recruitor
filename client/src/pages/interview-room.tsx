import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { interviewQuestions, type InterviewSession } from "@shared/schema";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  LogOut,
  ChevronRight,
  Play,
  Square,
  Clock,
  User,
  AlertCircle,
} from "lucide-react";

export default function InterviewRoomPage() {
  const { interviewId } = useParams<{ interviewId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load session from storage and calculate remaining time from endTime
  useEffect(() => {
    const stored = sessionStorage.getItem("interviewSession");
    if (stored) {
      const parsed = JSON.parse(stored) as InterviewSession;
      setSession(parsed);
      setCurrentQuestionIndex(parsed.currentQuestionIndex);
      
      // Calculate remaining time based on endTime for accuracy
      const endTime = new Date(parsed.endTime);
      const now = new Date();
      const calculatedRemaining = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));
      setRemainingSeconds(calculatedRemaining);
      
      // If time has already expired, redirect
      if (calculatedRemaining <= 0) {
        sessionStorage.removeItem("interviewSession");
        setLocation("/interview/expired");
      }
    } else {
      setLocation(`/interview/${interviewId}`);
    }
  }, [interviewId, setLocation]);

  // Countdown timer - starts immediately when session is loaded
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

  const handleTimeExpired = async () => {
    // Mark interview as used when time expires
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

  // Initialize camera
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

  // Cleanup media on unmount
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [mediaStream]);

  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  const handleStartInterview = async () => {
    await initializeMedia();
    setIsStarted(true);
    toast({
      title: "Interview Started",
      description: "Good luck! Take your time with each question.",
    });
  };

  const handleEndInterview = async () => {
    // Update backend with final state
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

  const handleNextQuestion = async () => {
    const newIndex = currentQuestionIndex + 1;
    
    if (newIndex < interviewQuestions.length) {
      setCurrentQuestionIndex(newIndex);
      
      // Sync with backend
      if (session) {
        try {
          await fetch(`/api/interviews/${session.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentQuestionIndex: newIndex }),
          });
        } catch (error) {
          console.error("Failed to update question index:", error);
        }
      }
    } else {
      handleEndInterview();
    }
  };

  const toggleMute = () => {
    if (mediaStream) {
      mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

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
      <div className="min-h-screen bg-background flex items-center justify-center" data-testid="loading-interview">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading interview session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar - Fixed */}
      <header className="h-14 sm:h-16 border-b border-border bg-card px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-50" data-testid="header-interview">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm sm:text-base truncate" data-testid="text-candidate-name">
              {session.candidateName}
            </p>
            <Badge variant="secondary" className="text-xs hidden sm:inline-flex" data-testid="badge-role">
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
            data-testid="text-countdown"
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
              data-testid="button-exit"
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
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 h-full">
            {/* Video Panel - Left Side (60% on desktop = 3/5) */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <Card className="flex-1 border-card-border overflow-hidden" data-testid="card-video">
                <CardContent className="p-0 h-full relative">
                  {/* Video Container */}
                  <div className="relative aspect-video lg:aspect-auto lg:h-full bg-muted rounded-lg overflow-hidden">
                    {mediaError ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center" data-testid="media-error">
                        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                          <AlertCircle className="w-8 h-8 text-destructive" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground mb-1">Camera Access Required</p>
                          <p className="text-sm text-muted-foreground">{mediaError}</p>
                        </div>
                        <Button onClick={initializeMedia} variant="outline" size="sm" data-testid="button-retry-media">
                          Try Again
                        </Button>
                      </div>
                    ) : !isStarted ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center bg-gradient-to-b from-muted/50 to-muted" data-testid="interview-not-started">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/10 flex items-center justify-center">
                          <Video className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg sm:text-xl mb-2">Ready to Begin?</p>
                          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                            Click the button below to start your interview. Make sure your camera and microphone are ready.
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
                          className={`w-full h-full object-cover ${isCameraOff ? "opacity-0" : "opacity-100"}`}
                          data-testid="video-feed"
                        />
                        {isCameraOff && (
                          <div className="absolute inset-0 flex items-center justify-center bg-muted" data-testid="camera-off-indicator">
                            <div className="w-20 h-20 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                              <VideoOff className="w-10 h-10 text-muted-foreground" />
                            </div>
                          </div>
                        )}
                        
                        {/* Status Indicators */}
                        <div className="absolute top-4 left-4 flex items-center gap-2">
                          {isStarted && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/90 text-destructive-foreground text-xs font-medium" data-testid="recording-indicator">
                              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                              Recording
                            </div>
                          )}
                        </div>

                        {/* Media Status */}
                        <div className="absolute bottom-4 left-4 flex items-center gap-2">
                          <div className={`p-2 rounded-full ${isMuted ? "bg-destructive/90" : "bg-black/50"}`} data-testid="mic-status-indicator">
                            {isMuted ? (
                              <MicOff className="w-4 h-4 text-white" />
                            ) : (
                              <Mic className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div className={`p-2 rounded-full ${isCameraOff ? "bg-destructive/90" : "bg-black/50"}`} data-testid="camera-status-indicator">
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

              {/* Controls Bar - Fixed at bottom of video section */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 bg-card border border-border rounded-lg" data-testid="controls-bar">
                {!isStarted ? (
                  <Button
                    onClick={handleStartInterview}
                    size="lg"
                    className="gap-2"
                    data-testid="button-start-interview"
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
                          data-testid="button-toggle-mute"
                        >
                          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{isMuted ? "Unmute" : "Mute"}</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isCameraOff ? "destructive" : "secondary"}
                          size="icon"
                          onClick={toggleCamera}
                          className="w-12 h-12"
                          data-testid="button-toggle-camera"
                        >
                          {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{isCameraOff ? "Turn Camera On" : "Turn Camera Off"}</TooltipContent>
                    </Tooltip>

                    <div className="w-px h-8 bg-border mx-2" />

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="destructive"
                          onClick={handleEndInterview}
                          className="gap-2"
                          data-testid="button-end-interview"
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

            {/* Question Panel - Right Side (40% on desktop = 2/5) */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <Card className="flex-1 border-card-border" data-testid="card-questions">
                <CardContent className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
                  {/* Question Header */}
                  <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6 flex-wrap">
                    <Badge variant="outline" className="font-mono" data-testid="badge-question-number">
                      Question {currentQuestionIndex + 1} of {interviewQuestions.length}
                    </Badge>
                    {isStarted && (
                      <span className="text-xs text-muted-foreground" data-testid="text-progress-percent">
                        {Math.round(((currentQuestionIndex + 1) / interviewQuestions.length) * 100)}% Complete
                      </span>
                    )}
                  </div>

                  {/* Question Display */}
                  <div className="flex-1 flex flex-col">
                    {isStarted ? (
                      <>
                        <div className="flex-1">
                          <p
                            className="text-lg sm:text-xl lg:text-2xl font-medium leading-relaxed"
                            data-testid="text-current-question"
                          >
                            {interviewQuestions[currentQuestionIndex]}
                          </p>
                        </div>

                        {/* Transcript Area Placeholder */}
                        <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-dashed border-border" data-testid="transcript-area">
                          <p className="text-xs text-muted-foreground mb-2 font-medium">
                            Your Response (AI Transcript)
                          </p>
                          <p className="text-sm text-muted-foreground italic">
                            AI transcription will appear here...
                          </p>
                        </div>

                        {/* Next Question Button */}
                        <div className="mt-6 pt-4 border-t border-border">
                          <Button
                            onClick={handleNextQuestion}
                            className="w-full sm:w-auto gap-2"
                            data-testid="button-next-question"
                          >
                            {currentQuestionIndex < interviewQuestions.length - 1
                              ? "Next Question"
                              : "Finish Interview"}
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-center" data-testid="waiting-to-start">
                        <div>
                          <p className="text-muted-foreground mb-2">Interview not started</p>
                          <p className="text-sm text-muted-foreground">
                            Click "Start Interview" to begin answering questions
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">Progress</span>
                      <span className="text-xs font-mono text-muted-foreground ml-auto" data-testid="text-progress-count">
                        {currentQuestionIndex + 1}/{interviewQuestions.length}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{
                          width: `${((currentQuestionIndex + 1) / interviewQuestions.length) * 100}%`,
                        }}
                        data-testid="progress-bar"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
