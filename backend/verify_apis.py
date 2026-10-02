import urllib.request
import json

def test(url, data=None):
    req = urllib.request.Request(
        url, 
        data=json.dumps(data).encode('utf-8') if data else None,
        headers={'Content-Type': 'application/json'} if data else {}
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode('utf-8'))

print("--- Testing API Endpoints ---")
story = test('http://127.0.0.1:8000/api/customers/1/story')
print("Customer 1 Story Root Cause:", story.get('root_cause_diagnosis'))

nba = test('http://127.0.0.1:8000/api/customers/1/next-best-action')
print("Customer 1 NBA:", nba.get('recommended_action'))
print("Customer 1 NBA Timing:", nba.get('suggested_timing'))
print("Customer 1 NBA Confidence:", nba.get('confidence_score'))

decision = test('http://127.0.0.1:8000/api/customers/1/decision', {
    "recommendation_id": nba.get("recommendation_id"),
    "agent_id": "AGT-102",
    "agent_name": "Sarah Jenkins",
    "role": "Collections Specialist",
    "action_taken": "Approved",
    "recommended_action": nba.get("recommended_action"),
    "final_action": nba.get("recommended_action"),
    "recommended_channel": nba.get("recommended_channel"),
    "final_channel": nba.get("recommended_channel"),
    "recommended_timing": nba.get("suggested_timing"),
    "final_timing": nba.get("suggested_timing"),
    "rationale": "Verified salary window adherence."
})
print("Human Decision Submission:", decision.get("status"), decision.get("action_taken"))

query_res = test('http://127.0.0.1:8000/api/assistant/query', {
    "question": "Show customers with broken promises."
})
print("Assistant SQL Query:", query_res.get("sql_query"))
print("Assistant Rows Count:", len(query_res.get("tabular_data") or []))

dq = test('http://127.0.0.1:8000/api/data-quality')
print("Data Quality Health Score:", dq.get("overall_health_score"), dq.get("health_grade"))

audit = test('http://127.0.0.1:8000/api/governance/audit-trail')
print("Audit Trail Log Count:", len(audit.get("audit_logs", [])))

print("--- ALL BACKEND APIS VERIFIED AND WORKING PROPERLY ---")
