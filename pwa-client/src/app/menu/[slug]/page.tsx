'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { HeroSection } from '@/components/menu/HeroSection';
import { MenuTabs } from '@/components/menu/MenuTabs';
import { CategoryNav } from '@/components/menu/CategoryNav';
import { DishCard } from '@/components/menu/DishCard';
import { CartFloatingButton } from '@/components/menu/CartFloatingButton';
import { CartDrawer } from '@/components/menu/CartDrawer';
import { Restaurant, Menu, Category, Dish } from '@/lib/types';
import { UtensilsCrossed, Phone, Mail, Instagram, Facebook, MessageCircle } from 'lucide-react';

// --- Static Mock Data ---
const MOCK_RESTAURANT: Restaurant = {
  id: '1',
  name: 'Burger & Co',
  slug: 'burger-co',
  description: 'Las mejores hamburguesas artesanales de la ciudad.',
  address: 'Av. Corrientes 1234, Ciudad de México',
  phone: '55 1234 5678',
  email: 'hola@burgerco.mx',
  schedule: 'Lun - Dom: 12:00 - 23:00',
  logo_url: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=150&h=150',
  hero_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=1000',
};

const MOCK_MENUS: Menu[] = [
  {
    id: 'm1',
    name: 'Menú del Día',
    restaurantId: '1',
    isActive: true,
    hasSchedule: true,
    allowOutsideSchedule: false,
    categories: [
      {
        id: 'c1',
        name: 'Entradas',
        icon: 'Salad',
        sortOrder: 1,
        dishes: [
          {
            id: 'd1',
            name: 'Papas Gajo',
            description: 'Papas sazonadas con pimentón y finas hierbas, servidas con dip de chipotle.',
            price: 85,
            prepTimeMin: 15,
            images: ['https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=300'],
            isAvailable: true,
            categoryId: 'c1',
            allergens: ['Gluten'],
            ingredients: [],
          },
        ],
      },
      {
        id: 'c2',
        name: 'Hamburguesas',
        icon: 'Beef',
        sortOrder: 2,
        dishes: [
          {
            id: 'd2',
            name: 'La Foodify Special',
            description: 'Carne black angus (200g), queso cheddar doble, tocino ahumado, cebolla caramelizada y salsa especial.',
            price: 185,
            prepTimeMin: 20,
            images: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=300'],
            isAvailable: true,
            categoryId: 'c2',
            allergens: ['Lácteos', 'Gluten'],
            ingredients: [],
          },
          {
            id: 'd3',
            name: 'Clásica con Queso',
            description: 'La hamburguesa perfecta: carne parrillada, mucho queso, lechuga, tomate y pepinillos.',
            price: 155,
            prepTimeMin: 15,
            images: [],
            isAvailable: true,
            categoryId: 'c2',
            allergens: ['Lácteos', 'Gluten'],
            ingredients: [],
          },
        ],
      },
    ],
  },
  {
    id: 'm2',
    name: 'Cena',
    restaurantId: '1',
    isActive: false,
    hasSchedule: true,
    allowOutsideSchedule: true,
    categories: [],
  }
];

export default function PublicMenuPage() {
  const params = useParams();
  const [activeMenuId, setActiveMenuId] = useState(MOCK_MENUS[0].id);
  const [activeCategoryId, setActiveCategoryId] = useState(MOCK_MENUS[0].categories[0]?.id || '');
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Derivations
  const activeMenu = useMemo(() => MOCK_MENUS.find(m => m.id === activeMenuId), [activeMenuId]);
  const categories = activeMenu?.categories || [];

  return (
    <main className="min-h-screen bg-bg-app pb-24 lg:pb-0">
      {/* Hero Section */}
      <HeroSection restaurant={MOCK_RESTAURANT} />

      {/* Menu Tabs */}
      <MenuTabs 
        menus={MOCK_MENUS} 
        activeMenuId={activeMenuId} 
        onSelect={(id) => {
          setActiveMenuId(id);
          const firstCat = MOCK_MENUS.find(m => m.id === id)?.categories[0];
          if (firstCat) setActiveCategoryId(firstCat.id);
        }} 
      />

      {/* Mobile Category Nav */}
      <CategoryNav 
        categories={categories} 
        activeCategoryId={activeCategoryId} 
        onSelect={setActiveCategoryId} 
        orientation="horizontal"
      />

      <div className="container mx-auto px-4 lg:py-12 flex gap-8">
        {/* Desktop Sidebar Nav */}
        <CategoryNav 
          categories={categories} 
          activeCategoryId={activeCategoryId} 
          onSelect={setActiveCategoryId} 
          orientation="vertical"
        />

        {/* Content Area */}
        <div className="flex-1 space-y-12">
          {categories.map((category) => (
            <section 
              key={category.id} 
              id={`cat-${category.id}`}
              className="scroll-mt-32"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-foodify-orange-light text-foodify-orange flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5" />
                </span>
                {category.name}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.dishes.map((dish) => (
                  <DishCard key={dish.id} dish={dish} />
                ))}
              </div>
            </section>
          ))}

          {/* Contact Section */}
          <section id="contacto" className="pt-20 border-t mt-20 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <img 
                  src={MOCK_RESTAURANT.logo_url} 
                  className="w-16 h-16 rounded-xl mb-6 shadow-md" 
                  alt={MOCK_RESTAURANT.name} 
                />
                <h3 className="text-2xl font-bold mb-2">{MOCK_RESTAURANT.name}</h3>
                <p className="text-gray-500 mb-8 max-w-sm">{MOCK_RESTAURANT.description}</p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-5 h-5 text-foodify-orange" />
                    <a href={`tel:${MOCK_RESTAURANT.phone}`} className="hover:text-foodify-orange transition-colors">
                      {MOCK_RESTAURANT.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-5 h-5 text-foodify-orange" />
                    <a href={`mailto:${MOCK_RESTAURANT.email}`} className="hover:text-foodify-orange transition-colors">
                      {MOCK_RESTAURANT.email}
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-6">Síguenos en redes</h4>
                <div className="flex flex-wrap gap-4 mb-10">
                  <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-100 hover:border-foodify-orange hover:text-foodify-orange transition-all font-semibold text-sm">
                    <Instagram className="w-4 h-4" /> Instagram
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-100 hover:border-foodify-orange hover:text-foodify-orange transition-all font-semibold text-sm">
                    <Facebook className="w-4 h-4" /> Facebook
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-green-600 bg-green-50/50 hover:bg-green-50 transition-all font-semibold text-sm">
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </button>
                </div>
                
                {/* Mock Map Placeholder */}
                <div className="w-full h-48 bg-gray-100 rounded-3xl flex items-center justify-center text-gray-400 border-2 border-dashed">
                  Google Maps Placeholder
                </div>
              </div>
            </div>
            
            <footer className="mt-20 pt-8 border-t flex items-center justify-between text-xs text-gray-400">
              <p>© 2026 {MOCK_RESTAURANT.name} • Todos los derechos reservados.</p>
              <div className="flex items-center gap-2">
                <span>Powered by</span>
                <span className="font-bold text-foodify-orange">FOODIFY</span>
              </div>
            </footer>
          </section>
        </div>
      </div>

      {/* Cart Components */}
      <CartFloatingButton onClick={() => setIsCartOpen(true)} />
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        onCheckout={() => {
          console.log('Navegar a checkout');
          // Aquí navegaríamos al modal de datos del cliente
        }}
      />
    </main>
  );
}
