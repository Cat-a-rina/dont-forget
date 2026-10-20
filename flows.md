# Don't Forget…! — Flows

Diagrams for the app's main flows. Source of truth for behavior is [brainstorming.md](brainstorming.md).

## 1. First visit

```mermaid
flowchart TD
    A([Open app, no saved data]) --> B{Choose a start, no account needed}
    B -->|Build my own| C[Notes-style page, faint suggested title, + Add button]
    B -->|Dump everything| D[One big text box with rotating example prompts]
    C --> E[Add items and categories by hand]
    D --> F[Auto-categorize]
    F --> G{Confidence high?}
    G -->|Yes| H[Review screen: rename, merge, split, move]
    G -->|No| I[Low-confidence items go to Unsorted]
    I --> H
    H --> J[Confirm]
    E --> K[Hub]
    J --> K
```

## 2. Main visit

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

## 3. Return visit and daily reset

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

## 4. Item lifecycle

```mermaid
stateDiagram-v2
    [*] --> Active
    Active --> DueSoon: date approaches
    DueSoon --> Overdue: date passes
    Active --> Snoozed: snooze
    Snoozed --> Active: snooze ends
    Active --> CompletedToday: complete, resetting item
    DueSoon --> CompletedToday: complete, resetting item
    CompletedToday --> Active: daily reset or again trigger
    Active --> CompletedFinal: complete, one-and-done
    DueSoon --> CompletedFinal: complete, one-and-done
    Overdue --> CompletedFinal: complete
    Active --> ChainStep: complete, add next step
    ChainStep --> Active: next step replaces previous
    ChainStep --> CompletedFinal: last step done
    CompletedFinal --> Active: restore from History
    Active --> Archived: archive
    Archived --> Active: restore
    CompletedFinal --> [*]: purged from trash
```

## 5. Errors and edge cases

```mermaid
flowchart TD
    A([Problem occurs]) --> B{Type}
    B -->|Storage full or unavailable| C[One-line notice]
    C --> D[Offer export]
    B -->|Corrupt saved data| E[Fall back to last good backup]
    B -->|Accidental swipe| F[Undo toast, then restore in History]
    B -->|Low-confidence sort| G[Place in Unsorted]
    G --> H[User drags or long-press moves it]
    B -->|Clock or timezone changed| I[Recompute dates, run reset once]
    B -->|Past date entered| J[Confirm: already passed?]
    B -->|Duplicate or blank title| K[Warn gently, allow anyway]
    B -->|Two contexts active| L[Stack in activation order]
    B -->|Tab swipe vs item swipe| M[Tab swipe only on tab bar or edge]
```
