export function calcEmployeePay({ base_rate, fringe_rate=0, davis_bacon=false, hours_regular=0, hours_ot=0, deductions = {} }){
  const ot_rate = base_rate * 1.5
  const gross_regular = hours_regular * base_rate
  const gross_ot = hours_ot * ot_rate
  const gross = +(gross_regular + gross_ot).toFixed(2)
  const fringe = davis_bacon ? +((hours_regular + hours_ot) * fringe_rate).toFixed(2) : 0
  const fica = +(gross * 0.062).toFixed(2)
  const medicare = +(gross * 0.0145).toFixed(2)
  const fed_withholding = +(gross * 0.10).toFixed(2)
  const taxes = +(fica + medicare + fed_withholding).toFixed(2)
  const ded_total = Object.values(deductions || {}).reduce((a,b)=>a + Number(b||0), 0)
  const net = +(gross + fringe - taxes - ded_total).toFixed(2)
  return { gross, fringe, taxes, deductions: ded_total, net, breakdown: { fica, medicare, fed_withholding, gross_regular, gross_ot } }
}
