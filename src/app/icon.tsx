import { ImageResponse } from "next/og";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#25235E", // Professional navy from your theme
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "20%",
        }}
      >
        {/* Invoice Document Icon */}
        <div
          style={{
            width: "20px",
            height: "24px",
            background: "white",
            borderRadius: "2px",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            padding: "2px",
          }}
        >
          {/* Document header */}
          <div
            style={{
              width: "100%",
              height: "3px",
              background: "#25235E",
              borderRadius: "1px",
              marginBottom: "1px",
            }}
          />
          <div
            style={{
              width: "80%",
              height: "2px",
              background: "#25235E",
              borderRadius: "1px",
              marginBottom: "2px",
            }}
          />

          {/* Document lines */}
          <div
            style={{
              width: "90%",
              height: "1px",
              background: "#25235E",
              borderRadius: "0.5px",
              marginBottom: "1px",
            }}
          />
          <div
            style={{
              width: "85%",
              height: "1px",
              background: "#25235E",
              borderRadius: "0.5px",
              marginBottom: "1px",
            }}
          />
          <div
            style={{
              width: "75%",
              height: "1px",
              background: "#25235E",
              borderRadius: "0.5px",
            }}
          />

          {/* Dollar sign badge */}
          <div
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              width: "8px",
              height: "8px",
              background: "#10B981",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "5px",
              color: "white",
              fontWeight: "bold",
            }}
          >
            $
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
