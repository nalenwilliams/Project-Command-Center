// /modules/payroll/server/services/taxEngine.js
export async function calculateWithholding({ taxableWages, ytd = {}, employee = {}, work = {} }) {
  // Provider hook goes here; return { federal, state, local, fica, medicare, futa, suta }
  const fica = +(Math.min(taxableWages, 99999999) * 0.062).toFixed(2);
  const medicare = +(taxableWages * 0.0145).toFixed(2);
  const federal = +(taxableWages * 0.10).toFixed(2); // placeholder
  const state = 0, local = 0, futa = 0, suta = 0;
  return { federal, state, local, fica, medicare, futa, suta };
}
