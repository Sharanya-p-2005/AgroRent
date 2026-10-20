# AgroRent PostgreSQL Database Backup & Recovery Guide

This operational runbook provides production-tested procedures for backup, export, import, and point-in-time disaster recovery of the AgroRent PostgreSQL relational database.

---

## ⚠️ Critical Safety Directives

* **Never run destructive drop database commands** (`DROP DATABASE`, `DROP SCHEMA CASCADE`, or `TRUNCATE`) against production environments.
* Always verify that backup archives are readable and non-empty (`> 0 bytes`) before maintenance operations.
* Keep encrypted offsite replicas of database dumps adhering to the 3-2-1 backup strategy (3 copies, 2 media types, 1 offsite).
* Do not expose credentials or password parameters directly in shell history. Use `PGPASSWORD` or `.pgpass` file with strict permissions (`chmod 600 ~/.pgpass`).

---

## 1. Environment & Connection Configuration

AgroRent uses PostgreSQL 15+. Ensure PostgreSQL client utilities (`pg_dump`, `pg_restore`, `psql`) match or exceed the server engine version.

Connection parameter format:
```bash
# Set credentials securely for the current shell session
export PGHOST="localhost"
export PGPORT="5432"
export PGDATABASE="agrorent"
export PGUSER="postgres"
export PGPASSWORD="your_secure_password"
```

Or reference the connection URI directly:
```bash
DATABASE_URL="postgres://postgres:password@localhost:5432/agrorent"
```

---

## 2. Database Backup (Full Export)

### A. Compressed Custom Format Backup (Recommended for Production)
The PostgreSQL custom format (`-F c`) enables parallel multithreaded restores, table-level selective restoration, and integrated compression.

```bash
# 1. Create a timestamped backup directory
mkdir -p /var/backups/agrorent

# 2. Execute custom format dump
pg_dump -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE \
  --format=custom \
  --compress=9 \
  --verbose \
  --file="/var/backups/agrorent/agrorent_backup_$(date +%Y%m%d_%H%M%S).dump"
```

### B. Plain Text SQL Dump (Human-Readable Schema & Data)
Useful for version-controlled seed snapshots, audits, and text diffing:

```bash
pg_dump -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE \
  --format=plain \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  | gzip > "/var/backups/agrorent/agrorent_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
```

### C. Schema-Only Export (Structure without records)
```bash
pg_dump -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE \
  --schema-only \
  --file="/var/backups/agrorent/agrorent_schema_$(date +%Y%m%d).sql"
```

### D. Data-Only Export (Records without DDL statements)
```bash
pg_dump -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE \
  --data-only \
  --file="/var/backups/agrorent/agrorent_data_$(date +%Y%m%d).sql"
```

---

## 3. Database Restoration & Import

### A. Restoring Custom Format (`.dump`) into a Clean Database
Always restore into an empty or newly provisioned target database:

```bash
# 1. Create a dedicated database for verification or staging
createdb -h $PGHOST -p $PGPORT -U $PGUSER agrorent_restore_test

# 2. Restore using pg_restore with multithreading (-j)
pg_restore -h $PGHOST -p $PGPORT -U $PGUSER \
  -d agrorent_restore_test \
  --clean \
  --if-exists \
  --no-owner \
  --jobs=4 \
  --verbose \
  "/var/backups/agrorent/agrorent_backup_20260906_120000.dump"
```

### B. Restoring from Gzipped SQL (`.sql.gz`)
```bash
gunzip -c "/var/backups/agrorent/agrorent_backup_20260906_120000.sql.gz" | \
  psql -h $PGHOST -p $PGPORT -U $PGUSER -d agrorent
```

### C. Restoring Single Specific Tables (e.g. Audit Logs or Bookings)
Using the custom dump format, individual tables can be targeted:

```bash
pg_restore -h $PGHOST -p $PGPORT -U $PGUSER \
  -d agrorent \
  --table=audit_logs \
  --data-only \
  "/var/backups/agrorent/agrorent_backup_20260906_120000.dump"
```

---

## 4. Automated Backup Schedule (Cron Setup)

Configure daily backups with automated 14-day retention rotation:

Create `/usr/local/bin/agrorent_backup.sh`:
```bash
#!/bin/bash
set -eo pipefail

BACKUP_DIR="/var/backups/agrorent"
RETENTION_DAYS=14
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/agrorent_${TIMESTAMP}.dump"

mkdir -p "${BACKUP_DIR}"

# Execute dump using DATABASE_URL environment variable
pg_dump "${DATABASE_URL}" --format=custom --compress=9 --file="${BACKUP_FILE}"

echo "[$(date)] Backup created: ${BACKUP_FILE} ($(du -sh ${BACKUP_FILE} | cut -f1))"

# Prune backups older than retention window
find "${BACKUP_DIR}" -type f -name "agrorent_*.dump" -mtime +${RETENTION_DAYS} -delete
echo "[$(date)] Pruned backups older than ${RETENTION_DAYS} days."
```

Make executable and register with cron (`crontab -e`):
```cron
# Run daily at 02:00 AM UTC
0 2 * * * /usr/local/bin/agrorent_backup.sh >> /var/log/agrorent_backup.log 2>&1
```

---

## 5. Post-Restore Verification Checklist

After executing a restore, verify system integrity before opening traffic:

```sql
-- Verify key entity row counts
SELECT 'users' AS entity, count(*) FROM users
UNION ALL
SELECT 'equipment', count(*) FROM equipment
UNION ALL
SELECT 'equipment_bookings', count(*) FROM equipment_bookings
UNION ALL
SELECT 'animal_listings', count(*) FROM animal_listings
UNION ALL
SELECT 'animal_orders', count(*) FROM animal_orders
UNION ALL
SELECT 'payments', count(*) FROM payments
UNION ALL
SELECT 'audit_logs', count(*) FROM audit_logs;

-- Verify recent transactions
SELECT id, payment_reference, amount, payment_status, created_at 
FROM payments 
ORDER BY created_at DESC 
LIMIT 5;
```
