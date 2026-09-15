import * as React from 'react'

export interface FormFieldContextValue {
  id?: string
  error?: string | null
  hasError: boolean
}

export const FormFieldContext = React.createContext<FormFieldContextValue | null>(null)

export function useFormFieldContext() {
  return React.useContext(FormFieldContext)
}
