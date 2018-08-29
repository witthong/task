<template>
  <canvas ref="canvas" :width="width" :height="height" :style="`width:${width}px;height:${height}px;`"></canvas>
</template>

<script lang="ts">
import { Component, Prop, Vue, Model } from 'vue-property-decorator';

@Component
export default class Excel extends Vue {
  public width: number = 0;
  public height: number = 0;

  constructor(props: any) {
    super(props);
    this.initSize();
  }
  public initSize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
  }
  private created() {
    this.initSize();
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
</style>
