<template>
  <div class="d-flex">
    <Sidebar />
    <div class="flex-grow-1 p-3">
      <Navbar />
      <router-view />
    </div>
  </div>
</template>

<script>
import Sidebar from '@/components/Sidebar.vue'
import Navbar from '@/components/Navbar.vue'
export default { components: { Sidebar, Navbar } }
</script>
