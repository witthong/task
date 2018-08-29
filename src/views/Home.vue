<template>
  <div class="home">
    <Excel />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Excel from '@/components/excel/index.vue'; // @ is an alias to /src

@Component({
  components: {
    Excel,
  },
})
export default class Home extends Vue {}
</script>
