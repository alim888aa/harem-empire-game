PRAGMA foreign_keys = ON;
CREATE TABLE projects (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, repo TEXT NOT NULL UNIQUE,
  dark INTEGER NOT NULL DEFAULT 0 CHECK (dark IN (0,1)), budget_usd REAL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Ulaanbaatar'
);
CREATE TABLE audits (
  id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id),
  ran_at TEXT NOT NULL, through TEXT NOT NULL, posted INTEGER NOT NULL DEFAULT 0 CHECK (posted IN (0,1)), issue_url TEXT
);
CREATE TABLE work_items (
  id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id),
  kind TEXT NOT NULL CHECK (kind IN ('issue','pr')), number INTEGER NOT NULL, title TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'unknown', priority TEXT, opened_at TEXT NOT NULL, done_at TEXT,
  outcome TEXT NOT NULL CHECK (outcome IN ('merged','closed','not_planned','duplicate','reverted','superseded','open')),
  lines_changed INTEGER, review_rounds INTEGER NOT NULL DEFAULT 0,
  pings_human INTEGER NOT NULL DEFAULT 0, pings_owner INTEGER NOT NULL DEFAULT 0, pings_manager INTEGER NOT NULL DEFAULT 0,
  value_grade TEXT, value_why TEXT, audit_id TEXT REFERENCES audits(id),
  UNIQUE(project_id,kind,number)
);
CREATE TABLE agent_runs (
  id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id),
  work_item_id TEXT REFERENCES work_items(id), t3_thread_id TEXT,
  job TEXT NOT NULL DEFAULT 'unknown', round INTEGER CHECK (round >= 1),
  provider TEXT NOT NULL, model TEXT NOT NULL, started_at TEXT NOT NULL, ended_at TEXT,
  outcome TEXT NOT NULL CHECK (outcome IN ('done','failed','interrupted','unknown')),
  cost_usd REAL NOT NULL CHECK (cost_usd >= 0), estimated INTEGER NOT NULL CHECK (estimated IN (0,1)),
  source_key TEXT NOT NULL UNIQUE,
  attribution TEXT NOT NULL, pricing_note TEXT
);
CREATE INDEX agent_runs_project_end ON agent_runs(project_id,ended_at);
CREATE INDEX agent_runs_work ON agent_runs(work_item_id);
CREATE TABLE findings (
  id TEXT PRIMARY KEY, audit_id TEXT NOT NULL REFERENCES audits(id), lens TEXT NOT NULL,
  pattern TEXT NOT NULL, source TEXT, times_seen INTEGER NOT NULL DEFAULT 1,
  cost_usd REAL, kind TEXT NOT NULL CHECK (kind IN ('fix','call')), fix_pr_url TEXT
);
-- A run may span midnight. Keep spend on the day its tokens were used, not
-- the day the session finally closed. These are replaced, never incremented.
CREATE TABLE run_days (
  run_id TEXT NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id), local_day TEXT NOT NULL,
  cost_usd REAL NOT NULL CHECK (cost_usd >= 0), PRIMARY KEY(run_id,local_day)
);
CREATE INDEX run_days_project_day ON run_days(project_id,local_day);
CREATE TABLE work_item_links (
  issue_id TEXT NOT NULL REFERENCES work_items(id), pr_id TEXT NOT NULL REFERENCES work_items(id),
  PRIMARY KEY(issue_id,pr_id)
);
CREATE TABLE sync_state (
  project_id TEXT PRIMARY KEY REFERENCES projects(id), github_through TEXT, logs_through TEXT
);
CREATE VIEW daily_stats AS
WITH unique_pr AS (
  SELECT issue_id, min(pr_id) pr_id FROM work_item_links GROUP BY issue_id HAVING count(*) = 1
), change_costs AS (
  SELECT w.id, w.project_id, w.done_at, coalesce(sum(a.cost_usd),0) cost
  FROM work_items w LEFT JOIN agent_runs a ON a.work_item_id = w.id OR
    a.work_item_id IN (SELECT issue_id FROM unique_pr WHERE pr_id=w.id)
  WHERE w.kind='pr' AND w.outcome='merged' GROUP BY w.id
), ranked AS (
  SELECT c.*, date(c.done_at, '+8 hours') local_day,
    row_number() OVER (PARTITION BY c.project_id,date(c.done_at,'+8 hours') ORDER BY c.cost) rank,
    count(*) OVER (PARTITION BY c.project_id,date(c.done_at,'+8 hours')) n
  FROM change_costs c
), changes AS (
  SELECT project_id,local_day,count(*) merged_prs,avg(cost) average_cost_per_merged_change,
    avg(CASE WHEN rank IN ((n+1)/2,(n+2)/2) THEN cost END) median_cost_per_merged_change
  FROM ranked GROUP BY project_id,local_day
), issues AS (
  SELECT project_id,date(done_at,'+8 hours') local_day,count(*) done_issues FROM work_items
  WHERE kind='issue' AND outcome='closed' AND done_at IS NOT NULL GROUP BY project_id,local_day
), spend AS (
  SELECT d.project_id,d.local_day,sum(d.cost_usd) spend_usd,
    sum(CASE WHEN w.priority='P0' THEN d.cost_usd ELSE 0 END) p0_spend_usd,
    sum(CASE WHEN w.outcome IN ('not_planned','duplicate','reverted','superseded') OR
      (w.kind='pr' AND w.outcome='closed') THEN d.cost_usd ELSE 0 END) thrown_away_usd
  FROM run_days d JOIN agent_runs a ON a.id=d.run_id LEFT JOIN work_items w ON w.id=a.work_item_id
  GROUP BY d.project_id,d.local_day
), days AS (
  SELECT project_id,local_day FROM spend UNION SELECT project_id,local_day FROM changes
  UNION SELECT project_id,local_day FROM issues
)
SELECT days.project_id,days.local_day,coalesce(spend.spend_usd,0) spend_usd,
  coalesce(spend.p0_spend_usd,0) p0_spend_usd,coalesce(changes.merged_prs,0) merged_prs,
  coalesce(issues.done_issues,0) done_issues,changes.median_cost_per_merged_change,
  changes.average_cost_per_merged_change,coalesce(spend.thrown_away_usd,0) thrown_away_usd
FROM days LEFT JOIN spend USING(project_id,local_day) LEFT JOIN changes USING(project_id,local_day)
LEFT JOIN issues USING(project_id,local_day);
-- Preserve branch-to-item evidence after a PR falls outside the sync window.
CREATE TABLE branch_items (
  project_id TEXT NOT NULL REFERENCES projects(id), branch TEXT NOT NULL,
  work_item_id TEXT NOT NULL REFERENCES work_items(id), PRIMARY KEY(project_id,branch,work_item_id)
);

