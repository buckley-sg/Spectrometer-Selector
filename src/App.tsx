/**
 * App — main Spectrometer Selector application.
 *
 * Wires together the search form, selector logic, result cards,
 * and comparison table.
 */
import { useState, useMemo, useCallback } from "react";
import { resolutionRecords, gratingOverrides } from "./data";
import { search, recordId, type EnrichedResult } from "./logic/selector";
import { BRAND } from "./brand";
import SearchForm from "./components/SearchForm";
import ResultCard from "./components/ResultCard";
import CompareTable from "./components/CompareTable";

export default function App() {
  // Search inputs (kept as strings so the user can type freely)
  const [wlMin, setWlMin] = useState("");
  const [wlMax, setWlMax] = useState("");
  const [maxRes, setMaxRes] = useState("");

  // Near-miss panel toggle
  const [showNearMisses, setShowNearMisses] = useState(true);

  // Comparison map: record uid → EnrichedResult
  const [compareMap, setCompareMap] = useState<
    Record<string, EnrichedResult>
  >({});

  const compareIds = useMemo(
    () => new Set(Object.keys(compareMap)),
    [compareMap],
  );
  const compareItems = useMemo(
    () => Object.values(compareMap),
    [compareMap],
  );

  const toggleCompare = useCallback(
    (id: string, result: EnrichedResult) => {
      setCompareMap((prev) => {
        const next = { ...prev };
        if (next[id]) {
          delete next[id];
        } else {
          next[id] = result;
        }
        return next;
      });
    },
    [],
  );

  // Run the search whenever inputs change
  const searchResult = useMemo(() => {
    const mn = Number(wlMin);
    const mx = Number(wlMax);
    const mr = Number(maxRes);
    if (isNaN(mn) || isNaN(mx) || isNaN(mr) || mn >= mx || mr <= 0) {
      return null;
    }
    return search(mn, mx, mr, resolutionRecords, gratingOverrides);
  }, [wlMin, wlMax, maxRes]);

  const bandwidth = Number(wlMax) - Number(wlMin);
  const maxResNum = Number(maxRes);

  return (
    <div
      style={{
        fontFamily: "'DM Sans', -apple-system, sans-serif",
        maxWidth: 900,
        margin: "0 auto",
        padding: "20px 16px",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 4,
          }}
        >
          <div
            style={{
              width: 8,
              height: 32,
              borderRadius: 4,
              background: `linear-gradient(180deg, ${BRAND.green}, ${BRAND.teal})`,
            }}
          />
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: BRAND.navy,
              letterSpacing: -0.5,
            }}
          >
            Spectrometer Selector
          </h1>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: "#64748b",
            marginLeft: 18,
          }}
        >
          Evolve Sensing — find the right optical bench, grating, and slit for
          your application
        </p>
      </div>

      {/* Search form */}
      <SearchForm
        wlMin={wlMin}
        wlMax={wlMax}
        maxRes={maxRes}
        onWlMinChange={setWlMin}
        onWlMaxChange={setWlMax}
        onMaxResChange={setMaxRes}
      />

      {/* Comparison table (shown when items are checked) */}
      {compareItems.length > 0 && (
        <CompareTable
          items={compareItems}
          maxRes={maxResNum}
          onClear={() => setCompareMap({})}
        />
      )}

      {/* Results */}
      {searchResult && (
        <div>
          {/* Exact matches */}
          {searchResult.matches.length > 0 ? (
            <>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: BRAND.navy,
                  marginBottom: 10,
                }}
              >
                {searchResult.matches.length} match
                {searchResult.matches.length !== 1 ? "es" : ""}{" "}
                <span style={{ fontWeight: 400, color: "#64748b" }}>
                  sorted by throughput
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {searchResult.matches.map((r, i) => {
                  const id = recordId(r);
                  return (
                    <ResultCard
                      key={id}
                      result={r}
                      maxRes={maxResNum}
                      rank={i + 1}
                      isNearMiss={false}
                      isCompared={compareIds.has(id)}
                      onToggleCompare={() => toggleCompare(id, r)}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            /* No exact matches banner */
            <div
              style={{
                background: "#fef3c7",
                border: "1px solid #fcd34d",
                borderRadius: 10,
                padding: "14px 18px",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  color: "#92400e",
                  fontSize: 14,
                  marginBottom: 4,
                }}
              >
                No exact matches
              </div>
              <div style={{ fontSize: 13, color: "#a16207" }}>
                {bandwidth} nm bandwidth + ≤{maxRes} nm resolution exceeds what
                any single grating can achieve.
                {searchResult.nearMisses.length > 0 &&
                  " See nearest options below."}
              </div>
            </div>
          )}

          {/* Near misses */}
          {searchResult.nearMisses.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <button
                onClick={() => setShowNearMisses(!showNearMisses)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#64748b",
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    transform: showNearMisses
                      ? "rotate(90deg)"
                      : "rotate(0)",
                    transition: ".2s",
                    display: "inline-block",
                  }}
                >
                  ▶
                </span>
                {searchResult.nearMisses.length} near miss
                {searchResult.nearMisses.length !== 1 ? "es" : ""}
                <span style={{ fontWeight: 400 }}>
                  — coverage OK, resolution short
                </span>
              </button>
              {showNearMisses && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {searchResult.nearMisses.slice(0, 8).map((r) => {
                    const id = recordId(r);
                    return (
                      <ResultCard
                        key={id}
                        result={r}
                        maxRes={maxResNum}
                        rank={null}
                        isNearMiss={true}
                        isCompared={compareIds.has(id)}
                        onToggleCompare={() => toggleCompare(id, r)}
                      />
                    );
                  })}
                  {searchResult.nearMisses.length > 8 && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "#94a3b8",
                        textAlign: "center",
                        padding: 8,
                      }}
                    >
                      +{searchResult.nearMisses.length - 8} more
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!searchResult && wlMin === "" && (
        <div
          style={{
            textAlign: "center",
            padding: "36px 20px",
            color: "#94a3b8",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔬</div>
          <div style={{ fontSize: 14 }}>
            Enter wavelength range and resolution to search
          </div>
          <div
            style={{
              fontSize: 12,
              marginTop: 8,
              maxWidth: 420,
              margin: "8px auto 0",
            }}
          >
            Finds all Evolve configurations fully covering your wavelength
            range. Recommends the largest slit meeting your resolution spec for
            maximum throughput. Check boxes to compare side-by-side.
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: 28,
          padding: "10px 0",
          borderTop: "1px solid #e2e8f0",
          fontSize: 10,
          color: "#94a3b8",
          textAlign: "center",
        }}
      >
        Evolve Sensing — Proprietary and Confidential — Resolution data:
        simulation values for reference only
      </div>
    </div>
  );
}
