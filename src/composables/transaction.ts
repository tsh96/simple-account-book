export interface Transaction {
  date: number
  description: string
  credit: number
  debit: number
}

export const useTransactions = () => {
  const transactions = useStorage<Transaction[]>('transactions', [])

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

  return { transactions, accumulatedAmounts, dataClasses }
}


// return the number to money format which is separated by comma with 2 decimal places
export function format(v: number | null) {
  if (!v) return ''
  return v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// convert money format to number
export function parse(v: string) {
  if (!v) return 0
  return parseFloat(v.replace(/,/g, ''))
}