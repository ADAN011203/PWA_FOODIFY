import type { Ingredient } from "@/types/inventory";

const d = (daysOffset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString();
};

export const MOCK_INGREDIENTS: Ingredient[] = [
  {
    id: "ing-01",
    name: "Carne de res",
    unit: "kg",
    currentStock: 0,
    minStock: 5,
    category: "Carnes",
    batches: [],
  },
  {
    id: "ing-02",
    name: "Tortillas de maíz",
    unit: "pzas",
    currentStock: 80,
    minStock: 100,
    category: "Granos",
    batches: [
      { id: "b-02a", ingredientId: "ing-02", quantity: 80, costPerUnit: 1.2, entryDate: d(-5), expiryDate: d(2), status: "active" },
    ],
  },
  {
    id: "ing-03",
    name: "Queso Oaxaca",
    unit: "kg",
    currentStock: 3.5,
    minStock: 4,
    category: "Lácteos",
    batches: [
      { id: "b-03a", ingredientId: "ing-03", quantity: 1.5, costPerUnit: 85, entryDate: d(-8), expiryDate: d(1), status: "active" },
      { id: "b-03b", ingredientId: "ing-03", quantity: 2.0, costPerUnit: 88, entryDate: d(-3), expiryDate: d(7), status: "active" },
    ],
  },
  {
    id: "ing-04",
    name: "Chile serrano",
    unit: "kg",
    currentStock: 6,
    minStock: 3,
    category: "Verduras",
    batches: [
      { id: "b-04a", ingredientId: "ing-04", quantity: 2,   costPerUnit: 32, entryDate: d(-10), expiryDate: d(4),  status: "active" },
      { id: "b-04b", ingredientId: "ing-04", quantity: 4,   costPerUnit: 30, entryDate: d(-4),  expiryDate: d(10), status: "active" },
    ],
  },
  {
    id: "ing-05",
    name: "Aceite vegetal",
    unit: "L",
    currentStock: 12,
    minStock: 8,
    category: "Aceites",
    batches: [
      { id: "b-05a", ingredientId: "ing-05", quantity: 5,  costPerUnit: 28, entryDate: d(-20), expiryDate: d(90), status: "active" },
      { id: "b-05b", ingredientId: "ing-05", quantity: 7,  costPerUnit: 27, entryDate: d(-7),  expiryDate: d(120), status: "active" },
    ],
  },
  {
    id: "ing-06",
    name: "Crema ácida",
    unit: "kg",
    currentStock: 2,
    minStock: 2,
    category: "Lácteos",
    batches: [
      { id: "b-06a", ingredientId: "ing-06", quantity: 2, costPerUnit: 45, entryDate: d(-6), expiryDate: d(5), status: "active" },
    ],
  },
  {
    id: "ing-07",
    name: "Limón",
    unit: "kg",
    currentStock: 9,
    minStock: 5,
    category: "Frutas",
    batches: [
      { id: "b-07a", ingredientId: "ing-07", quantity: 4, costPerUnit: 18, entryDate: d(-12), expiryDate: d(3),  status: "active" },
      { id: "b-07b", ingredientId: "ing-07", quantity: 5, costPerUnit: 15, entryDate: d(-2),  expiryDate: d(14), status: "active" },
    ],
  },
  {
    id: "ing-08",
    name: "Pollo entero",
    unit: "kg",
    currentStock: 14,
    minStock: 10,
    category: "Carnes",
    batches: [
      { id: "b-08a", ingredientId: "ing-08", quantity: 6,  costPerUnit: 62, entryDate: d(-3), expiryDate: d(4),  status: "active" },
      { id: "b-08b", ingredientId: "ing-08", quantity: 8,  costPerUnit: 60, entryDate: d(-1), expiryDate: d(6),  status: "active" },
    ],
  },
];