#!/usr/bin/env python3
"""Generate a feature recommendations PDF for DayByDay (Rise By Day)."""

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
        "\u2713": "[x]",
        "\u2717": "[ ]",
        "\u25cf": "-",
    }
    for src, dst in replacements.items():
        text = text.replace(src, dst)
    return text.encode("latin-1", errors="replace").decode("latin-1")


class FeaturePDF(FPDF):
    def header(self):
        if self.page_no() > 1:
            self.set_font("Helvetica", "I", 8)
            self.set_text_color(120, 120, 120)
            self.cell(0, 8, "DayByDay Feature Recommendations | May 2026", align="C")
            self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")

    def cover_page(self):
        self.add_page()
        self.ln(35)
        self.set_font("Helvetica", "B", 26)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 13, "DayByDay\nFeature Recommendations", align="C")
        self.ln(6)
        self.set_font("Helvetica", "", 13)
        self.set_text_color(80, 80, 80)
        self.multi_cell(
            0,
            7,
            "Most-Requested Features in Task Apps,\nRecommended New Features, and\nPersonalized Roadmap for Rise By Day",
            align="C",
        )
        self.ln(18)
        self.set_font("Helvetica", "I", 11)
        self.cell(0, 8, "Prepared May 2026 | Based on market research and codebase audit", align="C")

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

    def priority_row(self, priority: str, feature: str, rationale: str):
        y = self.get_y()
        if y > 255:
            self.add_page()
            y = self.get_y()
        colors = {
            "P0": (220, 53, 69),
            "P1": (255, 140, 0),
            "P2": (20, 100, 180),
            "P3": (100, 100, 100),
        }
        r, g, b = colors.get(priority, (100, 100, 100))
        self.set_fill_color(r, g, b)
        self.rect(10, y, 14, 7, "F")
        self.set_xy(10.5, y + 1)
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(255, 255, 255)
        self.cell(13, 5, priority, align="C")
        self.set_xy(26, y)
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(30, 30, 30)
        self.cell(0, 5, ascii_safe(feature))
        self.set_xy(26, y + 6)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(70, 70, 70)
        self.multi_cell(174, 4.5, ascii_safe(rationale))
        self.set_y(y + 16)


def build_pdf(output_path: Path) -> None:
    pdf = FeaturePDF()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.cover_page()

    # Executive Summary
    pdf.add_page()
    pdf.section_title("Executive Summary")
    pdf.body(
        "DayByDay (Rise By Day) is a desktop-first productivity app built with Tauri and React. "
        "It already combines tasks, time blocks, calendar views, Pomodoro focus, Spotify integration, "
        "and deep home-screen customization - a positioning similar to TickTick's all-in-one model but "
        "with a stronger emphasis on visual identity and daily rhythm."
    )
    pdf.body(
        "This document covers three areas: (1) the features users most frequently request across "
        "leading task apps, (2) recommended new features for the category in 2025-2030, and "
        "(3) a personalized roadmap for DayByDay based on what the app already ships versus "
        "what competitors offer and users consistently ask for."
    )

    # Section 1: Most Requested
    pdf.section_title("1. Most Requested Features Across Task Apps")
    pdf.body(
        "Synthesized from Todoist forums, TickTick reviews, Super Productivity GitHub issues, "
        "Reddit r/productivity threads, and 2025-2026 app comparisons. These appear repeatedly "
        "regardless of which app users currently use."
    )

    pdf.subsection("1.1 Top 10 by Request Frequency")
    top10 = [
        ("Natural language task input", "Type 'Call dentist tomorrow 2pm #health !!' and have dates, projects, and priority parsed automatically. Todoist's headline feature; #1 wish in most comparisons."),
        ("Bulk / multi-select operations", "Select many tasks to reschedule, delete, move, or tag at once. Super Productivity issue #7058 and TickTick forums cite this constantly."),
        ("Two-way calendar sync", "Google, Outlook, iCloud. Users want tasks AND events in one timeline with real-time sync, not 15-minute polling."),
        ("Time blocking on calendar", "Drag tasks onto hour slots. Todoist added this under years of pressure; Sunsama/Akiflow exist because Todoist's version is barebones."),
        ("Smart recurring task handling", "Edit one instance vs. all future; skip when traveling; handle exceptions without breaking the series."),
        ("Subtasks with progress roll-up", "Nested checklists where parent shows X/Y complete. Table stakes for Todoist, TickTick, Things, Asana."),
        ("Saved filters / smart lists", "Persistent queries like 'due this week + high priority + @work'. Power users live in custom views."),
        ("Built-in focus timer linked to tasks", "TickTick's Pomodoro is its highest-rated feature. Users want session history tied to specific tasks."),
        ("Cross-device sync + offline mode", "640+ Reddit requests for offline-first tools. Sync on reconnect with conflict resolution."),
        ("Undo and task history", "Recover accidentally deleted or rescheduled tasks. Surprisingly high demand given how rarely apps ship it."),
    ]
    for i, (name, desc) in enumerate(top10, 1):
        pdf.bullet(f"#{i} {name}: {desc}")

    pdf.subsection("1.2 Other High-Demand Categories")
    categories = {
        "Calendar & scheduling": [
            "Deadline vs. due date (Todoist shipped this in 2025 after years of requests)",
            "Conflict detection when scheduling over existing meetings",
            "Multiple views: day, 3-day, week, month, agenda, timeline",
            "Focus time auto-blocking based on task estimates",
        ],
        "Focus & habits": [
            "Habit tracking with streaks alongside tasks (TickTick bundle)",
            "Eisenhower Matrix for urgent/important sorting",
            "Distraction blocking during focus sessions",
            "Weekly/daily review workflows (GTD-inspired)",
            "Time tracking per task with reports",
        ],
        "Capture & input": [
            "Voice input / dictation on mobile",
            "Email-to-task forwarding",
            "Browser extension highlight-to-task",
            "Quick capture widgets (menu bar, home screen)",
            "Keyboard shortcuts and CLI for power users",
        ],
        "Collaboration": [
            "Shared projects with assignees and @mentions",
            "Comments and attachments on tasks",
            "Activity feed / audit trail",
            "Guest access without full accounts",
        ],
        "Platform & trust": [
            "Import from Todoist/TickTick/Things (CSV, JSON)",
            "API and webhooks for automation",
            "Local-first / privacy mode with optional self-hosting",
            "End-to-end encryption (growing EU demand)",
        ],
    }
    for cat, items in categories.items():
        pdf.subsection(cat)
        for item in items:
            pdf.bullet(item)

    # Section 2: Recommended New Features (Industry)
    pdf.add_page()
    pdf.section_title("2. Recommended New Features (Industry Trends 2025-2030)")

    pdf.subsection("2.1 AI-Powered Features (Fastest-Growing Segment)")
    pdf.body(
        "The AI task manager sub-market is projected to grow from $2.44B (2025) to $5.76B by 2035 "
        "at ~18% CAGR. Users expect AI to reduce planning friction, not replace judgment."
    )
    for item in [
        "AI Daily Planner: morning briefing that reads calendar + tasks and proposes an optimized day",
        "Natural language capture: parse dates, times, projects, and priority from plain English",
        "AI task breakdown: decompose 'Launch website' into actionable subtasks with estimates",
        "Predictive rescheduling: auto-adjust when meetings run over or priorities shift",
        "Agentic AI with transparency: visible action logs and approval gates before AI acts",
        "Energy-based scheduling: tag tasks by cognitive load, schedule deep work at peak hours",
    ]:
        pdf.bullet(item)

    pdf.subsection("2.2 All-in-One Life Dashboard")
    pdf.body(
        "TickTick proved that bundling tasks + calendar + habits + Pomodoro in one app wins on value. "
        "Users are tired of juggling 4-6 apps (Todoist + Google Calendar + Forest + Notion + Spotify)."
    )
    for item in [
        "Unified dashboard: tasks, calendar, habits, Pomodoro stats, and streaks in one view",
        "Weekly planning ritual: guided Sunday/Monday workflow to reduce planning paralysis",
        "Task aging alerts: surface tasks untouched 30+ days with reschedule/delegate/delete prompts",
        "Context-aware focus: tie Spotify/music, blocklists, and timer to the current task block",
    ]:
        pdf.bullet(item)

    pdf.subsection("2.3 Differentiation Opportunities")
    ideas = [
        ("Calendar Block Builder", "Drag tasks onto calendar to create time blocks that sync as calendar events. Gap analysis: 'You have 2 hours free Thursday afternoon'."),
        ("Task Templates Marketplace", "Community templates: 'Product launch', 'Move apartment', 'Weekly review'. One-click import with subtasks and durations."),
        ("Accountability Pods", "Small groups (2-5) share weekly goals and check in async. Lightweight peer accountability, not full PM."),
        ("Local-First Privacy Mode", "End-to-end encrypted sync, optional self-hosting, no AI training on user data. Targets privacy-conscious professionals."),
        ("Smart Recurring Engine", "Calendar-aware recurrence: 'Water plants' skips when traveling. 'Weekly report' auto-creates subtasks from last week's template."),
        ("Lightweight Dependencies", "Simple 'blocked by' links without full Gantt. Auto-unblock when dependency completes."),
        ("Gamification (Opt-In)", "XP, streak badges, level-ups. Must be optional - ADHD community often loves it; others hate it."),
    ]
    for title, desc in ideas:
        pdf.bullet(f"{title}: {desc}")

    # Section 3: DayByDay Current State
    pdf.add_page()
    pdf.section_title("3. DayByDay Current Feature Audit")
    pdf.body(
        "Based on codebase review of Rise By Day (May 2026). This maps what you already ship "
        "against the most-requested feature list above."
    )

    pdf.subsection("3.1 Already Built (Competitive Strengths)")
    built = [
        ("Pomodoro timer with task linking", "Global dock, focus panel, linked task title, session counting. Matches TickTick's top feature."),
        ("Time blocks (daily rhythm)", "Configurable morning/afternoon/evening blocks with active-block banner on home screen. Unique differentiator vs. Todoist."),
        ("Calendar drag-to-schedule", "useCalendarTaskDrop hook: drag tasks onto day/week/month/agenda views to set dueDate/endDate."),
        ("Multiple calendar views", "Day agenda, week, and month grid views implemented."),
        ("Task kinds", "task, event, reminder, habit, class, ics - richer model than basic to-do apps."),
        ("Recurrence engine", "Daily/weekly/monthly with weekday selection and untilDate. advanceRecurrenceDate on completion."),
        ("Categories, tags, blocks, priorities", "Full categorization with color/icon config. Critical flag for urgent items."),
        ("ICS calendar import", "Import .ics files; dedup via icsUid; read-only imported events."),
        ("Spotify integration", "Dedicated screen and toolkit panel. Rare in task apps - strong focus/music angle."),
        ("Deep home customization", "Theme registry, clock styles, block/ribbon/tasks visual styles, separate style editor window."),
        ("Class/student workflow", "Class task kind with location, grade metadata, and dedicated toolkit window."),
        ("Audio feedback", "Customizable task click sounds (chew, happy, piano). Delight factor."),
        ("Desktop-native (Tauri)", "Native window, home style popup window, local storage performance."),
        ("Connected calendars UI", "Google connect flow and calendar picker (currently mock/local state)."),
        ("Task command bar & sidebar", "Quick navigation, today tasks panel, global create-task action."),
    ]
    for name, desc in built:
        pdf.bullet(f"{name}: {desc}")

    pdf.subsection("3.2 Gaps vs. User Expectations")
    gaps = [
        ("Natural language input", "Not implemented. TaskCreator uses structured form fields."),
        ("Bulk / multi-select", "No multi-select for batch reschedule, delete, or move."),
        ("Subtasks", "Task model has no parentId or nested children."),
        ("Real calendar sync", "Google integration is mock data; no OAuth or two-way sync yet."),
        ("Smart filters / saved views", "No persistent filter queries across categories/tags/blocks."),
        ("Undo / history", "No soft-delete or action rollback in tasksStore."),
        ("Cloud sync / mobile", "LocalStorage only via Zustand persist; no cross-device sync or mobile app."),
        ("Habit tracking UI", "habit kind exists in types but no streak UI or habit-specific views."),
        ("Weekly review workflow", "No guided review screen with stats and overdue triage."),
        ("Task comments / activity log", "notes field exists but no timestamped comment thread or audit trail."),
        ("Time tracking", "Pomodoro counts sessions but no per-task duration log or reports."),
        ("Import from competitors", "ICS import only; no Todoist/TickTick/Things migration path."),
        ("Offline conflict resolution", "Single-device local storage; no sync conflicts to resolve."),
        ("AI features", "No NLP parsing, prioritization, or daily planning assistant."),
        ("Keyboard shortcuts docs", "Some navigation hooks exist; no comprehensive shortcut palette."),
        ("Focus mode shell", "Pomodoro panel exists but no full-screen distraction-free deep work mode."),
    ]
    for name, desc in gaps:
        pdf.bullet(f"{name}: {desc}")

    # Section 4: Personalized Recommendations
    pdf.add_page()
    pdf.section_title("4. Personalized Recommendations for DayByDay")
    pdf.body(
        "These recommendations leverage your existing architecture. Each item notes why it fits "
        "DayByDay specifically, not just the category in general."
    )

    pdf.subsection("4.1 Quick Wins (Build on What Exists)")
    quick_wins = [
        (
            "P0",
            "Link Pomodoro sessions to task IDs with history",
            "You already store linkedTaskTitle as a string. Persist taskId, log completed focus minutes "
            "per task, and show stats on the home screen. Turns your Pomodoro from a timer into TickTick's "
            "most-loved feature with minimal new UI.",
        ),
        (
            "P0",
            "Habit streak view for habit-kind tasks",
            "TaskKind already includes 'habit' and lastCompletedAt exists. Add a streak counter, "
            "habit grid on home or toolkit, and daily reminder. No schema change needed.",
        ),
        (
            "P1",
            "Bulk task operations",
            "Shift+click or checkbox multi-select in TasksFrontPage and calendar views. "
            "Batch reschedule, delete, change block/category. Consistently #2 most-requested feature.",
        ),
        (
            "P1",
            "Saved smart filters",
            "You have categories, tags, blocks, priorities, and critical flag. Add named filter presets "
            "('Today + Work block + High priority') stored in settingsStore. High impact for power users.",
        ),
        (
            "P1",
            "Undo last task action",
            "Keep a rolling snapshot in tasksStore before mutations. One Cmd+Z to recover deleted/rescheduled "
            "tasks. Low complexity, disproportionate user trust gain.",
        ),
    ]
    for p, feat, rationale in quick_wins:
        pdf.priority_row(p, feat, rationale)

    pdf.add_page()
    pdf.subsection("4.2 Strategic Differentiators (Your Unique Angle)")
    differentiators = [
        (
            "P0",
            "'Plan My Block' unified daily view",
            "Combine active time block banner, today's tasks filtered to current block, calendar timeline, "
            "and Pomodoro start button in one screen. Your block system + calendar drag + Pomodoro is "
            "already 80% there - this is the product story competitors can't copy easily.",
        ),
        (
            "P0",
            "Spotify focus playlists tied to blocks",
            "When 'Deep Work' block starts, auto-play a linked Spotify playlist. When block ends, fade out. "
            "You have Spotify integration AND block configs - no competitor has this combination natively.",
        ),
        (
            "P1",
            "Full Focus Mode shell",
            "Extend GlobalPomodoroDock into a full-screen overlay: hide sidebar, show current task + timer + "
            "block context + optional website blocklist (Tauri can enforce). 'Focus OS Mode' from research.",
        ),
        (
            "P1",
            "Home Style theme marketplace",
            "Your theme registry (coreThemes, sectionStyles, custom themes) is unusually deep. Let users "
            "share/export theme JSON packs. Community themes become a growth loop and moat.",
        ),
        (
            "P2",
            "Class semester planner",
            "You already have class tasks, toolkit window, and grade/location metadata. Build a semester "
            "view: weekly class schedule, assignment due dates, exam countdown. Targets student persona "
            "that TickTick/Todoist serve poorly.",
        ),
        (
            "P2",
            "Weekly review ritual screen",
            "Guided flow: show overdue tasks, Pomodoro hours this week, habit streaks, block utilization, "
            "and prompt to reschedule/archive. Uses data you already collect.",
        ),
    ]
    for p, feat, rationale in differentiators:
        pdf.priority_row(p, feat, rationale)

    pdf.subsection("4.3 Foundation Work (Unlock Future Growth)")
    foundation = [
        (
            "P1",
            "Real Google Calendar OAuth + two-way sync",
            "Replace mock connectGoogle with Tauri OAuth flow. Push scheduled tasks as calendar events; "
            "pull events as ics-kind tasks. Required for users who won't adopt a calendar-less task app.",
        ),
        (
            "P1",
            "Natural language task capture",
            "Parse 'Finish report tomorrow 3pm #work !!' in TaskCreatorPopupForm. Use a lightweight "
            "date parser (chrono/luxon patterns) before considering LLM. Headline marketing feature.",
        ),
        (
            "P2",
            "Subtasks with parent roll-up",
            "Add parentId to Task type. Show nested checklist in task popup. Enables project breakdown "
            "and AI task decomposition later.",
        ),
        (
            "P2",
            "Cloud sync layer",
            "Abstract Zustand persist behind a sync adapter. Start with optional Supabase/Firebase sync "
            "for tasks + settings. Prerequisite for mobile companion app.",
        ),
        (
            "P3",
            "AI daily planner",
            "Morning briefing: read today's blocks, calendar events, and open tasks; propose a schedule. "
            "Gate behind settings; use local LLM or API with explicit opt-in. Fits 'Plan My Block' vision.",
        ),
        (
            "P3",
            "Import from Todoist/TickTick",
            "CSV/JSON import mappers. Reduces switching cost for users evaluating DayByDay.",
        ),
    ]
    for p, feat, rationale in foundation:
        pdf.priority_row(p, feat, rationale)

    # Section 5: Recommended Roadmap
    pdf.add_page()
    pdf.section_title("5. Suggested 6-Month Roadmap")

    phases = [
        (
            "Phase 1: Polish the Core (Weeks 1-6)",
            [
                "Pomodoro-to-task session history and per-task focus stats",
                "Habit streak UI for existing habit-kind tasks",
                "Undo for task delete/reschedule",
                "Bulk select + batch operations in task list",
                "Saved smart filters (categories + tags + blocks + priority)",
            ],
        ),
        (
            "Phase 2: The DayByDay Story (Weeks 7-12)",
            [
                "'Plan My Block' unified daily planning view",
                "Spotify playlist auto-start per time block",
                "Full-screen Focus Mode shell with distraction blocking",
                "Weekly review ritual screen with stats",
                "Real Google Calendar OAuth (read-first, then write-back)",
            ],
        ),
        (
            "Phase 3: Growth Features (Weeks 13-24)",
            [
                "Natural language task input",
                "Subtasks with parent progress roll-up",
                "Theme export/import and community theme sharing",
                "Class semester planner view",
                "Cloud sync foundation + import from Todoist/TickTick",
                "AI daily planner (opt-in beta)",
            ],
        ),
    ]
    for phase_title, items in phases:
        pdf.subsection(phase_title)
        for item in items:
            pdf.bullet(item)

    # Section 6: Competitive Positioning
    pdf.section_title("6. Competitive Positioning Summary")
    pdf.body(
        "DayByDay sits at the intersection of TickTick (all-in-one productivity), Things 3 "
        "(premium personal UX), and Tiimo (visual daily rhythm). Your strongest positioning:"
    )
    for item in [
        "NOT another plain to-do list - a daily rhythm app with time blocks, focus, and music",
        "Desktop-native performance and customization depth that web apps can't match",
        "Student/class workflow as a underserved niche within the productivity category",
        "Visual identity as a feature - themes, sounds, and home layout as personalization moat",
    ]:
        pdf.bullet(item)

    pdf.body("Avoid competing head-on with:")
    for item in [
        "Asana/ClickUp on team project management (different buyer, different complexity)",
        "Todoist on integration count (80+ integrations took 15+ years)",
        "Notion on docs/wiki (stay focused on daily execution)",
    ]:
        pdf.bullet(item)

    # Section 7: Personas DayByDay Should Target
    pdf.add_page()
    pdf.section_title("7. Target Personas for DayByDay")

    personas = [
        (
            "The Block Planner",
            "Structures their day in morning/afternoon/evening chunks. Wants: active block awareness, "
            "tasks filtered to current block, calendar time-blocking, Pomodoro. DayByDay's core persona.",
        ),
        (
            "The Focus-First Student",
            "Uses: TickTick or Notion. Wants: class schedule, assignment tracking, Pomodoro, minimal clutter. "
            "DayByDay's class kind + toolkit + blocks serve this directly.",
        ),
        (
            "The Aesthetic Productivity User",
            "Uses: Things 3 or custom Notion dashboards. Wants: beautiful home screen, themes, sounds, "
            "personalization. DayByDay's HomeStyleEditor and theme registry are built for this.",
        ),
        (
            "The Music-Focused Worker",
            "Pairs Spotify with Pomodoro/Forest. Wants: focus playlists tied to work sessions. "
            "DayByDay's Spotify integration is a unique hook no major task app offers natively.",
        ),
        (
            "The Desktop Power User",
            "Uses: Super Productivity or self-hosted tools. Wants: keyboard shortcuts, local data, "
            "native performance, no subscription. Tauri desktop app + local-first storage fits.",
        ),
    ]
    for name, desc in personas:
        pdf.subsection(name)
        pdf.body(desc)

    # Sources
    pdf.section_title("8. Sources & Methodology")
    sources = [
        "DayByDay codebase audit (src/stores, src/screens, src/components, src/types) - May 2026",
        "The Business Research Company - Task Management Software Market Report 2026",
        "Precedence Research - AI Task Manager App Market Size 2025-2035",
        "Super Productivity GitHub Issues (community feature requests)",
        "Todoist vs TickTick vs Things 3 comparisons (Rivva, ToolChief, ClickUp, Efficient App, 2025-2026)",
        "BigIdeasDB - What Apps Do People Wish Existed 2026 (Reddit dataset analysis)",
        "Asana - AI Agents Built for Teams: Shared Context and Transparency (2026)",
    ]
    for src in sources:
        pdf.bullet(src)

    pdf.ln(4)
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(100, 100, 100)
    pdf.multi_cell(
        0,
        5,
        "Disclaimer: Feature priorities should be validated with your user base through surveys, "
        "beta feedback, and usage analytics. Market figures represent commonly reported ranges "
        "and vary by research firm scope.",
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(output_path))


if __name__ == "__main__":
    out = (
        Path(__file__).resolve().parent.parent
        / "docs"
        / "DayByDay-Feature-Recommendations.pdf"
    )
    build_pdf(out)
    print(f"Generated: {out}")
