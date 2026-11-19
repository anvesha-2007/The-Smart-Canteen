import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { FoodItem } from '../types';
import { seedFoodItemsIfEmpty } from '../data/seedMenu';

interface MenuContextValue {
  items: FoodItem[];
  loading: boolean;
  error: string | null;
  seedSampleMenu: () => Promise<boolean>;
}

const MenuContext = createContext<MenuContextValue | undefined>(undefined);

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'foodItems'), orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: FoodItem[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: String(data.name ?? ''),
            description: String(data.description ?? ''),
            category: data.category,
            price: Number(data.price ?? 0),
            imageUrl: String(data.imageUrl ?? ''),
            available: Boolean(data.available),
            isPopular: Boolean(data.isPopular),
            isSpecial: Boolean(data.isSpecial),
            isVeg: Boolean(data.isVeg ?? true),
            prepTimeMinutes: Number(data.prepTimeMinutes ?? 10),
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          };
        });
        setItems(loaded);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        setError('Unable to load the canteen menu right now.');
        handleFirestoreError(err, OperationType.LIST, 'foodItems');
      },
    );

    return () => unsubscribe();
  }, []);

  const seedSampleMenu = useCallback(async () => {
    return seedFoodItemsIfEmpty();
  }, []);

  return (
    <MenuContext.Provider value={{ items, loading, error, seedSampleMenu }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu(): MenuContextValue {
  const ctx = useContext(MenuContext);
  if (!ctx) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return ctx;
}
