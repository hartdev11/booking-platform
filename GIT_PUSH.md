# วิธีเอาโปรเจกต์ขึ้น Git (GitHub)

## ขั้นที่ 1: สร้าง Repo บน GitHub

1. ไปที่ **https://github.com** → ล็อกอิน
2. กด **+** มุมขวาบน → **New repository**
3. ตั้งค่า:
   - **Repository name:** `booking-platform` (หรือชื่ออื่น)
   - **Public** หรือ **Private** ตามต้องการ
   - **ไม่ต้อง** tick "Add a README" / ".gitignore" (เพราะมีในโปรเจกต์แล้ว)
4. กด **Create repository**
5. จำ **URL ของ repo** เช่น `https://github.com/ชื่อคุณ/booking-platform.git`

---

## ขั้นที่ 2: Add, Commit แล้ว Push จากเครื่องคุณ

เปิด Terminal ในโฟลเดอร์โปรเจกต์ (`c:\Users\hartz\booking-platform`) แล้วรันตามลำดับ:

```bash
# 1) เพิ่มไฟล์ทั้งหมด (ไฟล์ .env ถูก .gitignore อยู่แล้ว จะไม่ถูก add)
git add .

# 2) commit
git commit -m "Add booking platform - admin, dashboard, Firebase, Vercel deploy"

# 3) ผูก remote (แทนที่ URL ด้วย URL จริงของ repo คุณ)
git remote add origin https://github.com/ชื่อคุณ/booking-platform.git

# 4) ส่งขึ้น GitHub (ครั้งแรกใช้ -u)
git push -u origin master
```

ถ้า branch หลักของ GitHub เป็น `main` ไม่ใช่ `master` ให้ใช้:

```bash
git branch -M main
git push -u origin main
```

---

## หมายเหตุ

- **ไฟล์ `.env` / `.env.local`** จะไม่ถูก push (อยู่ใน `.gitignore`) — ปลอดภัย
- หลัง push เสร็จ ไปที่ Vercel → Import โปรเจกต์จาก GitHub repo นี้ได้เลย
