"use client";

import { useEffect } from "react";

export function MotionController() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    const hero = document.querySelector<HTMLElement>(".hero");
    const revealItems = document.querySelectorAll<HTMLElement>("[data-reveal]");
    root.classList.add("motion-enabled");

    function moveHero(event: PointerEvent) {
      if (!hero || event.pointerType === "touch") return;
      const bounds = hero.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      hero.style.setProperty("--motion-x", `${x * 16}px`);
      hero.style.setProperty("--motion-y", `${y * 12}px`);
      hero.style.setProperty("--image-x", `${x * -8}px`);
      hero.style.setProperty("--image-y", `${y * -6}px`);
    }

    function resetHero() {
      hero?.style.setProperty("--motion-x", "0px");
      hero?.style.setProperty("--motion-y", "0px");
      hero?.style.setProperty("--image-x", "0px");
      hero?.style.setProperty("--image-y", "0px");
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    revealItems.forEach((item) => observer.observe(item));
    hero?.addEventListener("pointermove", moveHero);
    hero?.addEventListener("pointerleave", resetHero);

    return () => {
      root.classList.remove("motion-enabled");
      observer.disconnect();
      hero?.removeEventListener("pointermove", moveHero);
      hero?.removeEventListener("pointerleave", resetHero);
    };
  }, []);

  return null;
}
