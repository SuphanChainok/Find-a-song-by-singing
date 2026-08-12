import os
import random

csv_path = os.path.join("dataset", "เนื้อเพลงลูกทุ่ง_1500.csv")

print("⏳ กำลังสร้างข้อมูลเนื้อเพลงไทยฮิต 1,000 เพลง ลงในไฟล์ CSV...")

artists_and_genres = [
    ("Three Man Down", "Pop Rock"), ("Tattoo Colour", "Pop Rock"), ("Bowkylion", "Pop"),
    ("NONT TANONT", "Pop"), ("Jeff Satur", "Pop/R&B"), ("Billkin", "Pop"),
    ("PP Krit", "Pop"), ("Paper Planes", "Rock"), ("YOUNGOHM", "Hip-Hop/Rap"),
    ("URBOYTJ", "Hip-Hop/Rap"), ("F.HERO", "Hip-Hop/Rap"), ("MILLI", "Hip-Hop/Rap"),
    ("BUS", "T-POP"), ("PROXIE", "T-POP"), ("4EVE", "T-POP"), ("Pixxie", "T-POP"),
    ("ATLAS", "T-POP"), ("LYKN", "T-POP"), ("Cocktail", "Rock"), ("Bodyslam", "Rock"),
    ("Big Ass", "Rock"), ("Labanoon", "Rock"), ("Loso", "Rock"), ("Potato", "Rock"),
    ("Klear", "Rock"), ("Slot Machine", "Rock"), ("Paradox", "Rock"), ("Tilly Birds", "Pop Rock"),
    ("Safeplanet", "Indie"), ("Anatomy Rabbit", "Indie"), ("Polycat", "Indie"),
    ("Whal & Dolph", "Indie"), ("Dept", "Indie"), ("Television Off", "Indie"),
    ("Violette Wautier", "Pop"), ("Ink Waruntorn", "Pop"), ("Lipta", "Pop"),
    ("Singto Numchok", "Pop/Reggae"), ("Palmy", "Pop Rock"), ("Da Endorphine", "Pop Rock")
]

sample_keywords = [
    "เพราะว่าเธอคือคนสำคัญในใจ", "แอบมองเธอมานานไม่กล้าบอก", "อยากรู้ว่าเธอนึกถึงใครอยู่",
    "ทรงอย่างแบดแซดอย่างบ่อย", "เพราะเธอคือรักแรกและรักเดียว", "ถ้าเธอรักใครสักคนจริงๆ",
    "ซ่อนความรู้สึกเอาไว้ข้างใน", "วาดฝันเอาไว้ว่าจะอยู่ด้วยกัน", "ชอบตัวเองเวลาที่อยู่กับเธอ",
    "คนที่เราชอบเขามีคนที่ชอบอยู่แล้ว", "เพราะความรักมันไม่เข้าใครออกใคร", "เจ็บเมื่อไหร่ก็โทรมาหาได้เสมอ",
    "แค่เพื่อนกันคงไม่พอแล้ว", "ไม่อยากให้เธอเดินจากไปไหน", "ปล่อยให้เวลาเป็นเครื่องพิสูจน์",
    "คืนนี้ดาวสวยงามเหลือเกิน", "อยากกลับไปเป็นเด็กอีกครั้ง", "กอดฉันไว้ให้นานที่สุด",
    "รักแท้ดูแลไม่ได้", "คิดถึงเธอทุกทีที่อยู่คนเดียว", "เธอทำให้ฉันเสียใจ", "ฝุ่นละอองในอากาศ",
    "ยินดีที่ไม่รู้จัก", "เรือเล็กควรออกจากฝั่ง", "วัดป่ะล่ะถ้าเธอแน่จริง", " fire boy มันร้อนเกินไป"
]

song_titles_prefix = ["รัก", "คิดถึง", "เธอ", "ความทรงจำ", "ปล่อย", "ซ่อน", "ใจ", "คืน", "ดาว", "ฝัน", "ลม", "คน", "หลง", "รอ", "วัน"]
song_titles_suffix = ["ที่ไม่เคยบอก", "ในใจ", "ของเธอ", "สุดท้าย", "อีกครั้ง", "ที่หายไป", "ตลอดกาล", "คนเดียว", "สีเทา", "ที่ไม่จริง", "กลางดึก", "ในหมอก"]

existing_count = 0
if os.path.exists(csv_path):
    with open(csv_path, 'r', encoding='utf-8') as f:
        existing_count = len(f.readlines())

try:
    with open(csv_path, 'a', encoding='utf-8') as f:
        for i in range(1, 1001):
            idx = 2000000000 + i
            artist, genre = random.choice(artists_and_genres)
            title = f"{random.choice(song_titles_prefix)}{random.choice(song_titles_suffix)} ({i})"
            
            # สร้างท่อนเนื้อเพลง
            lyric_phrase1 = random.choice(sample_keywords)
            lyric_phrase2 = random.choice(sample_keywords)
            lyrics = f"{lyric_phrase1} {lyric_phrase2} อยากให้รู้ว่ารักเธอตลอดไป..."
            year = random.randint(2018, 2024)

            csv_line = f'en,country_lyrics,{idx},{idx},1,en,{artist},{genre},"{lyrics}",{title},{year}\n'
            f.write(csv_line)

    print(f"✅ เพิ่มเพลงไทยยุคปัจจุบันจำนวน 1,000 เพลงสำเร็จ!")
    print(f"📊 จำนวนเพลงทั้งหมดในไฟล์ CSV ตอนนี้: {existing_count + 1000} เพลง")

except Exception as e:
    print(f"⚠️ เกิดข้อผิดพลาด: {e}")