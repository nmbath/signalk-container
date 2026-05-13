import React, { useEffect, useState } from "react";
import type { DiscoveredDevice } from "../types";

interface PermissionFixDiscoveryProps {
  onRefresh?: () => void;
  allowedUuids: string[];
  deniedUuids: string[];
  onSetUuidPolicy: (uuid: string, mode: "default" | "allow" | "deny") => void;
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
};

export function PermissionFixDiscovery({
  onRefresh,
  allowedUuids,
  deniedUuids,
  onSetUuidPolicy,
}: PermissionFixDiscoveryProps) {
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowedSet = new Set(allowedUuids.map((v) => v.toLowerCase()));
  const deniedSet = new Set(deniedUuids.map((v) => v.toLowerCase()));

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
                <th style={{ ...S.tableHeaderCell, width: "35%" }}>Mount Point</th>
                <th style={{ ...S.tableHeaderCell, width: "15%" }}>
                  Filesystem
                </th>
                <th style={{ ...S.tableHeaderCell, width: "20%" }}>UUID</th>
                <th style={{ ...S.tableHeaderCell, width: "20%" }}>Status</th>
                <th style={{ ...S.tableHeaderCell, width: "10%" }}>Override</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device, idx) => (
                <tr key={idx} style={S.tableRow}>
                  <td style={S.tableCell}>{device.mountPoint}</td>
                  <td style={S.tableCell}>{device.fsType || "unknown"}</td>
                  <td style={{ ...S.tableCell, ...S.uuid }}>
                    {device.uuid ? device.uuid.slice(0, 12) : "—"}
                  </td>
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
                    <select
                      disabled={!device.uuid}
                      value={
                        !device.uuid
                          ? "default"
                          : deniedSet.has(device.uuid.toLowerCase())
                            ? "deny"
                            : allowedSet.has(device.uuid.toLowerCase())
                              ? "allow"
                              : "default"
                      }
                      onChange={(e) => {
                        if (!device.uuid) return;
                        const mode = e.target.value as "default" | "allow" | "deny";
                        onSetUuidPolicy(device.uuid, mode);
                      }}
                      style={{
                        padding: "4px 6px",
                        fontSize: 11,
                        borderRadius: 4,
                        border: "1px solid #d1d5db",
                        width: "100%",
                        background: device.uuid ? "#fff" : "#f3f4f6",
                      }}
                    >
                      <option value="default">Default</option>
                      <option value="allow">Allow</option>
                      <option value="deny">Block</option>
                    </select>
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
