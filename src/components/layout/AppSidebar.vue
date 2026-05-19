<template>
  <aside class="sidebar" :class="{ expanded: isExpanded }">
    <!-- Logo -->
    <div class="sidebar-logo">
      <span class="logo-icon"><i class="pi pi-code" /></span>
      <span v-show="isExpanded" class="logo-title">Dev Utils</span>
    </div>

    <!-- Tool nav -->
    <nav class="sidebar-nav">
      <router-link
        v-for="tool in tools"
        :key="tool.id"
        :to="tool.path"
        class="nav-item"
        :class="{ active: route.path === tool.path }"
        v-tooltip.right="!isExpanded ? tool.name : null"
      >
        <i :class="['pi', tool.icon]" />
        <span v-show="isExpanded" class="nav-label">{{ tool.name }}</span>
      </router-link>
    </nav>

    <!-- Bottom actions -->
    <div class="sidebar-bottom">
      <button
        class="nav-item"
        @click="themeStore.toggle()"
        v-tooltip.right="!isExpanded ? (isDark ? 'Light mode' : 'Dark mode') : null"
      >
        <i :class="['pi', isDark ? 'pi-sun' : 'pi-moon']" />
        <span v-show="isExpanded" class="nav-label">{{ isDark ? 'Light mode' : 'Dark mode' }}</span>
      </button>
      <button
        class="nav-item"
        @click="sidebarStore.toggle()"
        v-tooltip.right="!isExpanded ? 'Expand' : null"
      >
        <i class="pi" :class="isExpanded ? 'pi-chevron-left' : 'pi-chevron-right'" />
        <span v-show="isExpanded" class="nav-label">Collapse</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { tools } from '@/router'
import { useThemeStore } from '@/stores/theme'
import { useSidebarStore } from '@/stores/sidebar'

const route = useRoute()
const themeStore = useThemeStore()
const sidebarStore = useSidebarStore()
const isDark = computed(() => themeStore.isDark)
const isExpanded = computed(() => sidebarStore.isExpanded)
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--sidebar-width);
  height: 100vh;
  background: var(--bg-sidebar);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 1rem 0;
  z-index: 100;
  border-right: 1px solid rgba(255, 255, 255, 0.04);
  overflow: hidden;
  transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Logo row */
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0 0.875rem;
  margin-bottom: 1.75rem;
  min-width: 0;
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  background: var(--accent);
  border-radius: 10px;
  color: #fff;
  font-size: 1rem;
  flex-shrink: 0;
}

.logo-title {
  flex: 1;
  font-weight: 700;
  font-size: 0.95rem;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
}

/* Nav */
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0 0.75rem;
  overflow: hidden;
}

.sidebar-bottom {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0 0.75rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  height: 40px;
  border-radius: 10px;
  color: var(--text-sidebar);
  text-decoration: none;
  font-size: 1.05rem;
  cursor: pointer;
  border: none;
  background: transparent;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
  overflow: hidden;
  /* center icon when collapsed */
  justify-content: center;
  padding: 0;
}

/* When expanded, left-align with padding */
.sidebar.expanded .nav-item {
  justify-content: flex-start;
  padding: 0 0.75rem;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.14);
  color: var(--text-sidebar-active);
}

.nav-label {
  font-size: 0.875rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
