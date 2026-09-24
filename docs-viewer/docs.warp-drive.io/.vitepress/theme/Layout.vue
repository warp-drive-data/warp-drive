<script setup lang="ts">
import DefaultTheme from 'vitepress/theme';

import CopyPageButton from './CopyPageButton.vue';
</script>

<template>
  <DefaultTheme.Layout>
    <!-- `doc-before` only exists in the doc layout, so the home page and any `layout: page` page get no button -->
    <template #doc-before>
      <CopyPageButton />
    </template>
  </DefaultTheme.Layout>
</template>
