from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate


def get_project(db: Session, project_id: int) -> Optional[Project]:
    return db.query(Project).filter(Project.id == project_id).first()


def get_project_by_code(db: Session, code: str) -> Optional[Project]:
    return db.query(Project).filter(Project.code == code).first()


def get_projects(db: Session, skip: int = 0, limit: int = 200) -> Tuple[List[Project], int]:
    total = db.query(Project).count()
    items = db.query(Project).order_by(Project.name).offset(skip).limit(limit).all()
    return items, total


def create_project(db: Session, data: ProjectCreate, user_id: int) -> Project:
    project = Project(
        code=data.code,
        name=data.name,
        description=data.description,
        created_by_id=user_id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def update_project(db: Session, project: Project, data: ProjectUpdate) -> Project:
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(project, key, value)
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project: Project) -> None:
    db.delete(project)
    db.commit()


def add_member(db: Session, project: Project, user: User) -> Project:
    if user not in project.members:
        project.members.append(user)
        db.commit()
        db.refresh(project)
    return project


def remove_member(db: Session, project: Project, user: User) -> Project:
    project.members = [m for m in project.members if m.id != user.id]
    db.commit()
    db.refresh(project)
    return project
