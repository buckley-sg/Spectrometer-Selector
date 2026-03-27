/**
 * ResultCard — displays one search result (exact match or near miss).
 * Shows product name, grating info, bandwidth, range, recommended slit,
 * slit bar chart, and grating codes. Includes a "Compare" checkbox.
 */
import type { EnrichedResult } from "../logic/selector";
import { BRAND, PRODUCT_COLORS } from "../brand";
import SlitBar from "./SlitBar";

interface ResultCardProps {
  result: EnrichedResult;
  maxRes: number;
  rank: number | null;
  isNearMiss: boolean;
  isCompared: boolean;
  onToggleCompare: () => void;
}

export default function ResultCard({
  result: r,
  maxRes,
  rank,
  isNearMiss,
  isCompared,
  onToggleCompare,
}: ResultCardProps) {
  const name = r.evolveNames.join(" / ");
  const model = r.model ? ` (${r.model})` : "";
  const color = PRODUCT_COLORS[r.evolveNames[0]] ?? BRAND.teal;

  return (
    <div
      style={{
        background: "white",
        borderRadius: 10,
        padding: "14px 18px",
        border: isNearMiss ? "1px dashed #d1d5db" : "1px solid #e5e7eb",
        boxShadow: isNearMiss ? "none" : "0 1px 3px rgba(0,0,0,.06)",
        opacity: isNearMiss ? 0.85 : 1,
      }}
    >
      {/* Header row: rank/badge + product name + recommendation + compare */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: 1,
            minWidth: 200,
          }}
        >
          {!isNearMiss && (
            <span
              style={{
                background: BRAND.navy,
                color: "white",
                fontSize: 11,
                fontWeight: 700,
                width: 22,
                height: 22,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {rank}
            </span>
          )}
          {isNearMiss && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: 4,
                background: "#f59e0b",
                color: "white",
                letterSpacing: 0.5,
              }}
            >
              NEAR MISS
            </span>
          )}
          <span style={{ fontWeight: 700, fontSize: 15, color }}>
            {name}
          </span>
          <span style={{ fontSize: 12, color: "#6b7280" }}>{model}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              textAlign: "right",
              background: isNearMiss ? "#fef3c7" : "#ecfdf5",
              padding: "4px 10px",
              borderRadius: 6,
            }}
          >
            <div style={{ fontSize: 10, color: "#6b7280", lineHeight: 1 }}>
              {isNearMiss ? "Best achievable" : "Recommended"}
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: isNearMiss ? "#92400e" : "#065f46",
              }}
            >
              {r.recSlit} µm → {r.recRes} nm
            </div>
          </div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
              fontSize: 11,
              color: "#64748b",
              flexShrink: 0,
            }}
          >
            <input
              type="checkbox"
              checked={isCompared}
              onChange={onToggleCompare}
              style={{ accentColor: BRAND.green }}
            />
            Compare
          </label>
        </div>
      </div>

      {/* Info grid: grating, bandwidth, range */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 8,
          fontSize: 12,
          marginBottom: 8,
        }}
      >
        <div style={{ background: "#f8fafc", borderRadius: 6, padding: "6px 10px" }}>
          <div style={{ color: "#94a3b8", fontSize: 10, marginBottom: 2 }}>
            GRATING
          </div>
          <div style={{ fontWeight: 600 }}>{r.gratingGrooves} g/mm</div>
          <div style={{ color: "#64748b", fontSize: 11 }}>
            Blaze: {r.blazeWavelengths.join(", ")} nm
          </div>
        </div>
        <div style={{ background: "#f8fafc", borderRadius: 6, padding: "6px 10px" }}>
          <div style={{ color: "#94a3b8", fontSize: 10, marginBottom: 2 }}>
            BANDWIDTH
          </div>
          <div style={{ fontWeight: 600 }}>{r.bandwidthNm} nm</div>
        </div>
        <div style={{ background: "#f8fafc", borderRadius: 6, padding: "6px 10px" }}>
          <div style={{ color: "#94a3b8", fontSize: 10, marginBottom: 2 }}>
            RANGE
          </div>
          <div style={{ fontWeight: 600 }}>
            {r.selectableRange[0]}–{r.selectableRange[1]} nm
          </div>
        </div>
      </div>

      {/* Footer: slit bar + grating codes */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>
            SLIT OPTIONS (µm)
          </div>
          <SlitBar slits={r.allSlits} maxRes={maxRes} recSlit={r.recSlit} />
        </div>
        {r.codes.length > 0 && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4 }}>
              GRATING CODES
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 3,
                justifyContent: "flex-end",
              }}
            >
              {r.codes.slice(0, 5).map((code, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: "#eef2ff",
                    color: "#4338ca",
                  }}
                >
                  {code}
                </span>
              ))}
              {r.codes.length > 5 && (
                <span style={{ fontSize: 10, color: "#94a3b8" }}>
                  +{r.codes.length - 5}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
