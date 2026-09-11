export const securePassword = (): string => {
    const length = 10; // Longitud mínima de la contraseña
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const specialChars = "@#$%!?.";
    const allChars = uppercase + uppercase.toLowerCase() + numbers + specialChars;
  
    let password = "";
  
    // Asegurar que la contraseña tenga al menos un carácter de cada tipo
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += uppercase.toLowerCase()[Math.floor(Math.random() * uppercase.toLowerCase().length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];
  
    // Completar la contraseña con caracteres aleatorios hasta alcanzar la longitud deseada
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
  
    // Mezclar los caracteres de la contraseña para que no sigan un patrón predecible
    password = password.split('').sort(() => Math.random() - 0.5).join('');
  
    return password;
  };