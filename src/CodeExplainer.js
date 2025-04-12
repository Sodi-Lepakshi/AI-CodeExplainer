import React, { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Spinner, Alert, Button, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';

function CodeExplainer() {
  const [code, setCode] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('Python');
  const [theme, setTheme] = useState('dark');
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);

  const HF_API_KEY = process.env.REACT_APP_HUGGINGFACE_API_TOKEN; // Use environment variable for the Hugging Face API key

  const handleCodeChange = (value) => {
    setCode(value);
  };

  const readOutLoud = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const explainCode = async () => {
    if (!code.trim()) {
      setError('Please enter some code to explain.');
      return;
    }

    setLoading(true);
    setError('');
    setExplanation('');

    const prompt = `Explain the following ${language} code in simple, beginner-friendly English.\n\n⚠️ Do NOT repeat the code or include code blocks. Just give a step-by-step explanation in plain words:\n\n${code}`;

    try {
      const response = await fetch("https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-alpha", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: prompt }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch explanation. Status: ${response.status}`);
      }

      const data = await response.json();
      const rawText = data?.[0]?.generated_text?.trim();
      const explanationOnly = rawText?.replace(prompt, '').trim();

      if (explanationOnly) {
        setExplanation(explanationOnly);
        if (isSpeechEnabled) readOutLoud(explanationOnly);
      } else {
        throw new Error('Explanation text is empty.');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
      setExplanation('Could not generate explanation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`explainer-wrapper ${theme === 'dark' ? 'dark' : 'light'} p-4 rounded shadow`}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">
          <i className="bi bi-robot"></i> AI Code Explainer
        </h2>
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            checked={theme === 'dark'}
            onChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          />
          <label className="form-check-label">
            {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
          </label>
        </div>
      </div>

      <label className="form-label fw-semibold mb-2">
        <i className="bi bi-gear"></i> Choose Language
      </label>
      <Form.Select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="mb-3"
      >
        <option value="Python">Python</option>
        <option value="JavaScript">JavaScript</option>
        <option value="Java">Java</option>
        <option value="C++">C++</option>
      </Form.Select>

      <CodeMirror
        value={code}
        onChange={handleCodeChange}
        theme={theme}
        style={{ minHeight: '200px', marginBottom: '10px' }}
      />

      <div className="d-flex gap-2 mb-3">
        <CopyToClipboard text={code}>
          <Button variant="outline-secondary" size="sm">
            <i className="bi bi-clipboard"></i> Copy Code
          </Button>
        </CopyToClipboard>
        <Button variant="outline-danger" size="sm" onClick={() => setCode('')}>
          <i className="bi bi-arrow-counterclockwise"></i> Reset
        </Button>
      </div>

      <Form.Check
        type="switch"
        id="speechSwitch"
        label="Enable Voice Explanation"
        checked={isSpeechEnabled}
        onChange={() => setIsSpeechEnabled(!isSpeechEnabled)}
      />

      <Button
        className="btn btn-primary w-100 mb-3"
        onClick={explainCode}
        disabled={loading || !code.trim()}
      >
        {loading ? (
          <>
            <Spinner animation="border" size="sm" className="me-2" />
            Thinking...
          </>
        ) : (
          <><i className="bi bi-lightbulb"></i> Explain with AI</>
        )}
      </Button>

      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

      {explanation && (
        <div className="output-box mt-4 p-3 rounded">
          <h5 className="fw-semibold">
            <i className="bi bi-chat-left-text"></i> Explanation
          </h5>
          <pre className="mb-2">{explanation}</pre>
          <CopyToClipboard text={explanation}>
            <Button variant="outline-success" size="sm">
              <i className="bi bi-clipboard-check"></i> Copy Explanation
            </Button>
          </CopyToClipboard>
        </div>
      )}
    </div>
  );
}

export default CodeExplainer;
