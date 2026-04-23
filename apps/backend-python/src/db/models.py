from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Boolean, Text, DateTime, ForeignKey,
    UniqueConstraint, Index
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class Group(Base):
    __tablename__ = "group"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    permissions = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")


class GroupMember(Base):
    __tablename__ = "group_member"

    group_id = Column(String, ForeignKey("group.id", ondelete="CASCADE"), nullable=False, primary_key=True)
    user_id = Column(String, ForeignKey("user.id", ondelete="CASCADE"), nullable=False, primary_key=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    group = relationship("Group", back_populates="members")
    user = relationship("User", back_populates="group_memberships")

    __table_args__ = (UniqueConstraint("group_id", "user_id", name="uq_group_member"),)


class User(Base):
    __tablename__ = "user"

    id = Column(String, primary_key=True)
    email = Column(String, nullable=False)
    username = Column(String(50), nullable=True)
    role = Column(String, nullable=False, default="pending")
    name = Column(String, nullable=False)
    profile_image_url = Column(String, nullable=False, default="/user.png")
    profile_banner_image_url = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    settings = Column(Text, nullable=True)  # JSON string
    oauth = Column(Text, nullable=True)     # JSON string
    is_master = Column(Boolean, nullable=False, default=False)
    last_active_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    auth = relationship("Auth", back_populates="user", uselist=False, cascade="all, delete-orphan")
    api_keys = relationship("ApiKey", back_populates="user", cascade="all, delete-orphan")
    chats = relationship("Chat", back_populates="user", cascade="all, delete-orphan")
    files = relationship("File", back_populates="user", cascade="all, delete-orphan")
    folders = relationship("Folder", back_populates="user", cascade="all, delete-orphan")
    prompts = relationship("Prompt", back_populates="user", cascade="all, delete-orphan")
    models = relationship("Model", back_populates="user", cascade="all, delete-orphan")
    tags = relationship("Tag", back_populates="user", cascade="all, delete-orphan")
    connections = relationship("Connection", back_populates="user", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")
    knowledge = relationship("Knowledge", back_populates="user", cascade="all, delete-orphan")
    group_memberships = relationship("GroupMember", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")


class Auth(Base):
    __tablename__ = "auth"

    id = Column(String, ForeignKey("user.id", ondelete="CASCADE"), primary_key=True)
    email = Column(String, nullable=False, unique=True)
    password = Column(String, nullable=False)
    active = Column(Boolean, nullable=False, default=True)

    user = relationship("User", back_populates="auth")

class UserSession(Base):
    __tablename__ = "user_session"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    hashed_refresh_token = Column(String, nullable=False)
    
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    is_valid = Column(Boolean, nullable=False, default=True)

    user = relationship("User", back_populates="sessions")
    

class ApiKey(Base):
    __tablename__ = "api_key"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    key = Column(String, nullable=False, unique=True)
    data = Column(Text, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    last_used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="api_keys")


class Chat(Base):
    __tablename__ = "chat"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    chat = Column(Text, nullable=False, default="{}")  # JSON
    share_id = Column(String, nullable=True, unique=True)
    archived = Column(Boolean, nullable=False, default=False)
    pinned = Column(Boolean, nullable=True, default=False)
    folder_id = Column(String, ForeignKey("folder.id"), nullable=True)
    meta = Column(Text, nullable=True, default="{}")  # JSON
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="chats")
    folder = relationship("Folder", back_populates="chats")
    chat_files = relationship("ChatFile", back_populates="chat", cascade="all, delete-orphan")

    __table_args__ = (
        Index("folder_id_idx", "folder_id"),
        Index("user_id_pinned_idx", "user_id", "pinned"),
        Index("user_id_archived_idx", "user_id", "archived"),
        Index("updated_at_user_id_idx", "updated_at", "user_id"),
    )


class Folder(Base):
    __tablename__ = "folder"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(String, ForeignKey("folder.id"), nullable=True)
    name = Column(String, nullable=False)
    is_expanded = Column(Boolean, default=True)
    meta = Column(Text, nullable=True)  # JSON
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="folders")
    chats = relationship("Chat", back_populates="folder")
    notes = relationship("Note", back_populates="folder")


class File(Base):
    __tablename__ = "file"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("user.id"), nullable=False)
    filename = Column(String, nullable=False)
    path = Column(String, nullable=False)
    meta = Column(Text, nullable=True)  # JSON

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="files")
    chat_files = relationship("ChatFile", back_populates="file", cascade="all, delete-orphan")
    knowledge_files = relationship("KnowledgeFile", back_populates="file", cascade="all, delete-orphan")


class ChatFile(Base):
    __tablename__ = "chat_file"

    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False)
    chat_id = Column(String, ForeignKey("chat.id", ondelete="CASCADE"), nullable=False)
    message_id = Column(String, nullable=True)
    file_id = Column(String, ForeignKey("file.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    chat = relationship("Chat", back_populates="chat_files")
    file = relationship("File", back_populates="chat_files")

    __table_args__ = (UniqueConstraint("chat_id", "file_id", name="uq_chat_file"),)


class Prompt(Base):
    __tablename__ = "prompt"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    command = Column(String, nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="prompts")


class Model(Base):
    __tablename__ = "model"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("user.id"), nullable=False)
    base_model_id = Column(String, nullable=True)
    name = Column(String, nullable=False)
    meta = Column(Text, nullable=True)   # JSON
    params = Column(Text, nullable=True) # JSON
    is_enabled = Column(Boolean, nullable=False, default=True)
    is_default = Column(Boolean, nullable=False, default=False)
    is_pinned = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="models")


class ModelPrompt(Base):
    __tablename__ = "model_prompt"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("user.id"), nullable=False)
    model_id = Column(String, nullable=False)
    name = Column(String, nullable=True)          # display name
    title = Column(String, nullable=True)          # alias for name (legacy)
    prompt = Column(Text, nullable=True)           # prompt content
    content = Column(Text, nullable=True)          # alias for prompt (legacy)
    enabled = Column(Boolean, nullable=False, default=True)
    is_default = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class Tag(Base):
    __tablename__ = "tag"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    data = Column(Text, nullable=True)  # JSON
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="tags")


class Connection(Base):
    __tablename__ = "connection"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False, default="external")
    provider_type = Column(String, nullable=False)
    url = Column(String, nullable=False)
    auth_type = Column(String, nullable=True, default="bearer")
    auth_value = Column(String, nullable=True)
    headers = Column(Text, nullable=True)
    prefix_id = Column(String, nullable=True)
    model_ids = Column(Text, nullable=True)
    tags = Column(Text, nullable=True)
    is_enabled = Column(Boolean, nullable=True, default=True)
    is_default = Column(Boolean, nullable=True, default=False)
    priority = Column(Integer, nullable=True, default=0)
    meta = Column(Text, nullable=True)
    last_verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="connections")


class Setting(Base):
    __tablename__ = "settings"

    id = Column(String, primary_key=True)
    category = Column(String, nullable=False)
    key = Column(String, nullable=False)
    value = Column(Text, nullable=True)
    type = Column(String, nullable=True, default="string")
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class Knowledge(Base):
    __tablename__ = "knowledge"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    data = Column(Text, nullable=True)   # JSON (icon, access_control, etc.)
    chunking_strategy = Column(String, nullable=False, default="default")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="knowledge")
    files = relationship("KnowledgeFile", back_populates="knowledge", cascade="all, delete-orphan")


class KnowledgeFile(Base):
    __tablename__ = "knowledge_file"

    id = Column(String, primary_key=True)
    knowledge_id = Column(String, ForeignKey("knowledge.id", ondelete="CASCADE"), nullable=False)
    file_id = Column(String, ForeignKey("file.id", ondelete="CASCADE"), nullable=False)
    # Embedding pipeline status: pending | indexing | indexed | failed
    embed_status = Column(String, nullable=False, default="pending")
    embed_error = Column(Text, nullable=True)
    chunk_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    knowledge = relationship("Knowledge", back_populates="files")
    file = relationship("File", back_populates="knowledge_files")

    __table_args__ = (UniqueConstraint("knowledge_id", "file_id", name="uq_knowledge_file"),)


class Note(Base):
    __tablename__ = "note"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False, default="")
    plain_text = Column(Text, nullable=False, default="")
    visibility = Column(String, nullable=False, default="private")
    word_count = Column(Integer, nullable=False, default=0)
    char_count = Column(Integer, nullable=False, default=0)
    tags = Column(Text, nullable=True)  # JSON array
    folder_id = Column(String, ForeignKey("folder.id"), nullable=True)
    archived = Column(Boolean, nullable=False, default=False)
    pinned = Column(Boolean, nullable=False, default=False)
    share_id = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="notes")
    folder = relationship("Folder", back_populates="notes")
