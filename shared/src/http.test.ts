import { afterEach, expect, test, vi } from 'vitest'
import { ApiError, requestJson } from './http'

function respond(status: number, body: string) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { status })))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

test('returns the parsed body', async () => {
  respond(200, '{"items":[]}')

  await expect(requestJson('https://api.example/x')).resolves.toEqual({ items: [] })
})

test('turns Problem Details into an ApiError with its field errors', async () => {
  respond(
    400,
    JSON.stringify({
      code: 'VALIDATION_FAILED',
      detail: 'Validation failed.',
      errors: [{ field: 'west', message: 'must be less than east' }, { nope: 1 }],
    }),
  )

  const error = await requestJson('https://api.example/x').catch((e: unknown) => e)

  expect(error).toBeInstanceOf(ApiError)
  expect(error).toMatchObject({
    status: 400,
    code: 'VALIDATION_FAILED',
    detail: 'Validation failed.',
    errors: [{ field: 'west', message: 'must be less than east' }],
  })
})

test('an error page that is not Problem Details is UNKNOWN_ERROR', async () => {
  respond(502, '<html>Bad gateway</html>')

  await expect(requestJson('https://api.example/x')).rejects.toMatchObject({ status: 502, code: 'UNKNOWN_ERROR' })
})

test('no answer at all is NETWORK_ERROR', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network request failed')))

  await expect(requestJson('http://10.0.2.2:8080/x')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' })
})

test('a cancelled request rejects with the abort error itself', async () => {
  const controller = new AbortController()
  controller.abort()
  const abort = new DOMException('Aborted', 'AbortError')
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abort))

  await expect(requestJson('https://api.example/x', { signal: controller.signal })).rejects.toBe(abort)
})
