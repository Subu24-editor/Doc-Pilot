const SYSTEM_INSTRUCTION = `
You are an advanced document intelligence assistant. 
Analyze the provided document context accurately, concisely, and objectively.
Follow formatting instructions strictly. Never make up facts not supported by the document context.
`;

const PROMPT_TEMPLATES = {
  SUMMARIZE: (documentText) => `
${SYSTEM_INSTRUCTION}

Analyze the document provided below and generate an executive summary.

### Formatting Requirements:
1. **Executive Summary**: A high-level overview in 2-3 sentences.
2. **Key Highlights & Findings**:
   - 3 to 7 concise bullet points capturing core facts, data, or arguments.
3. **Action Items / Next Steps**: Any explicit actions required (or "None identified").

---
### Document Text:
${documentText}
---
`,

  ASK_QUESTION: (documentText, question) => `
${SYSTEM_INSTRUCTION}

Answer the user's question using **ONLY** the information present in the Document Context below.

### Rules:
- If the answer is present, keep it direct and factual.
- If the document context DOES NOT contain enough information to answer, respond strictly with: 
  "The provided document does not contain sufficient information to answer this question."

---
### Document Context:
${documentText}
---

### User Question:
${question}
`
};

module.exports = PROMPT_TEMPLATES;