from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base


class AIExperiment(Base):
    __tablename__ = "ai_experiments"

    experiment_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False)
    experiment_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    framework = Column(String(100), nullable=True)  # e.g. PyTorch, TensorFlow, JAX
    hyperparameters = Column(JSON, nullable=True, default={})
    metrics_log = Column(JSON, nullable=True, default=[])
    # metrics_log is a list of dicts: [{epoch: 1, loss: 0.5, accuracy: 0.82}, ...]
    model_weight_path = Column(String(500), nullable=True)
    status = Column(String(50), nullable=True, default="running")  # running, completed, failed
    created_by = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="experiments")
    creator = relationship("User", foreign_keys=[created_by])
