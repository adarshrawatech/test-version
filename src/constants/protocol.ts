export interface Task {
  id: string;
  time: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface Workout {
  part: string;
  exercises: { name: string; sets: string; reps: string; target?: string }[];
}

export const INITIAL_TIMETABLE: Task[] = [];

export const WORKOUT_PLAN: Record<string, Workout[]> = {};

export const NUTRITION_GUIDE = "No nutrition protocol active. Consult Shadow AI.";

export const SKILL_PATH = "No skill roadmap active. Consult Shadow AI.";

export const WEEKLY_GOALS: { week: number; title: string; goals: string[] }[] = [];

export const QUOTES = [
  '"It\'s not who I am underneath, but what I do that defines me."',
  '"Why do we fall? So we can learn to pick ourselves up."',
  '"Training is nothing. Will is everything."',
  '"The night is darkest just before the dawn. The dawn is coming."',
  '"A hero can be anyone."',
];


