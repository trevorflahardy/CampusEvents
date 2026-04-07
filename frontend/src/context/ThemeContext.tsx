import { createContext, useContext, useState, useEffect, useCallback } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggle: (e?: React.MouseEvent) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggle: () => {},
});

/**
 * Generate a blob-shaped polygon clip-path string.
 * Uses layered sine waves at different frequencies to create an organic,
 * paint-splatter-like silhouette around (cx, cy) at a given base radius.
 */
function blobPolygon(
  cx: number,
  cy: number,
  baseRadius: number,
  numPoints: number,
  seed: number,
): string {
  const pts: string[] = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    // Gentle low-frequency waves for smooth, rounded blob edges
    const wobble =
      1 +
      0.10 * Math.sin(angle * 2 + seed) +
      0.07 * Math.sin(angle * 3 + seed * 1.7) +
      0.04 * Math.cos(angle * 4 + seed * 0.6);
    const r = baseRadius * wobble;
    pts.push(`${cx + r * Math.cos(angle)}px ${cy + r * Math.sin(angle)}px`);
  }
  return `polygon(${pts.join(", ")})`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme") as Theme | null;
      if (stored) return stored;
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggle = useCallback((e?: React.MouseEvent) => {
    // If View Transition API is not supported, fall back to instant swap
    if (!document.startViewTransition || !e) {
      setTheme((prev) => (prev === "light" ? "dark" : "light"));
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    // Blob must be large enough to cover the farthest corner (+ extra for wobble)
    const maxRadius =
      Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      ) * 1.35;

    // Random seed so each toggle produces a unique blob shape
    const seed = Math.random() * Math.PI * 2;
    const points = 36; // dense vertices for smooth, rounded blob edges

    const transition = document.startViewTransition(() => {
      setTheme((prev) => (prev === "light" ? "dark" : "light"));
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            blobPolygon(x, y, 0, points, seed),
            blobPolygon(x, y, maxRadius, points, seed),
          ],
        },
        {
          duration: 800,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
