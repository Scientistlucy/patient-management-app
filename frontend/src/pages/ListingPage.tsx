import { useEffect, useMemo, useRef, useState } from "react";
import { ApiError, api } from "../api/client";
import { downloadPatientCsv, downloadPatientPdf } from "../utils/reports";

type Row = {
  patient_id: number;
  unique: string;
  name: string;
  gender: string;
  age: number;
  bmi: string | null;
  status: string;
  visit_date: string | null;
  height: number | null;
  weight: number | null;
};

type Stats = {
  total: number;
  underweight: number;
  normal: number;
  overweight: number;
  no_vitals: number;
  average_bmi: number | null;
};

const emptyStats: Stats = {
  total: 0,
  underweight: 0,
  normal: 0,
  overweight: 0,
  no_vitals: 0,
  average_bmi: null,
};

function isPlausibleBmi(bmi: number) {
  return Number.isFinite(bmi) && bmi >= 10 && bmi <= 80;
}

/** Hide legacy SEED prefix until Railway finishes replacing those rows. */
function displayPatientId(unique: string) {
  const match = unique.match(/^SEED0*(\d+)$/i);
  if (!match) return unique;
  return String(1000 + Number(match[1]));
}

export function ListingPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [visitDate, setVisitDate] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [gender, setGender] = useState("all");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const downloadRef = useRef<HTMLDivElement>(null);

  async function load(date?: string) {
    setLoading(true);
    setError("");
    try {
      let data = await api.listVisits(date);
      // Backfill / rename demo census when the list is small or still has SEED* ids.
      if (
        data.rows.length < 20 ||
        data.rows.some((row) => row.unique.toUpperCase().startsWith("SEED"))
      ) {
        try {
          await api.seedDemoPatients();
          data = await api.listVisits(date);
        } catch {
          // Older API builds may not expose seed-demo yet; listing still works.
        }
      }
      setRows(
        data.rows.map((row) => ({
          ...row,
          unique: displayPatientId(row.unique),
        })),
      );
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load listing");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!downloadOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (!downloadRef.current?.contains(e.target as Node)) {
        setDownloadOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDownloadOpen(false);
    }
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [downloadOpen]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const min = ageMin === "" ? null : Number(ageMin);
    const max = ageMax === "" ? null : Number(ageMax);

    return rows.filter((row) => {
      if (status !== "all" && row.status !== status) return false;
      if (gender !== "all" && row.gender !== gender) return false;
      if (min != null && Number.isFinite(min) && row.age < min) return false;
      if (max != null && Number.isFinite(max) && row.age > max) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.unique.toLowerCase().includes(q) ||
        displayPatientId(row.unique).toLowerCase().includes(q)
      );
    });
  }, [rows, search, status, gender, ageMin, ageMax]);

  const scopedRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const min = ageMin === "" ? null : Number(ageMin);
    const max = ageMax === "" ? null : Number(ageMax);

    return rows.filter((row) => {
      if (gender !== "all" && row.gender !== gender) return false;
      if (min != null && Number.isFinite(min) && row.age < min) return false;
      if (max != null && Number.isFinite(max) && row.age > max) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.unique.toLowerCase().includes(q) ||
        displayPatientId(row.unique).toLowerCase().includes(q)
      );
    });
  }, [rows, search, gender, ageMin, ageMax]);

  const tabCounts = useMemo(
    () => ({
      all: scopedRows.length,
      normal: scopedRows.filter((r) => r.status === "Normal").length,
      overweight: scopedRows.filter((r) => r.status === "Overweight").length,
      underweight: scopedRows.filter((r) => r.status === "Underweight").length,
      noVitals: scopedRows.filter((r) => r.status === "No vitals").length,
    }),
    [scopedRows],
  );

  const filteredStats = useMemo(() => {
    const withBmi = filtered.filter(
      (r) => r.bmi != null && isPlausibleBmi(Number(r.bmi)),
    );
    return {
      total: filtered.length,
      underweight: filtered.filter((r) => r.status === "Underweight").length,
      normal: filtered.filter((r) => r.status === "Normal").length,
      overweight: filtered.filter((r) => r.status === "Overweight").length,
      no_vitals: filtered.filter((r) => r.status === "No vitals").length,
      average_bmi:
        withBmi.length === 0
          ? null
          : Number(
              (
                withBmi.reduce((sum, r) => sum + Number(r.bmi), 0) / withBmi.length
              ).toFixed(1),
            ),
      female: filtered.filter((r) => r.gender === "Female").length,
      male: filtered.filter((r) => r.gender === "Male").length,
      otherGender: filtered.filter((r) => r.gender === "Other").length,
    };
  }, [filtered]);

  const baseGender = useMemo(
    () => ({
      female: rows.filter((r) => r.gender === "Female").length,
      male: rows.filter((r) => r.gender === "Male").length,
      otherGender: rows.filter((r) => r.gender === "Other").length,
    }),
    [rows],
  );

  const activeClientFilters =
    Boolean(search.trim()) ||
    status !== "all" ||
    gender !== "all" ||
    Boolean(ageMin) ||
    Boolean(ageMax);

  const displayStats = !activeClientFilters
    ? {
        ...stats,
        ...baseGender,
      }
    : filteredStats;

  const overview = useMemo(() => {
    const withBmi = scopedRows.filter(
      (r) => r.bmi != null && isPlausibleBmi(Number(r.bmi)),
    );
    return {
      total: scopedRows.length,
      female: scopedRows.filter((r) => r.gender === "Female").length,
      male: scopedRows.filter((r) => r.gender === "Male").length,
      otherGender: scopedRows.filter((r) => r.gender === "Other").length,
      normal: tabCounts.normal,
      overweight: tabCounts.overweight,
      underweight: tabCounts.underweight,
      noVitals: tabCounts.noVitals,
      average_bmi:
        withBmi.length === 0
          ? null
          : Number(
              (
                withBmi.reduce((sum, r) => sum + Number(r.bmi), 0) / withBmi.length
              ).toFixed(1),
            ),
    };
  }, [scopedRows, tabCounts]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, filtered.length);
  const pagedRows = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize],
  );

  useEffect(() => {
    setPage(1);
  }, [search, status, gender, ageMin, ageMax, visitDate, pageSize]);

  function clearFilters() {
    setVisitDate("");
    setSearch("");
    setStatus("all");
    setGender("all");
    setAgeMin("");
    setAgeMax("");
    setPage(1);
    void load();
  }

  function exportCsv() {
    downloadPatientCsv({
      rows: filtered,
      stats: displayStats,
      visitDate,
    });
    setDownloadOpen(false);
  }

  function exportPdf() {
    downloadPatientPdf({
      rows: filtered,
      stats: displayStats,
      visitDate,
    });
    setDownloadOpen(false);
  }

  return (
    <main className="page page-wide">
      <section className="listing-shell">
        <header className="listing-hero">
          <div>
            <p className="panel-kicker">Census</p>
            <h1 className="panel-title">Patient listing</h1>
            <p className="panel-copy listing-copy">
              Review patients, BMI status, and visits in one place.
            </p>
          </div>

          <div className="download-menu" ref={downloadRef}>
            <button
              className="btn btn-primary download-trigger"
              type="button"
              disabled={loading || filtered.length === 0}
              aria-expanded={downloadOpen}
              aria-haspopup="menu"
              onClick={() => setDownloadOpen((open) => !open)}
            >
              Download report
              <span className="download-caret" aria-hidden="true">
                ▾
              </span>
            </button>
            {downloadOpen ? (
              <div className="download-dropdown" role="menu">
                <button type="button" role="menuitem" onClick={exportCsv}>
                  <span className="download-format">CSV</span>
                  <span className="download-desc">Spreadsheet-ready export</span>
                </button>
                <button type="button" role="menuitem" onClick={exportPdf}>
                  <span className="download-format">PDF</span>
                  <span className="download-desc">Printable census report</span>
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <aside className="kpi-row" aria-label="Listing statistics">
          <button
            type="button"
            className={`kpi-card kpi-total ${status === "all" ? "is-active" : ""}`}
            onClick={() => setStatus("all")}
          >
            <div className="kpi-top">
              <span className="kpi-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path
                    fill="currentColor"
                    d="M16 11c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3zM8 11c1.7 0 3-1.3 3-3S9.7 5 8 5 5 6.3 5 8s1.3 3 3 3zm0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5C15 14.2 10.3 13 8 13zm8 0c-.3 0-.6 0-.9.1 1.2.8 2 2 2 3.4V19h6v-2.5c0-2.3-4.7-3.5-7.1-3.5z"
                  />
                </svg>
              </span>
              <div className="kpi-copy">
                <span className="kpi-label">Total patients</span>
                <strong className="kpi-value">{overview.total}</strong>
              </div>
            </div>
            <div className="kpi-bottom">
              <span className="kpi-note">
                <span className="gender-chip gender-female">{overview.female} Female</span>
                <span className="gender-chip gender-male">{overview.male} Male</span>
              </span>
            </div>
          </button>

          <button
            type="button"
            className={`kpi-card kpi-normal ${status === "Normal" ? "is-active" : ""}`}
            onClick={() => setStatus("Normal")}
          >
            <div className="kpi-top">
              <span className="kpi-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path
                    fill="currentColor"
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                  />
                </svg>
              </span>
              <div className="kpi-copy">
                <span className="kpi-label">Normal</span>
                <strong className="kpi-value">{overview.normal}</strong>
              </div>
            </div>
            <div className="kpi-bottom">
              <span className="kpi-note positive">Healthy BMI range</span>
            </div>
          </button>

          <button
            type="button"
            className={`kpi-card kpi-overweight ${status === "Overweight" ? "is-active" : ""}`}
            onClick={() => setStatus("Overweight")}
          >
            <div className="kpi-top">
              <span className="kpi-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path
                    fill="currentColor"
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-4H8l4-5 4 5h-3v4z"
                  />
                </svg>
              </span>
              <div className="kpi-copy">
                <span className="kpi-label">Overweight</span>
                <strong className="kpi-value">{overview.overweight}</strong>
              </div>
            </div>
            <div className="kpi-bottom">
              <span className="kpi-note high">BMI of 25 or higher</span>
            </div>
          </button>

          <button
            type="button"
            className={`kpi-card kpi-underweight ${status === "Underweight" ? "is-active" : ""}`}
            onClick={() => setStatus("Underweight")}
          >
            <div className="kpi-top">
              <span className="kpi-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path
                    fill="currentColor"
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 10h3l-4 5-4-5h3V8h2v4z"
                  />
                </svg>
              </span>
              <div className="kpi-copy">
                <span className="kpi-label">Underweight</span>
                <strong className="kpi-value">{overview.underweight}</strong>
              </div>
            </div>
            <div className="kpi-bottom">
              <span className="kpi-note low">BMI less than 18.5</span>
            </div>
          </button>
        </aside>

        <div className="listing-toolbar">
          <div className="toolbar-main">
            <input
              className="toolbar-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or Patient Id..."
              aria-label="Search name or Patient Id"
            />
            <select
              className="toolbar-select"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              aria-label="Gender"
            >
              <option value="all">All genders</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
            <input
              className="toolbar-date"
              type="date"
              value={visitDate}
              onChange={(e) => {
                const next = e.target.value;
                setVisitDate(next);
                void load(next || undefined);
              }}
              aria-label="Visit date"
            />
          </div>
          <div className="toolbar-side">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setShowMoreFilters((v) => !v)}
            >
              {showMoreFilters ? "Hide filters" : "More filters"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={clearFilters}>
              Clear
            </button>
          </div>
        </div>

        {showMoreFilters ? (
          <div className="toolbar-extra">
            <label className="toolbar-field">
              <span>Min age</span>
              <input
                type="number"
                min="0"
                value={ageMin}
                onChange={(e) => setAgeMin(e.target.value)}
              />
            </label>
            <label className="toolbar-field">
              <span>Max age</span>
              <input
                type="number"
                min="0"
                value={ageMax}
                onChange={(e) => setAgeMax(e.target.value)}
              />
            </label>
          </div>
        ) : null}

        {error ? <div className="alert alert-error">{error}</div> : null}

        <div className="table-panel">
          <div className="table-meta">
            <span>
              {filtered.length === 0
                ? "Showing 0 patients"
                : (
                  <>
                    Showing <strong>{pageStart}–{pageEnd}</strong> of{" "}
                    <strong>{filtered.length}</strong>
                    {filtered.length !== rows.length ? ` (filtered from ${rows.length})` : ""} patients
                  </>
                )}
            </span>
            <label className="page-size-control">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                aria-label="Rows per page"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
          </div>
          <div className="table-wrap listing-table">
            <table className="data">
              <thead>
                <tr>
                  <th>Patient Id</th>
                  <th>Name</th>
                  <th>Gender</th>
                  <th>Age</th>
                  <th>Visit</th>
                  <th>BMI</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="empty">
                      Loading…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty">
                      No patients match these filters.
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((row) => (
                    <tr key={`${row.patient_id}-${row.visit_date ?? "none"}`}>
                      <td className="mono">{row.unique}</td>
                      <td className="name-cell">
                        {row.name
                          .split(" ")
                          .filter(Boolean)
                          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
                          .join(" ")}
                      </td>
                      <td>{row.gender}</td>
                      <td>{row.age}</td>
                      <td className="mono">{row.visit_date ?? "—"}</td>
                      <td className="mono">
                        {row.bmi != null && Number(row.bmi) <= 80 && Number(row.bmi) >= 10
                          ? row.bmi
                          : row.bmi != null
                            ? "Invalid"
                            : "—"}
                      </td>
                      <td>
                        <span className={`status-pill status-${row.status.replace(/\s+/g, "-")}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination-bar">
            <button
              type="button"
              className="btn btn-ghost"
              disabled={loading || currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="pagination-status">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={loading || currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
