import React, { useEffect, useMemo, useState } from "react";
import { plan, weekdayLabels, getWorkoutForDate } from "./data/plan.js";

const EMPTY_LOG = {
  weight: "",
  workouts: {},
  cardio: {
    completed: false,
    steps: "",
    notes: ""
  },
  notes: ""
};

function toISODate(date) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 10);
}

function formatDisplayDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function getApiBase() {
  if (import.meta.env.VITE_API_BASE) return import.meta.env.VITE_API_BASE;
  if (window.location.hostname === "localhost" && window.location.port === "5173") {
    return "http://localhost:3001";
  }
  const baseUrl = import.meta.env.BASE_URL || "/";
  const normalized = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return normalized === "/" ? "" : normalized;
}

async function apiFetch(path, options = {}) {
  const base = getApiBase();
  const res = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

function buildWorkoutTemplate(workoutKey) {
  if (!workoutKey) return {};
  const blocks = plan.workouts[workoutKey].blocks;
  const template = {};
  blocks.forEach((block) => {
    block.exercises.forEach((exercise) => {
      template[exercise.name] = Array.from({ length: exercise.sets }, (_, idx) => ({
        set: idx + 1,
        reps: "",
        weight: ""
      }));
    });
  });
  return template;
}

function mergeWorkoutLog(template, existing) {
  const merged = { ...template };
  Object.entries(existing || {}).forEach(([name, sets]) => {
    merged[name] = sets.map((set, idx) => ({
      set: idx + 1,
      reps: set.reps ?? "",
      weight: set.weight ?? ""
    }));
  });
  return merged;
}

function getMonthMatrix(baseDate) {
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
  const startDay = start.getDay();
  const daysInMonth = end.getDate();
  const weeks = [];
  let current = 1 - startDay;
  while (current <= daysInMonth) {
    const week = [];
    for (let i = 0; i < 7; i += 1) {
      const day = new Date(baseDate.getFullYear(), baseDate.getMonth(), current);
      week.push(day);
      current += 1;
    }
    weeks.push(week);
  }
  return weeks;
}

function WeightChart({ weights }) {
  const data = weights.filter((entry) => entry.weight !== null && entry.weight !== "");
  if (data.length === 0) {
    return (
      <div className="chart-empty">No weight entries yet. Log today to start the graph.</div>
    );
  }

  const values = data.map((entry) => Number(entry.weight));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = 10;
  const height = 180;
  const width = 480;
  const range = max - min || 1;

  const points = data.map((entry, idx) => {
    const x = (idx / (data.length - 1 || 1)) * (width - padding * 2) + padding;
    const y = height - padding - ((Number(entry.weight) - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${width} ${height}`} aria-label="Weight progress chart">
        <polyline points={points.join(" ")} fill="none" stroke="url(#lineGradient)" strokeWidth="3" />
        {points.map((point, idx) => {
          const [x, y] = point.split(",");
          return <circle key={point} cx={x} cy={y} r="4" fill="#72e4d1" />;
        })}
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#72e4d1" />
            <stop offset="100%" stopColor="#5b8cff" />
          </linearGradient>
        </defs>
      </svg>
      <div className="chart-meta">
        <span>Low: {min.toFixed(1)} lbs</span>
        <span>High: {max.toFixed(1)} lbs</span>
      </div>
    </div>
  );
}

export default function App() {
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [monthCursor, setMonthCursor] = useState(today);
  const [logs, setLogs] = useState({});
  const [logEntry, setLogEntry] = useState(EMPTY_LOG);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [weights, setWeights] = useState([]);

  const selectedISO = toISODate(selectedDate);
  const workoutInfo = getWorkoutForDate(selectedDate);

  useEffect(() => {
    apiFetch("/api/logs")
      .then((data) => {
        setLogs(data.logs || {});
      })
      .catch((err) => {
        console.error(err);
        setError("Unable to reach the server. Start the API server to load saved data.");
      });
  }, []);

  useEffect(() => {
    apiFetch("/api/weights")
      .then((data) => setWeights(data.weights || []))
      .catch(() => null);
  }, [logs]);

  useEffect(() => {
    apiFetch(`/api/logs/${selectedISO}`)
      .then((data) => {
        const workoutTemplate =
          workoutInfo.type === "lifting" ? buildWorkoutTemplate(workoutInfo.key) : {};
        const mergedWorkouts = mergeWorkoutLog(workoutTemplate, data.entry?.workouts || {});
        setLogEntry({
          ...EMPTY_LOG,
          ...data.entry,
          workouts: mergedWorkouts
        });
      })
      .catch(() => {
        const workoutTemplate =
          workoutInfo.type === "lifting" ? buildWorkoutTemplate(workoutInfo.key) : {};
        setLogEntry({
          ...EMPTY_LOG,
          workouts: workoutTemplate
        });
      });
  }, [selectedISO, workoutInfo.type, workoutInfo.key]);

  const calendar = getMonthMatrix(monthCursor);
  const monthLabel = monthCursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  function handleWorkoutChange(exerciseName, setIndex, field, value) {
    setLogEntry((prev) => {
      const nextSets = prev.workouts[exerciseName].map((set, idx) =>
        idx === setIndex ? { ...set, [field]: value } : set
      );
      return {
        ...prev,
        workouts: {
          ...prev.workouts,
          [exerciseName]: nextSets
        }
      };
    });
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...logEntry,
        date: selectedISO
      };
      await apiFetch(`/api/logs/${selectedISO}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      setLogs((prev) => ({ ...prev, [selectedISO]: payload }));
    } catch (err) {
      console.error(err);
      setError("Save failed. Check the server console.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">{plan.phase.name}</p>
          <h1>{plan.title}</h1>
          <p className="subtitle">{plan.phase.goal}</p>
          <div className="hero-meta">
            <span>{plan.schedule}</span>
            <span>{plan.equipment}</span>
            <span>{plan.diet}</span>
          </div>
        </div>
        <div className="hero-image">
          <div className="image-placeholder">
            Prompt: cinematic dark gym scene with warm edge lighting, focused dad tying sneakers, modern flat style
          </div>
        </div>
      </header>

      <main className="grid">
        <section className="panel calendar-panel">
          <div className="panel-header">
            <h2>Calendar</h2>
            <div className="month-controls">
              <button
                type="button"
                onClick={() =>
                  setMonthCursor(
                    new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1)
                  )
                }
              >
                ◀
              </button>
              <span>{monthLabel}</span>
              <button
                type="button"
                onClick={() =>
                  setMonthCursor(
                    new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1)
                  )
                }
              >
                ▶
              </button>
            </div>
          </div>
          <div className="calendar">
            <div className="calendar-row header">
              {weekdayLabels.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            {calendar.map((week) => (
              <div key={week[0].toISOString()} className="calendar-row">
                {week.map((date) => {
                  const iso = toISODate(date);
                  const isCurrentMonth = date.getMonth() === monthCursor.getMonth();
                  const isToday = iso === toISODate(today);
                  const isSelected = iso === selectedISO;
                  const hasLog = Boolean(logs[iso]);
                  return (
                    <button
                      key={iso}
                      type="button"
                      className={`calendar-cell ${isCurrentMonth ? "" : "muted"} ${
                        isToday ? "today" : ""
                      } ${isSelected ? "selected" : ""} ${hasLog ? "has-log" : ""}`}
                      onClick={() => setSelectedDate(date)}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        <section className="panel workout-panel">
          <div className="panel-header">
            <h2>Today’s Focus</h2>
            <span className="date-chip">{formatDisplayDate(selectedDate)}</span>
          </div>

          {workoutInfo.type === "lifting" && (
            <div className="workout-block">
              <h3>{plan.workouts[workoutInfo.key].name}</h3>
              <div className="warmup">
                <h4>Warm-up</h4>
                <ul>
                  {plan.warmup.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              {plan.workouts[workoutInfo.key].blocks.map((block) => (
                <div key={block.title} className="block">
                  <div className="block-title">
                    <h4>{block.title}</h4>
                    {block.note && <span>{block.note}</span>}
                  </div>
                  <ul>
                    {block.exercises.map((exercise) => (
                      <li key={exercise.name}>
                        <span>{exercise.name}</span>
                        <span>
                          {exercise.sets} x {exercise.reps}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="cardio-note">
                <strong>Post-lift cardio:</strong> 15 min incline walk, incline 10–12, speed 3.0.
              </div>
            </div>
          )}

          {workoutInfo.type === "cardio" && (
            <div className="workout-block">
              <h3>Cardio & Recovery</h3>
              <ul>
                {plan.cardioStrategy.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {workoutInfo.type === "rest" && (
            <div className="workout-block">
              <h3>Recovery Day</h3>
              <p>Focus on steps, hydration, and mobility. Keep the streak alive.</p>
            </div>
          )}
        </section>

        <section className="panel tracker-panel">
          <div className="panel-header">
            <h2>Daily Tracking</h2>
            <button type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
          {error && <div className="error-banner">{error}</div>}

          <div className="field-group">
            <label htmlFor="weight">Body weight (lbs)</label>
            <input
              id="weight"
              type="number"
              inputMode="decimal"
              placeholder="Log today’s weight"
              value={logEntry.weight}
              onChange={(event) =>
                setLogEntry((prev) => ({ ...prev, weight: event.target.value }))
              }
            />
            {!logEntry.weight && <p className="helper">Daily weight keeps the trend accurate.</p>}
          </div>

          {workoutInfo.type === "lifting" && (
            <div className="workout-log">
              {Object.entries(logEntry.workouts).map(([exercise, sets]) => (
                <div key={exercise} className="exercise-card">
                  <h4>{exercise}</h4>
                  <div className="set-grid">
                    {sets.map((set, idx) => (
                      <div key={`${exercise}-${set.set}`} className="set-row">
                        <span>Set {set.set}</span>
                        <input
                          type="number"
                          placeholder="Reps"
                          value={set.reps}
                          onChange={(event) =>
                            handleWorkoutChange(exercise, idx, "reps", event.target.value)
                          }
                        />
                        <input
                          type="number"
                          placeholder="Weight"
                          value={set.weight}
                          onChange={(event) =>
                            handleWorkoutChange(exercise, idx, "weight", event.target.value)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {workoutInfo.type !== "lifting" && (
            <div className="cardio-log">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={logEntry.cardio.completed}
                  onChange={(event) =>
                    setLogEntry((prev) => ({
                      ...prev,
                      cardio: { ...prev.cardio, completed: event.target.checked }
                    }))
                  }
                />
                Cardio done
              </label>
              <label htmlFor="steps">Steps</label>
              <input
                id="steps"
                type="number"
                placeholder="8,000+"
                value={logEntry.cardio.steps}
                onChange={(event) =>
                  setLogEntry((prev) => ({
                    ...prev,
                    cardio: { ...prev.cardio, steps: event.target.value }
                  }))
                }
              />
              <label htmlFor="cardio-notes">Recovery notes</label>
              <textarea
                id="cardio-notes"
                rows="3"
                placeholder="Walked before work, mobility, etc."
                value={logEntry.cardio.notes}
                onChange={(event) =>
                  setLogEntry((prev) => ({
                    ...prev,
                    cardio: { ...prev.cardio, notes: event.target.value }
                  }))
                }
              />
            </div>
          )}

          <div className="field-group">
            <label htmlFor="notes">General notes</label>
            <textarea
              id="notes"
              rows="3"
              placeholder="Energy, sleep, digestion, stress."
              value={logEntry.notes}
              onChange={(event) =>
                setLogEntry((prev) => ({ ...prev, notes: event.target.value }))
              }
            />
          </div>
        </section>

        <section className="panel progress-panel">
          <div className="panel-header">
            <h2>Weight Progress</h2>
            <span className="date-chip">{weights.length} entries</span>
          </div>
          <WeightChart weights={weights} />
          <div className="image-placeholder small">
            Prompt: abstract data waves glowing teal on dark matte background, flat minimal style
          </div>
        </section>

        <section className="panel reminders-panel">
          <div className="panel-header">
            <h2>Lifestyle Reminders</h2>
            <span className="date-chip">Built from PLAN.md</span>
          </div>
          <div className="reminder-grid">
            <div className="reminder-card">
              <h4>Cardio Strategy</h4>
              <ul>
                {plan.cardioStrategy.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="reminder-card">
              <h4>Nutrition Targets</h4>
              <ul>
                {plan.nutrition.targets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="reminder-card">
              <h4>Batch Prep</h4>
              <ul>
                {plan.nutrition.batchPrep.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="reminder-card">
              <h4>Daily Meal Flow</h4>
              <ul>
                {plan.nutrition.dailyMeals.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="reminder-card">
              <h4>Progression Rules</h4>
              <ul>
                {plan.progression.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="reminder-card">
              <h4>Troubleshooting</h4>
              <ul>
                {plan.troubleshooting.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="image-placeholder">
            Prompt: minimal flat kitchen prep scene with meal containers, warm lighting, muted teal accents
          </div>
        </section>
      </main>
    </div>
  );
}
