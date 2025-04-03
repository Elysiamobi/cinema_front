from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from datetime import datetime, timedelta
import os
import json
from functools import wraps

# 添加验证装饰器
def validate_json_data(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not request.is_json:
            return jsonify({'error': 'Missing JSON in request'}), 400
        return f(*args, **kwargs)
    return decorated_function

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:1314ADFGH12138@localhost/cinema'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # Change this in production
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'
app.config['JWT_IDENTITY_CLAIM'] = 'sub'

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)

@jwt.user_identity_loader
def user_identity_lookup(user):
    return str(user)

@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    identity = jwt_data["sub"]
    try:
        user_id = int(identity)
        return User.query.filter_by(id=user_id).one_or_none()
    except (ValueError, TypeError):
        return None

# JWT错误处理
@jwt.invalid_token_loader
def invalid_token_callback(error_string):
    print(f"Invalid token error: {error_string}")
    return jsonify({
        'error': 'Invalid token',
        'message': str(error_string)
    }), 422

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    print(f"Token expired: {jwt_payload}")
    return jsonify({
        'error': 'Token has expired',
        'message': 'Please log in again'
    }), 401

@jwt.unauthorized_loader
def missing_token_callback(error_string):
    print(f"Missing token: {error_string}")
    return jsonify({
        'error': 'Authorization token is missing',
        'message': str(error_string)
    }), 401

# 添加错误处理
@app.errorhandler(Exception)
def handle_error(error):
    print(f"Error occurred: {str(error)}")
    return jsonify({'error': str(error)}), 500

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now)


class Movie(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    director = db.Column(db.String(100))
    actors = db.Column(db.Text)
    duration = db.Column(db.Integer)  # in minutes
    release_date = db.Column(db.Date)
    poster_url = db.Column(db.String(200))
    rating = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)


class Screening(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    movie_id = db.Column(db.Integer, db.ForeignKey('movie.id'))
    theater = db.Column(db.String(100))
    hall = db.Column(db.String(50))
    screening_time = db.Column(db.DateTime)
    price = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)


class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    screening_id = db.Column(db.Integer, db.ForeignKey('screening.id'))
    seats = db.Column(db.String(200))  # JSON string of selected seats
    total_price = db.Column(db.Float)
    status = db.Column(db.String(20), default='pending')  # pending, paid, cancelled
    created_at = db.Column(db.DateTime, default=datetime.now)


# Routes
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400

    new_user = User(
        username=data['username'],
        password=data['password'],  # In production, hash the password
        email=data['email']
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully'}), 201


@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        user = User.query.filter_by(username=data['username']).first()

        if user and user.password == data['password']:  # In production, use proper password verification
            # 确保用户 ID 是字符串类型
            user_id = str(user.id)
            access_token = create_access_token(identity=user_id)
            
            print(f"User {user.username} logged in successfully, token created with ID: {user_id}")
            
            return jsonify({
                'access_token': access_token,
                'user_id': user_id,
                'username': user.username,
                'email': user.email,
                'is_admin': user.is_admin,
                'created_at': user.created_at.strftime('%Y-%m-%d %H:%M:%S')
            })

        return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/movies', methods=['GET'])
def get_movies():
    movies = Movie.query.all()
    return jsonify([{
        'id': int(movie.id),
        'title': str(movie.title),
        'description': str(movie.description) if movie.description else '',
        'director': str(movie.director) if movie.director else '',
        'actors': str(movie.actors) if movie.actors else '',
        'duration': int(movie.duration) if movie.duration else 0,
        'release_date': movie.release_date.strftime('%Y-%m-%d') if movie.release_date else None,
        'poster_url': str(movie.poster_url) if movie.poster_url else '',
        'rating': float(movie.rating) if movie.rating else 0.0
    } for movie in movies])


@app.route('/api/screenings/<int:movie_id>', methods=['GET'])
def get_screenings(movie_id):
    screenings = Screening.query.filter_by(movie_id=movie_id).all()
    return jsonify([{
        'id': int(screening.id),
        'movie_id': int(screening.movie_id),
        'theater': str(screening.theater),
        'hall': str(screening.hall),
        'screening_time': screening.screening_time.strftime('%Y-%m-%d %H:%M'),
        'price': float(screening.price)
    } for screening in screenings])


@app.route('/api/orders', methods=['POST'])
@jwt_required()
@validate_json_data
def create_order():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # 验证数据类型
        try:
            screening_id = int(data.get('screening_id'))
            total_price = float(data.get('total_price', 0))
            seats = data.get('seats', [])
            
            if not isinstance(seats, list):
                return jsonify({'error': '座位数据必须是数组格式'}), 400
                
        except (ValueError, TypeError):
            return jsonify({'error': '数据类型错误'}), 400
            
        # 验证座位是否已被预订
        screening = Screening.query.get(screening_id)
        if not screening:
            return jsonify({'error': '场次不存在'}), 404
            
        existing_orders = Order.query.filter_by(
            screening_id=screening_id,
            status='paid'
        ).all()
        
        occupied_seats = []
        for order in existing_orders:
            try:
                order_seats = json.loads(order.seats) if isinstance(order.seats, str) else order.seats
                occupied_seats.extend(order_seats if isinstance(order_seats, list) else [])
            except json.JSONDecodeError:
                print(f"Warning: Invalid seats data in order {order.id}")
                continue
            
        # 检查座位是否已被预订
        if any(seat in occupied_seats for seat in seats):
            return jsonify({'error': '所选座位已被预订'}), 400
            
        # 创建订单
        new_order = Order(
            user_id=int(user_id),
            screening_id=screening_id,
            seats=json.dumps(seats),
            total_price=total_price,
            status='pending'
        )
        
        db.session.add(new_order)
        db.session.commit()
        
        return jsonify({
            'message': 'Order created successfully',
            'order_id': int(new_order.id)
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"创建订单错误: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/orders', methods=['GET'])
@jwt_required()
def get_all_orders():
    try:
        user_id = get_jwt_identity()
        current_user = User.query.get(user_id)
        
        if not current_user.is_admin:
            return jsonify({'error': 'Unauthorized'}), 403
            
        orders = Order.query.all()
        result = []
        
        for order in orders:
            screening = Screening.query.get(order.screening_id)
            if screening:
                movie = Movie.query.get(screening.movie_id)
                user = User.query.get(order.user_id)
                
                order_data = {
                    'id': order.id,
                    'user': {
                        'id': user.id if user else None,
                        'username': user.username if user else 'Unknown User',
                        'email': user.email if user else None
                    },
                    'screening': {
                        'id': screening.id,
                        'theater': screening.theater,
                        'hall': screening.hall,
                        'screening_time': screening.screening_time.strftime('%Y-%m-%d %H:%M'),
                        'price': float(screening.price)
                    },
                    'movie': {
                        'id': movie.id if movie else None,
                        'title': movie.title if movie else 'Unknown Movie',
                        'poster_url': movie.poster_url if movie else None
                    },
                    'seats': json.loads(order.seats) if isinstance(order.seats, str) else order.seats,
                    'total_price': float(order.total_price),
                    'status': order.status,
                    'created_at': order.created_at.strftime('%Y-%m-%d %H:%M')
                }
                result.append(order_data)
            
        return jsonify(result)
    except Exception as e:
        print(f"获取所有订单错误: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/orders/<int:order_id>', methods=['PUT'])
@jwt_required()
def update_order_status(order_id):
    user_id = get_jwt_identity()
    current_user = User.query.get(user_id)
    
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
        
    order = Order.query.get_or_404(order_id)
    data = request.get_json()
    
    # 添加状态验证
    valid_statuses = ['pending', 'paid', 'cancelled']
    if 'status' in data:
        if data['status'] not in valid_statuses:
            return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
        
        # 添加状态映射：API接受'paid'，但数据库需要'confirmed'
        api_status = data['status']
        db_status = api_status
        
        # 将'paid'映射为数据库接受的'confirmed'
        if api_status == 'paid':
            db_status = 'confirmed'
            print(f"状态映射: API 'paid' -> 数据库 'confirmed'")
            
        # 使用映射后的状态值更新数据库
        order.status = db_status
        
    db.session.commit()
    return jsonify({'message': 'Order status updated successfully'})


@app.route('/api/users', methods=['GET'])
@jwt_required()
def get_users():
    try:
        user_id = get_jwt_identity()
        print(f"获取用户列表，当前用户ID: {user_id}")
        
        current_user = User.query.get(user_id)
        if not current_user:
            print("用户不存在")
            return jsonify({'error': '用户不存在'}), 404
            
        if not current_user.is_admin:
            print("用户不是管理员")
            return jsonify({'error': '没有管理员权限'}), 403
            
        users = User.query.all()
        result = [{
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_admin': user.is_admin,
            'created_at': user.created_at.strftime('%Y-%m-%d %H:%M:%S')
        } for user in users]
        
        print(f"成功获取用户列表，共 {len(result)} 条记录")
        return jsonify(result)
    except Exception as e:
        print(f"获取用户列表错误: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/users/current', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        # 获取当前用户ID
        user_id = get_jwt_identity()
        print(f"Fetching user info for ID: {user_id}")
        
        # 验证用户ID
        if not isinstance(user_id, str):
            print(f"Invalid user ID type: {type(user_id)}")
            return jsonify({'error': 'Invalid user ID type'}), 400
            
        try:
            user_id_int = int(user_id)
        except (ValueError, TypeError):
            print(f"Could not convert user ID to integer: {user_id}")
            return jsonify({'error': 'Invalid user ID format'}), 400
            
        # 查询用户
        user = User.query.get(user_id_int)
        
        if not user:
            print(f"User not found: {user_id}")
            return jsonify({'error': 'User not found'}), 404
            
        # 返回用户信息
        response = {
            'id': str(user.id),
            'username': str(user.username),
            'email': str(user.email),
            'is_admin': bool(user.is_admin),
            'created_at': user.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }
        print(f"Returning user info: {response}")
        return jsonify(response)
        
    except Exception as e:
        print(f"Error in get_current_user: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user.is_admin and current_user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    if 'username' in data and data['username'] != user.username:
        existing_user = User.query.filter_by(username=data['username']).first()
        if existing_user and existing_user.id != user_id:
            return jsonify({'error': 'Username already exists'}), 400
        user.username = data['username']
        
    if 'email' in data and data['email'] != user.email:
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user and existing_user.id != user_id:
            return jsonify({'error': 'Email already exists'}), 400
        user.email = data['email']
        
    if 'password' in data and data['password']:
        user.password = data['password']  # In production, hash the password
        
    try:
        db.session.commit()
        return jsonify({
            'message': 'User updated successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_admin': user.is_admin,
                'created_at': user.created_at.strftime('%Y-%m-%d %H:%M:%S')
            }
        })
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError) as e:
        return jsonify({'error': '无效或过期的令牌'}), 401
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
        
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted successfully'})


@app.route('/api/users/<int:user_id>/role', methods=['PUT'])
@jwt_required()
def update_user_role(user_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
        
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    user.is_admin = data.get('is_admin', False)
    db.session.commit()
    return jsonify({'message': 'User role updated successfully'})


@app.route('/api/movies/<int:movie_id>', methods=['GET'])
def get_movie(movie_id):
    movie = Movie.query.get_or_404(movie_id)
    return jsonify({
        'id': movie.id,
        'title': movie.title,
        'description': movie.description,
        'director': movie.director,
        'actors': movie.actors,
        'duration': movie.duration,
        'release_date': movie.release_date.strftime('%Y-%m-%d'),
        'poster_url': movie.poster_url,
        'rating': float(movie.rating),
        'created_at': movie.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        'updated_at': movie.updated_at.strftime('%Y-%m-%d %H:%M:%S')
    })


@app.route('/api/movies', methods=['POST'])
@jwt_required()
@validate_json_data
def create_movie():
    try:
        user_id = get_jwt_identity()
        current_user = User.query.get(user_id)
        
        if not current_user.is_admin:
            return jsonify({'error': 'Unauthorized'}), 403
            
        data = request.get_json()
        
        # 验证必填字段
        required_fields = ['title', 'release_date']
        for field in required_fields:
            if field not in data or not str(data[field]).strip():
                return jsonify({'error': f'Missing required field: {field}'}), 400
                
        # 验证并转换数据类型
        try:
            movie_data = {
                'title': str(data['title']).strip(),
                'description': str(data.get('description', '')).strip(),
                'director': str(data.get('director', '')).strip(),
                'actors': str(data.get('actors', '')).strip(),
                'duration': int(data['duration']) if 'duration' in data else None,
                'release_date': datetime.strptime(data['release_date'], '%Y-%m-%d').date(),
                'poster_url': str(data.get('poster_url', '')).strip(),
                'rating': float(data.get('rating', 0))
            }
        except (ValueError, TypeError) as e:
            return jsonify({'error': f'数据类型错误: {str(e)}'}), 400
            
        new_movie = Movie(**movie_data)
        db.session.add(new_movie)
        db.session.commit()
        
        return jsonify({
            'message': 'Movie created successfully',
            'movie_id': int(new_movie.id)
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"创建电影错误: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/movies/<int:movie_id>', methods=['PUT'])
@jwt_required()
def update_movie(movie_id):
    user_id = get_jwt_identity()
    current_user = User.query.get(user_id)
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    if not data:
        return jsonify({'error': '请求数据为空'}), 400
    if 'title' in data and not data['title'].strip():
        return jsonify({'error': 'Title is required'}), 400
    try:
        if 'release_date' in data:
            datetime.strptime(data['release_date'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format, use YYYY-MM-DD'}), 400
    movie = Movie.query.get_or_404(movie_id)
    if 'title' in data:
        movie.title = data['title']
    if 'description' in data:
        movie.description = data['description']
    if 'director' in data:
        movie.director = data['director']
    if 'actors' in data:
        movie.actors = data['actors']
    if 'duration' in data:
        movie.duration = data['duration']
    if 'release_date' in data:
        movie.release_date = datetime.strptime(data['release_date'], '%Y-%m-%d').date()
    if 'poster_url' in data:
        movie.poster_url = data['poster_url']
    if 'rating' in data:
        movie.rating = data['rating']
    try:
        db.session.commit()
        return jsonify({'message': 'Movie updated successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"更新电影信息错误: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/movies/<int:movie_id>', methods=['DELETE'])
@jwt_required()
def delete_movie(movie_id):
    user_id = get_jwt_identity()
    current_user = User.query.get(user_id)
    
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
        
    try:
        # 查找所有与电影相关的放映场次
        screenings = Screening.query.filter_by(movie_id=movie_id).all()
        
        # 对每个放映场次，先删除关联的订单
        for screening in screenings:
            orders = Order.query.filter_by(screening_id=screening.id).all()
            for order in orders:
                db.session.delete(order)
            
            # 删除放映场次
            db.session.delete(screening)
            
        # 最后删除电影
        movie = Movie.query.get_or_404(movie_id)
        db.session.delete(movie)
        db.session.commit()
        
        return jsonify({'message': 'Movie and all related screenings and orders deleted successfully'})
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError) as e:
        return jsonify({'error': '无效或过期的令牌'}), 401
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/screenings', methods=['GET'])
def get_all_screenings():
    screenings = Screening.query.all()
    return jsonify([{
        'id': screening.id,
        'movie_id': screening.movie_id,
        'theater': screening.theater,
        'hall': screening.hall,
        'screening_time': screening.screening_time.strftime('%Y-%m-%d %H:%M'),
        'price': screening.price
    } for screening in screenings])


# 添加到导入部分的下方，在其他函数之前
def parse_date_time(date_str):
    """
    尝试使用多种格式解析日期时间字符串
    支持 YYYY-MM-DD HH:MM 和 YYYY-MM-DDT00:00 格式
    """
    if not date_str:
        return None
        
    # 标准化 - 将T替换为空格
    if 'T' in date_str:
        date_str = date_str.replace('T', ' ')
        
    # 尝试使用不同的格式解析
    formats = ['%Y-%m-%d %H:%M', '%Y-%m-%d %H:%M:%S']
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
            
    # 如果所有格式都失败，抛出异常
    raise ValueError(f"无效的日期时间格式: {date_str}, 请使用 YYYY-MM-DD HH:MM 格式")

@app.route('/api/screenings', methods=['POST'])
@jwt_required()
@validate_json_data
def create_screening():
    try:
        user_id = get_jwt_identity()
        current_user = User.query.get(user_id)
        
        if not current_user.is_admin:
            return jsonify({'error': 'Unauthorized'}), 403
            
        data = request.get_json()
        print(f"接收到的创建场次数据: {data}")
        
        # 验证并转换数据类型
        try:
            # 使用通用解析函数处理日期
            screening_time = None
            if 'screening_time' in data:
                try:
                    screening_time = parse_date_time(data['screening_time'])
                except ValueError as e:
                    return jsonify({'error': str(e)}), 400
            
            screening_data = {
                'movie_id': int(data['movie_id']),
                'theater': str(data['theater']).strip(),
                'hall': str(data['hall']).strip(),
                'screening_time': screening_time,
                'price': float(data['price'])
            }
        except (ValueError, TypeError, KeyError) as e:
            return jsonify({'error': f'数据类型错误: {str(e)}'}), 400
            
        # 验证电影是否存在
        if not Movie.query.get(screening_data['movie_id']):
            return jsonify({'error': '电影不存在'}), 404
            
        new_screening = Screening(**screening_data)
        db.session.add(new_screening)
        db.session.commit()
        
        return jsonify({
            'message': 'Screening created successfully',
            'screening_id': int(new_screening.id)
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"创建场次错误: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/screenings/<int:screening_id>', methods=['PUT'])
@jwt_required()
@validate_json_data
def update_screening(screening_id):
    try:
        user_id = get_jwt_identity()
        current_user = User.query.get(user_id)
        
        if not current_user.is_admin:
            return jsonify({'error': 'Unauthorized'}), 403
            
        screening = Screening.query.get_or_404(screening_id)
        data = request.get_json()
        print(f"接收到的更新场次数据: {data}")
        
        # 验证并转换数据类型
        try:
            if 'movie_id' in data:
                screening.movie_id = int(data['movie_id'])
                # 验证电影是否存在
                if not Movie.query.get(screening.movie_id):
                    return jsonify({'error': '电影不存在'}), 404
                    
            if 'theater' in data:
                screening.theater = str(data['theater']).strip()
                if not screening.theater:
                    return jsonify({'error': '影院名称不能为空'}), 400
                    
            if 'hall' in data:
                screening.hall = str(data['hall']).strip()
                if not screening.hall:
                    return jsonify({'error': '影厅不能为空'}), 400
                    
            if 'screening_time' in data:
                try:
                    # 使用通用解析函数处理日期
                    screening.screening_time = parse_date_time(data['screening_time'])
                except ValueError as e:
                    return jsonify({'error': str(e)}), 400
                    
            if 'price' in data:
                try:
                    price = float(data['price'])
                    if price < 0:
                        return jsonify({'error': '票价不能为负数'}), 400
                    screening.price = price
                except ValueError:
                    return jsonify({'error': '无效的票价格式'}), 400
                    
        except (ValueError, TypeError) as e:
            return jsonify({'error': f'数据类型错误: {str(e)}'}), 422
            
        db.session.commit()
        
        # 返回更新后的数据
        return jsonify({
            'message': 'Screening updated successfully',
            'screening': {
                'id': int(screening.id),
                'movie_id': int(screening.movie_id),
                'theater': str(screening.theater),
                'hall': str(screening.hall),
                'screening_time': screening.screening_time.strftime('%Y-%m-%d %H:%M'),
                'price': float(screening.price)
            }
        })
    except Exception as e:
        db.session.rollback()
        print(f"更新场次错误: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/screenings/<int:screening_id>', methods=['DELETE'])
@jwt_required()
def delete_screening(screening_id):
    user_id = get_jwt_identity()
    current_user = User.query.get(user_id)
    
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        # 先删除与该放映场次关联的所有订单
        screening = Screening.query.get_or_404(screening_id)
        orders = Order.query.filter_by(screening_id=screening_id).all()
        for order in orders:
            db.session.delete(order)
            
        # 然后删除放映场次
        db.session.delete(screening)
        db.session.commit()
        return jsonify({'message': 'Screening and all related orders deleted successfully'})
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError) as e:
        return jsonify({'error': '无效或过期的令牌'}), 401
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/users/current/orders', methods=['GET'])
@jwt_required()
def get_user_orders():
    try:
        user_id = get_jwt_identity()
        orders = Order.query.filter_by(user_id=user_id).all()
        
        result = []
        for order in orders:
            screening = Screening.query.get(order.screening_id)
            if screening:
                movie = Movie.query.get(screening.movie_id)
                order_data = {
                    'id': order.id,
                    'user_id': order.user_id,
                    'screening_id': order.screening_id,
                    'seats': json.loads(order.seats) if isinstance(order.seats, str) else order.seats,
                    'total_price': float(order.total_price),
                    'status': order.status,
                    'created_at': order.created_at.strftime('%Y-%m-%d %H:%M'),
                    'screening': {
                        'id': screening.id,
                        'theater': screening.theater,
                        'hall': screening.hall,
                        'screening_time': screening.screening_time.strftime('%Y-%m-%d %H:%M'),
                        'price': float(screening.price)
                    },
                    'movie': {
                        'id': movie.id if movie else None,
                        'title': movie.title if movie else 'Unknown Movie',
                        'poster_url': movie.poster_url if movie else None
                    }
                }
                result.append(order_data)
        
        return jsonify(result)
    except Exception as e:
        print(f"获取用户订单错误: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/screenings/<int:screening_id>', methods=['GET'])
def get_screening_by_id(screening_id):
    try:
        screening = Screening.query.get_or_404(screening_id)
        movie = Movie.query.get_or_404(screening.movie_id)
        
        result = {
            'id': screening.id,
            'movie_id': screening.movie_id,
            'theater': screening.theater,
            'hall': screening.hall,
            'screening_time': screening.screening_time.strftime('%Y-%m-%d %H:%M'),
            'price': float(screening.price),
            'created_at': screening.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': screening.updated_at.strftime('%Y-%m-%d %H:%M:%S'),
            'movie': {
                'id': movie.id,
                'title': movie.title,
                'director': movie.director,
                'actors': movie.actors,
                'duration': int(movie.duration),
                'release_date': movie.release_date.strftime('%Y-%m-%d'),
                'poster_url': movie.poster_url,
                'rating': float(movie.rating),
                'created_at': movie.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'updated_at': movie.updated_at.strftime('%Y-%m-%d %H:%M:%S')
            }
        }
        
        return jsonify(result)
    except Exception as e:
        print(f"获取放映场次详情错误: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/screenings/movie/<int:movie_id>', methods=['GET'])
def get_screenings_by_movie(movie_id):
    screenings = Screening.query.filter_by(movie_id=movie_id).all()
    return jsonify([{
        'id': screening.id,
        'theater': screening.theater,
        'hall': screening.hall,
        'screening_time': screening.screening_time.strftime('%Y-%m-%d %H:%M'),
        'price': screening.price
    } for screening in screenings])

@app.route('/api/users', methods=['POST'])
@jwt_required()
@validate_json_data
def create_user():
    try:
        # 检查权限，仅管理员可以创建用户
        user_id = get_jwt_identity()
        current_user = User.query.get(user_id)
        
        if not current_user or not current_user.is_admin:
            return jsonify({'error': 'Unauthorized access'}), 403
        
        data = request.get_json()
        
        # 检查用户名和邮箱是否已存在
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
            
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        # 创建新用户
        new_user = User(
            username=data['username'],
            password=data['password'],  # 生产环境需要哈希处理
            email=data['email'],
            is_admin=data.get('is_admin', False)
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'message': 'User created successfully',
            'user': {
                'id': new_user.id,
                'username': new_user.username,
                'email': new_user.email,
                'is_admin': new_user.is_admin,
                'created_at': new_user.created_at.strftime('%Y-%m-%d %H:%M:%S')
            }
        }), 201
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError) as e:
        return jsonify({'error': '无效或过期的令牌'}), 401
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/current/orders/<int:order_id>/pay', methods=['POST'])
@jwt_required()
def pay_user_order(order_id):
    try:
        # 获取当前用户ID
        user_id = get_jwt_identity()
        
        # 查找订单
        order = Order.query.get_or_404(order_id)
        
        # 验证订单属于当前用户
        if int(order.user_id) != int(user_id):
            return jsonify({'error': '无权支付他人订单'}), 403
            
        # 验证订单状态是否为pending
        if order.status != 'pending':
            return jsonify({'error': '只能支付待支付状态的订单'}), 400
            
        # 更新订单状态为confirmed（数据库中表示已支付）
        order.status = 'confirmed'
        db.session.commit()
        
        return jsonify({
            'message': '订单支付成功',
            'order_id': order.id,
            'status': 'paid'  # 返回给前端的状态使用'paid'
        })
    except Exception as e:
        db.session.rollback()
        print(f"用户支付订单失败: {str(e)}")
        return jsonify({'error': str(e)}), 500

# 新增获取场次已售座位信息的公开API端点
@app.route('/api/screenings/<int:screening_id>/seats', methods=['GET'])
def get_screening_occupied_seats(screening_id):
    try:
        # 查找所有已支付的该场次订单
        orders = Order.query.filter_by(
            screening_id=screening_id,
            status='confirmed'  # 在数据库中已支付订单的状态是'confirmed'
        ).all()
        
        occupied_seats = []
        for order in orders:
            try:
                # 尝试解析座位数据
                seats = json.loads(order.seats) if isinstance(order.seats, str) else order.seats
                if isinstance(seats, list):
                    occupied_seats.extend(seats)
            except json.JSONDecodeError:
                print(f"Warning: Invalid seats data in order {order.id}")
                continue
                
        return jsonify({
            'screening_id': screening_id,
            'occupied_seats': occupied_seats
        })
    except Exception as e:
        print(f"获取已售座位失败: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/current/orders/<int:order_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_user_order(order_id):
    try:
        # 获取当前用户ID
        user_id = get_jwt_identity()
        
        # 查找订单
        order = Order.query.get_or_404(order_id)
        
        # 验证订单属于当前用户
        if int(order.user_id) != int(user_id):
            return jsonify({'error': '无权取消他人订单'}), 403
            
        # 验证订单状态是否可取消（只有pending状态可以取消）
        if order.status != 'pending':
            return jsonify({'error': '只能取消待支付状态的订单'}), 400
            
        # 更新订单状态为cancelled
        order.status = 'cancelled'
        db.session.commit()
        
        return jsonify({
            'message': '订单取消成功',
            'order_id': order.id,
            'status': 'cancelled'
        })
    except Exception as e:
        db.session.rollback()
        print(f"用户取消订单失败: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/current/profile', methods=['PUT'])
@jwt_required()
def update_current_user_profile():
    try:
        # 获取当前用户ID
        user_id = get_jwt_identity()
        
        # 查找用户
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        # 验证和更新用户名
        if 'username' in data and data['username'] != user.username:
            existing_user = User.query.filter_by(username=data['username']).first()
            if existing_user and existing_user.id != int(user_id):
                return jsonify({'error': '用户名已存在'}), 400
            user.username = data['username']
            
        # 验证和更新邮箱
        if 'email' in data and data['email'] != user.email:
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user and existing_user.id != int(user_id):
                return jsonify({'error': '邮箱已存在'}), 400
            user.email = data['email']
            
        # 更新密码
        if 'password' in data and data['password']:
            user.password = data['password']  # 生产环境中应该哈希处理密码
            
        db.session.commit()
        
        return jsonify({
            'message': '用户信息更新成功',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_admin': user.is_admin,
                'created_at': user.created_at.strftime('%Y-%m-%d %H:%M:%S')
            }
        })
    except Exception as e:
        db.session.rollback()
        print(f"更新用户信息失败: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
