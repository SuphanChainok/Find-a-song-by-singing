#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
01_train_word2vec.py
--------------------
เทรนโมเดล Word2Vec ภาษาไทยจากคลังรีวิว Wongnai (40,000 รีวิว)

ขั้นตอนภายใน:
  1. ดาวน์โหลด (หรืออ่านจากไฟล์ที่มีอยู่) ชุดข้อมูล wongnai-corpus
  2. ตัดคำภาษาไทยด้วย PyThaiNLP (engine: newmm)
  3. เทรน Word2Vec แบบ skip-gram ด้วย gensim
  4. บันทึกโมเดล + ส่งออก CSV สำหรับนำเข้า Altair AI Studio

วิธีใช้:
    python3 01_train_word2vec.py                    # เทรนเต็ม 40,000 รีวิว
    python3 01_train_word2vec.py --sample 5000      # เทรนแค่ 5,000 รีวิว
    python3 01_train_word2vec.py --epochs 20        # เพิ่มรอบการเทรน

ติดตั้งไลบรารีก่อนใช้งาน:
    pip install gensim pythainlp pandas numpy
"""

import argparse
import os
import pickle
import re
import sys
import time
import urllib.request
import zipfile

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# ค่าตั้งต้น
# ---------------------------------------------------------------------------

DATA_URL = ("https://raw.githubusercontent.com/wongnai/wongnai-corpus/"
            "master/review/review_dataset.zip")
ZIP_NAME = "review_dataset.zip"
CSV_IN_ZIP = "w_review_train.csv"
OUT_DIR = "output"


def log(msg):
    """พิมพ์ข้อความพร้อมเวลา เพื่อให้เห็นความคืบหน้าระหว่างรัน"""
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)


# ---------------------------------------------------------------------------
# ขั้นที่ 1 — เตรียมข้อมูล
# ---------------------------------------------------------------------------

def download_dataset(path=ZIP_NAME):
    """ดาวน์โหลดไฟล์ zip จาก GitHub ถ้ายังไม่มีในเครื่อง"""
    if os.path.exists(path):
        log(f"พบไฟล์ {path} อยู่แล้ว ข้ามการดาวน์โหลด")
        return path

    log(f"กำลังดาวน์โหลดคลังข้อมูล (~14 MB) จาก GitHub ...")
    urllib.request.urlretrieve(DATA_URL, path)
    log(f"ดาวน์โหลดเสร็จ: {path}")
    return path


def load_reviews(zip_path=ZIP_NAME):
    """
    อ่านรีวิวจากไฟล์ zip

    รูปแบบไฟล์: "ข้อความรีวิว";คะแนน   (ไม่มีบรรทัดหัวตาราง, คั่นด้วย ;)
    คืนค่า DataFrame ที่มีคอลัมน์ review และ rating
    """
    log("กำลังอ่านข้อมูลรีวิว ...")
    with zipfile.ZipFile(zip_path) as z:
        with z.open(CSV_IN_ZIP) as f:
            df = pd.read_csv(f, sep=";", header=None,
                             names=["review", "rating"],
                             engine="python", quotechar='"')
    log(f"อ่านได้ {len(df):,} รีวิว")
    return df


# ---------------------------------------------------------------------------
# ขั้นที่ 2 — ตัดคำ
# ---------------------------------------------------------------------------

def tokenize_all(texts, cache_path=None):
    """
    ตัดคำภาษาไทยทุกรีวิวด้วย PyThaiNLP

    กรองทิ้ง: คำที่มีตัวอักษรเดียว, ตัวเลขล้วน, เครื่องหมายวรรคตอนล้วน
    เพราะโทเคนเหล่านี้ไม่มีความหมายทางภาษาและทำให้ vocabulary รก

    ใช้ cache เพราะการตัดคำ 40,000 รีวิวใช้เวลาราว 40-60 วินาที
    ไม่ควรทำซ้ำทุกครั้งที่ปรับพารามิเตอร์การเทรน
    """
    if cache_path and os.path.exists(cache_path):
        log(f"โหลดผลการตัดคำจาก cache: {cache_path}")
        with open(cache_path, "rb") as f:
            return pickle.load(f)

    from pythainlp.tokenize import word_tokenize

    log("กำลังตัดคำภาษาไทย (ใช้เวลาสักครู่) ...")
    t0 = time.time()
    junk = re.compile(r"[\d\W_]+")
    sentences = []

    for i, text in enumerate(texts):
        tokens = word_tokenize(str(text), engine="newmm", keep_whitespace=False)
        tokens = [w.strip() for w in tokens]
        tokens = [w for w in tokens if len(w) > 1 and not junk.fullmatch(w)]
        sentences.append(tokens)

        if (i + 1) % 5000 == 0:
            log(f"  ตัดคำแล้ว {i + 1:,} รีวิว")

    total = sum(len(s) for s in sentences)
    log(f"ตัดคำเสร็จใน {time.time() - t0:.1f} วินาที — รวม {total:,} คำ")

    if cache_path:
        with open(cache_path, "wb") as f:
            pickle.dump(sentences, f)
        log(f"บันทึก cache ไว้ที่ {cache_path}")

    return sentences


# ---------------------------------------------------------------------------
# ขั้นที่ 3 — เทรนโมเดล
# ---------------------------------------------------------------------------

def train_model(sentences, vector_size=100, window=5, min_count=10,
                epochs=10, workers=8, seed=42):
    """
    เทรน Word2Vec แบบ skip-gram

    เหตุผลที่เลือก sg=1 (skip-gram) แทน CBOW:
      skip-gram เรียนรู้จากคลังขนาดกลางและคำที่พบไม่บ่อยได้ดีกว่า
      แลกกับเวลาเทรนที่นานกว่า ซึ่งคุ้มค่าสำหรับงานนี้

    min_count=10 คือคำต้องปรากฏอย่างน้อย 10 ครั้งจึงจะได้ vector
      ต่ำกว่านี้จะได้คำสะกดผิดและคำหายากที่ vector ไม่น่าเชื่อถือ
    """
    from gensim.models import Word2Vec

    log(f"เริ่มเทรน Word2Vec (skip-gram, {vector_size} มิติ, {epochs} epochs) ...")
    log("  ขั้นนี้ใช้เวลานานที่สุด — ราว 3-5 นาทีสำหรับคลังเต็ม")
    t0 = time.time()

    model = Word2Vec(
        sentences,
        vector_size=vector_size,
        window=window,
        min_count=min_count,
        sg=1,               # 1 = skip-gram, 0 = CBOW
        negative=5,
        epochs=epochs,
        workers=workers,
        seed=seed,
    )

    log(f"เทรนเสร็จใน {time.time() - t0:.1f} วินาที")
    log(f"ขนาด vocabulary: {len(model.wv):,} คำ")
    return model


# ---------------------------------------------------------------------------
# ขั้นที่ 4 — ส่งออกผลลัพธ์
# ---------------------------------------------------------------------------

def export_word_vectors(model, out_dir, top_n=9000):
    """
    ส่งออกตาราง word + vector เป็น CSV

    จำกัดที่ 9,000 คำ (เรียงตามความถี่) เพื่อให้ต่ำกว่าเพดาน 10,000 แถว
    ของ Altair AI Studio รุ่น Free — นำเข้าด้วย Read CSV แล้วใช้กับ
    operator เดิมได้ทันที (Set Role -> Cross Distances / k-Means / PCA)
    """
    words = list(model.wv.index_to_key)[:top_n]
    vectors = model.wv[words]

    df = pd.DataFrame(vectors,
                      columns=[f"dim_{i}" for i in range(vectors.shape[1])])
    df.insert(0, "word", words)

    path = os.path.join(out_dir, "word_vectors.csv")
    df.to_csv(path, index=False, encoding="utf-8-sig")
    log(f"ส่งออก word vectors: {path}  ({len(df):,} คำ)")
    return path


def build_doc_vectors(model, sentences):
    """
    สร้าง vector ระดับเอกสาร โดยเฉลี่ย vector ของทุกคำในรีวิวนั้น

    ข้อจำกัดที่ควรรู้ (และควรสอน):
      การเฉลี่ยทำให้ลำดับคำหายไปทั้งหมด
      'ร้านนี้ไม่อร่อย' กับ 'ไม่ ร้านนี้อร่อย' จะได้ vector เท่ากัน
    """
    log("กำลังสร้าง vector ระดับเอกสาร ...")
    dim = model.wv.vector_size
    out = np.zeros((len(sentences), dim), dtype=np.float32)

    for i, tokens in enumerate(sentences):
        vecs = [model.wv[w] for w in tokens if w in model.wv]
        if vecs:
            out[i] = np.mean(vecs, axis=0)

    # normalize เพื่อให้คำนวณ cosine similarity ได้ด้วยการคูณเมทริกซ์
    norms = np.linalg.norm(out, axis=1, keepdims=True)
    out = out / (norms + 1e-9)
    return out


def preview(model, words=None):
    """แสดงตัวอย่างคำใกล้เคียง เพื่อตรวจคุณภาพโมเดลทันทีหลังเทรนเสร็จ"""
    words = words or ["อร่อย", "ร้าน", "ราคา", "บริการ", "ส้มตำ", "กาแฟ", "แพง"]
    print("\n" + "=" * 66)
    print("ตัวอย่างผลลัพธ์ — คำที่มีความหมายใกล้เคียง")
    print("=" * 66)
    for w in words:
        if w in model.wv:
            near = model.wv.most_similar(w, topn=6)
            items = ", ".join(f"{a} ({b:.2f})" for a, b in near)
            print(f"  {w:<10} -> {items}")
        else:
            print(f"  {w:<10} -> (ไม่พบใน vocabulary)")
    print("=" * 66 + "\n")


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(
        description="เทรน Word2Vec ภาษาไทยจากคลังรีวิว Wongnai")
    ap.add_argument("--zip", default=ZIP_NAME,
                    help="ที่อยู่ไฟล์ review_dataset.zip")
    ap.add_argument("--out", default=OUT_DIR, help="โฟลเดอร์เก็บผลลัพธ์")
    ap.add_argument("--sample", type=int, default=0,
                    help="ใช้รีวิวกี่ใบ (0 = ใช้ทั้งหมด 40,000)")
    ap.add_argument("--dim", type=int, default=100, help="จำนวนมิติของ vector")
    ap.add_argument("--epochs", type=int, default=10, help="จำนวนรอบการเทรน")
    ap.add_argument("--min-count", type=int, default=10,
                    help="ความถี่ขั้นต่ำที่คำจะได้ vector")
    ap.add_argument("--no-doc-vectors", action="store_true",
                    help="ข้ามการสร้าง vector ระดับเอกสาร")
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)

    # 1. เตรียมข้อมูล
    download_dataset(args.zip)
    df = load_reviews(args.zip)
    if args.sample and args.sample < len(df):
        df = df.head(args.sample).copy()
        log(f"ใช้ตัวอย่างเพียง {len(df):,} รีวิว")

    # 2. ตัดคำ
    cache = os.path.join(args.out, f"tokens_{len(df)}.pkl")
    sentences = tokenize_all(df["review"].tolist(), cache_path=cache)

    total_tokens = sum(len(s) for s in sentences)
    avg_tokens = total_tokens / len(sentences)

    # 3. เทรน
    model = train_model(sentences,
                        vector_size=args.dim,
                        min_count=args.min_count,
                        epochs=args.epochs)

    model_path = os.path.join(args.out, "wongnai_w2v.model")
    model.save(model_path)
    log(f"บันทึกโมเดล: {model_path}")

    # 4. ส่งออก
    export_word_vectors(model, args.out)

    df[["review", "rating"]].to_csv(
        os.path.join(args.out, "reviews.csv"), index=False, encoding="utf-8-sig")

    if not args.no_doc_vectors:
        doc_vecs = build_doc_vectors(model, sentences)
        np.save(os.path.join(args.out, "doc_vectors.npy"), doc_vecs)
        log(f"บันทึก vector ระดับเอกสาร: {doc_vecs.shape}")

    # สรุปตัวเลขสำหรับใช้ในห้องเรียน
    print("\n" + "=" * 66)
    print("สรุปขนาดคลังข้อมูล (ตัวเลขสำหรับเขียนบนกระดาน)")
    print("=" * 66)
    print(f"  จำนวนรีวิว          : {len(df):,} ใบ")
    print(f"  จำนวนคำทั้งคลัง      : {total_tokens:,} คำ")
    print(f"  ความยาวเฉลี่ยต่อรีวิว : {avg_tokens:.1f} คำ")
    print(f"  ขนาด vocabulary     : {len(model.wv):,} คำ")
    print("=" * 66)

    preview(model)
    log("เสร็จสมบูรณ์ — รันต่อด้วย  python3 02_demo_classroom.py")


if __name__ == "__main__":
    sys.exit(main())
