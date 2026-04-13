"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  Plus, 
  Mail, 
  Phone, 
  Edit3, 
  MoreVertical,
  Search,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

import { useFetchWithState } from "@/lib/useFetchWithState";
import { getStaffApi, updateStaffStatusApi } from "@/lib/staffApi";
import { AddStaffModal } from "@/components/modals/AddStaffModal";

const roleConfig: any = {
  restaurant_admin: { label: "Admin", color: "bg-orange-100 text-orange-600 border-orange-200" },
  waiter: { label: "Mesero", color: "bg-blue-100 text-blue-600 border-blue-200" },
  chef: { label: "Cocina", color: "bg-green-100 text-green-600 border-green-200" },
  cashier: { label: "Cajero", color: "bg-purple-100 text-purple-600 border-purple-200" },
};

export default function AdminStaffPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { 
    data: staff, 
    loading, 
    refetch 
  } = useFetchWithState("staff", getStaffApi, 15000);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      await updateStaffStatusApi(id, newStatus as any);
      toast.success("Estado actualizado");
      refetch();
    } catch (error) {
      toast.error("Error al actualizar estado");
    }
  };

  return (
    <div className="space-y-8">
      {loading && !staff && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foodify-orange" />
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Staff</h1>
          <p className="text-text-secondary">Gestiona el equipo y permisos de tu restaurante.</p>
        </div>
        
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-foodify-orange text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-foodify-orange/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          Agregar empleado
        </Button>
      </div>

      <AddStaffModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={() => refetch()} 
      />

      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-text-secondary" />
        <input 
          type="text" 
          placeholder="Buscar empleado por nombre o email..." 
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900 border border-border rounded-xl focus:ring-1 focus:ring-foodify-orange focus:outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {(staff || []).map((employee) => (
          <Card key={employee.id} className="group hover:border-foodify-orange transition-all overflow-hidden">
            <CardContent className="p-6">
               <div className="flex justify-between items-start mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-foodify-orange-light text-foodify-orange font-black text-xl flex items-center justify-center border-2 border-white shadow-sm">
                      {employee.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className={cn(
                      "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center",
                      employee.status === 'active' ? 'bg-green-500' : 'bg-gray-300'
                    )}>
                       {employee.status === 'active' ? <CheckCircle2 className="w-3 h-3 text-white" /> : <XCircle className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-text-secondary">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
               </div>

               <div className="space-y-1 mb-6">
                  <h3 className="font-black text-lg leading-tight">{employee.name}</h3>
                  <div className={cn(
                    "inline-flex px-2 py-0.5 rounded border text-[10px] font-black uppercase tracking-wider",
                    roleConfig[employee.role]?.color
                  )}>
                    {roleConfig[employee.role]?.label}
                  </div>
               </div>

               <div className="space-y-3 pb-6 border-b border-dashed">
                  <div className="flex items-center gap-3 text-sm text-text-secondary">
                     <Mail className="w-4 h-4 text-foodify-orange/40" />
                     <span className="truncate">{employee.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-secondary">
                     <Phone className="w-4 h-4 text-foodify-orange/40" />
                     <span>{employee.phone}</span>
                  </div>
               </div>

               <div className="pt-4 flex items-center justify-between">
                  <Button variant="ghost" className="text-xs font-bold gap-2 hover:bg-foodify-orange-light hover:text-foodify-orange">
                     <Edit3 className="w-3 h-3" /> Editar
                  </Button>
                  <Button 
                    variant="ghost" 
                    className={cn(
                      "text-xs font-bold",
                      employee.status === 'active' ? 'text-text-secondary' : 'text-green-500'
                    )}
                    onClick={() => toggleStatus(employee.id, employee.status)}
                  >
                    {employee.status === 'active' ? 'Desactivar' : 'Activar'}
                  </Button>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
