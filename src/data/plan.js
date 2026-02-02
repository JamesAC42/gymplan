export const plan = {
  title: "The WFH Dad Recomp",
  schedule: "M/W/F Lifting (Morning) | T/Th/Sat Cardio & Recovery",
  equipment: "Planet Fitness specific",
  diet: "Low-FODMAP, High Protein",
  phase: {
    name: "Phase 1: The Wake Up (Weeks 1–4)",
    goal: "Re-establish neuromuscular connection, condition tendons, establish the routine."
  },
  warmup: [
    "5 min incline walk (get a sweat going).",
    "Arm circles & leg swings.",
    "1 set of 15 face pulls (light weight) to wake up rear delts/posture."
  ],
  workouts: {
    A: {
      name: "Workout A (Monday)",
      blocks: [
        {
          title: "Primary",
          exercises: [
            {
              name: "Smith Machine Squats",
              sets: 3,
              reps: "8–10",
              note: "Rest 2 mins (no superset)."
            }
          ]
        },
        {
          title: "Antagonist Pair",
          exercises: [
            { name: "Dumbbell Bench Press", sets: 3, reps: "10–12" },
            { name: "Lat Pulldowns (Wide Grip)", sets: 3, reps: "10–12" }
          ],
          note: "A1 then A2, rest 90s."
        },
        {
          title: "Accessory Pair",
          exercises: [
            { name: "Tricep Rope Pushdowns", sets: 2, reps: "12–15" },
            { name: "Dumbbell Bicep Curls", sets: 2, reps: "12–15" }
          ],
          note: "A1 then A2, rest 90s."
        },
        {
          title: "Core",
          exercises: [{ name: "Plank", sets: 3, reps: "45 sec" }]
        }
      ]
    },
    B: {
      name: "Workout B (Wednesday)",
      blocks: [
        {
          title: "Primary",
          exercises: [
            {
              name: "Smith Machine Romanian Deadlift (RDL)",
              sets: 3,
              reps: "8–10",
              note: "Focus on pushing hips back."
            }
          ]
        },
        {
          title: "Antagonist Pair",
          exercises: [
            { name: "Seated Cable Row (or Machine Row)", sets: 3, reps: "10–12" },
            { name: "Overhead Dumbbell Press", sets: 3, reps: "10–12" }
          ],
          note: "A1 then A2, rest 90s."
        },
        {
          title: "Accessory Pair",
          exercises: [
            { name: "Face Pulls", sets: 3, reps: "15" },
            { name: "Lateral Raises (DB or Machine)", sets: 3, reps: "12–15" }
          ]
        },
        {
          title: "Core",
          exercises: [{ name: "Cable or Machine Crunch", sets: 3, reps: "15" }]
        }
      ]
    },
    C: {
      name: "Workout C (Friday)",
      blocks: [
        {
          title: "Primary",
          exercises: [{ name: "Leg Press", sets: 3, reps: "10–12", note: "Heavy but controlled." }]
        },
        {
          title: "Antagonist Pair",
          exercises: [
            { name: "Incline Dumbbell Press", sets: 3, reps: "10–12" },
            { name: "Assisted Pull-Up Machine", sets: 3, reps: "8–10", note: "If unavailable, use Close-Grip Lat Pulldowns." }
          ]
        },
        {
          title: "Accessory",
          exercises: [{ name: "Smith Machine Reverse Lunges", sets: 2, reps: "10/leg", note: "Better for knees and balance." }]
        },
        {
          title: "Core",
          exercises: [{ name: "Hanging Knee Raises (Captain's Chair)", sets: 3, reps: "10–15" }]
        }
      ]
    }
  },
  cardioStrategy: [
    "Post-lift cardio (M/W/F): 15 min incline walk, incline 10–12, speed 3.0.",
    "Cognitive commute (T/Th): 20–30 min brisk walk before work.",
    "Step goal: 8,000 steps daily."
  ],
  nutrition: {
    targets: [
      "Calories: 2,000–2,200 kcals",
      "Protein: 180g (non-negotiable)"
    ],
    batchPrep: [
      "3–4 lbs chicken breast or thighs, baked with salt/pepper/oregano.",
      "Big batch of white rice or roasted potatoes.",
      "Frozen green beans or spinach for quick veg."
    ],
    dailyMeals: [
      "Breakfast: oatmeal + whey isolate + blueberries + walnuts.",
      "Lunch: prepped chicken + rice + spinach with garlic-infused olive oil + lemon.",
      "Snack: rice cake + peanut butter + kiwi or orange.",
      "Dinner: ground beef tacos with FODMAP-safe seasoning on corn tortillas."
    ]
  },
  progression: [
    "Start at the bottom of the rep range.",
    "Stay at that weight until you hit the top of the range for all sets.",
    "Increase weight by 5–10 lbs and repeat.",
    "Log everything."
  ],
  troubleshooting: [
    "2:00 PM crash: 20 air squats + 16oz cold water (no extra coffee).",
    "Hybrid office days: pack lunch, oil/vinegar on the side.",
    "Poor sleep: drop one set per exercise but keep the routine."
  ]
};

export const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; 

export const workoutByWeekday = {
  1: "A",
  3: "B",
  5: "C"
};

export const cardioDays = [2, 4, 6];

export function getWorkoutForDate(date) {
  const day = date.getDay();
  if (workoutByWeekday[day]) {
    return { type: "lifting", key: workoutByWeekday[day] };
  }
  if (cardioDays.includes(day)) {
    return { type: "cardio" };
  }
  return { type: "rest" };
}
