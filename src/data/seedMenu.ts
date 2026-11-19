import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { FoodCategory } from '../types';

export interface SeedFoodDefinition {
  id: string;
  name: string;
  description: string;
  category: FoodCategory;
  price: number;
  imageUrl: string;
  available: boolean;
  isPopular: boolean;
  isSpecial: boolean;
  isVeg: boolean;
  prepTimeMinutes: number;
}

export const SAMPLE_CANTEEN_MENU: SeedFoodDefinition[] = [
  {
    id: 'masala-dosa',
    name: 'Crispy Masala Dosa',
    description:
      'Golden fermented rice crepe filled with spiced potato bhaji, served hot with coconut chutney and steaming drumstick sambar.',
    category: 'Breakfast',
    price: 60,
    imageUrl: '/src/assets/images/food_masala_dosa_1795078060074.jpg',
    available: true,
    isPopular: true,
    isSpecial: true,
    isVeg: true,
    prepTimeMinutes: 8,
  },
  {
    id: 'ghee-roast-dosa',
    name: 'Ghee Roast Paper Dosa',
    description:
      'Extra crisp dosa brushed with pure desi ghee, accompanied by dual chutneys and piping hot temple-style sambar.',
    category: 'Breakfast',
    price: 75,
    imageUrl: '/src/assets/images/food_masala_dosa_1795078060074.jpg',
    available: true,
    isPopular: false,
    isSpecial: false,
    isVeg: true,
    prepTimeMinutes: 10,
  },
  {
    id: 'punjabi-samosa-plate',
    name: 'Punjabi Samosa (2 Pcs)',
    description:
      'Flaky golden pastry stuffed with roasted cumin, spiced potatoes, and green peas. Served with fresh mint and sweet tamarind chutney.',
    category: 'Snacks',
    price: 35,
    imageUrl: '/src/assets/images/food_samosa_platter_1795078059708.jpg',
    available: true,
    isPopular: true,
    isSpecial: false,
    isVeg: true,
    prepTimeMinutes: 4,
  },
  {
    id: 'mumbai-vada-pav',
    name: 'Mumbai Classic Vada Pav',
    description:
      'Crispy gram-flour battered potato vada tucked into toasted ladi pav with fiery dry garlic chutney and roasted green chili.',
    category: 'Snacks',
    price: 30,
    imageUrl: '/src/assets/images/food_vada_pav_1795078060208.jpg',
    available: true,
    isPopular: true,
    isSpecial: false,
    isVeg: true,
    prepTimeMinutes: 5,
  },
  {
    id: 'cheese-garlic-vada-pav',
    name: 'Cheese Grilled Vada Pav',
    description:
      'Campus favorite butter-toasted vada pav layered with melted cheddar and signature spicy garlic-peanut masala.',
    category: 'Snacks',
    price: 45,
    imageUrl: '/src/assets/images/food_vada_pav_1795078060208.jpg',
    available: true,
    isPopular: false,
    isSpecial: true,
    isVeg: true,
    prepTimeMinutes: 6,
  },
  {
    id: 'paneer-butter-thali',
    name: 'Paneer Butter Masala Thali',
    description:
      'Creamy tomato-cashew paneer curry served with two charred butter garlic naans, fragrant jeera rice, and fresh cucumber raita.',
    category: 'Meals',
    price: 140,
    imageUrl: '/src/assets/images/food_paneer_thali_1795078060535.jpg',
    available: true,
    isPopular: true,
    isSpecial: true,
    isVeg: true,
    prepTimeMinutes: 12,
  },
  {
    id: 'executive-campus-thali',
    name: 'Special Student Lunch Combo',
    description:
      'Hearty daily canteen meal featuring rich paneer gravy, jeera pulao, soft tandoori rotis, and chilled boondi raita.',
    category: 'Meals',
    price: 120,
    imageUrl: '/src/assets/images/food_paneer_thali_1795078060535.jpg',
    available: true,
    isPopular: false,
    isSpecial: false,
    isVeg: true,
    prepTimeMinutes: 10,
  },
  {
    id: 'kulhad-masala-chai',
    name: 'Kulhad Masala Chai',
    description:
      'Freshly brewed Assam tea simmered with crushed green cardamom, ginger, cinnamon, and whole milk in an earthy clay cup.',
    category: 'Beverages',
    price: 20,
    imageUrl: '/src/assets/images/food_masala_chai_1795078060191.jpg',
    available: true,
    isPopular: true,
    isSpecial: false,
    isVeg: true,
    prepTimeMinutes: 3,
  },
  {
    id: 'iced-cold-coffee',
    name: 'Frothy Cafe Cold Coffee',
    description:
      'Thick chilled espresso blended with creamy milk, chocolate drizzle, and cocoa dust. Ideal between afternoon lectures.',
    category: 'Beverages',
    price: 55,
    imageUrl: '/src/assets/images/food_cold_coffee_1795078060025.jpg',
    available: true,
    isPopular: true,
    isSpecial: false,
    isVeg: true,
    prepTimeMinutes: 4,
  },
  {
    id: 'saffron-gulab-jamun',
    name: 'Warm Gulab Jamun (2 Pcs)',
    description:
      'Melt-in-mouth khoya dumplings soaked in fragrant saffron-cardamom syrup and topped with slivered roasted pistachios.',
    category: 'Desserts',
    price: 45,
    imageUrl: '/src/assets/images/food_gulab_jamun_1795078059999.jpg',
    available: true,
    isPopular: false,
    isSpecial: true,
    isVeg: true,
    prepTimeMinutes: 3,
  },
];

let seedInFlight: Promise<boolean> | null = null;

export async function seedFoodItemsIfEmpty(): Promise<boolean> {
  if (seedInFlight) return seedInFlight;

  seedInFlight = (async () => {
    try {
      const existingSnap = await getDocs(query(collection(db, 'foodItems'), limit(1)));
      if (!existingSnap.empty) {
        return false;
      }

      const batch = writeBatch(db);
      for (const item of SAMPLE_CANTEEN_MENU) {
        const ref = doc(db, 'foodItems', item.id);
        batch.set(ref, {
          name: item.name,
          description: item.description,
          category: item.category,
          price: item.price,
          imageUrl: item.imageUrl,
          available: item.available,
          isPopular: item.isPopular,
          isSpecial: item.isSpecial,
          isVeg: item.isVeg,
          prepTimeMinutes: item.prepTimeMinutes,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'foodItems');
    } finally {
      seedInFlight = null;
    }
  })();

  return seedInFlight;
}
