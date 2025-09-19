<template>
  <div class="container py-3">
    <!-- Header -->
    <h4 class="mb-3 text-center fw-bold">➕ Nuevo Préstamo</h4>

    <!-- Info Cliente -->
    <div v-if="cliente" class="card shadow-sm p-3 mb-3 border-0 rounded-3">
      <p class="mb-1"><b>Cliente:</b> {{ cliente.nombre }}</p>
      <p class="mb-0"><b>Cédula:</b> {{ cliente.cedula }}</p>
    </div>

    <!-- Formulario -->
    <div class="card shadow-sm p-3 border-0 rounded-3">
      <!-- Monto -->
      <div class="mb-3">
        <label class="form-label fw-bold">💵 Monto</label>
        <input
          v-model.number="monto"
          type="number"
          class="form-control form-control-lg"
          placeholder="Ingrese monto"
        />
      </div>

      <!-- Interés -->
      <div class="mb-3">
        <label class="form-label fw-bold">📈 % Interés</label>
        <input
          v-model.number="interes"
          type="number"
          class="form-control form-control-lg"
          placeholder="Ingrese % interés"
        />
      </div>

      <!-- Tipo de Pago -->
      <div class="mb-3">
        <label class="form-label fw-bold">⏳ Tipo de Pago</label>
        <select v-model="tipoPago" class="form-select form-select-lg">
          <option value="24 dias">24 días</option>
          <option value="20 dias">20 días</option>
          <option value="semanal">Semanal (4 cuotas)</option>
          <option value="quincenal">Quincenal (2 cuotas)</option>
          <option value="mensual">Mensual (1 cuota)</option>
        </select>
      </div>

      <!-- Forma de Pago -->
      <div class="mb-3">
        <label class="form-label fw-bold">⚖️ Forma de Pago</label>
        <select v-model="formaPago" class="form-select form-select-lg">
          <option value="libre">Libre (solo intereses)</option>
          <option value="interes">A Interés (capital + interés)</option>
        </select>
      </div>

      <!-- Resumen Cuotas -->
      <div v-if="cuotas.length > 0" class="alert alert-info rounded-3">
        <h6 class="fw-bold">📊 Plan de Cuotas</h6>
        <ul class="list-group list-group-flush">
          <li
            v-for="(c, i) in cuotas"
            :key="i"
            class="list-group-item d-flex justify-content-between"
          >
            <span>Cuota {{ i + 1 }}</span>
            <span class="fw-bold">${{ (Number(c) || 0).toFixed(2) }}</span>
          </li>
        </ul>
        <div class="mt-3 text-end fw-bold">
          Total a pagar: <span class="text-primary">${{ total.toFixed(2) }}</span>
        </div>
      </div>

      <!-- Dirección -->
      <div class="mb-3 mt-3">
        <label class="form-label fw-bold">📍 Dirección</label>
        <input
          v-model="direccion"
          type="text"
          class="form-control form-control-lg"
          placeholder="Dirección del cliente"
        />
      </div>

      <!-- Observaciones -->
      <div class="mb-3">
        <label class="form-label fw-bold">📝 Observaciones</label>
        <textarea
          v-model="observaciones"
          class="form-control form-control-lg"
          placeholder="Notas adicionales"
        ></textarea>
      </div>

      <!-- Estado geolocalización -->
      <div class="mb-3 text-muted small">
        <span v-if="latitud && longitud">
          📡 Posición obtenida: ({{ latitud.toFixed(6) }}, {{ longitud.toFixed(6) }})
        </span>
        <span v-else>
          ⏳ Obteniendo ubicación...
        </span>
      </div>

      <!-- Botón Guardar -->
      <button class="btn btn-success btn-lg w-100 rounded-3" @click="guardarPrestamo">
        💾 Guardar Préstamo
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";

export default {
  name: "PrestamoView",
  setup() {
    const route = useRoute();
    const router = useRouter();
    const auth = useAuthStore();

    const cliente = ref(null);
    const monto = ref(0);
    const interes = ref(10);
    const tipoPago = ref("24 dias");
    const formaPago = ref("libre");
    const direccion = ref("");
    const observaciones = ref("");

    // geolocalización
    const latitud = ref(null);
    const longitud = ref(null);

    // obtener ubicación del navegador
    const obtenerUbicacion = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            latitud.value = pos.coords.latitude;
            longitud.value = pos.coords.longitude;
          },
          (err) => {
            console.warn("⚠️ No se pudo obtener ubicación:", err.message);
          }
        );
      } else {
        console.warn("⚠️ Geolocalización no soportada en este navegador");
      }
    };

    // número de cuotas
    const numCuotas = computed(() => {
      switch (tipoPago.value) {
        case "24 dias":
          return 24;
        case "20 dias":
          return 20;
        case "semanal":
          return 4;
        case "quincenal":
          return 2;
        case "mensual":
          return 1;
        default:
          return 1;
      }
    });

    // calcular cuotas
    const cuotas = computed(() => {
      if (!monto.value || !interes.value) return [];
      if (formaPago.value === "libre") {
        const interesTotal = (monto.value * interes.value) / 100;
        const cuota = interesTotal / numCuotas.value;
        return Array(numCuotas.value).fill(cuota || 0);
      }
      if (formaPago.value === "interes") {
        const total = monto.value + (monto.value * interes.value) / 100;
        const cuota = total / numCuotas.value;
        return Array(numCuotas.value).fill(cuota || 0);
      }
      return [];
    });

    const total = computed(() => {
      if (formaPago.value === "libre") {
        return (monto.value * interes.value) / 100;
      }
      return cuotas.value.reduce((acc, c) => acc + c, 0);
    });

    // cliente
    const fetchCliente = async () => {
      const { data } = await supabase
        .from("usuarios")
        .select("cedula, nombre")
        .eq("cedula", route.params.cedula)
        .single();
      cliente.value = data;
    };

    // guardar préstamo
    const guardarPrestamo = async () => {
      if (!monto.value || !interes.value) {
        alert("⚠️ Debe ingresar monto e interés");
        return;
      }

      const { data: rutaCliente } = await supabase
        .from("usuario_ruta")
        .select("id_ruta")
        .eq("cedula", cliente.value.cedula)
        .single();

      const idRuta = rutaCliente?.id_ruta || null;

      const { error } = await supabase.from("prestamos").insert([
        {
          cedula: cliente.value.cedula,
          monto: monto.value,
          valor: total.value,
          interes: interes.value,
          creado_por: auth.user?.nombre || "Sistema",
          id_ruta: idRuta,
          tipo_pago: tipoPago.value,
          forma_pago: formaPago.value,
          direccion: direccion.value,
          observaciones: observaciones.value,
          latitud: latitud.value,
          longitud: longitud.value,
        },
      ]);

      if (error) {
        alert("❌ Error creando préstamo: " + error.message);
        return;
      }

      alert("✅ Préstamo registrado con éxito");
      router.push("/lista-clientes");
    };

    onMounted(() => {
      fetchCliente();
      obtenerUbicacion();
    });

    return {
      cliente,
      monto,
      interes,
      tipoPago,
      formaPago,
      direccion,
      observaciones,
      cuotas,
      total,
      guardarPrestamo,
      latitud,
      longitud,
    };
  },
};
</script>

<style scoped>
.container {
  max-width: 600px;
}
.list-group-item {
  font-size: 0.9rem;
}
</style>
