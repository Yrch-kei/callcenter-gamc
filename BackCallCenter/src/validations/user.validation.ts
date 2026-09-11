export const legalAge = (birthdate : Date) : boolean => {
    const today = new Date();
    const birthDateObj = new Date(birthdate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    const dayDiff = today.getDate() - birthDateObj.getDate();

    //Aca verificamos que tenga 18 años cumplidos, si no los tiene no se puede registrar
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
    }

    return age >= 18;
}

export const isValidPhone = (phone: string): boolean => {
    //El numero de celular debe empezar con 6 o 7 y tener 8 digitos en total
    const phoneRegex = /^(6|7)\d{7}$/; 
    return phoneRegex.test(phone);
}

export const isValidCI = (ci: string): boolean => {
    /*
    Aca se verifica si es uno de los tipos de cédula que existen en Bolivia,
    esta validacion no tiene en cuenta la extension Ej. (LP, SC, CBBA, etc.)
    ¿Qué valida esto?

    \d{7,8} → CI numérico de 7 u 8 dígitos (lo clásico)
    (E-)? → Opcional: el prefijo para extranjeros (E-)
    (-[0-9A-Za-z]{2})? → Opcional: complemento, como -1A, -2B, etc.

    */ 
    const ciRegex = /^(E-)?\d{7,8}(-[0-9A-Za-z]{2})?$/; 
    return ciRegex.test(ci);
}

export const eliminateSpaces = (str: string | undefined): string | undefined => {
    if(str === undefined) return undefined; // Si es undefined, retorna null, sobretodo esto es para el segundo apellido

    return str.replace(/\s+/g, ' ').trim(); // Elimina espacios en blanco adicionales y recorta los extremos
}