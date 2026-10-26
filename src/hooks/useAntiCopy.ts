import { useEffect } from "react";

export function useAntiCopy(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const block = (e: Event) => e.preventDefault();
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("paste", block);
    return () => {
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("paste", block);
    };
  }, [enabled]);
}
