from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel
from app.schemas.user import UserPublic


class ExperimentCreate(BaseModel):
    project_id: int
    experiment_name: str
    description: Optional[str] = None
    framework: Optional[str] = None
    hyperparameters: Optional[Dict[str, Any]] = {}
    model_weight_path: Optional[str] = None


class ExperimentUpdate(BaseModel):
    experiment_name: Optional[str] = None
    description: Optional[str] = None
    framework: Optional[str] = None
    hyperparameters: Optional[Dict[str, Any]] = None
    model_weight_path: Optional[str] = None
    status: Optional[str] = None


class MetricsAppend(BaseModel):
    """Append a metrics entry to the metrics_log array."""
    entry: Dict[str, Any]
    # e.g. {"epoch": 5, "loss": 0.42, "val_loss": 0.51, "accuracy": 0.88}


class ExperimentRead(BaseModel):
    experiment_id: int
    project_id: int
    experiment_name: str
    description: Optional[str]
    framework: Optional[str]
    hyperparameters: Optional[Dict[str, Any]]
    metrics_log: Optional[List[Dict[str, Any]]]
    model_weight_path: Optional[str]
    status: Optional[str]
    created_by: Optional[int]
    creator: Optional[UserPublic]
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}
