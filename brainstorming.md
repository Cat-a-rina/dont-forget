# Don't Forget…! — Brainstorming

A dynamic hub for the tasks, items, and events you'd normally forget but still need to do. It adapts to the time of day, stays easy to scan even when overwhelming, and builds on the mental model of notes, calendar, and to-do tools. No unnecessary text or buttons, and the user is always in control.

This doc adds the steps, states, and errors the original brainstorm didn't cover, and clarifies the main visit and return visit.

## Steps (flows)

1. **First visit:** the whole onboarding is one screen, before the user touches the tool. No account and no permissions are required, and every step can be skipped. The steps sit side by side (stacked on a phone), and only the step the user is on is bright. The others fade until it is their turn, and finished steps stay faded with a check mark. A "Skip to my lists" link jumps to the last step.
   - **1. Name:** used for a greeting on the hub.
   - **2. Import a to-do list:** pick a source (Apple Reminders, Google Tasks, Todoist) and a **Preview** shows how its tasks will be filed. The user can rename groups, drag items between groups or within a group, or go **Back**, and nothing is added until they confirm. The sources are simulated in this prototype and import made-up tasks.
   - **3. Where are you?:** "Use my location" reads only the device's time zone, or pick one by hand, so the app knows when it's day (5am-5pm), evening (5-10pm), or night (10pm-5am) and can order lists to match.
   - **4. Start your lists:** a notes-style editor. The two routes are described side by side at the top. Each list has a faint "Category name (Optional)" and an "Add an item" row that rests on a ruled line even when the list is empty, so it reads as a list from the start. A trash can deletes a list, and pasting many lines into an item box splits them into items. Placeholder suggestions ("e.g. Keys, wallet, phone before leaving") only appear on the line the user is typing in. "+ New list" comes first, followed by suggested lists (Groceries, Kids, Work, and so on) that are one tap away.
   - **Sort it!** keeps titled lists as they are and auto-categorizes the items in untitled lists, then shows a full-screen **Preview** (titled so, since it is not the tool yet) to rename groups, merge them, or drag items between and within groups before confirming. **Create Manually** keeps the lists exactly as written (an untitled list becomes "Unsorted") and goes straight to the hub. Short descriptions of both sit at the top of the step.
   - Auto-sort treats a line that ends in ":" or names a known category as a heading. Items it can't place go to "Unsorted" instead of being guessed.
   - **Keyboard:** Enter continues on every step, and the cursor moves to the new step automatically. Name and time zone can be changed later in Settings, and **Settings > Set up again** reopens steps 1 to 3.
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

## Moving items and keyboard use

- **Drag and drop:** the same gesture reorders an item within its list and moves it between lists, on the Preview screens and on the hub. Drop on another item to land before it, on a list to land at the end, or on a list's tab. In "By date" mode the order inside a list follows the due date, so only the list changes.
- **Keyboard on the Preview screens:** Tab to an item's handle (⋮⋮). Up/Down moves between items. Enter picks the item up; then Up/Down reorders it, Left/Right moves it to the previous or next group, and Enter drops it. While an item is picked up, Tab to "new group" or one of your lists and press Enter to drop it there. Escape cancels.
- **Keyboard on the hub:** focus an item's handle, then Up/Down reorders it and Shift+Up/Down moves it to the previous or next list. In "My own order" mode, Alt+Up/Down on a list header moves the whole list. Escape closes the add sheet and the menu.
- **Keyboard in onboarding:** Enter continues on every step (name, import, time zone, Preview). In the list editor, Enter in the category name jumps to the item box, Enter adds an item, and Enter on an empty item box jumps to "Sort it!".
- **Not built yet:** drag on touch screens (the browser's built-in drag doesn't run on touch).

## Going back in onboarding

- Setup steps 2 and 3 each have a **Back** button, and the list editor has a "Back to setup" link, so an accidental skip is easy to undo. Imports already added are kept and are not duplicated if repeated.
- After onboarding, **Settings > Set up again** reopens setup with the saved name and time zone filled in. Finishing or skipping returns to the hub.

## Adding from the hub

- The **+ Add** button sits at the top of the hub and opens a small menu with three choices:
  - **Add new items and auto-categorize:** type or paste items, see a **Preview** of how they will be filed (rename groups, drag items), then add them. Groups named like an existing list are added to it. The bottom of the Preview shows **your existing lists** as drop targets, so an item can be dragged onto one to add it there.
  - **Add new list:** name a list (or tap a suggestion) and add its first items right there, then create it.
  - **Add items to list:** the single-item form. The list is chosen by tapping one of the existing lists (or "+ New list"), then repeat and date.
- **Suggested lists** (Leaving the house, Groceries, Kids, Work, Family, Health, Home, Errands, Pets, School) appear as one-tap chips in the first-visit list editor and in "Add new list". A suggestion disappears once a list with that name exists.
- The list tabs wrap onto extra rows instead of being cut off at the edge of the screen.
- **Type straight into a list:** every list on the hub ends with an "Add an item" box. Type and press Enter to add to that list, with no Add button needed.

## Completed items and progress on the hub

- A **Completed** tab sits at the end of the tab strip. Checked-off items land there, grouped by day, and one-time items can be restored. (Repeating items such as "Leaving the house" stay in place, crossed out, and also appear here.)
- A compact **progress card** with the pie chart (Today or Week) sits at the top of the hub on a phone, and beside the lists on a wide screen. It links to the Completed tab. The full chart stays in the menu under History & Your Stats.

## Screen size

The hub fits a phone first. On wider screens the lists flow into columns and the progress card moves to a side column. Onboarding screens stay narrow on purpose.

## Celebration and theme

- **List cleared:** when the last open item in a list is checked off, a short burst of confetti falls, the toast says "<List> is all done!" (with Undo), and the list keeps an "All done ✓" badge, a full progress bar, and a "Nice work!" row until the next day's reset. Clearing every list shows a bigger burst and an "Everything is done for now" card on the hub.
- **Progress bars:** each list header shows a thin bar for how much of today's work in that list is done.
- **After onboarding:** the first time the hub opens, a "You're all set" card with confetti appears until dismissed with "Got it".
- **Reduced motion:** confetti and pop animations are turned off for people who prefer reduced motion. The text and badges still show.
- **Look:** a warm orange accent (focus rings, step dots, logo mark, welcome card) on top of the per-list colors, tinted list headers.

## Renaming in place

- Double-click a list's title to rename it, or double-click an item to edit it. Enter saves, Escape cancels, and clicking away saves. With the keyboard, press F2 on a list header or an item's handle.
- A blank name, or a list name already in use, is ignored and the old name stays. Renaming a list also updates its name in the Completed tab and History.
- Single-clicking a list header still collapses it, after a brief pause so a double-click can rename instead.

## Customizable look

The look is a printed paper to-do list: dark brown text and thin ruled lines on white, circle checkboxes, and each list's name as a plain title with its icon and badges on one row. Little drawings (a flower, a smiley, a mushroom, a pumpkin, a leaf, a sparkle, a heart, a bean character) form a border along the bottom of the main page, with a small one on the side edge of each list sheet (never over its items). The onboarding screen keeps its row of drawings across the top. They are simple icons made for this app, they are decoration only, and some are hidden on a phone to keep it clean.

- **One theme:** Paper. The other color themes were removed, and there is no theme choice in onboarding.
- **Fonts** (Settings): Storybook (Fraunces and Lora, the default, also used in onboarding), Rounded (Fredoka and Nunito), Typewriter (Special Elite and Courier Prime), and Clean (Geist). The handwritten font was removed.
- **Layouts** (Settings): Sheet (paper to-do pages with ruled lines, default), Cards, Notebook, and Scrapbook.
- **Keyboard:** each group of choices is a radio group. Tab lands on the chosen option, and the arrow keys move the choice.
- **Ideas not built yet:** a "Notes" patch with a stitched border for free text, seasonal icon sets, and choosing which icon goes on which list.

## How lists are ordered (and how it is shown)

- After onboarding, a floating card points at the menu button (☰) with "You're all set". It explains that lists can be ordered **By time of day**, **By date**, or **My own order**, lets the user pick one right there, and says it can be changed any time under Settings. It stays until "Got it" is pressed.
- The ordering is also always visible and one click away: the pill under the title (for example "By time of day · Daytime") opens the same three choices.

## Urgency

- **Dates found in the text:** when an item is added by typing, sorting, or importing and has no date picked, the app looks for one in the words, like "due Friday", "tomorrow", "on Monday", "Oct 19", or "10/19". The wording is kept as written, and the date shows as a chip the user can change.
- **Chips:** every dated item shows a ringed chip with a color, a label, and an "!" for overdue ("! Overdue · Thu, Oct 1", "Today", "Tomorrow", or the date).
- **Rows:** overdue and due-today items get a tinted row, a colored edge, and bolder text.
- **Lists:** a list header shows a "! 2" badge when it holds overdue or due-today items.
- **Top of the hub:** a summary ("! 1 overdue · 2 due today") sits next to the greeting.
- **By date** mode sorts lists by their soonest due item.

## Editing an item

- Each item has a pencil button. It opens an **Edit item** sheet to change the title, move the item to another list (tap a list), switch Once or Every day, set or clear the date, or delete it. Double-click (or F2) still edits just the title in place.
- In the Preview screens, double-click (or F2) edits an item's title too.

## Clearing a finished list

- When a list is fully done, its "All done. Nice work!" row has a subtle **Clear from board** link. It takes the list off the hub (and its tab) without losing anything: its items and completed history are kept.
- A toast says "<List> cleared from your board" with **Undo**.
- **Settings > Cleared lists** shows every cleared list with a **Bring back** button. Adding an item to a list with the same name, or creating a list with that name, also brings it back.
- A list with repeating items (like "Leaving the house") is hidden, not erased, so its routine returns when it is brought back.

## Forms: errors, saved drafts, and accessibility

**Errors sit next to the field and say what to do next.** Buttons are never silently greyed out. Pressing one with a problem shows a short message under the field, marks the field as invalid (`aria-invalid`, linked with `aria-describedby`), and moves the keyboard to it. Examples: "Give this item a name, like "Call the dentist"." / ""Family" is already a list. Choose a different name, or press Escape to keep "Groceries"." / "Add at least one item first: type it in the box above and press Enter." This covers the add and edit sheet, the new list sheet, add and sort, the quick "Add an item" rows, renaming a list or item, and onboarding (including the import preview). When the browser can't save, a warning appears next to the title and inside the add sheets, and the banner at the top offers Export.

**What was typed is kept.** Typing in any sheet or in onboarding is saved in the browser as it happens. Escape, a click outside the sheet, or a refresh never loses it, and reopening shows "We kept what you typed last time. Discard it". Only the **Cancel** button throws a draft away, and a successful add or finish clears it. A bad rename keeps the text in the box. Onboarding remembers the step, the name, the time zone, and every list and half-typed item ("Welcome back... Start over").

**Keyboard access.**
- Every control can be reached and used from the keyboard. There is a "Skip to your lists" link at the top of the hub. Anything done by dragging or swiping has a keyboard or button alternative (check button, pencil, F2, arrow keys on the handles).
- Dialogs and the menu drawer move focus inside when they open, keep Tab and Shift+Tab inside, close with Escape, and return focus to the button that opened them. They are marked as modal dialogs.
- Everything that takes typing shows a clear outline when it has focus.

**Real labels.** Every field has a real `<label>` connected to it, visible where there is room (Item, List name, Your name, Date, Items to add) and visually hidden where the design uses a placeholder (quick-add rows, category names, group names, rename boxes). Groups of choices are labelled radio groups. The page has headings in order, and the Preview screens have a level-one heading.

**Text contrast, checked.** Text and icon colors were measured against the white sheets and the cream page and darkened where they fell short (muted text, the brand color, and six of the eight list colors now reach at least 4.5 to 1). Placeholders, completed items, counts, and the "Clear from board" link no longer use faded opacity. The only intentionally faded text is the inactive steps in onboarding, which are not interactive.

**How it was checked.** An automated accessibility scan (axe-core, WCAG 2 A and AA plus best practices) was run on 11 screens and states with zero violations: onboarding steps and Preview, the hub with and without the welcome card, the edit sheet, the add menu, the ordering popover, the Completed tab, and Settings. Scripted keyboard tests confirmed the error messages, saved drafts, focus trapping, focus return, and that every focusable control on the hub shows a focus indicator. A scan can't judge everything, so a pass with a real screen reader is still worth doing.

## Layout and motion details

- **Lists fill the page top to bottom.** On the hub, lists flow down one column and then the next, so a short list (like a finished one) never leaves a gap under it. Reading order matches keyboard order. The Notebook layout stays a single column.
- **Checking off is slower and calmer.** The row slides away over about half a second and then the gap closes (about 0.7 seconds in all), and the check mark pops in. With reduced motion turned on in the device, the pop is skipped and the changes are instant.

