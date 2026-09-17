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
  /** Unsplash photo id (the part after "photo-" in images.unsplash.com URLs). */
  photoId: string
  premium?: boolean
  exercises: WorkoutExercise[]
}

export const workouts: Workout[] = [
  {
    id: 'full-body-blast',
    titleEn: 'Full Body Blast',
    titleAr: 'انفجار الجسم الكامل',
    category: 'hiit',
    photoId: '1518310383802-640c2de311b2',
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
    photoId: '1517836357463-d25dfeac3438',
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
    photoId: '1552674605-db6ffd4facb5',
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
    photoId: '1544367567-0f2fcb009e0b',
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
    id: 'upper-body-power',
    titleEn: 'Upper Body Power',
    titleAr: 'قوة الجزء العلوي',
    category: 'strength',
    photoId: '1571731956672-f2b94d7dd0cb',
    level: 'intermediate',
    durationMin: 32,
    calories: 270,
    gradient: ['#8b5cf6', '#c4b5fd'],
    exercises: [
      { id: 'overhead-press', nameEn: 'Overhead Press', nameAr: 'ضغط كتف علوي', reps: 10, sets: 4, restSec: 60, cueEn: 'Brace your core, press straight up.', cueAr: 'شد البطن وادفع للأعلى في خط مستقيم.' },
      { id: 'bent-over-row', nameEn: 'Bent-over Row', nameAr: 'تجديف منحني', reps: 10, sets: 4, restSec: 60, cueEn: 'Flat back, squeeze shoulder blades.', cueAr: 'ظهر مستقيم واعصر لوحي الكتف.' },
      { id: 'lateral-raise', nameEn: 'Lateral Raise', nameAr: 'رفرفة جانبية', reps: 12, sets: 3, restSec: 40, cueEn: 'Lead with your elbows, control the tempo.', cueAr: 'ابدأ بالمرفقين وتحكم بالسرعة.' },
      { id: 'bicep-curl', nameEn: 'Bicep Curl', nameAr: 'تعريش بايسبس', reps: 12, sets: 3, restSec: 40, cueEn: 'No swinging, squeeze at the top.', cueAr: 'بدون تأرجح، اعصر العضلة في الأعلى.' },
      { id: 'tricep-dip', nameEn: 'Tricep Dip', nameAr: 'تراي بالمقعد', reps: 12, sets: 3, restSec: 40, cueEn: 'Keep elbows pointing back.', cueAr: 'حافظ على المرفقين للخلف.' },
    ],
  },
  {
    id: 'lower-body-burner',
    titleEn: 'Lower Body Burner',
    titleAr: 'حرق الجزء السفلي',
    category: 'strength',
    photoId: '1434682772747-f16d3ea162c3',
    level: 'intermediate',
    durationMin: 30,
    calories: 290,
    gradient: ['#f59e0b', '#ef4444'],
    exercises: [
      { id: 'back-squat', nameEn: 'Back Squat', nameAr: 'سكوات خلفي', reps: 10, sets: 4, restSec: 75, cueEn: 'Knees track over toes.', cueAr: 'الركبتان في اتجاه أصابع القدم.' },
      { id: 'walking-lunge', nameEn: 'Walking Lunge', nameAr: 'اندفاع متحرك', reps: 12, sets: 3, restSec: 60, cueEn: 'Long stride, torso upright.', cueAr: 'خطوة واسعة والجذع مستقيم.' },
      { id: 'glute-bridge', nameEn: 'Glute Bridge', nameAr: 'جسر الأرداف', reps: 15, sets: 3, restSec: 45, cueEn: 'Squeeze glutes hard at the top.', cueAr: 'اعصر الأرداف بقوة في الأعلى.' },
      { id: 'calf-raise', nameEn: 'Calf Raise', nameAr: 'رفع السمانة', reps: 20, sets: 3, restSec: 30, cueEn: 'Full range, pause at the top.', cueAr: 'مدى كامل مع توقف بسيط في الأعلى.' },
    ],
  },
  {
    id: 'core-crusher',
    titleEn: 'Core Crusher',
    titleAr: 'سحق عضلات البطن',
    category: 'strength',
    photoId: '1517836357463-d25dfeac3438',
    level: 'beginner',
    durationMin: 18,
    calories: 150,
    gradient: ['#0ea5e9', '#22d3ee'],
    exercises: [
      { id: 'plank', nameEn: 'Plank Hold', nameAr: 'بلانك', durationSec: 40, restSec: 20, cueEn: 'Ribs down, don’t let hips sag.', cueAr: 'أضلاعك للأسفل ولا تدع الوركين يهبطان.' },
      { id: 'russian-twist', nameEn: 'Russian Twist', nameAr: 'التواء روسي', reps: 20, sets: 3, restSec: 30, cueEn: 'Rotate from your ribcage.', cueAr: 'لف من منطقة الصدر.' },
      { id: 'bicycle-crunch', nameEn: 'Bicycle Crunch', nameAr: 'كرنش الدراجة', reps: 20, sets: 3, restSec: 30, cueEn: 'Slow and controlled, elbow to knee.', cueAr: 'ببطء وتحكم، المرفق نحو الركبة.' },
      { id: 'leg-raise', nameEn: 'Lying Leg Raise', nameAr: 'رفع الأرجل من الاستلقاء', reps: 15, sets: 3, restSec: 30, cueEn: 'Keep your lower back on the floor.', cueAr: 'حافظ على أسفل الظهر ملاصقًا للأرض.' },
      { id: 'superman', nameEn: 'Superman Hold', nameAr: 'وضعية سوبرمان', durationSec: 30, restSec: 20, cueEn: 'Lift chest and legs together.', cueAr: 'ارفع الصدر والأرجل معًا.' },
    ],
  },
  {
    id: 'tabata-inferno',
    titleEn: 'Tabata Inferno',
    titleAr: 'تابيتا الجحيم',
    category: 'hiit',
    photoId: '1571019613454-1cb2f99b2d8b',
    level: 'advanced',
    durationMin: 22,
    calories: 260,
    gradient: ['#ef4444', '#f97316'],
    exercises: [
      { id: 'burpees', nameEn: 'Burpees', nameAr: 'بيربيز', durationSec: 20, restSec: 10, cueEn: 'Explode up, land soft.', cueAr: 'انفجر للأعلى وانزل بهدوء.' },
      { id: 'jump-squats', nameEn: 'Jump Squats', nameAr: 'سكوات وثب', durationSec: 20, restSec: 10, cueEn: 'Soft knees on landing.', cueAr: 'ركبتان مرنتان عند الهبوط.' },
      { id: 'mountain-climbers', nameEn: 'Mountain Climbers', nameAr: 'متسلق الجبل', durationSec: 20, restSec: 10, cueEn: 'Fast feet, tight core.', cueAr: 'أقدام سريعة وبطن مشدود.' },
      { id: 'high-knees', nameEn: 'High Knees', nameAr: 'رفع الركبتين', durationSec: 20, restSec: 10, cueEn: 'Drive knees to hip height.', cueAr: 'ارفع الركبتين لمستوى الورك.' },
    ],
  },
  {
    id: 'beginner-hiit-kickoff',
    titleEn: 'Beginner HIIT Kickoff',
    titleAr: 'بداية هيت للمبتدئين',
    category: 'hiit',
    photoId: '1518310383802-640c2de311b2',
    level: 'beginner',
    durationMin: 16,
    calories: 140,
    gradient: ['#fb7038', '#fbbf24'],
    exercises: [
      { id: 'jumping-jacks', nameEn: 'Jumping Jacks', nameAr: 'حجل بفتح الذراعين', durationSec: 30, restSec: 20, cueEn: 'Steady rhythm, breathe naturally.', cueAr: 'إيقاع ثابت وتنفس طبيعي.' },
      { id: 'step-ups', nameEn: 'Step-ups', nameAr: 'صعود درج', reps: 10, sets: 3, restSec: 30, cueEn: 'Push through your heel.', cueAr: 'ادفع من كعب قدمك.' },
      { id: 'modified-push-ups', nameEn: 'Modified Push-ups', nameAr: 'ضغط معدّل (على الركبتين)', reps: 10, sets: 3, restSec: 30, cueEn: 'Straight line shoulders to knees.', cueAr: 'خط مستقيم من الكتفين للركبتين.' },
      { id: 'squats', nameEn: 'Bodyweight Squats', nameAr: 'سكوات بوزن الجسم', reps: 12, sets: 3, restSec: 30, cueEn: 'Sit back like sitting in a chair.', cueAr: 'اجلس للخلف كأنك تجلس على كرسي.' },
    ],
  },
  {
    id: 'jump-rope-cardio',
    titleEn: 'Jump Rope Cardio',
    titleAr: 'كارديو نط الحبل',
    category: 'cardio',
    photoId: '1476480862126-209bfaa8edc8',
    level: 'beginner',
    durationMin: 18,
    calories: 200,
    gradient: ['#22d3ee', '#3b82f6'],
    exercises: [
      { id: 'jump-rope', nameEn: 'Jump Rope', nameAr: 'نط الحبل', durationSec: 60, restSec: 30, cueEn: 'Light bounce, relaxed shoulders.', cueAr: 'قفزة خفيفة وكتفان مرتاحان.' },
      { id: 'high-knees', nameEn: 'High Knees', nameAr: 'رفع الركبتين', durationSec: 30, restSec: 20, cueEn: 'Quick feet, stay on your toes.', cueAr: 'أقدام سريعة وابقَ على أطراف أصابعك.' },
      { id: 'butt-kicks', nameEn: 'Butt Kicks', nameAr: 'ركل المؤخرة', durationSec: 30, restSec: 20, cueEn: 'Heels kick back toward glutes.', cueAr: 'الكعبان يرتدان نحو الأرداف.' },
    ],
  },
  {
    id: 'yoga-flexibility-flow',
    titleEn: 'Yoga Flexibility Flow',
    titleAr: 'تدفق اليوغا للمرونة',
    category: 'mobility',
    photoId: '1518611012118-696072aa579a',
    level: 'intermediate',
    durationMin: 24,
    calories: 120,
    gradient: ['#34d399', '#0ea5e9'],
    exercises: [
      { id: 'downward-dog', nameEn: 'Downward Dog', nameAr: 'وضعية الكلب المنحني', durationSec: 45, restSec: 10, cueEn: 'Push the floor away, lengthen your spine.', cueAr: 'ادفع الأرض بعيدًا وأطِل عمودك الفقري.' },
      { id: 'warrior-pose', nameEn: 'Warrior Pose', nameAr: 'وضعية المحارب', durationSec: 45, restSec: 10, cueEn: 'Front knee over ankle, arms strong.', cueAr: 'الركبة الأمامية فوق الكاحل والذراعان قويتان.' },
      { id: 'pigeon-pose', nameEn: 'Pigeon Pose', nameAr: 'وضعية الحمامة', durationSec: 45, restSec: 10, cueEn: 'Breathe into the stretch, relax your hips.', cueAr: 'تنفس داخل التمدد وأرخِ وركيك.' },
      { id: 'cobra-stretch', nameEn: 'Cobra Stretch', nameAr: 'تمدد الكوبرا', durationSec: 30, restSec: 10, cueEn: 'Lift your chest, keep shoulders down.', cueAr: 'ارفع صدرك مع إبقاء الكتفين منخفضين.' },
    ],
  },
  {
    id: 'ai-adaptive-strength',
    titleEn: 'AI Adaptive Strength Program',
    titleAr: 'برنامج قوة تكيّفي بالذكاء الاصطناعي',
    category: 'strength',
    photoId: '1571731956672-f2b94d7dd0cb',
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
  {
    id: 'ai-fat-loss-hiit',
    titleEn: 'AI Fat-Loss HIIT Circuit',
    titleAr: 'دائرة هيت لحرق الدهون بالذكاء الاصطناعي',
    category: 'hiit',
    photoId: '1571019613454-1cb2f99b2d8b',
    level: 'advanced',
    durationMin: 28,
    calories: 340,
    gradient: ['#d21fff', '#f97316'],
    premium: true,
    exercises: [
      { id: 'burpees', nameEn: 'Burpees', nameAr: 'بيربيز', durationSec: 40, restSec: 20, cueEn: 'Adaptive pace based on your last session.', cueAr: 'وتيرة تكيّفية حسب جلستك الأخيرة.' },
      { id: 'kettlebell-swing', nameEn: 'Kettlebell Swing', nameAr: 'أرجحة الكيتل بيل', reps: 15, sets: 4, restSec: 40, cueEn: 'Hinge at the hips, snap them forward.', cueAr: 'اثنِ من الوركين وادفعهما للأمام بقوة.' },
      { id: 'box-jump', nameEn: 'Box Jump', nameAr: 'قفز الصندوق', reps: 10, sets: 4, restSec: 45, cueEn: 'Land soft, stand tall on top.', cueAr: 'اهبط بهدوء وقف مستقيمًا فوق الصندوق.' },
      { id: 'battle-rope', nameEn: 'Battle Rope Waves', nameAr: 'أمواج الحبل القتالي', durationSec: 30, restSec: 30, cueEn: 'Full-body power from your legs up.', cueAr: 'قوة الجسم كاملة تبدأ من ساقيك.' },
    ],
  },
  {
    id: 'ai-hypertrophy-builder',
    titleEn: 'AI Hypertrophy Builder',
    titleAr: 'بناء العضلات بالذكاء الاصطناعي',
    category: 'strength',
    photoId: '1434682772747-f16d3ea162c3',
    level: 'advanced',
    durationMin: 40,
    calories: 320,
    gradient: ['#8b5cf6', '#d21fff'],
    premium: true,
    exercises: [
      { id: 'bench-press', nameEn: 'Bench Press', nameAr: 'ضغط بنش', reps: 10, sets: 5, restSec: 75, cueEn: 'Auto-adjusted load based on your progress.', cueAr: 'وزن مضبوط تلقائيًا حسب تقدمك.' },
      { id: 'lat-pulldown', nameEn: 'Lat Pulldown', nameAr: 'سحب علوي', reps: 12, sets: 4, restSec: 60, cueEn: 'Pull to your upper chest.', cueAr: 'اسحب حتى أعلى صدرك.' },
      { id: 'leg-press', nameEn: 'Leg Press', nameAr: 'ضغط الأرجل', reps: 12, sets: 4, restSec: 75, cueEn: 'Full range, don’t lock your knees.', cueAr: 'مدى كامل، لا تقفل الركبتين.' },
      { id: 'hamstring-curl', nameEn: 'Hamstring Curl', nameAr: 'ثني الفخذ الخلفي', reps: 12, sets: 3, restSec: 45, cueEn: 'Slow negative, squeeze at the top.', cueAr: 'نزول بطيء واعصر العضلة بالأعلى.' },
      { id: 'face-pull', nameEn: 'Face Pull', nameAr: 'سحب للوجه', reps: 15, sets: 3, restSec: 40, cueEn: 'Pull toward your eyes, rotate shoulders back.', cueAr: 'اسحب نحو عينيك مع لف الكتفين للخلف.' },
    ],
  },
]

export function getWorkoutById(id: string): Workout | undefined {
  return workouts.find((workout) => workout.id === id)
}
