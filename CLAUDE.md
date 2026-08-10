# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Teaching material (not a library or app) for a 90-minute Thai-language lesson on Word Embedding / Word2Vec, built on the Wongnai review corpus (40,000 Thai restaurant reviews). `แผนการสอน_Word2Vec.md` is the lesson plan and is the source of truth for what the scripts must produce — if you change a script's output, check whether the lesson plan's expected numbers, filenames, or menu numbers still match.

All code comments, docstrings, CLI help, and program output are in Thai. Keep it that way when editing.

## Setup and commands

```bash
pip install gensim pythainlp pandas numpy scikit-learn

python3 01_train_word2vec.py                 # full 40k corpus; ~5-8 min
python3 01_train_word2vec.py --sample 5000   # fast iteration while developing
python3 02_demo_classroom.py                 # interactive classroom demo (needs step 1)
python3 03_experiment_datasize.py            # corpus-size experiment; ~8-12 min
```

There are no tests, linter config, or packaging. Verification is by running the scripts and eyeballing the Thai output.

## Pipeline and data flow

The three scripts are strictly sequential stages sharing state only through files in `output/`:

1. **`01_train_word2vec.py`** — downloads `review_dataset.zip` from GitHub if absent, reads `w_review_train.csv` from inside the zip (`;`-separated, **no header**, columns `review;rating`), tokenizes with PyThaiNLP `newmm`, trains gensim skip-gram Word2Vec, writes:
   - `output/wongnai_w2v.model` — the gensim model
   - `output/word_vectors.csv` — top 9,000 words × 100 dims, `utf-8-sig`. The 9,000 cap is deliberate: Altair AI Studio Free rejects >10,000 rows.
   - `output/doc_vectors.npy` — L2-normalized mean-of-word-vectors per review, so cosine similarity is a plain dot product in `02`
   - `output/reviews.csv` — original review text + rating, row-aligned with `doc_vectors.npy` by index
   - `output/tokens_<N>.pkl` — tokenization cache keyed by review count; delete it if tokenization logic changes, or stale tokens are silently reused
2. **`02_demo_classroom.py`** — read-only consumer, a 5-item interactive menu driven live in class. Model is required; `reviews.csv`/`doc_vectors.npy` are optional (menu 3 degrades gracefully).
3. **`03_experiment_datasize.py`** — imports `01_train_word2vec.py` via `importlib.util.spec_from_file_location` (the filename starts with a digit, so it is not importable normally) and reuses `download_dataset` / `load_reviews` / `tokenize_all` / `train_model`. This reuse is the experiment's control: identical preprocessing across corpus sizes. Do not fork or reimplement those functions here.

Because of that dynamic import, changing the **signature or name** of any of those four functions in `01` breaks `03` silently at runtime.

## Pedagogically load-bearing choices

These look like tunables but the lesson depends on them; changing them changes what the class sees:

- `sg=1` (skip-gram) and `min_count=10` — the "word not in vocabulary" message in menu 1 explicitly tells students the word appeared <10 times.
- `menu_cluster_words(skip=60)` — skips the 60 most frequent words (Thai function words) before k-Means, otherwise clusters are uninterpretable.
- `menu_antonym_trap` — the hardcoded pairs (แพง/ถูก, อร่อย/จืด, …) demonstrate that Word2Vec measures contextual similarity, not synonymy. This is the lesson's main limitation point.
- Document vectors are a plain mean, which discards word order — `01` documents this as a teaching point, not a bug to fix.

## Conventions

- Progress output goes through `log()` in `01` (timestamped, `flush=True`) so long runs are followable on a projector.
- All CSVs are written `encoding="utf-8-sig"` so Thai text opens correctly in Excel and Altair AI Studio.
- `seed=42` in `train_model` does **not** make training reproducible — gensim only guarantees determinism at `workers=1`, and the default is `workers=8`. Verified: two identical runs give `max|Δvector| ≈ 0.95` and different `most_similar` orderings. Neighbor lists printed in `แผนการสอน_Word2Vec.md` are therefore illustrative, not exact. k-Means in `02` (`random_state=42`) *is* deterministic for a given model.
