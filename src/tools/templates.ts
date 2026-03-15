/**
 * Rich Template Blueprints for Seed Agent
 * Used to guide the LLM in generating premium-quality web applications.
 */

export const APP_TEMPLATES = {
  DASHBOARD: {
    name: "Premium Dashboard",
    description: "Multi-panel dashboard with sidebar navigation and real-time feel.",
    structure: [
      "Layout: Fixed sidebar (hidden on mobile), floating header with profile/notifications.",
      "Stats Cards: 3-4 cards at the top with 'bg-white/10 backdrop-blur-md', gradient icons, and % change indicators.",
      "Charts Section: Using a simulated SVG chart (since we don't install Recharts by default, we use pure SVG), showcasing data trends.",
      "Data Grid: Sleek table with row hover effects, status badges (Success/Pending/Failed), and pagination controls.",
      "Design: Slate-900 background, glassmorphism containers, 'Inter' font, violet/cyan primary accents."
    ],
    components: {
      sidebar: "Nav links: Overview, Analytics, Reports, Settings. Uses Heroicons-style SVGs.",
      stats: "TVL, 24h Volume, Total Users, Active Nodes.",
      activity: "Recent Activity Feed with timestamped events."
    }
  },
  CHAT: {
    name: "Modern Chat Application",
    description: "Sleek messaging interface inspired by Telegram/Discord.",
    structure: [
      "Layout: Left sidebar for conversation list, main chat area, right sidebar for details.",
      "Message Bubbles: Distinct styles for 'me' vs 'others', sender avatars, read receipts.",
      "Input Bar: Integrated emoji picker, file attachment, and a satisfying 'Send' button animation.",
      "Transitions: Smooth sliding transitions when switching conversations."
    ],
    components: {
      convoList: "Searchable list of active chats with last message preview.",
      messageArea: "Scrolling area with grouped messages by date.",
      input: "Expanding textarea for long messages."
    }
  },
  TASK_MANAGER: {
    name: "Collaborative Task Board",
    description: "Kanban-style task management with drag-and-drop feel.",
    structure: [
      "Columns: Todo, In Progress, Review, Done.",
      "Cards: Priority levels (Low/Medium/High/Critical) with color-coded borders.",
      "Filtering: Quickly filter by assignee, due date, or priority.",
      "Modals: Sleek animated modals for adding/editing tasks."
    ],
    components: {
      kanbanColumn: "Scrollable column with task count and 'add' button.",
      taskCard: "Compact view with title, assignee avatar, and priority badge.",
      progressBar: "Visual indicator of project completion."
    }
  }
};

/**
 * Returns a string representation of the template blueprints for the system prompt
 */
export function getTemplateGuidelines(): string {
  return JSON.stringify(APP_TEMPLATES, null, 2);
}
