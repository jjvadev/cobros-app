<template>
  <router-view />
</template>

<script>
import { useAuthStore } from '@/stores/auth'

export default {
  setup() {
    const auth = useAuthStore()
    auth.restoreSession() // restaura al refrescar
  }
}
</script>
