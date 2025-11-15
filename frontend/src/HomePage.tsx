// src/HomePage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const HomePage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [presentationMode, setPresentationMode] = useState<string>("teacher");
  const [aiDetailLevel, setAiDetailLevel] = useState<string>("concise");
  const [theme, setTheme] = useState<string>("light");
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;
    setFile(uploaded);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      alert("Please upload a PowerPoint file first.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("presentationMode", presentationMode);
      formData.append("aiDetailLevel", aiDetailLevel);
      formData.append("theme", theme);

      // Replace this with your real backend endpoint
      // const res = await fetch("http://localhost:8000/api/upload", {
      //   method: "POST",
      //   body: formData,
      // });
      // if (!res.ok) throw new Error("Upload failed");
      // const data = await res.json();
      // const presentationId = data.presentationId as string;

      // Hackathon stub
      const presentationId = "demo";

      console.log("Submitted with:", {
        file,
        presentationMode,
        aiDetailLevel,
        theme,
      });

      navigate(`/viewer/${presentationId}`);
    } catch (err) {
      console.error(err);
      alert("Something went wrong while processing your file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f5f7",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          background: "#ffffff",
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          padding: 32,
        }}
      >
        <h1 style={{ marginBottom: 8 }}>Slide Companion</h1>
        <p style={{ marginTop: 0, marginBottom: 24, color: "#555" }}>
          Upload a PowerPoint and configure how you want the slide viewer and AI
          features to behave.
        </p>

        <form onSubmit={handleSubmit}>
          {/* File upload */}
          <div style={{ marginBottom: 24 }}>
            <label
              htmlFor="pptx-file"
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              PowerPoint file
            </label>
            <input
              id="pptx-file"
              type="file"
              accept=".ppt,.pptx"
              onChange={handleFileChange}
            />
            {file && (
              <p style={{ marginTop: 8, fontSize: 14, color: "#444" }}>
                Selected: <strong>{file.name}</strong>
              </p>
            )}
          </div>

          {/* Presentation mode */}
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="presentation-mode"
              style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
            >
              Presentation mode
            </label>
            <select
              id="presentation-mode"
              value={presentationMode}
              onChange={(e) => setPresentationMode(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            >
              <option value="teacher">Teacher view</option>
              <option value="student">Student view</option>
              <option value="review">Review mode (notes and feedback)</option>
            </select>
            <small style={{ color: "#777" }}>
              Controls which UI elements appear during slide playback.
            </small>
          </div>

          {/* AI detail level */}
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="ai-detail-level"
              style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
            >
              AI explanation detail
            </label>
            <select
              id="ai-detail-level"
              value={aiDetailLevel}
              onChange={(e) => setAiDetailLevel(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            >
              <option value="concise">Concise summary per slide</option>
              <option value="standard">Standard explanation</option>
              <option value="deep">Deep dive with examples</option>
            </select>
            <small style={{ color: "#777" }}>
              Controls how detailed AI generated explanations should be for each
              slide.
            </small>
          </div>

          {/* Theme */}
          <div style={{ marginBottom: 24 }}>
            <label
              htmlFor="theme"
              style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
            >
              Viewer theme
            </label>
            <select
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="high-contrast">High contrast</option>
            </select>
            <small style={{ color: "#777" }}>
              Sets the color scheme for the slide viewer.
            </small>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: loading ? "#888" : "#2563eb",
              color: "#fff",
              fontWeight: 600,
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "Processing..." : "Continue to slide viewer"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default HomePage;
