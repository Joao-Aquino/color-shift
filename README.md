# Color Shift

Color Shift extracts a two-color pair from a photo and shows it in a live text specimen. You can adjust the colors, compare WCAG 2 and APCA contrast scores, and copy or download a Markdown record. Photos come from Unsplash, or you can import your own image locally.

## Run locally

Use Node.js 20.9 or later. Clone the repository, then run:

```sh
npm ci
```

Create `.env.local` in the project root with your Unsplash API access key:

```dotenv
UNSPLASH_ACCESS_KEY=your_access_key
```

The key stays on the server. It is required for Unsplash photos; personal-photo import runs locally in the browser. Start the app with `npm run dev` and open [localhost:3000](http://localhost:3000).

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve a production build |
| `npm run lint` | ESLint |
| `npm test` | Deterministic Node tests in `tests/*.test.cjs` |

For browser regression suites and their preview setup, see [tests/README.md](tests/README.md). They use a production preview and Playwright with Chrome. Physical-device results and the next testing template are in [tests/device-browser-log.md](tests/device-browser-log.md).

## Deployment

The web app is available at [colorshift.co-opstudio.com](https://colorshift.co-opstudio.com). Set `UNSPLASH_ACCESS_KEY` as a server-side environment variable in the deployment environment, then run the production build and server commands above. The GitHub Actions workflow checks lint, generated types, TypeScript, build, and deterministic tests on pull requests and pushes to `main`.
