from app.models.user import User


def has_run_access(run, user: User) -> bool:
    """Return True if the user can access the given run (or its samples).

    Unprotected projects are always accessible. Protected projects require the
    user to be an admin or an explicit project member.
    """
    project = run.project if run else None
    if not project or not project.is_protected:
        return True
    if user.is_admin:
        return True
    return any(m.id == user.id for m in project.members)
