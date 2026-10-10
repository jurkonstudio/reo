// base: cents per unit. supply/demand: units the NPC market will sell/buy per product per day.
export const CATEGORIES = ['Grains', 'Meat', 'Produce', 'Dairy', 'Pantry', 'Beverages'];
export const PRODUCTS = [
  { id: 'flour',   name: 'Flour',          category: 'Grains',    unit: 'kg', base: 90,   supply: 500, demand: 300, lowStock: 20 },
  { id: 'rice',    name: 'Rice',           category: 'Grains',    unit: 'kg', base: 120,  supply: 500, demand: 300, lowStock: 20 },
  { id: 'chicken', name: 'Chicken',        category: 'Meat',      unit: 'kg', base: 480,  supply: 200, demand: 120, lowStock: 10 },
  { id: 'beef',    name: 'Beef',           category: 'Meat',      unit: 'kg', base: 1150, supply: 120, demand: 80,  lowStock: 10 },
  { id: 'veg',     name: 'Vegetables',     category: 'Produce',   unit: 'kg', base: 220,  supply: 400, demand: 250, lowStock: 20 },
  { id: 'milk',    name: 'Milk',           category: 'Dairy',     unit: 'L',  base: 110,  supply: 400, demand: 250, lowStock: 20 },
  { id: 'cheese',  name: 'Cheese',         category: 'Dairy',     unit: 'kg', base: 780,  supply: 120, demand: 80,  lowStock: 5 },
  { id: 'oil',     name: 'Cooking Oil',    category: 'Pantry',    unit: 'L',  base: 260,  supply: 300, demand: 200, lowStock: 10 },
  { id: 'sugar',   name: 'Sugar',          category: 'Pantry',    unit: 'kg', base: 100,  supply: 400, demand: 250, lowStock: 10 },
  { id: 'coffee',  name: 'Coffee Beans',   category: 'Beverages', unit: 'kg', base: 1400, supply: 100, demand: 60,  lowStock: 5 },
  { id: 'tea',     name: 'Tea Leaves',     category: 'Beverages', unit: 'kg', base: 1800, supply: 60,  demand: 40,  lowStock: 3 },
];
const byId = new Map(PRODUCTS.map((p) => [p.id, p]));
export const getProduct = (id) => byId.get(id) || null;
