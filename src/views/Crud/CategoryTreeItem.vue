<template>
  <div>
    <v-list-item
      :style="`margin-left:${level * 20}px; min-height:36px;`"
      class="category-list-item"
      density="compact"
    >
      <template #prepend>
        <v-btn
          v-if="hasChildren"
          icon
          size="x-small"
          variant="text"
          color="grey-darken-1"
          @click.stop="toggle"
          class="me-1"
          aria-label="expand"
        >
          <v-icon size="18">{{ expanded ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
        </v-btn>
        <span v-else style="display:inline-block;width:24px"></span>
      </template>
      <v-list-item-title class="category-name">
        <span :class="level === 0 ? 'fw-bold' : ''">
          {{ category.name }}
        </span>
        <v-chip size="x-small" class="ml-2" color="primary" v-if="hasChildren">{{ category.childCount }}</v-chip>
      </v-list-item-title>
      <v-spacer />
      <div class="actions">
        <v-btn icon size="x-small" variant="text" color="grey-darken-1" @click.stop="$emit('edit', category)" aria-label="edit">
          <v-icon size="16">mdi-pencil</v-icon>
        </v-btn>
        <v-btn icon size="x-small" variant="text" color="red" @click.stop="$emit('delete', category)" aria-label="delete">
          <v-icon size="16">mdi-delete</v-icon>
        </v-btn>
      </div>
    </v-list-item>
    <div v-if="expanded && hasChildren">
      <CategoryTreeItem
        v-for="child in category.subcategories"
        :key="child.id"
        :category="child"
        :level="level + 1"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
const props = defineProps({
  category: Object,
  level: { type: Number, default: 0 }
});
const expanded = ref(false);
const hasChildren = computed(() => props.category.childCount > 0);
function toggle() {
  expanded.value = !expanded.value;
}
</script>

<style scoped>
.category-list-item {
  padding-top: 2px !important;
  padding-bottom: 2px !important;
  min-height: 36px;
  font-size: 15px;
}
.category-list-item .actions {
  display: flex;
  gap: 4px;
  align-items: center;
  opacity: 0.6;
  transition: opacity 0.13s;
}
.category-list-item:hover .actions {
  opacity: 1;
}
.fw-bold {
  font-weight: bold;
}
.v-chip {
  font-size: 11px;
  height: 20px;
  min-width: 26px;
  padding: 0 5px;
}
</style>
