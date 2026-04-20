from __future__ import annotations
import json
from datetime import datetime
from nanoid import generate as nanoid
from sqlalchemy.orm import Session
from src.db.models import Group, GroupMember, User
from src.utils.errors import NotFoundError


class GroupService:
    def _serialize(self, group: Group, member_count: int | None = None) -> dict:
        return {
            "id": group.id,
            "name": group.name,
            "description": group.description,
            "permissions": json.loads(group.permissions) if group.permissions else None,
            "memberCount": member_count if member_count is not None else len(group.members),
            "createdAt": group.created_at.isoformat() if group.created_at else None,
            "updatedAt": group.updated_at.isoformat() if group.updated_at else None,
        }

    def _serialize_user(self, user: User) -> dict:
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "profileImageUrl": user.profile_image_url,
            "isMaster": user.is_master,
            "lastActiveAt": user.last_active_at.isoformat() if user.last_active_at else None,
            "createdAt": user.created_at.isoformat() if user.created_at else None,
            "updatedAt": user.updated_at.isoformat() if user.updated_at else None,
        }

    def get_groups(self, db: Session) -> list:
        groups = db.query(Group).all()
        return [self._serialize(g) for g in groups]

    def get_group_by_id(self, db: Session, group_id: str) -> Group:
        group = db.query(Group).filter(Group.id == group_id).first()
        if not group:
            raise NotFoundError("Group not found")
        return group

    def create_group(self, db: Session, data: dict) -> dict:
        now = datetime.utcnow()
        group = Group(
            id=nanoid(),
            name=data["name"],
            description=data.get("description"),
            permissions=json.dumps(data["permissions"]) if data.get("permissions") else None,
            created_at=now,
            updated_at=now,
        )
        db.add(group)
        db.commit()
        db.refresh(group)
        return self._serialize(group)

    def update_group(self, db: Session, group_id: str, data: dict) -> dict:
        group = self.get_group_by_id(db, group_id)
        if "name" in data:
            group.name = data["name"]
        if "description" in data:
            group.description = data["description"]
        if "permissions" in data:
            group.permissions = json.dumps(data["permissions"]) if data["permissions"] else None
        group.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(group)
        return self._serialize(group)

    def delete_group(self, db: Session, group_id: str) -> None:
        group = self.get_group_by_id(db, group_id)
        db.delete(group)
        db.commit()

    def get_group_members(self, db: Session, group_id: str) -> list:
        self.get_group_by_id(db, group_id)
        rows = (
            db.query(GroupMember)
            .filter(GroupMember.group_id == group_id)
            .all()
        )
        return [self._serialize_user(r.user) for r in rows]

    def add_member(self, db: Session, group_id: str, user_id: str) -> None:
        self.get_group_by_id(db, group_id)
        existing = (
            db.query(GroupMember)
            .filter(GroupMember.group_id == group_id, GroupMember.user_id == user_id)
            .first()
        )
        if existing:
            return
        member = GroupMember(group_id=group_id, user_id=user_id, created_at=datetime.utcnow())
        db.add(member)
        db.commit()

    def remove_member(self, db: Session, group_id: str, user_id: str) -> None:
        member = (
            db.query(GroupMember)
            .filter(GroupMember.group_id == group_id, GroupMember.user_id == user_id)
            .first()
        )
        if member:
            db.delete(member)
            db.commit()

    def get_user_groups(self, db: Session, user_id: str) -> list:
        rows = (
            db.query(GroupMember)
            .filter(GroupMember.user_id == user_id)
            .all()
        )
        return [self._serialize(r.group, member_count=None) for r in rows]

    def get_all_memberships(self, db: Session) -> list:
        rows = db.query(GroupMember).all()
        result = []
        for row in rows:
            result.append({
                "userId": row.user_id,
                "group": self._serialize(row.group),
            })
        return result


group_service = GroupService()
