// expo-router/testing-library adds these matchers to Jest at runtime but declares no types for
// them (expo-router 57).
declare global {
  namespace jest {
    interface Matchers<R> {
      /** The router's current path, such as "/explore". */
      toHavePathname(pathname: string): R;
    }
  }
}

export {};
