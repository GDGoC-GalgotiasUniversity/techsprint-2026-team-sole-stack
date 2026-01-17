[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/Y9iW-vs6)

# 🚀 Gemini Novel

> *Unlock your creativity with the power of Google Gemini.*

---

## 👥 Team: Team Sole Stack

| Name | Role | Email |
| :--- | :--- | :--- |
| **Utkarsh Anand** | Team Leader | game.developer.utkarsh@gmail.com |

---

## 🎯 Problem Statement

### The Challenge: Academic & Creative Writing Friction
Students and researchers at **Galgotias University** often struggle with organizing vast amounts of research and overcoming "blank page syndrome." The pressure to produce high-quality academic papers and creative narratives can be overwhelming, leading to:
- Procrastination and missed deadlines.
- Difficulty in synthesizing complex information.
- A barrier to entry for expressing innovative ideas effectively.

### The Impact
This challenge stifles the potential of our campus community, leaving brilliant ideas unshared and academic submissions rushed.

---

## 💡 Solution

**Gemini Novel** addresses this by providing an intelligent, AI-powered workspace tailored for our academic community, leveraging **Google Technologies**:

*   **Google Gemini Integration:** Acts as an intelligent co-author to brainstorm ideas, outline papers, and refine arguments, directly tackling writer's block.
*   **Context-Aware Assistance:** Uses **Vercel AI SDK** to maintain deep context of the writing project, allowing for iterative development of complex research papers.
*   **Structured Output:** Generates content in Markdown and LaTeX, ensuring submissions meet academic formatting standards effortlessly.

---

## 🛠 Tech Stack

| Category | Technologies Used |
| :--- | :--- |
| **Frontend** | Next.js 15, React 19, Tailwind CSS v4, Vercel AI SDK (@ai-sdk/google) |
| **Backend** | Supabase (Database & Auth) |
| **Languages** | TypeScript |
| **Tools** | Highlight.js, KaTeX, React Markdown |

---

## 📊 MVP Features

- [x] **Real-time AI Chat:** Seamless interaction with Google Gemini Pro/Flash models.
- [x] **Rich Text & Math Support:** Rendering of Markdown and LaTeX equations for technical writing.
- [x] **Campus-Ready UI:** A clean, focused interface designed for productivity.
- [ ] **Session Management:** (In Progress) Save and retrieve writing sessions via Supabase.

---

## 🚀 How to Use It

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/GDGoC-GalgotiasUniversity/techsprint-2026-team-sole-stack.git
    cd techsprint-2026-team-sole-stack
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env.local` file:
    ```env
    GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
    NEXT_PUBLIC_SUPABASE_URL=your_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
    ```

4.  **Run Locally**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000).

---

### 🏆 Acknowledgements
This project was developed during **TechSprint Hackathon 2026**, organized by **GDG on Campus Galgotias University**.
