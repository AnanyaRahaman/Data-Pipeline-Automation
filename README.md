
## Overview

This project implements a repeatable data ingestion pipeline that extracts explicitly stated information from public web pages and normalizes it into a structured, machine-readable format.

The pipeline:

1. Reads an input CSV file containing company names and URLs.
2. Fetches each URL using Selenium (to support dynamic content).
3. Parses rendered HTML content.
4. Extracts structured signals such as:
   - Page title
   - H1 headings
   - HTML table rows
   - Email addresses
5. Normalizes extracted values into a flexible facts-style schema.
6. Outputs machine-readable JSONL files.

The goal of this implementation is clarity, traceability, extensibility, and production-style structure.

---

# Project Structure

```
seclink-data-discovery/
│
├── data/
│   └── companies.csv
│
├── out/
│   ├── facts.jsonl
│   └── run_summary.json
│
├── python/
│   └── extract.py
│
├── src/
│   ├── pipeline.ts
│   └── spawnPy.ts
│
├── package.json
├── README.md
```

---

# How to Run the Pipeline (Windows CMD)

## 1. Install Node Dependencies

From project root:

```
npm install
npm install cheerio
```

---

## 2. Create Python Virtual Environment

```
python -m venv .venv
.venv\Scripts\activate
pip install selenium
```

Make sure Google Chrome is installed on your system.

---

## 3. Run the Pipeline

From the project root directory:

```
npm run pipeline -- --input data/companies.csv --out out
```

---

# Output Files

After execution, the following files are generated:

- `out/facts.jsonl`
- `out/run_summary.json`

These represent structured, machine-readable outputs suitable for ingestion into analytics systems or databases.

---

# Output Schema

Each record in `facts.jsonl` follows a flexible facts-style schema:

- run_id
- company
- period_of_report
- document_type
- source_url
- fact_type
- fact_value
- confidence

This design allows:

- Easy traceability to the source
- Schema flexibility
- Future expansion without migrations
- Structured ingestion into databases

---

# What Data Was Extracted and Why

The pipeline extracts only explicitly stated information from the source pages.

Extracted elements:

- Page titles (high-level document metadata)
- H1 headings (primary content signals)
- Structured HTML table rows
- Explicit email addresses
- Error states during fetching or parsing

These were selected because they represent structured or semi-structured information that can be normalized reliably without inference.

No inferred, enriched, or AI-generated data was added beyond what was directly present on the source pages.

---

# Design Decisions and Tradeoffs

## Selenium for Fetching

Chosen to support JavaScript-rendered pages and dynamic investor relations content.

Tradeoff:
- Slower than simple HTTP requests
- More reliable for modern web pages

## JSONL Output Format

Chosen because:
- Easy to stream
- Database-friendly
- Scales well for large datasets
- Supports one-record-per-line processing

## Facts-Style Schema

Instead of rigid financial fields, a flexible fact-based schema was used.

Benefits:
- Works across heterogeneous documents
- Allows schema evolution
- Maintains traceability
- Simplifies ingestion into modern data platforms

---

# Known Limitations

- Sequential execution (no concurrency)
- No retry/backoff logic for failed requests
- No PDF parsing (HTML only)
- Limited financial field classification
- Fixed delay between requests

---

# Potential Improvements

- Add concurrency for performance
- Implement retry with exponential backoff
- Add PDF parsing support
- Add structured financial metric extraction
- Introduce configurable rate limiting
- Add logging framework
- Add automated testing

---

# Example Output

Example output files are included in the `out/` directory:

- facts.jsonl
- run_summary.json

These were generated from a full pipeline execution and demonstrate structured machine-readable results.

---
