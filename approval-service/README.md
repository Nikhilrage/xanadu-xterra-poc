# Approval Service POC

Small NestJS + Flowable proof of concept for project publishing approvals.

Workflow:

1. Project is created.
2. Flowable starts RERA and KYC checks in parallel.
3. A status API updates RERA with a `reraNumber`.
4. The same status API updates KYC with a `kycApproved` boolean.
5. If both pass, the admin publish task is auto-completed.
6. The project waits for super admin approval.
7. If super admin approves, the project becomes `PUBLISHED`.
8. If any check fails, Flowable terminates the process as rejected.

## Run

Start Flowable:

```bash
cd infrastructure
docker compose up flowable-postgres flowable -d
```

Flowable stores its workflow definitions, running tasks, variables, and history in
a dedicated PostgreSQL database. Connect from the host (or an ER diagram tool)
with:

```text
Host: localhost
Port: 9300
Database: flowable
Username: flowable
Password: flowable
```

To inspect the database from Docker:

```bash
docker exec -it flowable-postgres psql -U flowable -d flowable
```

Then list the Flowable tables or inspect common runtime/history records:

```sql
\dt
SELECT * FROM act_ru_task;
SELECT * FROM act_ru_variable;
SELECT * FROM act_hi_procinst;
SELECT * FROM act_hi_taskinst;
SELECT * FROM act_hi_varinst;
```

The local Flowable all-in-one image exposes BPMN REST APIs at:

```text
http://localhost:8080/flowable-task/process-api
```

The service defaults to `admin` / `test` for this image.

Start the Nest service:

```bash
cd approval-service
npm install
npm run start:dev
```

Create a project:

```bash
curl -X POST http://localhost:3010/approval/projects \
  -H 'Content-Type: application/json' \
  -d '{"projectName":"Xanadu Heights"}'
```

That returns a `processInstanceId`. Use it to approve RERA and KYC.

Approve both checks in one call:

```bash
curl -X PATCH http://localhost:3010/approval/projects/<processInstanceId>/checks \
  -H 'Content-Type: application/json' \
  -d '{"reraNumber":"RERA12345","kycApproved":true}'
```

After this, admin auto-completes and the process waits for super admin.

Super admin approves:

```bash
curl -X PATCH http://localhost:3010/approval/projects/<processInstanceId>/checks \
  -H 'Content-Type: application/json' \
  -d '{"superAdminApproved":true}'
```

Super admin rejects:

```bash
curl -X PATCH http://localhost:3010/approval/projects/<processInstanceId>/checks \
  -H 'Content-Type: application/json' \
  -d '{"superAdminApproved":false}'
```

Approve only RERA, leaving KYC pending:

```bash
curl -X PATCH http://localhost:3010/approval/projects/<processInstanceId>/checks \
  -H 'Content-Type: application/json' \
  -d '{"reraNumber":"RERA12345"}'
```

Reject KYC:

```bash
curl -X PATCH http://localhost:3010/approval/projects/<processInstanceId>/checks \
  -H 'Content-Type: application/json' \
  -d '{"kycApproved":false}'
```

Inspect a process:

```bash
curl http://localhost:3010/approval/processes/<processInstanceId>
```
