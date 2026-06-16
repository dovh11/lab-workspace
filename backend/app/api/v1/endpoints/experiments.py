from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.experiment import AIExperiment
from app.schemas.experiment import ExperimentCreate, ExperimentUpdate, ExperimentRead, MetricsAppend

router = APIRouter()


@router.get("/", response_model=List[ExperimentRead])
def list_experiments(
    project_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List experiments, optionally filtered by project."""
    query = db.query(AIExperiment).options(joinedload(AIExperiment.creator))
    if project_id:
        query = query.filter(AIExperiment.project_id == project_id)
    return query.order_by(AIExperiment.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=ExperimentRead, status_code=status.HTTP_201_CREATED)
def create_experiment(
    exp_in: ExperimentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Log a new AI experiment."""
    experiment = AIExperiment(
        project_id=exp_in.project_id,
        experiment_name=exp_in.experiment_name,
        description=exp_in.description,
        framework=exp_in.framework,
        hyperparameters=exp_in.hyperparameters or {},
        metrics_log=[],
        model_weight_path=exp_in.model_weight_path,
        status="running",
        created_by=current_user.user_id,
    )
    db.add(experiment)
    db.commit()
    db.refresh(experiment)
    return experiment


@router.get("/{experiment_id}", response_model=ExperimentRead)
def get_experiment(
    experiment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    exp = db.query(AIExperiment).filter(AIExperiment.experiment_id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return exp


@router.patch("/{experiment_id}", response_model=ExperimentRead)
def update_experiment(
    experiment_id: int,
    exp_in: ExperimentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update experiment metadata (name, hyperparameters, status, etc.)."""
    exp = db.query(AIExperiment).filter(AIExperiment.experiment_id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    update_data = exp_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(exp, key, value)

    db.commit()
    db.refresh(exp)
    return exp


@router.post("/{experiment_id}/metrics", response_model=ExperimentRead)
def append_metrics(
    experiment_id: int,
    metrics_in: MetricsAppend,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Append a metrics entry (e.g., epoch data) to the experiment's metrics log."""
    exp = db.query(AIExperiment).filter(AIExperiment.experiment_id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    current_log = list(exp.metrics_log or [])
    current_log.append(metrics_in.entry)
    exp.metrics_log = current_log  # Trigger JSON column update

    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(exp, "metrics_log")
    db.commit()
    db.refresh(exp)
    return exp


@router.delete("/{experiment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experiment(
    experiment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    exp = db.query(AIExperiment).filter(AIExperiment.experiment_id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    db.delete(exp)
    db.commit()
