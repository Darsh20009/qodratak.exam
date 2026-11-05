import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const checkout = await readFile(new URL("../src/components/GeideaCardCheckout.tsx", import.meta.url), "utf8");
const renewalDialog = await readFile(new URL("../src/components/SubscriptionRenewalDialog.tsx", import.meta.url), "utf8");
const returnPage = await readFile(new URL("../src/pages/GeideaPaymentReturnPage.tsx", import.meta.url), "utf8");
const globalCss = await readFile(new URL("../src/index.css", import.meta.url), "utf8");

test("Geidea checkout opens its validated hosted URL as a top-level page, never an iframe", () => {
  assert.match(checkout, /safeGeideaUrl\(result\?\.checkoutUrl\)/);
  assert.match(checkout, /href=\{session\.checkoutUrl\}/);
  assert.match(checkout, /target="_blank"/);
  assert.match(checkout, /rel="noopener noreferrer"/);
  assert.match(checkout, /onClick=\{\(\) => setCheckoutOpened\(true\)\}/);
  assert.doesNotMatch(checkout, /<iframe|createElement\(["']iframe|loadGeideaScript|GeideaCheckout/);
});

test("subscription dialog slides up from the bottom at every screen size", () => {
  assert.match(renewalDialog, /subscription-renewal-sheet fixed inset-x-0 bottom-0/);
  assert.match(renewalDialog, /!translate-y-0/);
  assert.match(renewalDialog, /safe-area-inset-bottom/);
  assert.match(globalCss, /@keyframes subscription-sheet-enter/);
  assert.match(globalCss, /translate: 0 100%/);
  assert.match(globalCss, /subscription-renewal-sheet\[data-state="open"\][\s\S]*subscription-sheet-enter/);
  assert.match(globalCss, /subscription-renewal-sheet\[data-state="closed"\][\s\S]*subscription-sheet-exit/);
  assert.match(globalCss, /both !important/);
  assert.match(renewalDialog, /safe-area-inset-bottom/);
  assert.match(renewalDialog, /rounded-full bg-\[#FF8A70\]\/70/);
});

test("Geidea return page shows popup guidance and only sends server-check hints", () => {
  assert.match(returnPage, /params\.get\("popup"\) === "1"/);
  assert.match(returnPage, /window\.opener\.postMessage/);
  assert.match(returnPage, /حالة الدفع تُراجع من الخادم/);
});
