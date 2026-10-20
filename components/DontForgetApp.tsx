"use client";

import { useEffect, useState } from "react";
import { useAppState } from "@/lib/useAppState";
import { dailyReset } from "@/lib/actions";
import { todayStr } from "@/lib/dates";
import { exportData } from "@/lib/storage";
import FirstVisit from "./FirstVisit";
import Hub from "./Hub";
import Setup from "./Setup";

export default function DontForgetApp() {
  const { state, recovered, failed, update } = useAppState();
  const [dismissed, setDismissed] = useState(false);
  const onboarded = state?.onboarded ?? false;
  const lastOpened = state?.lastOpened;

  // Return visit: when the app opens on a new day, repeating items start fresh. Runs once per day.
  useEffect(() => {
    if (onboarded && lastOpened !== todayStr()) update((s) => dailyReset(s, todayStr()));
  }, [onboarded, lastOpened, update]);

  if (!state) return <div className="screen" aria-busy="true" />;

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportData()], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "dont-forget.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {failed && (
        <div className="notice" role="alert">
          <span>Can&rsquo;t save in this browser. Your list will be lost when you close this tab.</span>
          <button className="link" onClick={download}>
            Export
          </button>
        </div>
      )}
      {recovered && !dismissed && (
        <div className="notice" role="status">
          <span>{recovered === "backup" ? "Saved data was unreadable. Restored your last backup." : "Saved data was unreadable. Starting fresh."}</span>
          <button className="link" onClick={() => setDismissed(true)}>
            OK
          </button>
        </div>
      )}
      {!state.profile.setupDone ? (
        <Setup state={state} update={update} />
      ) : !state.onboarded ? (
        <FirstVisit state={state} update={update} />
      ) : (
        <Hub state={state} update={update} />
      )}
    </>
  );
}
