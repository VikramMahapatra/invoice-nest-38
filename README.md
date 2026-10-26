Log Collection: Collect queries.json and its rotated/archive files from Dremio Kubernetes pods across all three environments.

Centralized Storage: Copy the logs to a dedicated bucket on the DEV MinIO cluster, maintaining separate prefixes for DEV, STAGE, and PROD.

Data Ingestion: Develop a scheduled ingestion pipeline to parse JSON/archive files, validate records, handle duplicates, and track processing status.

Iceberg Integration: Store the structured query history in Apache Iceberg tables accessible through Dremio.

Analytics & Reporting: Build analytics to monitor query volume, execution duration, failures, workload trends, and environment-wise performance.

Monitoring & Reliability: Implement automated scheduling, retries, ingestion status tracking, and alerts for failures or missing logs.

Security: Apply appropriate access controls to protect query logs and sensitive SQL information.

Component	Suggested configuration
Collector	Every 15–60 minutes, or after archive rotation
Raw archive retention	According to your audit and storage policy
ETL job	Hourly initially
Manifest tracking	Every source file, checksum and processing status
Iceberg partitioning	Usually by query start date; assess volume before adding environment as another partition
Data quality	Required query ID, valid timestamps, deduplication and quarantine
Monitoring	Collection lag, failed uploads, failed ETL, duplicate count and Iceberg write errors
Recovery	Replay unprocessed archives without re-ingesting completed records

Analytics you can build on top
Query volume and failure rate by environment
Find slowest queries
Compare DEV, STAGE and PROD workloads
Queries per hour and per user.
Failure trends and repeated error patterns.
Peak query concurrency, if the source contains the necessary timing information.
Frequently accessed datasets and expensive SQL patterns.
Workload changes before and after a deployment.
Archive ingestion lag and missing log files.


dremio-query-analytics/
│
├── raw/
│   │
│   ├── dev/
│   │   └── coordinator/
│   │       ├── active-snapshots/
│   │       │   └── year=2026/
│   │       │       └── month=10/
│   │       │           └── day=26/
│   │       │
│   │       └── archives/
│   │           └── year=2026/
│   │               └── month=10/
│   │                   └── day=26/
│   │
│   ├── stage/
│   │   └── coordinator/
│   │       ├── active-snapshots/
│   │       │   └── year=2026/
│   │       │       └── month=10/
│   │       │           └── day=26/
│   │       │
│   │       └── archives/
│   │           └── year=2026/
│   │               └── month=10/
│   │                   └── day=26/
│   │
│   └── prod/
│       └── coordinator/
│           ├── active-snapshots/
│           │   └── year=2026/
│           │       └── month=10/
│           │           └── day=26/
│           │
│           └── archives/
│               └── year=2026/
│                   └── month=10/
│                       └── day=26/
│
├── quarantine/
│   ├── dev/
│   ├── stage/
│   └── prod/
│
├── manifests/
│   ├── dev/
│   ├── stage/
│   └── prod/
│
└── curated/                         # Optional physical prefix
    ├── jobs/
    ├── query_errors/
    └── daily_metrics/
