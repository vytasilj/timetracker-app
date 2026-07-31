import { createRouter, createWebHashHistory } from 'vue-router'
import TimeEntriesView from '../views/TimeEntriesView.vue'
import ClientsView from '../views/ClientsView.vue'
import ProjectsView from '../views/ProjectsView.vue'
import LoginView from '../views/LoginView.vue'
import ReportsView from '../views/ReportsView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/time-entries' },
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
    { path: '/time-entries', name: 'time-entries', component: TimeEntriesView },
    { path: '/clients', name: 'clients', component: ClientsView },
    { path: '/projects', name: 'projects', component: ProjectsView },
    { path: '/reports', name: 'reports', component: ReportsView },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (!to.meta.public && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.name === 'login' && authStore.isAuthenticated) {
    return { name: 'time-entries' }
  }
})

export default router