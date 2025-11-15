// src/AudioRecorder.tsx
import React, { useState, useRef, useEffect } from "react";

interface AudioRecorderProps {
  onTranscriptComplete: (text: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscriptComplete }) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>("");
  const isRecordingRef = useRef<boolean>(false);

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("[Audio] SpeechRecognition not supported in this browser.");
      setIsSupported(false);
      return;
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      console.log("[Audio] recognition started");
    };

    recognition.onresult = (event: any) => {
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += piece + " ";
        } else {
          interim += piece;
        }
      }

      // Display = final so far + interim
      setTranscript((finalTranscriptRef.current + interim).trim());
      const finalLen = finalTranscriptRef.current.trim().length;
      const interimLen = interim.trim().length;
      if (finalLen || interimLen) {
        console.debug("[Audio] onresult:", { finalLen, interimLen });
      }
    };

    recognition.onerror = (event: any) => {
      console.error("[Audio] recognition error:", event.error);
      if (event.error === "no-speech") {
        // Silently handle no-speech errors
        return;
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      // If recording stopped intentionally, send final transcript once
      if (!isRecordingRef.current) {
        const toSend = finalTranscriptRef.current.trim();
        console.log("[Audio] recognition ended. Final length:", toSend.length);
        if (toSend) {
          try {
            onTranscriptComplete(toSend);
          } finally {
            finalTranscriptRef.current = "";
            setTranscript("");
          }
        }
        return;
      }
      // If still recording (spontaneous end), restart
      try {
        console.log("[Audio] recognition ended unexpectedly; restarting...");
        recognition.start();
      } catch (e) {
        console.error("[Audio] Error restarting recognition:", e);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        console.log("[Audio] cleanup: stopping recognition");
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    // Keep a live ref of recording state for event handlers
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  const startRecording = () => {
    if (!recognitionRef.current) return;

    finalTranscriptRef.current = "";
    setTranscript("");
    setIsRecording(true);

    try {
      console.log("[Audio] start recording");
      recognitionRef.current.start();
    } catch (e) {
      console.error("[Audio] Error starting recognition:", e);
    }
  };

  const stopRecording = () => {
    if (!recognitionRef.current) return;

    setIsRecording(false);
    console.log("[Audio] stop recording requested");
    recognitionRef.current.stop();
    // onend handler will emit the final transcript after engine flushes
  };

  if (!isSupported) {
    return (
      <div
        style={{
          padding: "8px 10px",
          fontSize: 12,
          color: "#f59e0b",
          backgroundColor: "#fffbeb",
          borderRadius: 6,
          border: "1px solid #fbbf24",
        }}
      >
        Voice recording is not supported in this browser. Please use Chrome,
        Edge, or Safari.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {isRecording && (
        <div
          style={{
            padding: "8px 10px",
            fontSize: 12,
            color: "#e5e7eb",
            backgroundColor: "#1f2937",
            borderRadius: 6,
            border: "1px solid #ef4444",
            minHeight: 40,
          }}
        >
          {transcript || "Listening..."}
        </div>
      )}

      <div style={{ display: "flex", gap: 6 }}>
        {!isRecording ? (
          <button
            onClick={startRecording}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 8,
              border: "none",
              backgroundColor: "#ef4444",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 16 }}>🎤</span>
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 8,
              border: "none",
              backgroundColor: "#dc2626",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          >
            <span style={{ fontSize: 16 }}>⏹</span>
            Stop Recording
          </button>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;
