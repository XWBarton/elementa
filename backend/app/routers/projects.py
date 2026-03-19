from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.crud import project as crud
from app.dependencies import get_current_user, get_db, require_admin
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectMemberRead, ProjectRead, ProjectUpdate

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/", response_model=List[ProjectRead])
def list_projects(db: Session = Depends(get_db), _=Depends(get_current_user)):
    items, _ = crud.get_projects(db)
    return items


@router.post("/", response_model=ProjectRead)
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    if crud.get_project_by_code(db, data.code):
        raise HTTPException(status_code=400, detail="Project code already exists")
    return crud.create_project(db, data, current_user.id)


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: int,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return crud.update_project(db, project, data)


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    crud.delete_project(db, project)
    return {"detail": "Deleted"}


@router.get("/{project_id}/members", response_model=List[ProjectMemberRead])
def get_members(project_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project.members


@router.post("/{project_id}/members/{user_id}", response_model=List[ProjectMemberRead])
def add_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    crud.add_member(db, project, user)
    return project.members


@router.delete("/{project_id}/members/{user_id}", response_model=List[ProjectMemberRead])
def remove_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    crud.remove_member(db, project, user)
    return project.members
