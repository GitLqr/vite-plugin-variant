<script setup lang="ts">
import { ref } from "vue";

defineProps<{ msg: string }>();

const flavor = ref(FLAVOR);
const website = ref(WEBSITE);
const languages = ref(LANGUAGES);
const authorName = ref(AUTHOR.name);
const authorAge = ref(AUTHOR.age);
</script>

<template>
  <h1>I am from android dir</h1>

  <div>{{ flavor }}</div>
  <div>{{ website }}</div>
  <div>{{ languages }}</div>
  <div>{{ authorName }}</div>
  <div>{{ authorAge }}</div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
