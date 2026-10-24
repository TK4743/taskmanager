# 🎓 Anna University / V.S.B. Engineering College Project Report Template (70-Page Modular Architecture)

A turnkey, production-grade LaTeX template for B.Tech/B.E. Final Year Project Reports conforming to Anna University regulations and institutional formatting guidelines.

---

## 📁 Project Directory Structure

```text
report_template/
├── main.tex                    # Master entry point (orchestrates packages & chapter inputs)
├── main.pdf                    # Compiled reference PDF (70 pages, 100% verified)
├── project_config.tex          # ⚡ Central configuration: Edit title, names, guide & college here
├── references.bib              # BibTeX database for academic papers & citations
├── README.md                   # This documentation guide
├── chapters/                   # Modular chapter files (one file per chapter/section)
│   ├── 00_title.tex            # Title page with institutional emblems & candidate details
│   ├── 00_certificate.tex      # Bonafide Certificate with supervisor & HOD signature blocks
│   ├── 00_acknowledgement.tex  # Acknowledgement acknowledging faculty, guide & management
│   ├── 00_vision_mission.tex   # College & Department Vision, Mission, PEOs, POs, PSOs (Tables 1-6)
│   ├── 00_abstract.tex         # Executive Abstract & keywords
│   ├── 00_toc_lot_lof.tex      # Table of Contents, List of Figures, Tables, Abbreviations
│   ├── 01_introduction.tex     # Chapter 1: Introduction, Problem Statement, Objectives
│   ├── 02_literature_survey.tex# Chapter 2: Literature Survey with formal citations [1]–[19]
│   ├── 03_system_analysis.tex  # Chapter 3: Existing vs Proposed System & Comparison Table 3.1
│   ├── 04_system_specification.tex # Chapter 4: Hardware & Software Requirements Specification
│   ├── 05_implementation.tex   # Chapter 5: System Architecture (Fig 5.1), Algorithms & Modules
│   ├── 06_system_design.tex    # Chapter 6: UML Diagrams (Class, Use Case, Sequence, Activity, DFD)
│   ├── 07_system_testing.tex   # Chapter 7: Testing Methodologies & Test Cases Table 7.1
│   ├── 08_feasibility_study.tex# Chapter 8: Technical, Economic & Operational Feasibility
│   ├── 09_conclusion.tex       # Chapter 9: Conclusion & Future Enhancements
│   ├── appendix_a.tex          # Appendix A: Core Algorithms & Source Code Listings
│   ├── appendix_b.tex          # Appendix B: System User Interface Screenshots (Figs B.1–B.4)
│   ├── references.tex          # References half-title & numbered bibliography
│   ├── bibliography.tex        # Secondary literature & textbooks
│   └── certificate_acceptance.tex # Final viva-voce acceptance certificate scan
└── images/                     # Graphic assets
    ├── emblems/                # Institutional logos (Anna Univ seal, VSB crest, Vision banner)
    └── placeholders/           # System architecture, UML diagrams & application screenshots
```

---

## 🚀 Quick Start Guide (3 Simple Steps)

### Step 1: Configure Your Project Details
Open `project_config.tex` and update the parameters with your details:

```latex
% --- Project Title ---
\newcommand{\ProjectTitle}{%
YOUR PROJECT TITLE LINE 1\\[3pt]
YOUR PROJECT TITLE LINE 2\\[3pt]
YOUR PROJECT TITLE LINE 3%
}
\newcommand{\ProjectTitleSingleLine}{YOUR PROJECT TITLE IN A SINGLE LINE}

% --- Candidate Team ---
\newcommand{\StudentOneName}{STUDENT ONE NAME}
\newcommand{\StudentOneNameFormal}{FIRSTNAME INITIAL}
\newcommand{\StudentOneRegNo}{922522205001}

\newcommand{\StudentTwoName}{STUDENT TWO NAME}
\newcommand{\StudentTwoNameFormal}{FIRSTNAME INITIAL}
\newcommand{\StudentTwoRegNo}{922522205002}

% --- Supervisor & HOD ---
\newcommand{\SupervisorName}{Dr. YOUR SUPERVISOR NAME, Ph.D.}
\newcommand{\SupervisorDesignation}{Assistant Professor}
\newcommand{\SupervisorDepartment}{Department of Information Technology}

\newcommand{\HODName}{Dr. HOD NAME, Ph.D.}
\newcommand{\HODDesignation}{HEAD OF THE DEPARTMENT}
\newcommand{\HODDepartment}{Department of Information Technology}
```

Updating `project_config.tex` automatically propagates to:
- The Title Page (`chapters/00_title.tex`)
- The Bonafide Certificate (`chapters/00_certificate.tex`)
- The Acknowledgement (`chapters/00_acknowledgement.tex`)
- Running headers and citation metadata.

---

### Step 2: Replace Diagrams & Screenshots
Drop your project images into `images/` or `images/placeholders/` with the same names, or update the filenames in the respective chapter files:

| File Target | Diagram / Screen | Chapter |
| :--- | :--- | :--- |
| `images/image5.jpeg` | System Architecture | `chapters/05_implementation.tex` |
| `images/image6.png`  | Class Diagram | `chapters/06_system_design.tex` |
| `images/image7.png`  | Use Case Diagram | `chapters/06_system_design.tex` |
| `images/image8.png`  | Sequence Diagram | `chapters/06_system_design.tex` |
| `images/image9.png`  | Activity Diagram | `chapters/06_system_design.tex` |
| `images/image10.png` | Data Flow Diagram | `chapters/06_system_design.tex` |
| `images/image11.jpeg`| Screenshot 1 (Dashboard / Alert) | `chapters/appendix_b.tex` |
| `images/image12.jpeg`| Screenshot 2 (Primary View) | `chapters/appendix_b.tex` |
| `images/image13.jpeg`| Screenshot 3 (Mobile View 1) | `chapters/appendix_b.tex` |
| `images/image14.png` | Screenshot 4 (Mobile View 2) | `chapters/appendix_b.tex` |
| `images/image15.jpeg`| Viva-Voce Acceptance Certificate | `chapters/certificate_acceptance.tex` |

---

### Step 3: Compile the Report

#### Option A: Local Build with Tectonic (Recommended)
```bash
tectonic main.tex
```

#### Option B: Local Build with pdfLaTeX / XeLaTeX
```bash
pdflatex main.tex
bibtex main
pdflatex main.tex
pdflatex main.tex
```

#### Option C: Overleaf
1. Compress the `report_template` folder into a `.zip` archive.
2. In Overleaf, click **New Project** $\rightarrow$ **Upload Project** $\rightarrow$ select `report_template.zip`.
3. Set Compiler to **XeLaTeX** or **pdfLaTeX** and click **Recompile**.

---

## 📐 Formatting & Compliance Specifications

- **Paper Size**: A4 (`210mm` $\times$ `297mm`)
- **Margins**: Top: `18mm`, Bottom: `20mm`, Left: `25mm` (binding offset), Right: `20mm`
- **Typography**: 12pt Latin Modern / Times Roman
- **Line Spacing**: 1.5 line spacing (`\onehalfspacing`)
- **Pagination**:
  - Preliminary Pages (1–7): Unnumbered
  - Front Matter (8–13): Lowercase Roman numerals (`viii` to `xiii`)
  - Main Chapters (14–70): Arabic numerals (`1` to `57`), continuous bottom-center alignment
- **Chapter Headings**: Centered 18pt bold uppercase with two-line layout (`CHAPTER X \n TITLE`).
- **Half-Title Pages**: Dedicated standalone half-title dividers preceding every major chapter and appendix.
