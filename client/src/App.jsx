import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [studyUnitName, setStudyUnitName] = useState("");
  const [studyUnits, setStudyUnits] = useState([]);
  const [selectedStudyUnit, setSelectedStudyUnit] = useState("");

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const [documents, setDocuments] = useState([]);

  const [errorMessage, setErrorMessage] = useState("");

  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchStudyUnits = async () => {
      try {
        setErrorMessage("");

        const response = await fetch(
          "http://localhost:5001/api/study-units"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch study units");
        }

        const data = await response.json();

        setStudyUnits(data.studyUnits);
      } catch (error) {
        console.error("Failed to load study units:", error);

        setErrorMessage(
          "Failed to load study units. Please make sure the server is running."
        );
      }
    };

    fetchStudyUnits();
  }, []);

  const fetchDocuments = async (studyUnitId) => {
    try {
      const response = await fetch(
        `http://localhost:5001/api/documents?studyUnitId=${studyUnitId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }

      const data = await response.json();

      setDocuments(data.documents);
    } catch (error) {
      console.error("Failed to load documents:", error);

      setErrorMessage("Failed to load documents.");
    }
  };

  const handleCreateStudyUnit = async () => {
    if (!studyUnitName.trim()) {
      setErrorMessage("Please enter a study unit name.");
      return;
    }

    try {
      setErrorMessage("");

      const response = await fetch(
        "http://localhost:5001/api/study-units",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: studyUnitName
          })
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create study unit");
      }

      const data = await response.json();

      setStudyUnits((previousUnits) => [
        data.studyUnit,
        ...previousUnits
      ]);

      setSelectedStudyUnit(data.studyUnit._id);
      setStudyUnitName("");

      setDocuments([]);
      setMessages([]);
      setUploadMessage("");

      await fetchDocuments(data.studyUnit._id);
    } catch (error) {
      console.error("Study unit creation failed:", error);

      setErrorMessage("Failed to create study unit.");
    }
  };

  const handleFiles = (selectedFiles) => {
    const pdfFiles = Array.from(selectedFiles).filter(
      (file) =>
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
    );

    if (pdfFiles.length === 0) {
      setErrorMessage("Please select PDF files only.");
      return;
    }

    setFiles(pdfFiles);
    setErrorMessage("");
    setUploadMessage("");
  };

  const handleFileChange = (event) => {
    handleFiles(event.target.files);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);

    handleFiles(event.dataTransfer.files);
  };

  const removeSelectedFile = (indexToRemove) => {
    setFiles((previousFiles) =>
      previousFiles.filter(
        (_, index) => index !== indexToRemove
      )
    );
  };

  const handleUpload = async () => {
    if (!selectedStudyUnit) {
      setErrorMessage("Please select a study unit first.");
      return;
    }

    if (files.length === 0) {
      setErrorMessage("Please select at least one PDF.");
      return;
    }

    try {
      setUploading(true);
      setUploadMessage("");
      setErrorMessage("");

      const formData = new FormData();

      formData.append("studyUnitId", selectedStudyUnit);

      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(
        "http://localhost:5001/api/documents/upload",
        {
          method: "POST",
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();

      setUploadMessage(
        data.message || "PDFs uploaded successfully."
      );

      setFiles([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await fetchDocuments(selectedStudyUnit);
    } catch (error) {
      console.error("Upload failed:", error);

      setErrorMessage(
        "Failed to upload PDFs. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (filename) => {
    if (!selectedStudyUnit) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${filename}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setErrorMessage("");

      const response = await fetch(
        `http://localhost:5001/api/documents?studyUnitId=${selectedStudyUnit}&filename=${encodeURIComponent(
          filename
        )}`,
        {
          method: "DELETE"
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      await fetchDocuments(selectedStudyUnit);

      setMessages([]);

      setUploadMessage(
        `"${filename}" was deleted successfully.`
      );
    } catch (error) {
      console.error("Document deletion failed:", error);

      setErrorMessage("Failed to delete document.");
    }
  };

  const handleSearch = async () => {
    if (!selectedStudyUnit) {
      setErrorMessage("Please select a study unit first.");
      return;
    }

    if (!question.trim()) {
      setErrorMessage("Please enter a question.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const currentQuestion = question.trim();

      const response = await fetch(
        "http://localhost:5001/api/search",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            question: currentQuestion,
            studyUnitId: selectedStudyUnit
          })
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get answer");
      }

      const data = await response.json();

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          question: currentQuestion,
          answer: data.answer,
          sources: data.sources || []
        }
      ]);

      setQuestion("");
    } catch (error) {
      console.error("Search failed:", error);

      setErrorMessage(
        "Failed to get an answer. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedUnit = studyUnits.find(
    (unit) => unit._id === selectedStudyUnit
  );

  return (
    <div className="app-shell">
      {errorMessage && (
        <div className="alert alert-error">
          <div className="alert-icon">!</div>

          <div className="alert-content">
            <strong>Something went wrong</strong>
            <span>{errorMessage}</span>
          </div>

          <button
            className="alert-close"
            onClick={() => setErrorMessage("")}
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}

      {uploadMessage && (
        <div className="alert alert-success">
          <div className="alert-icon">✓</div>

          <div className="alert-content">
            <strong>Success</strong>
            <span>{uploadMessage}</span>
          </div>

          <button
            className="alert-close"
            onClick={() => setUploadMessage("")}
            aria-label="Close success message"
          >
            ×
          </button>
        </div>
      )}

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">✦</div>

          <div>
            <div className="brand-name">
              Research & Study Intelligence
            </div>

            <div className="brand-tagline">
              Your document-grounded study assistant
            </div>
          </div>
        </div>

        <div className="status-pill">
          <span className="status-dot"></span>
          AI Study Workspace
        </div>
      </header>

      <main className="main-container">
        <section className="hero-section">
          <div className="hero-content">
            <div className="eyebrow">
              <span>RESEARCH</span>
              <span className="eyebrow-line"></span>
              <span>LEARN</span>
            </div>

            <h1>
              Turn your study material
              <br />
              into an <em>intelligent workspace.</em>
            </h1>

            <p>
              Upload your study documents, organize them by unit,
              and ask questions using information from your own
              material.
            </p>
          </div>

          <div className="hero-orbit">
            <div className="orbit-card orbit-card-main">
              <span className="orbit-icon">✦</span>
              <span>Ask your material</span>
            </div>

            <div className="orbit-card orbit-card-small orbit-one">
              PDF
            </div>

            <div className="orbit-card orbit-card-small orbit-two">
              AI
            </div>

            <div className="orbit-ring"></div>
          </div>
        </section>

        <section className="how-section">
          <div className="section-heading centered">
            <span className="section-label">HOW IT WORKS</span>
            <h2>Three steps to smarter study</h2>
            <p>
              Everything stays organized inside your study
              workspace.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>

              <div className="step-icon">▦</div>

              <h3>Create a Study Unit</h3>

              <p>
                Create a workspace for one topic, subject, or
                exam unit.
              </p>

              <span className="step-example">
                Example: Operating Systems — Unit 1
              </span>
            </div>

            <div className="step-connector"></div>

            <div className="step-card">
              <div className="step-number">02</div>

              <div className="step-icon">□</div>

              <h3>Add Study Material</h3>

              <p>
                Upload one or multiple PDFs related to that
                study unit.
              </p>

              <span className="step-example">
                Notes • Books • Faculty Material
              </span>
            </div>

            <div className="step-connector"></div>

            <div className="step-card">
              <div className="step-number">03</div>

              <div className="step-icon">✦</div>

              <h3>Ask Questions</h3>

              <p>
                Ask questions and receive answers based on your
                uploaded documents.
              </p>

              <span className="step-example">
                Compare • Explain • Summarize
              </span>
            </div>
          </div>
        </section>

        <section className="workspace-section">
          <div className="section-heading">
            <span className="section-label">YOUR WORKSPACE</span>

            <h2>Organize your research</h2>

            <p>
              A study unit keeps related documents together so
              your questions stay focused on the right material.
            </p>
          </div>

          <div className="workspace-grid">
            <div className="create-card">
              <div className="card-top">
                <div>
                  <span className="mini-label">
                    NEW WORKSPACE
                  </span>

                  <h3>Create a Study Unit</h3>
                </div>

                <div className="card-symbol">+</div>
              </div>

              <p className="card-description">
                Group documents that belong to the same topic,
                subject, or exam unit.
              </p>

              <label htmlFor="study-unit-name">
                Study unit name
              </label>

              <input
                id="study-unit-name"
                type="text"
                placeholder="e.g. Operating Systems — Unit 1"
                value={studyUnitName}
                onChange={(event) =>
                  setStudyUnitName(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleCreateStudyUnit();
                  }
                }}
              />

              <button
                className="primary-button full-button"
                onClick={handleCreateStudyUnit}
              >
                Create Study Unit
                <span>→</span>
              </button>
            </div>

            <div className="units-card">
              <div className="card-top">
                <div>
                  <span className="mini-label">
                    EXISTING WORKSPACES
                  </span>

                  <h3>Your Study Units</h3>
                </div>

                <div className="unit-count">
                  {studyUnits.length}
                </div>
              </div>

              {studyUnits.length === 0 ? (
                <div className="empty-small">
                  <div className="empty-icon">▦</div>

                  <strong>No study units yet</strong>

                  <span>
                    Create your first study unit to begin.
                  </span>
                </div>
              ) : (
                <div className="unit-list">
                  {studyUnits.map((unit) => (
                    <button
                      className={`unit-item ${
                        selectedStudyUnit === unit._id
                          ? "active"
                          : ""
                      }`}
                      key={unit._id}
                      onClick={() => {
                        setSelectedStudyUnit(unit._id);
                        setMessages([]);
                        setDocuments([]);
                        setErrorMessage("");
                        setUploadMessage("");
                        fetchDocuments(unit._id);
                      }}
                    >
                      <div className="unit-icon">▦</div>

                      <div className="unit-info">
                        <strong>{unit.name}</strong>

                        <span>
                          Study workspace
                        </span>
                      </div>

                      <span className="unit-arrow">→</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {selectedStudyUnit && (
          <>
            <section className="active-workspace">
              <div className="active-header">
                <div>
                  <span className="section-label">
                    ACTIVE STUDY UNIT
                  </span>

                  <h2>
                    {selectedUnit?.name ||
                      "Selected Study Unit"}
                  </h2>

                  <p>
                    Your documents and questions are organized
                    inside this workspace.
                  </p>
                </div>

                <div className="ready-badge">
                  <span></span>
                  Ready
                </div>
              </div>

              <div className="active-stats">
                <div>
                  <strong>{documents.length}</strong>
                  <span>
                    {documents.length === 1
                      ? "Document"
                      : "Documents"}
                  </span>
                </div>

                <div>
                  <strong>{messages.length}</strong>
                  <span>
                    {messages.length === 1
                      ? "Question"
                      : "Questions"}
                  </span>
                </div>

                <div>
                  <strong>AI</strong>
                  <span>Powered Search</span>
                </div>
              </div>
            </section>

            <section className="content-section">
              <div className="section-heading">
                <span className="section-label">
                  STEP 02 · STUDY MATERIAL
                </span>

                <h2>Add your study material</h2>

                <p>
                  Upload one or multiple PDF files related to
                  <strong>
                    {" "}
                    {selectedUnit?.name}
                  </strong>
                  .
                </p>
              </div>

              <div
                className={`drop-zone ${
                  dragActive ? "drag-active" : ""
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() =>
                  fileInputRef.current?.click()
                }
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  multiple
                  onChange={handleFileChange}
                  hidden
                />

                <div className="upload-icon">
                  ↑
                </div>

                <h3>
                  Drop your PDFs here
                </h3>

                <p>
                  or click to browse files
                </p>

                <span className="upload-note">
                  PDF files · One or multiple documents
                </span>
              </div>

              {files.length > 0 && (
                <div className="selected-files">
                  <div className="selected-header">
                    <div>
                      <span className="mini-label">
                        READY TO UPLOAD
                      </span>

                      <h3>
                        {files.length}{" "}
                        {files.length === 1
                          ? "document"
                          : "documents"}{" "}
                        selected
                      </h3>
                    </div>
                  </div>

                  <div className="file-list">
                    {files.map((file, index) => (
                      <div
                        className="file-item"
                        key={`${file.name}-${index}`}
                      >
                        <div className="pdf-badge">
                          PDF
                        </div>

                        <div className="file-info">
                          <strong>{file.name}</strong>

                          <span>
                            {(file.size / 1024 / 1024).toFixed(
                              2
                            )}{" "}
                            MB
                          </span>
                        </div>

                        <button
                          className="remove-file"
                          onClick={(event) => {
                            event.stopPropagation();
                            removeSelectedFile(index);
                          }}
                          aria-label={`Remove ${file.name}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    className="primary-button upload-button"
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading
                      ? "Processing documents..."
                      : `Upload ${
                          files.length
                        } ${
                          files.length === 1
                            ? "document"
                            : "documents"
                        }`}
                    {!uploading && <span>→</span>}
                  </button>
                </div>
              )}
            </section>

            <section className="content-section">
              <div className="section-heading section-heading-row">
                <div>
                  <span className="section-label">
                    YOUR KNOWLEDGE BASE
                  </span>

                  <h2>Study material</h2>

                  <p>
                    Documents currently connected to this
                    study unit.
                  </p>
                </div>

                <div className="document-count">
                  {documents.length}{" "}
                  {documents.length === 1
                    ? "document"
                    : "documents"}
                </div>
              </div>

              {documents.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-large-icon">
                    □
                  </div>

                  <h3>
                    No study material yet
                  </h3>

                  <p>
                    Upload PDFs above to build the knowledge
                    base for this study unit.
                  </p>
                </div>
              ) : (
                <div className="documents-grid">
                  {documents.map((document, index) => (
                    <div
                      className="document-card"
                      key={`${document}-${index}`}
                    >
                      <div className="document-icon">
                        PDF
                      </div>

                      <div className="document-info">
                        <strong>{document}</strong>

                        <span>
                          Available for AI search
                        </span>
                      </div>

                      <button
                        className="document-delete"
                        onClick={() =>
                          handleDeleteDocument(document)
                        }
                        title="Delete document"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="ask-section">
              <div className="ask-header">
                <div className="ai-mark">✦</div>

                <div>
                  <span className="section-label">
                    STEP 03 · AI STUDY ASSISTANT
                  </span>

                  <h2>
                    Ask your study material
                  </h2>

                  <p>
                    Ask questions using the documents in this
                    study unit.
                  </p>
                </div>
              </div>

              <div className="question-box">
                <textarea
                  placeholder="Ask something about your study material..."
                  value={question}
                  onChange={(event) =>
                    setQuestion(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();
                      handleSearch();
                    }
                  }}
                  rows="3"
                />

                <div className="question-footer">
                  <span>
                    Press Enter to ask · Shift + Enter for a
                    new line
                  </span>

                  <button
                    className="ask-button"
                    onClick={handleSearch}
                    disabled={
                      loading || !question.trim()
                    }
                  >
                    {loading
                      ? "Thinking..."
                      : "Ask AI"}
                    {!loading && <span>↗</span>}
                  </button>
                </div>
              </div>

              <div className="suggestion-area">
                <span>Try asking</span>

                <button
                  onClick={() =>
                    setQuestion(
                      "What are the main concepts explained in these documents?"
                    )
                  }
                >
                  Main concepts
                </button>

                <button
                  onClick={() =>
                    setQuestion(
                      "Explain this topic in simple terms."
                    )
                  }
                >
                  Explain simply
                </button>

                <button
                  onClick={() =>
                    setQuestion(
                      "Compare the important points across the documents."
                    )
                  }
                >
                  Compare documents
                </button>
              </div>
            </section>

            {messages.length === 0 && (
              <div className="ready-to-study">
                <div className="ready-icon">✦</div>

                <div>
                  <strong>
                    Your study assistant is ready.
                  </strong>

                  <span>
                    Upload material and ask your first
                    question to begin a study session.
                  </span>
                </div>
              </div>
            )}

            {messages.length > 0 && (
              <section className="conversation-section">
                <div className="section-heading">
                  <span className="section-label">
                    STUDY SESSION
                  </span>

                  <h2>
                    Your conversation
                  </h2>

                  <p>
                    Questions and answers from your current
                    study session.
                  </p>
                </div>

                <div className="conversation-list">
                  {messages.map((message, index) => (
                    <article
                      className="conversation-item"
                      key={index}
                    >
                      <div className="question-row">
                        <div className="avatar user-avatar">
                          You
                        </div>

                        <div className="message-content">
                          <span className="message-label">
                            YOUR QUESTION
                          </span>

                          <p>
                            {message.question}
                          </p>
                        </div>
                      </div>

                      <div className="answer-row">
                        <div className="avatar ai-avatar">
                          ✦
                        </div>

                        <div className="answer-content">
                          <span className="message-label">
                            AI ANSWER
                          </span>

                          <div className="answer-text">
                            {message.answer}
                          </div>

                          {message.sources.length > 0 && (
                            <div className="sources">
                              <div className="sources-heading">
                                <span>
                                  SOURCES
                                </span>

                                <small>
                                  Based on your documents
                                </small>
                              </div>

                              <div className="source-list">
                                {message.sources.map(
                                  (
                                    source,
                                    sourceIndex
                                  ) => (
                                    <div
                                      className="source-card"
                                      key={
                                        sourceIndex
                                      }
                                    >
                                      <div className="source-number">
                                        {sourceIndex +
                                          1}
                                      </div>

                                      <div>
                                        <strong>
                                          {
                                            source.filename
                                          }
                                        </strong>

                                        <p>
                                          {
                                            source.text
                                          }
                                        </p>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <footer className="footer">
        <div>
          <strong>
            Research & Study Intelligence
          </strong>

          <span>
            Learn from the material you provide.
          </span>
        </div>

        <span>
          AI-powered document research
        </span>
      </footer>
    </div>
  );
}

export default App;