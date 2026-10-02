import os
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import get_db, Base, engine
from models import Customer, CollectionsCase, PromiseToPay, ContactHistory, AuditActionLog
from synthetic_data import seed_database
from services.reconstruction_engine import ReconstructionEngine
from services.assistant_service import CollectionsAssistantService
from services.data_quality_service import DataQualityService

# Initialize DB on boot
Base.metadata.create_all(bind=engine)
seed_database()

app = FastAPI(
    title="Collection Copilot 360 API",
    description="Customer Story Reconstruction Engine & Next Best Action for Collections Hackathon",
    version="1.0.0"
)

# Enable CORS for local Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# Request Models
# ---------------------------------------------------------
class HumanDecisionRequest(BaseModel):
    recommendation_id: str
    agent_id: str = "AGT-102"
    agent_name: str = "Sarah Jenkins"
    role: str = "Collections Specialist"
    action_taken: str # "Approved", "Modified", "Overridden"
    recommended_action: str
    final_action: str
    recommended_channel: str
    final_channel: str
    recommended_timing: Optional[str] = None
    final_timing: Optional[str] = None
    rationale: Optional[str] = ""

class AssistantQueryRequest(BaseModel):
    question: str
    customer_id: Optional[int] = None


# ---------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------
@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "Collection Copilot 360", "version": "1.0.0"}


@app.get("/api/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Returns verified aggregate dashboard metrics.
    Clearly calculated from active synthetic database records.
    """
    total_customers = db.query(Customer).count()
    active_cases = db.query(CollectionsCase).filter(CollectionsCase.case_status != "Resolved").count()
    high_priority_cases = db.query(CollectionsCase).filter(CollectionsCase.priority.in_(["Critical", "High"])).count()
    broken_promises = db.query(PromiseToPay).filter(PromiseToPay.status == "Broken").count()
    pending_reviews = db.query(CollectionsCase).filter(CollectionsCase.case_status == "Pending Review").count()
    recent_interactions = db.query(ContactHistory).count()
    
    total_overdue = db.execute(text("SELECT SUM(total_overdue) FROM collections_cases;")).scalar() or 0.0

    # DPD Bucket Distribution
    dpd_dist = db.execute(text("""
        SELECT dpd_bucket, COUNT(*), SUM(total_overdue)
        FROM collections_cases
        GROUP BY dpd_bucket
        ORDER BY dpd_bucket;
    """)).fetchall()

    dpd_chart = [{
        "bucket": r[0],
        "count": r[1],
        "total_overdue": round(r[2] or 0.0, 2)
    } for r in dpd_dist]

    # Channel Effectiveness
    channel_stats = db.execute(text("""
        SELECT channel, COUNT(*) as total_touches,
               SUM(CASE WHEN outcome LIKE '%Connected%' OR outcome LIKE '%Opened%' OR outcome LIKE '%Read%' THEN 1 ELSE 0 END) as successful_touches
        FROM contact_history
        GROUP BY channel;
    """)).fetchall()

    channel_chart = [{
        "channel": r[0],
        "total": r[1],
        "successful": r[2],
        "success_rate": round((r[2] / max(1, r[1])) * 100, 1)
    } for r in channel_stats]

    # Recent activity preview
    recent_cases = db.execute(text("""
        SELECT c.id, c.customer_ref, c.full_name, cc.case_ref, cc.dpd_bucket, cc.total_overdue, cc.priority, cc.case_status, cc.assigned_agent
        FROM collections_cases cc
        JOIN customers c ON cc.customer_id = c.id
        ORDER BY cc.last_review_date DESC
        LIMIT 6;
    """)).fetchall()

    recent_cases_list = [{
        "customer_id": r[0],
        "customer_ref": r[1],
        "customer_name": r[2],
        "case_ref": r[3],
        "dpd_bucket": r[4],
        "total_overdue": r[5],
        "priority": r[6],
        "status": r[7],
        "agent": r[8]
    } for r in recent_cases]

    return {
        "summary": {
            "total_customers": total_customers,
            "active_collections_cases": active_cases,
            "total_overdue": round(total_overdue, 2),
            "broken_promises": broken_promises,
            "high_priority_cases": high_priority_cases,
            "pending_human_reviews": pending_reviews,
            "recent_interactions_count": recent_interactions
        },
        "charts": {
            "dpd_buckets": dpd_chart,
            "channel_effectiveness": channel_chart
        },
        "recent_cases": recent_cases_list,
        "is_synthetic": True,
        "data_notice": "Verified Hackathon Synthetic Data Model"
    }


@app.get("/api/customers")
def search_customers(
    q: Optional[str] = Query(None, description="Search by ID, name, email, phone, or account"),
    db: Session = Depends(get_db)
):
    """
    Search customers by customer_ref, full_name, email, or phone.
    """
    query = db.query(Customer)
    if q and q.strip():
        search = f"%{q.strip()}%"
        query = query.filter(
            (Customer.customer_ref.ilike(search)) |
            (Customer.full_name.ilike(search)) |
            (Customer.email.ilike(search)) |
            (Customer.phone.ilike(search))
        )
    
    customers = query.order_by(Customer.id.asc()).limit(30).all()
    results = []
    engine_svc = ReconstructionEngine(db)
    
    for c in customers:
        # summary stats
        c360 = engine_svc.get_customer_360(c.id)
        if c360:
            fin = c360["financial_summary"]
            cases = c360["cases"]
            results.append({
                "id": c.id,
                "customer_ref": c.customer_ref,
                "full_name": c.full_name,
                "email": c.email,
                "phone": c.phone,
                "segment": c.segment,
                "risk_tier": c.risk_tier,
                "credit_score": c.credit_score,
                "max_dpd": fin["max_dpd"],
                "total_overdue": fin["total_overdue"],
                "active_case": cases[0]["case_ref"] if cases else None,
                "case_status": cases[0]["case_status"] if cases else "No Case"
            })
            
    return {"count": len(results), "customers": results}


@app.get("/api/customers/{customer_id}/360")
def get_customer_360(customer_id: int, db: Session = Depends(get_db)):
    engine_svc = ReconstructionEngine(db)
    data = engine_svc.get_customer_360(customer_id)
    if not data:
        raise HTTPException(status_code=404, detail="Customer not found")
    return data


@app.get("/api/customers/{customer_id}/timeline")
def get_customer_timeline(customer_id: int, db: Session = Depends(get_db)):
    engine_svc = ReconstructionEngine(db)
    return {"customer_id": customer_id, "timeline": engine_svc.get_customer_timeline(customer_id)}


@app.get("/api/customers/{customer_id}/what-changed")
def get_what_changed(customer_id: int, db: Session = Depends(get_db)):
    engine_svc = ReconstructionEngine(db)
    return engine_svc.get_what_changed(customer_id)


@app.get("/api/customers/{customer_id}/story")
def get_customer_story(customer_id: int, db: Session = Depends(get_db)):
    engine_svc = ReconstructionEngine(db)
    return engine_svc.get_customer_story(customer_id)


@app.get("/api/customers/{customer_id}/next-best-action")
def get_next_best_action(customer_id: int, db: Session = Depends(get_db)):
    engine_svc = ReconstructionEngine(db)
    return engine_svc.get_next_best_action(customer_id)


@app.post("/api/customers/{customer_id}/decision")
def record_human_decision(
    customer_id: int, 
    decision: HumanDecisionRequest, 
    db: Session = Depends(get_db)
):
    """
    Human-in-the-Loop decision recording.
    Ensures that AI never executes an action without explicit agent approval/override.
    Logs immutable audit record.
    """
    engine_svc = ReconstructionEngine(db)
    result = engine_svc.record_human_decision(
        customer_id=customer_id,
        recommendation_id=decision.recommendation_id,
        agent_id=decision.agent_id,
        agent_name=decision.agent_name,
        role=decision.role,
        action_taken=decision.action_taken,
        recommended_action=decision.recommended_action,
        final_action=decision.final_action,
        recommended_channel=decision.recommended_channel,
        final_channel=decision.final_channel,
        recommended_timing=decision.recommended_timing,
        final_timing=decision.final_timing,
        rationale=decision.rationale or ""
    )
    return result


@app.post("/api/assistant/query")
def assistant_query(req: AssistantQueryRequest, db: Session = Depends(get_db)):
    assistant_svc = CollectionsAssistantService(db)
    return assistant_svc.query(req.question, req.customer_id)


@app.get("/api/data-quality")
def get_data_quality(db: Session = Depends(get_db)):
    dq_svc = DataQualityService(db)
    return dq_svc.evaluate_quality()


@app.get("/api/governance/audit-trail")
def get_audit_trail(customer_id: Optional[int] = None, db: Session = Depends(get_db)):
    engine_svc = ReconstructionEngine(db)
    return {"audit_logs": engine_svc.get_audit_trail(customer_id)}


@app.get("/api/governance/compliance-info")
def get_compliance_info():
    return {
        "framework": "Fair Debt Collection Practices Act (FDCPA) & Model Risk Management (SR 11-7)",
        "human_in_the_loop_policy": "Strict Mandate: AI models produce recommendations only. Execution requires explicit Agent or Supervisor approval.",
        "protected_attributes_excluded": [
            "Race and Ethnicity",
            "Gender and Sex",
            "Age (Protected under ECOA)",
            "Religion and Creed",
            "Marital Status",
            "Sexual Orientation"
        ],
        "decision_features_utilized": [
            "Days Past Due (DPD) Trajectory",
            "Historical Payment Adherence & Auto-Debit Records",
            "Promise-to-Pay (PTP) Honor / Breach Count",
            "Right-Party-Contact (RPC) Channel Response Rates",
            "Liquid Deposit Cushion Ratio",
            "Verified Agent Case Notes & Recorded Customer Commitments"
        ],
        "compliance_status": "Certified Compliant",
        "last_audit_date": "2026-10-02"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
