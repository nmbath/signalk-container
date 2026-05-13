import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { shouldApplyPermissionFixForMount } from "../containers.js";

describe("permission-fix policy", () => {
  it("allows FAT-like filesystems by default when UUID is known and mount is under watched root", () => {
    assert.equal(
      shouldApplyPermissionFixForMount("/mnt/backup", "exfat", "uuid-a", undefined),
      true,
    );
    assert.equal(
      shouldApplyPermissionFixForMount("/media/usb", "vfat", "uuid-b", undefined),
      true,
    );
  });

  it("denies when UUID is missing (no mountpoint fallback)", () => {
    assert.equal(
      shouldApplyPermissionFixForMount("/mnt/backup", "exfat", null, undefined),
      false,
    );
  });

  it("denies non-FAT filesystems by default and allows explicitly approved UUIDs", () => {
    assert.equal(
      shouldApplyPermissionFixForMount("/mnt/storage", "ext4", "uuid-e", undefined),
      false,
    );
    assert.equal(
      shouldApplyPermissionFixForMount("/mnt/storage", "ext4", "uuid-e", {
        allowedUuids: ["uuid-e"],
      }),
      true,
    );
  });

  it("denied UUID takes precedence", () => {
    assert.equal(
      shouldApplyPermissionFixForMount("/mnt/backup", "exfat", "uuid-a", {
        deniedUuids: ["uuid-a"],
      }),
      false,
    );
  });

  it("mount outside watched roots is denied", () => {
    assert.equal(
      shouldApplyPermissionFixForMount("/srv/data", "exfat", "uuid-a", {
        watchedRoots: ["/media", "/mnt"],
      }),
      false,
    );
  });

  it("respects policy enabled=false", () => {
    assert.equal(
      shouldApplyPermissionFixForMount("/mnt/backup", "exfat", "uuid-a", {
        enabled: false,
      }),
      false,
    );
  });
});
