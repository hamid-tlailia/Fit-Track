export type WorkoutCategory = 'strength' | 'hiit' | 'cardio' | 'mobility'
export type WorkoutLevel = 'beginner' | 'intermediate' | 'advanced'

export interface WorkoutExercise {
  id: string
  nameEn: string
  nameAr: string
  durationSec?: number
  reps?: number
  sets?: number
  restSec: number
  cueEn: string
  cueAr: string
}

export interface Workout {
  id: string
  titleEn: string
  titleAr: string
  category: WorkoutCategory
  level: WorkoutLevel
  durationMin: number
  calories: number
  gradient: [string, string]
  premium?: boolean
  exercises: WorkoutExercise[]
}

export const workouts: Workout[] = [
  {
    id: 'full-body-blast',
    titleEn: 'Full Body Blast',
    titleAr: 'انفجار الجسم الكامل',
    category: 'hiit',
    level: 'intermediate',
    durationMin: 20,
    calories: 220,
    gradient: ['#f84f14', '#fb7038'],
    exercises: [
      { id: 'jumping-jacks', nameEn: 'Jumping Jacks', nameAr: 'حجل بفتح الذراعين', durationSec: 40, restSec: 15, cueEn: 'Keep your core tight, land softly.', cueAr: 'حافظ على شد البطن وانزل بهدوء.' },
      { id: 'squats', nameEn: 'Bodyweight Squats', nameAr: 'سكوات بوزن الجسم', reps: 15, sets: 3, restSec: 30, cueEn: 'Push your hips back, chest up.', cueAr: 'ادفع الوركين للخلف وارفع صدرك.' },
      { id: 'push-ups', nameEn: 'Push-ups', nameAr: 'ضغط', reps: 12, sets: 3, restSec: 30, cueEn: 'Keep elbows at 45 degrees.', cueAr: 'حافظ على المرفقين بزاوية 45 درجة.' },
      { id: 'mountain-climbers', nameEn: 'Mountain Climbers', nameAr: 'متسلق الجبل', durationSec: 30, restSec: 20, cueEn: 'Drive knees fast, keep hips level.', cueAr: 'حرك الركبتين بسرعة مع ثبات الوركين.' },
      { id: 'plank', nameEn: 'Plank Hold', nameAr: 'بلانك', durationSec: 45, restSec: 20, cueEn: 'Squeeze glutes, straight line head to heels.', cueAr: 'اشد الأرداف وحافظ على خط مستقيم من الرأس للكعبين.' },
    ],
  },
  {
    id: 'strength-foundations',
    titleEn: 'Strength Foundations',
    titleAr: 'أساسيات القوة',
    category: 'strength',
    level: 'beginner',
    durationMin: 30,
    calories: 260,
    gradient: ['#8b5cf6', '#fbbf24'],
    exercises: [
      { id: 'goblet-squat', nameEn: 'Goblet Squat', nameAr: 'سكوات جوبلت', reps: 12, sets: 4, restSec: 45, cueEn: 'Elbows brush your knees at the bottom.', cueAr: 'المرفقان يلامسان الركبتين في الأسفل.' },
      { id: 'db-row', nameEn: 'Dumbbell Row', nameAr: 'تجديف بالدمبل', reps: 10, sets: 4, restSec: 45, cueEn: 'Pull with your back, not your arm.', cueAr: 'اسحب بالظهر وليس بالذراع.' },
      { id: 'bench-press', nameEn: 'Bench Press', nameAr: 'ضغط بنش', reps: 8, sets: 4, restSec: 60, cueEn: 'Control the descent, drive through your feet.', cueAr: 'تحكم بالنزول وادفع بقدميك.' },
      { id: 'plank', nameEn: 'Plank Hold', nameAr: 'بلانك', durationSec: 60, restSec: 30, cueEn: 'Breathe steady, brace your core.', cueAr: 'تنفس بثبات وشد عضلات البطن.' },
    ],
  },
  {
    id: 'cardio-burn',
    titleEn: 'Cardio Burn 5K Prep',
    titleAr: 'حرق كارديو - تحضير 5 كم',
    category: 'cardio',
    level: 'intermediate',
    durationMin: 25,
    calories: 280,
    gradient: ['#22d3ee', '#0ea5e9'],
    exercises: [
      { id: 'warmup-jog', nameEn: 'Warm-up Jog', nameAr: 'هرولة إحماء', durationSec: 300, restSec: 30, cueEn: 'Easy pace, relax your shoulders.', cueAr: 'وتيرة سهلة، أرخِ كتفيك.' },
      { id: 'intervals', nameEn: 'Sprint Intervals', nameAr: 'فترات عدو سريع', durationSec: 30, restSec: 60, cueEn: 'Full effort, pump your arms.', cueAr: 'أقصى جهد، حرك ذراعيك بقوة.' },
      { id: 'cooldown-walk', nameEn: 'Cooldown Walk', nameAr: 'مشي تهدئة', durationSec: 300, restSec: 0, cueEn: 'Slow your breathing down.', cueAr: 'هدّئ تنفسك تدريجيًا.' },
    ],
  },
  {
    id: 'mobility-flow',
    titleEn: 'Mobility & Recovery Flow',
    titleAr: 'تدفق المرونة والتعافي',
    category: 'mobility',
    level: 'beginner',
    durationMin: 15,
    calories: 90,
    gradient: ['#10b981', '#60a5fa'],
    exercises: [
      { id: 'cat-cow', nameEn: 'Cat-Cow Stretch', nameAr: 'تمدد القطة-البقرة', durationSec: 45, restSec: 10, cueEn: 'Move with your breath.', cueAr: 'حرك جسمك مع تنفسك.' },
      { id: 'hip-openers', nameEn: 'Hip Openers', nameAr: 'فتح الورك', durationSec: 45, restSec: 10, cueEn: 'Sink gently, no bouncing.', cueAr: 'انزل بلطف دون ارتداد.' },
      { id: 'child-pose', nameEn: "Child's Pose", nameAr: 'وضعية الطفل', durationSec: 60, restSec: 0, cueEn: 'Let your shoulders melt down.', cueAr: 'دع كتفيك يرتخيان للأسفل.' },
    ],
  },
  {
    id: 'ai-adaptive-strength',
    titleEn: 'AI Adaptive Strength Program',
    titleAr: 'برنامج قوة تكيّفي بالذكاء الاصطناعي',
    category: 'strength',
    level: 'advanced',
    durationMin: 35,
    calories: 310,
    gradient: ['#d21fff', '#39ffd6'],
    premium: true,
    exercises: [
      { id: 'deadlift', nameEn: 'Deadlift', nameAr: 'الرفعة الميتة', reps: 6, sets: 5, restSec: 90, cueEn: 'Neutral spine, push the floor away.', cueAr: 'حافظ على استقامة العمود الفقري وادفع الأرض بعيدًا.' },
      { id: 'weighted-lunge', nameEn: 'Weighted Lunge', nameAr: 'اندفاع بالأوزان', reps: 10, sets: 4, restSec: 60, cueEn: 'Front knee tracks over ankle.', cueAr: 'الركبة الأمامية فوق الكاحل مباشرة.' },
      { id: 'pull-up', nameEn: 'Pull-up', nameAr: 'العقلة', reps: 8, sets: 4, restSec: 90, cueEn: 'Lead with your chest.', cueAr: 'ابدأ الحركة بصدرك.' },
    ],
  },
]

export function getWorkoutById(id: string): Workout | undefined {
  return workouts.find((workout) => workout.id === id)
}
