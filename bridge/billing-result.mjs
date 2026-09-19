export function billingError(result) {
  if (/credit balance is too low|insufficient credits/i.test(result ?? '')) {
    return 'Claude account credit balance is too low. Check your Claude billing and try again.'
  }
  return null
}
