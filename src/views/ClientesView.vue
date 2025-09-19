<template>
  <div class="container mt-4">
    <h4 class="mb-3">➕ Registrar Usuario</h4>
    <div class="card shadow p-3">
      <!-- Nombre -->
      <div class="mb-3">
        <label class="form-label">Nombre</label>
        <input v-model="nombre" type="text" class="form-control" placeholder="Nombre completo" />
      </div>

      <!-- Cédula -->
      <div class="mb-3">
        <label class="form-label">Cédula</label>
        <input v-model="cedula" type="text" class="form-control" placeholder="Ej: 123456789" />
      </div>

      <!-- Seleccionar Rol -->
      <div v-if="rolesDisponibles.length > 1" class="mb-3">
        <label class="form-label">Rol</label>
        <select v-model="rolSeleccionado" class="form-select">
          <option value="">Seleccione un rol</option>
          <option v-for="rol in rolesDisponibles" :key="rol.id_rol" :value="rol.id_rol">
            {{ rol.nombre_rol }}
          </option>
        </select>
      </div>
      <div v-else-if="rolesDisponibles.length === 1" class="alert alert-info p-2">
        Rol asignado: <b>{{ rolesDisponibles[0].nombre_rol }}</b>
      </div>

      <!-- Seleccionar Ruta -->
      <div v-if="mostrarRuta && rutas.length > 1" class="mb-3">
        <label class="form-label">Ruta</label>
        <select v-model="rutaSeleccionada" class="form-select">
          <option value="">Seleccione una ruta</option>
          <option v-for="ruta in rutas" :key="ruta.id_ruta" :value="ruta.id_ruta">
            {{ ruta.nombre_ruta }}
          </option>
        </select>
      </div>
      <div v-else-if="mostrarRuta && rutas.length === 1" class="alert alert-info p-2">
        Ruta asignada: <b>{{ rutas[0].nombre_ruta }}</b>
      </div>

      <!-- Botón -->
      <button class="btn btn-success w-100" @click="registrarUsuario">
        Guardar Usuario
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";

export default {
  name: "ClientesView",
  setup() {
    const auth = useAuthStore();

    const nombre = ref("");
    const cedula = ref("");
    const rolesDisponibles = ref([]);
    const rolSeleccionado = ref("");
    const rutas = ref([]);
    const rutaSeleccionada = ref("");

    // === Cargar roles permitidos ===
    const fetchRoles = async () => {
      const { data: allRoles, error } = await supabase.from("roles").select("id_rol, nombre_rol");
      if (error) {
        console.error("Error cargando roles", error);
        return;
      }

      const misRoles = auth.roles || [];

      if (misRoles.includes("Administrador")) {
        rolesDisponibles.value = allRoles;
      } else if (misRoles.includes("Supervisor")) {
        rolesDisponibles.value = allRoles.filter((r) =>
          ["Supervisor", "Cobrador", "Cliente"].includes(r.nombre_rol)
        );
      } else if (misRoles.includes("Cobrador")) {
        rolesDisponibles.value = allRoles.filter((r) => r.nombre_rol === "Cliente");
      }

      if (rolesDisponibles.value.length === 1) {
        rolSeleccionado.value = rolesDisponibles.value[0].id_rol;
      }
    };

    // === Cargar rutas del usuario logueado ===
    const fetchRutas = async () => {
      if (!auth.cedula) return;

      const { data: userRutas, error } = await supabase
        .from("usuario_ruta")
        .select("id_ruta")
        .eq("cedula", auth.cedula);

      if (error) {
        console.error("Error cargando usuario_ruta", error);
        return;
      }

      if (userRutas.length > 0) {
        const ids = userRutas.map((r) => r.id_ruta);

        const { data: rutasData, error: errorRutas } = await supabase
          .from("rutas")
          .select("id_ruta, nombre_ruta")
          .in("id_ruta", ids);

        if (errorRutas) {
          console.error("Error cargando rutas", errorRutas);
          return;
        }

        rutas.value = rutasData || [];

        if (rutas.value.length === 1) {
          rutaSeleccionada.value = rutas.value[0].id_ruta;
        }
      }
    };

    // === Mostrar rutas ===
    const mostrarRuta = computed(() => {
      const rol = rolesDisponibles.value.find((r) => r.id_rol === rolSeleccionado.value);

      // 1. Si el logueado es Administrador y tiene más de una ruta → mostrar select
      if (auth.roles.includes("Administrador")) {
        return rutas.value.length > 0;
      }

      // 2. Si el nuevo usuario será Cliente o Cobrador → mostrar rutas
      return rol?.nombre_rol === "Cliente" || rol?.nombre_rol === "Cobrador";
    });

    // === Registrar usuario ===
    const registrarUsuario = async () => {
      if (!nombre.value || !cedula.value || !rolSeleccionado.value) {
        alert("⚠️ Todos los campos son obligatorios");
        return;
      }

      // Insertar en usuarios
      const { error: errorUsuario } = await supabase.from("usuarios").insert([
        {
          cedula: cedula.value,
          nombre: nombre.value,
          contrasena: null,
          estado: true,
        },
      ]);

      if (errorUsuario) {
        alert("❌ Error creando usuario: " + errorUsuario.message);
        return;
      }

      // Asignar rol
      const { error: errorRol } = await supabase
        .from("usuario_rol")
        .insert([{ cedula: cedula.value, id_rol: rolSeleccionado.value }]);

      if (errorRol) {
        alert("❌ Usuario creado, pero no se asignó rol");
        return;
      }

      // Asignar ruta si corresponde
      if (mostrarRuta.value) {
        if (!rutaSeleccionada.value) {
          alert("⚠️ Debe seleccionar una ruta");
          return;
        }
        const { error: errorRuta } = await supabase
          .from("usuario_ruta")
          .insert([{ cedula: cedula.value, id_ruta: rutaSeleccionada.value }]);

        if (errorRuta) {
          alert("❌ Usuario creado, pero no se asignó a la ruta");
          return;
        }
      }

      alert("✅ Usuario registrado con éxito");
      nombre.value = "";
      cedula.value = "";
      rolSeleccionado.value = "";
      rutaSeleccionada.value = "";
    };

    onMounted(() => {
      fetchRoles();
      fetchRutas();
    });

    return {
      nombre,
      cedula,
      rolesDisponibles,
      rolSeleccionado,
      rutas,
      rutaSeleccionada,
      mostrarRuta,
      registrarUsuario,
    };
  },
};
</script>
