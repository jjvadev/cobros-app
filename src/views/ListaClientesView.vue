<template>
  <div class="container mt-4">
    <h4 class="mb-3">📋 Lista de Clientes</h4>

    <!-- Buscador -->
    <div class="mb-3">
      <input
        v-model="busqueda"
        type="text"
        class="form-control"
        placeholder="🔎 Buscar por nombre, cédula o ruta..."
      />
    </div>

    <!-- Tabla de clientes -->
    <div class="card shadow p-3">
      <div class="table-responsive">
        <table class="table table-striped table-sm">
          <thead class="table-light">
            <tr>
              <th>Cédula</th>
              <th>Nombre</th>
              <th>Ruta</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="usuario in usuariosFiltrados"
              :key="usuario.cedula + '-' + usuario.ruta"
            >
              <td>{{ usuario.cedula }}</td>
              <td>{{ usuario.nombre }}</td>
              <td>{{ usuario.ruta }}</td>
              <td>
                <button
                  class="btn btn-sm btn-success"
                  @click="irAPrestamo(usuario.cedula)"
                >
                  ➕ Nuevo Préstamo
                </button>
              </td>
            </tr>
            <tr v-if="usuariosFiltrados.length === 0">
              <td colspan="4" class="text-center text-muted">
                No se encontraron clientes
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";

export default {
  name: "ListaClientesView",
  setup() {
    const auth = useAuthStore();
    const router = useRouter();

    const usuarios = ref([]);
    const busqueda = ref("");

    // 🔎 Cargar solo clientes en las rutas del usuario logueado
    const fetchUsuarios = async () => {
      if (!auth.cedula) return;

      // 1. Rutas del usuario logueado
      const { data: userRutas, error: errorRutas } = await supabase
        .from("usuario_ruta")
        .select("id_ruta")
        .eq("cedula", auth.cedula);

      if (errorRutas || !userRutas?.length) {
        console.error("Error obteniendo rutas del usuario", errorRutas);
        usuarios.value = [];
        return;
      }

      const rutasIds = userRutas.map((r) => r.id_ruta);

      // 2. Usuarios en esas rutas
      const { data: usuariosRutas } = await supabase
        .from("usuario_ruta")
        .select("cedula, id_ruta")
        .in("id_ruta", rutasIds);

      const cedulas = [...new Set(usuariosRutas.map((ur) => ur.cedula))];

      // 3. Datos de usuarios
      const { data: usuariosData } = await supabase
        .from("usuarios")
        .select("cedula, nombre")
        .in("cedula", cedulas);

      // 4. Roles
      const { data: usuarioRoles } = await supabase
        .from("usuario_rol")
        .select("cedula, id_rol")
        .in("cedula", cedulas);

      const { data: rolesData } = await supabase
        .from("roles")
        .select("id_rol, nombre_rol");

      // 5. Rutas
      const { data: rutasData } = await supabase
        .from("rutas")
        .select("id_ruta, nombre_ruta")
        .in("id_ruta", rutasIds);

      // 6. Armar lista SOLO clientes
      usuarios.value = usuariosRutas
        .map((ur) => {
          const u = usuariosData.find((x) => x.cedula === ur.cedula);
          const rolAsignado = usuarioRoles.find((x) => x.cedula === ur.cedula);
          const rol = rolesData.find((r) => r.id_rol === rolAsignado?.id_rol);
          const ruta = rutasData.find((r) => r.id_ruta === ur.id_ruta);

          return {
            cedula: u?.cedula,
            nombre: u?.nombre,
            rol: rol?.nombre_rol || "—",
            ruta: ruta?.nombre_ruta || "—",
          };
        })
        .filter((u) => u.rol === "Cliente"); // 👈 solo clientes
    };

    // 🔎 Computed con búsqueda
    const usuariosFiltrados = computed(() => {
      if (!busqueda.value) return usuarios.value;

      const filtro = busqueda.value.toLowerCase();
      return usuarios.value.filter(
        (u) =>
          u.cedula?.toLowerCase().includes(filtro) ||
          u.nombre?.toLowerCase().includes(filtro) ||
          u.ruta?.toLowerCase().includes(filtro)
      );
    });

    // 👉 Redirigir a Prestamo
    const irAPrestamo = (cedula) => {
      router.push(`/prestamos/${cedula}`);
    };

    onMounted(fetchUsuarios);

    return { usuarios, busqueda, usuariosFiltrados, irAPrestamo };
  },
};
</script>
