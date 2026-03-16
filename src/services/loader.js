// Frontend service helpers for loader.
let api = null;

// Loads the data used by er.
export const loader = {
    start(message, mode = 'nonBlocking') {
        api?.start?.({ message, mode });
    },
    stop() {
        api?.stop?.();
    },
};

// Helper function used by register loader.
export function registerLoader(nextApi) {
    api = nextApi;
}