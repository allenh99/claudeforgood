// src/SlideViewer.tsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

interface Slide {
  id: number;
  imageUrl: string;
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

  // Fetch slide data when the viewer loads
  useEffect(() => {
    const fetchSlides = async () => {
      if (!presentationId) {
        setError("Missing presentation id.");
        setLoadingSlides(false);
        return;
      }

      try {
        // Replace with your actual backend endpoint
        // const res = await fetch(
        //   `http://localhost:8000/api/presentations/${presentationId}`
        // );
        // if (!res.ok) throw new Error("Failed to load slides");
        // const data = await res.json();
        // setSlides(data.slides as Slide[]);

        // Hackathon stub demo
        const demoSlides: Slide[] = [
          { id: 1, imageUrl: "/slides/slides_1.png" },
          { id: 2, imageUrl: "/slides/slides_2.png" },
          { id: 3, imageUrl: "/slides/slide_3.png" },
        ];
        setSlides(demoSlides);
        setCurrentSlideIndex(0);
      } catch (err) {
        console.error(err);
        setError("Could not load slides for this presentation.");
      } finally {
        setLoadingSlides(false);
      }
    };

    fetchSlides();
  }, [presentationId]);

  const currentSlide = slides[currentSlideIndex];

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

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      sender: "user",
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);
    setChatInput("");

    // Later: call your backend assistant endpoint and append an assistant reply
    // const res = await fetch("http://localhost:8000/api/assistant", {...})
    // const data = await res.json();
    // setMessages(prev => [...prev, { id: Date.now() + 1, sender: "assistant", text: data.reply }]);
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
          position: "relative",
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
            position: "fixed",
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

        {/* Chat toggle button */}
        <button
          onClick={handleToggleChat}
          style={{
            position: "fixed",
            right: 24,
            bottom: 24,
            padding: "10px 18px",
            borderRadius: 9999,
            border: "none",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: 14,
            boxShadow: "0 10px 25px rgba(37,99,235,0.5)",
            cursor: "pointer",
          }}
        >
          {isChatOpen ? "Hide assistant" : "Ask the assistant"}
        </button>
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
