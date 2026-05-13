import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { shouldApplyPermissionFixForFsType } from "../containers.js";

describe("permission-fix policy", () => {
  it("allows FAT-like filesystems by default", () => {
    assert.equal(shouldApplyPermissionFixForFsType("exfat", undefined), true);
    assert.equal(shouldApplyPermissionFixForFsType("vfat", undefined), true);
  });

  it("denies non-FAT filesystems by default", () => {
    assert.equal(shouldApplyPermissionFixForFsType("ext4", undefined), false);
    assert.equal(shouldApplyPermissionFixForFsType("zfs", undefined), false);
  });

  it("allows explicitly approved non-FAT filesystems", () => {
    assert.equal(
      shouldApplyPermissionFixForFsType("ext4", {
        allowFsTypes: ["ext4"],
      }),
      true,
    );
  });

  it("respects policy enabled=false", () => {
    assert.equal(
      shouldApplyPermissionFixForFsType("exfat", {
        enabled: false,
      }),
      false,
    );
  });
});
