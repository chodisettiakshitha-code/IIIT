import datetime
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import (
    Customer, CardAccount, LoanAccount, DepositAccount, 
    CollectionsCase, PromiseToPay, PaymentHistory, 
    ContactHistory, AgentNote, CallTranscript, ExternalScore, AuditActionLog
)

def init_db():
    Base.metadata.create_all(bind=engine)

def seed_database():
    init_db()
    db: Session = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Customer).count() > 0:
            print("Database already contains records. Skipping seed.")
            return

        now = datetime.datetime.utcnow()
        
        # =========================================================================
        # Customer 1: John Doe (CUST-1001) - The "Salary Delay" Persona
        # =========================================================================
        c1 = Customer(
            customer_ref="CUST-1001",
            full_name="John Doe",
            email="john.doe@techsys.com",
            phone="+1-555-0142",
            segment="Salaried Professional",
            employment_status="Employed",
            employer="TechSys Corporation",
            monthly_income=7500.0,
            credit_score=745,
            risk_tier="Medium",
            kyc_status="Verified",
            preferred_language="English",
            created_at=now - datetime.timedelta(days=730)
        )
        db.add(c1)
        db.flush()

        # Accounts for John Doe
        db.add(CardAccount(
            customer_id=c1.id,
            account_number_masked="4111-XXXX-XXXX-8921",
            card_type="Visa Platinum Rewards",
            credit_limit=15000.0,
            current_balance=2840.0,
            min_due=250.0,
            due_date=(now - datetime.timedelta(days=18)).strftime("%Y-%m-%d"),
            dpd=18,
            status="Delinquent"
        ))
        db.add(LoanAccount(
            customer_id=c1.id,
            loan_ref="LN-AUTO-2023-991",
            loan_type="Auto Loan",
            principal_amount=28000.0,
            outstanding_balance=14200.0,
            emi_amount=520.0,
            tenure_months=60,
            next_due_date=(now - datetime.timedelta(days=18)).strftime("%Y-%m-%d"),
            dpd=18,
            status="SMA-0"
        ))
        db.add(DepositAccount(
            customer_id=c1.id,
            account_type="Checking",
            account_number_masked="9871-XXXX-3312",
            balance=1120.0,
            currency="USD",
            last_activity_date=(now - datetime.timedelta(days=2)).strftime("%Y-%m-%d"),
            status="Active"
        ))
        db.add(DepositAccount(
            customer_id=c1.id,
            account_type="Savings",
            account_number_masked="9871-XXXX-8844",
            balance=4600.0,
            currency="USD",
            last_activity_date=(now - datetime.timedelta(days=14)).strftime("%Y-%m-%d"),
            status="Active"
        ))

        case1 = CollectionsCase(
            customer_id=c1.id,
            case_ref="CASE-2026-1001",
            case_status="Pending Review",
            stage="Early Delinquency",
            dpd_bucket="1-30",
            total_overdue=770.0,
            priority="Medium",
            assigned_agent="Sarah Jenkins",
            strategy_segment="Self-Cure Potential",
            opened_at=now - datetime.timedelta(days=15),
            last_review_date=now - datetime.timedelta(days=1)
        )
        db.add(case1)
        db.flush()

        # Promise to Pay
        db.add(PromiseToPay(
            customer_id=c1.id,
            case_id=case1.id,
            amount_promised=770.0,
            promise_date=(now + datetime.timedelta(days=3)).strftime("%Y-%m-%d"),
            status="Pending",
            channel_agreed="Phone Call",
            broken_reason=None,
            recorded_at=now - datetime.timedelta(days=2)
        ))

        # Payment history (previously 100% on time)
        for i in range(1, 6):
            db.add(PaymentHistory(
                customer_id=c1.id,
                payment_ref=f"PAY-1001-{i}",
                account_type="Credit Card",
                amount=250.0,
                payment_date=(now - datetime.timedelta(days=30 * i + 18)).strftime("%Y-%m-%d"),
                status="Completed",
                method="Auto-Debit"
            ))
            db.add(PaymentHistory(
                customer_id=c1.id,
                payment_ref=f"PAY-1001-LN-{i}",
                account_type="Auto Loan",
                amount=520.0,
                payment_date=(now - datetime.timedelta(days=30 * i + 18)).strftime("%Y-%m-%d"),
                status="Completed",
                method="Auto-Debit"
            ))

        # Contact History
        db.add(ContactHistory(
            customer_id=c1.id,
            channel="Phone",
            direction="Outbound",
            outcome="Connected (Right Party Contact)",
            duration_seconds=254,
            agent_id="AGT-102",
            notes_summary="Customer answered promptly. Explained salary delay due to corporate ERP switch. Agreed to pay $770 on salary day.",
            timestamp=now - datetime.timedelta(days=2, hours=4)
        ))
        db.add(ContactHistory(
            customer_id=c1.id,
            channel="SMS",
            direction="Outbound",
            outcome="Delivered",
            duration_seconds=0,
            agent_id="SYS-AUTO",
            notes_summary="Automated payment reminder with secure payment link dispatched.",
            timestamp=now - datetime.timedelta(days=6)
        ))

        # Agent Notes
        db.add(AgentNote(
            customer_id=c1.id,
            agent_name="Sarah Jenkins",
            category="Salary Delay",
            note_text="Customer stated TechSys Corp transitioned payroll to Workday ERP this month causing a 10-day delay in bonus and salary disbursements. Very polite and transparent. Emphasized 3-year flawless banking record. PTP scheduled for 3 days out.",
            sentiment="Positive",
            created_at=now - datetime.timedelta(days=2, hours=3)
        ))
        db.add(AgentNote(
            customer_id=c1.id,
            agent_name="Mark Vance",
            category="Account Review",
            note_text="Pre-delinquency score was Tier-1 (800+). Deposits show consistent average quarterly balance over $5k. Low default hazard.",
            sentiment="Neutral",
            created_at=now - datetime.timedelta(days=12)
        ))

        # Call Transcripts
        db.add(CallTranscript(
            customer_id=c1.id,
            call_ref="TRN-2026-901",
            call_date=(now - datetime.timedelta(days=2, hours=4)).strftime("%Y-%m-%d %H:%M"),
            duration_seconds=254,
            agent_name="Sarah Jenkins",
            transcript_text="""Agent (Sarah Jenkins): Hello, am I speaking with Mr. John Doe?
Customer (John Doe): Yes, this is John.
Agent: Good morning Mr. Doe, calling from Apex Horizon Bank Collections & Account Support. I'm reaching out regarding your Visa Platinum card and auto loan EMI which are past due by 16 days, totaling $770.
Customer: Yes, Sarah, thank you for calling. I was actually about to call you folks. Our employer, TechSys Corp, underwent an enterprise ERP migration to Workday this cycle, which caused a temporary delay in payroll direct deposits across our department.
Agent: I understand completely, Mr. Doe. When do you anticipate the payroll credit to reflect?
Customer: HR confirmed all funds are scheduled to release this Friday morning. I will immediately clear the $770 outstanding balance on both accounts as soon as it hits.
Agent: That is wonderful. May I log a Promise-to-Pay for $770 for Friday?
Customer: Absolutely, please do. And feel free to shoot me a text reminder on Friday morning. Morning calls or SMS work best for me.
Agent: Recorded. Thank you for your cooperation Mr. Doe, have a great day.""",
            summary="Customer explained employer ERP payroll delay. Confirmed funds will clear Friday. Explicitly requested Friday morning SMS reminder and confirmed phone/SMS preference.",
            customer_sentiment="Cooperative & Receptive",
            call_reason="Early Delinquency Outreach (DPD 16)",
            key_commitments="Pay $770 on Friday upon salary deposit."
        ))

        # External Score
        db.add(ExternalScore(
            customer_id=c1.id,
            bureau_score=745,
            bureau_risk_grade="A-",
            telco_stability_score=0.95,
            spending_index=0.91,
            estimated_capacity_to_pay="High",
            updated_at=now - datetime.timedelta(days=10)
        ))


        # =========================================================================
        # Customer 2: Priya Sharma (CUST-1002) - The "Disputed Charge" Persona
        # =========================================================================
        c2 = Customer(
            customer_ref="CUST-1002",
            full_name="Priya Sharma",
            email="priya.sharma@horizonbrands.io",
            phone="+1-555-0189",
            segment="High Net Worth (HNW)",
            employment_status="Employed",
            employer="Horizon Brands Global",
            monthly_income=9400.0,
            credit_score=782,
            risk_tier="Low",
            kyc_status="Verified",
            preferred_language="English",
            created_at=now - datetime.timedelta(days=1100)
        )
        db.add(c2)
        db.flush()

        db.add(CardAccount(
            customer_id=c2.id,
            account_number_masked="5424-XXXX-XXXX-1992",
            card_type="MasterCard World Elite",
            credit_limit=25000.0,
            current_balance=3850.0,
            min_due=450.0,
            due_date=(now - datetime.timedelta(days=32)).strftime("%Y-%m-%d"),
            dpd=32,
            status="Delinquent"
        ))
        db.add(DepositAccount(
            customer_id=c2.id,
            account_type="Savings",
            account_number_masked="1022-XXXX-7701",
            balance=42500.0,
            currency="USD",
            last_activity_date=(now - datetime.timedelta(days=1)).strftime("%Y-%m-%d"),
            status="Active"
        ))

        case2 = CollectionsCase(
            customer_id=c2.id,
            case_ref="CASE-2026-1002",
            case_status="Pending Review",
            stage="Mid Delinquency",
            dpd_bucket="31-60",
            total_overdue=450.0,
            priority="Low",
            assigned_agent="David Miller",
            strategy_segment="Dispute & High Relationship Value",
            opened_at=now - datetime.timedelta(days=28),
            last_review_date=now - datetime.timedelta(days=2)
        )
        db.add(case2)
        db.flush()

        db.add(ContactHistory(
            customer_id=c2.id,
            channel="Phone",
            direction="Inbound",
            outcome="Connected (Right Party Contact)",
            duration_seconds=380,
            agent_id="AGT-108",
            notes_summary="Customer called agitated regarding automated late notices while dispute #FRD-88219 is open.",
            timestamp=now - datetime.timedelta(days=8)
        ))
        db.add(ContactHistory(
            customer_id=c2.id,
            channel="Email",
            direction="Outbound",
            outcome="Email Opened",
            duration_seconds=0,
            agent_id="SYS-AUTO",
            notes_summary="Automated statement dispatch.",
            timestamp=now - datetime.timedelta(days=14)
        ))

        db.add(AgentNote(
            customer_id=c2.id,
            agent_name="David Miller",
            category="Dispute",
            note_text="CRITICAL: Customer holds $42.5k in deposits with our wealth division. The delinquency of $450 is linked to an ongoing merchant fraud investigation (Ticket #FRD-88219 for $1,420 from UK merchant). Customer refuses to pay min due until fraudulent line item is removed. Collections outreach MUST be suppressed to avoid client attrition.",
            sentiment="Distressed",
            created_at=now - datetime.timedelta(days=8)
        ))

        db.add(CallTranscript(
            customer_id=c2.id,
            call_ref="TRN-2026-902",
            call_date=(now - datetime.timedelta(days=8)).strftime("%Y-%m-%d %H:%M"),
            duration_seconds=380,
            agent_name="David Miller",
            transcript_text="""Customer (Priya Sharma): Why am I receiving robotic collections notices when I explicitly opened a fraud dispute two weeks ago?
Agent (David Miller): Ms. Sharma, I apologize sincerely. Let me pull up your account immediately.
Customer: I have banked with Apex Horizon for 5 years, I have over forty thousand dollars sitting in my savings account. I was billed $1,420 for an electronics purchase in London while I was in Seattle! Your fraud team assured me the minimum due would be suppressed while Case #FRD-88219 was under review.
Agent: You are completely right, Ms. Sharma. I see the open ticket #FRD-88219 here. The collections hold flag was unfortunately omitted during the fraud intake. I am escalating this to dispute operations right now to apply an immediate provisional credit and suppress all automated collections.
Customer: Thank you. Once that charge is reversed or credited, I will pay the legitimate $430 balance immediately.
Agent: Understood and noted in your master file.""",
            summary="Customer reported dispute #FRD-88219 for $1,420 fraudulent foreign transaction. Upset by collections outreach despite $42.5k deposit balances. Agreed to settle legitimate balance upon provisional credit.",
            customer_sentiment="Frustrated with Process / High Loyalty Potential",
            call_reason="Dispute Escalation & Inbound Complaint",
            key_commitments="Will pay balance once provisional credit is applied."
        ))

        db.add(ExternalScore(
            customer_id=c2.id,
            bureau_score=782,
            bureau_risk_grade="A",
            telco_stability_score=0.98,
            spending_index=1.22,
            estimated_capacity_to_pay="Very High",
            updated_at=now - datetime.timedelta(days=15)
        ))


        # =========================================================================
        # Customer 3: Robert Chen (CUST-1003) - The "Serial Broken Promise" Persona
        # =========================================================================
        c3 = Customer(
            customer_ref="CUST-1003",
            full_name="Robert Chen",
            email="rchen.logistics@chenexpress.com",
            phone="+1-555-0177",
            segment="Small Business Owner",
            employment_status="Self-employed",
            employer="Chen Express Freight",
            monthly_income=4200.0,
            credit_score=588,
            risk_tier="Critical",
            kyc_status="Verified",
            preferred_language="English",
            created_at=now - datetime.timedelta(days=450)
        )
        db.add(c3)
        db.flush()

        db.add(CardAccount(
            customer_id=c3.id,
            account_number_masked="4000-XXXX-XXXX-6512",
            card_type="Visa Business Gold",
            credit_limit=6000.0,
            current_balance=5890.0,
            min_due=820.0,
            due_date=(now - datetime.timedelta(days=64)).strftime("%Y-%m-%d"),
            dpd=64,
            status="Delinquent"
        ))
        db.add(LoanAccount(
            customer_id=c3.id,
            loan_ref="LN-BIZ-2024-512",
            loan_type="Equipment Finance",
            principal_amount=35000.0,
            outstanding_balance=22400.0,
            emi_amount=980.0,
            tenure_months=48,
            next_due_date=(now - datetime.timedelta(days=64)).strftime("%Y-%m-%d"),
            dpd=64,
            status="SMA-2"
        ))
        db.add(DepositAccount(
            customer_id=c3.id,
            account_type="Checking",
            account_number_masked="6543-XXXX-1109",
            balance=240.0,
            currency="USD",
            last_activity_date=(now - datetime.timedelta(days=4)).strftime("%Y-%m-%d"),
            status="Active"
        ))

        case3 = CollectionsCase(
            customer_id=c3.id,
            case_ref="CASE-2026-1003",
            case_status="Open",
            stage="Late Delinquency",
            dpd_bucket="61-90",
            total_overdue=2780.0,
            priority="Critical",
            assigned_agent="Marcus Vance",
            strategy_segment="High Risk / Restructure Required",
            opened_at=now - datetime.timedelta(days=58),
            last_review_date=now - datetime.timedelta(days=1)
        )
        db.add(case3)
        db.flush()

        # 3 Broken Promises
        db.add(PromiseToPay(
            customer_id=c3.id,
            case_id=case3.id,
            amount_promised=980.0,
            promise_date=(now - datetime.timedelta(days=40)).strftime("%Y-%m-%d"),
            status="Broken",
            channel_agreed="Phone Call",
            broken_reason="Customer cited insufficient freight client invoice collections.",
            recorded_at=now - datetime.timedelta(days=48)
        ))
        db.add(PromiseToPay(
            customer_id=c3.id,
            case_id=case3.id,
            amount_promised=1200.0,
            promise_date=(now - datetime.timedelta(days=22)).strftime("%Y-%m-%d"),
            status="Broken",
            channel_agreed="SMS",
            broken_reason="ACH payment returned NSF (Non-Sufficient Funds).",
            recorded_at=now - datetime.timedelta(days=28)
        ))
        db.add(PromiseToPay(
            customer_id=c3.id,
            case_id=case3.id,
            amount_promised=1500.0,
            promise_date=(now - datetime.timedelta(days=5)).strftime("%Y-%m-%d"),
            status="Broken",
            channel_agreed="WhatsApp",
            broken_reason="Unresponsive on scheduled commitment date.",
            recorded_at=now - datetime.timedelta(days=12)
        ))

        # Contact history showing phone call avoidance but WhatsApp reading
        db.add(ContactHistory(
            customer_id=c3.id,
            channel="Phone",
            direction="Outbound",
            outcome="No Answer (Voicemail left)",
            duration_seconds=45,
            agent_id="AGT-104",
            notes_summary="Called mobile. Went to voicemail after 5 rings.",
            timestamp=now - datetime.timedelta(days=3)
        ))
        db.add(ContactHistory(
            customer_id=c3.id,
            channel="WhatsApp",
            direction="Outbound",
            outcome="Read (Within 8 mins)",
            duration_seconds=0,
            agent_id="AGT-104",
            notes_summary="Sent official notice of default and restructuring options link. Blue double checkmarks confirmed.",
            timestamp=now - datetime.timedelta(days=4)
        ))
        db.add(ContactHistory(
            customer_id=c3.id,
            channel="Phone",
            direction="Outbound",
            outcome="Call Disconnected / Rejected",
            duration_seconds=12,
            agent_id="AGT-104",
            notes_summary="Customer declined incoming call.",
            timestamp=now - datetime.timedelta(days=6)
        ))

        db.add(AgentNote(
            customer_id=c3.id,
            agent_name="Marcus Vance",
            category="Risk Escalation",
            note_text="Third broken PTP. Customer has stopped picking up direct phone calls. Bureau score dropped by 42 points in 60 days. Cash flow in checking account is near zero ($240). However, customer consistently reads WhatsApp messages within 10 minutes. A standard call strategy will fail; recommend WhatsApp loan modification offer.",
            sentiment="Hostile / Avoidant",
            created_at=now - datetime.timedelta(days=3)
        ))

        db.add(CallTranscript(
            customer_id=c3.id,
            call_ref="TRN-2026-903",
            call_date=(now - datetime.timedelta(days=22)).strftime("%Y-%m-%d %H:%M"),
            duration_seconds=64,
            agent_name="Marcus Vance",
            transcript_text="""Agent (Marcus Vance): Mr. Chen, this is Marcus Vance from Apex Horizon regarding the returned payment of $1,200...
Customer (Robert Chen): Look, diesel costs have doubled and two major freight clients haven't settled invoices. I don't have the cash today. Stop calling me during driving hours!
Agent: Mr. Chen, we understand the freight industry challenges. We have hardship restructuring options that can lower your monthly EMI...
Customer: Send it to my WhatsApp, I can't talk right now. [Call ended by customer]""",
            summary="Customer expressed severe business distress due to fuel costs and delinquent freight clients. Hung up abruptly but explicitly requested options via WhatsApp.",
            customer_sentiment="Defensive / Distressed",
            call_reason="Broken Promise Follow-up",
            key_commitments="Requested restructuring proposals sent over WhatsApp."
        ))

        db.add(ExternalScore(
            customer_id=c3.id,
            bureau_score=588,
            bureau_risk_grade="D",
            telco_stability_score=0.62,
            spending_index=0.65,
            estimated_capacity_to_pay="Low",
            updated_at=now - datetime.timedelta(days=5)
        ))


        # =========================================================================
        # Customer 4: Sarah Connor (CUST-1004) - The "Hardship & Restructure" Persona
        # =========================================================================
        c4 = Customer(
            customer_ref="CUST-1004",
            full_name="Sarah Connor",
            email="sarah.c.ux@creativeflow.design",
            phone="+1-555-0163",
            segment="Gig Economy / Creative",
            employment_status="Contractor",
            employer="Self-Employed (UX Design)",
            monthly_income=3800.0,
            credit_score=624,
            risk_tier="High",
            kyc_status="Verified",
            preferred_language="English",
            created_at=now - datetime.timedelta(days=320)
        )
        db.add(c4)
        db.flush()

        db.add(LoanAccount(
            customer_id=c4.id,
            loan_ref="LN-PERS-2025-402",
            loan_type="Personal Loan",
            principal_amount=12000.0,
            outstanding_balance=8400.0,
            emi_amount=380.0,
            tenure_months=36,
            next_due_date=(now - datetime.timedelta(days=42)).strftime("%Y-%m-%d"),
            dpd=42,
            status="SMA-1"
        ))
        db.add(DepositAccount(
            customer_id=c4.id,
            account_type="Checking",
            account_number_masked="7721-XXXX-0091",
            balance=185.0,
            currency="USD",
            last_activity_date=(now - datetime.timedelta(days=3)).strftime("%Y-%m-%d"),
            status="Active"
        ))

        case4 = CollectionsCase(
            customer_id=c4.id,
            case_ref="CASE-2026-1004",
            case_status="Pending Review",
            stage="Mid Delinquency",
            dpd_bucket="31-60",
            total_overdue=760.0,
            priority="High",
            assigned_agent="Sarah Jenkins",
            strategy_segment="Hardship Assistance Candidate",
            opened_at=now - datetime.timedelta(days=38),
            last_review_date=now - datetime.timedelta(days=2)
        )
        db.add(case4)
        db.flush()

        db.add(ContactHistory(
            customer_id=c4.id,
            channel="Mobile App",
            direction="Inbound",
            outcome="Feature Explored",
            duration_seconds=120,
            agent_id="SYS-APP",
            notes_summary="Customer accessed 'Payment Relief & Loan Extension' FAQ in mobile banking app 3 times in past week.",
            timestamp=now - datetime.timedelta(days=2)
        ))
        db.add(AgentNote(
            customer_id=c4.id,
            agent_name="Sarah Jenkins",
            category="Hardship",
            note_text="Customer reached out via app support chat. Key client terminated contract due to tech layoffs. Actively interviewing for new roles. Expressed willingness to pay a reduced EMI ($200 vs $380). High app engagement. Eligible for 6-month loan tenure extension program.",
            sentiment="Cooperative",
            created_at=now - datetime.timedelta(days=5)
        ))
        db.add(ExternalScore(
            customer_id=c4.id,
            bureau_score=624,
            bureau_risk_grade="C+",
            telco_stability_score=0.88,
            spending_index=0.72,
            estimated_capacity_to_pay="Medium-Low",
            updated_at=now - datetime.timedelta(days=8)
        ))


        # =========================================================================
        # Customer 5: Elena Rostova (CUST-1005) - The "Traveler / Communication Miss"
        # =========================================================================
        c5 = Customer(
            customer_ref="CUST-1005",
            full_name="Elena Rostova",
            email="elena.rostova@globaladvisory.org",
            phone="+1-555-0195",
            segment="Executive / Ultra HNW",
            employment_status="Partner",
            employer="Global Advisory Partners",
            monthly_income=14500.0,
            credit_score=812,
            risk_tier="Low",
            kyc_status="Verified",
            preferred_language="English",
            created_at=now - datetime.timedelta(days=900)
        )
        db.add(c5)
        db.flush()

        db.add(CardAccount(
            customer_id=c5.id,
            account_number_masked="3782-XXXX-XXXX-9011",
            card_type="Amex Centurion Reserve",
            credit_limit=50000.0,
            current_balance=4200.0,
            min_due=500.0,
            due_date=(now - datetime.timedelta(days=22)).strftime("%Y-%m-%d"),
            dpd=22,
            status="Delinquent"
        ))
        db.add(DepositAccount(
            customer_id=c5.id,
            account_type="Private Wealth Deposit",
            account_number_masked="8810-XXXX-4421",
            balance=115000.0,
            currency="USD",
            last_activity_date=(now - datetime.timedelta(days=1)).strftime("%Y-%m-%d"),
            status="Active"
        ))
        case5 = CollectionsCase(
            customer_id=c5.id,
            case_ref="CASE-2026-1005",
            case_status="Open",
            stage="Early Delinquency",
            dpd_bucket="1-30",
            total_overdue=500.0,
            priority="Low",
            assigned_agent="David Miller",
            strategy_segment="Digital VIP Fast-Path",
            opened_at=now - datetime.timedelta(days=18),
            last_review_date=now - datetime.timedelta(days=1)
        )
        db.add(case5)
        db.flush()

        db.add(ContactHistory(
            customer_id=c5.id,
            channel="Email",
            direction="Outbound",
            outcome="Email Opened (Tokyo IP)",
            duration_seconds=0,
            agent_id="SYS-AUTO",
            notes_summary="Automated statement opened from IP in Japan (Tokyo).",
            timestamp=now - datetime.timedelta(days=2)
        ))
        db.add(AgentNote(
            customer_id=c5.id,
            agent_name="David Miller",
            category="Travel / VIP",
            note_text="Customer is on extended international consulting assignment in Asia. Phone calls hit international roaming message. Email has 100% open rate. Over $115k on deposit. Need priority email with 1-click Apple Pay payment link.",
            sentiment="Neutral",
            created_at=now - datetime.timedelta(days=4)
        ))
        db.add(ExternalScore(
            customer_id=c5.id,
            bureau_score=812,
            bureau_risk_grade="A+",
            telco_stability_score=0.99,
            spending_index=1.35,
            estimated_capacity_to_pay="Extremely High",
            updated_at=now - datetime.timedelta(days=5)
        ))


        # =========================================================================
        # Add 10 More Realistic Diverse Customers (CUST-1006 to CUST-1015)
        # =========================================================================
        personas = [
            ("CUST-1006", "David Miller", "david.m@millereng.com", "+1-555-0201", "SME", "Self-employed", "Miller Engineering", 6200.0, 670, "Medium", 15, 420.0, "1-30", "Early Delinquency", "Open", "Sarah Jenkins"),
            ("CUST-1007", "Aisha Patel", "aisha.patel@biotechlabs.com", "+1-555-0202", "Salaried", "Employed", "BioTech Labs", 8100.0, 730, "Medium", 45, 1150.0, "31-60", "Mid Delinquency", "Pending Review", "David Miller"),
            ("CUST-1008", "Carlos Mendez", "carlos.m@mendezauto.com", "+1-555-0203", "Retail", "Employed", "Metro Transit", 3400.0, 560, "Critical", 95, 3400.0, "90+", "Recovery", "Legal Review", "Marcus Vance"),
            ("CUST-1009", "Emily White", "emily.white@edupath.org", "+1-555-0204", "Salaried", "Employed", "State University", 5100.0, 710, "Low", 8, 180.0, "1-30", "Early Delinquency", "Open", "Sarah Jenkins"),
            ("CUST-1010", "Marcus Johnson", "marcus.j@apexlog.com", "+1-555-0205", "Gig Economy", "Contractor", "Independent", 4100.0, 615, "High", 72, 1920.0, "61-90", "Late Delinquency", "Open", "Marcus Vance"),
            ("CUST-1011", "Linda Zhao", "linda.zhao@pacifictrade.cn", "+1-555-0206", "HNW", "Employed", "Pacific Trade Inc", 12000.0, 795, "Low", 26, 850.0, "1-30", "Early Delinquency", "Pending Review", "David Miller"),
            ("CUST-1012", "Kevin O'Brien", "kevin.ob@irishpubco.com", "+1-555-0207", "SME", "Self-employed", "Shamrock Hospitality", 4900.0, 640, "Medium", 35, 1200.0, "31-60", "Mid Delinquency", "Open", "Sarah Jenkins"),
            ("CUST-1013", "Fatima Al-Sayed", "fatima.alsayed@gulfinvest.ae", "+1-555-0208", "Salaried", "Employed", "Gulf Financial", 9800.0, 760, "Low", 12, 310.0, "1-30", "Early Delinquency", "Open", "David Miller"),
            ("CUST-1014", "Thomas Taylor", "thomas.taylor@taylorarch.com", "+1-555-0209", "Salaried", "Employed", "Taylor Architects", 6700.0, 685, "Medium", 55, 1640.0, "31-60", "Mid Delinquency", "Open", "Sarah Jenkins"),
            ("CUST-1015", "Rachel Green", "rachel.g@fashionretail.com", "+1-555-0210", "Retail", "Employed", "Manhattan Styles", 4300.0, 630, "High", 82, 2450.0, "61-90", "Late Delinquency", "Pending Review", "Marcus Vance"),
        ]

        for p in personas:
            ref, name, email, phone, seg, emp_st, emp, inc, cs, rt, dpd, overdue, dpd_bkt, stage, c_status, agt = p
            c = Customer(
                customer_ref=ref,
                full_name=name,
                email=email,
                phone=phone,
                segment=seg,
                employment_status=emp_st,
                employer=emp,
                monthly_income=inc,
                credit_score=cs,
                risk_tier=rt,
                kyc_status="Verified",
                preferred_language="English",
                created_at=now - datetime.timedelta(days=400)
            )
            db.add(c)
            db.flush()

            # Add Card
            db.add(CardAccount(
                customer_id=c.id,
                account_number_masked=f"4532-XXXX-XXXX-{c.id:04d}",
                card_type="Visa Signature",
                credit_limit=8000.0,
                current_balance=overdue * 1.8,
                min_due=overdue,
                due_date=(now - datetime.timedelta(days=dpd)).strftime("%Y-%m-%d"),
                dpd=dpd,
                status="Delinquent" if dpd > 0 else "Active"
            ))

            # Add Deposit
            db.add(DepositAccount(
                customer_id=c.id,
                account_type="Savings",
                account_number_masked=f"9012-XXXX-{c.id:04d}",
                balance=inc * 0.45,
                currency="USD",
                last_activity_date=(now - datetime.timedelta(days=5)).strftime("%Y-%m-%d"),
                status="Active"
            ))

            # Add Case
            case_obj = CollectionsCase(
                customer_id=c.id,
                case_ref=f"CASE-2026-{c.id}",
                case_status=c_status,
                stage=stage,
                dpd_bucket=dpd_bkt,
                total_overdue=overdue,
                priority=rt,
                assigned_agent=agt,
                strategy_segment="Standard Early Resolution" if dpd <= 30 else "Intensive Recovery",
                opened_at=now - datetime.timedelta(days=dpd),
                last_review_date=now - datetime.timedelta(days=2)
            )
            db.add(case_obj)
            db.flush()

            # Add recent contact
            db.add(ContactHistory(
                customer_id=c.id,
                channel="Phone" if dpd <= 30 else "SMS",
                direction="Outbound",
                outcome="Connected" if dpd <= 30 else "Delivered",
                duration_seconds=180 if dpd <= 30 else 0,
                agent_id="AGT-102",
                notes_summary=f"Routine collections touchpoint. Customer status reviewed at DPD {dpd}.",
                timestamp=now - datetime.timedelta(days=3)
            ))

            # Add agent note
            db.add(AgentNote(
                customer_id=c.id,
                agent_name=agt,
                category="Account Review",
                note_text=f"Case assessed at DPD {dpd}. Overdue amount of ${overdue:,.2f}. Assigned to {stage}.",
                sentiment="Neutral",
                created_at=now - datetime.timedelta(days=4)
            ))

            # Add external score
            db.add(ExternalScore(
                customer_id=c.id,
                bureau_score=cs,
                bureau_risk_grade="B" if cs >= 650 else "C",
                telco_stability_score=0.85,
                spending_index=0.95,
                estimated_capacity_to_pay="Medium" if cs >= 650 else "Low",
                updated_at=now - datetime.timedelta(days=12)
            ))

            # If dpd in 61-90, add a broken promise
            if dpd > 60:
                db.add(PromiseToPay(
                    customer_id=c.id,
                    case_id=case_obj.id,
                    amount_promised=overdue * 0.5,
                    promise_date=(now - datetime.timedelta(days=10)).strftime("%Y-%m-%d"),
                    status="Broken",
                    channel_agreed="SMS",
                    broken_reason="Customer missed commitment window.",
                    recorded_at=now - datetime.timedelta(days=18)
                ))

        # Commit everything
        db.commit()
        print("Successfully seeded synthetic collections database with 15 rich customer personas!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
