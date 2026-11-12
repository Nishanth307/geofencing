import "@testing-library/jest-dom";

// Mock global audio element for test environment
class MockAudio {
  play() {
    return Promise.resolve();
  }
  pause() {}
}
(globalThis as any).Audio = MockAudio;

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

