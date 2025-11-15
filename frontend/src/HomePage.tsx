// src/HomePage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const HomePage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);

  // New student simulation settings
  const [gradeLevel, setGradeLevel] = useState<string>("college-intro");
  const [subject, setSubject] = useState<string>("general");
  const [studentLevel, setStudentLevel] = useState<string>("on-level");
  const [explanationStyle, setExplanationStyle] = useState<string>("step-by-step");
  const [studentPersona, setStudentPersona] = useState<string>("curious");

  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    if (uploaded.type !== "application/pdf") {
      alert("Please upload a PDF file.");
      return;
    }

    setFile(uploaded);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      alert("Please upload a PDF file first.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // New settings
      formData.append("gradeLevel", gradeLevel);
      formData.append("subject", subject);
      formData.append("studentLevel", studentLevel);
      formData.append("explanationStyle", explanationStyle);
      formData.append("studentPersona", studentPersona);

      // TODO: replace with real backend call
      // const res = await fetch("http://localhost:8000/api/upload", {
      //   method: "POST",
      //   body: formData,
      // });
      // if (!res.ok) throw new Error("Upload failed");
      // const data = await res.json();
      // const presentationId = data.presentationId as string;

      const presentationId = "demo"; // Hackathon placeholder

      console.log("Submitted with:", {
        file,
        gradeLevel,
        subject,
        studentLevel,
        explanationStyle,
        studentPersona,
      });

      navigate(`/viewer/${presentationId}`);
    } catch (err) {
      console.error(err);
      alert("Something went wrong while processing your PDF.");
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
          maxWidth: 780,
          background: "#ffffff",
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          padding: 32,
        }}
      >
        <h1 style={{ marginBottom: 8 }}>Slide Companion</h1>
        <p style={{ marginTop: 0, marginBottom: 24, color: "#555" }}>
          Upload a PDF and configure how the slide viewer and simulated student
          should behave.
        </p>

        <form onSubmit={handleSubmit}>
          {/* PDF upload */}
          <div style={{ marginBottom: 24 }}>
            <label
              htmlFor="pdf-file"
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              PDF file
            </label>
            <input
              id="pdf-file"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
            />
            {file && (
              <p style={{ marginTop: 8, fontSize: 14, color: "#444" }}>
                Selected: <strong>{file.name}</strong>
              </p>
            )}
          </div>

          {/* Student simulation settings section */}
          <h3 style={{ marginBottom: 8, marginTop: 8 }}>Student simulation</h3>

          {/* Grade level */}
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="grade-level"
              style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
            >
              Grade level
            </label>
            <select
              id="grade-level"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            >
              <option value="elementary">Elementary</option>
              <option value="middle">Middle school</option>
              <option value="high-standard">High school</option>
              <option value="high-ap">High school (AP / IB)</option>
              <option value="college-intro">College intro</option>
              <option value="college-advanced">College advanced</option>
            </select>
          </div>

          {/* Subject */}
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="subject"
              style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
            >
              Subject
            </label>
            <select
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            >
              <option value="general">General / mixed</option>
              <option value="math">Math</option>
              <option value="science">Science</option>
              <option value="history">History / Social Studies</option>
              <option value="english">English / ELA</option>
              <option value="cs">Computer Science</option>
              <option value="economics">Economics</option>
            </select>
          </div>

          {/* Student understanding level */}
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="student-level"
              style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
            >
              Student understanding level
            </label>
            <select
              id="student-level"
              value={studentLevel}
              onChange={(e) => setStudentLevel(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            >
              <option value="struggling">Struggling</option>
              <option value="approaching">Approaching grade level</option>
              <option value="on-level">On grade level</option>
              <option value="advanced">Advanced</option>
              <option value="gifted">Gifted</option>
            </select>
          </div>

          {/* Explanation style */}
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="explanation-style"
              style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
            >
              Explanation style
            </label>
            <select
              id="explanation-style"
              value={explanationStyle}
              onChange={(e) => setExplanationStyle(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            >
              <option value="concise">Concise summary</option>
              <option value="step-by-step">Step-by-step reasoning</option>
              <option value="examples">Examples-based</option>
              <option value="analogy">Metaphor / analogy</option>
              <option value="socratic">Socratic (guided questions)</option>
            </select>
          </div>

          {/* Student persona */}
          <div style={{ marginBottom: 24 }}>
            <label
              htmlFor="student-persona"
              style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
            >
              Student persona
            </label>
            <select
              id="student-persona"
              value={studentPersona}
              onChange={(e) => setStudentPersona(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            >
              <option value="curious">Curious, asks many questions</option>
              <option value="quiet">Quiet, needs prompting</option>
              <option value="distracted">Distracted, loses the thread</option>
              <option value="confident">Confident, sometimes overestimates understanding</option>
              <option value="skeptical">Skeptical, challenges assumptions</option>
            </select>
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
