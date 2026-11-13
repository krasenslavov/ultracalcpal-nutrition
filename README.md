# UltraCalcPal nutrition

Free, open-source fuelling maths for ultra runners, by [UltraCalcPal](https://www.ultracalcpal.com). MIT licence.

| Folder | What it is |
| --- | --- |
| [`packages/nutrition`](packages/nutrition) | `ultracalcpal-nutrition` on npm: carbs, fluids and sodium per hour, fuel ideas, carb loading and recovery, aid-station segments and drop bags, heat index and WBGT, risk flags. No dependencies. |
| [`extension`](extension) | UltraCalcPal Fuel Calculator, a browser extension (Chrome, Edge, Firefox) with the free calculator. Collects nothing. |

The same calculator runs in the browser, with no sign-up, at **https://www.ultracalcpal.com**, where
a plan can be saved, given aid stations and drop bags, matched to the race-day forecast and shared
with the crew.

## Build

```sh
npm install
npm run build:extension   # extension/dist/*.zip
cd packages/nutrition && npm install && npm test && npm run build
```

## Contributing

Issues and pull requests are welcome. Keep functions pure and dependency-free, cite the source for
any number you change, and add an example to the README for anything you add. The numbers are a
starting point for training, not medical advice.
