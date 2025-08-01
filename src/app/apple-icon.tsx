import { ImageResponse } from "next/og";

// Image metadata
export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

// Image generation
export default function AppleTouchIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #25235E 0%, #3B3B98 100%)", // Professional gradient
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "22%", // iOS rounded corners
        }}
      >
        {/* Invoice Document Icon - Larger for Apple Touch */}
        <div
          style={{
            width: "100px",
            height: "120px",
            background: "white",
            borderRadius: "8px",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            padding: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}
        >
          {/* Document header */}
          <div
            style={{
              width: "100%",
              height: "8px",
              background: "#25235E",
              borderRadius: "4px",
              marginBottom: "6px",
            }}
          />
          <div
            style={{
              width: "70%",
              height: "6px",
              background: "#6B7280",
              borderRadius: "3px",
              marginBottom: "12px",
            }}
          />

          {/* Document lines */}
          <div
            style={{
              width: "90%",
              height: "4px",
              background: "#6B7280",
              borderRadius: "2px",
              marginBottom: "6px",
            }}
          />
          <div
            style={{
              width: "85%",
              height: "4px",
              background: "#6B7280",
              borderRadius: "2px",
              marginBottom: "6px",
            }}
          />
          <div
            style={{
              width: "75%",
              height: "4px",
              background: "#6B7280",
              borderRadius: "2px",
              marginBottom: "12px",
            }}
          />

          {/* Total section */}
          <div
            style={{
              width: "80%",
              height: "6px",
              background: "#F59E0B",
              borderRadius: "3px",
              marginTop: "auto",
            }}
          />

          {/* Dollar sign badge */}
          <div
            style={{
              position: "absolute",
              top: "-8px",
              right: "-8px",
              width: "40px",
              height: "40px",
              background: "#10B981",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              color: "white",
              fontWeight: "bold",
              border: "3px solid white",
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
