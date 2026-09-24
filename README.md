# 🍑 PeachiView — Welcome back, Peachi!

เว็บแฟนเมดต้อนรับการกลับมาของ **[PeachiView](https://www.youtube.com/@PeachiView249)** VTuber สาวจากประเทศไทย
หลังหายไป 1,702 วัน (14 ม.ค. 2022 → 12 ก.ย. 2026) ✦ ทำด้วยความรักจากลูกพีชน้อย

> เว็บนี้ไม่ใช่เว็บทางการ ภาพตัวละคร คลิป และแบรนด์ทั้งหมดเป็นของ PeachiView
>
> ⚠ **เพลงในเครื่องเล่น ("Make a wish" — P9d ft. TL) มีลิขสิทธิ์** เว็บนี้เปิดผ่านตัวเล่น YouTube เท่านั้น ไม่ได้เก็บหรือแจกไฟล์เพลง
> ถ้ากำลังไลฟ์หรืออัดคลิปอยู่ อย่าเพิ่งกดเล่น เดี๋ยวโดนเคลม copyright (มีคำเตือนนี้อยู่ที่ปุ่มเล่นเพลงในเว็บด้วย)

## มีอะไรบ้าง

| ส่วน | ลูกเล่น |
|---|---|
| **PeachiOS loader** | ลูกพีชวาดตัวเอง → หลอดโหลดพิกเซล → วงกลมเปิดเข้าเว็บ |
| **Hero** | รูปพีชชี่ถูก "วาด" ด้วยปากกาทีละเส้น (เส้นร่างจริงจากรูปเขา) แล้วลงสีด้วยพู่กัน, โลโก้สไตล์แบนเนอร์, หน้าต่างลากได้ (มีลูกพีชนั่งอยู่บนหน้าต่าง), กลีบดอกพีชหลบเมาส์ |
| **profile.exe** | การ์ดประจำตัวพลิกได้ + ฟอยล์โฮโลตามเมาส์, ตัวเลขนับขึ้น, "ในช่องพีชชี่มีอะไรบ้าง" (นับจากคลิปจริง), สติกเกอร์ลากเล่นได้ |
| **evolution.exe** | ร่างทั้ง 3 (เสื้อยืดชมพู → ฮู้ดดี้ → ร่างใหม่ 2026) แบบเลื่อนแนวนอน |
| **diary_2021.txt** | ไทม์ไลน์ปีแรก เถาวัลย์งอกตามการเลื่อน (มีดอกไม้วิ่งนำปลายเส้น) + โพลารอยด์ |
| **waiting.exe** | ฉากกลางคืนหิมะตก ตัวนับ 1,702 วัน ปฏิทินขาดทีละปี ข้อความจากแฟนๆ แล้วข้อความจากพีชชี่ก็เด้งขึ้นมา |
| **Comeback** | โปสเตอร์ MISSING → เทปฉีก → แสตมป์ FOUND! + คอนเฟตติ |
| **radio.exe** | เครื่องเล่นแผ่นเสียง (แขนเข็มวางลงแผ่นแล้วไล่เข้าตามเพลง) + ลำโพงหูแมวที่มีลูกพีชเต้นอยู่ข้างบน + ดิสโก้บอลลูกพีช ไฟปาร์ตี้ คาราโอเกะ และดาวขอพร |
| **videos/** | คลิปครบ 103 คลิป กรองหมวด/ค้นหา (GSAP Flip) + ดึงคลิปใหม่อัตโนมัติ |
| **mail.app** | ซองจดหมายตราครั่งลูกพีช ฝาเปิด จดหมายเลื่อนออกมาแล้วค่อยๆ เขียน |

เว็บนี้ตั้งใจให้ "เลื่อนดูเอง" ตั้งแต่ต้นจนจบ — ไม่มีปุ่มกระโดดข้ามส่วน (แถบด้านล่างเป็นแค่ตัวบอกว่าอยู่ตรงไหน) และทุกครั้งที่โหลดจะเริ่มจากบนสุดเสมอ

อีสเตอร์เอ้ก: พิมพ์ `peach` บนคีย์บอร์ด, กด Konami code, จิ้มลูกพีชทุกตัว 🍑

## เริ่มใช้งาน

ต้องใช้ Node.js 22.12 ขึ้นไป

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # build สำหรับ production
```

## ขึ้น Vercel

1. เข้า [vercel.com/new](https://vercel.com/new) → **Import** repo นี้
2. Framework จะขึ้นเป็น **Astro** ให้อัตโนมัติ → กด **Deploy**
3. เสร็จ! ต่อจากนี้ push ขึ้น GitHub เมื่อไหร่ Vercel ก็ deploy ใหม่ให้เอง

ไม่ต้องตั้งค่า env ใดๆ — ถ้าอยากให้ `/api/latest.json` ใช้ YouTube Data API แทนการอ่านหน้าช่อง ให้ใส่ `YOUTUBE_API_KEY` ใน Environment Variables ของ Vercel (ไม่บังคับ)

## แก้ไขเนื้อหา

- **ข้อความ / จดหมาย / ไทม์ไลน์ / ร่างโมเดล** → `src/data/site.ts`
- **เนื้อเพลงคาราโอเกะ** → `song.lrc` ใน `src/data/site.ts` ใส่แบบ LRC (เวลาในคลิป YouTube) เช่น

  ```
  [00:36.50] ท่อนแรก
  [00:40.10] ท่อนถัดไป
  ```
  ถ้าเว้นว่าง กล่องคาราโอเกะจะโชว์ชื่อเพลงแทน (เนื้อเพลงมีลิขสิทธิ์ เลยไม่ได้ใส่ไว้ให้)
- **อัปเดตรายชื่อคลิป / สถิติช่อง** → `python scripts/fetch_channel.py` (อัปเดต `src/data/videos.json`, `channel.json`)
- **รูปวาดใน Hero** → `python scripts/build_portrait.py <cutout.png> public/portrait 1200`
  (ต้องติดตั้ง `pip install -r scripts/requirements.txt`)

## QR code 🍑

QR น่ารักๆ สไตล์ PeachiView (หน้าต่าง PeachiOS หูแมว จุดกลมไล่สี ลูกพีชใส่หูฟังตรงกลาง) ลิงก์ไปที่
https://peachi-view-fanart-website.vercel.app/

- `public/qr/peachiview-qr.png` — 2000×2720 พร้อมแชร์/พิมพ์ (หลังขึ้น Vercel เปิดได้ที่ `/qr/peachiview-qr.png`)
- `public/qr/peachiview-qr.svg` — เวกเตอร์ คมทุกขนาด (ฝังฟอนต์ไว้แล้ว)
- สร้างใหม่ (เช่นเปลี่ยนลิงก์): `python scripts/make_qr.py "https://ลิงก์ใหม่" public/qr/peachiview-qr.svg`
  แล้วเปิด SVG ในเบราว์เซอร์เพื่อเซฟเป็นรูป — ใช้ error correction ระดับ H เลยสแกนได้แม้มีลูกพีชบังตรงกลาง
  (ทดสอบแล้วด้วย ZXing ทั้งภาพเบลอ เอียง บีบอัด และย่อเหลือ 15%)

## เทคโนโลยี

[Astro 7](https://astro.build) · [GSAP 3.15](https://gsap.com) (ScrollTrigger, DrawSVG, Flip, Draggable, Inertia) · [Lenis](https://github.com/darkroomengineering/lenis) ·
Canvas 2D particles · YouTube IFrame API · Fontsource (Mali, Mitr, Sriracha, Pixelify Sans) · Vercel adapter

รองรับมือถือ, `prefers-reduced-motion` (ปิดแอนิเมชันหนักๆ ให้อัตโนมัติ) และคีย์บอร์ด

---

Made with 🍑 by **Master Tankhun | Tankhun Gaming** · [github](https://github.com/MASTER-TANKHUN)
