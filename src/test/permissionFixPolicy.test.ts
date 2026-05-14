import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { shouldApplyPermissionFixForMount } from "../containers.js";

describe("permission-fix policy", () => {
  it("denies by default even with UUID and watched root", () => {
    assert.equal(
      shouldApplyPermissionFixForMount(
        "/mnt/backup",
        "/dev/sda1",
        "exfat",
        "uuid-a",
        undefined,
      ),
      false,
    );
  });

  it("allows explicitly approved UUIDs", () => {
    assert.equal(
      shouldApplyPermissionFixForMount(
        "/mnt/storage",
        "/dev/sdb1",
        "ext4",
        "uuid-e",
        {
          enabled: true,
          allowedUuids: ["uuid-e"],
        },
      ),
      true,
    );
  });

  it("denies when UUID is missing unless source is allowed", () => {
    assert.equal(
      shouldApplyPermissionFixForMount(
        "/mnt/backup",
        "server:/export",
        "nfs",
        null,
        { enabled: true },
      ),
      false,
    );
    assert.equal(
      shouldApplyPermissionFixForMount(
        "/mnt/backup",
        "server:/export",
        "nfs",
        null,
        {
          enabled: true,
          allowedSources: ["server:/export"],
        },
      ),
      true,
    );
  });

  it("denied UUID takes precedence over allowed UUID", () => {
    assert.equal(
      shouldApplyPermissionFixForMount(
        "/mnt/backup",
        "/dev/sda1",
        "exfat",
        "uuid-a",
        {
          enabled: true,
          allowedUuids: ["uuid-a"],
          deniedUuids: ["uuid-a"],
        },
      ),
      false,
    );
  });

  it("mount outside watched roots is denied", () => {
    assert.equal(
      shouldApplyPermissionFixForMount(
        "/srv/data",
        "/dev/sda1",
        "exfat",
        "uuid-a",
        {
          enabled: true,
          watchedRoots: ["/media", "/mnt"],
          allowedUuids: ["uuid-a"],
        },
      ),
      false,
    );
  });

  it("respects fixed mount-point rules", () => {
    assert.equal(
      shouldApplyPermissionFixForMount(
        "/mnt/storage",
        "/dev/sdc1",
        "ext4",
        "uuid-z",
        {
          enabled: true,
          allowedMountPoints: ["/mnt/storage"],
        },
      ),
      true,
    );
    assert.equal(
      shouldApplyPermissionFixForMount(
        "/mnt/storage",
        "/dev/sdc1",
        "ext4",
        "uuid-z",
        {
          enabled: true,
          allowedMountPoints: ["/mnt/storage"],
          deniedMountPoints: ["/mnt/storage"],
        },
      ),
      false,
    );
  });

  it("respects policy enabled=false", () => {
    assert.equal(
      shouldApplyPermissionFixForMount(
        "/mnt/backup",
        "/dev/sda1",
        "exfat",
        "uuid-a",
        {
          enabled: false,
          allowedUuids: ["uuid-a"],
        },
      ),
      false,
    );
  });
});
