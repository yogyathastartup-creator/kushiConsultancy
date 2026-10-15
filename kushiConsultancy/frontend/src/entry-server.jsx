// Build-time renderer. Used only by scripts/prerender.mjs (vite build --ssr), never shipped to the browser.
import React from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { Writable } from 'node:stream';
import { AppRoutes } from './App';

// Resolves with the fully rendered markup for one URL, waiting for every lazy page to load.
export const renderPage = (url) => new Promise((resolve, reject) => {
    const chunks = [];
    const sink = new Writable({
        write(chunk, _encoding, callback) {
            chunks.push(chunk);
            callback();
        },
    });

    sink.on('finish', () => resolve(Buffer.concat(chunks).toString('utf8')));

    const { pipe } = renderToPipeableStream(
        <StaticRouter location={url}>
            <AppRoutes />
        </StaticRouter>,
        {
            onAllReady() {
                pipe(sink);
            },
            onShellError(error) {
                reject(error);
            },
            onError(error) {
                // Fail the build rather than publish a page with missing content.
                reject(error);
            },
        },
    );
});
