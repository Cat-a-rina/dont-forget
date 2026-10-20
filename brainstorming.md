# Don't Forget…! — Brainstorming

A dynamic hub for the tasks, items, and events you'd normally forget but still need to do. It adapts to the time of day, stays easy to scan even when overwhelming, and builds on the mental model of notes, calendar, and to-do tools. No unnecessary text or buttons, and the user is always in control.

This doc adds the steps, states, and errors the original brainstorm didn't cover, and clarifies the main visit and return visit.

## Steps (flows)

1. **First visit:** onboarding comes first, before the user touches the tool. No account and no permissions are required, and every step can be skipped ("Skip" on each step, "Skip setup" at the top).
   - **Setup:** the app title and a one-line description sit above step 1. (1) *Name*: used for a greeting on the hub. (2) *Import a to-do list*: pick a source (Apple Reminders, Google Tasks, Todoist) and its tasks are auto-filed into lists. The sources are simulated in this prototype and import made-up tasks. (3) *Time zone*: "Use my location" reads only the device's time zone, or pick one by hand, so the app knows when it's day (5am-5pm), evening (5-10pm), or night (10pm-5am) and can order lists to match. Name and time zone can be changed later in Settings.
   - **List editor:** opens in a notes style. Each list has a faint "Enter category name" and its own "+ Add" item box. "+ New list" adds more lists, so things can be categorized immediately, and a trash can deletes a list. Pasting many lines into an item box splits them into items. Placeholder suggestions ("e.g. Keys, wallet, phone before leaving") only appear on the line the user is typing in; other lines just say "Add an item".
   - **Two buttons at the bottom:** **Sort it!** keeps titled lists as they are and auto-categorizes the items in untitled lists, then shows a **review screen** to rename, merge, or move items before confirming. **Create Manually** keeps the lists exactly as written (an untitled list becomes "Unsorted") and goes straight to the hub. Short descriptions of both sit at the top of the editor.
   - Auto-sort treats a line that ends in ":" or names a known category as a heading. Items it can't place go to "Unsorted" instead of being guessed.
2. **Ordering mode picker** (Settings, with a gentle prompt after first use): Time-of-day / Date-priority / Manual (drag). Manual is the "off" state.
3. **Item creation:** type a title, then optionally set category, repeat behavior, date/time, and context tags (leaving, arriving, night out, weekend). Defaults come from the category.
4. **Repeat behavior**, chosen per item or category:
   - *Resets* (leaving the house): checked off, then reappears on its next trigger (next day, or next time you come and go).
   - *One-and-done* (RSVP): swipe moves it to History.
   - *Chain* (RSVP, then buy gift): on completion, offer "Add next step". The new step replaces the old one, and the timeline is stored.
5. **Complete:** swipe to dismiss, with a short undo toast (about 5s) instead of a confirm dialog.
6. **Context lists** ("Night out", "Leaving house"): a one-tap "activate" pins the list to the top. It auto-expires at a set time or on manual dismissal.
7. **Tabs:** swipe or tap between categories, plus a collapse control to hide sections. Home always opens on the full hub.
8. **History & Stats** (hamburger): completed log, chain timelines, pie chart by category, and a restore action.
9. **Return visit:** reload saved state, run the daily reset for repeating items, and show overdue and today items first.
10. **Settings:** ordering mode, time windows for rotation, color-and-icon legend, clear history, export/import data.

## Main visit

Every open lands on the **hub**, never on a tab, so the user always sees the whole picture first.

1. Load saved items and settings, then run the daily reset (see Return visit).
2. Order the hub by the active mode:
   - *Time-of-day:* context lists rotate by clock and weekday. Evening puts "Charging devices" first and "Leaving the house" last, mornings reverse it, and weekends swap in weekend lists. An activated context like "Night out" pins above everything.
   - *Date-priority:* overdue, then due today, then upcoming. Undated items follow.
   - *Manual:* the user's own order, with drag handles shown only in this mode.
3. Show a tab strip for categories, plus a collapse control per section to hide clutter. Tapping a tab focuses one group, and "Hub" returns to everything.
4. Actions: swipe an item to complete it (undo toast), tap "+" to add, open the hamburger for History & Stats and Settings.
5. Auto-reordering never moves items under the user's finger. Changes apply on open or on a time-window boundary, with a brief animation and a "lock order" option.

## Return visit

Example: open the app, check a tab, add an event, come back two days later, and it's all still there.

1. **Persistence:** items, categories, settings, collapsed/hidden state, last mode, and completion log are saved locally on every change.
2. **Daily reset on open** (compares today's date to `lastOpenedDate`, and runs once even after days away):
   - *Resetting items* (leaving the house): marked done today, they uncheck on the next day. For items used several times a day, an "again" trigger (new context activation or a time-window boundary) unchecks them without waiting for tomorrow.
   - *One-and-done items:* stay in History and don't return.
   - *Chain items:* if the current step was completed, the "Add next step" prompt reappears until answered or dismissed. The step timeline is saved.
   - *Dated items:* items past their date move to Overdue, and anything stale for N days gets a soft "still need this?" prompt.
3. **Completed today** items show dimmed or struck through until swiped away, so the user remembers what they already did, and then they drop to History.
4. A return after a long gap opens straight to the hub, with no welcome-back screen.

## States

- **Empty:** no items ever (first-visit screen), empty category (faint "add item" row), no completed tasks (stats show a gentle placeholder instead of a blank chart).
- **Item:** active, due soon, overdue, completed-today (resets later), completed-final (in History), snoozed, archived, chain step N of M.
- **List:** expanded, collapsed, hidden, pinned (context active), reordering (drag handles visible only in Manual mode).
- **Mode:** Time-of-day, Date-priority, Manual. Show a small, quiet indicator of the current mode. Animate automatic shifts briefly, and allow "lock order for now".
- **Time context:** morning, evening, weekend, and user-activated context (night out), with editable time windows.
- **Saving:** instant local save with a subtle "saved" marker. No spinner, since the data is local.
- **Accessibility:** color plus shape/icon plus label for every type and urgency (never color alone), and a circle ring for date/time emphasis. Also high-contrast, large-text, reduced-motion (disable rotation animation), and a non-swipe alternative (a check button or long-press menu).
- **Stats:** all-time, this week, and today, with a per-category filter.

## Errors and edge cases

- **Data loss:** storage full or unavailable (private browsing) shows a one-line notice and offers export. Corrupt saved data falls back to the last good backup.
- **Accidental swipe:** undo toast, plus "restore" in History. No instant permanent delete (use a trash with auto-purge).
- **Auto-categorization:** low confidence leaves an item in "Unsorted" instead of guessing. A cap on new categories prevents every item getting its own. Mis-sorts are fixable by drag or long-press move.
- **Time:** timezone or daylight-saving change, device clock changed, or app not opened for days (catch-up reset runs once, with no pile of duplicate reminders). Overdue items older than N days get a soft "still need this?" prompt.
- **Chain tasks:** completing the last step ends the chain, deleting a middle step reflows the timeline, and an abandoned chain can be closed manually.
- **Input:** blank or duplicate titles (warn gently, allow anyway), a date in the past (confirm "already passed?"), very long titles (truncate, expand on tap), and hundreds of items (virtualize the list, collapse by default).
- **Conflicting settings:** a dated item in a time-of-day list (rule: dated and overdue items outrank time-of-day items), or two active contexts at once (stack in activation order).
- **Gesture conflicts:** horizontal tab swipe vs swipe-to-complete. Restrict tab swipe to the tab bar or edge.
- **Notifications (if added later):** permission denied falls back to in-app only.

## First-visit research

Three comparable tools were reviewed for their first screen, what they ask for, and how soon the user gets something useful. None of the reviewers could see the screens, so Calendar and Reminders details are partly inferred from docs and reviews, and Todoist's flow comes from partial, dated sources.

| | Apple Reminders | Google Calendar | Todoist |
|---|---|---|---|
| First screen | Lists view with smart-list tiles and a "+ New Reminder" button | The calendar grid with a "+" or "Create" button | Sign-up, then onboarding questions |
| Asks up front | Nothing mandatory | Only a Google Account | Email, password, use case, experience level, profile, notifications |
| First useful moment | 2 taps plus typing | About 3 steps on web | About 8+ screens, then a pre-filled task list |
| Does automatically | Smart lists fill by date and flag | Gmail adds events from confirmation emails | Seeds a sample project from onboarding answers |
| Weak for a first-timer | Smart lists mistaken for folders, shown empty | No guidance or sample content | Account and notification asks come before any value |

What we took from it:
1. No account and no setup before the first save.
2. Offer the two paths (Sort it! and Create Manually) at the capture step. None of the three has "dump everything and sort it".
3. Rotating example prompts in the dump box teach the input style without an extra screen.
4. Show the first auto-sort as labeled, editable groups, and never show empty category tiles.
5. Defer notifications (out of v1 anyway).
6. Every main screen keeps a clear "+ Add" button, as all three tools do.

## Decisions and assumptions

- Next.js (App Router, TypeScript), local-first storage for v1.
- No accounts or cross-device sync in v1.
- No reminders or notifications in v1.
