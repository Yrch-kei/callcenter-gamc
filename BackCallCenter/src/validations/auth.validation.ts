export const validateLoginInput = (email: string, password: string) => {
    const errors: { email?: string; password?: string } = {};
  
    if (!email || !email.includes('@')) {
      errors.email = 'Email inválido';
    }
  
    if (!password || password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
  
    return {
      errors,
      isValid: Object.keys(errors).length === 0,
    };
  };