<template>
  <div class="container mt-4">
    <h4 class="mb-3">🛣 Gestionar Rutas</h4>

    <!-- Crear nueva ruta (solo admin) -->
    <div v-if="auth.isAdmin" class="card shadow p-3 mb-4">
      <h6 class="fw-bold">➕ Nueva Ruta</h6>
      <div class="input-group mt-2">
        <input
          v-model="nuevaRuta"
          type="text"
          class="form-control"
          placeholder="Nombre de la ruta"
        />
        <button class="btn btn-success" @click="crearRuta">Guardar</button>
      </div>
    </div>

    <!-- Listado -->
    <div class="card shadow p-3">
      <h6 class="fw-bold mb-3">📋 Mis Rutas</h6>
      <div class="table-responsive">
        <table class="table table-striped table-sm">
          <thead class="table-light">
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Estado</th>
              <th v-if="auth.isAdmin">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ruta in rutas" :key="ruta.id_ruta">
              <td>{{ ruta.id_ruta }}</td>
              <td>
                <span v-if="editandoRuta !== ruta.id_ruta">{{ ruta.nombre_ruta }}</span>
                <input
                  v-else
                  v-model="rutaEditada"
                  type="text"
                  class="form-control form-control-sm"
                />
              </td>
              <td>
                <span
                  class="badge"
                  :class="ruta.activo ? 'bg-success' : 'bg-secondary'"
                >
                  {{ ruta.activo ? "Activa" : "Inactiva" }}
                </span>
              </td>
              <td v-if="auth.isAdmin">
                <div v-if="editandoRuta !== ruta.id_ruta">
                  <button
                    class="btn btn-sm btn-primary me-1"
                    @click="empezarEdicion(ruta)"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    class="btn btn-sm btn-danger me-1"
                    @click="eliminarRuta(ruta)"
                  >
                    🗑 Eliminar
                  </button>
                  <button
                    class="btn btn-sm"
                    :class="ruta.activo ? 'btn-warning' : 'btn-success'"
                    @click="toggleRuta(ruta)"
                  >
                    {{ ruta.activo ? "Desactivar" : "Activar" }}
                  </button>
                </div>
                <div v-else>
                  <button class="btn btn-sm btn-success me-1" @click="guardarEdicion(ruta)">
                    💾 Guardar
                  </button>
                  <button class="btn btn-sm btn-secondary" @click="cancelarEdicion">
                    ❌ Cancelar
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="rutas.length === 0">
              <td colspan="4" class="text-center text-muted">
                No tienes rutas asignadas
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";

export default {
  name: "RutasView",
  setup() {
    const auth = useAuthStore();
    const rutas = ref([]);
    const nuevaRuta = ref("");
    const editandoRuta = ref(null);
    const rutaEditada = ref("");

    const fetchRutas = async () => {
      try {
        if (auth.isAdmin) {
          const { data, error } = await supabase
            .from("rutas")
            .select("id_ruta, nombre_ruta, activo")
            .order("id_ruta", { ascending: true });
          if (error) throw error;
          rutas.value = data;
        } else {
          const { data: userRutas } = await supabase
            .from("usuario_ruta")
            .select("id_ruta")
            .eq("cedula", auth.cedula);
          const ids = userRutas.map((r) => r.id_ruta);
          const { data } = await supabase
            .from("rutas")
            .select("id_ruta, nombre_ruta, activo")
            .in("id_ruta", ids);
          rutas.value = data || [];
        }
      } catch (err) {
        console.error("Error cargando rutas", err);
      }
    };

    const crearRuta = async () => {
      if (!nuevaRuta.value.trim()) {
        alert("⚠️ El nombre es obligatorio");
        return;
      }
      const { error } = await supabase
        .from("rutas")
        .insert([{ nombre_ruta: nuevaRuta.value.trim(), activo: true }]);
      if (error) {
        alert("❌ " + error.message);
        return;
      }
      nuevaRuta.value = "";
      fetchRutas();
    };

    const toggleRuta = async (ruta) => {
      const { error } = await supabase
        .from("rutas")
        .update({ activo: !ruta.activo })
        .eq("id_ruta", ruta.id_ruta);
      if (error) {
        alert("❌ " + error.message);
        return;
      }
      fetchRutas();
    };

    const empezarEdicion = (ruta) => {
      editandoRuta.value = ruta.id_ruta;
      rutaEditada.value = ruta.nombre_ruta;
    };

    const guardarEdicion = async (ruta) => {
      if (!rutaEditada.value.trim()) {
        alert("⚠️ El nombre no puede estar vacío");
        return;
      }
      const { error } = await supabase
        .from("rutas")
        .update({ nombre_ruta: rutaEditada.value.trim() })
        .eq("id_ruta", ruta.id_ruta);
      if (error) {
        alert("❌ " + error.message);
        return;
      }
      editandoRuta.value = null;
      fetchRutas();
    };

    const cancelarEdicion = () => {
      editandoRuta.value = null;
      rutaEditada.value = "";
    };

    const eliminarRuta = async (ruta) => {
      if (!confirm(`¿Seguro que deseas eliminar la ruta "${ruta.nombre_ruta}"?`)) return;
      const { error } = await supabase.from("rutas").delete().eq("id_ruta", ruta.id_ruta);
      if (error) {
        alert("❌ " + error.message);
        return;
      }
      fetchRutas();
    };

    onMounted(fetchRutas);

    return {
      auth,
      rutas,
      nuevaRuta,
      editandoRuta,
      rutaEditada,
      fetchRutas,
      crearRuta,
      toggleRuta,
      empezarEdicion,
      guardarEdicion,
      cancelarEdicion,
      eliminarRuta,
    };
  },
};
</script>
