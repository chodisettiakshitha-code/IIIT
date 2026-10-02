from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_ref = Column(String(50), unique=True, index=True) # e.g. CUST-1001
    full_name = Column(String(100), nullable=False, index=True)
    email = Column(String(100), nullable=True)
    phone = Column(String(25), nullable=True)
    segment = Column(String(50), default="Standard") # Retail, HNW, SME, Salaried
    employment_status = Column(String(50), default="Employed") # Salaried, Self-employed, Contract
    employer = Column(String(100), nullable=True)
    monthly_income = Column(Float, default=0.0)
    credit_score = Column(Integer, default=650)
    risk_tier = Column(String(20), default="Medium") # Low, Medium, High, Critical
    kyc_status = Column(String(20), default="Verified")
    preferred_language = Column(String(20), default="English")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    cards = relationship("CardAccount", back_populates="customer", cascade="all, delete-orphan")
    loans = relationship("LoanAccount", back_populates="customer", cascade="all, delete-orphan")
    deposits = relationship("DepositAccount", back_populates="customer", cascade="all, delete-orphan")
    cases = relationship("CollectionsCase", back_populates="customer", cascade="all, delete-orphan")
    contacts = relationship("ContactHistory", back_populates="customer", cascade="all, delete-orphan")
    notes = relationship("AgentNote", back_populates="customer", cascade="all, delete-orphan")
    transcripts = relationship("CallTranscript", back_populates="customer", cascade="all, delete-orphan")
    external_score = relationship("ExternalScore", back_populates="customer", uselist=False, cascade="all, delete-orphan")
    promises = relationship("PromiseToPay", back_populates="customer", cascade="all, delete-orphan")
    payments = relationship("PaymentHistory", back_populates="customer", cascade="all, delete-orphan")
    audit_logs = relationship("AuditActionLog", back_populates="customer", cascade="all, delete-orphan")


class CardAccount(Base):
    __tablename__ = "card_accounts"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    account_number_masked = Column(String(30), nullable=False)
    card_type = Column(String(50), default="Visa Platinum") # Gold, Platinum, Rewards
    credit_limit = Column(Float, default=5000.0)
    current_balance = Column(Float, default=0.0)
    min_due = Column(Float, default=0.0)
    due_date = Column(String(20), nullable=True)
    dpd = Column(Integer, default=0) # Days Past Due
    status = Column(String(30), default="Active") # Active, Delinquent, Blocked

    customer = relationship("Customer", back_populates="cards")


class LoanAccount(Base):
    __tablename__ = "loan_accounts"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    loan_ref = Column(String(50), nullable=False)
    loan_type = Column(String(50), default="Personal Loan") # Auto, Home, Personal, Education
    principal_amount = Column(Float, default=10000.0)
    outstanding_balance = Column(Float, default=0.0)
    emi_amount = Column(Float, default=0.0)
    tenure_months = Column(Integer, default=36)
    next_due_date = Column(String(20), nullable=True)
    dpd = Column(Integer, default=0)
    status = Column(String(30), default="Standard") # Standard, SMA-1, SMA-2, NPA

    customer = relationship("Customer", back_populates="loans")


class DepositAccount(Base):
    __tablename__ = "deposit_accounts"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    account_type = Column(String(50), default="Savings") # Savings, Current, Fixed Deposit
    account_number_masked = Column(String(30), nullable=False)
    balance = Column(Float, default=0.0)
    currency = Column(String(10), default="USD")
    last_activity_date = Column(String(20), nullable=True)
    status = Column(String(30), default="Active")

    customer = relationship("Customer", back_populates="deposits")


class CollectionsCase(Base):
    __tablename__ = "collections_cases"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    case_ref = Column(String(50), unique=True, index=True)
    case_status = Column(String(30), default="Open") # Open, Pending Review, Promise Kept, Resolved, Legal
    stage = Column(String(30), default="Early Delinquency") # Early (1-30), Mid (31-60), Late (61-90), Recovery (90+)
    dpd_bucket = Column(String(20), default="1-30") # 1-30, 31-60, 61-90, 90+
    total_overdue = Column(Float, default=0.0)
    priority = Column(String(20), default="Medium") # Low, Medium, High, Critical
    assigned_agent = Column(String(100), default="Sarah Jenkins")
    strategy_segment = Column(String(50), default="Self-Cure Potential")
    opened_at = Column(DateTime, default=datetime.utcnow)
    last_review_date = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="cases")


class PromiseToPay(Base):
    __tablename__ = "promise_to_pay"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    case_id = Column(Integer, ForeignKey("collections_cases.id"), nullable=True)
    amount_promised = Column(Float, default=0.0)
    promise_date = Column(String(30), nullable=False)
    status = Column(String(30), default="Pending") # Pending, Kept, Broken, Cancelled
    channel_agreed = Column(String(30), default="Phone") # Phone, SMS, App, Portal
    broken_reason = Column(String(255), nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="promises")


class PaymentHistory(Base):
    __tablename__ = "payment_history"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    payment_ref = Column(String(50), nullable=False)
    account_type = Column(String(50), default="Credit Card") # Credit Card, Loan
    amount = Column(Float, default=0.0)
    payment_date = Column(String(30), nullable=False)
    status = Column(String(30), default="Completed") # Completed, Failed, Missed, Reversed
    method = Column(String(50), default="Auto-Debit") # Auto-Debit, UPI, ACH, Web Portal, Branch

    customer = relationship("Customer", back_populates="payments")


class ContactHistory(Base):
    __tablename__ = "contact_history"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    channel = Column(String(30), default="Phone") # Phone, SMS, Email, WhatsApp, App Push
    direction = Column(String(20), default="Outbound") # Inbound, Outbound
    outcome = Column(String(50), default="Connected") # Connected/RPC, No Answer, Busy, SMS Delivered, Email Opened, WhatsApp Read
    duration_seconds = Column(Integer, default=0)
    agent_id = Column(String(50), default="AGT-102")
    notes_summary = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="contacts")


class AgentNote(Base):
    __tablename__ = "agent_notes"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    agent_name = Column(String(100), default="Sarah Jenkins")
    category = Column(String(50), default="Payment Discussion") # Hardship, Dispute, Salary Delay, Promise, Follow-up
    note_text = Column(Text, nullable=False)
    sentiment = Column(String(20), default="Neutral") # Positive, Neutral, Distressed, Hostile
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="notes")


class CallTranscript(Base):
    __tablename__ = "call_transcripts"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    call_ref = Column(String(50), nullable=False)
    call_date = Column(String(30), nullable=False)
    duration_seconds = Column(Integer, default=180)
    agent_name = Column(String(100), default="Sarah Jenkins")
    transcript_text = Column(Text, nullable=False)
    summary = Column(Text, nullable=False)
    customer_sentiment = Column(String(30), default="Cooperative")
    call_reason = Column(String(100), default="Payment Reminder - DPD 25")
    key_commitments = Column(Text, nullable=True)

    customer = relationship("Customer", back_populates="transcripts")


class ExternalScore(Base):
    __tablename__ = "external_scores"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    bureau_score = Column(Integer, default=680)
    bureau_risk_grade = Column(String(20), default="B+")
    telco_stability_score = Column(Float, default=0.88) # 0 to 1.0
    spending_index = Column(Float, default=1.05) # Relative to normal
    estimated_capacity_to_pay = Column(String(20), default="Medium-High")
    updated_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="external_score")


class AuditActionLog(Base):
    __tablename__ = "audit_action_logs"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    recommendation_id = Column(String(50), nullable=False)
    agent_id = Column(String(50), default="AGT-102")
    agent_name = Column(String(100), default="Sarah Jenkins")
    role = Column(String(50), default="Collections Specialist")
    action_taken = Column(String(30), nullable=False) # Approved, Modified, Overridden
    recommended_action = Column(String(100), nullable=False)
    final_action = Column(String(100), nullable=False)
    recommended_channel = Column(String(50), nullable=False)
    final_channel = Column(String(50), nullable=False)
    recommended_timing = Column(String(50), nullable=True)
    final_timing = Column(String(50), nullable=True)
    rationale = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="audit_logs")
