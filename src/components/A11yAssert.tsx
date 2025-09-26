import { useEffect } from "react";
export default function A11yAssert(){
  useEffect(() => {
    const unlabeled = Array.from(document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])'))
      .filter(el => (el as HTMLElement).innerText.trim() === "");
    if (unlabeled.length && import.meta.env.DEV) {
      console.warn("[A11y] Unlabeled buttons:", unlabeled);
    }
  }, []);
  return null;
}