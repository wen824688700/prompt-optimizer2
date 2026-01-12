"""
邮箱认证服务
支持邮箱验证码注册和登录（类似手机号验证码，但使用邮箱）
"""
import logging
import random
from datetime import datetime, timedelta
from typing import Optional
from supabase import Client, create_client
from app.config import Settings

logger = logging.getLogger(__name__)


class EmailAuthService:
    """邮箱认证服务"""
    
    # 验证码发送限制
    MAX_CODE_PER_EMAIL_PER_HOUR = 5  # 每个邮箱每小时最多发送5次
    CODE_EXPIRY_MINUTES = 10  # 验证码有效期10分钟
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self._supabase: Optional[Client] = None
        self.dev_mode = settings.environment.lower() in ["development", "test", "testing"]
        # 开发模式：内存存储验证码
        self._dev_codes: dict[str, dict] = {}
    
    @property
    def supabase(self) -> Optional[Client]:
        """延迟初始化 Supabase 客户端"""
        if self._supabase is None and not self.dev_mode:
            try:
                self._supabase = create_client(
                    self.settings.supabase_url,
                    self.settings.supabase_key
                )
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")
        return self._supabase
    
    def _generate_code(self) -> str:
        """生成6位数字验证码"""
        return str(random.randint(100000, 999999))
    
    async def send_verification_code(
        self,
        email: str
    ) -> tuple[bool, str]:
        """
        发送验证码到邮箱
        
        Args:
            email: 邮箱地址
            
        Returns:
            (是否成功, 消息)
        """
        # 开发模式：使用固定验证码 123456
        if self.dev_mode:
            code = "123456"
            self._dev_codes[email] = {
                "code": code,
                "created_at": datetime.now()
            }
            logger.info(f"[DEV MODE] Verification code for {email}: {code}")
            return True, "验证码已发送（开发模式，验证码：123456）"
        
        if not self.supabase:
            return False, "服务暂时不可用"
        
        try:
            # 生成验证码
            code = self._generate_code()
            
            # 存储验证码到数据库
            try:
                self.supabase.table("email_verification_codes").insert({
                    "email": email,
                    "code": code,
                    "expires_at": (datetime.now() + timedelta(minutes=self.CODE_EXPIRY_MINUTES)).isoformat()
                }).execute()
                logger.info(f"Verification code stored in database for {email}")
            except Exception as db_error:
                logger.error(f"Database error for {email}: {db_error}")
                # 即使数据库失败，也尝试发送邮件（开发阶段）
                pass
            
            # ✅ 发送邮件（使用 Resend）
            try:
                import resend
                
                resend.api_key = self.settings.resend_api_key
                
                if not resend.api_key or resend.api_key.startswith("your-") or resend.api_key == "test-key":
                    logger.error(f"Invalid Resend API key: {resend.api_key[:10]}...")
                    return False, "邮件服务配置错误，请联系管理员"
                
                params = {
                    "from": self.settings.resend_from_email,
                    "to": [email],
                    "subject": "您的验证码 - Prompt Optimizer",
                    "html": f'''
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #7c3aed;">验证码</h2>
                        <p>您的验证码是：</p>
                        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #7c3aed;">
                            {code}
                        </div>
                        <p style="color: #6b7280; margin-top: 20px;">
                            此验证码将在 10 分钟后过期。
                        </p>
                        <p style="color: #6b7280;">
                            如果这不是您的操作，请忽略此邮件。
                        </p>
                    </div>
                    '''
                }
                
                email_response = resend.Emails.send(params)
                logger.info(f"Verification code sent to {email}, response: {email_response}")
                return True, "验证码已发送，请查收邮件"
                
            except Exception as email_error:
                logger.error(f"Email sending error for {email}: {type(email_error).__name__}: {email_error}")
                return False, f"发送邮件失败: {str(email_error)}"
            
        except Exception as e:
            logger.error(f"Unexpected error sending verification code to {email}: {type(e).__name__}: {e}")
            return False, "发送验证码失败，请稍后重试"
    
    async def verify_code_and_register(
        self,
        email: str,
        code: str,
        username: str,
        password: str
    ) -> tuple[bool, Optional[dict], str]:
        """
        验证验证码并注册
        
        Args:
            email: 邮箱地址
            code: 验证码
            username: 用户名
            password: 密码
            
        Returns:
            (是否成功, 用户信息, 消息)
        """
        # 开发模式：验证固定验证码
        if self.dev_mode:
            if code == "123456":
                mock_user = {
                    "id": f"dev-user-{username}",
                    "email": email,
                    "username": username,
                    "email_confirmed": True
                }
                logger.info(f"[DEV MODE] User registered: {email}")
                return True, mock_user, "注册成功"
            else:
                return False, None, "验证码错误（开发模式请使用 123456）"
        
        if not self.supabase:
            return False, None, "服务暂时不可用"
        
        try:
            # 验证验证码
            result = self.supabase.table("email_verification_codes")\
                .select("*")\
                .eq("email", email)\
                .eq("code", code)\
                .gte("expires_at", datetime.now().isoformat())\
                .execute()
            
            if not result.data:
                return False, None, "验证码错误或已过期"
            
            # 检查用户名是否可用
            is_available = await self.check_username_available(username)
            if not is_available:
                return False, None, "用户名已被使用"
            
            # 使用 Supabase Auth 注册
            response = self.supabase.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        "username": username
                    }
                }
            })
            
            if response.user:
                # 创建用户资料
                await self.create_user_profile(
                    user_id=response.user.id,
                    username=username,
                    email=email
                )
                
                # 删除已使用的验证码
                self.supabase.table("email_verification_codes")\
                    .delete()\
                    .eq("email", email)\
                    .execute()
                
                user_data = {
                    "id": response.user.id,
                    "email": response.user.email,
                    "username": username,
                    "email_confirmed": True
                }
                
                logger.info(f"User registered: {email}")
                return True, user_data, "注册成功"
            else:
                return False, None, "注册失败"
                
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error registering user {email}: {error_msg}")
            
            if "already registered" in error_msg.lower():
                return False, None, "该邮箱已被注册"
            
            return False, None, "注册失败，请稍后重试"
    
    async def login_with_email(
        self,
        email: str,
        password: str
    ) -> tuple[bool, Optional[dict], str]:
        """
        使用邮箱和密码登录
        
        Args:
            email: 邮箱地址
            password: 密码
            
        Returns:
            (是否成功, 用户信息, 消息)
        """
        # 开发模式：使用固定密码 123456
        if self.dev_mode:
            if password == "123456":
                mock_user = {
                    "id": f"dev-user-{email}",
                    "email": email,
                    "username": email.split("@")[0],
                    "email_confirmed": True
                }
                logger.info(f"[DEV MODE] Email login successful: {email}")
                return True, mock_user, "登录成功"
            else:
                return False, None, "邮箱或密码错误（开发模式请使用密码 123456）"
        
        if not self.supabase:
            return False, None, "服务暂时不可用"
        
        try:
            # 使用 Supabase Auth 登录
            response = self.supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            if response.user:
                # 获取用户资料
                profile = await self.get_user_profile(response.user.id)
                
                user_data = {
                    "id": response.user.id,
                    "email": response.user.email,
                    "username": profile.get("username") if profile else None,
                    "email_confirmed": response.user.email_confirmed_at is not None
                }
                
                logger.info(f"Email login successful: {email}")
                return True, user_data, "登录成功"
            else:
                return False, None, "邮箱或密码错误"
                
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error logging in with email {email}: {error_msg}")
            
            if "invalid" in error_msg.lower() or "credentials" in error_msg.lower():
                return False, None, "邮箱或密码错误"
            elif "not confirmed" in error_msg.lower():
                return False, None, "请先验证邮箱后再登录"
            
            return False, None, "登录失败，请稍后重试"
    
    async def login_with_username(
        self,
        username: str,
        password: str
    ) -> tuple[bool, Optional[dict], str]:
        """
        使用用户名和密码登录
        
        Args:
            username: 用户名
            password: 密码
            
        Returns:
            (是否成功, 用户信息, 消息)
        """
        # 开发模式：使用固定密码 123456
        if self.dev_mode:
            if password == "123456":
                mock_user = {
                    "id": f"dev-user-{username}",
                    "email": f"{username}@example.com",
                    "username": username,
                    "email_confirmed": True
                }
                logger.info(f"[DEV MODE] Username login successful: {username}")
                return True, mock_user, "登录成功"
            else:
                return False, None, "用户名或密码错误（开发模式请使用密码 123456）"
        
        if not self.supabase:
            return False, None, "服务暂时不可用"
        
        try:
            # 通过用户名查找邮箱
            result = self.supabase.table("user_profiles")\
                .select("email")\
                .eq("username", username)\
                .execute()
            
            if not result.data:
                return False, None, "用户名或密码错误"
            
            email = result.data[0]["email"]
            
            # 使用邮箱登录
            return await self.login_with_email(email, password)
            
        except Exception as e:
            logger.error(f"Error logging in with username {username}: {e}")
            return False, None, "登录失败，请稍后重试"
    
    async def reset_password_with_code(
        self,
        email: str,
        code: str,
        new_password: str
    ) -> tuple[bool, str]:
        """
        使用验证码重置密码
        
        Args:
            email: 邮箱地址
            code: 验证码
            new_password: 新密码
            
        Returns:
            (是否成功, 消息)
        """
        # 开发模式：验证固定验证码
        if self.dev_mode:
            if code == "123456":
                logger.info(f"[DEV MODE] Password reset for {email}")
                return True, "密码重置成功"
            else:
                return False, "验证码错误（开发模式请使用 123456）"
        
        if not self.supabase:
            return False, "服务暂时不可用"
        
        try:
            # 验证验证码
            result = self.supabase.table("email_verification_codes")\
                .select("*")\
                .eq("email", email)\
                .eq("code", code)\
                .gte("expires_at", datetime.now().isoformat())\
                .execute()
            
            if not result.data:
                return False, "验证码错误或已过期"
            
            # TODO: 使用 Supabase Auth 重置密码
            # 这里需要实现密码重置逻辑
            
            # 删除已使用的验证码
            self.supabase.table("email_verification_codes")\
                .delete()\
                .eq("email", email)\
                .execute()
            
            logger.info(f"Password reset for {email}")
            return True, "密码重置成功"
            
        except Exception as e:
            logger.error(f"Error resetting password for {email}: {e}")
            return False, "重置密码失败，请稍后重试"
    
    async def create_user_profile(
        self,
        user_id: str,
        username: str,
        email: str
    ) -> tuple[bool, str]:
        """
        创建用户资料
        
        Args:
            user_id: 用户ID
            username: 用户名
            email: 邮箱
            
        Returns:
            (是否成功, 消息)
        """
        if self.dev_mode:
            logger.info(f"[DEV MODE] Create profile for user {user_id}")
            return True, "资料创建成功"
        
        if not self.supabase:
            return False, "服务暂时不可用"
        
        try:
            self.supabase.table("user_profiles").insert({
                "id": user_id,
                "username": username,
                "email": email
            }).execute()
            
            return True, "资料创建成功"
            
        except Exception as e:
            logger.error(f"Error creating profile for {user_id}: {e}")
            return False, "创建资料失败"
    
    async def get_user_profile(self, user_id: str) -> Optional[dict]:
        """获取用户资料"""
        if self.dev_mode:
            return {"username": "dev_user", "email": "dev@example.com"}
        
        if not self.supabase:
            return None
        
        try:
            result = self.supabase.table("user_profiles")\
                .select("*")\
                .eq("id", user_id)\
                .execute()
            
            return result.data[0] if result.data else None
            
        except Exception as e:
            logger.error(f"Error getting profile for {user_id}: {e}")
            return None
    
    async def check_username_available(self, username: str) -> bool:
        """检查用户名是否可用"""
        if self.dev_mode:
            return True
        
        if not self.supabase:
            return False
        
        try:
            result = self.supabase.table("user_profiles")\
                .select("id")\
                .eq("username", username)\
                .execute()
            
            return len(result.data) == 0
            
        except Exception as e:
            logger.error(f"Error checking username availability: {e}")
            return False
