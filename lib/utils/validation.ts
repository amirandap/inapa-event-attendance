/**
 * Validar cédula dominicana usando el algoritmo oficial
 */
export function validateCedula(cedula: string): boolean {
  if (!/^\d{11}$/.test(cedula)) {
    return false
  }

  const digits = cedula.split('').map(Number)
  const checkDigit = digits[10]
  
  // Multiplicadores para cada posición
  const multipliers = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2]
  
  let sum = 0
  for (let i = 0; i < 10; i++) {
    let product = digits[i] * multipliers[i]
    if (product > 9) {
      product = Math.floor(product / 10) + (product % 10)
    }
    sum += product
  }
  
  const remainder = sum % 10
  const calculatedCheckDigit = remainder === 0 ? 0 : 10 - remainder
  
  return calculatedCheckDigit === checkDigit
}

/**
 * Formatear cédula para mostrar
 */
export function formatCedula(cedula: string): string {
  if (cedula.length === 11) {
    return `${cedula.slice(0, 3)}-${cedula.slice(3, 10)}-${cedula.slice(10)}`
  }
  return cedula
}

/**
 * Validar email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validar teléfono dominicano
 */
export function validateDominicanPhone(phone: string): boolean {
  // Formato: 8091234567 o +18091234567 o 18091234567
  const phoneRegex = /^(\+1|1)?[0-9]{10}$/
  return phoneRegex.test(phone.replace(/\s|-/g, ''))
}
