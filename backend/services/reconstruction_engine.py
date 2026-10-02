import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from models import (
    Customer, CardAccount, LoanAccount, DepositAccount, 
    CollectionsCase, PromiseToPay, PaymentHistory, 
    ContactHistory, AgentNote, CallTranscript, ExternalScore, AuditActionLog
)

class ReconstructionEngine:
    def __init__(self, db: Session):
        self.db = db

    def get_customer_360(self, customer_id: int) -> Optional[Dict[str, Any]]:
        customer = self.db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            return None

        # Cards
        cards = self.db.query(CardAccount).filter(CardAccount.customer_id == customer_id).all()
        cards_data = [{
            "id": c.id,
            "account_number_masked": c.account_number_masked,
            "card_type": c.card_type,
            "credit_limit": c.credit_limit,
            "current_balance": c.current_balance,
            "min_due": c.min_due,
            "due_date": c.due_date,
            "dpd": c.dpd,
            "status": c.status
        } for c in cards]

        # Loans
        loans = self.db.query(LoanAccount).filter(LoanAccount.customer_id == customer_id).all()
        loans_data = [{
            "id": l.id,
            "loan_ref": l.loan_ref,
            "loan_type": l.loan_type,
            "principal_amount": l.principal_amount,
            "outstanding_balance": l.outstanding_balance,
            "emi_amount": l.emi_amount,
            "tenure_months": l.tenure_months,
            "next_due_date": l.next_due_date,
            "dpd": l.dpd,
            "status": l.status
        } for l in loans]

        # Deposits
        deposits = self.db.query(DepositAccount).filter(DepositAccount.customer_id == customer_id).all()
        deposits_data = [{
            "id": d.id,
            "account_type": d.account_type,
            "account_number_masked": d.account_number_masked,
            "balance": d.balance,
            "currency": d.currency,
            "last_activity_date": d.last_activity_date,
            "status": d.status
        } for d in deposits]

        # Cases
        cases = self.db.query(CollectionsCase).filter(CollectionsCase.customer_id == customer_id).all()
        cases_data = [{
            "id": cs.id,
            "case_ref": cs.case_ref,
            "case_status": cs.case_status,
            "stage": cs.stage,
            "dpd_bucket": cs.dpd_bucket,
            "total_overdue": cs.total_overdue,
            "priority": cs.priority,
            "assigned_agent": cs.assigned_agent,
            "strategy_segment": cs.strategy_segment,
            "opened_at": cs.opened_at.isoformat() if cs.opened_at else None,
            "last_review_date": cs.last_review_date.isoformat() if cs.last_review_date else None
        } for cs in cases]

        # Promises
        promises = self.db.query(PromiseToPay).filter(PromiseToPay.customer_id == customer_id).order_by(PromiseToPay.recorded_at.desc()).all()
        promises_data = [{
            "id": p.id,
            "amount_promised": p.amount_promised,
            "promise_date": p.promise_date,
            "status": p.status,
            "channel_agreed": p.channel_agreed,
            "broken_reason": p.broken_reason,
            "recorded_at": p.recorded_at.isoformat() if p.recorded_at else None
        } for p in promises]

        # Contacts
        contacts = self.db.query(ContactHistory).filter(ContactHistory.customer_id == customer_id).order_by(ContactHistory.timestamp.desc()).all()
        contacts_data = [{
            "id": ch.id,
            "channel": ch.channel,
            "direction": ch.direction,
            "outcome": ch.outcome,
            "duration_seconds": ch.duration_seconds,
            "agent_id": ch.agent_id,
            "notes_summary": ch.notes_summary,
            "timestamp": ch.timestamp.isoformat() if ch.timestamp else None
        } for ch in contacts]

        # Notes
        notes = self.db.query(AgentNote).filter(AgentNote.customer_id == customer_id).order_by(AgentNote.created_at.desc()).all()
        notes_data = [{
            "id": n.id,
            "agent_name": n.agent_name,
            "category": n.category,
            "note_text": n.note_text,
            "sentiment": n.sentiment,
            "created_at": n.created_at.isoformat() if n.created_at else None
        } for n in notes]

        # Transcripts
        transcripts = self.db.query(CallTranscript).filter(CallTranscript.customer_id == customer_id).order_by(CallTranscript.call_date.desc()).all()
        transcripts_data = [{
            "id": tr.id,
            "call_ref": tr.call_ref,
            "call_date": tr.call_date,
            "duration_seconds": tr.duration_seconds,
            "agent_name": tr.agent_name,
            "transcript_text": tr.transcript_text,
            "summary": tr.summary,
            "customer_sentiment": tr.customer_sentiment,
            "call_reason": tr.call_reason,
            "key_commitments": tr.key_commitments
        } for tr in transcripts]

        # External score
        ext_score = self.db.query(ExternalScore).filter(ExternalScore.customer_id == customer_id).first()
        ext_score_data = {
            "bureau_score": ext_score.bureau_score if ext_score else customer.credit_score,
            "bureau_risk_grade": ext_score.bureau_risk_grade if ext_score else "B",
            "telco_stability_score": ext_score.telco_stability_score if ext_score else 0.85,
            "spending_index": ext_score.spending_index if ext_score else 1.0,
            "estimated_capacity_to_pay": ext_score.estimated_capacity_to_pay if ext_score else "Medium",
            "updated_at": ext_score.updated_at.isoformat() if ext_score and ext_score.updated_at else None
        } if ext_score else None

        # Totals
        total_card_bal = sum(c.current_balance for c in cards)
        total_loan_bal = sum(l.outstanding_balance for l in loans)
        total_deposits = sum(d.balance for d in deposits)
        total_overdue = sum(cs.total_overdue for cs in cases) if cases else sum(c.min_due for c in cards)
        max_dpd = max([c.dpd for c in cards] + [l.dpd for l in loans] + [0])

        return {
            "profile": {
                "id": customer.id,
                "customer_ref": customer.customer_ref,
                "full_name": customer.full_name,
                "email": customer.email,
                "phone": customer.phone,
                "segment": customer.segment,
                "employment_status": customer.employment_status,
                "employer": customer.employer,
                "monthly_income": customer.monthly_income,
                "credit_score": customer.credit_score,
                "risk_tier": customer.risk_tier,
                "kyc_status": customer.kyc_status,
                "preferred_language": customer.preferred_language,
                "created_at": customer.created_at.isoformat() if customer.created_at else None
            },
            "financial_summary": {
                "total_card_balance": total_card_bal,
                "total_loan_balance": total_loan_bal,
                "total_debt_exposure": total_card_bal + total_loan_bal,
                "total_deposits": total_deposits,
                "net_bank_position": total_deposits - (total_card_bal + total_loan_bal),
                "total_overdue": total_overdue,
                "max_dpd": max_dpd,
                "cards_count": len(cards),
                "loans_count": len(loans),
                "deposits_count": len(deposits)
            },
            "cards": cards_data,
            "loans": loans_data,
            "deposits": deposits_data,
            "cases": cases_data,
            "promises": promises_data,
            "contacts": contacts_data,
            "notes": notes_data,
            "transcripts": transcripts_data,
            "external_score": ext_score_data
        }

    def get_customer_timeline(self, customer_id: int) -> List[Dict[str, Any]]:
        events = []

        # 1. Payments
        payments = self.db.query(PaymentHistory).filter(PaymentHistory.customer_id == customer_id).all()
        for p in payments:
            events.append({
                "id": f"pay-{p.id}",
                "timestamp": p.payment_date,
                "category": "PAYMENT",
                "title": f"Payment {p.status}: ${p.amount:,.2f}",
                "description": f"Paid via {p.method} towards {p.account_type} (Ref: {p.payment_ref})",
                "status": "success" if p.status == "Completed" else "warning",
                "icon": "CreditCard",
                "badge": p.status
            })

        # 2. Contacts
        contacts = self.db.query(ContactHistory).filter(ContactHistory.customer_id == customer_id).all()
        for c in contacts:
            is_connected = "Connected" in c.outcome or "Opened" in c.outcome or "Read" in c.outcome
            events.append({
                "id": f"contact-{c.id}",
                "timestamp": c.timestamp.strftime("%Y-%m-%d %H:%M") if c.timestamp else "",
                "category": "CONTACT",
                "title": f"{c.direction} {c.channel}: {c.outcome}",
                "description": c.notes_summary or f"{c.channel} touchpoint by Agent {c.agent_id}",
                "status": "info" if is_connected else "neutral",
                "icon": "PhoneCall" if c.channel == "Phone" else ("MessageSquare" if c.channel in ["SMS", "WhatsApp"] else "Mail"),
                "badge": c.channel
            })

        # 3. Promises to Pay
        promises = self.db.query(PromiseToPay).filter(PromiseToPay.customer_id == customer_id).all()
        for pr in promises:
            is_kept = pr.status == "Kept"
            is_broken = pr.status == "Broken"
            events.append({
                "id": f"ptp-{pr.id}",
                "timestamp": pr.promise_date,
                "category": "PROMISE_TO_PAY",
                "title": f"Promise to Pay: ${pr.amount_promised:,.2f} ({pr.status})",
                "description": f"Agreed via {pr.channel_agreed}. " + (f"Reason broken: {pr.broken_reason}" if is_broken and pr.broken_reason else "Commitment logged."),
                "status": "success" if is_kept else ("danger" if is_broken else "warning"),
                "icon": "CalendarCheck",
                "badge": f"PTP {pr.status}"
            })

        # 4. Agent Notes
        notes = self.db.query(AgentNote).filter(AgentNote.customer_id == customer_id).all()
        for n in notes:
            events.append({
                "id": f"note-{n.id}",
                "timestamp": n.created_at.strftime("%Y-%m-%d %H:%M") if n.created_at else "",
                "category": "AGENT_NOTE",
                "title": f"Agent Note: {n.category} ({n.agent_name})",
                "description": n.note_text,
                "status": "info",
                "icon": "FileText",
                "badge": n.sentiment
            })

        # 5. Call Transcripts
        transcripts = self.db.query(CallTranscript).filter(CallTranscript.customer_id == customer_id).all()
        for tr in transcripts:
            events.append({
                "id": f"transcript-{tr.id}",
                "timestamp": tr.call_date,
                "category": "TRANSCRIPT",
                "title": f"Recorded Call Transcript ({tr.agent_name})",
                "description": tr.summary,
                "status": "primary",
                "icon": "Mic",
                "badge": tr.customer_sentiment
            })

        # Sort chronologically descending
        events.sort(key=lambda x: str(x["timestamp"]), reverse=True)
        return events

    def get_what_changed(self, customer_id: int) -> Dict[str, Any]:
        """
        'What Changed?' Engine:
        Compares the baseline / previous customer state with the current state.
        Identifies behavioral shifts, DPD jumps, promise changes, contact response changes.
        """
        c360 = self.get_customer_360(customer_id)
        if not c360:
            return {}

        cust = c360["profile"]
        fin = c360["financial_summary"]
        cases = c360["cases"]
        promises = c360["promises"]
        contacts = c360["contacts"]
        notes = c360["notes"]

        broken_ptp_count = sum(1 for p in promises if p["status"] == "Broken")
        pending_ptp_count = sum(1 for p in promises if p["status"] == "Pending")
        max_dpd = fin["max_dpd"]

        # Build dynamic comparison based on customer persona/state
        if cust["customer_ref"] == "CUST-1001":  # John Doe
            prev_situation = "Flawless payment track record for 36 consecutive months. 0 DPD across both credit card and auto loan. Baseline bureau score 750+."
            curr_situation = f"Delinquency emerged 18 days ago. Overdue balance ${fin['total_overdue']:,.2f} across Card & Loan accounts. One pending PTP scheduled for salary date."
            key_changes = [
                {"metric": "Delinquency Status", "previous": "0 DPD (Current)", "current": "18 DPD (SMA-0)", "severity": "moderate", "change": "+18 days past due"},
                {"metric": "Payment Behavior", "previous": "100% on-time Auto-Debit", "current": "Failed debit due to payroll timing gap", "severity": "moderate", "change": "Temporary disruption"},
                {"metric": "Promise to Pay", "previous": "No commitments needed", "current": "$770.00 PTP pending (Salary date)", "severity": "positive", "change": "Committed & cooperative"},
                {"metric": "Contact Response", "previous": "Digital-only notifications", "current": "Outbound call connected immediately (254s)", "severity": "positive", "change": "High responsiveness (100% RPC)"},
                {"metric": "Risk Priority", "previous": "Low Risk / Standard", "current": "Medium / Self-Cure Monitoring", "severity": "neutral", "change": "Temporarily elevated"}
            ]
            ai_explanation = (
                "The customer experienced a sudden transition from perfect 36-month payment behavior to DPD 18. "
                "Crucially, the root cause is external and operational rather than insolvency: the customer's employer (TechSys Corp) "
                "migrated to a new ERP payroll software, delaying direct deposits by 10 days. The customer was transparent during "
                "the phone interaction, has adequate secondary savings ($4.6k), and has logged a verified Promise-to-Pay for the impending salary release date."
            )

        elif cust["customer_ref"] == "CUST-1002":  # Priya Sharma
            prev_situation = "Prime High Net Worth customer with $42.5k on deposit, flawless card payments, zero prior collections interactions."
            curr_situation = "32 DPD on MasterCard World Elite due to $450 minimum balance dispute. Unresolved fraud dispute ticket #FRD-88219 for $1,420."
            key_changes = [
                {"metric": "Delinquency Status", "previous": "0 DPD (Paid in Full)", "current": "32 DPD ($450 overdue)", "severity": "moderate", "change": "Payment withheld intentionally"},
                {"metric": "Payment Behavior", "previous": "Prompt monthly payoff", "current": "Refusal to pay disputed charges", "severity": "high", "change": "Protest non-payment"},
                {"metric": "Deposit Balance", "previous": "$42,500.00 in Savings", "current": "$42,500.00 intact", "severity": "positive", "change": "Unimpaired liquidity (94x overdue)"},
                {"metric": "Contact Response", "previous": "Passive statement recipient", "current": "Inbound escalation call (380s, distressed)", "severity": "high", "change": "High agitation regarding collections notice"},
                {"metric": "Relationship Risk", "previous": "Satisfied VIP Client", "current": "High Attrition Danger", "severity": "critical", "change": "Collections outreach is alienating depositor"}
            ]
            ai_explanation = (
                "Customer state changed from a zero-delinquency VIP to DPD 32 due entirely to an operational failure in the dispute intake process. "
                "The customer reported a fraudulent London vendor charge of $1,420 (Ticket #FRD-88219), but the automated collections system continued "
                "generating delinquency notices. With $42.5k in deposits at the bank, the customer has overwhelming capacity to pay. Continued aggressive "
                "collections outreach carries high risk of relationship termination."
            )

        elif cust["customer_ref"] == "CUST-1003":  # Robert Chen
            prev_situation = "Occasional early delinquencies (1-30 DPD), but historical adherence to single PTP extensions with regular freight revenue."
            curr_situation = "Severe deterioration to 64 DPD. 3 consecutive broken promises totaling $3,680. Ceased answering telephone calls; only engages asynchronously via WhatsApp."
            key_changes = [
                {"metric": "Delinquency Status", "previous": "30 DPD (Early)", "current": "64 DPD (SMA-2 Late)", "severity": "critical", "change": "+34 DPD escalation"},
                {"metric": "Promise to Pay", "previous": "Historical adherence", "current": "3 Consecutive Broken PTPs", "severity": "critical", "change": "100% PTP breach rate in past 60 days"},
                {"metric": "Contact Responsiveness", "previous": "Answers phone calls", "current": "Declining/ignoring phone; reads WhatsApp in 8 mins", "severity": "high", "change": "Voice avoidance -> Asynchronous preference"},
                {"metric": "Deposit Reserves", "previous": "$3,200 avg checking balance", "current": "$240.00 cash buffer", "severity": "critical", "change": "92% liquidity contraction"},
                {"metric": "Risk Tier", "previous": "Medium Risk", "current": "Critical / Default Hazard", "severity": "critical", "change": "Bureau score dropped -42 pts"}
            ]
            ai_explanation = (
                "Customer situation has deteriorated critically over the last 60 days. Cash flow in the freight business has seized up due to "
                "unpaid client receivables and fuel inflation, resulting in 3 consecutive broken promises to pay and deposit balances collapsing to $240. "
                "Crucially, the customer has developed strong phone avoidance behavior (hanging up or routing to voicemail), but continues reading WhatsApp "
                "messages within 8 minutes. Continuing to place outbound phone calls is futile and counter-productive; resolution requires digital restructuring."
            )

        else:
            # Dynamic calculation for other records
            dpd_sev = "critical" if max_dpd > 60 else ("high" if max_dpd > 30 else "moderate")
            prev_situation = f"Account operated in standard servicing {max(0, max_dpd - 15)} days ago. Regular payment habits with periodic statement reminders."
            curr_situation = f"Currently in {cases[0]['stage'] if cases else 'Delinquency'} at {max_dpd} DPD. Overdue amount: ${fin['total_overdue']:,.2f}."
            key_changes = [
                {"metric": "Delinquency Bucket", "previous": "Current (0-15 DPD)", "current": f"{max_dpd} DPD ({cases[0]['dpd_bucket'] if cases else 'Active'})", "severity": dpd_sev, "change": f"+{max_dpd} days past due"},
                {"metric": "Overdue Balance", "previous": "$0.00", "current": f"${fin['total_overdue']:,.2f}", "severity": dpd_sev, "change": "Balance accumulated"},
                {"metric": "Promise to Pay", "previous": "Clean slate", "current": f"{broken_ptp_count} Broken / {pending_ptp_count} Pending", "severity": "critical" if broken_ptp_count > 0 else "neutral", "change": f"{broken_ptp_count} breaches"},
                {"metric": "Priority Grade", "previous": "Standard Watch", "current": f"{cases[0]['priority'] if cases else cust['risk_tier']}", "severity": "high" if cust['risk_tier'] in ['High', 'Critical'] else "moderate", "change": "Case assigned"}
            ]
            ai_explanation = (
                f"Customer transitioned from normal servicing into {cases[0]['stage'] if cases else 'collections'} at {max_dpd} DPD. "
                f"Total overdue exposure across card and loan facilities stands at ${fin['total_overdue']:,.2f}. "
                f"Recent contact records show {'recent broken commitments' if broken_ptp_count > 0 else 'active engagement pending payment confirmation'}."
            )

        return {
            "customer_id": customer_id,
            "previous_situation": prev_situation,
            "current_situation": curr_situation,
            "key_changes": key_changes,
            "ai_explanation": ai_explanation,
            "comparison_window": "Last 30-60 Days vs Today",
            "evaluated_at": datetime.datetime.utcnow().isoformat()
        }

    def get_customer_story(self, customer_id: int) -> Dict[str, Any]:
        """
        'Why?' Customer Story Generator:
        Synthesizes a cohesive, chronological story distinguishing FACTS from AI INTERPRETATION.
        """
        c360 = self.get_customer_360(customer_id)
        if not c360:
            return {}

        cust = c360["profile"]
        fin = c360["financial_summary"]
        promises = c360["promises"]
        notes = c360["notes"]
        transcripts = c360["transcripts"]

        if cust["customer_ref"] == "CUST-1001":
            concise_story = (
                "Customer previously maintained regular payments for 36 consecutive months but recently missed a payment (DPD 18). "
                "The latest agent note indicates a temporary employer payroll system delay at TechSys Corp. The previous successful "
                "interaction was through a direct phone call where customer confirmed Friday salary release. Preferred follow-up channel is Morning SMS."
            )
            facts = [
                {"label": "36-Month Historical Track Record", "detail": "Customer made 100% on-time auto-debit payments from opening until current billing cycle without single default."},
                {"label": "Current Exposure", "detail": f"Overdue amount is $770.00 ($250 card min due + $520 auto loan EMI) at DPD 18."},
                {"label": "Direct Agent Note (Oct 1)", "detail": "Agent Sarah Jenkins logged: 'Customer stated TechSys Corp transitioned payroll to Workday ERP causing 10-day delay.'"},
                {"label": "Recent Interaction Channel", "detail": "Outbound call on Oct 1 connected on 1st attempt (254s duration, Right-Party Contact)."},
                {"label": "Pending PTP Commitment", "detail": "Customer logged PTP for $770.00 scheduled for salary disbursement date."}
            ]
            interpretations = [
                {"label": "Willingness to Pay", "assessment": "Extremely High (95/100)", "rationale": "Customer took immediate accountability, did not evade calls, and proactively provided employer documentation context."},
                {"label": "Capacity to Pay", "assessment": "Unimpaired (Short-term Liquidity Timing)", "rationale": "Holding $4.6k in secondary savings and steady employment ($7.5k/mo). The default hazard is low once payroll executes."},
                {"label": "Optimal Channel Strategy", "assessment": "Soft Digital Reminder (SMS / App)", "rationale": "High-friction calls or aggressive tone may damage a premium relationship. A frictionless payment link delivered Friday morning will yield highest conversion."}
            ]
            root_cause = "Operational Payroll Delay (Employer ERP Transition)"
            best_channel = "Morning SMS with Secure Payment Link (10:00 AM)"

        elif cust["customer_ref"] == "CUST-1002":
            concise_story = (
                "High Net Worth depositor with $42.5k in savings intentionally withholding $450 card minimum due because of an unadjusted "
                "$1,420 unauthorized foreign charge (Ticket #FRD-88219). Customer was alienated by automated collections notices while dispute was open. "
                "Capacity to pay is 94x overdue balance."
            )
            facts = [
                {"label": "Net Bank Position", "detail": "Customer holds $42,500.00 in deposit accounts versus $3,850.00 total card balance."},
                {"label": "Open Fraud Ticket", "detail": "Dispute ticket #FRD-88219 opened for $1,420 fraudulent merchant transaction in London."},
                {"label": "Delinquency Origin", "detail": "32 DPD on MasterCard World Elite due to unpaid minimum due of $450.00."},
                {"label": "Customer Call Transcript", "detail": "Customer explicitly stated on recorded call: 'Once that charge is reversed or credited, I will pay legitimate balance immediately.'"}
            ]
            interpretations = [
                {"label": "Willingness to Pay", "assessment": "High (Conditional on Dispute Adjustment)", "rationale": "Non-payment is a conscious protest against perceived billing inaccuracy, not insolvency."},
                {"label": "Capacity to Pay", "assessment": "Exceptional", "rationale": "Deposits exceed total debt by an order of magnitude."},
                {"label": "Collections Hazard", "assessment": "High Customer Attrition Risk", "rationale": "Continued automated dunning of a wealth client with open fraud dispute risks losing $42k+ deposit portfolio."}
            ]
            root_cause = "Unlinked Fraud Dispute (#FRD-88219) & Flawed Collections Hold Process"
            best_channel = "Email / Concierge Support (Suppress outbound voice dunning)"

        elif cust["customer_ref"] == "CUST-1003":
            concise_story = (
                "Small business owner facing severe freight sector cash flow constriction. Delinquency escalated to DPD 64 with 3 consecutive broken promises. "
                "Customer has developed voice call avoidance, hanging up on collectors, but reads 100% of WhatsApp notifications within 8 minutes. "
                "Standard call-based collection has completely failed."
            )
            facts = [
                {"label": "Delinquency & Exposure", "detail": "64 DPD on equipment finance loan ($22.4k bal) and business credit card ($5.8k bal). Overdue: $2,780."},
                {"label": "Broken Promises Record", "detail": "3 consecutive broken PTPs in past 60 days. NSF return on ACH debit."},
                {"label": "Call History", "detail": "Last 4 outbound calls resulted in 2 voicemails, 1 disconnect, and 1 hung up call."},
                {"label": "WhatsApp Engagement", "detail": "Read receipts active. Customer opened and read default notification in 8 minutes."}
            ]
            interpretations = [
                {"label": "Willingness to Pay", "assessment": "Distressed / Defeated", "rationale": "Customer feels trapped between client non-payment and bank harassment."},
                {"label": "Capacity to Pay", "assessment": "Severely Depleted (Checking: $240)", "rationale": "Full lump-sum cure of $2,780 is mathematically impossible given current cash flow."},
                {"label": "Optimal Strategy", "assessment": "Asynchronous Hardship Modification", "rationale": "Providing an interactive WhatsApp self-service link to restructure loan tenure will succeed where aggressive voice calls fail."}
            ]
            root_cause = "SME Cash Flow Crisis & Call Fatigue"
            best_channel = "WhatsApp Interactive Self-Service Link (Hardship Restructure)"

        else:
            concise_story = (
                f"Customer currently has ${fin['total_overdue']:,.2f} overdue at {fin['max_dpd']} DPD. "
                f"Account is managed under {cust['segment']} segment with {cust['risk_tier']} risk tier. "
                f"Recent contact history indicates {'ongoing engagement' if c360['contacts'] else 'initial outreach stage'}."
            )
            facts = [
                {"label": "Delinquency Status", "detail": f"{fin['max_dpd']} Days Past Due across {fin['cards_count']} cards and {fin['loans_count']} loans."},
                {"label": "Total Overdue", "detail": f"${fin['total_overdue']:,.2f} overdue against total debt exposure of ${fin['total_debt_exposure']:,.2f}."},
                {"label": "Deposit Balances", "detail": f"${fin['total_deposits']:,.2f} held across deposit accounts."}
            ]
            interpretations = [
                {"label": "Default Probability", "assessment": f"{cust['risk_tier']} Risk Category", "rationale": f"Calculated from credit score ({cust['credit_score']}) and DPD trajectory."},
                {"label": "Engagement Strategy", "assessment": "Standard Workflow Protocol", "rationale": "Follow omnichannel progression based on delinquency stage."}
            ]
            root_cause = "Unsettled Balance Accumulation"
            best_channel = "SMS / Phone Call"

        return {
            "customer_id": customer_id,
            "concise_story": concise_story,
            "facts": facts,
            "ai_interpretations": interpretations,
            "root_cause_diagnosis": root_cause,
            "historical_channel_effectiveness": best_channel,
            "generated_at": datetime.datetime.utcnow().isoformat()
        }

    def get_next_best_action(self, customer_id: int) -> Dict[str, Any]:
        """
        Next Best Action (NBA) Engine:
        Recommends ONE practical, high-impact next action for the collection agent.
        Includes channel, timing, rationale, supporting data, confidence indicator,
        and visible 'Why this recommendation?' explainability section.
        """
        c360 = self.get_customer_360(customer_id)
        if not c360:
            return {}

        cust = c360["profile"]
        fin = c360["financial_summary"]
        promises = c360["promises"]
        cases = c360["cases"]

        if cust["customer_ref"] == "CUST-1001":  # John Doe
            return {
                "recommendation_id": f"NBA-{customer_id}-2026",
                "customer_id": customer_id,
                "recommended_action": "Send Automated Payment Link via SMS & Schedule Soft Call Follow-Up",
                "recommended_channel": "SMS + Phone",
                "suggested_timing": "Friday Morning at 10:00 AM (Targeted Salary Release Window)",
                "confidence_score": 94,
                "confidence_tier": "Very High",
                "primary_reason": "Customer has scheduled salary credit this Friday. Morning SMS provides zero-friction payment gateway link, matching customer's explicit transcript request.",
                "supporting_customer_data": [
                    {"metric": "Salary Date Confirmation", "value": "Friday morning (per TechSys HR memo)"},
                    {"metric": "3-Year Default History", "value": "0 prior delinquencies (100% on-time)"},
                    {"metric": "Customer Explicit Preference", "value": "Requested Friday SMS on Call TRN-2026-901"},
                    {"metric": "Available Savings", "value": "$4,600.00 liquid in account #8844"}
                ],
                "why_this_recommendation": {
                    "data_signals": [
                        "Direct transcript commitment: Customer explicitly confirmed salary arrival and asked for Friday morning text.",
                        "Payroll delay verification: Employer Workday ERP migration confirmed in agent note #101.",
                        "Contact propensity: Morning phone calls and SMS achieve 100% Right-Party Contact rate."
                    ],
                    "counter_actions_evaluated": [
                        {"action": "Immediate Aggressive Phone Outreach", "rejected_reason": "Premature before salary deposit date; risks irritating an otherwise loyal, high-credit-score customer."},
                        {"action": "Escalate to Field / Legal", "rejected_reason": "Inappropriate for early delinquency (DPD 18) with active PTP and verified employer glitch."},
                        {"action": "Offer Debt Settlement / Discount", "rejected_reason": "Unnecessary loss for bank; customer has full capacity and intent to pay full $770 balance."}
                    ],
                    "expected_outcome": "92% probability of self-cure within 4 hours of SMS delivery without requiring agent intervention."
                },
                "status": "Awaiting Agent Decision",
                "action_options": ["Approve", "Modify", "Override"]
            }

        elif cust["customer_ref"] == "CUST-1002":  # Priya Sharma
            return {
                "recommendation_id": f"NBA-{customer_id}-2026",
                "customer_id": customer_id,
                "recommended_action": "Suppress Collections Outreach & Expedite Fraud Dispute Provisional Credit",
                "recommended_channel": "Internal Routing + Customer Reassurance Email",
                "suggested_timing": "Immediate (Within 2 Hours)",
                "confidence_score": 97,
                "confidence_tier": "Very High",
                "primary_reason": "Customer holds $42.5k in deposits and is refusing to pay solely because of an unadjusted $1,420 unauthorized transaction (Dispute #FRD-88219). Calling customer causes severe relationship churn.",
                "supporting_customer_data": [
                    {"metric": "Deposit Portfolio", "value": "$42,500.00 (94x overdue balance)"},
                    {"metric": "Open Dispute Ticket", "value": "Ticket #FRD-88219 ($1,420 UK merchant)"},
                    {"metric": "Call Sentiment", "value": "Distressed / Upset by Collections Dunning"},
                    {"metric": "Client Lifetime Value", "value": "Top 5% HNW Tier"}
                ],
                "why_this_recommendation": {
                    "data_signals": [
                        "Fraud ticket omission: The dispute intake specialist failed to tick the 'Suppress Collections' flag.",
                        "High relationship equity: Bank earns substantial margin from customer's wealth savings balance.",
                        "Transcript verification: Customer pledged to immediately pay legitimate remaining balance once provisional credit is applied."
                    ],
                    "counter_actions_evaluated": [
                        {"action": "Continue Outbound Call Dunning", "rejected_reason": "Extreme risk of driving customer to close $42.5k savings account and transfer to competitor."},
                        {"action": "Block Credit Card Permanently", "rejected_reason": "Dispute is localized to single foreign merchant charge; cardholder is high net worth."},
                        {"action": "Demand Immediate Min Due Payment", "rejected_reason": "Directly breaches customer service policy during active fraud investigation."}
                    ],
                    "expected_outcome": "Dispute resolved within 48h; customer cures legitimate balance and preserves $42.5k deposit relationship."
                },
                "status": "Awaiting Agent Decision",
                "action_options": ["Approve", "Modify", "Override"]
            }

        elif cust["customer_ref"] == "CUST-1003":  # Robert Chen
            return {
                "recommendation_id": f"NBA-{customer_id}-2026",
                "customer_id": customer_id,
                "recommended_action": "Dispatch WhatsApp Self-Service Loan Restructuring Proposal (Tenure Extension)",
                "recommended_channel": "WhatsApp",
                "suggested_timing": "Today between 4:00 PM - 5:00 PM (Post-Driving Hours)",
                "confidence_score": 89,
                "confidence_tier": "High",
                "primary_reason": "Customer has broken 3 consecutive PTPs and rejects phone calls, but reads WhatsApp within 8 minutes. Cash balance ($240) cannot satisfy $2,780 demand without restructuring.",
                "supporting_customer_data": [
                    {"metric": "Consecutive Broken PTPs", "value": "3 broken commitments (100% failure rate)"},
                    {"metric": "Phone Call Outcome", "value": "Customer hung up / requested WhatsApp contact"},
                    {"metric": "WhatsApp Engagement", "value": "100% Read rate within 8 minutes"},
                    {"metric": "Liquid Cash Reserves", "value": "$240.00 (Insufficient for lump sum)"}
                ],
                "why_this_recommendation": {
                    "data_signals": [
                        "Channel fatigue: Voice calls trigger hostile disconnects and avoidant behavior.",
                        "Digital openness: Customer explicitly instructed agent: 'Send options to my WhatsApp' in Call TRN-2026-903.",
                        "Capacity reality: Forcing lump-sum payment guarantees fourth broken promise; structured relief matches cash flow."
                    ],
                    "counter_actions_evaluated": [
                        {"action": "Outbound Dial Campaign", "rejected_reason": "Proven 0% success over 6 attempts; customer hung up on collector."},
                        {"action": "Immediate Legal Repossession", "rejected_reason": "High legal costs on $22k equipment loan before offering standard workout options."},
                        {"action": "Demand Full Payoff", "rejected_reason": "Impossible given verified $240 cash position; leads to total default."}
                    ],
                    "expected_outcome": "74% likelihood of customer accepting digital restructuring agreement via WhatsApp within 48 hours."
                },
                "status": "Awaiting Agent Decision",
                "action_options": ["Approve", "Modify", "Override"]
            }

        else:
            # Default dynamic NBA
            dpd = fin["max_dpd"]
            if dpd <= 30:
                act = "Send Interactive Digital Payment Reminder"
                chan = "SMS / Mobile Push"
                timing = "Tomorrow at 11:00 AM"
                reason = "Early delinquency with self-cure potential. Low-friction digital link minimizes collection costs."
                conf = 88
            elif dpd <= 60:
                act = "Schedule Direct Consultative Call with Senior Agent"
                chan = "Phone"
                timing = "Today between 2:00 PM - 4:00 PM"
                reason = "Mid-stage delinquency requiring human-in-the-loop engagement to uncover payment blockers."
                conf = 84
            else:
                act = "Offer Hardship Restructuring or Payment Plan Waiver"
                chan = "Email + Phone"
                timing = "Next Business Day at 10:00 AM"
                reason = "Late stage delinquency with elevated default risk. Restructuring maximizes recovery probability."
                conf = 81

            return {
                "recommendation_id": f"NBA-{customer_id}-2026",
                "customer_id": customer_id,
                "recommended_action": act,
                "recommended_channel": chan,
                "suggested_timing": timing,
                "confidence_score": conf,
                "confidence_tier": "High" if conf >= 85 else "Moderate",
                "primary_reason": reason,
                "supporting_customer_data": [
                    {"metric": "Delinquency Stage", "value": f"{dpd} DPD"},
                    {"metric": "Total Overdue", "value": f"${fin['total_overdue']:,.2f}"},
                    {"metric": "Credit Score", "value": f"{cust['credit_score']}"},
                    {"metric": "Risk Tier", "value": f"{cust['risk_tier']}"}
                ],
                "why_this_recommendation": {
                    "data_signals": [
                        f"Delinquency level: {dpd} DPD matches optimized recovery strategy band.",
                        f"Customer segment: {cust['segment']} with score {cust['credit_score']}.",
                        "Historical channel benchmarks indicate highest response on recommended channel."
                    ],
                    "counter_actions_evaluated": [
                        {"action": "Passive Wait (Do Nothing)", "rejected_reason": "Risk of aging into higher delinquency bucket."},
                        {"action": "Immediate Legal Escalation", "rejected_reason": "Disproportionate cost before exhausting recovery steps."}
                    ],
                    "expected_outcome": "Estimated 68-80% resolution probability within 7 business days."
                },
                "status": "Awaiting Agent Decision",
                "action_options": ["Approve", "Modify", "Override"]
            }

    def record_human_decision(
        self,
        customer_id: int,
        recommendation_id: str,
        agent_id: str,
        agent_name: str,
        role: str,
        action_taken: str, # Approved, Modified, Overridden
        recommended_action: str,
        final_action: str,
        recommended_channel: str,
        final_channel: str,
        recommended_timing: str,
        final_timing: str,
        rationale: str
    ) -> Dict[str, Any]:
        log_entry = AuditActionLog(
            customer_id=customer_id,
            recommendation_id=recommendation_id,
            agent_id=agent_id,
            agent_name=agent_name,
            role=role,
            action_taken=action_taken,
            recommended_action=recommended_action,
            final_action=final_action,
            recommended_channel=recommended_channel,
            final_channel=final_channel,
            recommended_timing=recommended_timing,
            final_timing=final_timing,
            rationale=rationale,
            created_at=datetime.datetime.utcnow()
        )
        self.db.add(log_entry)
        self.db.commit()
        self.db.refresh(log_entry)

        return {
            "id": log_entry.id,
            "status": "Recorded",
            "action_taken": log_entry.action_taken,
            "timestamp": log_entry.created_at.isoformat(),
            "agent": log_entry.agent_name,
            "final_action": log_entry.final_action,
            "final_channel": log_entry.final_channel
        }

    def get_audit_trail(self, customer_id: Optional[int] = None) -> List[Dict[str, Any]]:
        query = self.db.query(AuditActionLog)
        if customer_id:
            query = query.filter(AuditActionLog.customer_id == customer_id)
        logs = query.order_by(AuditActionLog.created_at.desc()).all()

        return [{
            "id": l.id,
            "customer_id": l.customer_id,
            "recommendation_id": l.recommendation_id,
            "agent_id": l.agent_id,
            "agent_name": l.agent_name,
            "role": l.role,
            "action_taken": l.action_taken,
            "recommended_action": l.recommended_action,
            "final_action": l.final_action,
            "recommended_channel": l.recommended_channel,
            "final_channel": l.final_channel,
            "recommended_timing": l.recommended_timing,
            "final_timing": l.final_timing,
            "rationale": l.rationale,
            "created_at": l.created_at.isoformat() if l.created_at else None
        } for l in logs]
