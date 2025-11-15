// src/LandingPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // Dynamically control video size
  const [videoSize, setVideoSize] = useState<number>(200); // smaller default

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      // Snail width = 18% of viewport width (keeps it cute + small)
      const size = Math.min(Math.max(width * 0.18, 150), 300);
      setVideoSize(size);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        background: "linear-gradient(180deg, #eef2ff, #ffffff)",
        fontFamily: "'Inter', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        paddingTop: "8vh",
      }}
    >
      {/* Snail Animation */}
      <video
        src="/snail.webm"
        autoPlay
        loop
        muted
        playsInline
        style={{
          width: `${videoSize}px`,
          height: "auto",
          opacity: 0.95,
          zIndex: 2,
          pointerEvents: "none",
          marginBottom: "20px",
        }}
      />

      {/* Hero text and button */}
      <div
        style={{
          textAlign: "center",
          zIndex: 3,
          padding: "0 16px",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(36px, 6vw, 70px)",
            fontWeight: 700,
            marginBottom: 12,
            color: "#111827",
          }}
        >
          Teach the snail.
        </h1>

        <p
          style={{
            fontSize: "18px",
            color: "#4b5563",
            marginBottom: 32,
          }}
        >
          Learning is a marathon not a sprint. Create lectures that help students.
        </p>

        <button
          onClick={() => navigate("/home")}
          style={{
            padding: "14px 32px",
            fontSize: "18px",
            borderRadius: 12,
            background: "#4f46e5",
            border: "none",
            color: "white",
            cursor: "pointer",
            fontWeight: 600,
            boxShadow: "0 8px 20px rgba(79, 70, 229, 0.25)",
            transition: "transform 0.12s ease, box-shadow 0.12s ease",
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "scale(0.95)";
            e.currentTarget.style.boxShadow =
              "0 4px 12px rgba(79, 70, 229, 0.25)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow =
              "0 8px 20px rgba(79, 70, 229, 0.25)";
          }}
        >
          Go →
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
