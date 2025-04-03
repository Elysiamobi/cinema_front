# 螺旋剧场在线电影订票系统

全程cursor代写，基本功能健全，但有些函数逻辑可能混乱。
这是一个电影院线上订票系统，提供电影浏览、在线选座、订票管理等功能，同时具备完善的后台管理系统。

## 项目功能

### 用户端功能
- **用户认证**：注册、登录、登出
- **浏览电影**：查看所有电影、筛选和搜索电影
- **电影详情**：查看电影信息、评分、上映时间等
- **场次选择**：查看电影的放映场次、时间和价格
- **在线选座**：交互式选座界面，直观展示座位状态
- **在线订票**：完成支付流程，生成电子订单
- **订单管理**：查看历史订单、订单状态、取消订单等
- **个人中心**：管理个人信息、查看订票历史

### 管理员功能
- **用户管理**：查看、编辑、添加、删除用户，设置用户权限
- **电影管理**：添加、编辑、删除电影及其相关信息
- **排片管理**：设置放映场次、时间、影厅和票价
- **订单管理**：查看所有订单、更改订单状态、取消订单
- **统计数据**：分析销售数据、影院上座率、电影票房等

## 技术栈

### 前端
- **框架**：Vue 3、Vue Router、Vuex
- **UI组件**：Element Plus
- **HTTP客户端**：Axios
- **构建工具**：Vue CLI

### 后端
- **框架**：Flask
- **数据库**：MySQL
- **ORM**：SQLAlchemy
- **认证**：JWT (JSON Web Token)
- **API**：RESTful API

## 项目启动方式

### 前端启动
1. 确保已安装Node.js (推荐v14或更高版本)
2. 进入前端项目目录
```bash
cd cinema_front
```
3. 安装依赖
```bash
npm install
```
4. 启动开发服务器
```bash
npm run serve
```
5. 应用将在 http://localhost:8080 运行

### 后端启动
1. 确保已安装Python 3.7+和MySQL
2. 进入后端目录
```bash
cd cinema_back
```
3. 安装依赖
```bash
pip install -r requirements.txt
```
4. 确保MySQL服务已启动并创建数据库
```sql
CREATE DATABASE cinema CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
5. 根据需要修改`app.py`中的数据库连接配置
```python
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://username:password@localhost/cinema'
```
6. 启动Flask应用
```bash
python app.py
```
7. 后端API将在 http://localhost:5000 运行

## 系统截图

### 前台页面
- 首页电影列表
- 电影详情页
- 选座订票界面
- 个人中心/订单管理

### 后台管理
- 用户管理界面
- 电影管理界面
- 排片管理界面
- 订单管理界面

## 注意事项

1. 本地开发时，确保前后端的跨域配置正确
2. 默认管理员账号: admin/admin123
3. 如需导入测试数据，可使用项目中提供的SQL文件

## 项目接口说明

### 用户相关
- `POST /api/register` - 用户注册
- `POST /api/login` - 用户登录
- `GET /api/users/current` - 获取当前用户信息

### 电影相关
- `GET /api/movies` - 获取电影列表
- `GET /api/movies/:id` - 获取电影详情
- `POST /api/movies` - 创建电影（管理员权限）
- `PUT /api/movies/:id` - 更新电影（管理员权限）
- `DELETE /api/movies/:id` - 删除电影（管理员权限）

### 场次相关
- `GET /api/screenings` - 获取所有场次
- `GET /api/screenings/:id` - 获取场次详情
- `GET /api/screenings/movie/:id` - 获取特定电影的场次
- `POST /api/screenings` - 创建场次（管理员权限）
- `PUT /api/screenings/:id` - 更新场次（管理员权限）
- `DELETE /api/screenings/:id` - 删除场次（管理员权限）

### 订单相关
- `GET /api/users/current/orders` - 获取当前用户的订单
- `POST /api/orders` - 创建订单
- `PUT /api/orders/:id` - 更新订单状态（管理员权限）
- `POST /api/users/current/orders/:id/pay` - 支付订单
- `POST /api/users/current/orders/:id/cancel` - 取消订单

## 数据库结构

项目包含四个主要表：
- **用户表(user)**：存储用户信息
- **电影表(movie)**：存储电影信息
- **放映场次表(screening)**：关联电影和放映信息
- **订单表(order)**：关联用户、场次和座位信息
