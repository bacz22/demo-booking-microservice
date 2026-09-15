export interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterFormData {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  phone?: string
  agreeTerms?: boolean
}
