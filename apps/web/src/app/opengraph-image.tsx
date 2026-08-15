import { ImageResponse } from "next/og";

/**
 * The card that appears when somebody shares a link to Calma.
 *
 * DRAWN RATHER THAN SHIPPED AS A PNG, for the same reason the orb is inline
 * SVG: it is a warm ground, a circle and two lines of type, and a checked-in
 * binary is a thing that silently stops matching the palette the first time
 * the palette moves.
 *
 * NO SCREENSHOT AND NO TAGLINE ABOUT ANXIETY. A social card is the one piece
 * of this product that appears in somebody else's timeline, unasked. It says
 * the name and what the app is, warmly and without a claim — a preview
 * announcing that a friend has an anxiety app is the opposite of "your
 * thoughts stay on your phone".
 *
 * System sans rather than Figtree: `ImageResponse` needs font bytes passed to
 * it, and fetching a font at render time would be the one third-party request
 * this site does not make. The card is a rectangle with a name on it, and the
 * family is the part of the design it can afford to lose.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Calma — a quieter place to put it down";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 40,
          padding: 96,
          backgroundColor: "#FBF7F1",
        }}
      >
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: 999,
            // `ImageResponse` supports CSS gradients but not SVG gradient
            // defs, so the orb's three stops are expressed as a radial with
            // the highlight offset up and left, as everywhere else.
            backgroundImage:
              "radial-gradient(circle at 45% 38%, #F8DFB2 0%, #EFB86E 62%, #E39A45 100%)",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 76, color: "#2A3642", letterSpacing: -1 }}>
            A quieter place to put it down.
          </div>
          <div style={{ fontSize: 34, color: "#5F6C78" }}>
            Calma · breathe, write, let go
          </div>
        </div>
      </div>
    ),
    size,
  );
}
