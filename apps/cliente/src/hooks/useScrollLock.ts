import { useEffect } from "react";

export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const el = document.body;
    const prev = el.style.overscrollBehavior;
    el.style.overscrollBehavior = "contain";
    return () => {
      el.style.overscrollBehavior = prev;
    };
  }, [locked]);
}
