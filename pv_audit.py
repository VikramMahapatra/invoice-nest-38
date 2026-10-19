#!/usr/bin/env python3
"""
Read-only Kubernetes PV audit.

Creates a CSV with one row per PV-to-container mount relationship.
It does not create, delete, patch, or otherwise modify Kubernetes resources.

Requirements on the host where this runs:
  - kubectl configured for the intended cluster
  - Python 3
  - Access to list nodes, PVs, PVCs, pods, and storage classes

Usage:
  python3 pv_audit.py --environment Dev
  python3 pv_audit.py --environment Stage --output stage_pv_audit.csv

Environment is supplied by the operator because Kubernetes context "default"
does not reliably identify Dev vs Stage.
"""

import argparse
import csv
import json
import subprocess
import sys
from datetime import datetime, timezone


CSV_FIELDS = [
    "environment",
    "node",
    "namespace",
    "pod",
    "container",
    "pv",
    "pvc",
    "mount_path",
    "is_ephemeral",
    "is_non_ephemeral",
    "usage_status",
    "reclaim_policy",
    "storage_class",
    "capacity",
    "access_modes",
    "volume_type",
    "volume_source",
    "classification_reason",
]


def kubectl_json(*args):
    cmd = ["kubectl", *args, "-o", "json"]
    try:
        completed = subprocess.run(
            cmd, check=True, text=True, capture_output=True, timeout=180
        )
    except subprocess.TimeoutExpired:
        raise RuntimeError(f"Command timed out: {' '.join(cmd)}")
    except subprocess.CalledProcessError as exc:
        detail = (exc.stderr or exc.stdout or str(exc)).strip()
        raise RuntimeError(f"Command failed ({' '.join(cmd)}): {detail}")
    try:
        return json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"kubectl returned invalid JSON for {' '.join(cmd)}") from exc


def get_items(kind, *args):
    return kubectl_json("get", kind, *args).get("items", [])


def get_volume_source(pv):
    spec = pv.get("spec", {})
    # Identify the actual backing volume type; newer clusters commonly use CSI.
    for key in (
        "csi", "nfs", "local", "hostPath", "awsElasticBlockStore",
        "azureDisk", "azureFile", "gcePersistentDisk", "iscsi", "fc",
        "rbd", "cephfs", "cinder", "vsphereVolume", "glusterfs",
        "portworxVolume", "quobyte", "scaleIO", "storageos",
    ):
        if key in spec:
            source = spec[key]
            if key == "csi":
                return "CSI", source.get("driver", "")
            if key == "nfs":
                return "NFS", f"{source.get('server', '')}:{source.get('path', '')}"
            if key == "local":
                return "local", source.get("path", "")
            if key == "hostPath":
                return "hostPath", source.get("path", "")
            return key, json.dumps(source, sort_keys=True)
    return "unknown", ""


def pvc_key(namespace, name):
    return (namespace or "", name or "")


def storage_class_is_ephemeral(storage_class):
    """
    Best-effort hint only. A storage class name alone cannot prove lifecycle.
    """
    s = (storage_class or "").lower()
    hints = ("ephemeral", "emptydir", "empty-dir", "tmp", "temporary", "scratch")
    return any(hint in s for hint in hints)


def classify_pv(pv, claim, pod_volume_refs, pv_source_type):
    """
    Return (is_ephemeral, is_non_ephemeral, reason).

    True/False are only emitted where the available configuration supports a
    practical classification. Unknown is used when evidence is insufficient.
    """
    meta = pv.get("metadata", {})
    spec = pv.get("spec", {})
    pv_name = meta.get("name", "")
    pvc_name = (claim or {}).get("metadata", {}).get("name", "")
    sc = spec.get("storageClassName", "")
    reclaim = spec.get("persistentVolumeReclaimPolicy", "")
    lower_names = f"{pv_name} {pvc_name} {sc}".lower()

    # Strongest practical clue: a PV bound to a PVC explicitly used by a pod
    # whose volume is an ephemeral volume claim template is not always visible
    # as ephemeral in the PV itself. Treat names as a hint, not sole proof.
    name_hint = any(
        word in lower_names
        for word in ("ephemeral", "temporary", "scratch", "temp-volume", "tmp")
    )
    class_hint = storage_class_is_ephemeral(sc)

    # Kubernetes native ephemeral volumes (emptyDir, configMap, secret,
    # projected, CSI ephemeral) are defined on Pod specs, not as PVs.
    # Therefore a real PV is persistent storage by Kubernetes object semantics,
    # though its data may still be temporary by application convention.
    if name_hint or class_hint:
        return "Unknown", "Unknown", (
            "PV exists, but name/storage-class suggests temporary usage; "
            "confirm application lifecycle and PVC owner before classifying"
        )

    if spec.get("persistentVolumeReclaimPolicy") == "Retain":
        return "False", "True", "PersistentVolume with Retain reclaim policy"
    if spec.get("persistentVolumeReclaimPolicy") == "Delete":
        return "False", "True", (
            "PersistentVolume is still a PV; Delete is a reclaim policy after "
            "PVC release, not proof of ephemeral storage"
        )
    if pv_source_type in ("NFS", "CSI", "local", "hostPath"):
        return "False", "True", (
            f"PersistentVolume resource backed by {pv_source_type}; "
            "verify application lifecycle if data is intended to be temporary"
        )
    return "Unknown", "Unknown", "Insufficient evidence to classify lifecycle"


def main():
    parser = argparse.ArgumentParser(description="Export Kubernetes PV/container mapping to CSV")
    parser.add_argument(
        "--environment",
        required=True,
        help="Environment label to write in the CSV, e.g. Dev, Stage, or Unknown",
    )
    parser.add_argument(
        "--output",
        default="pv_audit.csv",
        help="Output CSV path (default: pv_audit.csv)",
    )
    args = parser.parse_args()

    # Verify current context, but do not assume its name proves the environment.
    context_result = subprocess.run(
        ["kubectl", "config", "current-context"],
        check=True, text=True, capture_output=True
    )
    context = context_result.stdout.strip()

    pvs = get_items("pv")
    pvcs = get_items("pvc", "-A")
    pods = get_items("pods", "-A")
    nodes = get_items("nodes")

    pvc_by_key = {}
    for pvc in pvcs:
        md = pvc.get("metadata", {})
        pvc_by_key[pvc_key(md.get("namespace"), md.get("name"))] = pvc

    node_names = {n.get("metadata", {}).get("name", "") for n in nodes}

    # For each bound PVC, record all pod/container volume mounts referring to it.
    mounts_by_pvc = {}
    for pod in pods:
        pod_md = pod.get("metadata", {})
        namespace = pod_md.get("namespace", "")
        pod_name = pod_md.get("name", "")
        pod_spec = pod.get("spec", {})
        pod_status = pod.get("status", {})
        node = pod_spec.get("nodeName", "")
        phase = pod_status.get("phase", "Unknown")

        volume_claims = {}
        for vol in pod_spec.get("volumes", []) or []:
            pvc_ref = (vol.get("persistentVolumeClaim") or {}).get("claimName")
            if pvc_ref:
                volume_claims[vol.get("name", "")] = pvc_ref

        for container_type in ("containers", "initContainers", "ephemeralContainers"):
            for container in pod_spec.get(container_type, []) or []:
                container_name = container.get("name", "")
                for vm in container.get("volumeMounts", []) or []:
                    vol_name = vm.get("name", "")
                    claim_name = volume_claims.get(vol_name)
                    if not claim_name:
                        # Not a PVC-backed mount (e.g. emptyDir, secret, configMap).
                        continue
                    key = pvc_key(namespace, claim_name)
                    mounts_by_pvc.setdefault(key, []).append({
                        "node": node,
                        "namespace": namespace,
                        "pod": pod_name,
                        "container": container_name,
                        "mount_path": vm.get("mountPath", ""),
                        "pod_phase": phase,
                        "container_type": container_type,
                        "volume_name": vol_name,
                    })

    rows = []
    for pv in pvs:
        md = pv.get("metadata", {})
        spec = pv.get("spec", {})
        status = pv.get("status", {})
        pv_name = md.get("name", "")
        claim_ref = spec.get("claimRef") or {}
        pvc_namespace = claim_ref.get("namespace", "")
        pvc_name = claim_ref.get("name", "")
        claim = pvc_by_key.get(pvc_key(pvc_namespace, pvc_name))
        reclaim = spec.get("persistentVolumeReclaimPolicy", "")
        sc = spec.get("storageClassName", "")
        capacity = (spec.get("capacity") or {}).get("storage", "")
        access_modes = ",".join(spec.get("accessModes") or [])
        source_type, source_detail = get_volume_source(pv)
        is_ephemeral, is_non_ephemeral, reason = classify_pv(
            pv, claim, mounts_by_pvc.get(pvc_key(pvc_namespace, pvc_name), []), source_type
        )
        claim_phase = (claim or {}).get("status", {}).get("phase", "")
        pv_phase = status.get("phase", "Unknown")
        matches = mounts_by_pvc.get(pvc_key(pvc_namespace, pvc_name), [])

        common = {
            "environment": args.environment,
            "pv": pv_name,
            "pvc": pvc_name,
            "reclaim_policy": reclaim,
            "storage_class": sc,
            "capacity": capacity,
            "access_modes": access_modes,
            "volume_type": source_type,
            "volume_source": source_detail,
            "classification_reason": reason,
        }

        if matches:
            for m in matches:
                rows.append({
                    **common,
                    "node": m["node"],
                    "namespace": m["namespace"],
                    "pod": m["pod"],
                    "container": m["container"],
                    "mount_path": m["mount_path"],
                    "is_ephemeral": is_ephemeral,
                    "is_non_ephemeral": is_non_ephemeral,
                    "usage_status": f"Mounted; pod_phase={m['pod_phase']}; pv_phase={pv_phase}; pvc_phase={claim_phase}",
                })
        else:
            rows.append({
                **common,
                "node": "",
                "namespace": pvc_namespace,
                "pod": "",
                "container": "",
                "mount_path": "",
                "is_ephemeral": is_ephemeral,
                "is_non_ephemeral": is_non_ephemeral,
                "usage_status": (
                    f"No pod/container PVC mount found in visible namespaces; "
                    f"pv_phase={pv_phase}; pvc_phase={claim_phase or 'PVC not found'}"
                ),
            })

    # Sort for review.
    rows.sort(key=lambda r: (
        r["environment"], r["namespace"], r["pv"], r["pod"], r["container"]
    ))

    with open(args.output, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Kubernetes context: {context}")
    print(f"Environment label supplied: {args.environment}")
    print(f"Nodes discovered: {len(node_names)}")
    print(f"PVs discovered: {len(pvs)}")
    print(f"PVCs discovered: {len(pvcs)}")
    print(f"Pods discovered: {len(pods)}")
    print(f"PV/container rows written: {len(rows)}")
    print(f"CSV written to: {args.output}")
    print("Note: lifecycle classification is conservative; review Unknown rows and names suggesting ephemeral storage.")


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, subprocess.CalledProcessError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        print(
            "Check kubectl context and read permissions for nodes, PVs, PVCs, pods, and storage classes.",
            file=sys.stderr,
        )
        sys.exit(1)
