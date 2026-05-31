#!/usr/bin/env python3
"""Generate a research PDF on task management app trends and feature ideas."""

from fpdf import FPDF
from pathlib import Path


def ascii_safe(text: str) -> str:
    replacements = {
        "\u2014": "-",
        "\u2013": "-",
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2022": "-",
        "\u2192": "->",
        "\u2014": "-",
    }
    for src, dst in replacements.items():
        text = text.replace(src, dst)
    return text.encode("latin-1", errors="replace").decode("latin-1")


class ResearchPDF(FPDF):
    def header(self):
        if self.page_no() > 1:
            self.set_font("Helvetica", "I", 8)
            self.set_text_color(120, 120, 120)
            self.cell(0, 8, "Task Management App Research Brief | May 2026", align="C")
            self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")

    def cover_page(self):
        self.add_page()
        self.ln(40)
        self.set_font("Helvetica", "B", 28)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 14, "Task Management Apps\nResearch Brief", align="C")
        self.ln(8)
        self.set_font("Helvetica", "", 14)
        self.set_text_color(80, 80, 80)
        self.multi_cell(
            0,
            8,
            "Market Trends, User-Requested Features,\nand Product Ideas for 2025-2030",
            align="C",
        )
        self.ln(20)
        self.set_font("Helvetica", "I", 11)
        self.cell(0, 8, "Prepared for DayByDay | May 2026", align="C")

    def section_title(self, title: str):
        self.ln(4)
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(20, 60, 120)
        self.multi_cell(0, 10, ascii_safe(title))
        self.ln(2)
        self.set_draw_color(20, 60, 120)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(4)

    def subsection(self, title: str):
        self.ln(2)
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(40, 40, 40)
        self.multi_cell(0, 7, ascii_safe(title))
        self.ln(1)

    def body(self, text: str):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 5.5, ascii_safe(text))
        self.ln(2)

    def bullet(self, text: str):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(30, 30, 30)
        x = self.get_x()
        self.cell(6, 5.5, "-")
        self.multi_cell(0, 5.5, ascii_safe(text))
        self.set_x(x)
        self.ln(1)

    def stat_box(self, label: str, value: str, detail: str):
        y = self.get_y()
        if y > 250:
            self.add_page()
            y = self.get_y()
        self.set_fill_color(240, 245, 252)
        self.rect(10, y, 190, 22, "F")
        self.set_xy(14, y + 3)
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(20, 60, 120)
        self.cell(50, 6, ascii_safe(value))
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(40, 40, 40)
        self.cell(0, 6, ascii_safe(label))
        self.set_xy(14, y + 11)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(70, 70, 70)
        self.multi_cell(182, 4.5, ascii_safe(detail))
        self.set_y(y + 26)


def build_pdf(output_path: Path) -> None:
    pdf = ResearchPDF()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.cover_page()

    # Executive Summary
    pdf.add_page()
    pdf.section_title("Executive Summary")
    pdf.body(
        "The global task management software market is experiencing strong growth, driven by hybrid "
        "work, cloud adoption, and AI-powered productivity tools. Users increasingly expect apps to "
        "do more than store to-do lists—they want intelligent prioritization, calendar integration, "
        "focus tools, and seamless cross-platform sync. This brief synthesizes market data, "
        "competitive analysis, and community-requested features to inform product strategy."
    )
    pdf.stat_box("$5.1B", "Market Size (2025)", "Global task management software market valuation")
    pdf.stat_box("12-15%", "CAGR", "Expected annual growth through 2030")
    pdf.stat_box("$2.44B", "AI Sub-Market (2025)", "AI task manager apps projected to reach $5.76B by 2035")
    pdf.stat_box("45K/qtr", "Enterprise AI Adoptions", "Fortune 500 AI-driven task management deployments per quarter")

    # Market Trends
    pdf.add_page()
    pdf.section_title("1. Market Trends (2025-2030)")

    pdf.subsection("1.1 Market Growth & Drivers")
    pdf.body(
        "Multiple industry reports converge on rapid expansion. The task management software market "
        "g grew from $4.45B (2024) to $5.1B (2025), with projections reaching $8.6-9.5B by 2029-2030. "
        "Key growth drivers include remote/hybrid work permanence, SME adoption, mobile-first design, "
        "and integration with broader enterprise ecosystems."
    )
    for item in [
        "Remote & hybrid work: Distributed teams need shared visibility, async updates, and real-time sync.",
        "Cloud-first deployment: Lower barriers for individuals and teams; cross-device access is table stakes.",
        "SME adoption: Small businesses are the fastest-growing segment seeking affordable, all-in-one tools.",
        "Mobile dominance: Smartphone/tablet platforms lead AI task manager adoption due to on-the-go capture.",
        "Asia-Pacific: Fastest-growing region; North America remains the largest market.",
    ]:
        pdf.bullet(item)

    pdf.subsection("1.2 AI & Automation Trends")
    pdf.body(
        "AI is the defining trend reshaping task management. The dedicated AI task manager sub-market "
        "is growing at ~18% CAGR, with NLP-based task capture as the dominant functionality."
    )
    for item in [
        "Natural language task capture: Users expect 'Call dentist tomorrow at 2pm' to parse correctly without syntax.",
        "AI-assisted prioritization: Smart ranking based on deadlines, effort, dependencies, and calendar availability.",
        "Predictive scheduling: Auto-adjust tasks when meetings run over or priorities shift.",
        "Voice-enabled capture: Mobile dictation (Todoist Ramble, Siri/Google Assistant integrations).",
        "Task breakdown & suggestions: AI decomposes large projects into actionable subtasks.",
        "Agentic AI with transparency: Enterprise users demand visible action logs and approval gates before AI acts.",
        "Predictive analytics: Bottleneck detection, workload balancing, and performance dashboards.",
    ]:
        pdf.bullet(item)

    pdf.subsection("1.3 Competitive Landscape Shifts")
    for item in [
        "All-in-one bundling: TickTick model—tasks + habits + Pomodoro + calendar in one app wins on value.",
        "Simplicity vs. power: Things 3 proves premium one-time pricing works for friction-free Apple-native UX.",
        "Integration ecosystems: Todoist's 80+ integrations vs. TickTick's 30+—connectivity drives stickiness.",
        "Open-source momentum: Super Productivity, Vikunja gaining traction with privacy-conscious power users.",
        "Vertical templates: Industry-specific workflows (healthcare, legal, construction) reduce setup friction.",
        "Self-hosted options: Growing demand for data sovereignty and offline-first architectures.",
    ]:
        pdf.bullet(item)

    pdf.subsection("1.4 Pricing & Business Model Trends")
    for item in [
        "Freemium with generous free tiers remains dominant (Todoist: 5 projects free; TickTick: 9 lists free).",
        "Premium tiers: $3-6/month for individuals; team plans $8-15/user/month.",
        "One-time purchase niche: Things 3 ($10-80) appeals to subscription-fatigued Apple users.",
        "AI features gated behind Pro/Business tiers (Todoist Task Assist, Asana AI Teammates).",
        "Managed services growing 16.8% annually as enterprises need integration help.",
    ]:
        pdf.bullet(item)

    # Highly Requested Features
    pdf.add_page()
    pdf.section_title("2. Highly Requested Features (User Community)")
    pdf.body(
        "Analysis of GitHub issues, Reddit discussions, app store reviews, and feature request forums "
        "reveals consistent patterns. Users repeatedly ask for the same capabilities across Todoist, "
        "TickTick, Super Productivity, Notion, and Asana."
    )

    pdf.subsection("2.1 Core Task Management (Most Requested)")
    features_core = [
        ("Natural language input", "Parse dates, times, priorities, and projects from plain English. #1 differentiator for Todoist."),
        ("Bulk / multi-select operations", "Select multiple tasks to move, delete, reschedule, or tag at once. Extremely high demand."),
        ("Recurring task intelligence", "Move/edit recurring tasks with all instances; handle exceptions gracefully."),
        ("Subtasks & checklists", "Nested tasks with independent completion; progress roll-up to parent."),
        ("Sections within projects", "Lightweight grouping (Todoist/TickTick sections) without full Kanban overhead."),
        ("Task comments & activity log", "Timestamped notes for blocked tasks, client calls, status updates."),
        ("Unified inbox / master task view", "See ALL tasks across projects in one place for weekly planning."),
        ("Smart lists & custom filters", "Saved queries: 'due this week + high priority + @work'."),
        ("Drag-and-drop everywhere", "Reorder tasks, move between projects, reschedule on calendar via drag."),
        ("Undo & version history", "Recover accidentally deleted or modified tasks."),
    ]
    for name, desc in features_core:
        pdf.bullet(f"{name}: {desc}")

    pdf.subsection("2.2 Calendar & Scheduling")
    for item in [
        "Two-way calendar sync (Google, Outlook, iCloud, Apple Calendar).",
        "Time blocking / calendar view with drag-to-schedule tasks on specific time slots.",
        "Multiple calendar views: day, 3-day, week, month, agenda, timeline.",
        "Deadline vs. due date distinction (Todoist 2025 feature—users wanted this for years).",
        "Conflict detection: warn when scheduling tasks during existing meetings.",
        "Focus time auto-blocking: reserve deep work slots based on task estimates.",
    ]:
        pdf.bullet(item)

    pdf.subsection("2.3 Focus & Productivity Tools")
    for item in [
        "Built-in Pomodoro / focus timer linked to tasks (TickTick's highest-value feature per reviews).",
        "Time tracking per task with reports and billing export.",
        "Habit tracking alongside tasks (daily streaks, reminders, statistics).",
        "Eisenhower Matrix view for urgent/important prioritization.",
        "Distraction blocking during focus sessions (website/app blockers).",
        "White noise / ambient sounds during focus (TickTick, Forest integration).",
        "Daily/weekly review workflows (GTD-inspired reflection prompts).",
    ]:
        pdf.bullet(item)

    pdf.subsection("2.4 Collaboration & Teams")
    for item in [
        "Shared projects with assignees, due dates, and @mentions.",
        "Real-time sync and presence indicators.",
        "Task delegation with acceptance/decline flow.",
        "Comments, attachments, and file sharing on tasks.",
        "Activity feed / audit trail for team transparency.",
        "Role-based permissions (viewer, editor, admin).",
        "Guest access for external collaborators without full accounts.",
    ]:
        pdf.bullet(item)

    pdf.subsection("2.5 Integrations & Platform")
    for item in [
        "Cross-platform sync: macOS, Windows, Linux, iOS, Android, Web.",
        "Offline mode with conflict resolution on reconnect.",
        "Email-to-task (forward emails to create tasks).",
        "Slack/Teams notifications and task creation from chat.",
        "Zapier/Make/n8n automation support.",
        "API & webhooks for custom integrations.",
        "Widgets (home screen, menu bar, desktop) for quick capture.",
        "Keyboard shortcuts and CLI for power users.",
        "Import/export (CSV, JSON, from Todoist/TickTick/Things).",
    ]:
        pdf.bullet(item)

    # Product Ideas
    pdf.add_page()
    pdf.section_title("3. Product Ideas & Differentiation Opportunities")

    ideas = [
        (
            "AI Daily Planner",
            "Morning briefing that reads calendar + tasks and proposes an optimized day. "
            "Adjusts in real-time when meetings shift. Shows 'why' for each suggestion.",
        ),
        (
            "Context-Aware Task Capture",
            "Capture tasks from anywhere: screenshot OCR, voice memo transcription, "
            "browser extension highlight-to-task, email parsing with smart project routing.",
        ),
        (
            "Energy-Based Scheduling",
            "Tag tasks by cognitive load (deep/medium/light). Auto-schedule heavy work "
            "during user's peak hours learned from completion patterns.",
        ),
        (
            "Focus OS Mode",
            "Full-screen focus mode that hides everything except current task + timer. "
            "Integrates Pomodoro, blocklists, and session analytics. DayByDay already has Pomodoro—extend into a 'deep work shell'.",
        ),
        (
            "Weekly Planning Ritual",
            "Guided Sunday/Monday workflow: review overdue, pick top 3 priorities, "
            "time-block the week, archive completed. Reduces 'planning paralysis'.",
        ),
        (
            "Task Templates Marketplace",
            "Community-shared templates: 'Product launch', 'Move apartment', 'Weekly review'. "
            "One-click import with subtasks, durations, and recurring rules.",
        ),
        (
            "Smart Recurring Engine",
            "Recurring tasks that adapt: 'Water plants' skips when you're traveling "
            "(calendar-aware). 'Weekly report' auto-creates subtasks from last week's template.",
        ),
        (
            "Accountability Pods",
            "Small groups (2-5 people) share weekly goals and check in async. "
            "Not full project management—lightweight peer accountability.",
        ),
        (
            "Task Aging & Decay Alerts",
            "Surface tasks that have sat untouched for 30+ days. "
            "Prompt: reschedule, delegate, delete, or break down.",
        ),
        (
            "Unified Life Dashboard",
            "Single view: tasks + calendar + habits + Pomodoro stats + streaks. "
            "TickTick proved this bundle wins; polish and UX can differentiate.",
        ),
        (
            "Local-First / Privacy Mode",
            "End-to-end encrypted sync, optional self-hosting, no AI data training. "
            "Targets privacy-conscious professionals and EU market.",
        ),
        (
            "Spotify / Music Integration",
            "Focus playlists that start with Pomodoro sessions. "
            "DayByDay already has Spotify integration—tie focus music to task context.",
        ),
        (
            "Calendar Block Builder",
            "Drag tasks onto calendar to create time blocks that sync back as calendar events. "
            "Visual gap analysis: 'You have 2 hours free Thursday afternoon'.",
        ),
        (
            "Task Dependencies (Lightweight)",
            "Simple 'blocked by' links without full Gantt complexity. "
            "Auto-unblock when dependency completes.",
        ),
        (
            "Gamification (Optional)",
            "XP for completed tasks, streak badges, level-ups. "
            "Must be opt-in—many users hate gamification, but ADHD community often loves it.",
        ),
    ]
    for i, (title, desc) in enumerate(ideas, 1):
        pdf.subsection(f"3.{i} {title}")
        pdf.body(desc)

    # Feature Priority Matrix
    pdf.add_page()
    pdf.section_title("4. Feature Priority Matrix")
    pdf.body(
        "Suggested prioritization based on user demand frequency, competitive gap, and implementation complexity."
    )

    pdf.subsection("Tier 1 - Must Have (Table Stakes)")
    for item in [
        "Natural language task input",
        "Cross-platform sync (web + desktop + mobile)",
        "Due dates, priorities, and reminders",
        "Projects/lists with tags/labels",
        "Recurring tasks",
        "Search and filters",
        "Calendar view with time blocking",
        "Subtasks",
    ]:
        pdf.bullet(item)

    pdf.subsection("Tier 2 - High Impact Differentiators")
    for item in [
        "Built-in Pomodoro / focus timer",
        "Bulk operations (multi-select)",
        "AI task breakdown and prioritization",
        "Habit tracking integration",
        "Two-way calendar sync",
        "Task comments / activity log",
        "Offline mode",
        "Keyboard shortcuts & quick capture",
    ]:
        pdf.bullet(item)

    pdf.subsection("Tier 3 - Growth & Retention")
    for item in [
        "Team collaboration features",
        "Templates marketplace",
        "Integrations (Slack, email, Zapier)",
        "Analytics & productivity insights",
        "Weekly review workflow",
        "Import from competitors",
        "Widgets & menu bar app",
    ]:
        pdf.bullet(item)

    pdf.subsection("Tier 4 - Future / Niche")
    for item in [
        "Agentic AI teammates",
        "Self-hosted / E2E encryption",
        "Eisenhower Matrix view",
        "Time tracking & billing",
        "Gamification",
        "Accountability pods",
        "Voice-first interface",
    ]:
        pdf.bullet(item)

    # User Personas
    pdf.add_page()
    pdf.section_title("5. Key User Personas & What They Want")

    personas = [
        (
            "The Solo Knowledge Worker",
            "Uses: Todoist or Things 3. Wants: fast capture, calendar sync, minimal friction. "
            "Pays: $4-6/mo. Key features: NLP input, Today view, widgets, Siri shortcuts.",
        ),
        (
            "The Power User / GTD Practitioner",
            "Uses: TickTick or OmniFocus. Wants: filters, contexts, reviews, customization. "
            "Pays: $3-5/mo. Key features: smart lists, tags, bulk ops, time blocking, habits.",
        ),
        (
            "The Team Lead",
            "Uses: Asana, Monday, ClickUp. Wants: delegation, visibility, integrations. "
            "Pays: $10-15/user/mo. Key features: assignees, comments, activity feed, dashboards.",
        ),
        (
            "The Student",
            "Uses: Notion, Microsoft To Do (free). Wants: free tier, simple UI, reminders. "
            "Pays: $0-3/mo. Key features: due dates, subtasks, mobile app, exam countdown.",
        ),
        (
            "The ADHD / Neurodivergent User",
            "Uses: Tiimo, Goblin Tools, TickTick. Wants: visual scheduling, body doubling, gamification. "
            "Pays: $5-10/mo. Key features: time estimates, focus timer, habit streaks, gentle reminders.",
        ),
        (
            "The Privacy Advocate",
            "Uses: Super Productivity, Vikunja, self-hosted. Wants: local-first, no cloud dependency. "
            "Pays: $0-20 one-time. Key features: offline, export, open source, no AI training on data.",
        ),
    ]
    for name, desc in personas:
        pdf.subsection(name)
        pdf.body(desc)

    # DayByDay Alignment
    pdf.add_page()
    pdf.section_title("6. Relevance to DayByDay")
    pdf.body(
        "DayByDay already includes several features aligned with high-demand trends: Pomodoro timer, "
        "Spotify integration, task categories/blocks, calendar integrations, and a desktop (Tauri) app. "
        "The following opportunities map directly to existing architecture."
    )
    for item in [
        "Extend Pomodoro into a full Focus Mode with task linking and session history.",
        "Leverage Spotify integration for context-aware focus playlists during work blocks.",
        "Add natural language task capture as a headline differentiator.",
        "Build a unified 'Plan My Day' view combining tasks, calendar blocks, and Pomodoro slots.",
        "Implement bulk task operations—consistently top-requested across open-source apps.",
        "Add task comments/notes with timestamps for long-running or blocked tasks.",
        "Weekly review screen: overdue tasks, completion stats, Pomodoro hours, habit streaks.",
        "Smart recurring tasks with exception handling (move all instances).",
        "Calendar time-blocking: drag tasks from list onto day timeline.",
        "Local-first storage with optional sync (Tauri advantage for desktop-native performance).",
    ]:
        pdf.bullet(item)

    # Sources
    pdf.add_page()
    pdf.section_title("7. Sources & References")
    sources = [
        "The Business Research Company — Task Management Software Market Report 2026",
        "Research and Markets — Task Management Software Market Report 2026",
        "Precedence Research — AI Task Manager App Market Size 2025-2035",
        "Mordor Intelligence — Task Management Software Market Analysis",
        "Astute Analytica — Global Task Management Software Market Trends 2026",
        "Asana — AI Agents Built for Teams: Shared Context and Transparency (2026)",
        "Super Productivity GitHub Issues #7058, #4412, #6717 (community feature requests)",
        "Todoist vs TickTick vs Things 3 comparisons (Rivva, ToolChief, ToolFinder, 2025-2026)",
        "Camunda 2026 State of Agentic Orchestration & Automation Report",
    ]
    for src in sources:
        pdf.bullet(src)

    pdf.ln(6)
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(100, 100, 100)
    pdf.multi_cell(
        0,
        5,
        "Disclaimer: Market figures vary by research firm due to scope definitions. "
        "Figures cited represent commonly reported ranges. Feature priorities should be "
        "validated with your specific user base through surveys and usage analytics.",
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(output_path))


if __name__ == "__main__":
    out = Path(__file__).resolve().parent.parent / "docs" / "Task-Management-App-Research-Brief.pdf"
    build_pdf(out)
    print(f"Generated: {out}")
