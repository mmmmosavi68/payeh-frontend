import Script from "next/script";

const script = `
(function () {
  try {
    var t = localStorage.getItem("theme");
    var d =
      t === "dark" ||
      (t !== "light" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    var r = document.documentElement;
    r.classList.toggle("dark", d);
    r.style.colorScheme = d ? "dark" : "light";
  } catch (e) {}
})();
`;

export function ThemeScript({ nonce }: { nonce?: string }) {
  return (
    <Script
      id="theme-initializer"
      strategy="beforeInteractive"
      nonce={nonce}
    >
      {script}
    </Script>
  );
}
