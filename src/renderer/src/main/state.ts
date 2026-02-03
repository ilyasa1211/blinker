import {reactive} from "vue"
import { Breakpoint } from "./common/types.js"
import { getRandomId } from "./common/utils.js"

export const state = reactive<{
  isBreak: boolean
  breakpoints: Breakpoint[]
}>({
  isBreak: false,
  breakpoints: [
    {
      id: getRandomId(),
      interval: 20,
      intervalUnit: "minute",
      duration: 2,
      durationUnit: "minute",
    },
  ],
})