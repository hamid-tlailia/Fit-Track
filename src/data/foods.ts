export interface FoodItem {
  id: string
  nameEn: string
  nameAr: string
  kcalPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
}

export const foods: FoodItem[] = [
  { id: 'chicken-breast', nameEn: 'Chicken Breast', nameAr: 'صدر دجاج', kcalPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
  { id: 'white-rice', nameEn: 'White Rice (cooked)', nameAr: 'أرز أبيض (مطبوخ)', kcalPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3 },
  { id: 'eggs', nameEn: 'Eggs', nameAr: 'بيض', kcalPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11 },
  { id: 'oats', nameEn: 'Oats', nameAr: 'شوفان', kcalPer100g: 389, proteinPer100g: 16.9, carbsPer100g: 66, fatPer100g: 6.9 },
  { id: 'banana', nameEn: 'Banana', nameAr: 'موز', kcalPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3 },
  { id: 'salmon', nameEn: 'Salmon', nameAr: 'سلمون', kcalPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13 },
  { id: 'greek-yogurt', nameEn: 'Greek Yogurt', nameAr: 'زبادي يوناني', kcalPer100g: 59, proteinPer100g: 10, carbsPer100g: 3.6, fatPer100g: 0.4 },
  { id: 'almonds', nameEn: 'Almonds', nameAr: 'لوز', kcalPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 50 },
  { id: 'olive-oil', nameEn: 'Olive Oil', nameAr: 'زيت زيتون', kcalPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100 },
  { id: 'sweet-potato', nameEn: 'Sweet Potato', nameAr: 'بطاطا حلوة', kcalPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20, fatPer100g: 0.1 },
  { id: 'dates', nameEn: 'Dates', nameAr: 'تمر', kcalPer100g: 282, proteinPer100g: 2.5, carbsPer100g: 75, fatPer100g: 0.4 },
  { id: 'lentils', nameEn: 'Lentils (cooked)', nameAr: 'عدس (مطبوخ)', kcalPer100g: 116, proteinPer100g: 9, carbsPer100g: 20, fatPer100g: 0.4 },
]

export interface LoggedFoodEntry {
  id: string
  foodId: string
  grams: number
  loggedAt: string
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack'
}
