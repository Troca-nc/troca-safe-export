export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const Module = await import('module')
    const originalLoad = (Module as any)._load

    ;(Module as any)._load = function (request: string, ...args: any[]) {
      if (request === '@napi-rs/canvas') {
        return {}
      }

      return originalLoad.call(this, request, ...args)
    }
  }
}
