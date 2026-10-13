-- A PR without its own priority can inherit a single closing issue priority.
DROP VIEW daily_stats;
CREATE VIEW daily_stats AS
WITH unique_pr AS (
  SELECT issue_id, min(pr_id) pr_id FROM work_item_links GROUP BY issue_id HAVING count(*) = 1
), unique_issue AS (
  SELECT pr_id,min(issue_id) issue_id FROM work_item_links GROUP BY pr_id HAVING count(*) = 1
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
    sum(CASE WHEN w.priority='P0' OR (w.priority IS NULL AND linked_issue.priority='P0') THEN d.cost_usd ELSE 0 END) p0_spend_usd,
    sum(CASE WHEN w.outcome IN ('not_planned','duplicate','reverted','superseded') OR
      (w.kind='pr' AND w.outcome='closed') THEN d.cost_usd ELSE 0 END) thrown_away_usd
  FROM run_days d JOIN agent_runs a ON a.id=d.run_id LEFT JOIN work_items w ON w.id=a.work_item_id
  LEFT JOIN unique_issue ON unique_issue.pr_id=w.id LEFT JOIN work_items linked_issue ON linked_issue.id=unique_issue.issue_id
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

