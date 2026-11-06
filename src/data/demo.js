export const money = value => new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(value)

// Data is intentionally empty until it is supplied by the backend.
export const users = []
export const services = []
export const appointments = []
export const products = []
export const orders = []
export const sales = []
