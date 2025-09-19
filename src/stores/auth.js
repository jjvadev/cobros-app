// src/stores/auth.js
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    cedula: localStorage.getItem('cedula') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    roles: JSON.parse(localStorage.getItem('roles')) || [] // siempre array
  }),
  getters: {
    isAuthenticated: (state) => !!state.cedula,
    isAdmin: (state) => state.roles.includes('Administrador'),
    isSupervisor: (state) => state.roles.includes('Supervisor'),
    isCobrador: (state) => state.roles.includes('Cobrador')
  },
  actions: {
    async login(cedula, contrasena) {
      const { data, error } = await supabase
        .from('usuarios')
        .select('cedula')
        .eq('cedula', cedula)
        .eq('contrasena', contrasena) // ⚠️ en producción usa hash
        .eq('estado', true)
        .single()

      if (error || !data) {
        throw new Error('❌ Credenciales inválidas o usuario inactivo')
      }

      this.cedula = data.cedula
      localStorage.setItem('cedula', this.cedula)

      await this.fetchUserData()
    },

    async fetchUserData() {
      if (!this.cedula) return

      // Obtener datos básicos del usuario
      const { data: usuario, error: errorUsuario } = await supabase
        .from('usuarios')
        .select('cedula, nombre, estado')
        .eq('cedula', this.cedula)
        .single()

      if (errorUsuario) {
        console.error('Error obteniendo datos del usuario', errorUsuario)
        return
      }

      this.user = usuario
      localStorage.setItem('user', JSON.stringify(this.user))

      // Obtener roles del usuario
      const { data: rolesData, error: errorRoles } = await supabase
        .from('usuario_rol')
        .select('roles(nombre_rol)')
        .eq('cedula', this.cedula)

      if (errorRoles) {
        console.error('Error obteniendo roles del usuario', errorRoles)
        this.roles = []
        localStorage.removeItem('roles')
      } else {
        this.roles = rolesData.map(r => r.roles.nombre_rol)
        localStorage.setItem('roles', JSON.stringify(this.roles))
      }
    },

    restoreSession() {
      // Rehidratar desde localStorage
      this.cedula = localStorage.getItem('cedula')
      const userData = localStorage.getItem('user')
      const rolesData = localStorage.getItem('roles')

      this.user = userData ? JSON.parse(userData) : null
      this.roles = rolesData ? JSON.parse(rolesData) : []
    },

    logout() {
      this.cedula = null
      this.user = null
      this.roles = []
      localStorage.removeItem('cedula')
      localStorage.removeItem('user')
      localStorage.removeItem('roles')
    }
  }
})
