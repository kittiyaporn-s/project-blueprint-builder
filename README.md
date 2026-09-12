# Project Blueprint Builder

ต้องการให้สร้างระบบจากไฟล์ PRD ที่แนบ

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3868c0c2-4f4e-454c-a502-c96ea0520541).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## n8n Authentication

ตั้งค่า environment variable สำหรับ Webhook Login/สมัครสมาชิก:

```sh
N8N_AUTH_WEBHOOK_URL=https://your-n8n-host/webhook/auth
```

หน้า Login จะเรียก `/api/n8n-auth` แล้ว server proxy จะส่งต่อไปที่ `N8N_AUTH_WEBHOOK_URL` เพื่อไม่ให้เปิดเผย Webhook URL ใน browser

Payload ที่ส่งไป n8n:

```json
{
  "action": "login",
  "email": "user@company.com",
  "password": "password",
  "requested_at": "2026-09-12T00:00:00.000Z"
}
```

สมัครสมาชิกใช้ `action: "register"` และเพิ่ม `name`

Response ที่รองรับ:

```json
{
  "ok": true,
  "user": {
    "id": "user-id",
    "name": "User Name",
    "email": "user@company.com"
  },
  "token": "optional-token"
}
```
