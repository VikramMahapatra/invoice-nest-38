#!/usr/bin/env python3
"""Read-only Kubernetes storage audit: PV/PVC and pod/container volume mapping.

This script only reads Kubernetes resources and writes a local CSV. It does not
create, patch, or delete Kubernetes resources.

Examples:
  python3 pv_audit_improved.py --environment Dev --output dev_storage_audit.csv
  python3 pv_audit_improved.py --environment Stage --output stage_storage_audit.csv

IMPORTANT: --environment is only a label. Verify the active kubectl context and
cluster with your platform team before running against Dev or Stage.
"""
import argparse
import csv
import json
import subprocess
import sys

FIELDS = [
    "environment", "kubernetes_context", "node", "namespace", "pod", "pod_owner",
    "container", "container_type", "pod_volume", "volume_source_type", "volume_source",
    "pv", "pvc", "mount_path", "is_ephemeral", "is_non_ephemeral",
    "data_retention_intent", "verification_status", "usage_status", "reclaim_policy",
    "storage_class", "capacity", "access_modes", "classification_reason",
]


def kubectl_json(*args):
    cmd = ["kubectl", *args, "-o", "json"]
    try:
        p = subprocess.run(cmd, check=True, text=True, capture_output=True, timeout=180)
    except subprocess.TimeoutExpired as e:
        raise RuntimeError(f"Command timed out: {' '.join(cmd)}") from e
    except subprocess.CalledProcessError as e:
        detail = (e.stderr or e.stdout or str(e)).strip()
        raise RuntimeError(f"Command failed ({' '.join(cmd)}): {detail}") from e
    try:
        return json.loads(p.stdout)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Invalid JSON from: {' '.join(cmd)}") from e


def items(kind, *args):
    return kubectl_json("get", kind, *args).get("items", [])


def key(ns, name):
    return (ns or "", name or "")


def pv_source(pv):
    spec = (pv or {}).get("spec", {})
    keys = ["csi", "nfs", "local", "hostPath", "awsElasticBlockStore", "azureDisk",
            "azureFile", "gcePersistentDisk", "iscsi", "fc", "rbd", "cephfs",
            "cinder", "vsphereVolume", "glusterfs", "portworxVolume", "quobyte",
            "scaleIO", "storageos"]
    for k in keys:
        if k in spec:
            value = spec[k] or {}
            if k == "csi":
                return "CSI", value.get("driver", "")
            if k == "nfs":
                return "NFS", f"{value.get('server', '')}:{value.get('path', '')}"
            if k in ("local", "hostPath"):
                return k, value.get("path", "")
            return k, json.dumps(value, sort_keys=True)
    return "unknown", ""


def pod_owner(pod):
    refs = (pod.get("metadata", {}).get("ownerReferences") or [])
    if not refs:
        return ""
    ref = refs[0]
    return f"{ref.get('kind', '')}/{ref.get('name', '')}".strip("/")


def owner_uid(obj):
    for ref in (obj.get("metadata", {}).get("ownerReferences") or []):
        if ref.get("kind") == "Pod":
            return ref.get("uid", "")
    return ""


def pv_fields(pv):
    if not pv:
        return {"pv": "", "reclaim_policy": "", "storage_class": "", "capacity": "",
                "access_modes": "", "pv_source_type": "", "pv_source": ""}
    spec = pv.get("spec", {})
    source_type, source_detail = pv_source(pv)
    return {
        "pv": pv.get("metadata", {}).get("name", ""),
        "reclaim_policy": spec.get("persistentVolumeReclaimPolicy", ""),
        "storage_class": spec.get("storageClassName", ""),
        "capacity": (spec.get("capacity") or {}).get("storage", ""),
        "access_modes": ",".join(spec.get("accessModes") or []),
        "pv_source_type": source_type,
        "pv_source": source_detail,
    }


def classify(source_type, pvc_name, ephemeral_template, pv_exists):
    """Separate Kubernetes volume lifecycle from application data-retention intent."""
    if source_type in ("emptyDir", "generic_ephemeral", "csi_ephemeral"):
        label = {"emptyDir": "emptyDir pod volume", "generic_ephemeral": "Pod volume uses ephemeral.volumeClaimTemplate",
                 "csi_ephemeral": "CSI inline ephemeral volume"}[source_type]
        return "True", "False", "Unknown", "Auto-confirmed", label
    if source_type in ("PVC", "PV-only") or pvc_name or pv_exists:
        return ("False", "True", "Unknown", "Review application owner",
                "PVC/PV-backed storage survives pod replacement at Kubernetes volume level; intended data retention must be confirmed with workload configuration/owner")
    if source_type in ("configMap", "secret", "projected", "downwardAPI", "empty_source"):
        return "True", "False", "Not applicable", "Auto-confirmed", f"Pod-managed {source_type} volume; not a PV-backed data volume"
    return "Unknown", "Unknown", "Unknown", "Review required", "Volume lifecycle could not be determined from collected fields"


def main():
    parser = argparse.ArgumentParser(description="Read-only Kubernetes PV/PVC/pod storage audit")
    parser.add_argument("--environment", required=True, help="Verified label, e.g. Dev or Stage")
    parser.add_argument("--output", default="pv_audit.csv", help="Output CSV path")
    args = parser.parse_args()

    context = subprocess.run(["kubectl", "config", "current-context"], check=True,
                             text=True, capture_output=True).stdout.strip()
    pvs = items("pv")
    pvcs = items("pvc", "-A")
    pods = items("pods", "-A")
    nodes = items("nodes")
    pvc_map = {key(p.get("metadata", {}).get("namespace"), p.get("metadata", {}).get("name")): p for p in pvcs}
    pv_map = {p.get("metadata", {}).get("name", ""): p for p in pvs}
    pv_by_pvc = {}
    for pv in pvs:
        cr = pv.get("spec", {}).get("claimRef") or {}
        pv_by_pvc[key(cr.get("namespace"), cr.get("name"))] = pv

    # Generic ephemeral PVCs are owned by the pod. Index them by pod UID.
    generic_claims_by_pod_uid = {}
    for pvc in pvcs:
        uid = owner_uid(pvc)
        if uid:
            generic_claims_by_pod_uid.setdefault(uid, []).append(pvc)

    rows = []
    seen_pv_keys = set()
    for pod in pods:
        md = pod.get("metadata", {})
        spec = pod.get("spec", {})
        status = pod.get("status", {})
        ns, pname, puid = md.get("namespace", ""), md.get("name", ""), md.get("uid", "")
        node = spec.get("nodeName", "")
        phase = status.get("phase", "Unknown")
        pod_vols = spec.get("volumes", []) or []
        pod_claims = generic_claims_by_pod_uid.get(puid, [])
        claim_by_name = {c.get("metadata", {}).get("name", ""): c for c in pod_claims}

        for vol in pod_vols:
            vname = vol.get("name", "")
            pvc_name = ""
            pvc = None
            pv = None
            raw_type = "unknown"
            raw_source = ""
            is_generic = "ephemeral" in vol and bool(vol.get("ephemeral"))
            if vol.get("persistentVolumeClaim"):
                raw_type = "PVC"
                pvc_name = (vol.get("persistentVolumeClaim") or {}).get("claimName", "")
                pvc = pvc_map.get(key(ns, pvc_name))
                if pvc:
                    pv = pv_map.get((pvc.get("spec") or {}).get("volumeName", ""))
            elif is_generic:
                raw_type = "generic_ephemeral"
                template = (vol.get("ephemeral") or {}).get("volumeClaimTemplate") or {}
                template_name = (template.get("metadata") or {}).get("name", "")
                # Prefer owner-reference matching; expected name is a fallback.
                pvc = next((c for c in pod_claims if c.get("metadata", {}).get("name") == f"{pname}-{vname}"), None)
                if not pvc and template_name:
                    pvc = claim_by_name.get(f"{pname}-{vname}")
                if pvc:
                    pvc_name = pvc.get("metadata", {}).get("name", "")
                    pv = pv_map.get((pvc.get("spec") or {}).get("volumeName", ""))
                raw_source = "volumeClaimTemplate"
            elif vol.get("emptyDir") is not None:
                raw_type, raw_source = "emptyDir", json.dumps(vol.get("emptyDir") or {}, sort_keys=True)
            elif vol.get("csi"):
                raw_type, raw_source = "csi_ephemeral", json.dumps(vol.get("csi") or {}, sort_keys=True)
            elif vol.get("configMap"):
                raw_type, raw_source = "configMap", (vol.get("configMap") or {}).get("name", "")
            elif vol.get("secret"):
                raw_type, raw_source = "secret", (vol.get("secret") or {}).get("secretName", "")
            elif vol.get("projected") is not None:
                raw_type, raw_source = "projected", "projected sources"
            elif vol.get("downwardAPI") is not None:
                raw_type, raw_source = "downwardAPI", "pod metadata projection"
            else:
                raw_type = next((k for k in ("awsElasticBlockStore", "azureDisk", "azureFile", "cephfs", "cinder", "fc", "flexVolume", "flocker", "gcePersistentDisk", "gitRepo", "iscsi", "nfs", "photonPersistentDisk", "portworxVolume", "quobyte", "rbd", "scaleIO", "storageos", "vsphereVolume") if k in vol), "unknown")
                raw_source = json.dumps(vol.get(raw_type) or {}, sort_keys=True) if raw_type != "unknown" else ""

            if raw_type == "PVC":
                # Kubernetes PVCs are non-ephemeral volume claims, but application data intent may still be temporary.
                classification_type = "PVC"
            else:
                classification_type = raw_type
            pf = pv_fields(pv)
            ctype = pf.pop("pv_source_type")
            csource = pf.pop("pv_source")
            mounts = []
            for container_type in ("containers", "initContainers", "ephemeralContainers"):
                for container in spec.get(container_type, []) or []:
                    for mount in container.get("volumeMounts", []) or []:
                        if mount.get("name") == vname:
                            mounts.append((container_type, container.get("name", ""), mount.get("mountPath", "")))
            if not mounts:
                mounts = [("", "", "")]
            for container_type, container_name, mount_path in mounts:
                e, ne, retention, verification, reason = classify(classification_type, pvc_name, is_generic, bool(pv))
                # Preserve the pod-volume source, and include PV backing details separately.
                source_type = raw_type
                source = raw_source or (f"PV backing: {ctype} {csource}" if pv else csource)
                row = {
                    "environment": args.environment, "kubernetes_context": context, "node": node,
                    "namespace": ns, "pod": pname, "pod_owner": pod_owner(pod),
                    "container": container_name, "container_type": container_type,
                    "pod_volume": vname, "volume_source_type": source_type, "volume_source": source,
                    "pvc": pvc_name, "mount_path": mount_path, "is_ephemeral": e,
                    "is_non_ephemeral": ne, "data_retention_intent": retention,
                    "verification_status": verification,
                    "usage_status": f"Pod phase={phase}; PV={'bound/mapped' if pv else 'not mapped'}",
                    "classification_reason": reason,
                }
                row.update(pf)
                rows.append(row)
                if pf.get("pv"):
                    seen_pv_keys.add(pf["pv"])

    # Add PVs not referenced by any pod volume, so unmounted/unused PVs remain visible.
    for pv in pvs:
        name = pv.get("metadata", {}).get("name", "")
        if name in seen_pv_keys:
            continue
        spec = pv.get("spec", {})
        cr = spec.get("claimRef") or {}
        ns, claim_name = cr.get("namespace", ""), cr.get("name", "")
        claim = pvc_map.get(key(ns, claim_name))
        pf = pv_fields(pv)
        source_type = pf.pop("pv_source_type")
        source_detail = pf.pop("pv_source")
        row = {
            "environment": args.environment, "kubernetes_context": context, "node": "",
            "namespace": ns, "pod": "", "pod_owner": "", "container": "",
            "container_type": "", "pod_volume": "", "volume_source_type": "PV-only",
            "volume_source": f"{source_type}: {source_detail}", "pvc": claim_name,
            "mount_path": "", "is_ephemeral": "False", "is_non_ephemeral": "True",
            "data_retention_intent": "Unknown", "verification_status": "Review application/storage owner",
            "usage_status": f"No pod mount mapped; PV phase={(pv.get('status') or {}).get('phase', 'Unknown')}; PVC={'found' if claim else 'not found'}",
            "classification_reason": "PV is a persistent Kubernetes storage resource; no current pod mount was mapped. Intended data retention and whether it is orphaned require review.",
        }
        row.update(pf)
        rows.append(row)

    rows.sort(key=lambda r: (r["namespace"], r["pv"], r["pod"], r["container"], r["pod_volume"]))
    with open(args.output, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)

    print(f"Kubernetes context: {context}")
    print(f"Environment label supplied: {args.environment}")
    print(f"Nodes discovered: {len(nodes)} | PVs: {len(pvs)} | PVCs: {len(pvcs)} | Pods: {len(pods)}")
    print(f"Storage/container rows written: {len(rows)}")
    print(f"CSV written to: {args.output}")
    print("Ephemeral pod volume types are auto-classified; PVC/PV data-retention intent remains flagged for owner verification.")


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, subprocess.CalledProcessError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
