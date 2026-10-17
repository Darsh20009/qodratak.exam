import test from "node:test";
import assert from "node:assert/strict";
import { authPhoneLookupVariants, authPhoneStorageCandidates } from "../src/services/authPhoneLookup";
import { fullPhone } from "../../qodratak/src/lib/phone-input";

test("Saudi login accepts historical phone formats without changing identities", () => {
  const expected = ["966500123456", "+966500123456", "0500123456", "500123456"];
  for (const value of [...expected, "00966500123456", "+966 50-012-3456", "٠٥٠٠١٢٣٤٥٦"]) {
    assert.deepEqual(authPhoneLookupVariants(value), expected);
  }
  assert.deepEqual(authPhoneLookupVariants("owner@example.invalid"), []);
  assert.deepEqual(authPhoneLookupVariants("0500"), []);
});

test("OTP phone login searches every historical stored Saudi phone format", () => {
  const expected = ["966500123456", "+966500123456", "0500123456", "500123456"];
  for (const value of ["966500123456", "+966500123456", "0500123456", "500123456"]) {
    assert.deepEqual(authPhoneStorageCandidates(value), expected);
  }
  assert.deepEqual(authPhoneStorageCandidates("owner@example.invalid"), []);
});

test("pasting a complete number never duplicates the selected country code", () => {
  for (const value of ["0500123456", "500123456", "966500123456", "+966500123456", "00966500123456", "٠٥٠٠١٢٣٤٥٦"]) {
    assert.equal(fullPhone("+966", value), "+966500123456");
  }
});
