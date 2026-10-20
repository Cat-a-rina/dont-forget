# Don't Forget…!

A dynamic hub for the tasks, items, and events you'd normally forget but still need to do. It adapts to the time of day, stays easy to scan, and keeps the user in control: time-of-day ordering, date-priority ordering, or fully manual.

- [brainstorming.md](brainstorming.md): steps, states, errors, and the main/return visit details
- [flows.md](flows.md): all diagrams, including the item lifecycle and error paths

## Flows

### First visit

```mermaid
flowchart TD
    A([Open app, no saved data]) --> B[Title and short description]
    B --> C[Setup, every step skippable: name]
    C --> D[Import a to-do list, simulated sources]
    D --> E[Time zone: day, evening, or night]
    E --> F[List editor: category name plus items, add more lists, or paste many lines]
    F --> G{Bottom buttons}
    G -->|Create Manually| H[Lists kept as written, untitled list becomes Unsorted]
    G -->|Sort it!| I[Titled lists kept, untitled items auto-categorized]
    I --> J[Review screen: rename, merge, move]
    J -->|Unsure items| K[Placed in Unsorted]
    J --> L[Looks good]
    H --> M[Hub]
    L --> M
```

### Main visit

```mermaid
flowchart TD
    A([Open app]) --> B[Load items and settings]
    B --> C[Run daily reset]
    C --> D{Ordering mode}
    D -->|Time-of-day| E[Rotate context lists by clock and weekday]
    D -->|Date-priority| F[Overdue, then today, then upcoming]
    D -->|Manual| G[User order, drag handles on]
    E --> H[Hub]
    F --> H
    G --> H
    H --> I[Pinned context, e.g. Night out, goes on top]
    I --> J{User action}
    J -->|Tap or swipe tab| K[Focus one category]
    K -->|Tap Hub| H
    J -->|Swipe item| L[Complete, show undo toast]
    J -->|Tap plus| M[Add item]
    J -->|Hamburger| N[History and Stats or Settings]
    J -->|Collapse section| O[Hide section]
    L --> P{Repeat behavior}
    P -->|Resets| Q[Dimmed as done today]
    P -->|One-and-done| R[Move to History]
    P -->|Chain| S[Offer next step]
```

### Return visit and daily reset

```mermaid
flowchart TD
    A([Open app]) --> B[Read lastOpenedDate]
    B --> C{Same day?}
    C -->|Yes| H[Hub as left]
    C -->|No| D[Run reset once, even after many days away]
    D --> E{Item type}
    E -->|Resetting| F[Uncheck for today]
    E -->|One-and-done| G[Stay in History]
    E -->|Chain, step completed| I[Show Add next step prompt again]
    E -->|Dated, past due| J[Move to Overdue]
    J --> K{Stale for N days?}
    K -->|Yes| L[Soft prompt: still need this?]
    K -->|No| M[Keep in Overdue]
    F --> N[Save lastOpenedDate]
    G --> N
    I --> N
    L --> N
    M --> N
    N --> H
```

These are copies of the diagrams in [flows.md](flows.md), since GitHub can't include one Markdown file in another. Update both together.

## Status

First iteration. Working: first visit (skippable setup for name, import, and time zone, then a list editor with Sort it! or Create Manually and a review screen), hub with tabs and collapsible lists, "+ Add", swipe or tap to complete with undo, chain "Next step", daily reset on return, History & Stats with a pie chart, and the three ordering modes in Settings. Importing is simulated (made-up tasks, no real accounts). Not yet: dragging individual items (only lists reorder, in "My own order" mode), weekend lists, notifications, sync.

To replay the first visit, open the menu, then Settings, then "Erase everything".

## Getting started

Built with Next.js (App Router, TypeScript). Data is stored locally in the browser for v1.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
