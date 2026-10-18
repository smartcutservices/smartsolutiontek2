"use client";

import { useState } from "react";

export function ShareDemoButton({ title, description }: { title: string; description: string }) {
  const [message, setMessage] = useState("");

  async function shareDemo() {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text: description, url });
        setMessage("Lien partagé.");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setMessage("Lien copié.");
    } catch {
      setMessage("Partage indisponible. Copiez l’adresse depuis la barre du navigateur.");
    }
  }

  return (
    <div className="share-action">
      <button type="button" className="share-button" onClick={shareDemo}>Partager cette démo</button>
      <span role="status" aria-live="polite">{message}</span>
    </div>
  );
}
