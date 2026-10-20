/** Pretend import sources. No real accounts are connected; each returns made-up tasks. */
export const IMPORT_SOURCES: { id: string; label: string; tasks: string[] }[] = [
  {
    id: "reminders",
    label: "Apple Reminders",
    tasks: ["Call the dentist", "Pick up dry cleaning", "Buy cat litter", "Renew passport", "Text Maya about brunch"],
  },
  {
    id: "tasks",
    label: "Google Tasks",
    tasks: ["Submit internship application", "Email professor about the exam", "Pay car insurance", "Book flights for Thanksgiving"],
  },
  {
    id: "todoist",
    label: "Todoist",
    tasks: ["Review PR from Sam", "Water the plants", "Mom's birthday gift", "Refill prescription", "Clean out the fridge"],
  },
];
