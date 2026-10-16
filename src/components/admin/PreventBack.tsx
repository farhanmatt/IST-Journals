"use client";

import { useEffect } from "react";

export function PreventBack() {
  useEffect(() => {
    // Push an initial state into the history
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      // Whenever the user clicks the browser's Back button,
      // push the state forward again to trap them in the current view
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return null;
}
