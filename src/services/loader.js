// src/services/loader.js
let api = null;

export const loader = {
    start(message, mode = 'nonBlocking') {
        api?.start?.({ message, mode });
    },
    stop() {
        api?.stop?.();
    },
};

export function registerLoader(nextApi) {
    api = nextApi;
}
