import type { Category, Dish } from "@/types/menu";
import type { Order } from "@/types/orders";

// ─── Categorías ───────────────────────────────────────────────────────────────
export const MOCK_CATEGORIES: Category[] = [
  { id: "entradas",   name: "Entrada",  emoji: "🥗" },
  { id: "comida",     name: "Comida",   emoji: "🍽️" },
  { id: "cena",       name: "Cena",     emoji: "🌙" },
  { id: "postres",    name: "Postre",   emoji: "🍮" },
  { id: "bebidas",    name: "Bebida",   emoji: "🥤" },
];

// ─── Platillos ────────────────────────────────────────────────────────────────
export const MOCK_DISHES: Dish[] = [
  {
    id: "d1", categoryId: "comida",
    name: "Tacos al Pastor",
    description: "Deliciosos tacos de cerdo marinado con piña, cilantro y cebolla",
    price: 85, isAvailable: true, soldCount: 342, badge: "Popular",
    imageUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80",
  },
  {
    id: "d2", categoryId: "comida",
    name: "Enchiladas Verdes",
    description: "Tortillas bañadas en salsa verde con pollo, crema y queso",
    price: 95, isAvailable: true, soldCount: 305, badge: "Popular",
    imageUrl: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400&q=80",
  },
  {
    id: "d3", categoryId: "comida",
    name: "Pozole Rojo",
    description: "Caldo tradicional de maíz cacahuazintle con carne de cerdo y chile guajillo",
    price: 120, isAvailable: true, soldCount: 287, badge: "Popular",
    imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80",
  },
  {
    id: "d4", categoryId: "entradas",
    name: "Guacamole Clásico",
    description: "Aguacate fresco con jitomate, cebolla, cilantro y chile serrano",
    price: 65, isAvailable: true, soldCount: 198,
    imageUrl: "https://images.unsplash.com/photo-1600335895229-6e75511892c8?w=400&q=80",
  },
  {
    id: "d5", categoryId: "entradas",
    name: "Sopa de Lima",
    description: "Caldo de pollo con tiras de tortilla frita, lima y aguacate estilo yucateco",
    price: 75, isAvailable: true, soldCount: 156,
    imageUrl: "https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=400&q=80",
  },
  {
    id: "d6", categoryId: "cena",
    name: "Chiles en Nogada",
    description: "Chile poblano relleno de picadillo con nogada, granada y perejil",
    price: 145, isAvailable: true, soldCount: 210, badge: "Chef",
    imageUrl: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&q=80",
  },
  {
    id: "d7", categoryId: "cena",
    name: "Mole Negro Oaxaqueño",
    description: "Pollo en mole negro con más de 30 ingredientes, servido con arroz",
    price: 155, isAvailable: false, soldCount: 178,
    imageUrl: "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=400&q=80",
  },
  {
    id: "d8", categoryId: "bebidas",
    name: "Agua de Horchata",
    description: "Refrescante bebida de arroz con canela y vainilla",
    price: 35, isAvailable: true, soldCount: 420,
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
  },
  {
    id: "d9", categoryId: "bebidas",
    name: "Margarita Clásica",
    description: "Tequila, triple sec, jugo de limón con sal en el borde",
    price: 85, isAvailable: true, soldCount: 310,
    imageUrl: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&q=80",
  },
  {
    id: "d10", categoryId: "postres",
    name: "Churros con Chocolate",
    description: "Churros crujientes espolvoreados con azúcar y canela, con chocolate caliente",
    price: 55, isAvailable: true, soldCount: 265, badge: "Nuevo",
    imageUrl: "https://images.unsplash.com/photo-1624371414361-e670e4a03a39?w=400&q=80",
  },
  {
    id: "d11", categoryId: "postres",
    name: "Flan Napolitano",
    description: "Flan cremoso de vainilla con caramelo dorado, receta de la abuela",
    price: 45, isAvailable: true, soldCount: 189,
    imageUrl: "https://images.unsplash.com/photo-1519869325930-281384150729?w=400&q=80",
  },
  {
    id: "d12", categoryId: "comida",
    name: "Ensalada de Nopal",
    description: "Nopal asado con jitomate, cebolla, queso fresco y vinagreta de limón",
    price: 70, isAvailable: true, soldCount: 134,
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80",
  },
];

// ─── Órdenes ──────────────────────────────────────────────────────────────────
export const MOCK_ORDERS: Order[] = [
  {
    id: "ord-001",
    folio: "1771635049607",
    status: "nuevo",
    attendedBy: "María González",
    branch: "Centro Histórico, CDMX",
    createdAt: "2026-02-20T18:50:00.000Z",
    items: [{ dishId: "d1", dishName: "Tacos al Pastor", qty: 1, unitPrice: 85 }],
  },
  {
    id: "ord-002",
    folio: "1771635196094",
    status: "entregado",
    attendedBy: "María González",
    branch: "Centro Histórico, CDMX",
    createdAt: "2026-02-20T18:53:00.000Z",
    items: [{ dishId: "d3", dishName: "Pozole Rojo", qty: 1, unitPrice: 120 }],
  },
  {
    id: "ord-003",
    folio: "1771635300001",
    status: "en_preparacion",
    attendedBy: "Carlos Mendoza",
    branch: "Centro Histórico, CDMX",
    createdAt: "2026-02-20T19:10:00.000Z",
    items: [
      { dishId: "d2", dishName: "Enchiladas Verdes", qty: 2, unitPrice: 95 },
      { dishId: "d8", dishName: "Agua de Horchata",  qty: 2, unitPrice: 35 },
    ],
  },
];

// ─── Helper: simular delay de red ────────────────────────────────────────────
export const mockDelay = (ms = 600) =>
  new Promise<void>((res) => setTimeout(res, ms));
