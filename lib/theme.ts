export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "color-shift-theme";

export function readTheme(): Theme {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content", theme === "light" ? "#ffffff" : "#0a0a0a",
  );
}

export function setTheme(theme: Theme) {
  applyTheme(theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The current session still works when storage is blocked.
  }
}

export const THEME_BOOTSTRAP = `(()=>{let t="dark";try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="light")t="light"}catch{}const r=document.documentElement;r.dataset.theme=t;r.classList.toggle("dark",t==="dark");r.style.colorScheme=t;document.querySelector('meta[name="theme-color"]')?.setAttribute("content",t==="light"?"#ffffff":"#0a0a0a")})()`;
