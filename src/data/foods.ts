export type FoodCategory = 'protein' | 'carb' | 'fruit' | 'vegetable' | 'dairy' | 'fat' | 'legume' | 'mixedDish'

export interface FoodItem {
  id: string
  nameEn: string
  nameAr: string
  category: FoodCategory
  kcalPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
}

export const foods: FoodItem[] = [
  // Protein
  { id: 'chicken-breast', nameEn: 'Chicken Breast', nameAr: 'صدر دجاج', category: 'protein', kcalPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
  { id: 'chicken-thigh', nameEn: 'Chicken Thigh', nameAr: 'فخذ دجاج', category: 'protein', kcalPer100g: 209, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 10.9 },
  { id: 'eggs', nameEn: 'Eggs', nameAr: 'بيض', category: 'protein', kcalPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11 },
  { id: 'egg-whites', nameEn: 'Egg Whites', nameAr: 'بياض بيض', category: 'protein', kcalPer100g: 52, proteinPer100g: 11, carbsPer100g: 0.7, fatPer100g: 0.2 },
  { id: 'salmon', nameEn: 'Salmon', nameAr: 'سلمون', category: 'protein', kcalPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13 },
  { id: 'tuna', nameEn: 'Tuna (canned in water)', nameAr: 'تونة (معلبة بالماء)', category: 'protein', kcalPer100g: 116, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 1 },
  { id: 'shrimp', nameEn: 'Shrimp', nameAr: 'جمبري', category: 'protein', kcalPer100g: 99, proteinPer100g: 24, carbsPer100g: 0.2, fatPer100g: 0.3 },
  { id: 'lean-beef', nameEn: 'Lean Beef', nameAr: 'لحم بقري قليل الدهن', category: 'protein', kcalPer100g: 250, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 15 },
  { id: 'ground-beef-93', nameEn: 'Ground Beef (93% lean)', nameAr: 'لحم مفروم (93% خالي من الدهن)', category: 'protein', kcalPer100g: 152, proteinPer100g: 22, carbsPer100g: 0, fatPer100g: 7 },
  { id: 'turkey-breast', nameEn: 'Turkey Breast', nameAr: 'صدر ديك رومي', category: 'protein', kcalPer100g: 135, proteinPer100g: 30, carbsPer100g: 0, fatPer100g: 1 },
  { id: 'tofu', nameEn: 'Tofu', nameAr: 'توفو', category: 'protein', kcalPer100g: 76, proteinPer100g: 8, carbsPer100g: 1.9, fatPer100g: 4.8 },
  { id: 'whey-protein', nameEn: 'Whey Protein Powder', nameAr: 'بروتين مصل اللبن (واي)', category: 'protein', kcalPer100g: 400, proteinPer100g: 80, carbsPer100g: 8, fatPer100g: 6.5 },
  { id: 'cottage-cheese', nameEn: 'Cottage Cheese', nameAr: 'جبنة قريش', category: 'dairy', kcalPer100g: 98, proteinPer100g: 11, carbsPer100g: 3.4, fatPer100g: 4.3 },

  // Carbs / grains
  { id: 'white-rice', nameEn: 'White Rice (cooked)', nameAr: 'أرز أبيض (مطبوخ)', category: 'carb', kcalPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3 },
  { id: 'brown-rice', nameEn: 'Brown Rice (cooked)', nameAr: 'أرز بني (مطبوخ)', category: 'carb', kcalPer100g: 112, proteinPer100g: 2.6, carbsPer100g: 24, fatPer100g: 0.9 },
  { id: 'oats', nameEn: 'Oats', nameAr: 'شوفان', category: 'carb', kcalPer100g: 389, proteinPer100g: 16.9, carbsPer100g: 66, fatPer100g: 6.9 },
  { id: 'quinoa', nameEn: 'Quinoa (cooked)', nameAr: 'كينوا (مطبوخة)', category: 'carb', kcalPer100g: 120, proteinPer100g: 4.4, carbsPer100g: 21, fatPer100g: 1.9 },
  { id: 'whole-wheat-bread', nameEn: 'Whole Wheat Bread', nameAr: 'خبز القمح الكامل', category: 'carb', kcalPer100g: 247, proteinPer100g: 13, carbsPer100g: 41, fatPer100g: 3.4 },
  { id: 'pita-bread', nameEn: 'Pita Bread', nameAr: 'خبز عربي (بيتا)', category: 'carb', kcalPer100g: 275, proteinPer100g: 9, carbsPer100g: 55, fatPer100g: 1.2 },
  { id: 'pasta', nameEn: 'Pasta (cooked)', nameAr: 'مكرونة (مطبوخة)', category: 'carb', kcalPer100g: 131, proteinPer100g: 5, carbsPer100g: 25, fatPer100g: 1.1 },
  { id: 'couscous', nameEn: 'Couscous (cooked)', nameAr: 'كسكسي (مطبوخ)', category: 'carb', kcalPer100g: 112, proteinPer100g: 3.8, carbsPer100g: 23, fatPer100g: 0.2 },
  { id: 'sweet-potato', nameEn: 'Sweet Potato', nameAr: 'بطاطا حلوة', category: 'carb', kcalPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20, fatPer100g: 0.1 },
  { id: 'potato', nameEn: 'Potato (boiled)', nameAr: 'بطاطس (مسلوقة)', category: 'carb', kcalPer100g: 87, proteinPer100g: 1.9, carbsPer100g: 20, fatPer100g: 0.1 },

  // Legumes
  { id: 'lentils', nameEn: 'Lentils (cooked)', nameAr: 'عدس (مطبوخ)', category: 'legume', kcalPer100g: 116, proteinPer100g: 9, carbsPer100g: 20, fatPer100g: 0.4 },
  { id: 'chickpeas', nameEn: 'Chickpeas (cooked)', nameAr: 'حمص (مطبوخ)', category: 'legume', kcalPer100g: 164, proteinPer100g: 8.9, carbsPer100g: 27, fatPer100g: 2.6 },
  { id: 'black-beans', nameEn: 'Black Beans (cooked)', nameAr: 'فاصوليا سوداء (مطبوخة)', category: 'legume', kcalPer100g: 132, proteinPer100g: 8.9, carbsPer100g: 24, fatPer100g: 0.5 },
  { id: 'kidney-beans', nameEn: 'Kidney Beans (cooked)', nameAr: 'فاصوليا حمراء (مطبوخة)', category: 'legume', kcalPer100g: 127, proteinPer100g: 8.7, carbsPer100g: 23, fatPer100g: 0.5 },
  { id: 'fava-beans', nameEn: 'Fava Beans (cooked)', nameAr: 'فول مدمس', category: 'legume', kcalPer100g: 110, proteinPer100g: 7.6, carbsPer100g: 19.7, fatPer100g: 0.7 },
  { id: 'edamame', nameEn: 'Edamame', nameAr: 'إداماميه', category: 'legume', kcalPer100g: 122, proteinPer100g: 11, carbsPer100g: 10, fatPer100g: 5 },

  // Fruits
  { id: 'banana', nameEn: 'Banana', nameAr: 'موز', category: 'fruit', kcalPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3 },
  { id: 'apple', nameEn: 'Apple', nameAr: 'تفاح', category: 'fruit', kcalPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2 },
  { id: 'orange', nameEn: 'Orange', nameAr: 'برتقال', category: 'fruit', kcalPer100g: 47, proteinPer100g: 0.9, carbsPer100g: 12, fatPer100g: 0.1 },
  { id: 'strawberry', nameEn: 'Strawberries', nameAr: 'فراولة', category: 'fruit', kcalPer100g: 32, proteinPer100g: 0.7, carbsPer100g: 7.7, fatPer100g: 0.3 },
  { id: 'watermelon', nameEn: 'Watermelon', nameAr: 'بطيخ', category: 'fruit', kcalPer100g: 30, proteinPer100g: 0.6, carbsPer100g: 7.6, fatPer100g: 0.2 },
  { id: 'grapes', nameEn: 'Grapes', nameAr: 'عنب', category: 'fruit', kcalPer100g: 69, proteinPer100g: 0.7, carbsPer100g: 18, fatPer100g: 0.2 },
  { id: 'mango', nameEn: 'Mango', nameAr: 'مانجو', category: 'fruit', kcalPer100g: 60, proteinPer100g: 0.8, carbsPer100g: 15, fatPer100g: 0.4 },
  { id: 'dates', nameEn: 'Dates', nameAr: 'تمر', category: 'fruit', kcalPer100g: 282, proteinPer100g: 2.5, carbsPer100g: 75, fatPer100g: 0.4 },
  { id: 'figs', nameEn: 'Figs', nameAr: 'تين', category: 'fruit', kcalPer100g: 74, proteinPer100g: 0.8, carbsPer100g: 19, fatPer100g: 0.3 },

  // Vegetables
  { id: 'broccoli', nameEn: 'Broccoli', nameAr: 'بروكلي', category: 'vegetable', kcalPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 7, fatPer100g: 0.4 },
  { id: 'spinach', nameEn: 'Spinach', nameAr: 'سبانخ', category: 'vegetable', kcalPer100g: 23, proteinPer100g: 2.9, carbsPer100g: 3.6, fatPer100g: 0.4 },
  { id: 'tomato', nameEn: 'Tomato', nameAr: 'طماطم', category: 'vegetable', kcalPer100g: 18, proteinPer100g: 0.9, carbsPer100g: 3.9, fatPer100g: 0.2 },
  { id: 'cucumber', nameEn: 'Cucumber', nameAr: 'خيار', category: 'vegetable', kcalPer100g: 15, proteinPer100g: 0.7, carbsPer100g: 3.6, fatPer100g: 0.1 },
  { id: 'carrot', nameEn: 'Carrot', nameAr: 'جزر', category: 'vegetable', kcalPer100g: 41, proteinPer100g: 0.9, carbsPer100g: 10, fatPer100g: 0.2 },
  { id: 'zucchini', nameEn: 'Zucchini', nameAr: 'كوسة', category: 'vegetable', kcalPer100g: 17, proteinPer100g: 1.2, carbsPer100g: 3.1, fatPer100g: 0.3 },
  { id: 'bell-pepper', nameEn: 'Bell Pepper', nameAr: 'فلفل رومي', category: 'vegetable', kcalPer100g: 31, proteinPer100g: 1, carbsPer100g: 6, fatPer100g: 0.3 },

  // Dairy
  { id: 'greek-yogurt', nameEn: 'Greek Yogurt', nameAr: 'زبادي يوناني', category: 'dairy', kcalPer100g: 59, proteinPer100g: 10, carbsPer100g: 3.6, fatPer100g: 0.4 },
  { id: 'labneh', nameEn: 'Labneh', nameAr: 'لبنة', category: 'dairy', kcalPer100g: 130, proteinPer100g: 5.5, carbsPer100g: 4, fatPer100g: 10.5 },
  { id: 'milk', nameEn: 'Milk (whole)', nameAr: 'حليب كامل الدسم', category: 'dairy', kcalPer100g: 61, proteinPer100g: 3.2, carbsPer100g: 4.8, fatPer100g: 3.3 },
  { id: 'halloumi', nameEn: 'Halloumi Cheese', nameAr: 'جبنة حلوم', category: 'dairy', kcalPer100g: 321, proteinPer100g: 22, carbsPer100g: 2.2, fatPer100g: 25 },

  // Fats / nuts
  { id: 'almonds', nameEn: 'Almonds', nameAr: 'لوز', category: 'fat', kcalPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 50 },
  { id: 'walnuts', nameEn: 'Walnuts', nameAr: 'جوز', category: 'fat', kcalPer100g: 654, proteinPer100g: 15, carbsPer100g: 14, fatPer100g: 65 },
  { id: 'cashews', nameEn: 'Cashews', nameAr: 'كاجو', category: 'fat', kcalPer100g: 553, proteinPer100g: 18, carbsPer100g: 30, fatPer100g: 44 },
  { id: 'peanut-butter', nameEn: 'Peanut Butter', nameAr: 'زبدة الفول السوداني', category: 'fat', kcalPer100g: 588, proteinPer100g: 25, carbsPer100g: 20, fatPer100g: 50 },
  { id: 'avocado', nameEn: 'Avocado', nameAr: 'أفوكادو', category: 'fat', kcalPer100g: 160, proteinPer100g: 2, carbsPer100g: 8.5, fatPer100g: 14.7 },
  { id: 'olive-oil', nameEn: 'Olive Oil', nameAr: 'زيت زيتون', category: 'fat', kcalPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100 },
  { id: 'tahini', nameEn: 'Tahini', nameAr: 'طحينة', category: 'fat', kcalPer100g: 595, proteinPer100g: 17, carbsPer100g: 21, fatPer100g: 54 },

  // Mixed / regional dishes
  { id: 'hummus', nameEn: 'Hummus', nameAr: 'حمص بالطحينة', category: 'mixedDish', kcalPer100g: 166, proteinPer100g: 8, carbsPer100g: 14, fatPer100g: 9.6 },
  { id: 'falafel', nameEn: 'Falafel', nameAr: 'فلافل', category: 'mixedDish', kcalPer100g: 333, proteinPer100g: 13, carbsPer100g: 32, fatPer100g: 18 },
  { id: 'shawarma-chicken', nameEn: 'Chicken Shawarma', nameAr: 'شاورما دجاج', category: 'mixedDish', kcalPer100g: 220, proteinPer100g: 18, carbsPer100g: 8, fatPer100g: 13 },
  { id: 'kabsa', nameEn: 'Chicken Kabsa', nameAr: 'كبسة دجاج', category: 'mixedDish', kcalPer100g: 190, proteinPer100g: 9, carbsPer100g: 22, fatPer100g: 7 },
  { id: 'molokhia', nameEn: 'Molokhia', nameAr: 'ملوخية', category: 'mixedDish', kcalPer100g: 65, proteinPer100g: 4, carbsPer100g: 8, fatPer100g: 2 },
  { id: 'grilled-fish', nameEn: 'Grilled Fish', nameAr: 'سمك مشوي', category: 'protein', kcalPer100g: 128, proteinPer100g: 22, carbsPer100g: 0, fatPer100g: 4 },
]

export interface LoggedFoodEntry {
  id: string
  foodId: string
  grams: number
  loggedAt: string
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack'
}
