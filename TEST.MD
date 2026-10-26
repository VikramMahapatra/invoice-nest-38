Hi Team,

I would like to propose the design and implementation of a centralized **Dremio Query History Analytics Platform** to collect, store, process, and analyze query execution data across our DEV, STAGE, and PROD Dremio environments running on Kubernetes.

The objective is to establish a scalable and reliable data pipeline that provides historical query visibility, execution performance analytics, failure analysis, and workload monitoring through Dremio SQL and reporting dashboards.

## 1. Proposed Architecture

The solution will use the existing `mc mirror`-based copy jobs for file collection and introduce a dedicated ingestion and analytics pipeline.

**End-to-end data flow:**

1. Dremio generates `queries.json` and rotated archive files in the coordinator pods across DEV, STAGE, and PROD.
2. Existing copy jobs transfer active-file snapshots and rotated archives to the DEV MinIO cluster.
3. A scheduled Kubernetes CronJob discovers new or updated objects in MinIO.
4. The ingestion process parses JSON records, validates the schema, enriches records with environment and source metadata, and identifies duplicate records.
5. Validated records are written to an Iceberg RAW table.
6. An incremental transformation process deduplicates records and loads the curated Iceberg tables.
7. Dremio SQL is used to query the curated tables and generate performance analytics, failure reports, and daily workload metrics.

## 2. MinIO Storage Design

**Bucket:** `dremio-query-analytics`

The following structure will maintain environment-level isolation and separate active snapshots from historical archives.

```text
dremio-query-analytics/
│
├── raw/
│   ├── dev/
│   │   └── coordinator/
│   │       ├── active-snapshots/
│   │       │   └── year=YYYY/month=MM/day=DD/
│   │       └── archives/
│   │           └── year=YYYY/month=MM/day=DD/
│   │
│   ├── stage/
│   │   └── coordinator/
│   │       ├── active-snapshots/
│   │       │   └── year=YYYY/month=MM/day=DD/
│   │       └── archives/
│   │           └── year=YYYY/month=MM/day=DD/
│   │
│   └── prod/
│       └── coordinator/
│           ├── active-snapshots/
│           │   └── year=YYYY/month=MM/day=DD/
│           └── archives/
│               └── year=YYYY/month=MM/day=DD/
│
├── quarantine/
│   ├── dev/
│   ├── stage/
│   └── prod/
│
└── manifests/
    ├── dev/
    ├── stage/
    └── prod/
```

**Folder responsibilities:**

- `raw/active-snapshots/`: Stores timestamped snapshots of the active `queries.json` file to capture recent completed-query records.
- `raw/archives/`: Stores rotated and compressed historical query log files.
- `quarantine/`: Holds copies of malformed, corrupted, or repeatedly unprocessable files, together with error details.
- `manifests/`: Provides file-level ingestion tracking, including checksums, processing status, record counts, and timestamps.

The original source files will be retained for auditing, recovery, and reprocessing. The existing copy jobs must preserve successive active-file snapshots rather than overwrite the only copy of `queries.json`. Archive files should also be retained independently.

## 3. Data Collection and Ingestion

A scheduled Kubernetes CronJob will run against the MinIO landing zone.

**Proposed processing workflow:**

1. Discover new or modified MinIO objects across all three environments.
2. Compare object keys, version identifiers, and checksums against the ingestion manifest.
3. Skip files that have already been successfully processed and have not changed.
4. Read JSON and supported compressed archive formats.
5. Parse query records and normalize timestamps, statuses, identifiers, and other available fields.
6. Add ingestion metadata, including environment, source filename, ingestion timestamp, and file checksum.
7. Validate mandatory fields and identify malformed records.
8. Deduplicate records within each incoming batch.
9. Write validated records into the Iceberg RAW table.
10. Incrementally reconcile and insert new logical query records into the CURATED tables.
11. Update the manifest after successful processing and trigger retries or quarantine handling on failure.

The ingestion process will be idempotent, allowing failed jobs to be restarted without creating duplicate logical records.

## 4. Iceberg Data Layer Design

The data platform will contain three logical layers.

**A. RAW Layer — `raw.dremio_query_history`**

Purpose:
- Store parsed records from all environments.
- Retain source file references and ingestion metadata.
- Support auditing and reprocessing.
- Preserve duplicate observations when the same query appears in multiple snapshots or archives.

**B. CURATED Layer — `curated.dremio_query_history`**

Purpose:
- Provide a clean, deduplicated query history table.
- Support query performance analysis and workload reporting.
- Retain one logical record per environment and query ID, subject to validation of the source identifier's uniqueness and stability.

Suggested columns include:

- `environment`
- `query_id`
- `query_text`
- `username`
- `start_time`
- `finish_time`
- `duration_ms`
- `outcome`
- `command_type`
- `source_file`
- `file_checksum`
- `ingested_at`
- `query_date`

The exact column mapping will be finalized after inspecting the JSON structure generated by our deployed Dremio version.

**C. Operational and Aggregate Tables**

- `ops.dremio_ingestion_manifest`: Tracks file discovery, processing status, checksums, record counts, and errors.
- `curated.dremio_query_errors`: Supports failure investigation and error trend analysis.
- `curated.dremio_daily_metrics`: Stores daily aggregate metrics for faster reporting.

The Iceberg tables will be registered through the supported catalog configured in our environment. MinIO will provide object storage; the catalog will manage Iceberg table metadata and commits.

## 5. Deduplication and Incremental Processing Strategy

To prevent duplicates without repeatedly scanning the entire historical table, the pipeline will use both file-level and record-level deduplication.

**File-level deduplication:**
- Track each source object using its environment, object key, version ID where available, and checksum.
- Avoid processing unchanged files repeatedly.
- Detect changed active snapshots even when the object name remains the same.

**Record-level deduplication:**
- Use `environment + query_id` as the initial logical key, after verifying that query IDs are unique and stable within each environment.
- Deduplicate incoming batches before writing to CURATED.
- Reconcile incoming records against existing records using a partition-aware anti-join or another measured, supported strategy.
- Insert only previously unseen logical records.
- If source records can change, apply explicit update rules rather than assuming every duplicate is identical.

The initial design will favor incremental, insert-only processing because Dremio's query logs are intended to record completed queries. Full-table `MERGE` operations will be avoided on the routine ingestion path unless performance testing demonstrates that they are appropriate.

The RAW layer will remain append-oriented, while the CURATED layer will enforce logical uniqueness through the ingestion pipeline.

## 6. Partitioning and Performance Optimization

To support growing query volumes, the following optimizations are proposed:

- Partition curated query history by query execution date.
- Consider environment as an additional partitioning dimension only if workload volume and partition sizes justify it.
- Process only newly discovered or changed source files.
- Batch records before writing to Iceberg to avoid excessive small files.
- Reconcile against only relevant historical partitions where the data model permits it.
- Schedule compaction and Iceberg maintenance based on observed file counts and query performance.
- Use pre-aggregated daily metrics for frequently accessed dashboard queries.

A durable query-key index may be introduced if historical key lookups become expensive or if duplicates can appear outside the expected date partitions.

## 7. Analytics and Reporting

The curated data will enable the following operational analytics through Dremio SQL.

**Query workload analytics**
- Total queries by environment, user, and time period.
- Query volume trends by hour and day.
- Frequently executed SQL statements and commonly accessed datasets.

**Performance analytics**
- Average, maximum, and percentile execution duration.
- Identification of long-running queries.
- Comparison of query performance across DEV, STAGE, and PROD.
- Data scanned and rows returned, where available in the source logs.

**Failure analytics**
- Failed-query counts and failure rates.
- Error message categorization.
- Repeated failures and affected users or datasets.
- Daily and weekly failure trends.

**Operational analytics**
- Ingestion lag and processing throughput.
- Number of source files discovered, processed, skipped, or quarantined.
- Duplicate record counts and records inserted into CURATED.
- Failed ingestion jobs and retry counts.

The resulting tables can support dashboards in Grafana or another approved reporting tool, subject to the available connectivity and integration options.

## 8. Error Handling, Recovery, and Data Quality

The pipeline will include the following controls:

- Validate JSON syntax and required query identifiers.
- Handle schema variations and missing optional fields.
- Retain malformed source files and record processing errors.
- Retry transient MinIO, catalog, and Iceberg write failures.
- Track ingestion states such as `DISCOVERED`, `PROCESSING`, `PROCESSED`, and `FAILED`.
- Update the manifest only after confirming successful processing.
- Make recovery idempotent in case a job succeeds in writing data but fails before updating the manifest.
- Reconcile source record counts against RAW and CURATED ingestion counts.

Quarantine will be used for persistent data-quality failures; temporary infrastructure failures will be retried before files are quarantined.

## 9. Security and Governance

Since query logs may contain SQL statements, usernames, dataset names, and other sensitive operational information, the implementation will include:

- Environment-specific MinIO access controls.
- Least-privilege service accounts and credentials managed through Kubernetes Secrets or an approved secret manager.
- TLS for data transfers.
- Restricted access to raw logs and query text.
- Retention policies for raw files, quarantine objects, and curated data.
- Auditable processing and administrative operations.

Access to the central DEV MinIO cluster and its analytics tables will need to be approved for collecting PROD query history.

## 10. Proposed Implementation Plan

**Phase 1 — Assessment**
- Validate log paths, filenames, archive formats, and rotation behavior across all three environments.
- Review existing `mc mirror` schedules and object overwrite behavior.
- Confirm the Iceberg catalog, MinIO storage configuration, and Dremio version.

**Phase 2 — MinIO Landing Zone**
- Create the bucket and environment-specific prefixes.
- Implement snapshot retention and archive preservation.
- Configure access policies and manifest storage.

**Phase 3 — Ingestion Pipeline**
- Develop the Kubernetes CronJob.
- Implement file discovery, parsing, validation, and retry handling.
- Populate the RAW Iceberg table and ingestion manifest.

**Phase 4 — Curated Data Processing**
- Implement batch deduplication and incremental reconciliation.
- Create curated query-history and error tables.
- Validate correctness using overlapping snapshots and archive files.

**Phase 5 — Analytics**
- Create SQL views and daily aggregate tables.
- Develop dashboards for query performance, failure trends, and environment comparisons.

**Phase 6 — Production Readiness**
- Perform volume and performance testing.
- Validate restart recovery and duplicate prevention.
- Configure monitoring, alerts, retention, and operational documentation.
- Roll out to STAGE and PROD following DEV validation and approval.

## 11. Expected Benefits

- Centralized historical query visibility across DEV, STAGE, and PROD.
- Improved query performance troubleshooting and workload optimization.
- Reliable retention of query history beyond the active log lifecycle.
- Reduced duplicate records through idempotent, incremental ingestion.
- Better operational visibility into ingestion failures and data quality.
- A scalable foundation for long-term Dremio workload analytics.

## 12. Decisions and Dependencies

Before implementation, we need to confirm:

1. The actual JSON schema and query ID behavior in our deployed Dremio version.
2. The Iceberg catalog and write capabilities available in the environment.
3. The retention and overwrite behavior of the existing `mc mirror` copy jobs.
4. The expected query volume and ingestion latency requirements.
5. The approved access model for collecting PROD data into the central DEV MinIO cluster.

I propose starting with a proof of concept in DEV, validating ingestion correctness and deduplication under repeated snapshots and archive overlap, and then extending the solution to STAGE and PROD.

Please review the proposed design and share your feedback or any additional requirements.

Regards,  
[Your Name]
