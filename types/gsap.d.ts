declare module "gsap" {
  export namespace gsap {
    namespace core {
      interface Tween {
        kill: () => void
      }
    }
  }

  export const gsap: {
    to: (...args: any[]) => gsap.core.Tween
    fromTo: (...args: any[]) => gsap.core.Tween
    set?: (...args: any[]) => void
  }
}
