// src/SlideViewer.tsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AudioRecorder from "./AudioRecorder";

// Allow overriding API base (useful when serving built files without Vite proxy)
const API_BASE =
  (import.meta as any)?.env?.VITE_API_URL && (import.meta as any).env.VITE_API_URL !== "undefined"
    ? (import.meta as any).env.VITE_API_URL
    : "";

interface Slide {
  id: number;
  imageUrl: string;
  s3Url?: string;
}

interface ChatMessage {
  id: number;
  sender: "user" | "assistant";
  text: string;
}

const SlideViewer: React.FC = () => {
  const { presentationId } = useParams<{ presentationId: string }>();

  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [loadingSlides, setLoadingSlides] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: "assistant",
      text: "Hi! Ask me anything about this slide.",
    },
  ]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isLlmLoading, setIsLlmLoading] = useState<boolean>(false);

  // Fetch slide data when the viewer loads
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        // Load slides from localStorage (stateless backend)
        const raw = localStorage.getItem("slides");
        if (!raw) {
          setError("No slide data found. Please upload a file first.");
          return;
        }
        const storedSlides: Array<{ index: number; image_url: string; s3_url?: string }> =
          JSON.parse(raw);
        const normalized: Slide[] = storedSlides.map((s, i) => ({
          id: i + 1,
          imageUrl: s.image_url,
          s3Url: s.s3_url,
        }));
        if (normalized.length === 0) {
          setError("No slides were generated from your upload.");
          return;
        }
        setSlides(normalized);
        setCurrentSlideIndex(0);
      } catch (err) {
        console.error(err);
        setError("Could not load slides from local storage.");
      } finally {
        setLoadingSlides(false);
      }
    };

    fetchSlides();
  }, [presentationId]);

  const currentSlide = slides[currentSlideIndex];

  // Notify backend whenever the slide changes
  useEffect(() => {
    const notifySlideChange = async () => {
      if (slides.length === 0) return;
      const s3 = slides[currentSlideIndex]?.s3Url;
      if (!s3) {
        console.warn("Slide S3 URL missing; slide change not sent");
        return;
      }
      try {
        await fetch("/api/slide_change", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slide_index: currentSlideIndex,
            slide_url: s3,
          }),
        });
      } catch (e) {
        // non-fatal
        console.warn("Slide change notify failed", e);
      }
    };
    notifySlideChange();
  }, [currentSlideIndex, slides.length]);

  const handleToggleChat = () => {
    setIsChatOpen((prev) => !prev);
  };

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) =>
      prev < slides.length - 1 ? prev + 1 : prev
    );
  };

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const sendMessageToBackend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      sender: "user",
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);

    setIsLlmLoading(true);

    try {
      const s3 = slides[currentSlideIndex]?.s3Url;
      if (!s3) {
        throw new Error("Current slide is missing S3 URL.");
      }
      const payload = {
        teacher_text: trimmed,
        slide_index: currentSlideIndex,
        slide_url: s3,
      };
      const res = await fetch(`${API_BASE}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Feedback request failed");
      const data: { student_feedback?: string } = await res.json();
      const assistantText =
        typeof data?.student_feedback === "string" &&
        data.student_feedback.trim().length > 0
          ? data.student_feedback
          : "Transcript sent to backend.";
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "assistant",
          text: assistantText,
        },
      ]);
    } catch (err) {
      console.error(err);
      // Optionally show a message in the chat about the error
    } finally {
      setIsLlmLoading(false);
    }
  };

  const handleTranscriptComplete = async (text: string) => {
    console.log("[Audio] transcript complete, length:", text?.length || 0);
    await sendMessageToBackend(text);
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessageToBackend(chatInput);
    setChatInput("");
  };

  if (loadingSlides) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a",
          color: "#e5e7eb",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        Loading slides...
      </div>
    );
  }

  if (error || slides.length === 0) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a",
          color: "#e5e7eb",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <p>{error || "No slides found for this presentation."}</p>
        <Link
          to="/"
          style={{
            marginTop: 16,
            padding: "8px 16px",
            borderRadius: 9999,
            backgroundColor: "#2563eb",
            color: "#f9fafb",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Go back to upload
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        backgroundColor: "#0f172a",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Main slide area */}
      <div
        style={{
          flex: 1,
          position: "relative", // important so absolute snail anchors to this
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0f172a",
        }}
      >
        {currentSlide ? (
          <img
            src={currentSlide.imageUrl}
            alt={`Slide ${currentSlideIndex + 1}`}
            style={{
              maxWidth: "96%",
              maxHeight: "92%",
              objectFit: "contain",
              borderRadius: 12,
              boxShadow: "0 18px 40px rgba(0,0,0,0.6)",
              backgroundColor: "#111827",
            }}
          />
        ) : (
          <p style={{ color: "#e5e7eb" }}>No slide selected.</p>
        )}

        {/* Previous / Next slide buttons */}
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 24,
            display: "flex",
            gap: 8,
          }}
        >
          <button
            onClick={handlePrevSlide}
            disabled={currentSlideIndex === 0}
            style={{
              padding: "8px 14px",
              borderRadius: 9999,
              border: "none",
              backgroundColor:
                currentSlideIndex === 0 ? "#4b5563" : "#374151",
              color: "#f9fafb",
              fontSize: 13,
              fontWeight: 500,
              cursor: currentSlideIndex === 0 ? "default" : "pointer",
            }}
          >
            Previous
          </button>
          <button
            onClick={handleNextSlide}
            disabled={currentSlideIndex >= slides.length - 1}
            style={{
              padding: "8px 14px",
              borderRadius: 9999,
              border: "none",
              backgroundColor:
                currentSlideIndex >= slides.length - 1 ? "#4b5563" : "#2563eb",
              color: "#f9fafb",
              fontSize: 13,
              fontWeight: 500,
              cursor:
                currentSlideIndex >= slides.length - 1 ? "default" : "pointer",
            }}
          >
            Next slide
          </button>
        </div>

        {/* Snail icon and thinking animation (absolute, not fixed) */}
        <div
          style={{
            position: "absolute",
            bottom: 24,
            right: 24,
            zIndex: 5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            transition: "transform 0.25s ease",
            transform: isChatOpen ? "translateX(-12px)" : "translateX(0)",
          }}
        >
          {/* Thinking bubble animation above snail while waiting on LLM */}
          {isLlmLoading && (
            <div
              style={{
                width: 180,
                height: 110,
                borderRadius: 18,
                backgroundColor: "rgba(15,23,42,0.95)",
                boxShadow: "0 12px 35px rgba(0,0,0,0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 8,
              }}
            >
              <video
                src="/thinking_bubble.webm"
                autoPlay
                loop
                muted
                playsInline
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: 12,
                }}
              />
            </div>
          )}

          {/* Snail animation as chat toggle */}
          <button
            type="button"
            onClick={handleToggleChat}
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              cursor: "pointer",
            }}
          >
            <video
              src="/snail.webm"
              autoPlay
              loop
              muted
              playsInline
              style={{
                width: 72,
                height: "auto",
                borderRadius: 9999,
                boxShadow: isChatOpen
                  ? "0 0 16px rgba(96,165,250,0.9)"
                  : "0 0 0 rgba(0,0,0,0)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                transform: isChatOpen ? "scale(1.05)" : "scale(1)",
              }}
            />
          </button>
        </div>
      </div>

      {/* Chat sidebar */}
      {isChatOpen && (
        <div
          style={{
            width: 360,
            height: "100%",
            borderLeft: "1px solid rgba(148,163,184,0.4)",
            backgroundColor: "#020617",
            color: "#e5e7eb",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "16px 14px",
              borderBottom: "1px solid rgba(148,163,184,0.4)",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Slide assistant
            </h2>
            <p
              style={{
                marginTop: 4,
                fontSize: 12,
                color: "#9ca3af",
              }}
            >
              Ask questions or request a summary of this slide.
            </p>
          </div>

          {/* Chat log */}
          <div
            style={{
              flex: 1,
              padding: "12px 10px",
              overflowY: "auto",
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  marginBottom: 10,
                  display: "flex",
                  justifyContent:
                    msg.sender === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "8px 10px",
                    borderRadius: 10,
                    fontSize: 13,
                    lineHeight: 1.4,
                    backgroundColor:
                      msg.sender === "user" ? "#1d4ed8" : "#020617",
                    color: msg.sender === "user" ? "#f9fafb" : "#e5e7eb",
                    border:
                      msg.sender === "assistant"
                        ? "1px solid rgba(148,163,184,0.4)"
                        : "none",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Audio Recorder */}
          <div
            style={{
              borderTop: "1px solid rgba(148,163,184,0.4)",
              padding: "8px 8px 0px 8px",
            }}
          >
            <AudioRecorder onTranscriptComplete={handleTranscriptComplete} />
          </div>

          {/* Chat input */}
          <form
            onSubmit={handleSendChat}
            style={{
              borderTop: "1px solid rgba(148,163,184,0.4)",
              padding: "8px 8px 10px 8px",
              display: "flex",
              gap: 6,
            }}
          >
            <input
              type="text"
              placeholder="Ask about this slide..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid rgba(148,163,184,0.7)",
                backgroundColor: "#020617",
                color: "#e5e7eb",
                fontSize: 13,
                outline: "none",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "none",
                backgroundColor: "#22c55e",
                color: "#022c22",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default SlideViewer;
