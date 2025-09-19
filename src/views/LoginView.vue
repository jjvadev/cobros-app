<template>
  <div class="container d-flex align-items-center justify-content-center vh-100">
    <div class="card shadow w-100" style="max-width: 400px;">
      <div class="card-body">
        <h3 class="text-center mb-4">Iniciar Sesión</h3>

        <!-- Cédula -->
        <div class="mb-3">
          <label for="cedula" class="form-label">Cédula</label>
          <input v-model="cedula" type="text" id="cedula" class="form-control" />
        </div>

        <!-- Contraseña -->
        <div class="mb-3">
          <label for="contrasena" class="form-label">Contraseña</label>
          <input v-model="contrasena" type="password" id="contrasena" class="form-control" />
        </div>

        <!-- Botón -->
        <button class="btn btn-primary w-100" @click="handleLogin">Entrar</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

export default {
  name: 'LoginView',
  setup() {
    const cedula = ref('')
    const contrasena = ref('')
    const auth = useAuthStore()
    const router = useRouter()

    const handleLogin = async () => {
      try {
        await auth.login(cedula.value, contrasena.value)
        router.push('/dashboard') // redirige si es correcto
      } catch (err) {
        alert(err.message)
      }
    }

    return { cedula, contrasena, handleLogin }
  }
}
</script>
