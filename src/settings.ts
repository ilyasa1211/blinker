import { reactive } from "vue";

export const settings = reactive({
  thresholdEyesClosed: 0.5,
  thresholdEyesOpened: 0.4,
  blinkTimeout: 0.5,
  notifyBeforeSecond: 20,
});
