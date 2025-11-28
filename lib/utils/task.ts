
export function calculateUrgency(dueDate: Date) {
    const now = new Date()
    const diff = dueDate.getTime() - now.getTime()
    const diffInDays = Math.ceil(diff / (1000 * 60 * 60 * 24))
  
    const urgency = Math.min(5, Math.max(0, Math.ceil(5 - (diffInDays / 2)))) // Scale of 0 to 5
  
    return urgency
  }