/**
 * `server-only` is a build-time guard: importing it from a client bundle is meant to fail.
 * Next resolves it during a build, but Vitest runs in plain Node and cannot, so any test
 * that transitively imports a server module (event-branding -> booking-race) died at import
 * with "Cannot find package 'server-only'".
 *
 * In tests everything already runs on the server, so the guard has nothing to protect and a
 * no-op is the honest stand-in.
 */
export {};
