export default function NotFound() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "3rem", margin: 0 }}>404</h1>
          <p style={{ opacity: 0.7 }}>Page not found</p>
        </div>
      </body>
    </html>
  );
}