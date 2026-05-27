import { createRouter, createWebHistory } from 'vue-router'
import JwtInspector from '@/tools/jwt-inspector/JwtInspector.vue'
import EpochConverter from '@/tools/epoch-converter/EpochConverter.vue'
const JsonBeautifier = () => import('@/tools/json-beautifier/JsonBeautifier.vue')
const RegexTester       = () => import('@/tools/regex-tester/RegexTester.vue')
const UnicodeConverter  = () => import('@/tools/unicode-converter/UnicodeConverter.vue')
const YamlJson          = () => import('@/tools/yaml-json/YamlJson.vue')
const CronParser        = () => import('@/tools/cron-parser/CronParser.vue')

export const tools = [
  {
    id: 'jwt-inspector',
    name: 'JWT Inspector',
    icon: 'pi-key',
    path: '/jwt-inspector',
    component: JwtInspector,
  },
  {
    id: 'epoch-converter',
    name: 'Epoch Converter',
    icon: 'pi-clock',
    path: '/epoch-converter',
    component: EpochConverter,
  },
  {
    id: 'json-beautifier',
    name: 'JSON Beautifier',
    icon: 'pi-code',
    path: '/json-beautifier',
    component: JsonBeautifier,
  },
  {
    id: 'regex-tester',
    name: 'Regex Tester',
    icon: 'pi-search',
    path: '/regex-tester',
    component: RegexTester,
  },
  {
    id: 'unicode-converter',
    name: 'Unicode Converter',
    icon: 'pi-language',
    path: '/unicode-converter',
    component: UnicodeConverter,
  },
  {
    id: 'yaml-json',
    name: 'YAML ↔ JSON',
    icon: 'pi-arrow-right-arrow-left',
    path: '/yaml-json',
    component: YamlJson,
  },
  {
    id: 'cron-parser',
    name: 'Cron Parser',
    icon: 'pi-calendar',
    path: '/cron-parser',
    component: CronParser,
  },
]

const routes = [
  { path: '/', redirect: '/jwt-inspector' },
  ...tools.map((t) => ({ path: t.path, component: t.component, meta: { tool: t } })),
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
