<template>
  <div class="dashboard-container">
    <!-- NAVBAR -->
    <nav class="navbar navbar-light bg-primary mb-3 px-3">
      <span class="navbar-brand mb-0 h5 text-white">KREDILER</span>
      <button class="btn btn-outline-light btn-sm" @click="logout">
        Cerrar sesión
      </button>
    </nav>

    <!-- BIENVENIDA -->
    <div class="px-3">
      <h5 class="fw-bold">👋 Hola, {{ auth.user?.nombre }}</h5>
      <p class="text-muted">Cédula: {{ auth.user?.cedula }}</p>
    </div>

    <!-- ESTADÍSTICAS -->
    <div class="row g-3 px-3 mt-1">
      <div class="col-6">
        <div class="card shadow-sm text-center py-3">
          <h6 class="fw-bold">Usuarios</h6>
          <p class="fs-4 text-primary">{{ totalUsuarios }}</p>
        </div>
      </div>
      <div class="col-6">
        <div class="card shadow-sm text-center py-3">
          <h6 class="fw-bold">Rutas</h6>
          <p class="fs-4 text-success">{{ totalRutas }}</p>
        </div>
      </div>
    </div>

    <!-- ACCIONES RÁPIDAS -->
    <div class="mt-4 px-3">
      <h6 class="fw-bold">Acciones rápidas</h6>
      <div class="d-grid gap-2 mt-2">
        <!-- 👇 SOLO ADMIN -->
        <button
          v-if="auth.isAdmin"
          class="btn btn-success btn-lg"
          @click="goTo('rutas')">
          🛣 Gestionar Rutas
        </button>

        <button class="btn btn-info btn-lg" @click="goTo('clientes')">
          ➕ Registrar Cliente
        </button>
        <button class="btn btn-secondary btn-lg" @click="goTo('lista-clientes')">
          📋 Lista de Clientes
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import { supabase } from "@/lib/supabase";

export default {
  name: "DashboardView",
  setup() {
    const auth = useAuthStore();
    const router = useRouter();

    const totalUsuarios = ref(0);
    const totalRutas = ref(0);

    const logout = () => {
      auth.logout();
      router.push("/login");
    };

    const goTo = (path) => {
      router.push(`/${path}`);
    };

    const fetchStats = async () => {
      const { count: usuariosCount } = await supabase
        .from("usuarios")
        .select("*", { count: "exact", head: true });

      const { count: rutasCount } = await supabase
        .from("rutas")
        .select("*", { count: "exact", head: true });

      totalUsuarios.value = usuariosCount || 0;
      totalRutas.value = rutasCount || 0;
    };

    onMounted(() => {
      if (!auth.user) {
        auth.fetchUserData();
      }
      fetchStats();
    });

    return { auth, logout, goTo, totalUsuarios, totalRutas };
  },
};
</script>
