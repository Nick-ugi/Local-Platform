/** Queenstown centre: the reference point when a request carries no location. */
export const SERVICE_CENTER = { latitude: -45.0312, longitude: 168.6626 } as const

/** A position farther than this from the centre is outside the service area. */
export const SERVICE_RADIUS_KM = 50
