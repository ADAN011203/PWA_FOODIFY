"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { getOwnedRestaurantsApi, switchActiveRestaurantApi, Restaurant } from "@/lib/restaurantApi";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import styles from "./RestaurantSwitchModal.module.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function RestaurantSwitchModal({ isOpen, onClose }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getOwnedRestaurantsApi()
        .then(setRestaurants)
        .catch(() => toast("Error al cargar sucursales", "error"))
        .finally(() => setLoading(false));
    }
  }, [isOpen, toast]);

  const handleSwitch = async (restaurant: Restaurant) => {
    if (!user) return;
    if (restaurant.id === String(user.restaurantId || "")) {
      onClose();
      return;
    }

    setSwitching(restaurant.id);
    try {
      await switchActiveRestaurantApi(user.id, restaurant.id);
      toast(`Cambiando a ${restaurant.name}...`, "success");
      // Recargar para refrescar el contexto global y los datos de todos los módulos
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e) {
      toast("No se pudo cambiar de sucursal", "error");
      setSwitching(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mis Sucursales">
      <div className={styles.container}>
        <p className={styles.description}>
          Selecciona la sucursal que deseas gestionar en este momento.
        </p>

        {loading ? (
          <div className={styles.loading}>Cargando sucursales...</div>
        ) : (
          <div className={styles.list}>
            {restaurants.map((r) => {
              const isActive = user && String(user.restaurantId) === String(r.id);
              return (
                <div
                  key={r.id}
                  className={`${styles.item} ${isActive ? styles.active : ""}`}
                  onClick={() => !switching && handleSwitch(r)}
                >
                  <div className={styles.info}>
                    <p className={styles.name}>{r.name}</p>
                    <p className={styles.address}>{r.address || "Sin dirección"}</p>
                  </div>
                  {switching === r.id ? (
                    <div className={styles.spinner}>...</div>
                  ) : isActive ? (
                    <span className={styles.currentBadge}>Actual</span>
                  ) : (
                    <Button size="sm" variant="ghost">Seleccionar</Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose} fullWidth>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
