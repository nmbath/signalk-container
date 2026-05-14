import React, { useEffect, useState } from "react";
import type { DiscoveredDevice } from "../types";

interface PermissionFixDiscoveryProps {
  onRefresh?: () => void;
  watchedRoots: string[];
  allowedMountPoints: string[];
  deniedMountPoints: string[];
  allowedUuids: string[];
  deniedUuids: string[];
  allowedSources: string[];
  deniedSources: string[];
  onSetRule: (
    device: DiscoveredDevice,
    target: "fixed" | "removable",
    mode: "default" | "allow" | "deny",
  ) => void;
}

const S: Record<string, React.CSSProperties> = {
  section: {
    padding: "14px",
    borderTop: "1px solid #e0e0e0",
  },
  title: {
    fontSize: 13,
    fontWeight: 600,
    color: "#888",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emptyState: {
    padding: "14px",
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: 12,
  },
  tableHeader: {
    background: "#f5f5f5",
    borderBottom: "1px solid #ddd",
    textAlign: "left" as const,
  },
  tableHeaderCell: {
    padding: "8px 10px",
    fontWeight: 600,
    color: "#555",
  },
  tableRow: {
    borderBottom: "1px solid #eee",
  },
  tableCell: {
    padding: "8px 10px",
    color: "#333",
    wordBreak: "break-word" as const,
  },
  allowedBadge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 12,
    background: "#dcfce7",
    color: "#166534",
    fontSize: 11,
    fontWeight: 600,
  },
  blockedBadge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 12,
    background: "#fee2e2",
    color: "#991b1b",
    fontSize: 11,
    fontWeight: 600,
  },
  uuid: {
    fontFamily: "monospace",
    fontSize: 11,
    color: "#666",
  },
  reason: {
    fontSize: 11,
    color: "#666",
  },
  controls: {
    display: "flex",
    gap: 8,
    marginBottom: 12,
  },
  refreshBtn: {
    padding: "4px 12px",
    fontSize: 12,
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontWeight: 500,
  },
  refreshBtnDisabled: {
    background: "#d1d5db",
    cursor: "not-allowed",
  },
  error: {
    padding: "8px 12px",
    background: "#fee2e2",
    border: "1px solid #fecaca",
    borderRadius: 4,
    color: "#991b1b",
    fontSize: 12,
    marginBottom: 10,
  },
  loading: {
    padding: "14px",
    fontSize: 12,
    color: "#666",
  },
  helpBox: {
    padding: "10px 12px",
    borderRadius: 6,
    border: "1px solid #dbeafe",
    background: "#eff6ff",
    color: "#1e3a8a",
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 1.45,
  },
  mountSource: {
    marginTop: 2,
    fontSize: 11,
    color: "#666",
    fontFamily: "monospace",
  },
};

export function PermissionFixDiscovery({
  onRefresh,
  watchedRoots,
  allowedMountPoints,
  deniedMountPoints,
  allowedUuids,
  deniedUuids,
  allowedSources,
  deniedSources,
  onSetRule,
}: PermissionFixDiscoveryProps) {
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowedMountSet = new Set(allowedMountPoints.map((v) => v.toLowerCase()));
  const deniedMountSet = new Set(deniedMountPoints.map((v) => v.toLowerCase()));
  const allowedSet = new Set(allowedUuids.map((v) => v.toLowerCase()));
  const deniedSet = new Set(deniedUuids.map((v) => v.toLowerCase()));
  const allowedSourceSet = new Set(allowedSources.map((v) => v.toLowerCase()));
  const deniedSourceSet = new Set(deniedSources.map((v) => v.toLowerCase()));

  const fetchDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "/plugins/signalk-container/api/permission-fix/discovered-devices",
      );
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices || []);
      } else {
        setError(`Failed to fetch: ${res.status} ${res.statusText}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setLoading(false);
    onRefresh?.();
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  return (
    <div>
      <div style={S.section}>
        <div style={S.title}>Permission-Fix Policy</div>
        <div style={S.helpBox}>
          <div>
            For each mount: choose <strong>how to match it</strong> and <strong>whether to include chmod permission-fix</strong>.
          </div>
          <div>
            <strong>Fixed mount</strong> stores rule by mount point (for example /mnt/storage).
          </div>
          <div>
            <strong>Removable device/share</strong> stores rule by UUID or source (server/path), so it still applies if mounted elsewhere.
          </div>
          <div>
            Note: removable devices often come back at the same path, but identity matching still protects you if the path changes.
          </div>
          <div>
            Only mounts under watched roots are shown: {watchedRoots.length > 0 ? watchedRoots.join(", ") : "(none)"}.
          </div>
        </div>
        <div style={S.controls}>
          <button
            style={
              loading
                ? { ...S.refreshBtn, ...S.refreshBtnDisabled }
                : S.refreshBtn
            }
            onClick={fetchDevices}
            disabled={loading}
          >
            {loading ? "Scanning..." : "Refresh"}
          </button>
        </div>

        {error && <div style={S.error}>{error}</div>}

        {loading ? (
          <div style={S.loading}>Scanning for mounted devices...</div>
        ) : devices.length === 0 ? (
          <div style={S.emptyState}>
            No removable media detected under watched roots.
          </div>
        ) : (
          <table style={S.table}>
            <thead style={S.tableHeader}>
              <tr>
                <th style={{ ...S.tableHeaderCell, width: "45%" }}>Mount</th>
                <th style={{ ...S.tableHeaderCell, width: "15%" }}>Type</th>
                <th style={{ ...S.tableHeaderCell, width: "15%" }}>Current</th>
                <th style={{ ...S.tableHeaderCell, width: "12%" }}>Match By</th>
                <th style={{ ...S.tableHeaderCell, width: "13%" }}>Decision</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device, idx) => (
                <tr key={idx} style={S.tableRow}>
                  <td style={S.tableCell}>
                    <div>{device.mountPoint}</div>
                    <div style={S.mountSource}>{device.source}</div>
                  </td>
                  <td style={S.tableCell}>{device.fsType || "unknown"}</td>
                  <td style={S.tableCell}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div
                        style={
                          device.allowed ? S.allowedBadge : S.blockedBadge
                        }
                      >
                        {device.allowed ? "✓ ALLOWED" : "✗ BLOCKED"}
                      </div>
                      <div style={S.reason}>{device.reason}</div>
                    </div>
                  </td>
                  <td style={S.tableCell}>
                    {(() => {
                      const mountKey = device.mountPoint.toLowerCase();
                      const sourceKey = device.source.toLowerCase();
                      const byMount =
                        deniedMountSet.has(mountKey) || allowedMountSet.has(mountKey);
                      const target: "fixed" | "removable" = byMount ? "fixed" : "removable";

                      const value =
                        target === "fixed"
                          ? deniedMountSet.has(mountKey)
                            ? "deny"
                            : allowedMountSet.has(mountKey)
                              ? "allow"
                              : "default"
                          : device.uuid
                            ? deniedSet.has(device.uuid.toLowerCase())
                              ? "deny"
                              : allowedSet.has(device.uuid.toLowerCase())
                                ? "allow"
                                : "default"
                            : deniedSourceSet.has(sourceKey)
                              ? "deny"
                              : allowedSourceSet.has(sourceKey)
                                ? "allow"
                                : "default";

                      return (
                        <select
                          value={target}
                          onChange={(e) => {
                            const nextTarget = e.target.value as "fixed" | "removable";
                            onSetRule(device, nextTarget, value as "default" | "allow" | "deny");
                          }}
                          style={{
                            padding: "4px 6px",
                            fontSize: 11,
                            borderRadius: 4,
                            border: "1px solid #d1d5db",
                            width: "100%",
                            background: "#fff",
                          }}
                        >
                          <option value="fixed">Fixed</option>
                          <option value="removable">Removable</option>
                        </select>
                      );
                    })()}
                  </td>
                  <td style={S.tableCell}>
                    {(() => {
                      const mountKey = device.mountPoint.toLowerCase();
                      const sourceKey = device.source.toLowerCase();
                      const byMount =
                        deniedMountSet.has(mountKey) || allowedMountSet.has(mountKey);
                      const target: "fixed" | "removable" = byMount ? "fixed" : "removable";
                      const value =
                        target === "fixed"
                          ? deniedMountSet.has(mountKey)
                            ? "deny"
                            : allowedMountSet.has(mountKey)
                              ? "allow"
                              : "default"
                          : device.uuid
                            ? deniedSet.has(device.uuid.toLowerCase())
                              ? "deny"
                              : allowedSet.has(device.uuid.toLowerCase())
                                ? "allow"
                                : "default"
                            : deniedSourceSet.has(sourceKey)
                              ? "deny"
                              : allowedSourceSet.has(sourceKey)
                                ? "allow"
                                : "default";
                      return (
                    <select
                      value={value}
                      onChange={(e) => {
                        const mode = e.target.value as "default" | "allow" | "deny";
                        onSetRule(device, target, mode);
                      }}
                      style={{
                        padding: "4px 6px",
                        fontSize: 11,
                        borderRadius: 4,
                        border: "1px solid #d1d5db",
                        width: "100%",
                        background: "#fff",
                      }}
                    >
                      <option value="default">Ignore</option>
                      <option value="allow">Include</option>
                      <option value="deny">Block</option>
                    </select>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
