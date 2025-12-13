import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Copy } from "lucide-react";

export interface CaptionMessage {
  id: string;
  role: "ai" | "candidate";
  text: string;
  timestamp: string;
}

interface CaptionsPanelProps {
  messages: CaptionMessage[];
  isListening?: boolean;
  isSpeaking?: boolean;
  onDownload?: () => void;
  className?: string;
}

export function CaptionsPanel({
  messages,
  isListening,
  isSpeaking,
  onDownload,
  className = "",
}: CaptionsPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  return (
    <Card className={`flex flex-col border-card-border h-full ${className}`}>
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Conversation</CardTitle>
            {isListening && (
              <Badge variant="secondary" className="animate-pulse">
                Listening...
              </Badge>
            )}
            {isSpeaking && (
              <Badge variant="secondary" className="bg-green-500/20 text-green-700 dark:text-green-400">
                AI Speaking...
              </Badge>
            )}
          </div>
          {onDownload && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDownload}
              className="gap-2"
              title="Download transcript"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Download</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-muted-foreground text-sm">
                Conversation will appear here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Start the interview to begin
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "ai" ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-sm px-4 py-3 rounded-lg ${
                    message.role === "ai"
                      ? "bg-primary/10 text-foreground border border-primary/20"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-semibold mb-1 opacity-75">
                        {message.role === "ai" ? "AI Interviewer" : "You"}
                      </p>
                      <p className="text-sm leading-relaxed break-words">
                        {message.text}
                      </p>
                      <p className="text-xs opacity-50 mt-2">
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
