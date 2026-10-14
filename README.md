# Practice API

API thực hành cho học viên — JWT Auth + CRUD + Validate + Search.

---

## Base URL (sau khi deploy)
```
https://your-app.onrender.com
```

---

## Tài khoản test sẵn
| username | password | role  |
|----------|----------|-------|
| admin    | password | admin |
| tester   | password | user  |

---

## Endpoints

### Auth
| Method | Path             | Auth | Mô tả        |
|--------|------------------|------|--------------|
| POST   | /auth/login      | ❌   | Lấy token    |
| POST   | /auth/register   | ❌   | Đăng ký      |

### Users
| Method | Path         | Auth | Mô tả           |
|--------|--------------|------|-----------------|
| GET    | /users       | ✅   | Lấy danh sách   |
| GET    | /users/:id   | ✅   | Lấy 1 user      |
| POST   | /users       | ✅   | Tạo user        |
| PUT    | /users/:id   | ✅   | Cập nhật        |
| DELETE | /users/:id   | ✅   | Xoá             |

### Products
| Method | Path            | Auth | Mô tả           |
|--------|-----------------|------|-----------------|
| GET    | /products       | ❌   | Lấy danh sách   |
| GET    | /products/:id   | ❌   | Lấy 1 product   |
| POST   | /products       | ✅   | Tạo product     |
| PUT    | /products/:id   | ✅   | Cập nhật        |
| DELETE | /products/:id   | ✅   | Xoá             |

Query params cho GET /products:
- `?name=laptop` — search theo tên
- `?category=Electronics`
- `?minPrice=1000000&maxPrice=5000000`

### Orders
| Method | Path          | Auth | Mô tả         |
|--------|---------------|------|---------------|
| GET    | /orders       | ✅   | Danh sách     |
| GET    | /orders/:id   | ✅   | Lấy 1 order   |
| POST   | /orders       | ✅   | Tạo order     |
| PUT    | /orders/:id?status=... | ✅   | Update status (query param) |
| DELETE | /orders/:id   | ✅   | Xoá           |

Query params cho GET /orders:
- `?userId=u1`
- `?status=pending`

Status hợp lệ: `pending` | `processing` | `completed` | `cancelled`

### API Key / Basic Auth
| Method | Path             | Auth      | Mô tả          |
|--------|------------------|-----------|----------------|
| GET    | /apikey/products | 🔑 API Key | Danh sách products |
| GET    | /apikey/orders   | 🔑 API Key | Danh sách orders   |
| GET    | /basic/me        | 👤 Basic   | Thông tin user đang đăng nhập |
| GET    | /basic/users     | 👤 Basic   | Danh sách users |

### GraphQL
| Method | Path     | Auth                     | Mô tả |
|--------|----------|--------------------------|-------|
| POST   | /graphql | tuỳ operation (Bearer)   | Query / Mutation |

### Search
| Method | Path      | Auth | Mô tả                    |
|--------|-----------|------|--------------------------|
| GET    | /search   | ❌   | Search products + users  |

Query: `?q=keyword`

---

## Kiểu body theo từng endpoint

| Endpoint | Body |
|----------|------|
| `POST /auth/login` | raw JSON |
| `POST /auth/register` | x-www-form-urlencoded |
| `POST /users` | form-data |
| `PUT /users/:id` | raw JSON |
| `POST /products` | form-data |
| `PUT /products/:id` | x-www-form-urlencoded |
| `POST /orders` | raw JSON |
| `PUT /orders/:id?status=...` | query param (không có body) |
| `POST /graphql` | raw JSON `{ query, variables }` |

---

## Các kiểu Authentication

| Kiểu | Cách gửi | Endpoint |
|------|----------|----------|
| **Bearer Token (JWT)** | `Authorization: Bearer <token>` | `/users`, `/orders`, POST/PUT/DELETE `/products` |
| **API Key** | header `x-api-key: practice-api-key-123` hoặc query `?api_key=practice-api-key-123` | `GET /apikey/products`, `GET /apikey/orders` |
| **Basic Auth** | `Authorization: Basic base64(username:password)` (Postman: tab Authorization → Basic Auth, vd `admin` / `password`) | `GET /basic/me`, `GET /basic/users` |

Lỗi thường gặp: thiếu credential → `401`; API key sai → `403`; sai username/password (Basic) → `401`.

---

## GraphQL

`POST /graphql` — Body: raw JSON

```json
{
  "query": "query($cat: String){ products(category: $cat){ id name price } }",
  "variables": { "cat": "Electronics" }
}
```

| Loại | Tên | Cần Bearer token |
|------|-----|------------------|
| Query | `products(name, category)`, `product(id)` | ❌ |
| Query | `users`, `me` | ✅ |
| Mutation | `login(username, password)` | ❌ |
| Mutation | `createProduct`, `updateProduct`, `deleteProduct` | ✅ |

Lưu ý: lỗi nghiệp vụ (thiếu token, không tìm thấy...) trả **HTTP 200** kèm mảng `errors` trong body. Lỗi cú pháp/sai field trả **HTTP 400**.

---

## Cách dùng token

**Bước 1:** Login để lấy token
```
POST /auth/login
Body: { "username": "admin", "password": "password" }
```

**Bước 2:** Truyền token vào header
```
Authorization: Bearer eyJhbGci...
```

---

## Validate rules

### Product (POST/PUT)
- `name`: required, string
- `category`: required, string
- `price`: required, number, >= 0
- `quantity`: required, integer, >= 0

### Order (POST)
- `userId`: required
- `items`: required, array không rỗng
- `items[].productId`: required, phải tồn tại
- `items[].quantity`: required, integer > 0

---

## Response format

**Success:**
```json
{ "message": "...", "data": {...} }
```

**Error:**
```json
{ "error": "Bad Request", "message": "name is required" }
```

---

## Deploy lên Render

1. Push code lên GitHub
2. Vào [render.com](https://render.com) → New Web Service
3. Connect repo → chọn branch `main`
4. Build command: `npm install`
5. Start command: `npm start`
6. Environment variable: `JWT_SECRET=your-secret-here` (tuỳ chọn: `API_KEY=your-api-key`, mặc định `practice-api-key-123`)
7. Deploy!
