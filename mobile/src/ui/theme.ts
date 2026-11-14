// The app's few colours: the same greys as the web app's Tailwind neutral palette, and the brand's
// blue of the icon and the splash screen for what is selected and the main action of a screen.
export const colors = {
  brand: "#0369a1",
  brandSoft: "#e0f2fe",
  ink: "#0a0a0a",
  text: "#171717",
  muted: "#525252",
  faint: "#737373",
  line: "#d4d4d4",
  border: "#a3a3a3",
  fill: "#f5f5f5",
  placeholder: "#e5e5e5",
  link: "#0369a1",
  paper: "#ffffff",
  // A saved place's heart.
  heart: "#e11d48",
} as const;

/** The smallest a thing to press may be (44 pt). */
export const TOUCH = 44;
