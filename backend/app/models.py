import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_email_verified = Column(Boolean, default=False, nullable=False)
    role = Column(String(20), default="user", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    otps = relationship("EmailOTP", back_populates="user", cascade="all, delete-orphan")
    accounts = relationship("Account", back_populates="user", cascade="all, delete-orphan")
    incomes = relationship("Income", back_populates="user", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")
    savings_goals = relationship("SavingsGoal", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    notification_settings = relationship("NotificationSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    full_name = Column(String(100), nullable=False)
    currency = Column(String(20), default="INR (₹)", nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="profile")


class EmailOTP(Base):
    __tablename__ = "email_otps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    otp_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    purpose = Column(String(50), default="email_verification", nullable=False) # email_verification, password_reset
    attempts = Column(Integer, default=0, nullable=False)

    user = relationship("User", back_populates="otps")


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    bank_name = Column(String(100), nullable=False)
    account_name = Column(String(100), nullable=False)
    account_type = Column(String(50), nullable=False) # Bank Account, Savings Account, Current Account, UPI, Wallet, Cash
    opening_balance = Column(Float, default=0.0, nullable=False)
    current_balance = Column(Float, default=0.0, nullable=False)
    minimum_balance = Column(Float, default=0.0, nullable=False)
    last4 = Column(String(10), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="accounts")
    incomes = relationship("Income", back_populates="account", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="account", cascade="all, delete-orphan")


class Income(Base):
    __tablename__ = "incomes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    source = Column(String(100), nullable=False) # Salary, Freelancing, Scholarship, Business, Gift, Other
    amount = Column(Float, nullable=False)
    date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="incomes")
    account = relationship("Account", back_populates="incomes")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    category = Column(String(100), nullable=False) # Food, Travel, Shopping, Education, Entertainment, Bills, Healthcare, Rent, Groceries, Transportation, Other
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50), nullable=False) # UPI, Debit Card, Credit Card, Bank Transfer, Cash, Wallet
    card_type = Column(String(50), nullable=True)
    card_last4 = Column(String(10), nullable=True)
    date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="expenses")
    account = relationship("Account", back_populates="expenses")


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(100), nullable=False)
    monthly_limit = Column(Float, nullable=False)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    notified_thresholds = Column(String(100), default="", nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="budgets")


class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0, nullable=False)
    target_date = Column(DateTime, nullable=False)
    status = Column(String(30), default="in_progress", nullable=False) # in_progress, completed
    goal_type = Column(String(50), default="other", nullable=False) # emergency_fund, travel, education, electronics, vehicle, other
    notified_thresholds = Column(String(100), default="", nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="savings_goals")
    contributions = relationship("GoalContribution", back_populates="goal", cascade="all, delete-orphan")


class GoalContribution(Base):
    __tablename__ = "goal_contributions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    goal_id = Column(Integer, ForeignKey("savings_goals.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    previous_amount = Column(Float, nullable=False, default=0.0)
    new_amount = Column(Float, nullable=False, default=0.0)
    date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    user = relationship("User")
    goal = relationship("SavingsGoal", back_populates="contributions")
    account = relationship("Account")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=True)
    message = Column(Text, nullable=False)
    rich_text = Column(Text, nullable=True)
    type = Column(String(50), nullable=False) # budget_alert, savings_reminder, goal_milestone, monthly_report
    action_url = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="notifications")

class NotificationSettings(Base):
    __tablename__ = "notification_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    income_alerts = Column(Boolean, default=True, nullable=False)
    expense_alerts = Column(Boolean, default=True, nullable=False)
    goal_contributions = Column(Boolean, default=True, nullable=False)
    goal_milestones = Column(Boolean, default=True, nullable=False)
    goal_completion = Column(Boolean, default=True, nullable=False)
    low_balance_alerts = Column(Boolean, default=True, nullable=False)
    large_expense_alerts = Column(Boolean, default=True, nullable=False)
    budget_warnings = Column(Boolean, default=True, nullable=False)
    budget_exceeded = Column(Boolean, default=True, nullable=False)
    
    user = relationship("User", back_populates="notification_settings")

