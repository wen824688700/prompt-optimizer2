"""
Versions API endpoints
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.version_manager import VersionManager, VersionType

router = APIRouter(prefix="/api/v1/versions", tags=["versions"])

# 全局服务实例
version_manager = VersionManager()


class VersionResponse(BaseModel):
    """版本响应"""
    id: str
    user_id: str
    content: str
    type: str
    created_at: str
    formatted_title: str
    version_number: str = "1.0"
    description: str | None = None
    topic: str | None = None
    framework_id: str | None = None
    framework_name: str | None = None
    original_input: str | None = None


class SaveVersionRequest(BaseModel):
    """保存版本请求"""
    user_id: str = Field("test_user", description="用户 ID")
    content: str = Field(..., description="提示词内容")
    type: str = Field("save", description="版本类型（save/optimize）")
    version_number: str = Field("1.0", description="版本号")
    description: str | None = Field(None, description="版本描述")
    topic: str | None = Field(None, description="主题标签")
    framework_id: str | None = Field(None, description="框架ID")
    framework_name: str | None = Field(None, description="框架名称")
    original_input: str | None = Field(None, description="原始输入")


@router.get("", response_model=list[VersionResponse])
async def get_versions(user_id: str = "test_user", limit: int = 20):
    """
    获取用户的版本列表

    返回用户最近的版本列表（最多20个）
    """
    try:
        versions = await version_manager.get_versions(
            user_id=user_id,
            limit=limit
        )

        return [
            VersionResponse(
                id=v.id,
                user_id=v.user_id,
                content=v.content,
                type=v.type.value,
                created_at=v.created_at.isoformat(),
                formatted_title=v.formatted_title,
                version_number=v.version_number,
                description=v.description,
                topic=v.topic,
                framework_id=v.framework_id,
                framework_name=v.framework_name,
                original_input=v.original_input,
            )
            for v in versions
        ]

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"获取版本列表失败: {str(e)}"
        )


@router.post("", response_model=VersionResponse)
async def save_version(request: SaveVersionRequest):
    """
    保存新版本

    保存用户的提示词版本
    """
    try:
        version_type = VersionType.SAVE if request.type == "save" else VersionType.OPTIMIZE

        version = await version_manager.save_version(
            user_id=request.user_id,
            content=request.content,
            version_type=version_type,
            version_number=request.version_number,
            description=request.description,
            topic=request.topic,
            framework_id=request.framework_id,
            framework_name=request.framework_name,
            original_input=request.original_input,
        )

        return VersionResponse(
            id=version.id,
            user_id=version.user_id,
            content=version.content,
            type=version.type.value,
            created_at=version.created_at.isoformat(),
            formatted_title=version.formatted_title,
            version_number=version.version_number,
            description=version.description,
            topic=version.topic,
            framework_id=version.framework_id,
            framework_name=version.framework_name,
            original_input=version.original_input,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"保存版本失败: {str(e)}"
        )


@router.get("/{version_id}", response_model=VersionResponse)
async def get_version(version_id: str):
    """
    获取特定版本

    根据版本 ID 获取版本详情
    """
    try:
        version = await version_manager.get_version(version_id)

        if version is None:
            raise HTTPException(
                status_code=404,
                detail="版本不存在"
            )

        return VersionResponse(
            id=version.id,
            user_id=version.user_id,
            content=version.content,
            type=version.type.value,
            created_at=version.created_at.isoformat(),
            formatted_title=version.formatted_title,
            version_number=version.version_number,
            description=version.description,
            topic=version.topic,
            framework_id=version.framework_id,
            framework_name=version.framework_name,
            original_input=version.original_input,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"获取版本失败: {str(e)}"
        )


@router.delete("/{version_id}")
async def delete_version(version_id: str, user_id: str = "test_user"):
    """
    删除版本

    删除指定的版本
    """
    try:
        success = await version_manager.delete_version(
            user_id=user_id,
            version_id=version_id
        )

        if not success:
            raise HTTPException(
                status_code=404,
                detail="版本不存在或无权限"
            )

        return {"success": True, "message": "版本已删除"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"删除版本失败: {str(e)}"
        )


@router.post("/{version_id}/rollback", response_model=VersionResponse)
async def rollback_version(version_id: str, user_id: str = "test_user"):
    """
    回滚到特定版本

    将指定版本的内容作为新版本保存
    """
    try:
        new_version = await version_manager.rollback_version(
            user_id=user_id,
            version_id=version_id
        )

        return VersionResponse(
            id=new_version.id,
            user_id=new_version.user_id,
            content=new_version.content,
            type=new_version.type.value,
            created_at=new_version.created_at.isoformat(),
            formatted_title=new_version.formatted_title,
            version_number=new_version.version_number,
            description=new_version.description,
            topic=new_version.topic,
            framework_id=new_version.framework_id,
            framework_name=new_version.framework_name,
            original_input=new_version.original_input,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"回滚版本失败: {str(e)}"
        )
