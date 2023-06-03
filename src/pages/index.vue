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

const dataClasses = computed(() => {
  return transactions.value.map((transaction, i) => {
    return {
      credit: transaction.credit > 0 ? 'input-green' : 'input-grey',
      debit: transaction.debit > 0 ? 'input-red' : 'input-grey',
      accumulated: transaction.credit - transaction.debit === 0 ? 'input-grey' : accumulatedAmounts.value[i] > 0 ? 'input-green' : 'input-red',
    }
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
  const nowDate = new Date()
  const now = `${nowDate.getFullYear()}-${(nowDate.getMonth() + 1).toString().padStart(2, '0')}-${nowDate.getDate().toString().padStart(2, "0")} ${nowDate.getHours().toString().padStart(2, '0')}-${nowDate.getMinutes().toString().padStart(2, '0')}-${nowDate.getSeconds().toString().padStart(2, '0')}`
  element.setAttribute('download', `transactions ${now}.json`)

  element.style.display = 'none'
  document.body.appendChild(element)

  element.click()

  document.body.removeChild(element)
}

// return the number to money format which is separated by comma with 2 decimal places
function format(v: number | null) {
  if (!v) return ''
  return v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// convert money format to number
function parse(v: string) {
  if (!v) return 0
  return parseFloat(v.replace(/,/g, ''))
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
.mx-8.flex.flex-col.h-screen.gap-y-2
  h1(text="4xl" flex) Simple Account Book
    n-button(text @click="upload()")
      .i-carbon-upload.text-3xl
    n-button(text @click="download()")
      .i-carbon-download.text-3xl
  .overflow-auto.flex-grow.outline.outline-1.outline-grey.pb-100
    n-table(:bordered="false" style="overflow: visible;" size="small")
      thead.sticky.top-0.z-3
        tr
          th.w-10
          th.w-40 Date
          th Description
          th.w-50 Credit
          th.w-50 Debit
          th.w-50 Accumulated
          th.w-10
            .i-carbon-add-alt(hover="bg-green-7 cursor-pointer" @click="addTransaction")
      tbody
        tr(
          v-for="transaction, i in transactions"
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

<style scoped lang="scss">
:deep(.input-red) {
  color: red;
}

:deep(.input-green) {
  color: green;
}

:deep(.input-grey) {
  color: grey;
}

:deep() {
  font-family: 'Courier New', Courier, monospace;
}

:deep() {
  table td {
    padding: 0.25rem 0.5rem;
  }
}
</style>