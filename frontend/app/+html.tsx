import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es" style={{ height: "100%", width: "100%" }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, maximum-scale=5, viewport-fit=cover" />
        <meta name="theme-color" content="#1A2B4A" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; }
              body > div:first-child { position: fixed !important; top: 0; left: 0; right: 0; bottom: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; }
              [role="tablist"] [role="tab"] * { overflow: visible !important; }
              [role="heading"], [role="heading"] * { overflow: visible !important; }
              @media (min-width: 768px) {
                body { background: #1A2B4A; display: flex; align-items: center; justify-content: center; }
                body > div:first-child { max-width: 480px; margin: 0 auto; box-shadow: 0 0 40px rgba(0,0,0,0.2); }
              }
              @media (min-width: 1024px) {
                body > div:first-child { max-width: 800px; border-radius: 16px; }
              }
            `,
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
