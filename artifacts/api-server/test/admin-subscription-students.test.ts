import { test } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { attachSubscriptionStudents } from "../src/services/adminSubscriptionStudents";

const id = "aaaaaaaaaaaaaaaaaaaaaaaa";
const student = { _id: new mongoose.Types.ObjectId(id), fullName: "طالب اختبار", username: "fixture",
  phone: "test-phone", email: "fixture@example.invalid", password: "must-not-leak" };

test("mixed ObjectId and string owners resolve without changing financial IDs", () => {
  const objectId = new mongoose.Types.ObjectId(id);
  const records = [{ userId: objectId, price: 39 }, { userId: id.toUpperCase(), price: 69 }];
  const result = attachSubscriptionStudents(records, [student]);
  assert.equal(result[0].student?.fullName, "طالب اختبار");
  assert.equal(result[1].student?.phone, "test-phone");
  assert.equal(result[0].userId, objectId);
  assert.equal(result[1].userId, id.toUpperCase());
  assert.equal(result[1].price, 69);
  assert.equal(result[0].studentLinkStatus, "linked");
  assert.equal("password" in result[0].student!, false);
  assert.equal("student" in records[0], false);
});

test("legacy and missing owners stay explicitly unlinked; never guessed from contact data", () => {
  const missing = "bbbbbbbbbbbbbbbbbbbbbbbb";
  const result = attachSubscriptionStudents([{ userId: 1 }, { userId: "1" }, { userId: missing }], [student]);
  assert.deepEqual(result.map(r => r.student), [null, null, null]);
  assert.deepEqual(result.map(r => r.studentLinkStatus), ["legacy_identity", "legacy_identity", "missing_account"]);
  assert.deepEqual(result.map(r => r.userId), [1, "1", missing]);
});
