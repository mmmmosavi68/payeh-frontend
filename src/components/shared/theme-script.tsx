
const script = `
(function () {
  try {
    var root = document.documentElement;

    var theme = localStorage.getItem("theme");
    var dark =
      theme === "dark" ||
      (theme !== "light" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    var palette = localStorage.getItem("palette");
    palette = palette === "indigo" ? "indigo" : "neutral";

    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
    root.dataset.palette = palette;
  } catch (e) {}
})();
`;

export function ThemeScript({ nonce }: { nonce?: string }) {
  return (
    <script
      id="theme-initializer"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
