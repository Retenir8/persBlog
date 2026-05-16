# 交友系统功能完善计划表

## 项目现状总结

### 已实现的功能 ✅
- 基础关注/取消关注机制
- 单向/双向关系状态检测（none/following/followed/mutual）
- 好友请求处理（接受/忽略）
- 好友列表页面（含分组标签栏）
- 好友分组创建/重命名/删除
- 好友分组成员管理
- 基础私信系统（文字、图片、文件）
- 会话管理（创建、删除、排序）
- 订阅页面（我的订阅）
- 订阅源显示（当天 + 近3天）

### 核心问题分析
1. **数据库模型不完整**：缺少黑名单、消息已读回执、离线消息过期等字段
2. **权限控制未实现**：发布文章的分组可见性权限未集成到系统中
3. **UI交互缺陷**：多个功能UI不完整或缺少完整交互逻辑
4. **API功能不完整**：撤回消息、批量操作、分组筛选等API缺失
5. **用户体验优化缺失**：在线状态、最近互动排序、快捷按钮等未实现

---

## 阶段一：基础关系体系搭建（优先级：⭐⭐⭐⭐⭐）

### 1.1 分级关注与关系状态显示

#### 任务 1.1.1：完善个人主页的关系按钮UI（优先级：⭐⭐⭐⭐⭐）
- **当前状态**：RelationButton 组件已存在，但样式和逻辑需验证
- **需完成工作**：
  - ✅ 验证四种状态的按钮样式是否正确对应（蓝色/灰色/蓝色/绿色）
  - ✅ 验证取消关注时的确认对话框显示
  - ⚠️ 在 ProfileEditorClient 中增加消息发送快捷按钮（联动私信系统）
  - ⚠️ 增加访问个人博客快捷按钮
  - 🔴 **未实现**：页面自动刷新状态（需要添加 useEffect 监听状态变化）
- **关联文件**：
  - [src/components/social/RelationButton.tsx](src/components/social/RelationButton.tsx)
  - [src/app/users/[id]/ProfileEditorClient.tsx](src/app/users/[id]/ProfileEditorClient.tsx)
- **验收标准**：
  - ✅ 未关注状态显示蓝色"关注"按钮
  - ✅ 已关注状态显示灰色"已关注"按钮，点击弹出确认框
  - ✅ 被关注状态显示蓝色"回关"按钮
  - ✅ 互相关注状态显示绿色"互相关注"按钮
  - ✅ 所有操作后页面状态正确更新

#### 任务 1.1.2：增强关系状态持久化和实时反映（优先级：⭐⭐⭐⭐）
- **当前状态**：状态局部管理，缺少全局状态同步
- **需完成工作**：
  - 🔴 **未实现**：在好友列表或其他页面修改关系后，需要清除主页的缓存或触发重新验证
  - 🔴 **未实现**：使用 revalidatePath 确保页面级别的数据更新
  - 🔴 **未实现**：考虑使用 React Query 或 SWR 进行全局状态管理
- **关联文件**：
  - [src/lib/services/followService.ts](src/lib/services/followService.ts)
  - [src/app/api/follows/route.ts](src/app/api/follows/route.ts)
- **验收标准**：
  - ✅ 在任何页面修改关系后，其他页面的状态显示一致
  - ✅ 无需手动刷新，状态自动同步

### 1.2 单向订阅基础功能

#### 任务 1.2.1：完善"我的订阅"页面功能（优先级：⭐⭐⭐⭐⭐）
- **当前状态**：页面已存在，但功能不完整
- **需完成工作**：
  - ✅ 验证头像网格 + 昵称形式的显示是否正确
  - ⚠️ 点击头像进入对方个人博客是否正确跳转
  - 🔴 **未实现**：搜索框功能（按昵称/ID 搜索）
    - 需要在 SubscriptionsPage 中添加搜索框 UI
    - 需要在 fetchFollowings 时支持搜索参数
    - 需要在前端进行搜索过滤或调用搜索 API
  - 🔴 **未实现**：最后更新时间显示
    - 数据库中需要追踪每个用户最后发布文章的时间
    - 需要修改 Post 模型或创建缓存机制
    - 需要在订阅页面显示"X天前更新"
  - 🔴 **未实现**：排序功能（按最近更新时间排序）
    - 需要修改 fetchFollowings 的排序逻辑
    - 需要与最后更新时间显示联动
  - 🔴 **未实现**：页面排序需要根据最近更新时间（而非关注时间）
- **关联文件**：
  - [src/app/users/[id]/subscriptions/page.tsx](src/app/users/[id]/subscriptions/page.tsx)
  - [src/lib/services/followService.ts](src/lib/services/followService.ts)
- **验收标准**：
  - ✅ 搜索框支持按昵称和ID搜索
  - ✅ 每个用户显示最后更新时间
  - ✅ 按最近更新时间排序（最新在前）
  - ✅ 点击头像可进入对方个人博客

#### 任务 1.2.2：增强订阅源显示的"取消订阅"功能（优先级：⭐⭐⭐⭐）
- **当前状态**：SubscriptionFeed 组件中的取消订阅按钮为空实现
- **需完成工作**：
  - 🔴 **未实现**：点击取消订阅按钮的完整逻辑
    - 需要调用 `/api/follows` 的 unfollow 操作
    - 需要刷新订阅源列表
    - 需要显示成功提示
  - 🔴 **未实现**：悬停时显示取消订阅按钮的动画效果
- **关联文件**：
  - [src/components/social/SubscriptionFeed.tsx](src/components/social/SubscriptionFeed.tsx)
- **验收标准**：
  - ✅ 点击取消订阅按钮后，该用户的文章从列表中消失
  - ✅ 后端正确记录取消关注
  - ✅ 显示成功提示信息

#### 任务 1.2.3：完善主界面的订阅区块（优先级：⭐⭐⭐⭐）
- **当前状态**：SubscriptionFeed 已集成到主界面
- **需完成工作**：
  - ✅ 验证当天文章默认显示是否正确实现
  - ✅ 验证"查看近3天更新"折叠按钮是否正确工作
  - 🔴 **未实现**：文章的发布者信息完整性（头像、昵称应展示）
  - 🔴 **未实现**：如果没有订阅用户或没有新文章，需要显示空状态提示
- **关联文件**：
  - [src/components/social/SubscriptionFeed.tsx](src/components/social/SubscriptionFeed.tsx)
  - [src/app/page.tsx](src/app/page.tsx)（验证集成位置）
- **验收标准**：
  - ✅ 默认显示当天订阅用户的新文章
  - ✅ 点击"查看近3天更新"后显示近3天的文章
  - ✅ 文章显示发布者头像+昵称+标题+发布时间
  - ✅ 空状态显示友好提示

### 1.3 双向好友与基础好友列表

#### 任务 1.3.1：验证好友列表页面的完整性（优先级：⭐⭐⭐⭐⭐）
- **当前状态**：FriendsPage 已存在，但需验证功能完整性
- **需完成工作**：
  - ✅ 验证"好友请求"提示显示是否正确
  - ✅ 验证"接受"和"忽略"按钮是否工作正常
  - ✅ 验证好友列表按添加时间排序是否正确
  - 🔴 **未实现**：点击头像进入对方个人博客的跳转
  - 🔴 **未实现**：好友列表的搜索功能
    - 需要在页面顶部添加搜索框
    - 需要实现搜索过滤逻辑
  - 🔴 **未实现**：页面排序改为最近互动时间（待阶段三）
- **关联文件**：
  - [src/app/users/[id]/friends/page.tsx](src/app/users/[id]/friends/page.tsx)
- **验收标准**：
  - ✅ 好友请求显示正确的用户信息
  - ✅ 接受请求后用户成为双向好友
  - ✅ 忽略请求后请求消失
  - ✅ 所有双向好友正确显示在列表中
  - ✅ 可以搜索好友（按昵称/ID）

#### 任务 1.3.2：完善好友分组的默认分组创建（优先级：⭐⭐⭐⭐）
- **当前状态**：默认分组"特别关注"在 friendGroupService 中自动创建
- **需完成工作**：
  - ✅ 验证首次访问好友列表时是否自动创建"特别关注"分组
  - ✅ 验证分组无法删除的保护逻辑是否正确
  - 🔴 **未实现**：如果用户在第一次登录时应该创建默认分组
    - 考虑在用户注册时创建
    - 或在首次访问好友系统时自动创建
- **关联文件**：
  - [src/lib/services/friendGroupService.ts](src/lib/services/friendGroupService.ts)
- **验收标准**：
  - ✅ 每个用户都有"特别关注"默认分组
  - ✅ 用户无法删除"特别关注"分组
  - ✅ 用户无法重命名"特别关注"分组

#### 任务 1.3.3：完善分组标签栏的UI和交互（优先级：⭐⭐⭐⭐）
- **当前状态**：FriendsPage 中已有分组标签栏实现
- **需完成工作**：
  - ✅ 验证分组标签栏的显示顺序
  - ✅ 验证点击标签时的筛选是否正确
  - 🔴 **未实现**：分组菜单的"..."按钮样式和功能
    - 需要美化"..."按钮的外观（当前使用 ⋮ 符号）
    - 需要验证长按或右键菜单的正确显示
  - 🔴 **未实现**：分组操作的确认对话框
    - 删除分组时应显示确认对话框
    - 防止误删操作
- **关联文件**：
  - [src/app/users/[id]/friends/page.tsx](src/app/users/[id]/friends/page.tsx)
- **验收标准**：
  - ✅ 分组标签栏显示所有分组
  - ✅ 点击标签能正确筛选好友
  - ✅ "全部好友"标签显示所有双向好友
  - ✅ 分组菜单能正确显示重命名和删除选项
  - ✅ 删除时显示确认对话框

---

## 阶段二：核心社交功能实现（优先级：⭐⭐⭐⭐⭐）

### 2.1 轻量化私信系统基础版

#### 任务 2.1.1：完善私信系统的数据库模型（优先级：⭐⭐⭐⭐⭐）
- **当前状态**：基础模型已存在（Conversation, Message, ConversationSetting）
- **需完成工作**：
  - 🔴 **未实现**：黑名单模型
    - 需要添加 Blacklist 表
    - 字段：id, userId, blockedUserId, createdAt
    - 当用户被拉黑后，无法发送私信，也无法查看发送者的非公开文章
  - 🔴 **未实现**：消息已读回执时间
    - 需要在 Message 中添加 readAt 字段（已有，需验证使用）
    - 需要验证 isRead 字段的正确性
  - 🔴 **未实现**：离线消息过期时间
    - 需要添加定时任务清理 7 天前的离线消息
    - 或在消息查询时过滤过期消息
  - 🔴 **未实现**：消息撤回机制
    - 需要添加 Message.isRetracted 字段
    - 需要添加 Message.retractedAt 字段
    - 需要限制撤回时间为 2 分钟内
  - 🔴 **未实现**：消息 @提及 支持（可选，阶段三）
  - 🔴 **未实现**：已读回执的全局开关
    - 需要在 User 表中添加 readReceiptEnabled 字段（默认 true）
    - 在 ConversationSetting 中添加单个会话的覆盖选项
- **关联文件**：
  - [prisma/schema.prisma](prisma/schema.prisma)
- **需要新增的数据库迁移**：
  - 创建 Blacklist 表
  - 为 Message 添加 isRetracted 和 retractedAt 字段
  - 为 User 添加 readReceiptEnabled 字段
  - 验证 ConversationSetting 中是否需要 readReceiptEnabled 覆盖字段
- **验收标准**：
  - ✅ 黑名单相关的数据库表正确创建
  - ✅ 消息撤回相关字段正确添加
  - ✅ 已读回执全局开关字段正确添加

#### 任务 2.1.2：实现全局已读回执开关（优先级：⭐⭐⭐⭐）
- **当前状态**：API 中未实现此功能
- **需完成工作**：
  - 🔴 **未实现**：个人设置页面中的已读回执开关
    - 需要在用户设置页面添加此开关
    - 需要支持更新 User.readReceiptEnabled
  - 🔴 **未实现**：已读回执 API
    - 需要创建 PATCH `/api/users/settings` 以支持更新用户设置
    - 需要支持 readReceiptEnabled 字段的更新
  - 🔴 **未实现**：私信页面显示的已读回执状态
    - 需要根据全局开关判断是否显示已读标记
    - 需要验证消息中的 status 字段是否正确使用
  - 🔴 **未实现**：单个会话的已读回执覆盖开关
    - 需要在会话设置中添加此选项（长按会话弹出菜单）
    - 需要支持在 ConversationSetting 中存储此选项
- **关联文件**：
  - [src/app/api/users/settings/route.ts](新建)
  - [src/app/messages/page.tsx](src/app/messages/page.tsx)
  - [src/lib/services/messageService.ts](src/lib/services/messageService.ts)
- **验收标准**：
  - ✅ 用户可以在设置中启用/禁用已读回执
  - ✅ 禁用已读回执后，私信中不显示已读标记
  - ✅ 可以在单个会话中覆盖全局设置

#### 任务 2.1.3：实现单个会话免打扰功能（优先级：⭐⭐⭐⭐）
- **当前状态**：数据模型存在 ConversationSetting.isMuted，但 UI 不完整
- **需完成工作**：
  - ✅ 验证 isMuted 字段是否正确存储
  - 🔴 **未实现**：长按会话弹出菜单中的免打扰选项
    - 需要在私信列表中实现长按或右键菜单
    - 需要显示"免打扰"、"置顶"、"删除"等选项
  - 🔴 **未实现**：免打扰后的视觉指示
    - 免打扰的会话应该不显示未读角标
    - 免打扰的会话应该显示不同的样式（如变灰）
  - 🔴 **未实现**：免打扰会话在列表底部的显示
    - 当前排序逻辑中未考虑免打扰的优先级
- **关联文件**：
  - [src/app/messages/page.tsx](src/app/messages/page.tsx)
  - [src/lib/services/messageService.ts](src/lib/services/messageService.ts)
  - [src/app/api/conversations/[id]/route.ts](需要创建/更新)
- **需要新建/完善的 API 路由**：
  - `POST /api/conversations/{id}/mute` - 设置免打扰
  - `DELETE /api/conversations/{id}/mute` - 取消免打扰
- **验收标准**：
  - ✅ 可以长按会话弹出菜单
  - ✅ 可以设置会话为免打扰
  - ✅ 免打扰会话不显示未读角标
  - ✅ 免打扰会话显示不同样式
  - ✅ 免打扰会话在列表底部显示

#### 任务 2.1.4：实现拉黑用户功能（优先级：⭐⭐⭐⭐）
- **当前状态**：未实现
- **需完成工作**：
  - 🔴 **未实现**：长按会话弹出菜单中的拉黑选项
    - 需要在私信列表中添加此选项
    - 需要显示确认对话框
  - 🔴 **未实现**：Blacklist API
    - `POST /api/blacklist` - 拉黑用户
    - `DELETE /api/blacklist/{userId}` - 取消拉黑
    - `GET /api/blacklist` - 获取黑名单
  - 🔴 **未实现**：拉黑后的权限控制
    - 被拉黑用户无法发送私信给拉黑者
    - 被拉黑用户无法查看拉黑者的非公开文章
    - 被拉黑用户的评论对拉黑者不可见
  - 🔴 **未实现**：黑名单管理页面
    - 需要在用户设置中添加黑名单管理
    - 需要支持查看和移除黑名单
- **关联文件**：
  - [src/app/api/blacklist/route.ts](src/app/api/blacklist/route.ts) - 需要创建完整实现
  - [src/app/messages/page.tsx](src/app/messages/page.tsx)
- **需要创建的新 API 路由**：
  - 完善 `src/app/api/blacklist/route.ts`
  - 创建 `src/app/api/blacklist/[userId]/route.ts`
- **需要创建的业务逻辑**：
  - 创建 `src/lib/services/blacklistService.ts`
- **需要完善的权限检查**：
  - 在发送私信时检查黑名单
  - 在查看文章时检查黑名单
  - 在显示评论时检查黑名单
- **验收标准**：
  - ✅ 可以从私信列表拉黑用户
  - ✅ 被拉黑用户无法发送私信
  - ✅ 拉黑后显示确认消息
  - ✅ 可以在黑名单管理中查看和移除黑名单

#### 任务 2.1.5：实现链接发送和文件上传（优先级：⭐⭐⭐⭐）
- **当前状态**：私信页面中已有图片和文件上传按钮，需验证完整性
- **需完成工作**：
  - ✅ 验证图片上传是否正常工作
  - ✅ 验证文件上传是否正常工作
  - 🔴 **未实现**：链接发送的专用处理
    - 需要支持粘贴链接自动识别
    - 需要验证链接是否已包含在 contentType 中
    - 如果没有专用 LINK 类型，需要添加
  - 🔴 **未实现**：链接预览功能（待阶段三）
- **关联文件**：
  - [src/app/messages/page.tsx](src/app/messages/page.tsx)
  - [src/app/api/messages/route.ts](需要检查)
- **验收标准**：
  - ✅ 可以发送文字、图片、文件消息
  - ✅ 消息类型在数据库中正确保存
  - ✅ 接收者可以正确显示不同类型的消息

#### 任务 2.1.6：实现离线消息保存和推送（优先级：⭐⭐⭐⭐）
- **当前状态**：消息持久化已实现，但离线推送机制未完成
- **需完成工作**：
  - ✅ 验证消息是否被正确保存到数据库
  - 🔴 **未实现**：用户上线时的离线消息推送
    - 需要添加用户上线时的事件处理
    - 需要查询 7 天内的未读消息
    - 需要推送给前端
  - 🔴 **未实现**：离线消息的 7 天过期清理
    - 需要添加定时任务或数据库触发器
    - 定期清理超过 7 天的消息
  - 🔴 **未实现**：消息查询时的过期过滤
    - 需要在 getConversationMessages 中过滤过期消息
- **关联文件**：
  - [src/lib/services/messageService.ts](src/lib/services/messageService.ts)
  - [src/app/api/messages/route.ts](需要新增端点)
- **需要创建的新 API 路由**：
  - `GET /api/messages/offline` - 获取离线消息
- **需要创建的后台任务**：
  - 创建消息过期清理任务（可使用 cron 或内存任务队列）
- **验收标准**：
  - ✅ 用户离线期间收到的消息被保存
  - ✅ 用户上线时收到所有 7 天内的离线消息
  - ✅ 超过 7 天的消息被清理

### 2.2 好友分组管理基础版

#### 任务 2.2.1：完善好友分组的批量操作（优先级：⭐⭐⭐⭐）
- **当前状态**：单个操作已实现，批量操作未完成
- **需完成工作**：
  - 🔴 **未实现**：多选好友功能
    - 需要在好友列表中添加复选框
    - 需要添加"全选"复选框
    - 需要显示已选择的数量
  - 🔴 **未实现**：批量添加到分组
    - 需要在多选后显示"添加到分组"按钮
    - 需要调用 batchAddFriendsToGroup API
    - 需要显示成功提示
  - 🔴 **未实现**：批量删除好友
    - 需要在多选后显示"删除"按钮
    - 需要调用 API 批量删除好友
    - 需要显示确认对话框
  - 🔴 **未实现**：将单个好友添加到多个分组
    - 需要在好友项右侧显示快捷按钮
    - 点击后弹出分组选择对话框
- **关联文件**：
  - [src/app/users/[id]/friends/page.tsx](src/app/users/[id]/friends/page.tsx)
  - [src/lib/services/friendGroupService.ts](src/lib/services/friendGroupService.ts)
- **需要新增/完善的 API 路由**：
  - 需要验证 `POST /api/friend-groups` 的 batchAddFriends 逻辑
  - 需要创建 `DELETE /api/friends/{friendId}` 来删除好友
  - 需要创建批量删除端点
- **需要创建的业务逻辑**：
  - 创建或完善 friendGroupService 中的批量操作函数
- **验收标准**：
  - ✅ 可以多选好友
  - ✅ 可以批量添加到分组
  - ✅ 可以批量删除好友
  - ✅ 单个好友可以添加到多个分组

#### 任务 2.2.2：实现文章分组可见性权限控制（优先级：⭐⭐⭐⭐⭐）
- **当前状态**：文章模型中缺少可见性字段，权限检查未实现
- **需完成工作**：
  - 🔴 **未实现**：Post 表的可见性字段
    - 需要添加 Post.visibility 字段（ENUM: PUBLIC, PRIVATE, FRIEND_GROUP）
    - 需要添加 Post.visibleGroupIds 字段（存储可见的分组 ID）
    - 需要添加 Post.invisibleGroupIds 字段（存储不可见的分组 ID）
  - 🔴 **未实现**：发布文章时的可见性设置 UI
    - 需要在 PostEditorForm 中添加可见性选项
    - 选项包括：公开、仅全部好友、仅特定分组、仅自己
    - 需要支持多选分组和排除分组
  - 🔴 **未实现**：文章访问权限检查
    - 需要完善 canViewPost 函数以支持分组权限检查
    - 需要检查用户是否在允许的分组中
    - 需要检查用户是否在排除的分组中
  - 🔴 **未实现**：文章列表过滤
    - 查询文章列表时需要过滤用户无权查看的文章
    - 需要在 searchPosts 中添加权限检查
- **关联文件**：
  - [prisma/schema.prisma](prisma/schema.prisma)
  - [src/components/blog/PostEditorForm.tsx](src/components/blog/PostEditorForm.tsx)
  - [src/lib/services/postService.ts](src/lib/services/postService.ts)
  - [src/app/api/posts/route.ts](src/app/api/posts/route.ts)
- **需要新增的数据库迁移**：
  - 为 Post 表添加 visibility 和相关字段
- **需要修改的 API 路由**：
  - 修改 `POST /api/posts` 支持 visibility 参数
  - 修改 `PUT /api/posts/{id}` 支持 visibility 参数
  - 修改 `GET /api/posts` 支持权限过滤
- **需要修改的业务逻辑**：
  - 完善 postService.ts 中的权限检查函数
- **验收标准**：
  - ✅ 发布文章时可以选择可见性
  - ✅ 可以选择仅特定分组可见
  - ✅ 可以选择排除特定分组
  - ✅ 用户只能查看有权限的文章
  - ✅ 文章列表过滤正确

#### 任务 2.2.3：实现好友分组与订阅源的整合（优先级：⭐⭐⭐⭐）
- **当前状态**：订阅源显示所有关注用户的文章，未支持分组过滤
- **需完成工作**：
  - 🔴 **未实现**：主界面订阅区的分组筛选
    - 需要在 SubscriptionFeed 顶部添加分组下拉框
    - 默认显示"全部好友"
    - 需要根据选定分组过滤文章
  - 🔴 **未实现**：订阅源 API 的分组参数
    - 需要修改 `/api/posts/subscriptions` 支持 groupId 参数
    - 需要根据分组过滤文章来源的用户
  - 🔴 **未实现**：业务逻辑的分组过滤
    - 需要在 postService 中增加分组过滤逻辑
    - 需要查询指定分组中的所有成员
    - 需要只返回这些成员发布的文章
- **关联文件**：
  - [src/components/social/SubscriptionFeed.tsx](src/components/social/SubscriptionFeed.tsx)
  - [src/app/api/posts/subscriptions/route.ts](src/app/api/posts/subscriptions/route.ts)
  - [src/lib/services/postService.ts](src/lib/services/postService.ts)
- **需要修改的 API 路由**：
  - 修改 `GET /api/posts/subscriptions` 支持 groupId 查询参数
- **需要修改的业务逻辑**：
  - 完善文章查询逻辑以支持分组过滤
- **验收标准**：
  - ✅ 订阅源显示分组下拉框
  - ✅ 选择分组后只显示该分组成员的文章
  - ✅ "全部好友"显示所有关注用户的文章

---

## 阶段三：体验优化与实用性增强（优先级：⭐⭐⭐）

### 3.1 私信系统体验优化

#### 任务 3.1.1：实现置顶会话功能（优先级：⭐⭐⭐⭐）
- **当前状态**：数据模型已有 isPinned 字段，但 UI 交互未完整
- **需完成工作**：
  - ✅ 验证 isPinned 字段是否正确存储
  - 🔴 **未实现**：长按会话的置顶操作
    - 需要完善弹出菜单显示"置顶"/"取消置顶"选项
  - 🔴 **未实现**：置顶会话的排序逻辑
    - 当前代码中已有逻辑：`if (a.isPinned && !b.isPinned) return -1;`
    - 需要验证是否正确应用
  - 🔴 **未实现**：置顶会话的视觉指示
    - 置顶会话应显示不同样式（如背景色或图标）
- **关联文件**：
  - [src/app/messages/page.tsx](src/app/messages/page.tsx)
  - [src/app/api/conversations/{id}/pin/route.ts](需要验证存在)
- **验收标准**：
  - ✅ 可以置顶会话
  - ✅ 置顶会话永远显示在列表顶部
  - ✅ 置顶会话显示特殊样式

#### 任务 3.1.2：实现消息撤回功能（优先级：⭐⭐⭐⭐）
- **当前状态**：未实现
- **需完成工作**：
  - 🔴 **未实现**：消息撤回 API
    - 创建 `POST /api/messages/{messageId}/retract`
    - 需要验证发送者和时间限制
    - 需要更新 Message.isRetracted 和 retractedAt
  - 🔴 **未实现**：消息长按菜单
    - 需要在自己发送的消息上添加长按菜单
    - 需要显示"撤回"选项（仅在 2 分钟内可用）
  - 🔴 **未实现**：撤回消息的显示
    - 消息被撤回后应显示"消息已被撤回"
    - 需要在 Message 组件中处理 isRetracted 状态
  - 🔴 **未实现**：时间限制的检查
    - 需要在前端检查消息是否仍可撤回（2 分钟内）
    - 需要在后端验证时间限制
- **关联文件**：
  - [src/app/messages/page.tsx](src/app/messages/page.tsx)
  - 需要创建 `src/app/api/messages/[id]/retract/route.ts`
  - [src/lib/services/messageService.ts](src/lib/services/messageService.ts)
- **需要创建的新 API 路由**：
  - `POST /api/messages/{id}/retract`
- **需要修改的业务逻辑**：
  - 添加消息撤回函数到 messageService
- **验收标准**：
  - ✅ 可以长按自己的消息
  - ✅ 2 分钟内可以撤回消息
  - ✅ 撤回后消息显示"消息已被撤回"
  - ✅ 2 分钟后无法撤回

#### 任务 3.1.3：实现链接预览功能（优先级：⭐⭐⭐）
- **当前状态**：未实现
- **需完成工作**：
  - 🔴 **未实现**：链接识别和预览提取
    - 需要在后端识别消息中的链接
    - 需要抓取链接的 meta 信息（标题、描述、图片）
    - 可以使用第三方库如 cheerio 或专用 API
  - 🔴 **未实现**：预览缓存
    - 需要缓存已提取的预览信息
    - 避免重复请求
  - 🔴 **未实现**：前端预览显示
    - 需要在消息中显示链接预览卡片
    - 显示标题 + 域名 + 图片（可选）
  - 🔴 **未实现**：链接预览 API
    - 创建 `GET /api/link-preview` 来提取链接信息
    - 或在消息发送时直接包含预览信息
- **关联文件**：
  - [src/app/messages/page.tsx](src/app/messages/page.tsx)
  - 需要创建 `src/app/api/link-preview/route.ts`
  - [src/lib/services/messageService.ts](src/lib/services/messageService.ts)
- **需要创建的新 API 路由**：
  - `GET /api/link-preview` 或集成到消息发送
- **需要创建的工具函数**：
  - 创建链接预览提取函数
- **验收标准**：
  - ✅ 发送链接时自动生成预览
  - ✅ 预览显示标题、域名和图片
  - ✅ 预览缓存正常工作

#### 任务 3.1.4：完善表情面板（优先级：⭐⭐⭐）
- **当前状态**：表情面板代码已存在（emojis 数组），但 UI 可能需要优化
- **需完成工作**：
  - ✅ 验证表情面板是否正确显示
  - 🔴 **未实现**：表情面板的完整性
    - 当前只有 21 个常用表情
    - 可以扩展为更多表情分类
    - 可以支持搜索表情
  - 🔴 **未实现**：表情面板的持久化
    - 可以记录用户最近使用的表情
  - 🔴 **未实现**：表情面板的移动端优化
- **关联文件**：
  - [src/app/messages/page.tsx](src/app/messages/page.tsx)
- **验收标准**：
  - ✅ 表情面板正确显示
  - ✅ 可以选择表情插入到输入框
  - ✅ 表情面板可以收起和展开

### 3.2 好友列表与分组体验优化

#### 任务 3.2.1：实现好友列表的快捷操作按钮（优先级：⭐⭐⭐⭐）
- **当前状态**：未实现
- **需完成工作**：
  - 🔴 **未实现**：快捷按钮显示
    - 每个好友项需要显示两个按钮：📝发私信、📖看博客
    - 需要在鼠标悬停时显示这些按钮
  - 🔴 **未实现**：发私信按钮的功能
    - 点击后应导航到私信页面，自动打开该好友的会话
    - 需要和私信系统集成
  - 🔴 **未实现**：看博客按钮的功能
    - 点击后应导航到好友的个人主页
- **关联文件**：
  - [src/app/users/[id]/friends/page.tsx](src/app/users/[id]/friends/page.tsx)
- **需要修改的组件**：
  - 需要在好友列表中添加快捷按钮 UI
- **验收标准**：
  - ✅ 悬停好友项时显示快捷按钮
  - ✅ 点击发私信按钮打开聊天
  - ✅ 点击看博客按钮进入个人主页

#### 任务 3.2.2：实现好友列表的搜索功能（优先级：⭐⭐⭐⭐）
- **当前状态**：未实现
- **需完成工作**：
  - 🔴 **未实现**：搜索框 UI
    - 需要在好友列表顶部添加搜索框
    - 需要支持实时搜索
  - 🔴 **未实现**：搜索逻辑
    - 需要按昵称和 ID 搜索
    - 需要支持部分匹配
  - 🔴 **未实现**：搜索结果过滤
    - 搜索时过滤好友列表
    - 需要在前端实现（无需新增 API）
- **关联文件**：
  - [src/app/users/[id]/friends/page.tsx](src/app/users/[id]/friends/page.tsx)
- **验收标准**：
  - ✅ 搜索框可以输入
  - ✅ 实时过滤好友列表
  - ✅ 支持按昵称和 ID 搜索

#### 任务 3.2.3：实现在线状态指示（优先级：⭐⭐⭐）
- **当前状态**：私信列表中已有 isOnline 字段，但实现是伪造的（Math.random）
- **需完成工作**：
  - 🔴 **未实现**：真实的在线状态追踪
    - 需要在数据库中记录用户的最后活动时间
    - 需要添加 User.lastSeenAt 字段
  - 🔴 **未实现**：在线状态推送
    - 需要在用户登录时更新 lastSeenAt
    - 需要定期更新 lastSeenAt（心跳）
  - 🔴 **未实现**：在线状态显示
    - 好友列表中应显示绿色小圆点表示在线
    - 需要根据 lastSeenAt 判断是否在线（如 5 分钟内）
  - 🔴 **未实现**：在线状态计算
    - 需要在好友列表或私信列表查询时计算在线状态
    - 可以在前端计算（如果 lastSeenAt 在 5 分钟内）
- **关联文件**：
  - [prisma/schema.prisma](prisma/schema.prisma)
  - [src/lib/services/messageService.ts](src/lib/services/messageService.ts)
  - [src/app/messages/page.tsx](src/app/messages/page.tsx)
- **需要新增的数据库迁移**：
  - 为 User 表添加 lastSeenAt 字段
- **需要修改的 API 路由**：
  - 修改用户登录/中间件，更新 lastSeenAt
- **需要创建的后台任务**：
  - 可选：创建定期更新 lastSeenAt 的心跳机制
- **验收标准**：
  - ✅ 在线用户显示绿色小圆点
  - ✅ 离线用户不显示圆点
  - ✅ 在线状态相对准确

#### 任务 3.2.4：实现好友列表按最近互动时间排序（优先级：⭐⭐⭐⭐）
- **当前状态**：当前按添加时间排序，需要改为最近互动时间
- **需完成工作**：
  - 🔴 **未实现**：最近互动时间追踪
    - 需要在 FriendGroupMember 或 Follow 表中添加 lastInteractedAt 字段
    - 需要在发送消息或评论时更新此字段
  - 🔴 **未实现**：排序逻辑修改
    - 需要修改 getGroupMembers 的排序
    - 改为按 lastInteractedAt 降序排列
  - 🔴 **未实现**：互动时间的初始化
    - 新的好友关系初始化时设置当前时间
    - 或使用关注时间作为初始值
- **关联文件**：
  - [prisma/schema.prisma](prisma/schema.prisma)
  - [src/lib/services/friendGroupService.ts](src/lib/services/friendGroupService.ts)
  - [src/app/users/[id]/friends/page.tsx](src/app/users/[id]/friends/page.tsx)
- **需要新增的数据库迁移**：
  - 为 FriendGroupMember 添加 lastInteractedAt 字段
- **需要修改的业务逻辑**：
  - 在消息发送时更新 lastInteractedAt
  - 在评论发送时更新 lastInteractedAt
  - 修改排序逻辑
- **验收标准**：
  - ✅ 好友列表按最近互动时间排序
  - ✅ 最近交互过的好友显示在前面
  - ✅ 排序在有新的交互时自动更新

#### 任务 3.2.5：实现分组标签栏的拖拽排序（优先级：⭐⭐）
- **当前状态**：分组标签栏已显示，但不支持拖拽调整
- **需完成工作**：
  - 🔴 **未实现**：拖拽 UI
    - 需要使用拖拽库如 react-beautiful-dnd 或原生拖拽 API
    - 需要在分组标签栏上实现拖拽交互
  - 🔴 **未实现**：拖拽排序保存
    - 需要在拖拽完成后调用 updateGroupSortOrder API
    - 需要更新 FriendGroup.sortOrder 字段
  - 🔴 **未实现**：排序的持久化
    - 需要确保排序在数据库中正确保存
    - 需要在查询时按 sortOrder 排序
- **关联文件**：
  - [src/app/users/[id]/friends/page.tsx](src/app/users/[id]/friends/page.tsx)
  - [src/lib/services/friendGroupService.ts](src/lib/services/friendGroupService.ts)
- **需要修改的 API 路由**：
  - 验证 `PUT /api/friend-groups/order` 或创建类似的排序 API
- **需要添加的依赖**：
  - 可选拖拽库：react-beautiful-dnd 或 @dnd-kit/core
- **验收标准**：
  - ✅ 可以拖拽分组标签调整顺序
  - ✅ 拖拽完成后顺序保存
  - ✅ 刷新页面后顺序保持

### 3.3 订阅功能优化

#### 任务 3.3.1：实现批量取消订阅功能（优先级：⭐⭐⭐）
- **当前状态**：未实现
- **需完成工作**：
  - 🔴 **未实现**：多选 UI
    - 需要在"我的订阅"页面的每个订阅用户项添加复选框
    - 需要添加"全选"复选框
  - 🔴 **未实现**：批量取消按钮
    - 需要在多选后显示"批量取消订阅"按钮
    - 需要显示确认对话框
  - 🔴 **未实现**：批量取消 API
    - 可以调用多个 unfollow 操作
    - 或创建批量取消订阅 API
  - 🔴 **未实现**：操作后的反馈
    - 需要刷新订阅列表
    - 需要显示成功提示
- **关联文件**：
  - [src/app/users/[id]/subscriptions/page.tsx](src/app/users/[id]/subscriptions/page.tsx)
- **验收标准**：
  - ✅ 可以多选订阅用户
  - ✅ 可以批量取消订阅
  - ✅ 操作后显示成功提示

#### 任务 3.3.2：实现订阅用户直接添加为好友（优先级：⭐⭐⭐）
- **当前状态**：未实现
- **需完成工作**：
  - 🔴 **未实现**：快捷添加好友按钮
    - 需要在"我的订阅"页面的每个用户项添加"添加好友"按钮
    - 需要仅在对方也关注了自己时显示此按钮（或提示条件）
  - 🔴 **未实现**：快速互关逻辑
    - 点击按钮后，如果对方已关注自己，直接成为双向好友
    - 或者直接发出好友请求等待对方接受
  - 🔴 **未实现**：操作后的反馈
    - 需要显示"已添加好友"或"好友请求已发送"
    - 需要更新按钮状态
- **关联文件**：
  - [src/app/users/[id]/subscriptions/page.tsx](src/app/users/[id]/subscriptions/page.tsx)
- **需要修改的 API 路由**：
  - 可能需要修改 `/api/follows` 以支持快速互关
- **验收标准**：
  - ✅ 订阅用户项显示"添加好友"按钮（当对方也关注自己时）
  - ✅ 点击后成功添加为好友
  - ✅ 按钮状态正确更新

#### 任务 3.3.3：实现订阅通知设置（优先级：⭐⭐⭐）
- **当前状态**：未实现
- **需完成工作**：
  - 🔴 **未实现**：订阅通知开关
    - 需要在用户设置中添加此选项
    - 或在每个订阅用户项上添加通知开关
  - 🔴 **未实现**：通知存储
    - 需要在数据库中记录用户的通知偏好
    - 可能需要添加 Follow 表的 notificationEnabled 字段
  - 🔴 **未实现**：通知发送
    - 当关注的用户发布新文章时，根据偏好发送通知
    - 需要集成通知系统（待后续实现）
  - 🔴 **未实现**：通知中心显示
    - 需要在系统通知中心显示订阅文章更新通知
- **关联文件**：
  - [prisma/schema.prisma](prisma/schema.prisma)
  - [src/app/api/users/settings/route.ts](新建或完善)
- **需要新增的数据库迁移**：
  - 为 Follow 表添加 notificationEnabled 字段
- **需要创建的 API 路由**：
  - 完善用户设置 API
- **验收标准**：
  - ✅ 用户可以设置订阅通知偏好
  - ✅ 通知偏好被正确保存
  - ✅ 后续集成通知系统

---

## 总体完善优先级排序

### 第一轮（必须完成）
1. **任务 1.1.1** - 个人主页关系按钮UI验证和完善
2. **任务 1.2.1** - "我的订阅"页面功能完善
3. **任务 1.3.1** - 好友列表页面的完整性验证
4. **任务 2.1.1** - 私信系统数据库模型完善
5. **任务 2.1.4** - 拉黑用户功能实现
6. **任务 2.2.2** - 文章分组可见性权限控制

### 第二轮（重要完成）
7. **任务 2.1.2** - 已读回执全局开关实现
8. **任务 2.1.3** - 会话免打扰功能实现
9. **任务 2.1.6** - 离线消息保存和推送
10. **任务 2.2.1** - 好友分组批量操作
11. **任务 2.2.3** - 好友分组与订阅源整合
12. **任务 3.2.1** - 快捷操作按钮

### 第三轮（优化体验）
13. **任务 3.1.1** - 置顶会话功能
14. **任务 3.1.2** - 消息撤回功能
15. **任务 3.2.2** - 好友列表搜索功能
16. **任务 3.2.4** - 最近互动时间排序
17. **任务 3.3.1** - 批量取消订阅

---

## 数据库迁移汇总

需要执行的数据库迁移：

```sql
-- 1. 黑名单表
CREATE TABLE "Blacklist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "blockedUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Blacklist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE,
    CONSTRAINT "Blacklist_blockedUserId_fkey" FOREIGN KEY ("blockedUserId") REFERENCES "User" ("id") ON DELETE CASCADE,
    UNIQUE("userId", "blockedUserId")
);

-- 2. 为 Message 表添加撤回字段
ALTER TABLE "Message" ADD COLUMN "isRetracted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Message" ADD COLUMN "retractedAt" DATETIME;

-- 3. 为 User 表添加已读回执全局开关
ALTER TABLE "User" ADD COLUMN "readReceiptEnabled" BOOLEAN NOT NULL DEFAULT true;

-- 4. 为 User 表添加在线状态追踪
ALTER TABLE "User" ADD COLUMN "lastSeenAt" DATETIME;

-- 5. 为 Post 表添加可见性字段
ALTER TABLE "Post" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'PUBLIC'; -- ENUM
ALTER TABLE "Post" ADD COLUMN "visibleGroupIds" TEXT; -- JSON 字符串存储
ALTER TABLE "Post" ADD COLUMN "invisibleGroupIds" TEXT; -- JSON 字符串存储

-- 6. 为 Follow 表添加通知偏好
ALTER TABLE "Follow" ADD COLUMN "notificationEnabled" BOOLEAN NOT NULL DEFAULT true;

-- 7. 为 FriendGroupMember 添加最后互动时间
ALTER TABLE "FriendGroupMember" ADD COLUMN "lastInteractedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 8. 为 ConversationSetting 添加单个会话已读回执覆盖
ALTER TABLE "ConversationSetting" ADD COLUMN "readReceiptEnabled" BOOLEAN; -- NULL 表示使用全局设置
```

---

## 新增 API 路由汇总

| 路由 | 方法 | 描述 | 优先级 |
|------|------|------|--------|
| `/api/blacklist` | GET | 获取黑名单 | ⭐⭐⭐⭐ |
| `/api/blacklist` | POST | 拉黑用户 | ⭐⭐⭐⭐ |
| `/api/blacklist/[userId]` | DELETE | 取消拉黑 | ⭐⭐⭐⭐ |
| `/api/messages/[id]/retract` | POST | 撤回消息 | ⭐⭐⭐ |
| `/api/messages/offline` | GET | 获取离线消息 | ⭐⭐⭐⭐ |
| `/api/link-preview` | GET | 获取链接预览 | ⭐⭐⭐ |
| `/api/users/settings` | PATCH | 更新用户设置 | ⭐⭐⭐⭐ |
| `/api/conversations/[id]/mute` | POST | 设置免打扰 | ⭐⭐⭐⭐ |
| `/api/conversations/[id]/mute` | DELETE | 取消免打扰 | ⭐⭐⭐⭐ |
| `/api/conversations/[id]/pin` | POST | 置顶会话 | ⭐⭐⭐ |
| `/api/conversations/[id]/pin` | DELETE | 取消置顶 | ⭐⭐⭐ |
| `/api/friends/[userId]` | DELETE | 删除好友 | ⭐⭐⭐⭐ |

---

## 业务逻辑服务类补充

### 需要创建或完善的服务类

| 服务类 | 文件路径 | 主要功能 | 优先级 |
|--------|---------|---------|--------|
| BlacklistService | `src/lib/services/blacklistService.ts` | 黑名单管理 | ⭐⭐⭐⭐ |
| MessageService 增强 | `src/lib/services/messageService.ts` | 消息撤回、离线处理 | ⭐⭐⭐⭐ |
| LinkPreviewService | `src/lib/services/linkPreviewService.ts` | 链接预览提取 | ⭐⭐⭐ |
| UserSettingsService | `src/lib/services/userSettingsService.ts` | 用户设置管理 | ⭐⭐⭐⭐ |

---

## 前端组件补充和完善

| 组件 | 文件路径 | 主要变更 | 优先级 |
|------|---------|---------|--------|
| FriendsPage | `src/app/users/[id]/friends/page.tsx` | 搜索、快捷按钮、多选 | ⭐⭐⭐⭐ |
| SubscriptionsPage | `src/app/users/[id]/subscriptions/page.tsx` | 搜索、批量操作、快速添加好友 | ⭐⭐⭐ |
| MessagesPage | `src/app/messages/page.tsx` | 置顶、撤回、快捷菜单、在线状态 | ⭐⭐⭐⭐ |
| SubscriptionFeed | `src/components/social/SubscriptionFeed.tsx` | 分组筛选、取消订阅 | ⭐⭐⭐⭐ |
| PostEditorForm | `src/components/blog/PostEditorForm.tsx` | 可见性设置UI | ⭐⭐⭐⭐ |
| RelationButton | `src/components/social/RelationButton.tsx` | 页面自动刷新、消息按钮 | ⭐⭐⭐⭐ |

---

## 测试建议

### 单元测试重点
- [ ] 黑名单逻辑验证
- [ ] 权限检查函数验证
- [ ] 消息撤回时间限制验证
- [ ] 好友分组可见性计算验证
- [ ] 排序函数验证

### 集成测试重点
- [ ] 拉黑用户后是否无法发送私信
- [ ] 拉黑用户后是否无法查看非公开文章
- [ ] 分组文章可见性权限检查
- [ ] 离线消息推送流程
- [ ] 消息状态流转（sending → sent → delivered → read）

### 端到端测试重点
- [ ] 完整的私信流程（从发送到接收再到标记已读）
- [ ] 好友关系变更流程（关注 → 回关 → 互相关注 → 删除）
- [ ] 分组权限控制流程（设置可见性 → 验证访问权限）
- [ ] 批量操作流程（多选 → 批量操作 → 结果验证）

---

## 实施建议

1. **按优先级分阶段实施**：优先完成第一轮任务，确保系统基本功能可用
2. **充分测试**：每完成一个任务都进行充分的功能测试和边界情况测试
3. **文档更新**：完成功能后更新相关文档
4. **用户反馈**：定期收集用户反馈，优化功能设计
5. **性能监控**：注意数据库查询性能，必要时添加索引优化

---

## 附录：文件清单

### 需要修改的核心文件
- [prisma/schema.prisma](prisma/schema.prisma) - 数据库模型
- [src/lib/services/followService.ts](src/lib/services/followService.ts) - 关注逻辑
- [src/lib/services/messageService.ts](src/lib/services/messageService.ts) - 消息逻辑
- [src/lib/services/postService.ts](src/lib/services/postService.ts) - 文章逻辑
- [src/components/blog/PostEditorForm.tsx](src/components/blog/PostEditorForm.tsx) - 文章编辑
- [src/app/messages/page.tsx](src/app/messages/page.tsx) - 私信页面
- [src/app/users/[id]/friends/page.tsx](src/app/users/[id]/friends/page.tsx) - 好友列表
- [src/app/users/[id]/subscriptions/page.tsx](src/app/users/[id]/subscriptions/page.tsx) - 订阅列表

### 需要创建的新文件
- [src/lib/services/blacklistService.ts](新建) - 黑名单服务
- [src/lib/services/linkPreviewService.ts](新建) - 链接预览服务
- [src/lib/services/userSettingsService.ts](新建) - 用户设置服务
- [src/app/api/blacklist/route.ts](新建) - 黑名单 API
- [src/app/api/messages/[id]/retract/route.ts](新建) - 消息撤回 API
- [src/app/api/users/settings/route.ts](新建) - 用户设置 API

