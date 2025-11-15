// src/HomePage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Option definitions
const gradeLevelOptions = [
  { value: "elementary", label: "Elementary" },
  { value: "middle", label: "Middle school" },
  { value: "high-standard", label: "High school" },
  { value: "high-ap", label: "High school (AP / IB)" },
  { value: "college-intro", label: "College intro" },
  { value: "college-advanced", label: "College advanced" },
];

const subjectOptions = [
  { value: "general", label: "General / mixed" },
  { value: "math", label: "Math" },
  { value: "science", label: "Science" },
  { value: "history", label: "History / Social Studies" },
  { value: "english", label: "English / ELA" },
  { value: "cs", label: "Computer Science" },
  { value: "economics", label: "Economics" },
];

const studentLevelOptions = [
  { value: "struggling", label: "Struggling" },
  { value: "approaching", label: "Approaching grade level" },
  { value: "on-level", label: "On grade level" },
  { value: "advanced", label: "Advanced" },
  { value: "gifted", label: "Gifted" },
];

const explanationStyleOptions = [
  { value: "concise", label: "Concise summary" },
  { value: "step-by-step", label: "Step-by-step reasoning" },
  { value: "examples", label: "Examples-based" },
  { value: "analogy", label: "Metaphor / analogy" },
  { value: "socratic", label: "Socratic (guided questions)" },
];

const studentPersonaOptions = [
  { value: "curious", label: "Curious, asks many questions" },
  { value: "quiet", label: "Quiet, needs prompting" },
  { value: "distracted", label: "Distracted, loses the thread" },
  { value: "confident", label: "Confident, sometimes overestimates" },
  { value: "skeptical", label: "Skeptical, challenges assumptions" },
];

// helper to cycle through options
function cycleOption(
  currentValue: string,
  options: { value: string; label: string }[],
  direction: "prev" | "next"
): string {
  const idx = options.findIndex((o) => o.value === currentValue);
  if (idx === -1) return options[0].value;
  if (direction === "next") {
    return options[(idx + 1) % options.length].value;
  }
  return options[(idx - 1 + options.length) % options.length].value;
}

interface RotatingSelectorProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (newValue: string) => void;
}

const RotatingSelector: React.FC<RotatingSelectorProps> = ({
  label,
  value,
  options,
  onChange,
}) => {
  const current = options.find((o) => o.value === value) ?? options[0];

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 22,
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Left label */}
      <div
        style={{
          fontWeight: 600,
          fontSize: 15,
          color: "#111827",
          marginRight: 16,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>

      {/* Selector pill */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          borderRadius: 9999,
          border: "1px solid #c4b5fd",
          background: "#eef2ff",
          padding: "6px 14px",
          minWidth: 280,
          justifyContent: "space-between",
        }}
      >
        {/* Left arrow */}
        <button
          type="button"
          onClick={() => onChange(cycleOption(value, options, "prev"))}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Previous option"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4f46e5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Current value */}
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#1f2937",
            textAlign: "center",
            flexGrow: 1,
            fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          {current.label}
        </span>

        {/* Right arrow */}
        <button
          type="button"
          onClick={() => onChange(cycleOption(value, options, "next"))}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Next option"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4f46e5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const HomePage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);

  // still sending these if you want them on backend
  const [presentationMode] = useState<string>("teacher");
  const [aiDetailLevel] = useState<string>("concise");
  const [theme] = useState<string>("light");

  // student simulation settings
  const [gradeLevel, setGradeLevel] = useState<string>("college-intro");
  const [subject, setSubject] = useState<string>("general");
  const [studentLevel, setStudentLevel] = useState<string>("on-level");
  const [explanationStyle, setExplanationStyle] =
    useState<string>("step-by-step");
  const [studentPersona, setStudentPersona] = useState<string>("curious");

  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

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

      formData.append("presentationMode", presentationMode);
      formData.append("aiDetailLevel", aiDetailLevel);
      formData.append("theme", theme);

      formData.append("gradeLevel", gradeLevel);
      formData.append("subject", subject);
      formData.append("studentLevel", studentLevel);
      formData.append("explanationStyle", explanationStyle);
      formData.append("studentPersona", studentPersona);

      // Call real backend upload endpoint
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      // Persist slides for viewer (stateless backend expects local storage)
      // data.slides: Array<{ index: number; image_url: string; s3_url?: string }>
      localStorage.setItem("slides", JSON.stringify(data.slides || []));

      // Generate a simple client-side presentation id (viewer doesn't use it to fetch)
      const presentationId = String(Date.now());

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
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 820,
          background: "#ffffff",
          borderRadius: 16,
          boxShadow: "0 12px 35px rgba(0,0,0,0.08)",
          padding: 32,
        }}
      >
        <h1 style={{ marginBottom: 8 }}>Slide Companion</h1>
        <p style={{ marginTop: 0, marginBottom: 24, color: "#555" }}>
          Upload a PDF and configure how the slide viewer and simulated student
          should behave.
        </p>

        <form onSubmit={handleSubmit}>
          {/* PDF upload card */}
          <div style={{ marginBottom: 32 }}>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: 12,
                fontSize: 20,
                textAlign: "center",
              }}
            >
              Add document
            </label>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const dropped = e.dataTransfer.files?.[0];
                if (!dropped) return;
                if (dropped.type !== "application/pdf") {
                  alert("Only PDF files are allowed.");
                  return;
                }
                setFile(dropped);
              }}
              style={{
                border: "2px dashed #d1d5db",
                borderRadius: 12,
                padding: "40px 24px",
                textAlign: "center",
                background: "#fafafa",
                cursor: "pointer",
              }}
              onClick={() => document.getElementById("pdf-file")?.click()}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "#e6f4ea",
                  margin: "0 auto 16px auto",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  fill="#3b7f4a"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 3l4 4h-3v6h-2V7H8l4-4zm-7 14v2h14v-2h2v4H3v-4h2z" />
                </svg>
              </div>

              <div style={{ fontSize: 16 }}>
                <span
                  style={{
                    color: "#2563eb",
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Upload a file
                </span>{" "}
                or drag and drop
              </div>

              <div
                style={{
                  marginTop: 10,
                  fontSize: 14,
                  color: "#6b7280",
                }}
              >
                Acceptable file type: <strong>.pdf</strong>, up to 5MB
              </div>
            </div>

            <input
              id="pdf-file"
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const uploaded = e.target.files?.[0];
                if (!uploaded) return;
                if (uploaded.type !== "application/pdf") {
                  alert("Please upload a PDF file.");
                  return;
                }
                setFile(uploaded);
              }}
              style={{ display: "none" }}
            />

            {file && (
              <p style={{ marginTop: 12, fontSize: 15, color: "#374151" }}>
                Selected: <strong>{file.name}</strong>
              </p>
            )}
          </div>

          {/* Student simulation card */}
          <div
            style={{
              border: "2px dashed #c4b5fd",
              borderRadius: 12,
              padding: "20px 18px",
              background: "#f5f3ff",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 18,
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "#e0e7ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="7" r="4" />
                  <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
                </svg>
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 16,
                    color: "#111827",
                    fontFamily:
                      "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
                  }}
                >
                  Student simulation
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#6b7280",
                  }}
                >
                  Cycle through different student profiles with the arrows.
                </div>
              </div>
            </div>

            <RotatingSelector
              label="Grade level"
              value={gradeLevel}
              options={gradeLevelOptions}
              onChange={setGradeLevel}
            />

            <RotatingSelector
              label="Subject"
              value={subject}
              options={subjectOptions}
              onChange={setSubject}
            />

            <RotatingSelector
              label="Student understanding level"
              value={studentLevel}
              options={studentLevelOptions}
              onChange={setStudentLevel}
            />

            <RotatingSelector
              label="Explanation style"
              value={explanationStyle}
              options={explanationStyleOptions}
              onChange={setExplanationStyle}
            />

            <RotatingSelector
              label="Student persona"
              value={studentPersona}
              options={studentPersonaOptions}
              onChange={setStudentPersona}
            />
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
              fontFamily:
                "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
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
