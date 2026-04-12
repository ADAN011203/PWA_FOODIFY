// El middleware de autenticación está deshabilitado temporalmente.
// La protección de rutas la maneja useRoleGuard en el cliente,
// que lee la sesión desde localStorage.
//
// Cuando el backend NestJS esté listo, aquí verificaremos
// el JWT desde una cookie httpOnly en lugar de localStorage.

export function middleware() {}

export const config = {
  matcher: [],
};
