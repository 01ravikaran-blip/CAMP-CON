export function isDeveloper(sessionClaims?: any, user?: { role?: string, publicMetadata?: any } | null): boolean {
  if (sessionClaims?.metadata?.role === 'DEVELOPER' || sessionClaims?.metadata?.role === 'ADMIN') {
    return true;
  }
  
  if (user?.role === 'DEVELOPER' || user?.role === 'ADMIN') {
    return true;
  }

  if (user?.publicMetadata?.role === 'DEVELOPER' || user?.publicMetadata?.role === 'ADMIN') {
    return true;
  }
  
  return false;
}
