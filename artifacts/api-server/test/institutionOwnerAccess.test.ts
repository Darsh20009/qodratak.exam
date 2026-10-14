import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { activeInstitution, canRestoreActiveInstitutionOwner } from "../src/services/institutionService";

test("repair is limited to the matching institution owner on an active signed contract", () => {
  const institutionId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();
  const institution = {
    _id: institutionId,
    adminUserId: adminId,
    isActive: true,
    contract: { status: "approved", signedObjectKey: "private/signed-contract" },
  };
  const owner = { _id: adminId, institutionId, role: "institution_admin" };

  assert.equal(activeInstitution(institution), true);
  assert.equal(canRestoreActiveInstitutionOwner(owner, institution), true);
  assert.equal(canRestoreActiveInstitutionOwner({ ...owner, role: "student" }, institution), false);
  assert.equal(canRestoreActiveInstitutionOwner({ ...owner, institutionId: new mongoose.Types.ObjectId() }, institution), false);
  assert.equal(canRestoreActiveInstitutionOwner({ ...owner, _id: new mongoose.Types.ObjectId() }, institution), false);
  assert.equal(canRestoreActiveInstitutionOwner(owner, { ...institution, suspendedAt: new Date() }), false);
  assert.equal(canRestoreActiveInstitutionOwner(owner, { ...institution, archivedAt: new Date() }), false);
  assert.equal(canRestoreActiveInstitutionOwner(owner, {
    ...institution, contract: { ...institution.contract, status: "submitted" },
  }), false);
  assert.equal(canRestoreActiveInstitutionOwner(owner, { ...institution, contract: { status: "approved" } }), false);
});
