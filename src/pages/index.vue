<script setup lang="ts" generic="T extends any, O extends any">
defineOptions({
  name: 'IndexPage',
})

interface Transaction {
  date: number
  description: string
  credit: number
  debit: number
}

const transactions = useStorage<Transaction[]>('transactions', [])
// sort transactions by date when changed
watch(transactions, () => {
  transactions.value.sort((a, b) => a.date - b.date)
}, { deep: true })

const draggableRow = ref<number>()
useEventListener('mouseup', () => {
  draggableRow.value = -1
})
const draggingIndex = ref(-1)

const accumulatedAmounts = computed(() => {
  let accumulated = 0

  return transactions.value.map((transaction) => {
    accumulated += transaction.credit - transaction.debit
    return accumulated
  })
})

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
  element.setAttribute('download', 'transactions.json')

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
</script>

<template lang="pug">
n-layout.mx-8
  h1(text="4xl" flex) Simple Account Book
    n-button(text @click="upload()")
      .i-carbon-upload.text-3xl
    n-button(text @click="download()")
      .i-carbon-download.text-3xl
  n-table(size="small")
    thead
      tr
        th
        th Date
        th Description
        th Credit
        th Debit
        th Accumulated
        th
          .i-carbon-add-alt(hover="bg-green-7 cursor-pointer" @click="addTransaction")
    tbody
      tr(
        v-for="transaction, i in transactions"
        :draggable="i === draggableRow"
        @dragstart="draggingIndex = i"
        @dragover.prevent
        @drop="dropTransaction(i)"
      )
        td
          .i-carbon-drag-vertical.cursor-move(
            @mousedown="draggableRow = i"
          )
        td
          n-date-picker(v-model:value="transaction.date" type="date")
        td
          n-input(v-model:value="transaction.description")
        td
          n-input-number(v-model:value="transaction.credit" step="0.01" :format="v => v?.toFixed(2) || ''")
        td
          n-input-number(v-model:value="transaction.debit" step="0.01" :format="v => v?.toFixed(2) || ''")
        td {{ accumulatedAmounts[i].toFixed(2) }}
        td
          .i-carbon-subtract-alt(hover="bg-red-7 cursor-pointer" @click="removeTransaction(i)")
</template>
