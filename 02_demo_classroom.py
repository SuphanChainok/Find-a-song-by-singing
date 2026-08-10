#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
02_demo_classroom.py
--------------------
โปรแกรมสาธิตหน้าชั้นเรียน — เมนูโต้ตอบสำหรับใช้ระหว่างสอน

ออกแบบให้กดใช้สดหน้าห้องได้ ไม่ต้องแก้โค้ดระหว่างสอน
นักศึกษาเสนอคำ อาจารย์พิมพ์ตาม เห็นผลทันที

ต้องรัน 01_train_word2vec.py ให้เสร็จก่อน

วิธีใช้:
    python3 02_demo_classroom.py
"""

import os
import sys
import textwrap

import numpy as np
import pandas as pd

OUT_DIR = "output"
LINE = "=" * 70


# ---------------------------------------------------------------------------
# โหลดสิ่งที่เทรนไว้แล้ว
# ---------------------------------------------------------------------------

def load_all(out_dir=OUT_DIR):
    """โหลดโมเดล รีวิว และ vector ระดับเอกสารที่เตรียมไว้"""
    from gensim.models import Word2Vec

    model_path = os.path.join(out_dir, "wongnai_w2v.model")
    if not os.path.exists(model_path):
        print("ไม่พบไฟล์โมเดล — กรุณารัน 01_train_word2vec.py ก่อน")
        sys.exit(1)

    model = Word2Vec.load(model_path)

    reviews = None
    reviews_path = os.path.join(out_dir, "reviews.csv")
    if os.path.exists(reviews_path):
        reviews = pd.read_csv(reviews_path, encoding="utf-8-sig")

    doc_vecs = None
    doc_path = os.path.join(out_dir, "doc_vectors.npy")
    if os.path.exists(doc_path):
        doc_vecs = np.load(doc_path)

    return model, reviews, doc_vecs


def clean(text, width=100):
    """ย่อข้อความรีวิวให้อ่านง่ายบนจอโปรเจกเตอร์"""
    text = " ".join(str(text).split())
    return textwrap.shorten(text, width=width, placeholder=" ...")


# ---------------------------------------------------------------------------
# เมนู 1 — หาคำที่มีความหมายใกล้เคียง
# ---------------------------------------------------------------------------

def menu_similar_words(model):
    """
    การสาธิตหลัก: พิมพ์คำใดก็ได้ แล้วดูว่าโมเดลคิดว่าคำไหนใกล้เคียง

    ใช้ตอนที่นักศึกษาเสนอคำเอง จะได้เห็นว่าไม่ได้เตรียมคำตอบไว้ล่วงหน้า
    """
    print(f"\n{LINE}\n  หาคำที่มีความหมายใกล้เคียง\n{LINE}")
    print("  พิมพ์คำภาษาไทย แล้วกด Enter  (พิมพ์ q เพื่อกลับเมนูหลัก)\n")

    while True:
        word = input("  คำที่ต้องการค้นหา > ").strip()
        if word.lower() in ("q", "quit", "exit", ""):
            return

        if word not in model.wv:
            print(f"  ไม่พบคำว่า '{word}' ใน vocabulary")
            print("  (คำนี้อาจปรากฏในคลังน้อยกว่า 10 ครั้ง จึงไม่ได้ vector)\n")
            continue

        freq = model.wv.get_vecattr(word, "count")
        print(f"\n  '{word}' ปรากฏในคลัง {freq:,} ครั้ง")
        print(f"  {'อันดับ':<8}{'คำ':<24}{'ความคล้าย'}")
        print("  " + "-" * 46)
        for i, (w, score) in enumerate(model.wv.most_similar(word, topn=10), 1):
            bar = "#" * int(score * 30)
            print(f"  {i:<8}{w:<24}{score:.3f}  {bar}")
        print()


# ---------------------------------------------------------------------------
# เมนู 2 — กับดักคำตรงข้าม
# ---------------------------------------------------------------------------

def menu_antonym_trap(model):
    """
    จุดสอนสำคัญ: Word2Vec วัด 'ความคล้ายของบริบท' ไม่ใช่ 'ความหมายเหมือน'

    คำตรงข้ามอย่าง แพง/ถูก ปรากฏในประโยคแบบเดียวกัน
    ('ราคาแพงมาก' / 'ราคาถูกมาก') จึงได้ vector ใกล้กัน
    ทั้งที่ความหมายตรงข้าม
    """
    print(f"\n{LINE}\n  กับดักคำตรงข้าม — ข้อจำกัดที่ต้องรู้\n{LINE}\n")

    pairs = [("แพง", "ถูก"), ("อร่อย", "จืด"), ("ดี", "แย่"), ("ร้อน", "เย็น")]

    for a, b in pairs:
        if a in model.wv and b in model.wv:
            score = model.wv.similarity(a, b)
            print(f"  ความคล้ายระหว่าง '{a}' กับ '{b}' = {score:.3f}")

    print("\n  ทั้งที่เป็นคำตรงข้าม แต่โมเดลกลับบอกว่าใกล้เคียงกันมาก")
    print("  เพราะทั้งคู่ปรากฏในบริบทเดียวกัน เช่น 'ราคาแพงมาก' / 'ราคาถูกมาก'")
    print("  โมเดลเรียนรู้ว่า 'คำที่แวดล้อมเหมือนกัน = คล้ายกัน'")
    print("  ซึ่งไม่เท่ากับ 'ความหมายเหมือนกัน'\n")

    if "แพง" in model.wv:
        print("  ดูคำใกล้เคียงของ 'แพง' จะเห็นชัด:")
        for w, s in model.wv.most_similar("แพง", topn=6):
            print(f"    {w} ({s:.2f})")
    print()


# ---------------------------------------------------------------------------
# เมนู 3 — ค้นหารีวิวที่พูดเรื่องเดียวกัน
# ---------------------------------------------------------------------------

def menu_similar_reviews(model, reviews, doc_vecs):
    """
    การสาธิตระดับเอกสาร: แปลงรีวิวทั้งใบเป็น vector แล้วหารีวิวที่คล้ายกัน

    จุดที่ทรงพลังคือ รีวิวที่ค้นเจอมักไม่มีคำซ้ำกับรีวิวต้นแบบเลย
    แต่พูดเรื่องเดียวกัน ซึ่งการค้นหาด้วยคำ (keyword search) ทำไม่ได้
    """
    if reviews is None or doc_vecs is None:
        print("\n  ไม่พบข้อมูลรีวิวหรือ vector ระดับเอกสาร")
        print("  กรุณารัน 01_train_word2vec.py โดยไม่ใส่ --no-doc-vectors\n")
        return

    print(f"\n{LINE}\n  ค้นหารีวิวที่พูดเรื่องเดียวกัน\n{LINE}")
    print(f"  มีรีวิวทั้งหมด {len(reviews):,} ใบ")
    print("  ใส่หมายเลขรีวิวต้นแบบ, พิมพ์ r เพื่อสุ่ม, q เพื่อกลับเมนู\n")

    while True:
        raw = input("  หมายเลขรีวิว > ").strip().lower()
        if raw in ("q", "quit", "exit", ""):
            return

        if raw == "r":
            idx = int(np.random.randint(0, len(reviews)))
        else:
            try:
                idx = int(raw)
            except ValueError:
                print("  กรุณาใส่ตัวเลข หรือ r เพื่อสุ่ม\n")
                continue
            if not 0 <= idx < len(reviews):
                print(f"  หมายเลขต้องอยู่ระหว่าง 0 ถึง {len(reviews) - 1}\n")
                continue

        sims = doc_vecs @ doc_vecs[idx]
        sims[idx] = -np.inf
        top = np.argsort(-sims)[:5]

        print(f"\n  [รีวิวต้นแบบ #{idx}] คะแนน {reviews['rating'][idx]} ดาว")
        print(f"  {clean(reviews['review'][idx], 200)}\n")
        print("  รีวิวที่โมเดลบอกว่าพูดเรื่องคล้ายกันที่สุด:")
        print("  " + "-" * 66)
        for rank, j in enumerate(top, 1):
            print(f"  {rank}. [#{j}] ความคล้าย {sims[j]:.3f} "
                  f"| {reviews['rating'][j]} ดาว")
            print(f"     {clean(reviews['review'][j], 160)}\n")


# ---------------------------------------------------------------------------
# เมนู 4 — จัดกลุ่มคำอัตโนมัติ
# ---------------------------------------------------------------------------

def menu_cluster_words(model, k=8, top_n=400, skip=60):
    """
    จัดกลุ่มคำที่พบบ่อยที่สุดด้วย k-Means

    กิจกรรมกลุ่ม: ให้นักศึกษาช่วยกันตั้งชื่อแต่ละคลัสเตอร์
    มักได้กลุ่มที่ตีความได้ เช่น รสชาติ / บริการ / ราคา / ชื่ออาหาร
    ทั้งที่ไม่มีใครกำหนดหัวข้อไว้ล่วงหน้า
    """
    try:
        from sklearn.cluster import KMeans
    except ImportError:
        print("\n  ต้องติดตั้ง scikit-learn ก่อน:  pip install scikit-learn\n")
        return

    print(f"\n{LINE}\n  จัดกลุ่มคำอัตโนมัติด้วย k-Means (k={k})\n{LINE}\n")

    # ข้ามคำที่พบบ่อยที่สุด skip อันดับแรก เพราะเป็นคำหน้าที่
    # (ที่, มี, เป็น, และ, ไม่, ก็) ซึ่งไม่มีความหมายเชิงเนื้อหา
    # ถ้าไม่ข้าม คลัสเตอร์จะเต็มไปด้วยคำเหล่านี้จนตีความไม่ได้
    words = list(model.wv.index_to_key)[skip:skip + top_n]
    X = model.wv[words]

    km = KMeans(n_clusters=k, random_state=42, n_init=10).fit(X)

    for c in range(k):
        members = [w for w, lab in zip(words, km.labels_) if lab == c]
        print(f"  กลุ่มที่ {c + 1} ({len(members)} คำ)")
        print(f"    {', '.join(members[:18])}")
        print()

    print("  ให้นักศึกษาช่วยกันตั้งชื่อแต่ละกลุ่ม")
    print("  แล้วถามว่า 'ใครเป็นคนบอกโปรแกรมว่ากลุ่มพวกนี้คืออะไร'\n")


# ---------------------------------------------------------------------------
# เมนู 5 — เทียบขนาดคลังข้อมูล
# ---------------------------------------------------------------------------

def menu_data_scale(model):
    """
    แสดงตัวเลขขนาดคลังข้อมูล เทียบกับโมเดลระดับโลก

    ใช้ตอนอธิบายว่าทำไมต้องใช้ข้อมูลเยอะ และทำไมโลกจริงจึงใช้
    pre-trained model แทนการเทรนเอง
    """
    vocab = len(model.wv)
    corpus = sum(model.wv.get_vecattr(w, "count")
                 for w in model.wv.index_to_key)

    print(f"\n{LINE}\n  ขนาดคลังข้อมูล — ทำไมต้องใช้ข้อมูลเยอะ\n{LINE}\n")
    print(f"  คลังรีวิว Wongnai ของเรา : ~{corpus:,} คำ")
    print(f"  ขนาด vocabulary          : {vocab:,} คำ\n")

    print("  เทียบกับคลังอื่น (ค่าประมาณระดับ order of magnitude):")
    print("    นิยายเล่มหนา 1 เล่ม        ~ 150,000 คำ")
    print("    วิกิพีเดียไทยทั้งหมด        ~ หลักสิบล้านคำ")
    print("    Word2Vec ต้นฉบับของ Google ~ หลักแสนล้านคำ\n")

    ratio = 100_000_000_000 / max(corpus, 1)
    print(f"  คลังของเราเล็กกว่าของ Google ประมาณ {ratio:,.0f} เท่า")
    print("  แต่ยังพอเรียนรู้ภาษาในโดเมนอาหารได้ เพราะเป็นคลังเฉพาะทาง\n")
    print("  คำถามชวนคิด: ถ้าจะเทรนโมเดลภาษาไทยทั่วไป")
    print("  ต้องใช้รีวิวกี่ใบ และเป็นไปได้จริงหรือไม่\n")


# ---------------------------------------------------------------------------
# เมนูหลัก
# ---------------------------------------------------------------------------

def main():
    print("\nกำลังโหลดโมเดล ...")
    model, reviews, doc_vecs = load_all()
    print(f"โหลดสำเร็จ — vocabulary {len(model.wv):,} คำ, "
          f"vector {model.wv.vector_size} มิติ")

    menus = {
        "1": ("หาคำที่มีความหมายใกล้เคียง",
              lambda: menu_similar_words(model)),
        "2": ("กับดักคำตรงข้าม (ข้อจำกัดของโมเดล)",
              lambda: menu_antonym_trap(model)),
        "3": ("ค้นหารีวิวที่พูดเรื่องเดียวกัน",
              lambda: menu_similar_reviews(model, reviews, doc_vecs)),
        "4": ("จัดกลุ่มคำอัตโนมัติด้วย k-Means",
              lambda: menu_cluster_words(model)),
        "5": ("เทียบขนาดคลังข้อมูล",
              lambda: menu_data_scale(model)),
    }

    while True:
        print(f"\n{LINE}")
        print("  สาธิต Word2Vec ภาษาไทย — คลังรีวิว Wongnai")
        print(LINE)
        for key, (label, _) in menus.items():
            print(f"    {key}. {label}")
        print("    q. ออกจากโปรแกรม")
        print(LINE)

        choice = input("  เลือกเมนู > ").strip().lower()
        if choice in ("q", "quit", "exit"):
            print("  จบการสาธิต\n")
            return
        if choice in menus:
            menus[choice][1]()
        else:
            print("  ไม่มีเมนูนี้ กรุณาเลือกใหม่")


if __name__ == "__main__":
    try:
        main()
    except (KeyboardInterrupt, EOFError):
        print("\n  จบการสาธิต\n")
