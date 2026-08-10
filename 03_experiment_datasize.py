#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
03_experiment_datasize.py
-------------------------
การทดลองแบบมีตัวแปรควบคุม: ขนาดคลังข้อมูลมีผลต่อคุณภาพโมเดลอย่างไร

เทรน Word2Vec หลายรอบด้วยจำนวนรีวิวต่างกัน (500 / 2,000 / 10,000 / 40,000)
โดยตั้งพารามิเตอร์อื่นเหมือนกันทุกประการ แล้วเทียบผลลัพธ์ของคำเดียวกัน

นี่คือหลักฐานที่ทำให้บทเรียนเป็นวิทยาศาสตร์ ไม่ใช่แค่การบอกว่า
'ข้อมูลเยอะดีกว่า' — นักศึกษาจะได้เห็นแนวโน้มด้วยตาตัวเอง

รันครั้งเดียวก่อนสอน แล้วเก็บผลไว้ใช้ในห้อง (ใช้เวลารวมราว 5-8 นาที)

วิธีใช้:
    python3 03_experiment_datasize.py
    python3 03_experiment_datasize.py --sizes 500 2000 10000 40000
"""

import argparse
import importlib.util
import os
import sys
import time

import pandas as pd

# นำฟังก์ชันจากสคริปต์แรกมาใช้ซ้ำ เพื่อให้แน่ใจว่าขั้นตอนเตรียมข้อมูล
# เหมือนกันทุกประการในทุกรอบ ไม่มีตัวแปรแฝงมารบกวนผลการทดลอง


def _load_trainer(path="01_train_word2vec.py"):
    """โหลดฟังก์ชันจาก 01_train_word2vec.py (ชื่อไฟล์ขึ้นต้นด้วยตัวเลข)"""
    spec = importlib.util.spec_from_file_location("trainer", path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["trainer"] = mod
    spec.loader.exec_module(mod)
    return mod


TEST_WORDS = ["อร่อย", "ร้าน", "ราคา", "บริการ"]
LINE = "=" * 72


def run_experiment(sizes, out_dir="output", epochs=10, min_count=10):
    """เทรนโมเดลทีละขนาด แล้วเก็บผลลัพธ์ลงตาราง"""
    T = _load_trainer()

    T.download_dataset()
    df_all = T.load_reviews()

    rows = []
    detail = []

    for n in sizes:
        n = min(n, len(df_all))
        print(f"\n{LINE}\n  รอบการทดลอง: {n:,} รีวิว\n{LINE}")

        df = df_all.head(n)
        cache = os.path.join(out_dir, f"tokens_{n}.pkl")
        sentences = T.tokenize_all(df["review"].tolist(), cache_path=cache)
        total_tokens = sum(len(s) for s in sentences)

        t0 = time.time()
        model = T.train_model(sentences, vector_size=100,
                              min_count=min_count, epochs=epochs)
        train_time = time.time() - t0

        # เก็บตัวเลขสรุปของรอบนี้
        row = {
            "จำนวนรีวิว": n,
            "จำนวนคำทั้งคลัง": total_tokens,
            "ขนาด vocabulary": len(model.wv),
            "เวลาเทรน (วินาที)": round(train_time, 1),
        }

        # เก็บผลของคำทดสอบแต่ละคำ
        for w in TEST_WORDS:
            if w in model.wv:
                near = model.wv.most_similar(w, topn=5)
                row[f"'{w}' ใกล้ที่สุด"] = near[0][0]
                row[f"'{w}' ค่าความคล้าย"] = round(near[0][1], 3)
                detail.append({
                    "จำนวนรีวิว": n,
                    "คำค้น": w,
                    "คำใกล้เคียง 5 อันดับ":
                        ", ".join(f"{a} ({b:.2f})" for a, b in near),
                })
            else:
                row[f"'{w}' ใกล้ที่สุด"] = "(ไม่พบคำ)"
                row[f"'{w}' ค่าความคล้าย"] = None

        rows.append(row)

    return pd.DataFrame(rows), pd.DataFrame(detail)


def main():
    ap = argparse.ArgumentParser(
        description="ทดลองผลของขนาดคลังข้อมูลต่อคุณภาพ Word2Vec")
    ap.add_argument("--sizes", type=int, nargs="+",
                    default=[500, 2000, 10000, 40000],
                    help="จำนวนรีวิวในแต่ละรอบ")
    ap.add_argument("--out", default="output", help="โฟลเดอร์เก็บผลลัพธ์")
    ap.add_argument("--epochs", type=int, default=10)
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)

    summary, detail = run_experiment(args.sizes, args.out, args.epochs)

    print(f"\n\n{LINE}")
    print("  ตารางสรุปผลการทดลอง")
    print(LINE)
    print(summary.to_string(index=False))

    print(f"\n\n{LINE}")
    print("  รายละเอียดคำใกล้เคียงในแต่ละรอบ")
    print(LINE)
    for word in TEST_WORDS:
        sub = detail[detail["คำค้น"] == word]
        if sub.empty:
            continue
        print(f"\n  คำค้น: {word}")
        for _, r in sub.iterrows():
            print(f"    {r['จำนวนรีวิว']:>6,} รีวิว -> {r['คำใกล้เคียง 5 อันดับ']}")

    p1 = os.path.join(args.out, "experiment_summary.csv")
    p2 = os.path.join(args.out, "experiment_detail.csv")
    summary.to_csv(p1, index=False, encoding="utf-8-sig")
    detail.to_csv(p2, index=False, encoding="utf-8-sig")

    print(f"\n\nบันทึกผลไว้ที่:\n  {p1}\n  {p2}")
    print("\nนำตารางนี้ไปใช้ในช่วงที่ 4 ของแผนการสอนได้เลย\n")


if __name__ == "__main__":
    main()
