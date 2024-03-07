<script setup lang="ts" generic="T extends any, O extends any">
import { compact } from 'lodash'
import { useTransactions, format, parse } from '~/composables/transaction';
defineOptions({
  name: 'IndexPage',
})

const {
  transactions,
  accumulatedAmounts,
  dataClasses,
} = useTransactions()

const yearFilter = ref(new Date().getFullYear())

const filteredTransactions = computed(() => {
  return compact(transactions.value.map((transaction, index) => {
    const date = new Date(transaction.date)
    if (date.getFullYear() === yearFilter.value) {
      return {
        transaction,
        index,
      }
    }
  }))
})

// sort transactions by date when changed
watch(transactions, () => {
  transactions.value.sort((a, b) => a.date - b.date)
}, { deep: true })

const draggableRow = ref<number>()
useEventListener('mouseup', () => {
  draggableRow.value = -1
})
const draggingIndex = ref(-1)


function addTransaction() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  transactions.value.push({
    date: today.getTime(),
    description: '',
    credit: 0,
    debit: 0,
  })
}

function removeTransaction(index: number) {
  transactions.value.splice(index, 1)
}

function dropTransaction(index: number) {
  const draggingTransaction = transactions.value[draggingIndex.value]
  transactions.value.splice(draggingIndex.value, 1)
  transactions.value.splice(index, 0, draggingTransaction)
}

function download() {
  const element = document.createElement('a')
  element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(transactions.value))}`)
  const nowDate = new Date()
  const now = `${nowDate.getFullYear()}-${(nowDate.getMonth() + 1).toString().padStart(2, '0')}-${nowDate.getDate().toString().padStart(2, "0")} ${nowDate.getHours().toString().padStart(2, '0')}-${nowDate.getMinutes().toString().padStart(2, '0')}-${nowDate.getSeconds().toString().padStart(2, '0')}`
  element.setAttribute('download', `transactions ${now}.json`)

  element.style.display = 'none'
  document.body.appendChild(element)

  element.click()

  document.body.removeChild(element)
}

function upload() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'application/json'
  input.onchange = () => {
    if (input.files?.length) {
      const file = input.files[0]
      const reader = new FileReader()
      reader.onload = () => {
        const text = reader.result as string
        try {
          const json = JSON.parse(text)
          if (Array.isArray(json))
            transactions.value = json
          else
            throw new Error('Invalid JSON')
        }
        catch (e) {
          alert('Invalid JSON')
        }
      }
      reader.readAsText(file)
    }
  }
  input.click()
}

//print function open a new window and print the table
function print() {
  window.open('./print', '_blank')
}
</script>

<template lang="pug">
.mx-8.flex.flex-col.h-screen.gap-y-2
  h1.gap-x-4(text="4xl" flex) Simple Account Book
    n-input-number(v-model:value="yearFilter" size="small" min="2020" max="2099" step="1")
    n-button(text @click="upload()" title="Upload")
      .i-carbon-upload.text-3xl
    n-button(text @click="download()" title="Download")
      .i-carbon-download.text-3xl
    n-button(text @click="print()" title="Print")
      .i-carbon-printer.text-3xl
  .overflow-auto.flex-grow.outline.outline-1.outline-grey.pb-100
    n-table(:bordered="false" style="overflow: visible;" size="small")
      thead.sticky.top-0.z-3
        tr
          th.w-10
          th.w-40 Date
          th Description
          th.w-40 Credit
          th.w-40 Debit
          th.w-40 Accumulated
          th.w-10
            .i-carbon-add-alt(hover="bg-green-7 cursor-pointer" @click="addTransaction")
      tbody
        tr(
          v-for="{transaction, index: i} in filteredTransactions"
          :draggable="i === draggableRow"
          @dragstart="draggingIndex = i"
          @dragover.prevent
          @drop="dropTransaction(i)"
        )
          td.cursor-move(@mousedown="draggableRow = i") {{ i+1 }}
          td
            n-date-picker(v-model:value="transaction.date" type="date" size="small")
          td
            n-input(v-model:value="transaction.description" size="small")
          td.text-right
            n-input-number(
              v-model:value="transaction.credit"
              step="0.01"
              :format="format"
              :parse="parse"
              :show-button="false" placeholder=""
              size="small"
            )
          td.text-right
            n-input-number(
              v-model:value="transaction.debit"
              step="0.01"
              :format="format"
              :parse="parse"
              :show-button="false"
              placeholder=""
              size="small"
            )
          td.text-right(:class="dataClasses[i].accumulated") {{ format(accumulatedAmounts[i]) }}
          td
            .i-carbon-subtract-alt(hover="bg-red-7 cursor-pointer" @click="removeTransaction(i)")
</template>

<style lang="scss" scoped>
@import "~/styles/common.scss";
</style>
