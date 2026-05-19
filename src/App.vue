<template>
  <div class="app-root">
    <AppSidebar />
    <AppHeader />
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
</script>

<style>
.app-root {
  min-height: 100vh;
  background: var(--bg-page);
}

.app-main {
  margin-left: var(--sidebar-width);
  min-height: 100vh;
  padding: calc(var(--header-height) + 1.75rem) 1.75rem 1.75rem;
  transition: margin-left 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
