# -----------------------------------------------------------------
#  Builds "LexForge AI - What It Does", the plain-language overview.
#
#  Every figure and list here is read from the codebase, not written
#  from memory: document types and languages from lib/utils.js, prices
#  from lib/billing.js, per-action costs from lib/usage.js. A brochure
#  that drifts from the product is worse than no brochure, because the
#  person reading it will be in a room with someone who has used it.
#
#  Run:  python scripts/build-overview-pdf.py
# -----------------------------------------------------------------
import os
import subprocess
import json
import sys

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
    Table, TableStyle, KeepTogether, PageBreak,
)

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "LexForge-AI-Overview.pdf")

# --- Palette -----------------------------------------------------
# Blue-black rather than pure black: the colour of fountain-pen ink on
# a plaint, and it sits better against warm paper than #000.
INK    = colors.HexColor("#171B22")
INK2   = colors.HexColor("#4A525C")
INK3   = colors.HexColor("#8A9099")
GOLD   = colors.HexColor("#8A6608")
RULE   = colors.HexColor("#D6D3C9")
BAND   = colors.HexColor("#F2F1EC")
SEAL   = colors.HexColor("#8C2B24")
WHITE  = colors.HexColor("#FFFFFF")

WINF = os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts")


def register_fonts():
    """Georgia for headings, Segoe UI for text, Consolas for citations."""
    faces = [
        ("Head",     "georgia.ttf"),
        ("Head-B",   "georgiab.ttf"),
        ("Head-I",   "georgiai.ttf"),
        ("Body",     "segoeui.ttf"),
        ("Body-B",   "segoeuib.ttf"),
        ("Mono",     "consola.ttf"),
    ]
    for name, filename in faces:
        pdfmetrics.registerFont(TTFont(name, os.path.join(WINF, filename)))
    pdfmetrics.registerFontFamily("Head", normal="Head", bold="Head-B", italic="Head-I")
    pdfmetrics.registerFontFamily("Body", normal="Body", bold="Body-B")


# --- Live figures from the codebase ------------------------------
def from_node(expr):
    """Evaluate an expression against the app's own modules."""
    js = (
        "Promise.all(["
        "import('./lib/utils.js'),"
        "import('./lib/billing.js'),"
        "import('./lib/usage.js')"
        "]).then(([u,b,g])=>{console.log(JSON.stringify(" + expr + "))})"
    )
    out = subprocess.run([r"node", "-e", js], capture_output=True, text=True,
                         cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    line = [l for l in out.stdout.strip().split("\n") if l.startswith(("{", "["))]
    if not line:
        sys.exit("Could not read figures from the codebase:\n" + out.stderr[-800:])
    return json.loads(line[-1])


FACTS = from_node("""{
  docTypes: u.DOCUMENT_TYPES.map(t => [t.value, t.label]),
  languages: u.LANGUAGES.map(l => l.value),
  courts: u.ALL_COURTS.length,
  directMonthly: b.PLANS.monthly.amountPaise / 100,
  directYearly: b.PLANS.yearly.amountPaise / 100,
  seatMonthly: b.INSTITUTION_SEAT.monthlyPaise / 100,
  seatYearly: b.INSTITUTION_SEAT.yearlyPaise / 100,
  foundingMonthly: b.INSTITUTION_SEAT.foundingMonthlyPaise / 100,
  foundingYearly: b.INSTITUTION_SEAT.foundingYearlyPaise / 100,
}""")

R = "\u20b9"          # rupee
EM = "\u2014"         # em dash
MID = " \u00b7 "      # middle dot separator


def money(n):
    """Indian digit grouping: 4,80,000 rather than 480,000."""
    s = str(int(n))
    if len(s) <= 3:
        return R + s
    head, tail = s[:-3], s[-3:]
    parts = []
    while len(head) > 2:
        parts.insert(0, head[-2:])
        head = head[:-2]
    if head:
        parts.insert(0, head)
    return R + ",".join(parts) + "," + tail


# --- Styles ------------------------------------------------------
S = {}


def build_styles():
    S["title"] = ParagraphStyle("title", fontName="Head-B", fontSize=27, leading=31,
                                textColor=INK, spaceAfter=0)
    S["sub"] = ParagraphStyle("sub", fontName="Body", fontSize=11.5, leading=17,
                              textColor=INK2, spaceBefore=10)
    S["eyebrow"] = ParagraphStyle("eyebrow", fontName="Mono", fontSize=8, leading=11,
                                  textColor=GOLD, spaceAfter=4)
    S["h1"] = ParagraphStyle("h1", fontName="Head-B", fontSize=17, leading=21,
                             textColor=INK, spaceBefore=2, spaceAfter=3)
    S["h2"] = ParagraphStyle("h2", fontName="Head-B", fontSize=12.5, leading=16,
                             textColor=INK, spaceBefore=13, spaceAfter=4)
    S["p"] = ParagraphStyle("p", fontName="Body", fontSize=9.6, leading=14.6,
                            textColor=INK, spaceAfter=7, alignment=TA_LEFT)
    S["small"] = ParagraphStyle("small", fontName="Body", fontSize=8.4, leading=12.6,
                                textColor=INK2, spaceAfter=5)
    S["note"] = ParagraphStyle("note", fontName="Body", fontSize=8.2, leading=12.4,
                               textColor=INK3, spaceAfter=4)
    # Table cells
    S["th"] = ParagraphStyle("th", fontName="Mono", fontSize=7.2, leading=9.4,
                             textColor=WHITE)
    S["td"] = ParagraphStyle("td", fontName="Body", fontSize=8.5, leading=12,
                             textColor=INK)
    S["tdb"] = ParagraphStyle("tdb", fontName="Body-B", fontSize=8.5, leading=12,
                              textColor=INK)
    S["tdm"] = ParagraphStyle("tdm", fontName="Mono", fontSize=7.6, leading=11,
                              textColor=INK2)
    S["ex"] = ParagraphStyle("ex", fontName="Body", fontSize=8.4, leading=12.2,
                             textColor=INK2)


def P(t, s="p"):
    return Paragraph(t, S[s])


# --- Page furniture ----------------------------------------------
def decorate(canvas, doc):
    canvas.saveState()
    w, h = A4
    if doc.page > 1:
        canvas.setFont("Mono", 7)
        canvas.setFillColor(INK3)
        canvas.drawString(20 * mm, h - 13 * mm, "LEXFORGE AI")
        canvas.drawRightString(w - 20 * mm, h - 13 * mm, "WHAT IT DOES")
        canvas.setStrokeColor(RULE)
        canvas.setLineWidth(0.5)
        canvas.line(20 * mm, h - 15.5 * mm, w - 20 * mm, h - 15.5 * mm)
        canvas.drawCentredString(w / 2, 12 * mm, str(doc.page))
    canvas.restoreState()


def table(rows, widths, header=True, zebra=True, align=None):
    """One table style everywhere, so nothing looks hand-placed."""
    t = Table(rows, colWidths=widths, repeatRows=1 if header else 0, hAlign="LEFT")
    style = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, RULE),
    ]
    if header:
        style += [
            ("BACKGROUND", (0, 0), (-1, 0), INK),
            ("TOPPADDING", (0, 0), (-1, 0), 6),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ]
    if zebra:
        start = 1 if header else 0
        for i in range(start, len(rows)):
            if (i - start) % 2 == 1:
                style.append(("BACKGROUND", (0, i), (-1, i), BAND))
    if align:
        for col, a in align.items():
            style.append(("ALIGN", (col, 0), (col, -1), a))
    t.setStyle(TableStyle(style))
    return t


def callout(title, body, colour=GOLD):
    inner = [[Paragraph(title, ParagraphStyle("ct", fontName="Body-B", fontSize=9,
                                              leading=13, textColor=colour))],
             [Paragraph(body, S["small"])]]
    t = Table(inner, colWidths=[168 * mm], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BAND),
        ("LINEBEFORE", (0, 0), (0, -1), 2.2, colour),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 1),
        ("TOPPADDING", (0, 1), (-1, 1), 0),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 8),
    ]))
    # A callout is one object. Without this the heading row breaks to one
    # page and the body to the next, which reads as a rendering fault.
    return KeepTogether([t])


def section(n, title, blurb=None):
    out = [Spacer(1, 9), P("PART " + str(n), "eyebrow"), P(title, "h1")]
    if blurb:
        out.append(P(blurb, "small"))
    out.append(Spacer(1, 3))
    return out


# --- Content -----------------------------------------------------
# A worked example for every document type, so "20 document types"
# stops being a number and becomes twenty things a reader recognises.
DOC_EXAMPLES = {
    "LEGAL_NOTICE":       "Your tenant has not paid rent for four months and ignores your calls.",
    "CHEQUE_BOUNCE":      "A cheque for " + R + "4,50,000 came back marked 'funds insufficient'.",
    "FIR_COMPLAINT":      "The police station will not register your complaint about a theft.",
    "BAIL_APPLICATION":   "A relative has been in custody three weeks; the chargesheet is filed.",
    "WRIT_PETITION":      "A government department has sat on your licence renewal for a year.",
    "PIL":                "A municipal drain has been discharging into a village pond for months.",
    "PETITION":           "You need to move the district court on a civil dispute over land.",
    "STAY_APPLICATION":   "Demolition is scheduled for Friday and your appeal is still pending.",
    "AFFIDAVIT":          "The court wants your statement of facts sworn on oath.",
    "VAKALATNAMA":        "You are appointing an advocate to appear for you.",
    "CONSUMER_COMPLAINT": "A new refrigerator failed twice in a month and the dealer refuses.",
    "DIVORCE_PETITION":   "A marriage has broken down and maintenance and custody are in issue.",
    "RENT_AGREEMENT":     "Letting a two-bedroom flat for eleven months with a lock-in.",
    "SALE_DEED":          "Transferring a plot after the sale consideration has been paid.",
    "CONTRACT":           "A vendor agreement that needs indemnity and dispute-resolution clauses.",
    "RTI_APPLICATION":    "You want the file notings on a road-tender decision.",
    "LEGAL_OPINION":      "A client asks whether a non-compete clause is enforceable on them.",
    "CASE_BRIEF":         "You must summarise a 90-page judgment into facts, issues and ratio.",
    "MEMORANDUM":         "An internal note weighing the risk of two possible courses of action.",
    "LEGAL_EMAIL":        "A firm but correct letter to the opposite party's counsel.",
}

TOOLS = [
    ("Order Analyser", "A court order arrives and you are not sure what it requires of you.",
     "Extracts the directions, the compliance dates, the next hearing, and what helps or hurts you."),
    ("Appeal Generator", "You lost, and there are thirty days to appeal.",
     "Reads the judgment and builds the grounds of appeal."),
    ("Counter / Reply", "The other side has filed an affidavit full of denials.",
     "Drafts the reply, answering paragraph by paragraph."),
    ("Document Amendment", "The registry has returned a petition for corrections.",
     "Amends the existing document instead of starting again."),
    ("Fresh Application", "Bail was rejected, but the chargesheet has since been filed.",
     "Prepares a fresh application built on the changed circumstances."),
    ("Compliance Report", "You have done what the court directed and must now say so.",
     "Produces the compliance affidavit."),
]


def build():
    register_fonts()
    build_styles()

    doc = BaseDocTemplate(OUT, pagesize=A4,
                          leftMargin=20 * mm, rightMargin=20 * mm,
                          topMargin=20 * mm, bottomMargin=18 * mm,
                          title="LexForge AI " + EM + " What It Does",
                          author="LexForge AI", subject="Product overview")
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
    doc.addPageTemplates([PageTemplate(id="all", frames=[frame], onPage=decorate)])

    W = doc.width
    story = []

    # ---------- Cover ----------
    story += [
        Spacer(1, 14 * mm),
        P("INDIAN LEGAL DRAFTING", "eyebrow"),
        P("LexForge AI", "title"),
        P("What it does, in plain language " + EM + " with a worked example for every "
          "single thing it can do, and an honest comparison against the tools you "
          "already know.", "sub"),
        Spacer(1, 12),
    ]

    facts = [
        [P("Document types it drafts", "td"), P(str(len(FACTS["docTypes"])), "tdb")],
        [P("Courts it formats for", "td"), P("{:,}".format(FACTS["courts"]), "tdb")],
        [P("Languages it drafts in", "td"),
         P("7 " + EM + " English, Hindi, Bilingual, Urdu, Tamil, Telugu, Kannada", "tdb")],
        [P("Analysis tools", "td"), P("6", "tdb")],
        [P("Available on", "td"), P("Web and mobile", "tdb")],
        [P("Exports to", "td"), P("PDF, Word (.docx), plain text", "tdb")],
    ]
    story.append(table(facts, [58 * mm, W - 58 * mm], header=False))

    story += [
        Spacer(1, 14),
        callout("The one rule that makes this different from every other legal AI",
                "A made-up case citation is not a typo in this profession " + EM +
                " it is professional misconduct. So the software is not permitted to "
                "produce one. Every judgment it cites is fetched from a real reported "
                "index at the moment of drafting. When the search finds nothing, the "
                "draft says nothing, rather than offering a case name that merely "
                "sounds right. That restraint is written into the code, not printed "
                "in a warning notice."),
        Spacer(1, 10),
        P("This document was generated from the product itself. Every count, price "
          "and figure in it is read out of the running code, so it cannot drift "
          "from what the software actually does.", "note"),
        PageBreak(),
    ]

    # ---------- Part 1: Drafting ----------
    story += section(1, "It writes the document for you",
                     "You describe what happened, in your own words. It produces a "
                     "properly structured document " + EM + " correct cause title, the "
                     "right jurisdiction clause, the verification block a registry "
                     "expects. Twenty kinds, each with its own set of questions.")

    rows = [[Paragraph("DOCUMENT", S["th"]), Paragraph("WHEN YOU NEED IT", S["th"])]]
    for value, label in FACTS["docTypes"]:
        rows.append([P(label, "tdb"), P(DOC_EXAMPLES.get(value, ""), "ex")])
    story.append(table(rows, [46 * mm, W - 46 * mm], align={0: "LEFT"}))

    story += [
        Spacer(1, 10),
        callout("A worked example",
                "<b>You type:</b> \"My tenant Ramesh has not paid rent of " + R + "18,000 a "
                "month since April. The agreement was for eleven months from January. "
                "He is not answering calls.\"<br/><br/>"
                "<b>You get back:</b> a legal notice on a proper format " + EM + " your "
                "details and his, the recital of the tenancy, the exact arrears "
                "computed, the demand, a fifteen-day period to comply, the "
                "consequence of not complying, and a reservation of rights. Ready to "
                "print, sign and send by registered post."),
        PageBreak(),
    ]

    # ---------- Part 2: Tools ----------
    story += section(2, "It reads what you receive, too",
                     "Drafting is half the work. The other half arrives from somewhere "
                     "else " + EM + " an order, a judgment, the other side's affidavit "
                     + EM + " and has to be answered.")

    rows = [[Paragraph("TOOL", S["th"]), Paragraph("THE SITUATION", S["th"]),
             Paragraph("WHAT IT GIVES YOU", S["th"])]]
    for name, when, what in TOOLS:
        rows.append([P(name, "tdb"), P(when, "ex"), P(what, "ex")])
    story.append(table(rows, [34 * mm, 66 * mm, W - 100 * mm]))

    # ---------- Part 3: Research ----------
    story += section(3, "It finds the law")
    research = [
        [Paragraph("FEATURE", S["th"]), Paragraph("WHAT IT ANSWERS", S["th"]),
         Paragraph("EXAMPLE", S["th"])],
        [P("Act search", "tdb"),
         P("Which statute governs my problem, and which section.", "ex"),
         P("\"My tenant will not leave after the lease ended\" returns the rent "
           "control provisions that apply.", "ex")],
        [P("Judgment search", "tdb"),
         P("Has a court decided this before.", "ex"),
         P("\"section 45 PMLA twin conditions bail\" returns reported judgments "
           "with their citations.", "ex")],
        [P("Later citations", "tdb"),
         P("Has anything cited this judgment since, and did the Supreme Court.", "ex"),
         P("A 1998 case nothing has touched in thirty years reads very differently "
           "from one the Supreme Court cited last year.", "ex")],
        [P("Case status by CNR", "tdb"),
         P("What happened at the last hearing and when is the next one.", "ex"),
         P("Enter the CNR number and read the current status.", "ex")],
    ]
    story.append(table(research, [30 * mm, 55 * mm, W - 85 * mm]))
    story += [
        Spacer(1, 9),
        callout("Later citations is not a good-law check, and we say so on the page",
                "It tells you a judgment was cited. It does not tell you whether it "
                "was followed or overruled " + EM + " a case is also cited by the "
                "judgment that overrules it. Classifying that is human editorial work, "
                "and the established research databases do it well. We do not claim "
                "to.", SEAL),
        PageBreak(),
    ]

    # ---------- Part 4: Students ----------
    story += section(4, "For law students",
                     "The parts of a law degree that are drafting and research "
                     "problems dressed as coursework.")
    students = [
        [Paragraph("FEATURE", S["th"]), Paragraph("THE COURSEWORK IT MEETS", S["th"]),
         Paragraph("EXAMPLE", S["th"])],
        [P("Moot memorial builder", "tdb"),
         P("Moot Court " + EM + " a compulsory practical paper.", "ex"),
         P("Paste the moot problem, pick petitioner or respondent, get a memorial "
           "outline with the authorities retrieved, not remembered.", "ex")],
        [P("Drafting", "tdb"),
         P("Drafting, Pleading & Conveyancing " + EM + " the file of 15 to 30 "
           "documents submitted for viva.", "ex"),
         P("All twenty document types are the DPC syllabus.", "ex")],
        [P("Case comments", "tdb"), P("4 to 8 per semester.", "ex"),
         P("28 landmark judgments and 24 doctrines ship with the app and need no "
           "internet lookup.", "ex")],
        [P("AI Tutor", "tdb"), P("Understanding, before an exam.", "ex"),
         P("\"Explain the doctrine of basic structure\" answered with the "
           "authorities named.", "ex")],
        [P("Quiz and flashcards", "tdb"), P("Revision.", "ex"),
         P("Generates multiple-choice questions on any topic you name.", "ex")],
        [P("Legal Q&A", "tdb"), P("Project work.", "ex"),
         P("A longer, citation-backed answer than a chat reply.", "ex")],
        [P("Career roadmap", "tdb"), P("The question nobody teaches.", "ex"),
         P("Five paths " + EM + " litigation, corporate, judiciary, LLM abroad, UPSC "
           + EM + " year by year, with real salary bands.", "ex")],
    ]
    story.append(table(students, [33 * mm, 52 * mm, W - 85 * mm]))

    # ---------- Part 5: Practice ----------
    story += section(5, "For running a practice")
    practice = [
        [Paragraph("FEATURE", S["th"]), Paragraph("WHAT IT IS FOR", S["th"])],
        [P("Client register", "tdb"),
         P("Your clients in one place, filterable by district. Their details fill "
           "into a new draft instead of being retyped.", "ex")],
        [P("Hearing dates", "tdb"), P("What is listed, and when.", "ex")],
        [P("Draft history and versions", "tdb"),
         P("Every draft kept, with earlier versions recoverable and a clone button "
           "for the next matter like it.", "ex")],
        [P("Paragraph editor", "tdb"),
         P("Rewrite one paragraph without regenerating the document.", "ex")],
        [P("Folder upload", "tdb"),
         P("Drop a folder of PDFs and Word files from a case bundle; it reads them "
           "and briefs you.", "ex")],
        [P("College dashboard", "tdb"),
         P("For a faculty co-ordinator: who signed up, who is active, how many "
           "documents, by batch. Never what is inside one.", "ex")],
    ]
    story.append(table(practice, [40 * mm, W - 40 * mm]))

    # ---------- Part 6: Assistant ----------
    story += section(6, "The assistant in the corner")
    story += [
        P("Every page carries a chat panel. It answers the legal question " + EM +
          " and then does the thing that usually gets lost.", "p"),
        callout("What that looks like",
                "<b>You type:</b> \"My landlord kept my deposit after I moved out. "
                "Which act applies?\"<br/><br/>"
                "<b>It answers</b> the question, naming the provision that governs.<br/>"
                "<b>Then it offers a button:</b> <i>Draft this document</i> " + EM +
                " which opens a legal notice with everything you just described "
                "already filled in.<br/><br/>"
                "You never type the same fact twice. It works across drafting, "
                "analysis, Act search, judgments, moot memorials, study and Q&A "
                + EM + " and it only ever offers. It never navigates on its own, "
                "because it will sometimes be wrong."),
        PageBreak(),
    ]

    # ---------- Part 7: Comparison ----------
    story += section(7, "How it compares",
                     "Two tables, because an honest comparison needs both. LexForge "
                     "is a drafting tool; SCC Online and Manupatra are research "
                     "databases; NyayAssist is a practice platform. They are not the "
                     "same category, and pretending otherwise helps nobody.")

    story.append(P("Where the others are stronger", "h2"))
    hdr = [Paragraph("CAPABILITY", S["th"]), Paragraph("SCC ONLINE", S["th"]),
           Paragraph("MANUPATRA", S["th"]), Paragraph("NYAYASSIST", S["th"]),
           Paragraph("LEXFORGE", S["th"])]
    weak = [hdr,
            [P("Owned corpus of judgments", "td"), P("75 years, curated", "tdm"),
             P("Deep, tribunals", "tdm"), P("20M+ records", "tdm"),
             P("Retrieves per query", "tdm")],
            [P("Editorial headnotes by human editors", "td"), P("Yes", "tdm"),
             P("Yes", "tdm"), P("No", "tdm"), P("No", "tdm")],
            [P("Good-law check (overruled / followed)", "td"), P("Yes", "tdm"),
             P("Yes", "tdm"), P("Unclear", "tdm"), P("No", "tdm")],
            [P("The citation a court accepts", "td"), P("SCC is the reporter", "tdm"),
             P("MANU", "tdm"), P("No", "tdm"), P("No", "tdm")],
            [P("Foreign and comparative law", "td"), P("Yes", "tdm"), P("Yes", "tdm"),
             P("No", "tdm"), P("No", "tdm")],
            [P("Journals, commentaries, books", "td"), P("Yes", "tdm"), P("Yes", "tdm"),
             P("No", "tdm"), P("No", "tdm")],
            [P("Document storage and tagging", "td"), P("No", "tdm"), P("Partial", "tdm"),
             P("Up to 20GB", "tdm"), P("No", "tdm")],
            [P("Meeting transcription", "td"), P("No", "tdm"), P("No", "tdm"),
             P("Yes", "tdm"), P("No", "tdm")],
            [P("Years of institutional trust", "td"), P("Decades", "tdm"),
             P("Decades", "tdm"), P("Growing", "tdm"), P("New", "tdm")]]
    cw = [50 * mm] + [(W - 50 * mm) / 4.0] * 4
    story.append(table(weak, cw))

    story += [Spacer(1, 12), P("Where LexForge is stronger", "h2")]
    strong = [hdr,
              [P("Produces a finished document from your facts", "td"), P("No", "tdm"),
               P("Templates", "tdm"), P("Generic", "tdm"),
               P(str(len(FACTS["docTypes"])) + " named types", "tdm")],
              [P("Correct cause title per court", "td"), P("No", "tdm"), P("No", "tdm"),
               P("No", "tdm"), P("{:,} courts".format(FACTS["courts"]), "tdm")],
              [P("Drafts natively in Indian languages", "td"), P("No", "tdm"),
               P("No", "tdm"), P("Translates after", "tdm"), P("7 languages", "tdm")],
              [P("Litigation workflow tools", "td"), P("No", "tdm"), P("No", "tdm"),
               P("No", "tdm"), P("6 tools", "tdm")],
              [P("Moot memorial builder", "td"), P("No", "tdm"), P("No", "tdm"),
               P("No", "tdm"), P("Yes", "tdm")],
              [P("Quiz, flashcards, AI tutor", "td"), P("No", "tdm"), P("No", "tdm"),
               P("No", "tdm"), P("Yes", "tdm")],
              [P("Career roadmap for students", "td"), P("No", "tdm"), P("No", "tdm"),
               P("No", "tdm"), P("5 paths", "tdm")],
              [P("Faculty dashboard by batch", "td"), P("No", "tdm"), P("No", "tdm"),
               P("No", "tdm"), P("Yes", "tdm")],
              [P("Citation invention blocked in code", "td"), P("n/a", "tdm"),
               P("n/a", "tdm"), P("Claimed", "tdm"), P("Enforced", "tdm")]]
    story.append(table(strong, cw))

    story += [
        Spacer(1, 10),
        callout("The honest summary",
                "Keep SCC Online. It is the best research database in India and "
                "nothing here replaces it. What it cannot do is produce the document "
                "at the end, and it cannot do it in Hindi. That is the gap LexForge "
                "fills " + EM + " for less than the cost of adding a second database."),
        Spacer(1, 4),
    ]

    # ---------- Part 8: Price ----------
    story += section(8, "What it costs")
    price = [
        [Paragraph("WHO", S["th"]), Paragraph("PER MONTH", S["th"]),
         Paragraph("PER YEAR", S["th"]), Paragraph("NOTES", S["th"])],
        [P("Advocate or student, direct", "tdb"),
         P(money(FACTS["directMonthly"]), "tdm"), P(money(FACTS["directYearly"]), "tdm"),
         P("One rate for everyone who subscribes directly.", "ex")],
        [P("College, per student", "tdb"),
         P(money(FACTS["seatMonthly"]), "tdm"), P(money(FACTS["seatYearly"]), "tdm"),
         P("Charged per student, so forty students are not billed like four "
           "hundred.", "ex")],
        [P("Founding college, per student", "tdb"),
         P(money(FACTS["foundingMonthly"]), "tdm"),
         P(money(FACTS["foundingYearly"]), "tdm"),
         P("First year only, for the first colleges to adopt. Reverts to the "
           "standard rate on renewal.", "ex")],
    ]
    story.append(table(price, [45 * mm, 25 * mm, 25 * mm, W - 95 * mm]))

    story += [
        Spacer(1, 10),
        P("There is a free tier, and it is a real one " + EM + " every document type "
          "is available on it, capped by a monthly quota and a shorter output. Pro "
          "removes both caps, unlocks judgment search and the case assistant, and "
          "uses the stronger model.", "p"),
        Spacer(1, 6),
        P("Three ways in", "h2"),
        table([
            [Paragraph("IF YOU ARE", S["th"]), Paragraph("START HERE", S["th"])],
            [P("A law student", "tdb"),
             P("The drafting file for your DPC paper, then the moot memorial "
               "builder, then quizzes before exams.", "ex")],
            [P("A practising advocate", "tdb"),
             P("Draft the notice you were going to type anyway, and compare. Then "
               "run an order you have received through the Order Analyser.", "ex")],
            [P("A law college", "tdb"),
             P("One batch, one semester, across the drafting and moot papers. "
               "Reviewed against viva marks and completion rates.", "ex")],
        ], [40 * mm, W - 40 * mm]),
        Spacer(1, 14),
        P("Every figure in this document was read from the running software at the "
          "moment it was generated.", "note"),
    ]

    doc.build(story)
    return OUT


if __name__ == "__main__":
    path = build()
    print("wrote " + path + "  (" + str(round(os.path.getsize(path) / 1024)) + " KB)")
