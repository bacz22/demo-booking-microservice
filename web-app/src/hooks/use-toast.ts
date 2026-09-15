import { toast } from '@/lib/toast'

export function useToast() {
  return {
    toast,
    bookingSuccess: toast.bookingSuccess,
    seatError: toast.seatError,
    paymentError: toast.paymentError,
    apiFailure: toast.apiFailure,
    success: toast.success,
    error: toast.error,
    warning: toast.warning,
    info: toast.info,
    dismiss: toast.dismiss,
  }
}

export default useToast
