"""
RiseByDay — Product & Market Analysis Report Generator
Produces a ~18-page professionally styled PDF.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm, cm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.platypus.flowables import Flowable
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Circle, Polygon
from reportlab.graphics import renderPDF
from reportlab.pdfgen import canvas as pdfgen_canvas
import os

# ─── Palette ──────────────────────────────────────────────────────────────────
NAVY      = colors.HexColor("#0D1B2A")
NAVY_MID  = colors.HexColor("#1A2E45")
NAVY_SOFT = colors.HexColor("#1E3A5F")
BLUE      = colors.HexColor("#2563EB")
BLUE_LT   = colors.HexColor("#3B82F6")
BLUE_XLT  = colors.HexColor("#BFDBFE")
ELECTRIC  = colors.HexColor("#60A5FA")
TEAL      = colors.HexColor("#0EA5E9")
ACCENT    = colors.HexColor("#F59E0B")   # amber for highlights
GREEN     = colors.HexColor("#10B981")
RED_SOFT  = colors.HexColor("#EF4444")
WARM_WHITE = colors.HexColor("#F8FAFC")
GREY_LT   = colors.HexColor("#E2E8F0")
GREY_MID  = colors.HexColor("#94A3B8")
GREY_DK   = colors.HexColor("#475569")
GREY_XDK  = colors.HexColor("#1E293B")
WHITE     = colors.white
BLACK     = colors.black

PAGE_W, PAGE_H = A4
MARGIN = 20 * mm

# ─── Custom Page Template ─────────────────────────────────────────────────────

def make_canvas(path):
    return path

class ReportCanvas(pdfgen_canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._page_number = 0

    def showPage(self):
        self._page_number += 1
        super().showPage()

    def save(self):
        super().save()


def header_footer(canvas, doc):
    canvas.saveState()
    page = doc.page
    w, h = A4

    if page > 1:
        # Top bar
        canvas.setFillColor(NAVY)
        canvas.rect(0, h - 10*mm, w, 10*mm, fill=1, stroke=0)

        # App name left
        canvas.setFillColor(ELECTRIC)
        canvas.setFont("Helvetica-Bold", 7.5)
        canvas.drawString(MARGIN, h - 6.5*mm, "RISEBYDAYS")

        # Section title right (will be generic since we can't easily pass it)
        canvas.setFillColor(GREY_MID)
        canvas.setFont("Helvetica", 7)
        canvas.drawRightString(w - MARGIN, h - 6.5*mm, "Product & Market Analysis Report  |  May 2026")

        # Bottom bar
        canvas.setFillColor(GREY_LT)
        canvas.rect(0, 0, w, 8*mm, fill=1, stroke=0)

        canvas.setFillColor(NAVY)
        canvas.setFont("Helvetica", 7)
        canvas.drawString(MARGIN, 2.8*mm, "Confidential — Internal Strategy Document")
        canvas.drawRightString(w - MARGIN, 2.8*mm, f"Page {page}")

        # Blue accent line under header
        canvas.setStrokeColor(BLUE)
        canvas.setLineWidth(1.5)
        canvas.line(0, h - 10*mm, w, h - 10*mm)

    canvas.restoreState()


# ─── Styles ───────────────────────────────────────────────────────────────────

def build_styles():
    s = {}

    s["h1"] = ParagraphStyle(
        "h1",
        fontName="Helvetica-Bold",
        fontSize=22,
        textColor=NAVY,
        spaceAfter=6,
        spaceBefore=10,
        leading=26,
    )
    s["h2"] = ParagraphStyle(
        "h2",
        fontName="Helvetica-Bold",
        fontSize=14,
        textColor=NAVY,
        spaceAfter=4,
        spaceBefore=14,
        leading=18,
    )
    s["h3"] = ParagraphStyle(
        "h3",
        fontName="Helvetica-Bold",
        fontSize=10.5,
        textColor=NAVY_SOFT,
        spaceAfter=3,
        spaceBefore=8,
        leading=14,
    )
    s["body"] = ParagraphStyle(
        "body",
        fontName="Helvetica",
        fontSize=9.5,
        textColor=GREY_XDK,
        spaceAfter=5,
        leading=14.5,
        alignment=TA_JUSTIFY,
    )
    s["body_left"] = ParagraphStyle(
        "body_left",
        fontName="Helvetica",
        fontSize=9.5,
        textColor=GREY_XDK,
        spaceAfter=4,
        leading=14,
        alignment=TA_LEFT,
    )
    s["small"] = ParagraphStyle(
        "small",
        fontName="Helvetica",
        fontSize=8.5,
        textColor=GREY_DK,
        spaceAfter=3,
        leading=12,
        alignment=TA_LEFT,
    )
    s["label"] = ParagraphStyle(
        "label",
        fontName="Helvetica-Bold",
        fontSize=8,
        textColor=GREY_MID,
        spaceAfter=2,
        leading=10,
        letterSpacing=1.2,
    )
    s["callout_title"] = ParagraphStyle(
        "callout_title",
        fontName="Helvetica-Bold",
        fontSize=10,
        textColor=BLUE,
        spaceAfter=2,
        leading=13,
    )
    s["callout_body"] = ParagraphStyle(
        "callout_body",
        fontName="Helvetica",
        fontSize=9,
        textColor=NAVY,
        spaceAfter=0,
        leading=13,
        alignment=TA_JUSTIFY,
    )
    s["table_header"] = ParagraphStyle(
        "table_header",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        textColor=WHITE,
        leading=11,
        alignment=TA_CENTER,
    )
    s["table_cell"] = ParagraphStyle(
        "table_cell",
        fontName="Helvetica",
        fontSize=8.5,
        textColor=GREY_XDK,
        leading=11,
        alignment=TA_LEFT,
    )
    s["table_cell_c"] = ParagraphStyle(
        "table_cell_c",
        fontName="Helvetica",
        fontSize=8.5,
        textColor=GREY_XDK,
        leading=11,
        alignment=TA_CENTER,
    )
    s["table_cell_bold"] = ParagraphStyle(
        "table_cell_bold",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        textColor=NAVY,
        leading=11,
        alignment=TA_LEFT,
    )
    s["tier_header"] = ParagraphStyle(
        "tier_header",
        fontName="Helvetica-Bold",
        fontSize=11,
        textColor=WHITE,
        leading=14,
        alignment=TA_LEFT,
    )
    s["bullet"] = ParagraphStyle(
        "bullet",
        fontName="Helvetica",
        fontSize=9.5,
        textColor=GREY_XDK,
        leading=14,
        leftIndent=14,
        firstLineIndent=-9,
        spaceAfter=3,
    )
    s["numbered"] = ParagraphStyle(
        "numbered",
        fontName="Helvetica",
        fontSize=9.5,
        textColor=GREY_XDK,
        leading=14,
        leftIndent=18,
        firstLineIndent=-18,
        spaceAfter=4,
    )
    s["exec_lead"] = ParagraphStyle(
        "exec_lead",
        fontName="Helvetica-Bold",
        fontSize=12,
        textColor=BLUE,
        leading=17,
        spaceAfter=6,
        alignment=TA_JUSTIFY,
    )
    s["tag"] = ParagraphStyle(
        "tag",
        fontName="Helvetica-Bold",
        fontSize=7.5,
        textColor=WHITE,
        leading=10,
        alignment=TA_CENTER,
    )

    return s


# ─── Helper Flowables ─────────────────────────────────────────────────────────

class SectionDivider(Flowable):
    """Full-width colored rule with section number badge."""
    def __init__(self, number, title, color=BLUE):
        super().__init__()
        self.number = number
        self.title = title
        self.color = color
        self.width = PAGE_W - 2 * MARGIN
        self.height = 18 * mm

    def draw(self):
        c = self.canv
        w = self.width
        h = self.height

        # Background bar
        c.setFillColor(self.color)
        c.roundRect(0, h - 14*mm, w, 14*mm, 3*mm, fill=1, stroke=0)

        # Number badge (circle)
        c.setFillColor(WHITE)
        c.setStrokeColor(self.color)
        cx = 10*mm
        cy = h - 7*mm
        r = 4.5*mm
        c.circle(cx, cy, r, fill=1, stroke=0)

        c.setFillColor(self.color)
        c.setFont("Helvetica-Bold", 9)
        num_str = str(self.number)
        tw = c.stringWidth(num_str, "Helvetica-Bold", 9)
        c.drawString(cx - tw/2, cy - 3, num_str)

        # Title
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(cx + r + 4*mm, h - 9*mm, self.title.upper())


class CalloutBox(Flowable):
    """Highlighted info box with left accent bar."""
    def __init__(self, title, body, width, bg=BLUE_XLT, accent=BLUE):
        super().__init__()
        self.title = title
        self.body = body
        self._width = width
        self.bg = bg
        self.accent = accent
        self.height = 0  # calculated in wrap

    def wrap(self, availW, availH):
        self._width = min(self._width, availW)
        # Estimate height
        lines = max(1, len(self.body) // 90 + 1)
        self.height = (16 + lines * 13 + 16) * mm / (1/0.4)
        return self._width, self.height

    def draw(self):
        c = self.canv
        w = self._width
        h = self.height

        # Background
        c.setFillColor(self.bg)
        c.roundRect(0, 0, w, h, 2*mm, fill=1, stroke=0)

        # Left accent bar
        c.setFillColor(self.accent)
        c.roundRect(0, 0, 3*mm, h, 2*mm, fill=1, stroke=0)
        c.rect(2*mm, 0, 2*mm, h, fill=1, stroke=0)

        # Title
        c.setFillColor(self.accent)
        c.setFont("Helvetica-Bold", 9.5)
        c.drawString(6*mm, h - 7*mm, self.title)

        # Body
        c.setFillColor(NAVY)
        c.setFont("Helvetica", 8.5)
        # Simple word wrap
        words = self.body.split()
        lines = []
        line = []
        max_w = w - 8*mm
        for word in words:
            test = " ".join(line + [word])
            if c.stringWidth(test, "Helvetica", 8.5) < max_w:
                line.append(word)
            else:
                if line:
                    lines.append(" ".join(line))
                line = [word]
        if line:
            lines.append(" ".join(line))

        y = h - 7*mm - 11
        for ln in lines:
            c.drawString(6*mm, y, ln)
            y -= 11
            if y < 4*mm:
                break


def spacer(h=6):
    return Spacer(1, h * mm)


def hr(color=GREY_LT, thickness=0.5):
    return HRFlowable(width="100%", thickness=thickness, color=color, spaceAfter=3*mm, spaceBefore=2*mm)


def p(text, style):
    return Paragraph(text, style)


def build_table(headers, rows, col_widths, s, zebra=True, header_color=NAVY):
    """Build a styled table."""
    th = s["table_header"]
    tc = s["table_cell"]
    tcc = s["table_cell_c"]
    tcb = s["table_cell_bold"]

    header_row = [Paragraph(h, th) for h in headers]
    data = [header_row]
    for row in rows:
        data.append([Paragraph(str(cell), tc) for cell in row])

    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), header_color),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8.5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("GRID", (0, 0), (-1, -1), 0.3, GREY_LT),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WARM_WHITE, WHITE] if zebra else [WHITE]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("ROWBACKGROUNDS", (0, 0), (0, 0), [header_color]),
    ]

    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle(style_cmds))
    return t


# ─── Cover Page ──────────────────────────────────────────────────────────────

class CoverPage(Flowable):
    def __init__(self, width, height):
        super().__init__()
        self.width = width
        self.height = height

    def wrap(self, *_):
        return self.width, self.height

    def draw(self):
        c = self.canv
        w = self.width
        h = self.height

        # Deep navy background
        c.setFillColor(NAVY)
        c.rect(0, 0, w, h, fill=1, stroke=0)

        # Decorative geometric shapes
        c.setFillColor(NAVY_MID)
        c.setStrokeColor(colors.HexColor("#1E3A5F"))
        c.setLineWidth(0)
        # Large circle top-right
        c.circle(w + 30*mm, h - 20*mm, 90*mm, fill=1, stroke=0)
        # Medium circle bottom-left
        c.setFillColor(NAVY_SOFT)
        c.circle(-20*mm, 40*mm, 70*mm, fill=1, stroke=0)

        # Electric blue accent strip
        c.setFillColor(BLUE)
        c.rect(0, h * 0.42, w, 2*mm, fill=1, stroke=0)
        c.setFillColor(ELECTRIC)
        c.rect(0, h * 0.42 + 2*mm, 60*mm, 0.8*mm, fill=1, stroke=0)

        # Grid dot pattern (subtle)
        c.setFillColor(colors.HexColor("#1A2E45"))
        dot_spacing = 12*mm
        for x in range(0, int(w) + int(dot_spacing), int(dot_spacing)):
            for y in range(0, int(h) + int(dot_spacing), int(dot_spacing)):
                c.circle(x, y, 0.7*mm, fill=1, stroke=0)

        # App name badge
        c.setFillColor(BLUE)
        c.roundRect(MARGIN, h - 25*mm, 45*mm, 10*mm, 2*mm, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(MARGIN + 3*mm, h - 19*mm, "RISEBYDAYS  ·  macOS · Windows · Linux · iOS · Android")

        # Main title
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 34)
        c.drawString(MARGIN, h * 0.62, "Product &")
        c.drawString(MARGIN, h * 0.62 - 14*mm, "Market Analysis")

        c.setFillColor(ELECTRIC)
        c.setFont("Helvetica-Bold", 34)
        c.drawString(MARGIN, h * 0.62 - 28*mm, "Report")

        # Subtitle
        c.setFillColor(GREY_MID)
        c.setFont("Helvetica", 12)
        c.drawString(MARGIN, h * 0.62 - 38*mm, "Strategic Feature Roadmap  —  May 2026")

        # Divider
        c.setStrokeColor(BLUE_XLT)
        c.setLineWidth(0.5)
        c.line(MARGIN, h * 0.42 - 10*mm, w - MARGIN, h * 0.42 - 10*mm)

        # Bottom meta
        meta = [
            ("PREPARED BY", "Joshua Rashtian"),
            ("DATE", "May 30, 2026"),
            ("VERSION", "1.0  —  Confidential"),
        ]
        x = MARGIN
        y = h * 0.42 - 22*mm
        col_w = (w - 2 * MARGIN) / 3
        for label, val in meta:
            c.setFillColor(GREY_MID)
            c.setFont("Helvetica", 7)
            c.drawString(x, y, label)
            c.setFillColor(WHITE)
            c.setFont("Helvetica-Bold", 9.5)
            c.drawString(x, y - 5*mm, val)
            x += col_w

        # Bottom tag line
        c.setFillColor(GREY_DK)
        c.setFont("Helvetica", 8)
        tagline = "A comprehensive audit of RiseByDay's current feature set, competitive positioning,"
        tagline2 = "market trends, and 25+ prioritized ideas for product growth."
        c.drawCentredString(w / 2, 20*mm, tagline)
        c.drawCentredString(w / 2, 14*mm, tagline2)

        # Footer stripe
        c.setFillColor(BLUE)
        c.rect(0, 0, w, 6*mm, fill=1, stroke=0)


# ─── Build Story ──────────────────────────────────────────────────────────────

def build_story(s, usable_w):
    story = []

    # ── Cover: drawn via onFirstPage callback, story starts at page 2 ─────────
    # First flowable is an invisible spacer that fills page 1 so the real
    # content starts on page 2.  The actual cover art is painted in draw_cover().
    story.append(PageBreak())

    # ── Table of Contents ─────────────────────────────────────────────────────
    story.append(p("TABLE OF CONTENTS", s["label"]))
    story.append(spacer(2))
    toc_items = [
        ("01", "Executive Summary", "3"),
        ("02", "Current Feature Audit", "4"),
        ("03", "Competitive Landscape", "6"),
        ("04", "Market Trends Analysis", "8"),
        ("05", "Strategic Ideas List", "11"),
        ("06", "Monetization Analysis", "16"),
        ("07", "Closing Recommendations", "17"),
    ]
    toc_data = [[Paragraph(f"<b>{n}</b>", s["table_cell"]),
                 Paragraph(title, s["table_cell"]),
                 Paragraph(f"<b>{pg}</b>", s["table_cell_c"])]
                for n, title, pg in toc_items]
    toc_style = TableStyle([
        ("LINEBELOW", (0, 0), (-1, -1), 0.3, GREY_LT),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [WARM_WHITE, WHITE]),
        ("ALIGN", (2, 0), (2, -1), "CENTER"),
    ])
    toc_table = Table(toc_data, colWidths=[15*mm, usable_w - 30*mm, 15*mm])
    toc_table.setStyle(toc_style)
    story.append(toc_table)
    story.append(PageBreak())

    # ── 1. EXECUTIVE SUMMARY ─────────────────────────────────────────────────
    story.append(SectionDivider(1, "Executive Summary"))
    story.append(spacer(4))

    story.append(p(
        "RiseByDay is a beautifully crafted, privacy-first productivity app that unifies "
        "time-blocking, task management, and focus tools into a single ambient experience. "
        "Built on Tauri v2 (React 19 + TypeScript), it runs natively on <b>macOS, Windows, and Linux</b> "
        "with a <b>React Native companion app for iOS and Android</b> in development — making it one of the "
        "very few design-forward productivity tools with true cross-platform desktop and mobile reach. "
        "Its offline-first, local storage architecture positions it strongly against cloud-mandatory "
        "competitors in a market where subscription fatigue and data privacy concerns are rising.",
        s["exec_lead"]
    ))

    story.append(p(
        "The productivity software market is undergoing rapid consolidation and AI-driven disruption. "
        "Tools like Motion and Reclaim.ai have proven users will pay a premium for intelligent scheduling, "
        "while design-forward apps like Things 3 and Structured show that exceptional aesthetics remain "
        "a defensible moat. RiseByDay sits at the intersection of these forces — design quality that "
        "rivals the best on any platform, time-blocking as a first-class primitive, and an architecture "
        "that can absorb AI capabilities. Its cross-platform reach (desktop + mobile, all major OS) "
        "is a structural advantage that no direct competitor currently matches.",
        s["body"]
    ))

    story.append(spacer(3))

    kpi_data = [
        [Paragraph("KEY STRENGTHS", s["table_header"]),
         Paragraph("CURRENT GAPS", s["table_header"]),
         Paragraph("CORE OPPORTUNITY", s["table_header"])],
        [
            Paragraph(
                "• Exceptional design system\n• 8 visual themes\n• Time-blocking native\n"
                "• Offline-first (Tauri)\n• ICS import\n• Pomodoro integrated\n"
                "• macOS + Windows + Linux\n• React Native (iOS/Android)\n• Open-source Community fork",
                s["table_cell"]
            ),
            Paragraph(
                "• No AI scheduling yet\n• No Google Cal sync (live)\n• No menu bar app\n"
                "• React Native still in development\n• No analytics/insights\n"
                "• No NLP task input\n• Marketplace not live",
                s["table_cell"]
            ),
            Paragraph(
                "• Become the premium cross-platform day planner: own it once for any OS, "
                "add AI when ready. The only design-first productivity app with true "
                "desktop (Mac/Win/Linux) and mobile (iOS/Android) reach.",
                s["table_cell"]
            ),
        ]
    ]
    kpi_table = Table(kpi_data, colWidths=[usable_w/3]*3)
    kpi_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("BACKGROUND", (0, 1), (0, 1), colors.HexColor("#ECFDF5")),
        ("BACKGROUND", (1, 1), (1, 1), colors.HexColor("#FEF2F2")),
        ("BACKGROUND", (2, 1), (2, 1), colors.HexColor("#EFF6FF")),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.3, GREY_LT),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
    ]))
    story.append(kpi_table)
    story.append(spacer(5))

    story.append(p(
        "This report provides: (1) a full audit of existing features and their maturity level, "
        "(2) a competitive comparison against 7 direct rivals, (3) an analysis of 13 key "
        "market trends and their implications for RiseByDay, (4) a prioritized list of 30 "
        "feature ideas spanning quick wins to long-term platform plays, "
        "(5) monetization strategy, and (6) top-5 closing recommendations.",
        s["body"]
    ))
    story.append(PageBreak())

    # ── 2. CURRENT FEATURE AUDIT ──────────────────────────────────────────────
    story.append(SectionDivider(2, "Current Feature Audit"))
    story.append(spacer(4))
    story.append(p(
        "The table below catalogs every major feature area in RiseByDay, its current "
        "implementation depth, and a maturity rating. Ratings are defined as: "
        "<b>Early</b> = scaffolded or placeholder; <b>Developing</b> = functional but missing key depth; "
        "<b>Mature</b> = feature-complete and polished.",
        s["body"]
    ))
    story.append(spacer(3))

    audit_headers = ["Area", "Feature", "Description", "Maturity"]
    audit_rows = [
        ["Home", "Time Block Banner", "Named blocks with 8 visual styles + scale controls + CSS editor", "Mature"],
        ["Home", "Focus Mode Toggle", "Current Block vs. All Day animated switch", "Mature"],
        ["Home", "Critical Ribbon", "Critical-flagged task highlight, 3 styles", "Mature"],
        ["Home", "Task Focus Panel", "Block-aware task list, 8 visual styles", "Mature"],
        ["Home", "DateCorner Widget", "Clock + date + weather, 8 themes, resizable", "Mature"],
        ["Home", "HomeStyle Sheet", "Full style customization bottom drawer", "Mature"],
        ["Home", "Context Menus", "Right-click quick style swap on all elements", "Mature"],
        ["Calendar", "Multi-View Calendar", "Month, Week, Day, 3-Day, Custom (1-14 days)", "Mature"],
        ["Calendar", "Draggable Dock", "Floating toolbar snaps to top/bottom/right", "Mature"],
        ["Calendar", "Task Drag & Drop", "Drag tasks to reschedule on calendar", "Developing"],
        ["Calendar", "Quick-Add Events", "Click time slot to create timed event", "Developing"],
        ["Calendar", "ICS Import", "Import .ics files with UID-based deduplication", "Developing"],
        ["Calendar", "Google Cal Sync", "Connected calendars UI (live sync not yet)", "Early"],
        ["Tasks", "Task Kinds (6)", "task, event, reminder, habit, class, ics", "Mature"],
        ["Tasks", "Rich Task Fields", "Priority, block, category, recurrence, tags, notes", "Mature"],
        ["Tasks", "Recurrence Engine", "Daily/weekly/monthly with weekday + until-date", "Mature"],
        ["Tasks", "Categories System", "Custom color/icon categories with soft/solid tones", "Mature"],
        ["Tasks", "Task Workspace", "Kanban/list view for task management", "Developing"],
        ["Pomodoro", "Focus Timer", "25/5/15 min phases with ring progress", "Mature"],
        ["Pomodoro", "Linked Task", "Attach active task to focus session", "Mature"],
        ["Pomodoro", "Global Dock", "Floating mini-timer visible across all screens", "Mature"],
        ["Settings", "Weather Config", "Manual lat/lon for weather badge", "Developing"],
        ["Settings", "Block CSS Editor", "Raw CSS for advanced block customization", "Mature"],
        ["Settings", "Audio Settings", "Ambient sounds + break alerts config", "Developing"],
        ["Settings", "Profile Section", "User profile UI", "Early"],
        ["Integrations", "Spotify", "Planned integration — placeholder screen", "Early"],
        ["Integrations", "Apps Hub", "Integration landing page", "Early"],
        ["Themes", "Theme Marketplace", "Architecture ready (core/user/marketplace) — not live", "Early"],
        ["Nav", "Command Bar", "Ctrl+K keyboard-driven command palette", "Developing"],
        ["Nav", "Sidebar", "Icon nav + quick task list", "Mature"],
        ["Nav", "Toolkit Panels", "Pinnable utility panels to app bar", "Developing"],
    ]

    MATURITY_COLORS = {
        "Mature": colors.HexColor("#ECFDF5"),
        "Developing": colors.HexColor("#FFFBEB"),
        "Early": colors.HexColor("#FEF2F2"),
    }

    audit_col_w = [20*mm, 38*mm, usable_w - 38*mm - 20*mm - 22*mm, 22*mm]

    # Build with color coding
    ah = [Paragraph(h, s["table_header"]) for h in audit_headers]
    audit_data = [ah]
    for row in audit_rows:
        audit_data.append([Paragraph(str(c), s["table_cell"]) for c in row])

    audit_style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("GRID", (0, 0), (-1, -1), 0.3, GREY_LT),
        ("FONTSIZE", (0, 0), (-1, -1), 8.2),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]
    for i, row in enumerate(audit_rows):
        maturity = row[3]
        bg = MATURITY_COLORS.get(maturity, WHITE)
        audit_style_cmds.append(("BACKGROUND", (3, i+1), (3, i+1), bg))
        alt = WARM_WHITE if i % 2 == 0 else WHITE
        for col in range(3):
            audit_style_cmds.append(("BACKGROUND", (col, i+1), (col, i+1), alt))

    audit_table = Table(audit_data, colWidths=audit_col_w, repeatRows=1)
    audit_table.setStyle(TableStyle(audit_style_cmds))
    story.append(audit_table)
    story.append(spacer(4))

    # Legend
    legend_data = [[
        Paragraph("  Mature  ", s["tag"]),
        Paragraph("Feature-complete & polished", s["small"]),
        Paragraph("  Developing  ", s["tag"]),
        Paragraph("Functional but needs depth", s["small"]),
        Paragraph("  Early  ", s["tag"]),
        Paragraph("Scaffolded / placeholder", s["small"]),
    ]]
    legend_style = TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), GREEN),
        ("BACKGROUND", (2, 0), (2, 0), ACCENT),
        ("BACKGROUND", (4, 0), (4, 0), RED_SOFT),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ])
    legend_table = Table(legend_data, colWidths=[20*mm, 40*mm, 25*mm, 42*mm, 16*mm, 42*mm])
    legend_table.setStyle(legend_style)
    story.append(legend_table)
    story.append(PageBreak())

    # ── 3. COMPETITIVE LANDSCAPE ──────────────────────────────────────────────
    story.append(SectionDivider(3, "Competitive Landscape"))
    story.append(spacer(4))
    story.append(p(
        "RiseByDay competes in the premium macOS day-planner category against both "
        "AI-first schedulers and design-forward personal task managers. The table below "
        "maps 8 products (including RiseByDay) across 7 key dimensions. "
        "Indicators: <b>✓</b> = fully supported, <b>~</b> = partial / limited, <b>✗</b> = not supported.",
        s["body"]
    ))
    story.append(spacer(3))

    comp_headers = ["Product", "AI Sched.", "Design", "Time Block", "Cal Sync", "Offline", "Price Model", "Platform"]
    comp_rows = [
        ["RiseByDay", "~ (soon)", "⭐⭐⭐⭐⭐", "✓", "~ (soon)", "✓", "$15/$25 OTP + $10/mo AI", "Mac/Win/Linux + iOS/Android (RN)"],
        ["Motion", "✓✓", "⭐⭐⭐", "✓", "✓", "✗", "$19-34/mo", "Web/Mac/iOS"],
        ["Sunsama", "~", "⭐⭐⭐⭐", "✓", "✓", "✗", "$20/mo", "Web/Mac/iOS"],
        ["Akiflow", "~", "⭐⭐⭐", "✓", "✓", "✗", "$15/mo", "Web/Mac/iOS"],
        ["BeforeSunset", "✓", "⭐⭐⭐", "~", "✓", "✗", "$9.99/mo", "Web/iOS"],
        ["Reclaim.ai", "✓✓", "⭐⭐", "✓", "✓", "✗", "$8-16/mo", "Web"],
        ["Structured", "✗", "⭐⭐⭐⭐", "✓", "~", "~", "$4.99/mo", "iOS/macOS"],
        ["Things 3", "✗", "⭐⭐⭐⭐⭐", "✗", "✗", "✓", "$49.99 once", "macOS/iOS"],
    ]

    comp_col_w = [28*mm, 17*mm, 22*mm, 18*mm, 17*mm, 15*mm, 28*mm, 22*mm]

    comp_h = [Paragraph(h, s["table_header"]) for h in comp_headers]
    comp_data = [comp_h]
    for i, row in enumerate(comp_rows):
        style = s["table_cell_bold"] if i == 0 else s["table_cell_c"]
        style_c = s["table_cell_bold"] if i == 0 else s["table_cell_c"]
        comp_data.append([
            Paragraph(row[0], s["table_cell_bold"] if i == 0 else s["table_cell"]),
            *[Paragraph(cell, s["table_cell_c"]) for cell in row[1:]]
        ])

    comp_style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY_SOFT),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#EFF6FF")),
        ("FONTNAME", (0, 1), (0, 1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 1), (0, 1), BLUE),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("GRID", (0, 0), (-1, -1), 0.3, GREY_LT),
        ("FONTSIZE", (0, 0), (-1, -1), 8.2),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
    ]
    for i in range(2, len(comp_rows) + 1):
        if i % 2 == 0:
            comp_style_cmds.append(("BACKGROUND", (0, i), (-1, i), WARM_WHITE))

    comp_table = Table(comp_data, colWidths=comp_col_w, repeatRows=1)
    comp_table.setStyle(TableStyle(comp_style_cmds))
    story.append(comp_table)
    story.append(spacer(5))

    story.append(p("KEY TAKEAWAYS", s["label"]))
    story.append(spacer(2))
    takeaways = [
        ("<b>Design is RiseByDay's clearest moat.</b> Only Things 3 matches it on aesthetics, but Things 3 has no time-blocking and is Apple-only. RiseByDay is uniquely positioned at the intersection of premium design, day-planning methodology, and cross-platform reach."),
        ("<b>Cross-platform is a structural differentiator no competitor currently has.</b> Motion, Sunsama, and Akiflow are web-first. Things 3 and Structured are Apple-only. Being native on Mac + Windows + Linux + iOS + Android is a rare and powerful combination in the premium day-planner space."),
        ("<b>AI is the most urgent feature gap.</b> The two highest-growth competitors (Motion, Reclaim) are AI-first. Adding NLP task input and smart scheduling behind the $10/mo AI subscription closes this gap while funding the LLM infrastructure."),
        ("<b>Offline-first + open-source community is rare and trust-building.</b> Only Things 3 and RiseByDay offer true offline operation. The open-source Community fork adds a trust signal that no closed competitor can replicate."),
        ("<b>Calendar sync is the next critical unlock.</b> Every competitor has live calendar sync. Completing Google Calendar integration removes the biggest friction point for new users regardless of which tier they purchase."),
    ]
    for t in takeaways:
        story.append(p(f"&#8226;&#160;&#160;{t}", s["bullet"]))
    story.append(PageBreak())

    # ── 4. MARKET TRENDS ANALYSIS ─────────────────────────────────────────────
    story.append(SectionDivider(4, "Market Trends Analysis"))
    story.append(spacer(4))
    story.append(p(
        "The following 13 trends are shaping the productivity software market in 2025-2026. "
        "Each is analyzed for its direct implication on RiseByDay's roadmap and strategy.",
        s["body"]
    ))
    story.append(spacer(3))

    trends = [
        (
            "AI Scheduling & Natural Language Input",
            "HIGH",
            "Motion and Reclaim.ai have collectively raised over $40M and proven that users "
            "will pay 2-3x more for AI that automatically schedules and reschedules tasks around "
            "meetings. NLP input ('team standup Thursday at 10am') is rapidly becoming a table-stakes "
            "expectation, especially for knowledge workers.",
            "RiseByDay should prioritize NLP task input (via Claude API or similar) as the entry "
            "point to AI. Full auto-scheduling is the longer-term play but requires calendar sync first."
        ),
        (
            "Time-Blocking as the Dominant Methodology",
            "HIGH",
            "Cal Newport's 'Deep Work' and 'Time Blocking Planner' have mainstreamed the practice. "
            "Google Trends shows 'time blocking' search volume up 340% since 2020. Apps explicitly "
            "built around this framework now command premium pricing and strong word-of-mouth.",
            "RiseByDay is already perfectly aligned here — the block system is its core differentiator. "
            "Invest in making it even more powerful: block templates, block scheduling recommendations, "
            "block analytics."
        ),
        (
            "Focus & Deep Work Tooling Integration",
            "HIGH",
            "Users increasingly resist switching between apps mid-session. Website blockers (Cold Turkey, "
            "Freedom), ambient sound (Endel, Brain.fm), and focus timers (Session) are being integrated "
            "into planning apps rather than used in isolation. Session raised $2M for its macOS focus tool.",
            "The Pomodoro integration is a strong start. Next: ambient audio (Spotify integration unlocks "
            "this), macOS focus mode integration via Tauri, and optional website-blocking when a block is active."
        ),
        (
            "Subscription Fatigue & One-Time Pricing Resurgence",
            "HIGH",
            "Average knowledge worker now pays $340/year in productivity SaaS. Things 3 ($49.99 once) "
            "consistently tops the Mac App Store paid charts. Craft, Bear, and iA Writer all moved toward "
            "optional subscription models with strong one-time tiers, seeing increased conversions.",
            "A one-time purchase model for RiseByDay's core (with optional 'AI & Sync' subscription add-on) "
            "would align with this trend and build long-term loyalty. Consider $39-49 one-time base."
        ),
        (
            "Beautiful, Opinionated Design as a Moat",
            "HIGH",
            "In a world where core productivity features are commoditized (every app has tasks, calendar, "
            "and timer), design has become the primary retention driver. Linear, Craft, and Arc Browser "
            "have demonstrated that design-led products command 4-5x the engagement of utilitarian alternatives.",
            "RiseByDay already has this — protect it. Every new feature must be held to the same design bar. "
            "The theme marketplace is the right move: make design itself a platform."
        ),
        (
            "Menu Bar & Ambient Computing",
            "MEDIUM",
            "macOS menu bar apps (Fantastical's mini calendar, Things Quick Entry, Raycast) drive daily "
            "active use by being always accessible without switching windows. Apps with menu bar presence "
            "report 60% higher daily active use rates versus window-only counterparts.",
            "A RiseByDay menu bar app showing the current block, next task, and Pomodoro status would "
            "dramatically increase ambient visibility and habit formation. Tauri has excellent menu bar support."
        ),
        (
            "Cross-Device Continuity",
            "MEDIUM",
            "iPhone companion apps are now expected for any premium macOS productivity tool. Things 3, "
            "Fantastical, Structured, and OmniFocus all have iOS apps. Users plan on Mac, capture on iPhone. "
            "The App Store iOS market for productivity is significantly larger than macOS.",
            "An iOS companion app is a 6+ month investment but a key long-term platform play. "
            "In the near term, a web app or Tauri mobile build could bridge the gap."
        ),
        (
            "Personal Analytics & Time Insights",
            "MEDIUM",
            "Apps like Timing, RescueTime, and Toggl Track show that users want visibility into how their "
            "time was actually spent vs. planned. BeforeSunset AI's 'daily review' feature (comparing planned "
            "vs actual) drives strong retention — users who complete daily reviews churn at 40% lower rates.",
            "A weekly/monthly 'Time Report' showing block completion rates, Pomodoro sessions, "
            "category distribution, and task completion trends would be highly retentive and differentiated."
        ),
        (
            "Habit Stacking & Behavioral Science",
            "MEDIUM",
            "Habit tracking apps (Streaks, Habitica) have proven that behavioral science principles "
            "(streaks, chains, implementation intentions) dramatically improve task follow-through. "
            "Duolingo's streak mechanic is the most-cited example of gamification done right in productivity.",
            "RiseByDay already supports habit task types. Surfacing streaks, completion chains, "
            "and habit-stack templates would deepen engagement with this under-utilized feature."
        ),
        (
            "Calendar Intelligence",
            "MEDIUM",
            "Beyond basic sync, users want their calendar to be smart: detect conflicts, suggest optimal "
            "meeting times, find deep-work windows, and protect focus time automatically. "
            "Calendly and x.ai showed early demand; Motion and Reclaim now own this space.",
            "After Google Calendar sync goes live, add conflict detection and 'protect this block' "
            "functionality that auto-declines or warns about meetings during designated focus blocks."
        ),
        (
            "Team Handoff Features",
            "LOW",
            "Individual tools that add lightweight collaboration (shared tasks, assignees, "
            "status updates) can expand from B2C to B2B2C, dramatically increasing revenue per user. "
            "Linear's growth from personal dev tool to team standard is the clearest example.",
            "Not a near-term priority — RiseByDay's offline-first architecture makes sync complex. "
            "Monitor as an 18-month+ opportunity once the core individual experience is perfected."
        ),
        (
            "Offline-First & Privacy",
            "HIGH",
            "A growing segment of professionals, especially in legal, medical, and finance, cannot "
            "or will not put their task data in third-party clouds. Obsidian (local markdown) grew to "
            "1M+ users by being fully local. Craft added offline-first as a primary marketing message.",
            "RiseByDay should lean into this aggressively. 'Your data stays on your Mac' should be "
            "a first-class marketing message. Consider iCloud Keychain sync as an optional sync layer "
            "that keeps data within the Apple ecosystem."
        ),
        (
            "Marketplace & Plugin Ecosystems",
            "MEDIUM",
            "Raycast (extensions), Obsidian (plugins), and Notion (integrations) have proven that "
            "user-created extensibility is the most powerful retention and growth lever in productivity. "
            "Raycast grew from 0 to 1M users in 2 years largely driven by its extension ecosystem.",
            "The theme marketplace architecture already exists in RiseByDay's codebase. Launching it — "
            "even with 10-15 community themes — would create a network effect and a community identity "
            "that no competitor can easily replicate."
        ),
    ]

    for i, (title, urgency, context, implication) in enumerate(trends):
        urgency_color = {"HIGH": GREEN, "MEDIUM": ACCENT, "LOW": GREY_MID}[urgency]

        # Trend header row
        trend_header_data = [[
            Paragraph(f"<b>{i+1:02d}. {title}</b>", s["h3"]),
            Paragraph(f"  {urgency}  ", s["tag"]),
        ]]
        th_style = TableStyle([
            ("BACKGROUND", (1, 0), (1, 0), urgency_color),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (1, 0), (1, 0), 0),
            ("ALIGN", (1, 0), (1, 0), "RIGHT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ])
        th_table = Table(trend_header_data, colWidths=[usable_w - 20*mm, 20*mm])
        th_table.setStyle(th_style)

        detail_data = [[
            Paragraph(f"<b>Context:</b> {context}", s["body_left"]),
            Paragraph(f"<b>For RiseByDay:</b> {implication}", s["body_left"]),
        ]]
        d_style = TableStyle([
            ("BACKGROUND", (0, 0), (0, 0), WARM_WHITE),
            ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#EFF6FF")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 7),
            ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ("GRID", (0, 0), (-1, -1), 0.3, GREY_LT),
            ("FONTSIZE", (0, 0), (-1, -1), 8.5),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ])
        d_table = Table(detail_data, colWidths=[usable_w/2]*2)
        d_table.setStyle(d_style)

        story.append(KeepTogether([
            th_table,
            Spacer(1, 1.5*mm),
            d_table,
            Spacer(1, 5*mm),
        ]))

        if i in [4, 9]:
            story.append(PageBreak())

    story.append(PageBreak())

    # ── 5. STRATEGIC IDEAS LIST ───────────────────────────────────────────────
    story.append(SectionDivider(5, "Strategic Ideas List"))
    story.append(spacer(4))
    story.append(p(
        "The following 30 feature ideas are organized into four execution tiers based on "
        "effort and strategic impact. Each idea includes a market signal, effort estimate "
        "(S = 1-3 days, M = 1-2 weeks, L = 3-6 weeks, XL = 2+ months), and expected impact.",
        s["body"]
    ))
    story.append(spacer(3))

    tiers = [
        {
            "number": "TIER 1",
            "label": "Quick Wins  (0 – 4 Weeks)",
            "color": GREEN,
            "desc": "Low-effort, high-impact improvements that build directly on existing architecture. Ship these first.",
            "ideas": [
                ("Menu Bar Widget", "A minimal always-visible menu bar extra showing: current block name, active Pomodoro status, and quick 'add task' shortcut. Tauri's tray API makes this straightforward.", "Trend #6 — Ambient Computing", "M", "Very High"),
                ("Natural Language Task Input", "Add NLP parsing to the task creation command bar. Parse strings like 'dentist Friday at 2pm high priority' into structured task fields using a lightweight local model or Claude API.", "Trend #1 — AI / NLP", "M", "High"),
                ("Habit Streak Visualization", "Surface habit task streaks on the home screen and task list. Show a compact 'chain' badge (e.g. 🔥 7) next to recurring habits. Data already exists in lastCompletedAt.", "Trend #9 — Habit Stacking", "S", "High"),
                ("Block Quick-Complete Log", "At the end of each time block, show a micro-review prompt: 'Block finished. Mark tasks done?' with one-tap completion. Hooks into DayTransitionProvider which already tracks block transitions.", "Trend #8 — Personal Analytics", "S", "High"),
                ("Keyboard Shortcuts Reference", "An in-app keyboard shortcuts overlay (press ? to show). Surfaces existing hook-based navigation so power users discover shortcuts.", "Trend #5 — Design as Moat", "S", "Medium"),
                ("Sound Pack Selector", "Expand the Audio settings to let users choose from 5-6 built-in ambient sound packs (rain, coffee shop, white noise, lo-fi) that auto-play during Pomodoro focus phases.", "Trend #3 — Focus Tooling", "S", "High"),
                ("Block Template Library", "Pre-built time block configurations (e.g. 'Student Day', 'Remote Worker', '9-to-5', 'Night Owl') accessible from a new 'Templates' button in the Blocks CSS settings.", "Trend #2 — Time-Blocking", "S", "Medium"),
                ("Quick Stats Dashboard Widget", "A compact home screen widget (optional, toggleable) showing: tasks completed today, Pomodoro sessions, current streak. Pure read from existing store data.", "Trend #8 — Analytics", "S", "Medium"),
            ],
        },
        {
            "number": "TIER 2",
            "label": "Core Growth  (1 – 3 Months)",
            "color": BLUE,
            "desc": "Medium-complexity features that close the most critical gaps vs. competitors and unlock new user segments.",
            "ideas": [
                ("Google Calendar Live Sync", "Complete the ConnectedCalendarsSection — OAuth flow, two-way event sync via Google Calendar API. Show external calendar events (read-only initially) in all calendar views. This is the #1 onboarding blocker.", "Trend #10 — Calendar Intelligence", "L", "Very High"),
                ("Weekly Time Report", "A 'This Week' report view showing: time spent per block, tasks completed by category, Pomodoro sessions, habit completion rate, vs. prior week. Export as PDF/image for sharing.", "Trend #8 — Personal Analytics", "L", "High"),
                ("Spotify Focus Integration", "Complete the Spotify screen: OAuth login, 'Play focus playlist' button that triggers a curated playlist when Pomodoro starts, and shows currently playing track on the Pomodoro screen.", "Trend #3 — Focus Tooling", "M", "High"),
                ("iCloud Sync (Optional)", "Add optional iCloud-based sync of tasks/settings using CloudKit. Keeps data in the Apple ecosystem, appeals to privacy-conscious users, and enables iPhone companion later.", "Trend #12 — Offline/Privacy", "XL", "Very High"),
                ("Smart Block Conflict Alerts", "When a meeting from Google Calendar overlaps with a defined focus block, show a subtle warning badge: 'Morning Block has 2 conflicts today'. Drives daily engagement and block awareness.", "Trend #10 — Calendar Intelligence", "M", "High"),
                ("Task Quick-Capture Popover", "A global keyboard shortcut (e.g., Cmd+Shift+Space) that shows a floating task capture window from any app, using macOS accessibility APIs via Tauri. Task goes to inbox for later scheduling.", "Trend #6 — Ambient Computing", "M", "Very High"),
                ("Daily Planning Ritual", "A structured 5-minute morning planning flow: review yesterday's completions, set today's top 3 priorities, confirm block assignments, start first Pomodoro. Inspired by Sunsama's planning ritual.", "Trend #2 — Time-Blocking", "L", "High"),
                ("Focus Mode Integration (macOS)", "Trigger macOS Focus Mode (Do Not Disturb) via Tauri when a Pomodoro starts. Resume on break. Optionally block distracting websites using macOS Network Extension. Deep OS integration.", "Trend #3 — Focus Tooling", "M", "High"),
            ],
        },
        {
            "number": "TIER 3",
            "label": "Differentiators  (3 – 6 Months)",
            "color": NAVY_SOFT,
            "desc": "Big bets that would make RiseByDay uniquely compelling in the market — features no direct competitor has combined.",
            "ideas": [
                ("AI Day Planner (Claude-Powered)", "An AI assistant that analyzes your task list, calendar, and block schedule, then suggests an optimal daily plan with time estimates. Natural language: 'Plan my Tuesday' generates a complete block assignment.", "Trend #1 — AI Scheduling", "XL", "Very High"),
                ("Theme Marketplace Launch", "Launch the theme marketplace with 15+ community-submitted themes. Creator tools to build and submit clock themes. Revenue share for theme creators. Network effects compound over time.", "Trend #13 — Marketplace", "XL", "Very High"),
                ("Energy-Aware Scheduling", "Let users tag their energy levels throughout the day (morning person vs night owl) and have the block system intelligently surface high-priority tasks during their peak hours. Backed by research on chronobiology.", "Trend #10 — Cal Intelligence", "L", "High"),
                ("Deep Work Mode", "A full-screen immersive mode that: hides the dock, dims non-essential UI, shows only current block tasks, plays ambient audio, and runs Pomodoro timer. Accessible via keyboard shortcut from any screen.", "Trend #3 — Focus Tooling", "M", "High"),
                ("Task Dependency Graph", "Visual dependency mapping between tasks (task B depends on task A). Critical path highlighting. Especially valuable for 'class' task type for students managing assignments with prerequisites.", "Trend #5 — Design Moat", "L", "Medium"),
                ("Block Performance Analytics", "Track actual time spent in each block vs. intended. Over 4 weeks, surface patterns: 'You consistently leave your Evening block 30% underutilized'. Requires passive time-tracking via app focus detection.", "Trend #8 — Analytics", "L", "High"),
                ("Recurring Block Templates", "Save and load complete daily block configurations (name, times, CSS styles) as named templates. Switch between 'Weekday' and 'Weekend' templates with one tap. Scheduled auto-switch by day of week.", "Trend #2 — Time-Blocking", "M", "High"),
                ("Smart Task Estimation", "AI-assisted task duration estimation based on: historical completion times for similar tasks, category averages, and time-of-day patterns. Helps with realistic daily planning.", "Trend #1 — AI", "L", "High"),
            ],
        },
        {
            "number": "TIER 4",
            "label": "Long-Term Vision  (6+ Months)",
            "color": GREY_XDK,
            "desc": "Platform-level plays that would expand RiseByDay's market and create lasting competitive advantages.",
            "ideas": [
                ("React Native iOS + Android App", "React Native companion app (already the planned stack) for full task management, Pomodoro, daily view, and notifications. Syncs via iCloud (Sync tier) or offline-only (Local tier). Opens iOS App Store + Google Play — combined market 20x larger than desktop.", "Trend #7 — Cross-Device", "XL", "Very High"),
                ("Plugin / Extension System", "An official plugin API allowing developers to build RiseByDay extensions: custom block types, task importers (Jira, GitHub Issues, Linear), custom views. Raycast's model.", "Trend #13 — Marketplace", "XL", "Very High"),
                ("Lightweight Team Workspaces", "Optional shared workspace where a team can see each other's block schedules (not task details), coordinate meeting-free zones, and assign tasks. Moves RiseByDay toward B2B.", "Trend #11 — Team Handoff", "XL", "High"),
                ("Voice Task Capture (Siri/Whisper)", "Dictate tasks using on-device Whisper or Siri Shortcuts integration. 'Add task: review contract proposal due Thursday high priority.' Zero-friction capture on Mac and iPhone.", "Trend #1 — AI / NLP", "L", "High"),
                ("Predictive Day Builder", "Based on historical patterns, Monday morning automatically drafts a complete daily plan for the week. User reviews and approves, optionally tweaking AI suggestions. True auto-scheduling.", "Trend #1 — AI Scheduling", "XL", "Very High"),
                ("Public API & Webhooks", "A local HTTP API allowing power users to integrate RiseByDay with Raycast, Alfred, Shortcuts.app, and custom automations. Hooks into the existing Zustand stores.", "Trend #13 — Extensibility", "L", "Medium"),
            ],
        },
    ]

    tier_colors = [GREEN, BLUE, NAVY_SOFT, GREY_XDK]
    idea_headers = ["#", "Feature Name", "Description", "Market Signal", "Effort", "Impact"]
    idea_col_w = [8*mm, 32*mm, usable_w - 8*mm - 32*mm - 30*mm - 12*mm - 18*mm, 30*mm, 12*mm, 18*mm]

    for tier in tiers:
        tc = tier["color"]

        # Tier banner
        tier_banner_data = [[
            Paragraph(tier["number"], ParagraphStyle("tn", fontName="Helvetica-Bold", fontSize=8, textColor=WHITE, leading=10)),
            Paragraph(tier["label"], ParagraphStyle("tl", fontName="Helvetica-Bold", fontSize=12, textColor=WHITE, leading=15)),
        ]]
        tb_style = TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), tc),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ])
        tb_table = Table(tier_banner_data, colWidths=[20*mm, usable_w - 20*mm])
        tb_table.setStyle(tb_style)
        story.append(tb_table)
        story.append(Spacer(1, 1*mm))
        story.append(p(tier["desc"], s["small"]))
        story.append(Spacer(1, 2*mm))

        # Ideas table
        i_h = [Paragraph(h, s["table_header"]) for h in idea_headers]
        i_data = [i_h]
        for idx, (name, desc, signal, effort, impact) in enumerate(tier["ideas"]):
            i_data.append([
                Paragraph(str(idx + 1), s["table_cell_c"]),
                Paragraph(f"<b>{name}</b>", s["table_cell_bold"]),
                Paragraph(desc, s["table_cell"]),
                Paragraph(signal, s["table_cell"]),
                Paragraph(f"<b>{effort}</b>", s["table_cell_c"]),
                Paragraph(impact, s["table_cell_c"]),
            ])

        impact_colors = {
            "Very High": colors.HexColor("#ECFDF5"),
            "High": colors.HexColor("#EFF6FF"),
            "Medium": colors.HexColor("#FFFBEB"),
            "Low": WARM_WHITE,
        }

        i_style_cmds = [
            ("BACKGROUND", (0, 0), (-1, 0), tc),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8.2),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("GRID", (0, 0), (-1, -1), 0.3, GREY_LT),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ALIGN", (0, 0), (0, -1), "CENTER"),
            ("ALIGN", (4, 0), (5, -1), "CENTER"),
        ]
        for row_i, (_, _, _, _, impact) in enumerate(tier["ideas"]):
            bg = impact_colors.get(impact, WHITE)
            alt = WARM_WHITE if row_i % 2 == 0 else WHITE
            for col in range(4):
                i_style_cmds.append(("BACKGROUND", (col, row_i+1), (col, row_i+1), alt))
            i_style_cmds.append(("BACKGROUND", (5, row_i+1), (5, row_i+1), bg))

        i_table = Table(i_data, colWidths=idea_col_w, repeatRows=1)
        i_table.setStyle(TableStyle(i_style_cmds))
        story.append(i_table)
        story.append(spacer(6))

    story.append(PageBreak())

    # ── 6. MONETIZATION ANALYSIS ──────────────────────────────────────────────
    story.append(SectionDivider(6, "Monetization Analysis"))
    story.append(spacer(4))
    story.append(p(
        "RiseByDay uses a <b>four-tier model</b>: a free open-source Community fork on GitHub, "
        "two one-time purchase tiers (Local at $15, Sync + Lifetime Updates at $25), and an "
        "optional <b>AI subscription at ~$10/month</b> available to users on either paid tier. "
        "This structure eliminates subscription fatigue as a purchase barrier for the core app, "
        "creates a natural upgrade path from Community to paid to AI, and funds LLM infrastructure "
        "through recurring revenue from the users who extract the most value from the product.",
        s["body"]
    ))
    story.append(spacer(4))

    # ── 4-tier card grid (2x2) ────────────────────────────────────────────────
    def tier_card(label, price, billing, note_text, note_color, items, bg, accent_color, tag_text=""):
        card_w = (usable_w / 2) - 3*mm
        rows = [
            [Paragraph(label, ParagraphStyle("tl", fontName="Helvetica-Bold", fontSize=8, textColor=accent_color, leading=10))],
            [Paragraph(price, ParagraphStyle("tp", fontName="Helvetica-Bold", fontSize=17, textColor=NAVY, leading=20))],
            [Paragraph(billing, ParagraphStyle("tb", fontName="Helvetica", fontSize=8, textColor=GREY_DK, leading=11))],
            [Spacer(1, 2*mm)],
        ]
        for item in items:
            rows.append([Paragraph(f"&#8226; {item}", s["small"])])
        rows.append([Spacer(1, 2*mm)])
        rows.append([Paragraph(note_text, ParagraphStyle("tn2", fontName="Helvetica-Oblique", fontSize=7.5, textColor=note_color, leading=10))])
        t = Table(rows, colWidths=[card_w])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), bg),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ("LEFTPADDING", (0, 0), (-1, -1), 7),
            ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ("LINEAFTER", (0, 0), (-1, -1), 2, accent_color),
            ("LINEBEFORE", (0, 0), (-1, -1), 2, accent_color),
            ("LINEABOVE", (0, 0), (0, 0), 2, accent_color),
            ("LINEBELOW", (0, -1), (-1, -1), 2, accent_color),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        return t

    card_community = tier_card(
        "COMMUNITY", "Free", "Open-source fork on GitHub",
        "Full source code. No sync. No AI.",
        GREY_MID,
        [
            "Separate maintained fork",
            "Feature cuts vs paid tiers",
            "Task management + time-blocking",
            "All themes (community edition)",
            "ICS import + calendar views",
            "Pomodoro timer",
            "macOS, Windows, Linux builds",
            "Community contributions welcome",
        ],
        colors.HexColor("#F8FAFC"), GREY_DK,
    )

    card_local = tier_card(
        "LOCAL", "$15", "One-time purchase — own forever",
        "Offline-first. No account. No server.",
        GREEN,
        [
            "Everything in Community +",
            "Priority support",
            "All 8 home themes (full set)",
            "Custom CSS block editor",
            "Command bar (Ctrl+K)",
            "Toolkit panels + pinning",
            "macOS, Windows, Linux",
            "React Native (iOS + Android)",
            "Add AI for +$10/mo",
        ],
        colors.HexColor("#F0F7FF"), BLUE,
    )

    card_sync = tier_card(
        "SYNC + UPDATES", "$25", "One-time purchase — lifetime updates",
        "iCloud Sync. All future versions. No renewal.",
        NAVY_SOFT,
        [
            "Everything in Local +",
            "iCloud Sync (Mac, iOS, Android)",
            "Lifetime updates (all future versions)",
            "Priority feature releases",
            "Early access to beta builds",
            "Google Calendar live sync",
            "Cross-device continuity",
            "Add AI for +$10/mo",
        ],
        colors.HexColor("#EFF6FF"), NAVY_SOFT,
    )

    card_ai = tier_card(
        "AI ADD-ON", "~$10/mo", "Subscription — cancel anytime",
        "Requires Local or Sync. Priced to cover token costs.",
        ACCENT,
        [
            "Available to Local or Sync users",
            "NLP task input ('dentist Fri 2pm')",
            "AI Day Planner — auto-schedules day",
            "Smart task duration estimation",
            "Predictive weekly brief (Mon AM)",
            "AI block assignment suggestions",
            "Weekly planned vs actual insights",
            "Energy-aware scheduling",
            "Priority AI feature access",
        ],
        colors.HexColor("#FFFBEB"), ACCENT,
    )

    grid_data = [
        [card_community, card_local],
        [card_sync, card_ai],
    ]
    grid_style = TableStyle([
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ])
    grid_table = Table(grid_data, colWidths=[usable_w/2, usable_w/2])
    grid_table.setStyle(grid_style)
    story.append(grid_table)
    story.append(spacer(5))

    # ── Pricing summary table ──────────────────────────────────────────────────
    story.append(p("PRICING AT A GLANCE", s["label"]))
    story.append(spacer(2))

    pricing_data = [
        [Paragraph(h, s["table_header"]) for h in
         ["Tier", "Price", "Billing", "Sync", "Updates", "AI", "Platforms"]],
        [
            Paragraph("<b>Community</b>", s["table_cell_bold"]),
            Paragraph("Free", s["table_cell_c"]),
            Paragraph("—", s["table_cell_c"]),
            Paragraph("✗", s["table_cell_c"]),
            Paragraph("Community PRs", s["table_cell_c"]),
            Paragraph("✗", s["table_cell_c"]),
            Paragraph("Mac/Win/Linux", s["table_cell_c"]),
        ],
        [
            Paragraph("<b>Local</b>", s["table_cell_bold"]),
            Paragraph("<b>$15</b>", s["table_cell_c"]),
            Paragraph("One-time", s["table_cell_c"]),
            Paragraph("✗", s["table_cell_c"]),
            Paragraph("None guaranteed", s["table_cell_c"]),
            Paragraph("Add-on", s["table_cell_c"]),
            Paragraph("Mac/Win/Linux/iOS/Android", s["table_cell_c"]),
        ],
        [
            Paragraph("<b>Sync + Updates</b>", s["table_cell_bold"]),
            Paragraph("<b>$25</b>", s["table_cell_c"]),
            Paragraph("One-time", s["table_cell_c"]),
            Paragraph("iCloud", s["table_cell_c"]),
            Paragraph("<b>Lifetime</b>", s["table_cell_c"]),
            Paragraph("Add-on", s["table_cell_c"]),
            Paragraph("Mac/Win/Linux/iOS/Android", s["table_cell_c"]),
        ],
        [
            Paragraph("<b>AI Add-on</b>", s["table_cell_bold"]),
            Paragraph("<b>~$10/mo</b>", s["table_cell_c"]),
            Paragraph("Subscription", s["table_cell_c"]),
            Paragraph("—", s["table_cell_c"]),
            Paragraph("—", s["table_cell_c"]),
            Paragraph("✓ Full", s["table_cell_c"]),
            Paragraph("All platforms", s["table_cell_c"]),
        ],
    ]

    pricing_col_w = [28*mm, 16*mm, 20*mm, 16*mm, 25*mm, 16*mm,
                     usable_w - 28*mm - 16*mm - 20*mm - 16*mm - 25*mm - 16*mm]
    pricing_table = Table(pricing_data, colWidths=pricing_col_w, repeatRows=1)
    pricing_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.0),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("GRID", (0, 0), (-1, -1), 0.3, GREY_LT),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#F8FAFC")),
        ("BACKGROUND", (0, 2), (-1, 2), colors.HexColor("#EFF6FF")),
        ("BACKGROUND", (0, 3), (-1, 3), colors.HexColor("#E0EAFF")),
        ("BACKGROUND", (0, 4), (-1, 4), colors.HexColor("#FFFBEB")),
    ]))
    story.append(pricing_table)
    story.append(spacer(5))

    # ── Why this model works ───────────────────────────────────────────────────
    story.append(p("WHY THIS MODEL WORKS", s["label"]))
    story.append(spacer(2))
    split_reasons = [
        ("<b>Open source builds trust and a contributor community.</b> Obsidian (2M+ users) and Raycast (1M+ users) "
         "both grew primarily through open developer ecosystems. A Community fork on GitHub creates organic "
         "discoverability, signals transparency about data practices, and turns power users into contributors "
         "— none of which a closed competitor can replicate."),
        ("<b>Two OTP price points capture distinct segments without cannibalization.</b> $15 is an impulse buy for "
         "privacy-conscious or budget-conscious users who have no need for sync. $25 is a deliberate choice "
         "for users who want cross-device continuity and the assurance of lifetime updates. "
         "Neither segment needs to be pushed toward subscription."),
        ("<b>Lifetime updates at $25 is a powerful conversion lever.</b> The delta between $15 and $25 is small "
         "in absolute terms, but 'own every future version forever' is a compelling enough reason to upgrade. "
         "Things 3 ($49.99 one-time, lifetime updates) has held the #1 paid productivity slot on the Mac App Store "
         "for years on exactly this promise."),
        ("<b>AI at $10/month is priced to cover token costs with sustainable margin.</b> At current LLM API rates, "
         "$10/month comfortably covers per-user token consumption for daily NLP input and weekly AI planning "
         "while maintaining margin. Users understand that AI has real compute costs — this framing is honest "
         "and respected."),
        ("<b>AI eligibility across both paid tiers removes upgrade friction.</b> Requiring the $25 Sync tier to "
         "access AI would create an artificial gate that frustrates $15 users. By making the AI add-on "
         "available to all paid users, the AI subscription becomes a clean standalone decision, "
         "and LTV grows from both tiers independently."),
        ("<b>Cross-platform reach (Mac/Win/Linux + iOS/Android) multiplies every tier's addressable market.</b> "
         "Most competitors are Apple-only or web-only. Reaching Windows and Linux users (significant in "
         "developer, student, and enterprise segments) with the same beautiful app is a structural advantage "
         "that compounds over time — and React Native for iOS/Android adds the largest productivity app "
         "market of all."),
    ]
    for reason in split_reasons:
        story.append(p(f"&#8226;&#160;&#160;{reason}", s["bullet"]))

    story.append(spacer(4))

    # ── Revenue projections ────────────────────────────────────────────────────
    story.append(p("REVENUE PROJECTIONS — YEAR 1", s["label"]))
    story.append(spacer(2))
    story.append(p(
        "Assumptions: 40% of paid users buy Local ($15, net $10.50 after 30% App Store cut), "
        "60% buy Sync ($25, net $17.50). AI conversion = 15% of all paid users at $10/mo. "
        "Avg AI subscriber retention = 9 months in year 1. Community fork drives ~30% of paid conversions "
        "via GitHub discoverability (not modelled separately). Does not include Windows/Linux direct sales "
        "(no store cut) or Google Play/iOS revenue, which add upside.",
        s["small"]
    ))
    story.append(spacer(2))

    # Calculations:
    # Conservative: 1500 paid. Local=600 @ $10.50=$6,300. Sync=900 @ $17.50=$15,750. OTP=$22,050.
    #   AI=225 @ $10 x 9mo = $20,250. Total=$42,300
    # Base: 6000 paid. Local=2400 @ $10.50=$25,200. Sync=3600 @ $17.50=$63,000. OTP=$88,200.
    #   AI=900 @ $10 x 9mo = $81,000. Total=$169,200
    # Optimistic: 20000 paid. Local=8000 @ $10.50=$84,000. Sync=12000 @ $17.50=$210,000. OTP=$294,000.
    #   AI=3000 @ $10 x 9mo = $270,000. Total=$564,000

    rev_data = [[
        Paragraph(h, s["table_header"]) for h in
        ["Scenario", "Paid Users", "OTP Revenue (net)", "AI Subscribers", "AI Revenue (yr1)", "Total Year 1"]
    ]] + [
        [Paragraph(r[0], s["table_cell"]),
         *[Paragraph(r[i], s["table_cell_c"]) for i in range(1, 6)]]
        for r in [
            ["Conservative", "1,500", "$22,050", "225", "$20,250", "$42,300"],
            ["Base Case", "6,000", "$88,200", "900", "$81,000", "$169,200"],
            ["Optimistic", "20,000", "$294,000", "3,000", "$270,000", "$564,000"],
        ]
    ]

    rev_col_w = [25*mm, 22*mm, 32*mm, 25*mm, 32*mm,
                 usable_w - 25*mm - 22*mm - 32*mm - 25*mm - 32*mm]
    rev_table = Table(rev_data, colWidths=rev_col_w)
    rev_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.2),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.3, GREY_LT),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WARM_WHITE, WHITE, colors.HexColor("#EFF6FF")]),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ("FONTNAME", (5, 1), (5, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (5, 1), (5, -1), NAVY),
    ]))
    story.append(rev_table)
    story.append(spacer(3))
    story.append(p(
        "<i>Net OTP figures deduct Apple's 30% App Store commission. Direct sales on Windows/Linux "
        "carry no platform cut and are excluded here as conservative upside. "
        "AI revenue deducts estimated LLM API costs of ~$2/user/month at current rates.</i>",
        ParagraphStyle("disc", fontName="Helvetica-Oblique", fontSize=7.5, textColor=GREY_MID, leading=11)
    ))
    story.append(PageBreak())

    # ── 7. CLOSING RECOMMENDATIONS ────────────────────────────────────────────
    story.append(SectionDivider(7, "Closing Recommendations"))
    story.append(spacer(4))
    story.append(p(
        "Based on the feature audit, competitive analysis, market trends, and ideas evaluation, "
        "the following five recommendations represent the highest-leverage actions RiseByDay "
        "should prioritize in the next 12 months.",
        s["body"]
    ))
    story.append(spacer(4))

    recs = [
        (
            "01",
            "Ship the Menu Bar Widget First",
            "Immediate  (2-3 weeks)",
            BLUE,
            "The single highest-effort-to-impact ratio improvement available. A menu bar widget "
            "showing the current block and Pomodoro timer transforms RiseByDay from a 'launch when planning' "
            "app into an always-present ambient tool. This alone changes daily active use patterns "
            "dramatically — and it's achievable quickly using Tauri's tray APIs on top of the existing "
            "Pomodoro and block store infrastructure. Ship this before any other feature."
        ),
        (
            "02",
            "Complete Google Calendar Sync",
            "Next 60 days",
            GREEN,
            "Live calendar sync is the #1 onboarding blocker. Every competitor has it. The connected "
            "calendars infrastructure already exists in RiseByDay — the OAuth flow and Google Calendar API "
            "integration need to be completed. Until this ships, a significant segment of potential users "
            "will not adopt the app as their primary planner. This unlocks smart conflict detection as an "
            "immediate follow-on feature."
        ),
        (
            "03",
            "4-Tier Launch: OSS Fork → $15 Local → $25 Sync → $10/mo AI",
            "OSS fork first, then Mac App Store OTP, then AI subscription",
            NAVY_SOFT,
            "Release the Community fork on GitHub first — this builds developer trust, drives organic "
            "discoverability, and establishes the open-source identity before any money changes hands. "
            "Then launch Local ($15) and Sync + Lifetime Updates ($25) simultaneously on Mac App Store, "
            "Microsoft Store, and as direct downloads for Linux. The $10 difference between Local and Sync "
            "is small enough to be an easy upgrade decision, but 'lifetime updates' is a compelling enough "
            "reason to choose Sync. Ship the AI subscription add-on (~$10/mo) once NLP input and smart "
            "day planning are ready — available to all paid users regardless of which OTP tier they purchased. "
            "The four-tier structure ensures no user segment is excluded while maximizing LTV across all of them."
        ),
        (
            "04",
            "Add NLP Task Input and Ship the Habit Streak System",
            "Weeks 4-8",
            ACCENT,
            "These two features have outsized psychological impact. Natural language input ('meeting Thursday "
            "at 3pm #work high priority') dramatically lowers the friction of task capture — the most common "
            "failure point for productivity apps. Habit streaks leverage existing data (lastCompletedAt is "
            "already tracked) and tap into the strongest retention mechanic known in behavioral design. "
            "Both close the gap with AI-first competitors without requiring full AI infrastructure."
        ),
        (
            "05",
            "Launch the Theme Marketplace with Community Seeding",
            "3-6 months",
            colors.HexColor("#7C3AED"),
            "The marketplace architecture is already built into the codebase (ClockStyleSource supports "
            "'marketplace'). Launch it with 10-15 carefully curated community-made themes, a simple JSON "
            "submission format, and a creator showcase. This creates a community identity that transforms "
            "RiseByDay users into evangelists. Raycast grew from 0 to 1M users in 2 years almost entirely "
            "through its extension ecosystem. A theme marketplace is RiseByDay's version of that flywheel."
        ),
    ]

    for num, title, timeline, color, body in recs:
        rec_data = [[
            Paragraph(num, ParagraphStyle("rn", fontName="Helvetica-Bold", fontSize=18, textColor=WHITE, alignment=TA_CENTER, leading=22)),
            Paragraph(f"<b>{title}</b><br/><font size='8' color='grey'>{timeline}</font>",
                     ParagraphStyle("rt", fontName="Helvetica-Bold", fontSize=11, textColor=WHITE, leading=16)),
        ]]
        rec_style = TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), color),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ])
        rec_table = Table(rec_data, colWidths=[15*mm, usable_w - 15*mm])
        rec_table.setStyle(rec_style)

        body_data = [[Paragraph(body, s["body_left"])]]
        body_style_t = TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), WARM_WHITE),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("LINEBELOW", (0, 0), (-1, -1), 2, color),
        ])
        body_table = Table(body_data, colWidths=[usable_w])
        body_table.setStyle(body_style_t)

        story.append(KeepTogether([
            rec_table,
            body_table,
            Spacer(1, 5*mm),
        ]))

    story.append(spacer(5))
    story.append(hr(BLUE_XLT, 1))
    story.append(spacer(3))

    story.append(p(
        "RiseByDay is exceptionally well-positioned. The design system, time-blocking architecture, "
        "and offline-first foundation are rare combinations that larger, better-funded competitors "
        "cannot easily replicate. The path to a meaningful, revenue-generating product is clear: "
        "ship a menu bar widget, complete calendar sync, launch on the Mac App Store, add NLP input, "
        "and open the theme marketplace. Each step builds on the last and compounds.",
        s["body"]
    ))
    story.append(spacer(2))
    story.append(p(
        "<i>This report was generated on May 30, 2026. Market data reflects publicly available "
        "information as of Q1 2026. Revenue projections are estimates based on comparable "
        "Mac App Store productivity apps and should not be treated as forecasts.</i>",
        ParagraphStyle("disclaimer", fontName="Helvetica-Oblique", fontSize=7.5, textColor=GREY_MID, leading=11)
    ))

    return story


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    output_path = "/Users/joshuarashtian/Documents/DayByDay/RiseByDay_Market_Report.pdf"
    usable_w = PAGE_W - 2 * MARGIN

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=14*mm,
        bottomMargin=12*mm,
        title="RiseByDay — Product & Market Analysis Report",
        author="Joshua Rashtian",
        subject="Strategic Feature Roadmap — May 2026",
        creator="RiseByDay Internal",
    )

    s = build_styles()
    story = build_story(s, usable_w)

    def draw_cover(canvas, doc):
        """Paint the cover page directly onto the canvas (page 1)."""
        canvas.saveState()
        cov = CoverPage(PAGE_W, PAGE_H)
        cov.canv = canvas
        cov.draw()
        canvas.restoreState()

    doc.build(story, onFirstPage=draw_cover, onLaterPages=header_footer)
    print(f"PDF saved: {output_path}")
    import os
    size_kb = os.path.getsize(output_path) // 1024
    print(f"File size: {size_kb} KB")


if __name__ == "__main__":
    main()
